package config

import (
	"os"
	"strconv"
)

// Config holds minimal settings for the monkey-data service.
type Config struct {
	HTTPAddr        string
	InternalToken   string
	AppIDHeader     string
	TeamIDHeader    string
	PostgresDSN     string
	OpenSearchURL   string
	OpenSearchUser  string
	OpenSearchPass  string
	PageTokenSecret string
	WorkerAppID     string
	WorkerID        string
	WorkerBatchSize int
	WorkerPollMS    int
	WorkerLockMS    int
}

// Load reads env vars and returns a config with defaults.
func Load() Config {
	return Config{
		HTTPAddr:        getEnv("MONKEY_DATA_HTTP_ADDR", ":8081"),
		InternalToken:   os.Getenv("MONKEY_DATA_INTERNAL_TOKEN"),
		AppIDHeader:     getEnv("MONKEY_DATA_APP_ID_HEADER", "X-App-Id"),
		TeamIDHeader:    getEnv("MONKEY_DATA_TEAM_ID_HEADER", "X-Team-Id"),
		PostgresDSN:     os.Getenv("MONKEY_DATA_PG_DSN"),
		OpenSearchURL:   os.Getenv("MONKEY_DATA_OPENSEARCH_URL"),
		OpenSearchUser:  os.Getenv("MONKEY_DATA_OPENSEARCH_USER"),
		OpenSearchPass:  os.Getenv("MONKEY_DATA_OPENSEARCH_PASS"),
		PageTokenSecret: os.Getenv("MONKEY_DATA_PAGE_TOKEN_SECRET"),
		WorkerAppID:     os.Getenv("MONKEY_DATA_WORKER_APP_ID"),
		WorkerID:        os.Getenv("MONKEY_DATA_WORKER_ID"),
		WorkerBatchSize: getEnvInt("MONKEY_DATA_WORKER_BATCH_SIZE", 100),
		WorkerPollMS:    getEnvInt("MONKEY_DATA_WORKER_POLL_MS", 1000),
		WorkerLockMS:    getEnvInt("MONKEY_DATA_WORKER_LOCK_MS", 60000),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return fallback
}
