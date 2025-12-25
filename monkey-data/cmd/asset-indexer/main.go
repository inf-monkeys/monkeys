package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/elastic/go-elasticsearch/v7"
	"github.com/jackc/pgx/v5/pgxpool"

	"monkey-data/internal/config"
	"monkey-data/internal/indexer"
	"monkey-data/internal/repo"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config load error: %v", err)
	}
	if cfg.PostgresDSN == "" {
		log.Fatal("postgres dsn required (MONKEY_DATA_PG_DSN or config.yaml)")
	}
	if cfg.ElasticsearchURL == "" {
		log.Fatal("elasticsearch url required (MONKEY_DATA_ES_URL or config.yaml)")
	}
	pool, err := pgxpool.New(context.Background(), cfg.PostgresDSN)
	if err != nil {
		log.Fatalf("pg connect error: %v", err)
	}
	store := repo.NewPGStore(pool)

	esClient, err := elasticsearch.NewClient(elasticsearch.Config{
		Addresses: []string{cfg.ElasticsearchURL},
		Username:  cfg.ElasticsearchUser,
		Password:  cfg.ElasticsearchPass,
	})
	if err != nil {
		log.Fatalf("elasticsearch init error: %v", err)
	}

	appIDs, err := resolveWorkerAppIDs(context.Background(), store, cfg.WorkerAppID)
	if err != nil {
		log.Fatalf("worker app_id resolve error: %v", err)
	}

	baseWorkerID := cfg.WorkerID
	if baseWorkerID == "" {
		hostname, _ := os.Hostname()
		baseWorkerID = hostname + "-" + time.Now().Format("150405")
	}

	ctx := context.Background()
	errCh := make(chan error, len(appIDs))

	for _, appID := range appIDs {
		workerID := baseWorkerID + "-" + appID
		worker := indexer.NewWorker(store, esClient, indexer.Config{
			AppID:        appID,
			WorkerID:     workerID,
			BatchSize:    cfg.WorkerBatchSize,
			PollInterval: time.Duration(cfg.WorkerPollMS) * time.Millisecond,
			LockTimeout:  time.Duration(cfg.WorkerLockMS) * time.Millisecond,
		})

		log.Printf("monkey-data indexer running app_id=%s worker_id=%s", appID, workerID)
		go func(id string, w *indexer.Worker) {
			if runErr := w.Run(ctx); runErr != nil {
				errCh <- fmt.Errorf("app_id=%s: %w", id, runErr)
			}
		}(appID, worker)
	}

	if err := <-errCh; err != nil {
		log.Fatalf("indexer stopped: %v", err)
	}
}

func resolveWorkerAppIDs(ctx context.Context, store *repo.PGStore, raw string) ([]string, error) {
	envList := os.Getenv("MONKEY_DATA_WORKER_APP_IDS")
	appIDs := parseAppIDList(envList)
	if len(appIDs) == 0 {
		appIDs = parseAppIDList(raw)
	}
	if len(appIDs) > 0 {
		if err := validateAppIDs(appIDs); err != nil {
			return nil, err
		}
		return appIDs, nil
	}
	discovered, err := store.ListAppIDs(ctx)
	if err != nil {
		return nil, err
	}
	if len(discovered) == 0 {
		return nil, errors.New("no app_id found (set MONKEY_DATA_WORKER_APP_ID or create *_data_outbox_events_v2 tables)")
	}
	return discovered, nil
}

func parseAppIDList(raw string) []string {
	if strings.TrimSpace(raw) == "" {
		return nil
	}
	parts := strings.FieldsFunc(raw, func(r rune) bool {
		switch r {
		case ',', ';', ' ', '\n', '\r', '\t':
			return true
		default:
			return false
		}
	})
	seen := map[string]struct{}{}
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		if _, ok := seen[part]; ok {
			continue
		}
		seen[part] = struct{}{}
		out = append(out, part)
	}
	return out
}

func validateAppIDs(appIDs []string) error {
	for _, appID := range appIDs {
		if err := repo.ValidateAppID(appID); err != nil {
			return fmt.Errorf("invalid app_id %q: %w", appID, err)
		}
	}
	return nil
}
