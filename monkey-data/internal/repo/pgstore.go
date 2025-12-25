package repo

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"monkey-data/internal/model"
)

type PGStore struct {
	pool *pgxpool.Pool
}

func NewPGStore(pool *pgxpool.Pool) *PGStore {
	return &PGStore{pool: pool}
}

func (s *PGStore) Ping(ctx context.Context) error {
	if s.pool == nil {
		return errors.New("pg pool not configured")
	}
	return s.pool.Ping(ctx)
}

func (s *PGStore) CreateAsset(ctx context.Context, appID, teamID string, asset model.Asset, tagIDs []string) (string, error) {
	if s.pool == nil {
		return "", errors.New("pg pool not configured")
	}
	assetsTable, err := tableName(appID, "data_assets_v2")
	if err != nil {
		return "", err
	}
	relTable, err := tableName(appID, "data_asset_tag_relations_v2")
	if err != nil {
		return "", err
	}

	if asset.ID == "" {
		asset.ID, err = newID()
		if err != nil {
			return "", err
		}
	}
	if teamID == "" {
		return "", errors.New("team_id required")
	}
	asset.TeamID = teamID
	now := nowMillis()
	if asset.CreatedTimestamp == 0 {
		asset.CreatedTimestamp = now
	}
	if asset.UpdatedTimestamp == 0 {
		asset.UpdatedTimestamp = now
	}
	if asset.Status == "" {
		asset.Status = "draft"
	}
	if asset.PrimaryContent == nil {
		return "", errors.New("primary_content required")
	}

	primaryContent, err := toJSONB(asset.PrimaryContent)
	if err != nil {
		return "", err
	}
	properties, err := toJSONB(asset.Properties)
	if err != nil {
		return "", err
	}
	files, err := toJSONB(asset.Files)
	if err != nil {
		return "", err
	}
	extra, err := toJSONB(asset.Extra)
	if err != nil {
		return "", err
	}

	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return "", err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback(ctx)
		}
	}()

	insertSQL := fmt.Sprintf(`
    INSERT INTO %s
      (id, team_id, creator_user_id, name, asset_type, primary_content, properties, files, media, thumbnail, keywords, status, extra, created_timestamp, updated_timestamp, is_deleted)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,false)
  `, assetsTable)

	_, err = tx.Exec(ctx, insertSQL,
		asset.ID,
		asset.TeamID,
		nullIfEmpty(asset.CreatorUserID),
		asset.Name,
		asset.AssetType,
		primaryContent,
		properties,
		files,
		nullIfEmpty(asset.Media),
		nullIfEmpty(asset.Thumbnail),
		nullIfEmpty(asset.Keywords),
		asset.Status,
		extra,
		asset.CreatedTimestamp,
		asset.UpdatedTimestamp,
	)
	if err != nil {
		return "", err
	}

	tagIDs = normalizeTagIDs(tagIDs)
	if len(tagIDs) > 0 {
		batch := &pgx.Batch{}
		for _, tagID := range tagIDs {
			relID, idErr := newID()
			if idErr != nil {
				err = idErr
				return "", err
			}
			batch.Queue(
				fmt.Sprintf(`INSERT INTO %s (id, team_id, asset_id, tag_id, created_timestamp, updated_timestamp, is_deleted) VALUES ($1,$2,$3,$4,$5,$6,false)`, relTable),
				relID, teamID, asset.ID, tagID, now, now,
			)
		}
		br := tx.SendBatch(ctx, batch)
		err = br.Close()
		if err != nil {
			return "", err
		}
	}

	if err := s.insertOutboxEvent(ctx, tx, appID, teamID, asset.ID, "asset.upsert"); err != nil {
		return "", err
	}

	err = tx.Commit(ctx)
	if err != nil {
		return "", err
	}
	return asset.ID, nil
}

