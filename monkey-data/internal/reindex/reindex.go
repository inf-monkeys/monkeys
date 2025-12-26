package reindex

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/elastic/go-elasticsearch/v7"
	"github.com/jackc/pgx/v5/pgxpool"

	"monkey-data/internal/repo"
)

type Options struct {
	BatchSize   int
	DeleteIndex bool
	CreateIndex bool
	Refresh     bool
}

type Progress struct {
	AppID     string
	Total     int64
	Processed int64
	Done      bool
}

type Reindexer struct {
	pg *pgxpool.Pool
	es *elasticsearch.Client
}

func NewReindexer(pg *pgxpool.Pool, es *elasticsearch.Client) *Reindexer {
	return &Reindexer{pg: pg, es: es}
}

func (r *Reindexer) DiscoverAppIDs(ctx context.Context) ([]string, error) {
	if r == nil || r.pg == nil {
		return nil, errors.New("postgres not configured")
	}
	store := repo.NewPGStore(r.pg)
	return store.ListAppIDs(ctx)
}

func (r *Reindexer) Rebuild(ctx context.Context, appID string, opts Options, progress func(Progress)) error {
	if r == nil || r.pg == nil {
		return errors.New("postgres not configured")
	}
	if r.es == nil {
		return errors.New("elasticsearch not configured")
	}
	if err := repo.ValidateAppID(appID); err != nil {
		return err
	}
	opts = normalizeOptions(opts)

	index := fmt.Sprintf("%s_data_assets_v2", appID)
	if opts.DeleteIndex {
		if err := deleteIndex(ctx, r.es, index); err != nil {
			return err
		}
	}
	if opts.CreateIndex {
		if err := createIndex(ctx, r.es, index); err != nil {
			return err
		}
	}

	total, err := countAssets(ctx, r.pg, appID)
	if err != nil {
		return err
	}
	if progress != nil {
		progress(Progress{AppID: appID, Total: total, Processed: 0})
	}

	var lastUpdated int64
	var lastID string
	var processed int64

	for {
		assets, err := loadAssets(ctx, r.pg, appID, lastUpdated, lastID, opts.BatchSize)
		if err != nil {
			return err
		}
		if len(assets) == 0 {
			break
		}

		tagMap, err := loadTags(ctx, r.pg, appID, assets)
		if err != nil {
			return err
		}
		if err := bulkIndex(ctx, r.es, index, assets, tagMap); err != nil {
			return err
		}

		last := assets[len(assets)-1]
		lastUpdated = last.UpdatedTimestamp
		lastID = last.ID
		processed += int64(len(assets))
		if progress != nil {
			progress(Progress{AppID: appID, Total: total, Processed: processed})
		}
	}

	if opts.Refresh {
		if err := refreshIndex(ctx, r.es, index); err != nil {
			return err
		}
	}
	if progress != nil {
		progress(Progress{AppID: appID, Total: total, Processed: processed, Done: true})
	}
	return nil
}

type assetRow struct {
	ID               string
	TeamID           string
	Name             string
	AssetType        string
	Status           string
	CreatedTimestamp int64
	UpdatedTimestamp int64
}

func normalizeOptions(opts Options) Options {
	if opts.BatchSize <= 0 {
		opts.BatchSize = 500
	}
	if opts.BatchSize > 2000 {
		opts.BatchSize = 2000
	}
	return opts
}

func deleteIndex(ctx context.Context, client *elasticsearch.Client, index string) error {
	res, err := client.Indices.Delete(
		[]string{index},
		client.Indices.Delete.WithContext(ctx),
		client.Indices.Delete.WithIgnoreUnavailable(true),
	)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode >= http.StatusBadRequest && res.StatusCode != http.StatusNotFound {
		raw, _ := io.ReadAll(res.Body)
		return fmt.Errorf("delete index error: %s", string(raw))
	}
	return nil
}

func createIndex(ctx context.Context, client *elasticsearch.Client, index string) error {
	body := map[string]any{
		"mappings": map[string]any{
			"properties": map[string]any{
				"asset_id":          map[string]any{"type": "keyword"},
				"team_id":           map[string]any{"type": "keyword"},
				"name":              map[string]any{"type": "text"},
				"tag_ids":           map[string]any{"type": "keyword"},
				"asset_type":        map[string]any{"type": "keyword"},
				"status":            map[string]any{"type": "keyword"},
				"created_timestamp": map[string]any{"type": "long"},
				"updated_timestamp": map[string]any{"type": "long"},
			},
		},
	}
	raw, err := json.Marshal(body)
	if err != nil {
		return err
	}
	res, err := client.Indices.Create(
		index,
		client.Indices.Create.WithContext(ctx),
		client.Indices.Create.WithBody(bytes.NewReader(raw)),
	)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode >= http.StatusBadRequest {
		raw, _ := io.ReadAll(res.Body)
		return fmt.Errorf("create index error: %s", string(raw))
	}
	return nil
}

