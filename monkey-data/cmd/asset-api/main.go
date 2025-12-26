package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/elastic/go-elasticsearch/v7"
	"github.com/jackc/pgx/v5/pgxpool"

	"monkey-data/internal/config"
	"monkey-data/internal/httpapi"
	"monkey-data/internal/reindex"
	"monkey-data/internal/repo"
	"monkey-data/internal/search"
	"monkey-data/internal/service"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config load error: %v", err)
	}
	if cfg.PostgresDSN == "" {
		log.Fatal("postgres dsn required (MONKEY_DATA_PG_DSN or config.yaml)")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, cfg.PostgresDSN)
	if err != nil {
		log.Fatalf("pg connect error: %v", err)
	}
	store := repo.NewPGStore(pool)

	var searchClient search.Client
	var esClient *elasticsearch.Client
	if cfg.ElasticsearchURL == "" {
		searchClient = search.NewNoopClient()
	} else {
		client, err := search.NewElasticsearchClient(search.ElasticsearchConfig{
			URL:             cfg.ElasticsearchURL,
			User:            cfg.ElasticsearchUser,
			Pass:            cfg.ElasticsearchPass,
			PageTokenSecret: cfg.PageTokenSecret,
		})
		if err != nil {
			log.Fatalf("elasticsearch init error: %v", err)
		}
		searchClient = client
		esClient, err = elasticsearch.NewClient(elasticsearch.Config{
			Addresses: []string{cfg.ElasticsearchURL},
			Username:  cfg.ElasticsearchUser,
			Password:  cfg.ElasticsearchPass,
		})
		if err != nil {
			log.Fatalf("elasticsearch init error: %v", err)
		}
	}

	svc := service.New(store, searchClient)
	reindexer := reindex.NewReindexer(pool, esClient)
	reindexMgr := reindex.NewManager(reindexer, 2)
	srv := httpapi.NewServer(cfg, svc, reindexMgr)

	log.Printf("monkey-data api listening on %s", cfg.HTTPAddr)
	if err := http.ListenAndServe(cfg.HTTPAddr, srv); err != nil {
		log.Fatalf("http server error: %v", err)
	}
}