func (s *PGStore) UpdateAsset(ctx context.Context, appID, teamID, assetID string, updates map[string]any) error {
	if s.pool == nil {
		return errors.New("pg pool not configured")
	}
	assetsTable, err := tableName(appID, "data_assets_v2")
	if err != nil {
		return err
	}
	if assetID == "" {
		return errors.New("asset_id required")
	}
	if teamID == "" {
		return errors.New("team_id required")
	}
	if len(updates) == 0 {
		return errors.New("no updates")
	}

	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback(ctx)
		}
	}()

	setParts := make([]string, 0, len(updates)+1)
	args := make([]any, 0, len(updates)+3)
	idx := 1
	for col, val := range updates {
		if isJSONColumn(col) {
			jsonb, err := toJSONB(val)
			if err != nil {
				return err
			}
			val = jsonb
		}
		setParts = append(setParts, fmt.Sprintf(`"%s"=$%d`, col, idx))
		args = append(args, val)
		idx++
	}
	setParts = append(setParts, fmt.Sprintf(`"updated_timestamp"=$%d`, idx))
	args = append(args, nowMillis())
	idx++
	args = append(args, teamID, assetID)

	query := fmt.Sprintf(`UPDATE %s SET %s WHERE "team_id"=$%d AND "id"=$%d AND "is_deleted"=false`, assetsTable, strings.Join(setParts, ", "), idx, idx+1)
	ct, err := tx.Exec(ctx, query, args...)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return errors.New("asset not found")
	}
	if err := s.insertOutboxEvent(ctx, tx, appID, teamID, assetID, "asset.upsert"); err != nil {
		return err
	}
	err = tx.Commit(ctx)
	if err != nil {
		return err
	}
	return nil
}

func (s *PGStore) DeleteAsset(ctx context.Context, appID, teamID, assetID string) error {
	if s.pool == nil {
		return errors.New("pg pool not configured")
	}
	assetsTable, err := tableName(appID, "data_assets_v2")
	if err != nil {
		return err
	}
	if assetID == "" {
		return errors.New("asset_id required")
	}
	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback(ctx)
		}
	}()

	ct, err := tx.Exec(ctx,
		fmt.Sprintf(`UPDATE %s SET "is_deleted"=true, "updated_timestamp"=$1 WHERE "team_id"=$2 AND "id"=$3 AND "is_deleted"=false`, assetsTable),
		nowMillis(), teamID, assetID,
	)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return errors.New("asset not found")
	}
	if err := s.insertOutboxEvent(ctx, tx, appID, teamID, assetID, "asset.delete"); err != nil {
		return err
	}
	err = tx.Commit(ctx)
	if err != nil {
		return err
	}
	return nil
}

func (s *PGStore) GetAsset(ctx context.Context, appID, teamID, assetID string) (model.Asset, error) {
	if s.pool == nil {
		return model.Asset{}, errors.New("pg pool not configured")
	}
	assetsTable, err := tableName(appID, "data_assets_v2")
	if err != nil {
		return model.Asset{}, err
	}
	relTable, err := tableName(appID, "data_asset_tag_relations_v2")
	if err != nil {
		return model.Asset{}, err
	}
	if assetID == "" {
		return model.Asset{}, errors.New("asset_id required")
	}

	row := s.pool.QueryRow(ctx,
		fmt.Sprintf(`SELECT id, team_id, creator_user_id, name, asset_type, primary_content, properties, files, media, thumbnail, keywords, status, extra, created_timestamp, updated_timestamp FROM %s WHERE team_id=$1 AND id=$2 AND is_deleted=false`, assetsTable),
		teamID, assetID,
	)

	var asset model.Asset
	var primaryContent, properties, files, extra []byte
	var creatorUserID, media, thumbnail, keywords pgtype.Text
	err = row.Scan(
		&asset.ID,
		&asset.TeamID,
		&creatorUserID,
		&asset.Name,
		&asset.AssetType,
		&primaryContent,
		&properties,
		&files,
		&media,
		&thumbnail,
		&keywords,
		&asset.Status,
		&extra,
		&asset.CreatedTimestamp,
		&asset.UpdatedTimestamp,
	)
	if err != nil {
		return model.Asset{}, err
	}

	asset.CreatorUserID = textOrEmpty(creatorUserID)
	asset.Media = textOrEmpty(media)
	asset.Thumbnail = textOrEmpty(thumbnail)
	asset.Keywords = textOrEmpty(keywords)

	_ = json.Unmarshal(primaryContent, &asset.PrimaryContent)
	_ = json.Unmarshal(properties, &asset.Properties)
	_ = json.Unmarshal(files, &asset.Files)
	_ = json.Unmarshal(extra, &asset.Extra)

	rows, err := s.pool.Query(ctx, fmt.Sprintf(`SELECT tag_id FROM %s WHERE team_id=$1 AND asset_id=$2 AND is_deleted=false`, relTable), teamID, assetID)
	if err != nil {
		return model.Asset{}, err
	}
	defer rows.Close()
	for rows.Next() {
		var tagID string
		if scanErr := rows.Scan(&tagID); scanErr != nil {
			return model.Asset{}, scanErr
		}
		asset.TagIDs = append(asset.TagIDs, tagID)
	}
	if rows.Err() != nil {
		return model.Asset{}, rows.Err()
	}

	return asset, nil
}