func refreshIndex(ctx context.Context, client *elasticsearch.Client, index string) error {
	res, err := client.Indices.Refresh(
		client.Indices.Refresh.WithContext(ctx),
		client.Indices.Refresh.WithIndex(index),
	)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode >= http.StatusBadRequest {
		raw, _ := io.ReadAll(res.Body)
		return fmt.Errorf("refresh index error: %s", string(raw))
	}
	return nil
}

func loadAssets(ctx context.Context, pg *pgxpool.Pool, appID string, lastUpdated int64, lastID string, limit int) ([]assetRow, error) {
	table, err := tableName(appID, "data_assets_v2")
	if err != nil {
		return nil, err
	}
	if limit <= 0 {
		limit = 500
	}

	args := make([]any, 0, 3)
	where := `WHERE is_deleted=false`
	if lastUpdated > 0 && lastID != "" {
		where += ` AND (updated_timestamp < $1 OR (updated_timestamp = $1 AND id < $2))`
		args = append(args, lastUpdated, lastID)
	}
	args = append(args, limit)

	query := fmt.Sprintf(
		`SELECT id, team_id, name, asset_type, status, created_timestamp, updated_timestamp FROM %s %s ORDER BY updated_timestamp DESC, id DESC LIMIT $%d`,
		table, where, len(args),
	)

	rows, err := pg.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]assetRow, 0, limit)
	for rows.Next() {
		var asset assetRow
		if err := rows.Scan(&asset.ID, &asset.TeamID, &asset.Name, &asset.AssetType, &asset.Status, &asset.CreatedTimestamp, &asset.UpdatedTimestamp); err != nil {
			return nil, err
		}
		items = append(items, asset)
	}
	if rows.Err() != nil {
		return nil, rows.Err()
	}
	return items, nil
}

func loadTags(ctx context.Context, pg *pgxpool.Pool, appID string, assets []assetRow) (map[string][]string, error) {
	if len(assets) == 0 {
		return map[string][]string{}, nil
	}
	relTable, err := tableName(appID, "data_asset_tag_relations_v2")
	if err != nil {
		return nil, err
	}
	ids := make([]string, 0, len(assets))
	for _, asset := range assets {
		ids = append(ids, asset.ID)
	}

	rows, err := pg.Query(ctx,
		fmt.Sprintf(`SELECT asset_id, array_agg(tag_id) FROM %s WHERE is_deleted=false AND asset_id = ANY($1) GROUP BY asset_id`, relTable),
		ids,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tagMap := make(map[string][]string, len(assets))
	for rows.Next() {
		var assetID string
		var tags []string
		if err := rows.Scan(&assetID, &tags); err != nil {
			return nil, err
		}
		tagMap[assetID] = tags
	}
	if rows.Err() != nil {
		return nil, rows.Err()
	}
	return tagMap, nil
}

func bulkIndex(ctx context.Context, client *elasticsearch.Client, index string, assets []assetRow, tagMap map[string][]string) error {
	var buf bytes.Buffer
	for _, asset := range assets {
		meta := map[string]any{"index": map[string]any{"_index": index, "_id": asset.ID}}
		line, err := json.Marshal(meta)
		if err != nil {
			return err
		}
		buf.Write(line)
		buf.WriteByte('\n')

		tagIDs := tagMap[asset.ID]
		doc := map[string]any{
			"asset_id":          asset.ID,
			"team_id":           asset.TeamID,
			"name":              asset.Name,
			"tag_ids":           tagIDs,
			"asset_type":        asset.AssetType,
			"status":            asset.Status,
			"created_timestamp": asset.CreatedTimestamp,
			"updated_timestamp": asset.UpdatedTimestamp,
		}
		body, err := json.Marshal(doc)
		if err != nil {
			return err
		}
		buf.Write(body)
		buf.WriteByte('\n')
	}

	res, err := client.Bulk(
		bytes.NewReader(buf.Bytes()),
		client.Bulk.WithContext(ctx),
	)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode >= http.StatusBadRequest {
		raw, _ := io.ReadAll(res.Body)
		return fmt.Errorf("bulk error: %s", string(raw))
	}

	var parsed bulkResponse
	if err := json.NewDecoder(res.Body).Decode(&parsed); err != nil {
		return err
	}
	if parsed.Errors {
		failed := 0
		for _, item := range parsed.Items {
			for _, result := range item {
				if result.Status >= 300 {
					failed++
				}
			}
		}
		return fmt.Errorf("bulk failed items: %d", failed)
	}
	return nil
}

type bulkResponse struct {
	Errors bool `json:"errors"`
	Items  []map[string]struct {
		Status int `json:"status"`
	} `json:"items"`
}

func countAssets(ctx context.Context, pg *pgxpool.Pool, appID string) (int64, error) {
	table, err := tableName(appID, "data_assets_v2")
	if err != nil {
		return 0, err
	}
	var total int64
	err = pg.QueryRow(ctx, fmt.Sprintf(`SELECT COUNT(1) FROM %s WHERE is_deleted=false`, table)).Scan(&total)
	return total, err
}

func tableName(appID, base string) (string, error) {
	if err := repo.ValidateAppID(strings.TrimSpace(appID)); err != nil {
		return "", err
	}
	return `"` + strings.TrimSpace(appID) + "_" + base + `"`, nil
}
