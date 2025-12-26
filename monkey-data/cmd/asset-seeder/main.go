package main

import (
	"bytes"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/elastic/go-elasticsearch/v7"
	"github.com/jackc/pgx/v5/pgxpool"

	"monkey-data/internal/config"
	"monkey-data/internal/repo"
)

type options struct {
	BaseURL        string
	AppID          string
	TeamID         string
	Total          int
	Concurrency    int
	TagCount       int
	TagsMin        int
	TagsMax        int
	CreatorUserID  string
	MaxRetries     int
	ReportInterval time.Duration
	VerifyInterval time.Duration
	VerifyTimeout  time.Duration
}

type runtime struct {
	cfg       config.Config
	http      *http.Client
	es        *elasticsearch.Client
	pg        *pgxpool.Pool
	baseURL   string
	headers   http.Header
	tagIDs    []string
	startTS   int64
	success   int64
	failed    int64
	requested int64
}

func main() {
	var opts options
	flag.StringVar(&opts.BaseURL, "base-url", "", "monkey-data http base url (default: http://127.0.0.1:HTTP_ADDR)")
	flag.StringVar(&opts.AppID, "app-id", "", "app id (default: env MONKEY_DATA_SEED_APP_ID or MONKEY_DATA_WORKER_APP_ID)")
	flag.StringVar(&opts.TeamID, "team-id", "test_team_id", "team id")
	flag.IntVar(&opts.Total, "total", 1_000_000, "total assets to create")
	flag.IntVar(&opts.Concurrency, "concurrency", 32, "concurrent workers")
	flag.IntVar(&opts.TagCount, "tags", 100, "number of tags to create")
	flag.IntVar(&opts.TagsMin, "tags-min", 3, "min tags per asset")
	flag.IntVar(&opts.TagsMax, "tags-max", 8, "max tags per asset")
	flag.StringVar(&opts.CreatorUserID, "creator", "seed_user", "creator_user_id")
	flag.IntVar(&opts.MaxRetries, "retries", 2, "max retries for asset create")
	flag.DurationVar(&opts.ReportInterval, "report", 5*time.Second, "progress report interval")
	flag.DurationVar(&opts.VerifyInterval, "verify-interval", 10*time.Second, "outbox/es verify interval")
	flag.DurationVar(&opts.VerifyTimeout, "verify-timeout", 30*time.Minute, "outbox/es verify timeout")
	flag.Parse()

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config load error: %v", err)
	}

	baseURL := strings.TrimSpace(opts.BaseURL)
	if baseURL == "" {
		baseURL = inferBaseURL(cfg.HTTPAddr)
	}
	appID := strings.TrimSpace(opts.AppID)
	if appID == "" {
		appID = strings.TrimSpace(os.Getenv("MONKEY_DATA_SEED_APP_ID"))
	}
	if appID == "" {
		appID = strings.TrimSpace(os.Getenv("MONKEY_DATA_WORKER_APP_ID"))
	}
	if appID == "" {
		appID = "monkeys"
	}
	if err := repo.ValidateAppID(appID); err != nil {
		log.Fatalf("invalid app_id: %v", err)
	}

	if opts.TagsMax < opts.TagsMin {
		opts.TagsMax = opts.TagsMin
	}
	if opts.Concurrency <= 0 {
		opts.Concurrency = 1
	}
	if opts.Total <= 0 {
		log.Fatal("total must be > 0")
	}

	rt := &runtime{
		cfg:     cfg,
		http:    newHTTPClient(),
		baseURL: strings.TrimRight(baseURL, "/"),
		headers: buildHeaders(cfg, appID, opts.TeamID),
		startTS: time.Now().Add(-5 * time.Second).UnixMilli(),
	}

	log.Printf("seeder target: base_url=%s app_id=%s team_id=%s total=%d concurrency=%d",
		rt.baseURL, appID, opts.TeamID, opts.Total, opts.Concurrency)

	pg, err := pgxpool.New(context.Background(), cfg.PostgresDSN)
	if err != nil {
		log.Fatalf("pg connect error: %v", err)
	}
	rt.pg = pg
	defer pg.Close()

	if cfg.ElasticsearchURL != "" {
		esClient, err := elasticsearch.NewClient(elasticsearch.Config{
			Addresses: []string{cfg.ElasticsearchURL},
			Username:  cfg.ElasticsearchUser,
			Password:  cfg.ElasticsearchPass,
		})
		if err != nil {
			log.Fatalf("elasticsearch init error: %v", err)
		}
		rt.es = esClient
	}

	baseAssetCount, err := countAssets(context.Background(), rt.pg, appID, opts.TeamID)
	if err != nil {
		log.Fatalf("count assets error: %v", err)
	}
	baseOutboxTotal, baseOutboxProcessed, err := countOutboxSince(context.Background(), rt.pg, appID, opts.TeamID, rt.startTS)
	if err != nil {
		log.Fatalf("count outbox error: %v", err)
	}
	log.Printf("baseline: assets=%d outbox_total_since_start=%d processed_since_start=%d", baseAssetCount, baseOutboxTotal, baseOutboxProcessed)

	rt.tagIDs = buildTagIDs(opts.TagCount, rt.startTS)
	if opts.TagCount > 0 {
		if err := createTags(context.Background(), rt, opts); err != nil {
			log.Fatalf("create tags error: %v", err)
		}
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go reportProgress(ctx, rt, opts)
	go monitorOutbox(ctx, rt, appID, opts)

	if err := seedAssets(ctx, rt, appID, opts); err != nil {
		log.Fatalf("seed assets error: %v", err)
	}

	log.Printf("seed finished: success=%d failed=%d", atomic.LoadInt64(&rt.success), atomic.LoadInt64(&rt.failed))

	verify(ctx, rt, appID, baseAssetCount, opts)
}

