package main

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"log"
	"os"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/elastic/go-elasticsearch/v7"
	"github.com/jackc/pgx/v5/pgxpool"

	"monkey-data/internal/config"
	"monkey-data/internal/repo"
)

type options struct {
	AppIDs      string
	All         bool
	BatchSize   int
	DeleteIndex bool
	CreateIndex bool
	Refresh     bool
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

func main() {
	var opts options
	flag.StringVar(&opts.AppIDs, "app-ids", "", "comma-separated app_id list; empty means prompt from scanned list")
	flag.BoolVar(&opts.All, "all", false, "reindex all discovered app_id without prompt")
	flag.IntVar(&opts.BatchSize, "batch-size", 500, "batch size for asset scan")
	flag.BoolVar(&opts.DeleteIndex, "delete-index", true, "delete index before rebuild")
	flag.BoolVar(&opts.CreateIndex, "create-index", true, "create index before rebuild")
	flag.BoolVar(&opts.Refresh, "refresh", false, "refresh index after rebuild")
	flag.Parse()

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config load error: %v", err)
	}
	if strings.TrimSpace(cfg.PostgresDSN) == "" {
		log.Fatal("postgres dsn required")
	}
	if strings.TrimSpace(cfg.ElasticsearchURL) == "" {
		log.Fatal("elasticsearch url required")
	}

	ctx := context.Background()
	pg, err := pgxpool.New(ctx, cfg.PostgresDSN)
	if err != nil {
		log.Fatalf("pg connect error: %v", err)
	}
	defer pg.Close()
	store := repo.NewPGStore(pg)

	appIDs, err := resolveAppIDs(ctx, store, opts)
	if err != nil {
		log.Fatalf("resolve app_id failed: %v", err)
	}
	if len(appIDs) == 0 {
		log.Fatal("no app_id selected")
	}

	if opts.AppIDs == "" && !opts.All {
		if !confirmSelection(appIDs) {
			log.Fatal("cancelled")
		}
	}

	es, err := elasticsearch.NewClient(elasticsearch.Config{
		Addresses: []string{cfg.ElasticsearchURL},
		Username:  cfg.ElasticsearchUser,
		Password:  cfg.ElasticsearchPass,
	})
	if err != nil {
		log.Fatalf("elasticsearch init error: %v", err)
	}

	for _, appID := range appIDs {
		if err := rebuildApp(ctx, pg, es, appID, opts); err != nil {
			log.Printf("reindex failed app_id=%s err=%v", appID, err)
			continue
		}
	}
}

func resolveAppIDs(ctx context.Context, store *repo.PGStore, opts options) ([]string, error) {
	if strings.TrimSpace(opts.AppIDs) != "" {
		return parseAppIDs(opts.AppIDs)
	}
	list, err := store.ListAppIDs(ctx)
	if err != nil {
		return nil, err
	}
	if len(list) == 0 {
		return nil, errors.New("no app_id discovered from outbox tables")
	}
	if opts.All {
		return list, nil
	}
	return promptSelect(list)
}

func parseAppIDs(raw string) ([]string, error) {
	items := splitTokens(raw)
	if len(items) == 0 {
		return nil, errors.New("empty app_id list")
	}
	seen := map[string]struct{}{}
	out := make([]string, 0, len(items))
	for _, item := range items {
		if err := repo.ValidateAppID(item); err != nil {
			return nil, err
		}
		if _, ok := seen[item]; ok {
			continue
		}
		seen[item] = struct{}{}
		out = append(out, item)
	}
	sort.Strings(out)
	return out, nil
}

func promptSelect(appIDs []string) ([]string, error) {
	log.Println("发现以下 app_id：")
	for i, id := range appIDs {
		log.Printf("  %d) %s", i+1, id)
	}
	log.Println("请输入要重建的 app_id（逗号分隔），或输入 all：")

	reader := bufio.NewReader(os.Stdin)
	line, err := reader.ReadString('\n')
	if err != nil && !errors.Is(err, io.EOF) {
		return nil, err
	}
	line = strings.TrimSpace(line)
	if line == "" {
		return nil, errors.New("empty selection")
	}
	if strings.EqualFold(line, "all") || line == "*" {
		return appIDs, nil
	}

	tokens := splitTokens(line)
	if len(tokens) == 0 {
		return nil, errors.New("empty selection")
	}

	out := make([]string, 0, len(tokens))
	seen := map[string]struct{}{}
	for _, token := range tokens {
		if idx, err := strconv.Atoi(token); err == nil {
			if idx <= 0 || idx > len(appIDs) {
				return nil, fmt.Errorf("invalid index: %d", idx)
			}
			val := appIDs[idx-1]
			if _, ok := seen[val]; ok {
				continue
			}
			seen[val] = struct{}{}
			out = append(out, val)
			continue
		}
		if err := repo.ValidateAppID(token); err != nil {
			return nil, err
		}
		if !contains(appIDs, token) {
			return nil, fmt.Errorf("unknown app_id: %s", token)
		}
		if _, ok := seen[token]; ok {
			continue
		}
		seen[token] = struct{}{}
		out = append(out, token)
	}
	sort.Strings(out)
	return out, nil
}