func (s *PGStore) ReplaceAssetTags(ctx context.Context, appID, teamID, assetID string, tagIDs []string) error {
	if s.pool == nil {
		return errors.New("pg pool not configured")
	}
	assetsTable, err := tableName(appID, "data_assets_v2")
	if err != nil {
		return err
	}
	relTable, err := tableName(appID, "data_asset_tag_relations_v2")
	if err != nil {
		return err
	}
	if assetID == "" {
		return errors.New("asset_id required")
	}

	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback(ctx)
		}
	}()

	now := nowMillis()
	_, err = tx.Exec(ctx,
		fmt.Sprintf(`UPDATE %s SET "is_deleted"=true, "updated_timestamp"=$1 WHERE "team_id"=$2 AND "asset_id"=$3 AND "is_deleted"=false`, relTable),
		now, teamID, assetID,
	)
	if err != nil {
		return err
	}

	tagIDs = normalizeTagIDs(tagIDs)
	if len(tagIDs) > 0 {
		batch := &pgx.Batch{}
		for _, tagID := range tagIDs {
			relID, idErr := newID()
			if idErr != nil {
				err = idErr
				return err
			}
			batch.Queue(
				fmt.Sprintf(`INSERT INTO %s (id, team_id, asset_id, tag_id, created_timestamp, updated_timestamp, is_deleted) VALUES ($1,$2,$3,$4,$5,$6,false)`, relTable),
				relID, teamID, assetID, tagID, now, now,
			)
		}
		br := tx.SendBatch(ctx, batch)
		err = br.Close()
		if err != nil {
			return err
		}
	}

	_, err = tx.Exec(ctx,
		fmt.Sprintf(`UPDATE %s SET "updated_timestamp"=$1 WHERE "team_id"=$2 AND "id"=$3 AND "is_deleted"=false`, assetsTable),
		now, teamID, assetID,
	)
	if err != nil {
		return err
	}

	if err := s.insertOutboxEvent(ctx, tx, appID, teamID, assetID, "asset.upsert"); err != nil {
		return err
	}

	err = tx.Commit(ctx)
	if err != nil {
		return err
	}
	return nil
}

func (s *PGStore) CreateTag(ctx context.Context, appID, teamID string, tag model.Tag) (string, error) {
	if s.pool == nil {
		return "", errors.New("pg pool not configured")
	}
	tagsTable, err := tableName(appID, "data_tags_v2")
	if err != nil {
		return "", err
	}
	if tag.ID == "" {
		tag.ID, err = newID()
		if err != nil {
			return "", err
		}
	}
	if teamID == "" {
		return "", errors.New("team_id required")
	}
	if tag.Name == "" {
		return "", errors.New("name required")
	}
	tag.TeamID = teamID
	now := nowMillis()
	if tag.CreatedTimestamp == 0 {
		tag.CreatedTimestamp = now
	}
	if tag.UpdatedTimestamp == 0 {
		tag.UpdatedTimestamp = now
	}
	if tag.NameNorm == "" {
		tag.NameNorm = normalizeName(tag.Name)
	}
	extra, err := toJSONB(tag.Extra)
	if err != nil {
		return "", err
	}

	_, err = s.pool.Exec(ctx, fmt.Sprintf(`
    INSERT INTO %s
      (id, team_id, name, name_norm, color, extra, created_timestamp, updated_timestamp, is_deleted)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,false)
  `, tagsTable),
		tag.ID, tag.TeamID, tag.Name, tag.NameNorm, nullIfEmpty(tag.Color), extra, tag.CreatedTimestamp, tag.UpdatedTimestamp,
	)
	if err != nil {
		return "", err
	}
	return tag.ID, nil
}

