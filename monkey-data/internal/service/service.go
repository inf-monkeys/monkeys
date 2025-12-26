package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"monkey-data/internal/model"
	"monkey-data/internal/repo"
	"monkey-data/internal/search"
)

// Service wires storage and search for v2.
type Service struct {
	store  repo.Store
	search search.Client
}

type pinger interface {
	Ping(context.Context) error
}

func New(store repo.Store, search search.Client) *Service {
	return &Service{store: store, search: search}
}

func (s *Service) ensureStore() error {
	if s.store == nil {
		return errors.New("store not configured")
	}
	return nil
}

func (s *Service) ensureSearch() error {
	if s.search == nil {
		return errors.New("search not configured")
	}
	return nil
}

func (s *Service) Ready(ctx context.Context) error {
	issues := []string{}

	if s.store == nil {
		issues = append(issues, "store not configured")
	} else if p, ok := s.store.(pinger); ok {
		if err := p.Ping(ctx); err != nil {
			issues = append(issues, fmt.Sprintf("postgres not ready: %v", err))
		}
	} else {
		issues = append(issues, "store ping not supported")
	}

	if s.search == nil {
		issues = append(issues, "search not configured")
	} else if p, ok := s.search.(pinger); ok {
		if err := p.Ping(ctx); err != nil {
			issues = append(issues, fmt.Sprintf("elasticsearch not ready: %v", err))
		}
	} else {
		issues = append(issues, "search ping not supported")
	}

	if len(issues) > 0 {
		return errors.New(strings.Join(issues, "; "))
	}
	return nil
}

// SearchAssets performs view-based filtering + user tags.
func (s *Service) SearchAssets(ctx context.Context, appID, teamID, viewID string, userTags []string, name string, limit int, pageToken string) ([]string, string, int64, error) {
	if teamID == "" {
		return nil, "", 0, errors.New("team_id required")
	}
	if err := s.ensureSearch(); err != nil {
		return nil, "", 0, err
	}
	if err := s.ensureStore(); err != nil {
		return nil, "", 0, err
	}
	viewTagGroups := [][]string{}
	if viewID != "" {
		groups, err := s.store.GetViewTagGroups(ctx, appID, teamID, viewID)
		if err != nil {
			return nil, "", 0, err
		}
		viewTagGroups = groups
	}
	return s.search.SearchAssetIDs(ctx, appID, teamID, viewTagGroups, userTags, name, limit, pageToken)
}

func (s *Service) CreateAsset(ctx context.Context, appID, teamID string, asset model.Asset, tagIDs []string) (string, error) {
	if teamID == "" {
		return "", errors.New("team_id required")
	}
	if err := s.ensureStore(); err != nil {
		return "", err
	}
	return s.store.CreateAsset(ctx, appID, teamID, asset, tagIDs)
}

func (s *Service) UpdateAsset(ctx context.Context, appID, teamID, assetID string, updates map[string]any) error {
	if teamID == "" {
		return errors.New("team_id required")
	}
	if err := s.ensureStore(); err != nil {
		return err
	}
	return s.store.UpdateAsset(ctx, appID, teamID, assetID, updates)
}

func (s *Service) DeleteAsset(ctx context.Context, appID, teamID, assetID string) error {
	if teamID == "" {
		return errors.New("team_id required")
	}
	if err := s.ensureStore(); err != nil {
		return err
	}
	return s.store.DeleteAsset(ctx, appID, teamID, assetID)
}

func (s *Service) GetAsset(ctx context.Context, appID, teamID, assetID string) (model.Asset, error) {
	if teamID == "" {
		return model.Asset{}, errors.New("team_id required")
	}
	if err := s.ensureStore(); err != nil {
		return model.Asset{}, err
	}
	return s.store.GetAsset(ctx, appID, teamID, assetID)
}

func (s *Service) ReplaceAssetTags(ctx context.Context, appID, teamID, assetID string, tagIDs []string) error {
	if teamID == "" {
		return errors.New("team_id required")
	}
	if err := s.ensureStore(); err != nil {
		return err
	}
	return s.store.ReplaceAssetTags(ctx, appID, teamID, assetID, tagIDs)
}

func (s *Service) CreateTag(ctx context.Context, appID, teamID string, tag model.Tag) (string, error) {
	if teamID == "" {
		return "", errors.New("team_id required")
	}
	if err := s.ensureStore(); err != nil {
		return "", err
	}
	return s.store.CreateTag(ctx, appID, teamID, tag)
}

func (s *Service) ListTags(ctx context.Context, appID, teamID, keyword string, limit int, pageToken string) ([]model.Tag, string, error) {
	if teamID == "" {
		return nil, "", errors.New("team_id required")
	}
	if err := s.ensureStore(); err != nil {
		return nil, "", err
	}
	return s.store.ListTags(ctx, appID, teamID, keyword, limit, pageToken)
}

func (s *Service) DeleteTag(ctx context.Context, appID, teamID, tagID string) error {
	if teamID == "" {
		return errors.New("team_id required")
	}
	if err := s.ensureStore(); err != nil {
		return err
	}
	return s.store.DeleteTag(ctx, appID, teamID, tagID)
}

func (s *Service) CreateView(ctx context.Context, appID, teamID string, view model.View) (string, error) {
	if err := s.ensureStore(); err != nil {
		return "", err
	}
	return s.store.CreateView(ctx, appID, teamID, view)
}

func (s *Service) UpdateView(ctx context.Context, appID, teamID, viewID string, updates map[string]any) error {
	if err := s.ensureStore(); err != nil {
		return err
	}
	return s.store.UpdateView(ctx, appID, teamID, viewID, updates)
}

func (s *Service) DeleteView(ctx context.Context, appID, teamID, viewID string) error {
	if err := s.ensureStore(); err != nil {
		return err
	}
	return s.store.DeleteView(ctx, appID, teamID, viewID)
}

func (s *Service) GetViewTree(ctx context.Context, appID, teamID string) ([]model.View, error) {
	if err := s.ensureStore(); err != nil {
		return nil, err
	}
	return s.store.GetViewTree(ctx, appID, teamID)
}

func (s *Service) GetViewTags(ctx context.Context, appID, teamID, viewID string) ([]string, error) {
	if teamID == "" {
		return nil, errors.New("team_id required")
	}
	if err := s.ensureStore(); err != nil {
		return nil, err
	}
	return s.store.GetViewTags(ctx, appID, teamID, viewID)
}

func (s *Service) ReplaceViewTags(ctx context.Context, appID, teamID, viewID string, tagIDs []string) error {
	if err := s.ensureStore(); err != nil {
		return err
	}
	return s.store.ReplaceViewTags(ctx, appID, teamID, viewID, tagIDs)
}
