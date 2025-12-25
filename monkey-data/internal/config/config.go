package config

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"gopkg.in/yaml.v3"
)

// Config holds minimal settings for the monkey-data service.
type Config struct {
	HTTPAddr          string
	InternalToken     string
	AppIDHeader       string
	TeamIDHeader      string
	PostgresDSN       string
	ElasticsearchURL  string
	ElasticsearchUser string
	ElasticsearchPass string
	PageTokenSecret   string
	WorkerAppID       string
	WorkerID          string
	WorkerBatchSize   int
	WorkerPollMS      int
	WorkerLockMS      int
}

// Load reads config.yaml (if present) and env vars (env wins).
func Load() (Config, error) {
	yamlCfg, err := loadYAMLConfig(resolveConfigPath())
	if err != nil {
		return Config{}, err
	}

	esCfg := selectESConfig(yamlCfg)
	esURL := firstNonEmpty(esCfg.URL, esCfg.buildURL())
	esUser := esCfg.Username
	esPass := esCfg.Password

	pgDSN := os.Getenv("MONKEY_DATA_PG_DSN")
	if pgDSN == "" {
		pgDSN = buildPostgresDSN(yamlCfg.Database, os.Getenv("MONKEY_DATA_PG_SSLMODE"))
	}

	return Config{
		HTTPAddr:          getEnv("MONKEY_DATA_HTTP_ADDR", ":8081"),
		InternalToken:     firstNonEmpty(os.Getenv("MONKEY_DATA_INTERNAL_TOKEN"), yamlCfg.InternalToken),
		AppIDHeader:       getEnv("MONKEY_DATA_APP_ID_HEADER", "X-App-Id"),
		TeamIDHeader:      getEnv("MONKEY_DATA_TEAM_ID_HEADER", "X-Team-Id"),
		PostgresDSN:       pgDSN,
		ElasticsearchURL:  firstNonEmpty(os.Getenv("MONKEY_DATA_ES_URL"), os.Getenv("MONKEY_DATA_OPENSEARCH_URL"), esURL),
		ElasticsearchUser: firstNonEmpty(os.Getenv("MONKEY_DATA_ES_USER"), os.Getenv("MONKEY_DATA_OPENSEARCH_USER"), esUser),
		ElasticsearchPass: firstNonEmpty(os.Getenv("MONKEY_DATA_ES_PASS"), os.Getenv("MONKEY_DATA_OPENSEARCH_PASS"), esPass),
		PageTokenSecret:   os.Getenv("MONKEY_DATA_PAGE_TOKEN_SECRET"),
		WorkerAppID:       os.Getenv("MONKEY_DATA_WORKER_APP_ID"),
		WorkerID:          os.Getenv("MONKEY_DATA_WORKER_ID"),
		WorkerBatchSize:   getEnvInt("MONKEY_DATA_WORKER_BATCH_SIZE", 100),
		WorkerPollMS:      getEnvInt("MONKEY_DATA_WORKER_POLL_MS", 1000),
		WorkerLockMS:      getEnvInt("MONKEY_DATA_WORKER_LOCK_MS", 60000),
	}, nil
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

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if v != "" {
			return v
		}
	}
	return ""
}

type yamlConfig struct {
	Database      dbConfig `yaml:"database"`
	Elasticsearch esConfig `yaml:"elasticsearch"`
	ES            esConfig `yaml:"es"`
	OpenSearch    esConfig `yaml:"opensearch"`
	InternalToken string   `yaml:"internal_token"`
}

type dbConfig struct {
	Type     string `yaml:"type"`
	Host     string `yaml:"host"`
	Port     int    `yaml:"port"`
	Username string `yaml:"username"`
	Password string `yaml:"password"`
	Database string `yaml:"database"`
	SSLMode  string `yaml:"sslmode"`
}

type esConfig struct {
	URL      string `yaml:"url"`
	Host     string `yaml:"host"`
	Port     int    `yaml:"port"`
	Username string `yaml:"username"`
	Password string `yaml:"password"`
	Scheme   string `yaml:"scheme"`
}

func (c esConfig) buildURL() string {
	if strings.TrimSpace(c.URL) != "" {
		return c.URL
	}
	if strings.TrimSpace(c.Host) == "" {
		return ""
	}
	scheme := c.Scheme
	if scheme == "" {
		scheme = "http"
	}
	port := c.Port
	if port == 0 {
		port = 9200
	}
	return fmt.Sprintf("%s://%s:%d", scheme, c.Host, port)
}

func selectESConfig(cfg yamlConfig) esConfig {
	if cfg.Elasticsearch.URL != "" || cfg.Elasticsearch.Host != "" {
		return cfg.Elasticsearch
	}
	if cfg.ES.URL != "" || cfg.ES.Host != "" {
		return cfg.ES
	}
	if cfg.OpenSearch.URL != "" || cfg.OpenSearch.Host != "" {
		return cfg.OpenSearch
	}
	return esConfig{}
}

func buildPostgresDSN(db dbConfig, sslOverride string) string {
	if strings.TrimSpace(db.Host) == "" || strings.TrimSpace(db.Database) == "" {
		return ""
	}
	port := db.Port
	if port == 0 {
		port = 5432
	}
	sslmode := strings.TrimSpace(sslOverride)
	if sslmode == "" {
		sslmode = strings.TrimSpace(db.SSLMode)
	}
	if sslmode == "" {
		sslmode = "disable"
	}
	return fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		strings.TrimSpace(db.Host),
		port,
		strings.TrimSpace(db.Username),
		db.Password,
		strings.TrimSpace(db.Database),
		sslmode,
	)
}

func loadYAMLConfig(path string) (yamlConfig, error) {
	var cfg yamlConfig
	if strings.TrimSpace(path) == "" {
		return cfg, nil
	}
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return cfg, nil
		}
		return cfg, err
	}
	if len(strings.TrimSpace(string(data))) == 0 {
		return cfg, nil
	}
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return cfg, err
	}
	return cfg, nil
}

func resolveConfigPath() string {
	cwd, err := os.Getwd()
	if err != nil {
		return ""
	}
	if filepath.Base(cwd) == "monkey-data" {
		return filepath.Join(cwd, "config.yaml")
	}
	candidate := filepath.Join(cwd, "monkey-data", "config.yaml")
	if _, err := os.Stat(candidate); err == nil {
		return candidate
	}
	return ""
}