func (s *PGStore) ListTags(ctx context.Context, appID, teamID, keyword string, limit int, pageToken string) ([]model.Tag, string, error) {
	if s.pool == nil {
		return nil, "", errors.New("pg pool not configured")
	}
	tagsTable, err := tableName(appID, "data_tags_v2")
	if err != nil {
		return nil, "", err
	}
	if limit <= 0 {
		limit = 20
	}
	if limit > 200 {
		limit = 200
	}

	var lastUpdated int64
	var lastID string
	if pageToken != "" {
		if err := decodeListToken(pageToken, &lastUpdated, &lastID); err != nil {
			return nil, "", err
		}
	}

	args := []any{teamID}
	where := []string{`team_id=$1`, `is_deleted=false`}
	idx := 2
	if keyword != "" {
		where = append(where, fmt.Sprintf(`(name ILIKE $%d OR name_norm ILIKE $%d)`, idx, idx))
		args = append(args, "%"+keyword+"%")
		idx++
	}
	if lastUpdated > 0 && lastID != "" {
		where = append(where, fmt.Sprintf(`(updated_timestamp < $%d OR (updated_timestamp = $%d AND id < $%d))`, idx, idx, idx+1))
		args = append(args, lastUpdated, lastID)
		idx += 2
	}
	args = append(args, limit)

	query := fmt.Sprintf(`SELECT id, team_id, name, name_norm, color, extra, created_timestamp, updated_timestamp FROM %s WHERE %s ORDER BY updated_timestamp DESC, id DESC LIMIT $%d`, tagsTable, strings.Join(where, " AND "), idx)
	rows, err := s.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, "", err
	}
	defer rows.Close()

	items := []model.Tag{}
	for rows.Next() {
		var tag model.Tag
		var extra []byte
		var color pgtype.Text
		if err := rows.Scan(&tag.ID, &tag.TeamID, &tag.Name, &tag.NameNorm, &color, &extra, &tag.CreatedTimestamp, &tag.UpdatedTimestamp); err != nil {
			return nil, "", err
		}
		tag.Color = textOrEmpty(color)
		_ = json.Unmarshal(extra, &tag.Extra)
		items = append(items, tag)
	}
	if rows.Err() != nil {
		return nil, "", rows.Err()
	}

	nextToken := ""
	if len(items) == limit {
		last := items[len(items)-1]
		nextToken = encodeListToken(last.UpdatedTimestamp, last.ID)
	}
	return items, nextToken, nil
}

func (s *PGStore) DeleteTag(ctx context.Context, appID, teamID, tagID string) error {
	if s.pool == nil {
		return errors.New("pg pool not configured")
	}
	tagsTable, err := tableName(appID, "data_tags_v2")
	if err != nil {
		return err
	}
	ct, err := s.pool.Exec(ctx,
		fmt.Sprintf(`UPDATE %s SET "is_deleted"=true, "updated_timestamp"=$1 WHERE "team_id"=$2 AND "id"=$3 AND "is_deleted"=false`, tagsTable),
		nowMillis(), teamID, tagID,
	)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return errors.New("tag not found")
	}
	return nil
}

func (s *PGStore) CreateView(ctx context.Context, appID, teamID string, view model.View) (string, error) {
	if s.pool == nil {
		return "", errors.New("pg pool not configured")
	}
	viewsTable, err := tableName(appID, "data_views_v2")
	if err != nil {
		return "", err
	}
	if view.ID == "" {
		view.ID, err = newID()
		if err != nil {
			return "", err
		}
	}
	now := nowMillis()
	if view.CreatedTimestamp == 0 {
		view.CreatedTimestamp = now
	}
	if view.UpdatedTimestamp == 0 {
		view.UpdatedTimestamp = now
	}
	if view.Name == "" {
		return "", errors.New("name required")
	}
	displayConfig, err := toJSONB(view.DisplayConfig)
	if err != nil {
		return "", err
	}
	view.TeamID = teamID

	_, err = s.pool.Exec(ctx, fmt.Sprintf(`
    INSERT INTO %s
      (id, team_id, name, description, icon_url, parent_id, path, level, sort, display_config, created_timestamp, updated_timestamp, is_deleted)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,false)
  `, viewsTable),
		view.ID,
		nullIfEmpty(view.TeamID),
		view.Name,
		nullIfEmpty(view.Description),
		nullIfEmpty(view.IconURL),
		nullIfEmpty(view.ParentID),
		view.Path,
		view.Level,
		view.Sort,
		displayConfig,
		view.CreatedTimestamp,
		view.UpdatedTimestamp,
	)
	if err != nil {
		return "", err
	}
	return view.ID, nil
}

