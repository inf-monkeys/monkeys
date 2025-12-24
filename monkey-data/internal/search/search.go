package search

import "context"

// Client defines minimal search operations.
type Client interface {
  SearchAssetIDs(ctx context.Context, appID, teamID string, viewTagGroups [][]string, userTags []string, limit int, pageToken string) ([]string, string, error)
}
