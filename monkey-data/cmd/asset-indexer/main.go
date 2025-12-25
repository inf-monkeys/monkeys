package main

import (
	"context"
	"log"
	"os"
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
	if cfg.WorkerAppID == "" {
		log.Fatal("MONKEY_DATA_WORKER_APP_ID is required")
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

	workerID := cfg.WorkerID
	if workerID == "" {
		hostname, _ := os.Hostname()
		workerID = hostname + "-" + time.Now().Format("150405")
	}

	worker := indexer.NewWorker(store, esClient, indexer.Config{
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