func (s *PGStore) UpdateView(ctx context.Context, appID, teamID, viewID string, updates map[string]any) error {
	if s.pool == nil {
		return errors.New("pg pool not configured")
	}
	viewsTable, err := tableName(appID, "data_views_v2")
	if err != nil {
		return err
	}
	if viewID == "" {
		return errors.New("view_id required")
	}
	if len(updates) == 0 {
		return errors.New("no updates")
	}

	setParts := make([]string, 0, len(updates)+1)
	args := make([]any, 0, len(updates)+3)
	idx := 1
	for col, val := range updates {
		if col == "display_config" {
			jsonb, err := toJSONB(val)
			if err != nil {
				return err
			}
			val = jsonb
		}
		setParts = append(setParts, fmt.Sprintf(`"%s"=$%d`, col, idx))
		args = append(args, val)
		idx++
	}
	setParts = append(setParts, fmt.Sprintf(`"updated_timestamp"=$%d`, idx))
	args = append(args, nowMillis())
	idx++
	args = append(args, teamID, viewID)

	query := fmt.Sprintf(`UPDATE %s SET %s WHERE ("team_id"=$%d OR "team_id" IS NULL) AND "id"=$%d AND "is_deleted"=false`, viewsTable, strings.Join(setParts, ", "), idx, idx+1)
	ct, err := s.pool.Exec(ctx, query, args...)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return errors.New("view not found")
	}
	return nil
}

func (s *PGStore) DeleteView(ctx context.Context, appID, teamID, viewID string) error {
	if s.pool == nil {
		return errors.New("pg pool not configured")
	}
	viewsTable, err := tableName(appID, "data_views_v2")
	if err != nil {
		return err
	}
	ct, err := s.pool.Exec(ctx,
		fmt.Sprintf(`UPDATE %s SET "is_deleted"=true, "updated_timestamp"=$1 WHERE ("team_id"=$2 OR "team_id" IS NULL) AND "id"=$3 AND "is_deleted"=false`, viewsTable),
		nowMillis(), teamID, viewID,
	)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return errors.New("view not found")
	}
	return nil
}

func (s *PGStore) GetViewTree(ctx context.Context, appID, teamID string) ([]model.View, error) {
	if s.pool == nil {
		return nil, errors.New("pg pool not configured")
	}
	viewsTable, err := tableName(appID, "data_views_v2")
	if err != nil {
		return nil, err
	}
	rows, err := s.pool.Query(ctx,
		fmt.Sprintf(`SELECT id, team_id, name, description, icon_url, parent_id, path, level, sort, display_config, created_timestamp, updated_timestamp FROM %s WHERE (team_id=$1 OR team_id IS NULL) AND is_deleted=false ORDER BY path ASC, sort ASC`, viewsTable),
		teamID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []model.View{}
	for rows.Next() {
		var view model.View
		var displayConfig []byte
		var teamIDText, description, iconURL, parentID pgtype.Text
		if err := rows.Scan(&view.ID, &teamIDText, &view.Name, &description, &iconURL, &parentID, &view.Path, &view.Level, &view.Sort, &displayConfig, &view.CreatedTimestamp, &view.UpdatedTimestamp); err != nil {
			return nil, err
		}
		view.TeamID = textOrEmpty(teamIDText)
		view.Description = textOrEmpty(description)
		view.IconURL = textOrEmpty(iconURL)
		view.ParentID = textOrEmpty(parentID)
		_ = json.Unmarshal(displayConfig, &view.DisplayConfig)
		items = append(items, view)
	}
	if rows.Err() != nil {
		return nil, rows.Err()
	}
	return items, nil
}

func (s *PGStore) ReplaceViewTags(ctx context.Context, appID, teamID, viewID string, tagIDs []string) error {
	if s.pool == nil {
		return errors.New("pg pool not configured")
	}
	relTable, err := tableName(appID, "data_view_tag_relations_v2")
	if err != nil {
		return err
	}
	if viewID == "" {
		return errors.New("view_id required")
	}

	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback(ctx)
		}
	}()

	now := nowMillis()
	_, err = tx.Exec(ctx,
		fmt.Sprintf(`UPDATE %s SET "is_deleted"=true, "updated_timestamp"=$1 WHERE "team_id"=$2 AND "view_id"=$3 AND "is_deleted"=false`, relTable),
		now, teamID, viewID,
	)
	if err != nil {
		return err
	}

	tagIDs = normalizeTagIDs(tagIDs)
	if len(tagIDs) > 0 {
		batch := &pgx.Batch{}
		for _, tagID := range tagIDs {
			relID, idErr := newID()
			if idErr != nil {
				err = idErr
				return err
			}
			batch.Queue(
				fmt.Sprintf(`INSERT INTO %s (id, team_id, view_id, tag_id, created_timestamp, updated_timestamp, is_deleted) VALUES ($1,$2,$3,$4,$5,$6,false)`, relTable),
				relID, teamID, viewID, tagID, now, now,
			)
		}
		br := tx.SendBatch(ctx, batch)
		err = br.Close()
		if err != nil {
			return err
		}
	}

	err = tx.Commit(ctx)
	if err != nil {
		return err
	}
	return nil
}

