package search

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
)

type ElasticsearchClient struct {
	client     *elasticsearch.Client
	tokenKey   []byte
	timeSource func() time.Time
}

func NewElasticsearchClient(cfg ElasticsearchConfig) (*ElasticsearchClient, error) {
	if cfg.URL == "" {
		return nil, errors.New("elasticsearch url required")
	}
	client, err := elasticsearch.NewClient(elasticsearch.Config{
		Addresses: []string{cfg.URL},
		Username:  cfg.User,
		Password:  cfg.Pass,
	})
	if err != nil {
		return nil, err
	}
	return &ElasticsearchClient{
		client:     client,
		tokenKey:   []byte(cfg.PageTokenSecret),
		timeSource: time.Now,
	}, nil
}

type ElasticsearchConfig struct {
	URL             string
	User            string
	Pass            string
	PageTokenSecret string
}

func (c *ElasticsearchClient) SearchAssetIDs(ctx context.Context, appID, teamID string, viewTagGroups [][]string, userTags []string, limit int, pageToken string) ([]string, string, error) {
	if c == nil || c.client == nil {
		return nil, "", errors.New("search not configured")
	}
	if limit <= 0 {
		limit = 20
	}
	if limit > 200 {
		limit = 200
	}

	normalizedViewGroups := normalizeGroups(viewTagGroups)
	normalizedUserTags := normalizeTags(userTags)
	tagsHash := hashTags(normalizedViewGroups, normalizedUserTags)

	anchor := int64(0)
	lastUpdated := int64(0)
	lastID := ""
	if pageToken != "" {
		payload, err := decodePageToken(c.tokenKey, pageToken)
		if err != nil {
			return nil, "", err
		}
		if payload.AppID != appID || payload.TeamID != teamID || payload.TagsHash != tagsHash {
			return nil, "", errors.New("page_token mismatch")
		}
		anchor = payload.Anchor
		lastUpdated = payload.LastUpdated
		lastID = payload.LastID
	} else {
		anchor = c.timeSource().UnixMilli()
	}

	query := buildQuery(teamID, anchor, normalizedViewGroups, normalizedUserTags)

	req := map[string]any{
		"size":  limit,
		"query": query,
		"sort": []any{
			map[string]any{"updated_timestamp": map[string]any{"order": "desc"}},
			map[string]any{"asset_id": map[string]any{"order": "desc"}},
		},
		"_source": []string{"asset_id"},
	}
	if lastUpdated > 0 && lastID != "" {
		req["search_after"] = []any{lastUpdated, lastID}
	}

	body, err := json.Marshal(req)
	if err != nil {
		return nil, "", err
	}

	index := fmt.Sprintf("%s_data_assets_v2", appID)
	res, err := c.client.Search(
		c.client.Search.WithContext(ctx),
		c.client.Search.WithIndex(index),
		c.client.Search.WithBody(bytes.NewReader(body)),
	)
	if err != nil {
		return nil, "", err
	}
	defer res.Body.Close()

	if res.StatusCode >= http.StatusBadRequest {
		raw, _ := io.ReadAll(res.Body)
		return nil, "", fmt.Errorf("elasticsearch error: %s", string(raw))
	}

	var parsed esSearchResponse
	if err := json.NewDecoder(res.Body).Decode(&parsed); err != nil {
		return nil, "", err
	}

	ids := make([]string, 0, len(parsed.Hits.Hits))
	for _, hit := range parsed.Hits.Hits {
		id, ok := hit.Source["asset_id"].(string)
		if !ok || id == "" {
			continue
		}
		ids = append(ids, id)
	}

	nextToken := ""
	if len(parsed.Hits.Hits) == limit {
		lastHit := parsed.Hits.Hits[len(parsed.Hits.Hits)-1]
		updated, id, ok := parseSort(lastHit.Sort)
		if ok {
			payload := pageTokenPayload{
				Version:     1,
				Anchor:      anchor,
				LastUpdated: updated,
				LastID:      id,
				TagsHash:    tagsHash,
				AppID:       appID,
				TeamID:      teamID,
			}
			token, err := encodePageToken(c.tokenKey, payload)
			if err != nil {
				return ids, "", nil
			}
			nextToken = token
		}
	}
	return ids, nextToken, nil
}

type esSearchResponse struct {
	Hits struct {
		Hits []struct {
			Source map[string]any `json:"_source"`
			Sort   []any          `json:"sort"`
		} `json:"hits"`
	} `json:"hits"`
}

func buildQuery(teamID string, anchor int64, viewGroups [][]string, userTags []string) map[string]any {
	filters := []any{
		map[string]any{"term": map[string]any{"team_id": teamID}},
	}
	if anchor > 0 {
		filters = append(filters, map[string]any{"range": map[string]any{"updated_timestamp": map[string]any{"lte": anchor}}})
	}
	if len(viewGroups) > 0 {
		should := make([]any, 0, len(viewGroups))
		for _, group := range viewGroups {
			if len(group) == 0 {
				continue
			}
			must := make([]any, 0, len(group))
			for _, tag := range group {
				must = append(must, map[string]any{"term": map[string]any{"tag_ids": tag}})
			}
			should = append(should, map[string]any{"bool": map[string]any{"filter": must}})
		}
		if len(should) > 0 {
			filters = append(filters, map[string]any{"bool": map[string]any{"should": should, "minimum_should_match": 1}})
		}
	}
	for _, tag := range userTags {
		filters = append(filters, map[string]any{"term": map[string]any{"tag_ids": tag}})
	}
	return map[string]any{"bool": map[string]any{"filter": filters}}
}

func parseSort(sort []any) (int64, string, bool) {
	if len(sort) < 2 {
		return 0, "", false
	}
	updated, ok := toInt64(sort[0])
	if !ok {
		return 0, "", false
	}
	id, ok := sort[1].(string)
	if !ok {
		return 0, "", false
	}
	return updated, id, true
}

func toInt64(v any) (int64, bool) {
	switch t := v.(type) {
	case float64:
		return int64(t), true
	case int64:
		return t, true
	case int:
		return int64(t), true
	case json.Number:
		n, err := t.Int64()
		if err != nil {
			return 0, false
		}
		return n, true
	default:
		return 0, false
	}
}