func inferBaseURL(addr string) string {
	addr = strings.TrimSpace(addr)
	if addr == "" {
		return "http://127.0.0.1:8081"
	}
	if strings.HasPrefix(addr, "http://") || strings.HasPrefix(addr, "https://") {
		return addr
	}
	if strings.HasPrefix(addr, ":") {
		return "http://127.0.0.1" + addr
	}
	return "http://" + addr
}

func buildHeaders(cfg config.Config, appID, teamID string) http.Header {
	headers := http.Header{}
	headers.Set("Content-Type", "application/json")
	headers.Set(cfg.AppIDHeader, appID)
	headers.Set(cfg.TeamIDHeader, teamID)
	if cfg.InternalToken != "" {
		headers.Set("X-Internal-Token", cfg.InternalToken)
	}
	return headers
}

func newHTTPClient() *http.Client {
	transport := &http.Transport{
		MaxIdleConns:        1000,
		MaxIdleConnsPerHost: 1000,
		IdleConnTimeout:     90 * time.Second,
	}
	return &http.Client{
		Timeout:   30 * time.Second,
		Transport: transport,
	}
}

func buildTagIDs(count int, seed int64) []string {
	if count <= 0 {
		return nil
	}
	ids := make([]string, 0, count)
	for i := 0; i < count; i++ {
		ids = append(ids, fmt.Sprintf("seed_tag_%d_%04d", seed, i+1))
	}
	return ids
}

func createTags(ctx context.Context, rt *runtime, opts options) error {
	for i, id := range rt.tagIDs {
		payload := map[string]any{
			"id":   id,
			"name": fmt.Sprintf("Seed Tag %04d", i+1),
		}
		if err := postJSON(ctx, rt, "/v2/tags", payload); err != nil {
			log.Printf("create tag failed id=%s err=%v", id, err)
		}
	}
	log.Printf("tags prepared: %d", len(rt.tagIDs))
	return nil
}

func seedAssets(ctx context.Context, rt *runtime, appID string, opts options) error {
	jobCh := make(chan int, opts.Concurrency*2)
	var wg sync.WaitGroup

	for w := 0; w < opts.Concurrency; w++ {
		wg.Add(1)
		go func(worker int) {
			defer wg.Done()
			rng := rand.New(rand.NewSource(time.Now().UnixNano() + int64(worker*1000)))
			for i := range jobCh {
				payload := buildAssetPayload(opts, rt.tagIDs, rng, i)
				atomic.AddInt64(&rt.requested, 1)
				if err := retryPost(ctx, rt, "/v2/assets", payload, opts.MaxRetries); err != nil {
					atomic.AddInt64(&rt.failed, 1)
					continue
				}
				atomic.AddInt64(&rt.success, 1)
			}
		}(w)
	}

	for i := 0; i < opts.Total; i++ {
		jobCh <- i
	}
	close(jobCh)
	wg.Wait()
	return nil
}

func buildAssetPayload(opts options, tagIDs []string, rng *rand.Rand, index int) map[string]any {
	name := fmt.Sprintf("seed_asset_%d", index+1)
	tags := pickTags(tagIDs, rng, opts.TagsMin, opts.TagsMax)
	return map[string]any{
		"creator_user_id": opts.CreatorUserID,
		"name":            name,
		"asset_type":      "text",
		"primary_content": map[string]any{"type": "text", "value": name},
		"keywords":        "seed",
		"tag_ids":         tags,
	}
}

func pickTags(all []string, rng *rand.Rand, minN, maxN int) []string {
	if len(all) == 0 || maxN <= 0 {
		return nil
	}
	if minN <= 0 {
		minN = 1
	}
	if maxN < minN {
		maxN = minN
	}
	n := minN
	if maxN > minN {
		n = minN + rng.Intn(maxN-minN+1)
	}
	if n > len(all) {
		n = len(all)
	}
	out := make([]string, 0, n)
	seen := map[int]struct{}{}
	for len(out) < n {
		idx := rng.Intn(len(all))
		if _, ok := seen[idx]; ok {
			continue
		}
		seen[idx] = struct{}{}
		out = append(out, all[idx])
	}
	return out
}

