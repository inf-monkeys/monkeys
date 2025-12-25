package indexer

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/elastic/go-elasticsearch/v7"
	"github.com/jackc/pgx/v5"

	"monkey-data/internal/model"
	"monkey-data/internal/repo"
)

type Config struct {
	AppID        string
	WorkerID     string
	BatchSize    int
	LockTimeout  time.Duration
	PollInterval time.Duration
}

type Worker struct {
	store  *repo.PGStore
	client *elasticsearch.Client
	cfg    Config
}

func NewWorker(store *repo.PGStore, client *elasticsearch.Client, cfg Config) *Worker {
	return &Worker{store: store, client: client, cfg: cfg}
}

func (w *Worker) Run(ctx context.Context) error {
	if w.store == nil || w.client == nil {
		return errors.New("indexer not configured")
	}
	if w.cfg.AppID == "" {
		return errors.New("worker app_id required")
	}
	if w.cfg.BatchSize <= 0 {
		w.cfg.BatchSize = 100
	}
	if w.cfg.LockTimeout <= 0 {
		w.cfg.LockTimeout = 60 * time.Second
	}
	if w.cfg.PollInterval <= 0 {
		w.cfg.PollInterval = 1 * time.Second
	}

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		events, err := w.store.LockOutboxBatch(ctx, w.cfg.AppID, w.cfg.WorkerID, w.cfg.BatchSize, w.cfg.LockTimeout)
		if err != nil {
			w.sleep(ctx)
			continue
		}
		if len(events) == 0 {
			w.sleep(ctx)
			continue
		}

		success, failed := w.processBatch(ctx, events)
		if len(success) > 0 {
			_ = w.store.MarkOutboxProcessed(ctx, w.cfg.AppID, success)
		}
		if len(failed) > 0 {
			_ = w.store.MarkOutboxFailed(ctx, w.cfg.AppID, w.cfg.WorkerID, failed)
		}
	}
}

func (w *Worker) sleep(ctx context.Context) {
	timer := time.NewTimer(w.cfg.PollInterval)
	defer timer.Stop()
	select {
	case <-ctx.Done():
	case <-timer.C:
	}
}

func (w *Worker) processBatch(ctx context.Context, events []repo.OutboxEvent) ([]int64, []int64) {
	actions := make([]bulkAction, 0, len(events))
	preFailed := make([]int64, 0)

	for _, ev := range events {
		switch ev.EventType {
		case "asset.upsert":
			doc, err := w.loadAssetDoc(ctx, ev.TeamID, ev.AggregateID)
			if err != nil {
				if errors.Is(err, pgx.ErrNoRows) {
					actions = append(actions, bulkAction{EventID: ev.EventID, Action: "delete", DocID: ev.AggregateID})
					continue
				}
				preFailed = append(preFailed, ev.EventID)
				continue
			}
			actions = append(actions, bulkAction{EventID: ev.EventID, Action: "index", DocID: ev.AggregateID, Doc: doc})
		case "asset.delete":
			actions = append(actions, bulkAction{EventID: ev.EventID, Action: "delete", DocID: ev.AggregateID})
		default:
			preFailed = append(preFailed, ev.EventID)
		}
	}

	if len(actions) == 0 {
		return nil, preFailed
	}

	failed, err := w.bulkApply(ctx, w.indexName(), actions)
	if err != nil {
		return nil, append(preFailed, failed...)
	}

	failedSet := map[int64]struct{}{}
	for _, id := range failed {
		failedSet[id] = struct{}{}
	}

	success := make([]int64, 0, len(actions))
	allFailed := make([]int64, 0, len(preFailed)+len(failed))
	allFailed = append(allFailed, preFailed...)
	for _, action := range actions {
		if _, ok := failedSet[action.EventID]; ok {
			allFailed = append(allFailed, action.EventID)
			continue
		}
		success = append(success, action.EventID)
	}
	return success, allFailed
}

func (w *Worker) loadAssetDoc(ctx context.Context, teamID, assetID string) (map[string]any, error) {
	asset, err := w.store.GetAsset(ctx, w.cfg.AppID, teamID, assetID)
	if err != nil {
		return nil, err
	}
	return mapAssetDoc(asset), nil
}

func (w *Worker) indexName() string {
	return fmt.Sprintf("%s_data_assets_v2", w.cfg.AppID)
}

type bulkAction struct {
	EventID int64
	Action  string
	DocID   string
	Doc     map[string]any
}

func (w *Worker) bulkApply(ctx context.Context, index string, actions []bulkAction) ([]int64, error) {
	var buf bytes.Buffer
	for _, action := range actions {
		meta := map[string]any{action.Action: map[string]any{"_index": index, "_id": action.DocID}}
		line, err := json.Marshal(meta)
		if err != nil {
			return nil, err
		}
		buf.Write(line)
		buf.WriteByte('\n')
		if action.Action == "index" {
			body, err := json.Marshal(action.Doc)
			if err != nil {
				return nil, err
			}
			buf.Write(body)
			buf.WriteByte('\n')
		}
	}

	res, err := w.client.Bulk(
		bytes.NewReader(buf.Bytes()),
		w.client.Bulk.WithContext(ctx),
	)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.StatusCode >= http.StatusBadRequest {
		raw, _ := io.ReadAll(res.Body)
		return nil, fmt.Errorf("elasticsearch bulk error: %s", string(raw))
	}

	var parsed bulkResponse
	if err := json.NewDecoder(res.Body).Decode(&parsed); err != nil {
		return nil, err
	}
	if len(parsed.Items) != len(actions) {
		return collectEventIDs(actions), errors.New("bulk response size mismatch")
	}

	failed := make([]int64, 0)
	for i, item := range parsed.Items {
		for actionName, result := range item {
			status := result.Status
			if status >= 300 {
				if actionName == "delete" && status == http.StatusNotFound {
					continue
				}
				failed = append(failed, actions[i].EventID)
			}
		}
	}
	return failed, nil
}

type bulkResponse struct {
	Errors bool `json:"errors"`
	Items  []map[string]struct {
		Status int `json:"status"`
	} `json:"items"`
}

func collectEventIDs(actions []bulkAction) []int64 {
	out := make([]int64, 0, len(actions))
	for _, action := range actions {
		out = append(out, action.EventID)
	}
	return out
}

func mapAssetDoc(asset model.Asset) map[string]any {
	return map[string]any{
		"asset_id":          asset.ID,
		"team_id":           asset.TeamID,
		"tag_ids":           asset.TagIDs,
		"asset_type":        asset.AssetType,
		"status":            asset.Status,
		"created_timestamp": asset.CreatedTimestamp,
		"updated_timestamp": asset.UpdatedTimestamp,
	}
}
