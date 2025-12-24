package main

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	opensearch "github.com/opensearch-project/opensearch-go/v2"

	"monkey-data/internal/config"
	"monkey-data/internal/indexer"
	"monkey-data/internal/repo"
)

func main() {
	cfg := config.Load()
	if cfg.PostgresDSN == "" {
		log.Fatal("MONKEY_DATA_PG_DSN is required")
	}
	if cfg.OpenSearchURL == "" {
		log.Fatal("MONKEY_DATA_OPENSEARCH_URL is required")
	}
	if cfg.WorkerAppID == "" {
		log.Fatal("MONKEY_DATA_WORKER_APP_ID is required")
	}

	pool, err := pgxpool.New(context.Background(), cfg.PostgresDSN)
	if err != nil {
		log.Fatalf("pg connect error: %v", err)
	}
	store := repo.NewPGStore(pool)

	osClient, err := opensearch.NewClient(opensearch.Config{
		Addresses: []string{cfg.OpenSearchURL},
		Username:  cfg.OpenSearchUser,
		Password:  cfg.OpenSearchPass,
	})
	if err != nil {
		log.Fatalf("opensearch init error: %v", err)
	}

	workerID := cfg.WorkerID
	if workerID == "" {
		hostname, _ := os.Hostname()
		workerID = hostname + "-" + time.Now().Format("150405")
	}

	worker := indexer.NewWorker(store, osClient, indexer.Config{
		AppID:        cfg.WorkerAppID,
		WorkerID:     workerID,
		BatchSize:    cfg.WorkerBatchSize,
		PollInterval: time.Duration(cfg.WorkerPollMS) * time.Millisecond,
		LockTimeout:  time.Duration(cfg.WorkerLockMS) * time.Millisecond,
	})

	log.Printf("monkey-data indexer running app_id=%s worker_id=%s", cfg.WorkerAppID, workerID)
	if err := worker.Run(context.Background()); err != nil {
		log.Fatalf("indexer stopped: %v", err)
	}
}