func retryPost(ctx context.Context, rt *runtime, path string, payload map[string]any, retries int) error {
	var err error
	for attempt := 0; attempt <= retries; attempt++ {
		err = postJSON(ctx, rt, path, payload)
		if err == nil {
			return nil
		}
		time.Sleep(time.Duration(attempt+1) * 200 * time.Millisecond)
	}
	return err
}

func postJSON(ctx context.Context, rt *runtime, path string, payload any) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, rt.baseURL+path, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header = rt.headers.Clone()

	res, err := rt.http.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.StatusCode >= http.StatusBadRequest {
		return fmt.Errorf("http %d", res.StatusCode)
	}
	return nil
}

func reportProgress(ctx context.Context, rt *runtime, opts options) {
	ticker := time.NewTicker(opts.ReportInterval)
	defer ticker.Stop()
	start := time.Now()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			success := atomic.LoadInt64(&rt.success)
			failed := atomic.LoadInt64(&rt.failed)
			elapsed := time.Since(start).Seconds()
			rate := float64(success+failed) / elapsed
			log.Printf("progress: ok=%d fail=%d rate=%.1f/s", success, failed, rate)
		}
	}
}

func monitorOutbox(ctx context.Context, rt *runtime, appID string, opts options) {
	ticker := time.NewTicker(opts.VerifyInterval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			total, processed, err := countOutboxSince(ctx, rt.pg, appID, rt.headers.Get(rt.cfg.TeamIDHeader), rt.startTS)
			if err != nil {
				log.Printf("outbox check error: %v", err)
				continue
			}
			log.Printf("outbox since start: total=%d processed=%d", total, processed)
		}
	}
}

func verify(ctx context.Context, rt *runtime, appID string, baseAssetCount int64, opts options) {
	expected := baseAssetCount + atomic.LoadInt64(&rt.success)
	deadline := time.Now().Add(opts.VerifyTimeout)

	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		total, processed, err := countOutboxSince(ctx, rt.pg, appID, rt.headers.Get(rt.cfg.TeamIDHeader), rt.startTS)
		if err != nil {
			log.Printf("outbox verify error: %v", err)
		} else {
			log.Printf("outbox verify: total=%d processed=%d", total, processed)
		}

		if rt.es != nil {
			count, err := countIndex(ctx, rt.es, appID, rt.headers.Get(rt.cfg.TeamIDHeader))
			if err != nil {
				log.Printf("es count error: %v", err)
			} else {
				log.Printf("es count(team): %d (expected >= %d)", count, expected)
				if count >= expected && processed >= total && total > 0 {
					log.Printf("verify done: es=%d outbox=%d/%d", count, processed, total)
					return
				}
			}
		} else if processed >= total && total > 0 {
			log.Printf("verify done: outbox=%d/%d", processed, total)
			return
		}

		if time.Now().After(deadline) {
			log.Printf("verify timeout: expected_assets=%d", expected)
			return
		}
		time.Sleep(opts.VerifyInterval)
	}
}

func countAssets(ctx context.Context, pool *pgxpool.Pool, appID, teamID string) (int64, error) {
	if err := repo.ValidateAppID(appID); err != nil {
		return 0, err
	}
	table := fmt.Sprintf(`"%s_data_assets_v2"`, appID)
	var total int64
	err := pool.QueryRow(ctx,
		fmt.Sprintf(`SELECT COUNT(1) FROM %s WHERE team_id=$1 AND is_deleted=false`, table),
		teamID,
	).Scan(&total)
	return total, err
}

func countOutboxSince(ctx context.Context, pool *pgxpool.Pool, appID, teamID string, since int64) (int64, int64, error) {
	if err := repo.ValidateAppID(appID); err != nil {
		return 0, 0, err
	}
	table := fmt.Sprintf(`"%s_data_outbox_events_v2"`, appID)
	var total int64
	var processed int64
	err := pool.QueryRow(ctx,
		fmt.Sprintf(`SELECT COUNT(1), COUNT(processed_timestamp) FROM %s WHERE team_id=$1 AND event_type='asset.upsert' AND created_timestamp >= $2`, table),
		teamID, since,
	).Scan(&total, &processed)
	return total, processed, err
}

func countIndex(ctx context.Context, client *elasticsearch.Client, appID, teamID string) (int64, error) {
	index := fmt.Sprintf("%s_data_assets_v2", appID)
	query := map[string]any{"query": map[string]any{"term": map[string]any{"team_id": teamID}}}
	body, err := json.Marshal(query)
	if err != nil {
		return 0, err
	}
	res, err := client.Count(
		client.Count.WithContext(ctx),
		client.Count.WithIndex(index),
		client.Count.WithBody(bytes.NewReader(body)),
	)
	if err != nil {
		return 0, err
	}
	defer res.Body.Close()
	if res.StatusCode >= http.StatusBadRequest {
		raw, _ := io.ReadAll(res.Body)
		return 0, fmt.Errorf("es count error: %s", string(raw))
	}

	var parsed struct {
		Count int64 `json:"count"`
	}
	if err := json.NewDecoder(res.Body).Decode(&parsed); err != nil {
		return 0, err
	}
	return parsed.Count, nil
}
