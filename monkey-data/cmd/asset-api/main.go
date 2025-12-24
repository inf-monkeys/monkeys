package main

import (
  "context"
  "log"
  "net/http"
  "time"

  "github.com/jackc/pgx/v5/pgxpool"

  "monkey-data/internal/config"
  "monkey-data/internal/httpapi"
  "monkey-data/internal/repo"
  "monkey-data/internal/search"
  "monkey-data/internal/service"
)

func main() {
  cfg := config.Load()
  if cfg.PostgresDSN == "" {
    log.Fatal("MONKEY_DATA_PG_DSN is required")
  }

  ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
  defer cancel()

  pool, err := pgxpool.New(ctx, cfg.PostgresDSN)
  if err != nil {
    log.Fatalf("pg connect error: %v", err)
  }
  store := repo.NewPGStore(pool)

  var searchClient search.Client
  if cfg.OpenSearchURL == "" {
    searchClient = search.NewNoopClient()
  } else {
    client, err := search.NewOpenSearchClient(search.OpenSearchConfig{
      URL:             cfg.OpenSearchURL,
      User:            cfg.OpenSearchUser,
      Pass:            cfg.OpenSearchPass,
      PageTokenSecret: cfg.PageTokenSecret,
    })
    if err != nil {
      log.Fatalf("opensearch init error: %v", err)
    }
    searchClient = client
  }

  svc := service.New(store, searchClient)
  srv := httpapi.NewServer(cfg, svc)

  log.Printf("monkey-data api listening on %s", cfg.HTTPAddr)
  if err := http.ListenAndServe(cfg.HTTPAddr, srv); err != nil {
    log.Fatalf("http server error: %v", err)
  }
}
