package repo

import (
  "context"

  "monkey-data/internal/model"
)

// Store defines storage operations for V2 data management.
type Store interface {
  // Assets
  CreateAsset(ctx context.Context, appID, teamID string, asset model.Asset, tagIDs []string) (string, error)
  UpdateAsset(ctx context.Context, appID, teamID, assetID string, updates map[string]any) error
  DeleteAsset(ctx context.Context, appID, teamID, assetID string) error
  GetAsset(ctx context.Context, appID, teamID, assetID string) (model.Asset, error)
  ReplaceAssetTags(ctx context.Context, appID, teamID, assetID string, tagIDs []string) error

  // Tags
  CreateTag(ctx context.Context, appID, teamID string, tag model.Tag) (string, error)
  ListTags(ctx context.Context, appID, teamID, keyword string, limit int, pageToken string) ([]model.Tag, string, error)
  DeleteTag(ctx context.Context, appID, teamID, tagID string) error

  // Views
  CreateView(ctx context.Context, appID, teamID string, view model.View) (string, error)
  UpdateView(ctx context.Context, appID, teamID, viewID string, updates map[string]any) error
  DeleteView(ctx context.Context, appID, teamID, viewID string) error
  GetViewTree(ctx context.Context, appID, teamID string) ([]model.View, error)
  GetViewTags(ctx context.Context, appID, teamID, viewID string) ([]string, error)
  ReplaceViewTags(ctx context.Context, appID, teamID, viewID string, tagIDs []string) error

  // Search helpers
  GetViewTagGroups(ctx context.Context, appID, teamID, viewID string) ([][]string, error)
}