func (s *PGStore) GetViewTagGroups(ctx context.Context, appID, teamID, viewID string) ([][]string, error) {
	if s.pool == nil {
		return nil, errors.New("pg pool not configured")
	}
	viewsTable, err := tableName(appID, "data_views_v2")
	if err != nil {
		return nil, err
	}
	relTable, err := tableName(appID, "data_view_tag_relations_v2")
	if err != nil {
		return nil, err
	}
	if viewID == "" {
		return [][]string{}, nil
	}

	var viewPath string
	err = s.pool.QueryRow(ctx,
		fmt.Sprintf(`SELECT path FROM %s WHERE id=$1 AND (team_id=$2 OR team_id IS NULL) AND is_deleted=false`, viewsTable),
		viewID, teamID,
	).Scan(&viewPath)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return [][]string{}, nil
		}
		return nil, err
	}

	rows, err := s.pool.Query(ctx,
		fmt.Sprintf(`SELECT id FROM %s WHERE (team_id=$1 OR team_id IS NULL) AND is_deleted=false AND path LIKE $2`, viewsTable),
		teamID, viewPath+"%",
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	viewIDs := []string{}
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		viewIDs = append(viewIDs, id)
	}
	if rows.Err() != nil {
		return nil, rows.Err()
	}
	if len(viewIDs) == 0 {
		return [][]string{}, nil
	}

	tagRows, err := s.pool.Query(ctx,
		fmt.Sprintf(`SELECT view_id, array_agg(tag_id) FROM %s WHERE team_id=$1 AND view_id = ANY($2) AND is_deleted=false GROUP BY view_id`, relTable),
		teamID, viewIDs,
	)
	if err != nil {
		return nil, err
	}
	defer tagRows.Close()

	groups := [][]string{}
	for tagRows.Next() {
		var id string
		var tags []string
		if err := tagRows.Scan(&id, &tags); err != nil {
			return nil, err
		}
		if len(tags) > 0 {
			groups = append(groups, tags)
		}
	}
	if tagRows.Err() != nil {
		return nil, tagRows.Err()
	}
	return groups, nil
}

func nowMillis() int64 {
	return time.Now().UnixNano() / int64(time.Millisecond)
}

func toJSONB(v any) ([]byte, error) {
	if v == nil {
		return nil, nil
	}
	switch val := v.(type) {
	case []byte:
		return val, nil
	case json.RawMessage:
		return val, nil
	default:
		b, err := json.Marshal(v)
		if err != nil {
			return nil, err
		}
		return b, nil
	}
}

func normalizeTagIDs(tagIDs []string) []string {
	out := make([]string, 0, len(tagIDs))
	seen := map[string]struct{}{}
	for _, tagID := range tagIDs {
		tagID = strings.TrimSpace(tagID)
		if tagID == "" {
			continue
		}
		if _, ok := seen[tagID]; ok {
			continue
		}
		seen[tagID] = struct{}{}
		out = append(out, tagID)
	}
	return out
}

func normalizeName(name string) string {
	return strings.ToLower(strings.TrimSpace(name))
}

func nullIfEmpty(s string) any {
	if strings.TrimSpace(s) == "" {
		return nil
	}
	return s
}

func textOrEmpty(t pgtype.Text) string {
	if !t.Valid {
		return ""
	}
	return t.String
}

func isJSONColumn(col string) bool {
	switch col {
	case "primary_content", "properties", "files", "extra":
		return true
	default:
		return false
	}
}

type tagListToken struct {
	Updated int64  `json:"u"`
	ID      string `json:"i"`
}

func encodeListToken(updated int64, id string) string {
	payload, _ := json.Marshal(tagListToken{Updated: updated, ID: id})
	return base64.RawURLEncoding.EncodeToString(payload)
}

func decodeListToken(token string, updated *int64, id *string) error {
	raw, err := base64.RawURLEncoding.DecodeString(token)
	if err != nil {
		return errors.New("invalid page_token")
	}
	var payload tagListToken
	if err := json.Unmarshal(raw, &payload); err != nil {
		return errors.New("invalid page_token")
	}
	*updated = payload.Updated
	*id = payload.ID
	return nil
}
