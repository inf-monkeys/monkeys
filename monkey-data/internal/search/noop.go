package search

import (
	"context"
	"errors"
)

type NoopClient struct{}

func NewNoopClient() *NoopClient {
	return &NoopClient{}
}

func (n *NoopClient) Ping(ctx context.Context) error {
	return errors.New("search not configured")
}

func (n *NoopClient) SearchAssetIDs(ctx context.Context, appID, teamID string, viewTagGroups [][]string, userTags []string, limit int, pageToken string) ([]string, string, error) {
	return nil, "", errors.New("search not configured")
}