func confirmSelection(appIDs []string) bool {
	log.Printf("将重建以下 app_id：%s", strings.Join(appIDs, ", "))
	log.Print("确认删除并重建索引？输入 y 继续：")
	reader := bufio.NewReader(os.Stdin)
	line, _ := reader.ReadString('\n')
	line = strings.TrimSpace(line)
	return strings.EqualFold(line, "y") || strings.EqualFold(line, "yes")
}

func rebuildApp(ctx context.Context, pg *pgxpool.Pool, es *elasticsearch.Client, appID string, opts options) error {
	if err := repo.ValidateAppID(appID); err != nil {
		return err
	}
	index := fmt.Sprintf("%s_data_assets_v2", appID)

	if opts.DeleteIndex {
		if err := deleteIndex(ctx, es, index); err != nil {
			return err
		}
	}
	if opts.CreateIndex {
		if err := createIndex(ctx, es, index); err != nil {
			return err
		}
	}

	total, err := countAssets(ctx, pg, appID)
	if err != nil {
		return err
	}
	log.Printf("reindex start app_id=%s total=%d", appID, total)

	var lastUpdated int64
	var lastID string
	var processed int64
	start := time.Now()

	for {
		assets, err := loadAssets(ctx, pg, appID, lastUpdated, lastID, opts.BatchSize)
		if err != nil {
			return err
		}
		if len(assets) == 0 {
			break
		}

		tagMap, err := loadTags(ctx, pg, appID, assets)
		if err != nil {
			return err
		}
		if err := bulkIndex(ctx, es, index, assets, tagMap); err != nil {
			return err
		}

		last := assets[len(assets)-1]
		lastUpdated = last.UpdatedTimestamp
		lastID = last.ID
		processed += int64(len(assets))

		if processed%2000 == 0 || len(assets) < opts.BatchSize {
			elapsed := time.Since(start).Seconds()
			rate := float64(processed) / maxFloat(elapsed, 1)
			log.Printf("progress app_id=%s processed=%d/%d rate=%.1f/s", appID, processed, total, rate)
		}
	}

	if opts.Refresh {
		if err := refreshIndex(ctx, es, index); err != nil {
			return err
		}
	}
	log.Printf("reindex done app_id=%s processed=%d", appID, processed)
	return nil
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
	if res.StatusCode >= 400 && res.StatusCode != 404 {
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
	if res.StatusCode >= 400 {
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
	if res.StatusCode >= 400 {
		raw, _ := io.ReadAll(res.Body)
		return fmt.Errorf("refresh index error: %s", string(raw))
	}
	return nil
}

func loadAssets(ctx context.Context, pg *pgxpool.Pool, appID string, lastUpdated int64, lastID string, limit int) ([]assetRow, error) {
	if limit <= 0 {
		limit = 200
	}
	table, err := tableName(appID, "data_assets_v2")
	if err != nil {
		return nil, err
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
	if res.StatusCode >= 400 {
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
	appID = strings.TrimSpace(appID)
	if err := repo.ValidateAppID(appID); err != nil {
		return "", err
	}
	return `"` + appID + "_" + base + `"`, nil
}

func splitTokens(raw string) []string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil
	}
	raw = strings.ReplaceAll(raw, "\n", " ")
	raw = strings.ReplaceAll(raw, "\t", " ")
	segs := strings.FieldsFunc(raw, func(r rune) bool {
		return r == ',' || r == ' ' || r == ';'
	})
	out := make([]string, 0, len(segs))
	for _, seg := range segs {
		seg = strings.TrimSpace(seg)
		if seg == "" {
			continue
		}
		out = append(out, seg)
	}
	return out
}

func contains(items []string, target string) bool {
	for _, item := range items {
		if item == target {
			return true
		}
	}
	return false
}

func maxFloat(a, b float64) float64 {
	if a > b {
		return a
	}
	return b
}
