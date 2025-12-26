package httpapi

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"monkey-data/internal/model"
	"monkey-data/internal/reindex"
)

const maxLimit = 200

func (s *Server) handleHealthz(c *gin.Context) {
	if c.Request.Method != http.MethodGet {
		writeError(c, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	if err := s.requireInternalAuth(c.Request); err != nil {
		writeError(c, http.StatusUnauthorized, "unauthorized")
		return
	}
	writeOK(c, map[string]any{"ok": true})
}

func (s *Server) handleReadyz(c *gin.Context) {
	if c.Request.Method != http.MethodGet {
		writeError(c, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	if err := s.requireInternalAuth(c.Request); err != nil {
		writeError(c, http.StatusUnauthorized, "unauthorized")
		return
	}
	if err := s.service.Ready(c.Request.Context()); err != nil {
		writeError(c, http.StatusServiceUnavailable, err.Error())
		return
	}
	writeOK(c, map[string]any{"ok": true})
}

func (s *Server) handleSearchAssets(c *gin.Context) {
	if c.Request.Method != http.MethodGet {
		writeError(c, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	if err := s.requireInternalAuth(c.Request); err != nil {
		writeError(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	appID, teamID, err := s.getAppAndTeam(c.Request)
	if err != nil {
		writeError(c, http.StatusBadRequest, err.Error())
		return
	}

	viewID := c.Query("view_id")
	tagsRaw := c.Query("tags")
	name := c.Query("name")
	limit := parseLimit(c.Query("limit"), 20)
	pageToken := c.Query("page_token")

	userTags := splitTags(tagsRaw)
	ids, nextToken, total, err := s.service.SearchAssets(c.Request.Context(), appID, teamID, viewID, userTags, name, limit, pageToken)
	if err != nil {
		writeError(c, http.StatusBadRequest, err.Error())
		return
	}

	writeOK(c, map[string]any{
		"items":           ids,
		"next_page_token": nextToken,
		"total":           total,
	})
}

func (s *Server) handleAssets(c *gin.Context) {
	if err := s.requireInternalAuth(c.Request); err != nil {
		writeError(c, http.StatusUnauthorized, "unauthorized")
		return
	}
	if c.Request.Method != http.MethodPost {
		writeError(c, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	appID, teamID, err := s.getAppAndTeam(c.Request)
	if err != nil {
		writeError(c, http.StatusBadRequest, err.Error())
		return
	}

	var req assetCreateRequest
	if err := readJSON(c.Request, &req); err != nil {
		writeError(c, http.StatusBadRequest, "invalid json")
		return
	}
	if req.Name == "" || req.AssetType == "" || req.PrimaryContent == nil {
		writeError(c, http.StatusBadRequest, "name, asset_type, primary_content required")
		return
	}

	now := nowMillis()
	if req.CreatedTimestamp == 0 {
		req.CreatedTimestamp = now
	}
	if req.UpdatedTimestamp == 0 {
		req.UpdatedTimestamp = now
	}

	asset := model.Asset{
		ID:               req.ID,
		TeamID:           teamID,
		CreatorUserID:    req.CreatorUserID,
		Name:             req.Name,
		AssetType:        req.AssetType,
		PrimaryContent:   req.PrimaryContent,
		Properties:       req.Properties,
		Files:            req.Files,
		Media:            req.Media,
		Thumbnail:        req.Thumbnail,
		Keywords:         req.Keywords,
		Status:           req.Status,
		Extra:            req.Extra,
		CreatedTimestamp: req.CreatedTimestamp,
		UpdatedTimestamp: req.UpdatedTimestamp,
	}

	id, err := s.service.CreateAsset(c.Request.Context(), appID, teamID, asset, req.TagIDs)
	if err != nil {
		writeError(c, http.StatusBadRequest, err.Error())
		return
	}
	writeOK(c, map[string]any{"id": id})
}

func (s *Server) handleAssetByID(c *gin.Context) {
	if err := s.requireInternalAuth(c.Request); err != nil {
		writeError(c, http.StatusUnauthorized, "unauthorized")
		return
	}
	id := strings.TrimSpace(c.Param("id"))
	if id == "" {
		writeError(c, http.StatusBadRequest, "invalid asset id")
		return
	}

	appID, teamID, err := s.getAppAndTeam(c.Request)
	if err != nil {
		writeError(c, http.StatusBadRequest, err.Error())
		return
	}

	switch c.Request.Method {
	case http.MethodGet:
		asset, err := s.service.GetAsset(c.Request.Context(), appID, teamID, id)
		if err != nil {
			writeError(c, http.StatusBadRequest, err.Error())
			return
		}
		writeOK(c, asset)
	case http.MethodPatch, http.MethodPut:
		updates, tagIDs, hasTags, err := parseAssetUpdates(c.Request)
		if err != nil {
			writeError(c, http.StatusBadRequest, err.Error())
			return
		}
		if len(updates) == 0 && !hasTags {
			writeError(c, http.StatusBadRequest, "no updates")
			return
		}
		if len(updates) > 0 {
			if err := s.service.UpdateAsset(c.Request.Context(), appID, teamID, id, updates); err != nil {
				writeError(c, http.StatusBadRequest, err.Error())
				return
			}
		}
		if hasTags {
			if err := s.service.ReplaceAssetTags(c.Request.Context(), appID, teamID, id, tagIDs); err != nil {
				writeError(c, http.StatusBadRequest, err.Error())
				return
			}
		}
		writeOK(c, map[string]any{"ok": true})
	case http.MethodDelete:
		if err := s.service.DeleteAsset(c.Request.Context(), appID, teamID, id); err != nil {
			writeError(c, http.StatusBadRequest, err.Error())
			return
		}
		writeOK(c, map[string]any{"ok": true})
	default:
		writeError(c, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func (s *Server) handleTags(c *gin.Context) {
	if err := s.requireInternalAuth(c.Request); err != nil {
		writeError(c, http.StatusUnauthorized, "unauthorized")
		return
	}
	appID, teamID, err := s.getAppAndTeam(c.Request)
	if err != nil {
		writeError(c, http.StatusBadRequest, err.Error())
		return
	}

	switch c.Request.Method {
	case http.MethodPost:
		var req tagCreateRequest
		if err := readJSON(c.Request, &req); err != nil {
			writeError(c, http.StatusBadRequest, "invalid json")
			return
		}
		if req.Name == "" {
			writeError(c, http.StatusBadRequest, "name required")
			return
		}
		now := nowMillis()
		if req.CreatedTimestamp == 0 {
			req.CreatedTimestamp = now
		}
		if req.UpdatedTimestamp == 0 {
			req.UpdatedTimestamp = now
		}
		tag := model.Tag{
			ID:               req.ID,
			TeamID:           teamID,
			Name:             req.Name,
			NameNorm:         normalizeName(req.Name),
			Color:            req.Color,
			Extra:            req.Extra,
			CreatedTimestamp: req.CreatedTimestamp,
			UpdatedTimestamp: req.UpdatedTimestamp,
		}
		id, err := s.service.CreateTag(c.Request.Context(), appID, teamID, tag)
		if err != nil {
			writeError(c, http.StatusBadRequest, err.Error())
			return
		}
		writeOK(c, map[string]any{"id": id})
	case http.MethodGet:
		keyword := c.Query("keyword")
		limit := parseLimit(c.Query("limit"), 20)
		pageToken := c.Query("page_token")
		items, nextToken, err := s.service.ListTags(c.Request.Context(), appID, teamID, keyword, limit, pageToken)
		if err != nil {
			writeError(c, http.StatusBadRequest, err.Error())
			return
		}
		writeOK(c, map[string]any{"items": items, "next_page_token": nextToken})
	default:
		writeError(c, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func (s *Server) handleTagByID(c *gin.Context) {
	if err := s.requireInternalAuth(c.Request); err != nil {
		writeError(c, http.StatusUnauthorized, "unauthorized")
		return
	}
	id := strings.TrimSpace(c.Param("id"))
	if id == "" {
		writeError(c, http.StatusBadRequest, "invalid tag id")
		return
	}

	appID, teamID, err := s.getAppAndTeam(c.Request)
	if err != nil {
		writeError(c, http.StatusBadRequest, err.Error())
		return
	}

	switch c.Request.Method {
	case http.MethodDelete:
		if err := s.service.DeleteTag(c.Request.Context(), appID, teamID, id); err != nil {
			writeError(c, http.StatusBadRequest, err.Error())
			return
		}
		writeOK(c, map[string]any{"ok": true})
	default:
		writeError(c, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func (s *Server) handleViews(c *gin.Context) {
	if err := s.requireInternalAuth(c.Request); err != nil {
		writeError(c, http.StatusUnauthorized, "unauthorized")
		return
	}
	if c.Request.Method != http.MethodPost {
		writeError(c, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	appID, teamID, err := s.getAppAndTeam(c.Request)
	if err != nil {
		writeError(c, http.StatusBadRequest, err.Error())
		return
	}

	var req viewCreateRequest
	if err := readJSON(c.Request, &req); err != nil {
		writeError(c, http.StatusBadRequest, "invalid json")
		return
	}
	if req.Name == "" || req.Path == "" {
		writeError(c, http.StatusBadRequest, "name and path required")
		return
	}
	now := nowMillis()
	if req.CreatedTimestamp == 0 {
		req.CreatedTimestamp = now
	}
	if req.UpdatedTimestamp == 0 {
		req.UpdatedTimestamp = now
	}
	view := model.View{
		ID:               req.ID,
		TeamID:           teamID,
		Name:             req.Name,
		Description:      req.Description,
		IconURL:          req.IconURL,
		ParentID:         req.ParentID,
		Path:             req.Path,
		Level:            req.Level,
		Sort:             req.Sort,
		DisplayConfig:    req.DisplayConfig,
		CreatedTimestamp: req.CreatedTimestamp,
		UpdatedTimestamp: req.UpdatedTimestamp,
	}
	id, err := s.service.CreateView(c.Request.Context(), appID, teamID, view)
	if err != nil {
		writeError(c, http.StatusBadRequest, err.Error())
		return
	}
	writeOK(c, map[string]any{"id": id})
}

func (s *Server) handleViewByID(c *gin.Context) {
	if err := s.requireInternalAuth(c.Request); err != nil {
		writeError(c, http.StatusUnauthorized, "unauthorized")
		return
	}
	id := strings.TrimSpace(c.Param("id"))
	if id == "" {
		writeError(c, http.StatusBadRequest, "invalid view id")
		return
	}

	appID, teamID, err := s.getAppAndTeam(c.Request)
	if err != nil {
		writeError(c, http.StatusBadRequest, err.Error())
		return
	}

	switch c.Request.Method {
	case http.MethodPatch, http.MethodPut:
		updates, err := parseViewUpdates(c.Request)
		if err != nil {
			writeError(c, http.StatusBadRequest, err.Error())
			return
		}
		if len(updates) == 0 {
			writeError(c, http.StatusBadRequest, "no updates")
			return
		}
		if err := s.service.UpdateView(c.Request.Context(), appID, teamID, id, updates); err != nil {
			writeError(c, http.StatusBadRequest, err.Error())
			return
		}
		writeOK(c, map[string]any{"ok": true})
	case http.MethodDelete:
		if err := s.service.DeleteView(c.Request.Context(), appID, teamID, id); err != nil {
			writeError(c, http.StatusBadRequest, err.Error())
			return
		}
		writeOK(c, map[string]any{"ok": true})
	default:
		writeError(c, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func (s *Server) handleViewTags(c *gin.Context) {
	id := strings.TrimSpace(c.Param("id"))
	if id == "" {
		writeError(c, http.StatusBadRequest, "invalid view id")
		return
	}
	appID, teamID, err := s.getAppAndTeam(c.Request)
	if err != nil {
		writeError(c, http.StatusBadRequest, err.Error())
		return
	}

	switch c.Request.Method {
	case http.MethodGet:
		tagIDs, err := s.service.GetViewTags(c.Request.Context(), appID, teamID, id)
		if err != nil {
			writeError(c, http.StatusBadRequest, err.Error())
			return
		}
		writeOK(c, map[string]any{"items": tagIDs})
	case http.MethodPut:
		var req tagListRequest
		if err := readJSON(c.Request, &req); err != nil {
			writeError(c, http.StatusBadRequest, "invalid json")
			return
		}
		if err := s.service.ReplaceViewTags(c.Request.Context(), appID, teamID, id, req.TagIDs); err != nil {
			writeError(c, http.StatusBadRequest, err.Error())
			return
		}
		writeOK(c, map[string]any{"ok": true})
	default:
		writeError(c, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func (s *Server) handleViewTree(c *gin.Context) {
	if err := s.requireInternalAuth(c.Request); err != nil {
		writeError(c, http.StatusUnauthorized, "unauthorized")
		return
	}
	if c.Request.Method != http.MethodGet {
		writeError(c, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	appID, teamID, err := s.getAppAndTeam(c.Request)
	if err != nil {
		writeError(c, http.StatusBadRequest, err.Error())
		return
	}
	items, err := s.service.GetViewTree(c.Request.Context(), appID, teamID)
	if err != nil {
		writeError(c, http.StatusBadRequest, err.Error())
		return
	}
	writeOK(c, map[string]any{"items": items})
}

func (s *Server) handleIndexAppIDs(c *gin.Context) {
	if c.Request.Method != http.MethodGet {
		writeError(c, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	if err := s.requireInternalAuth(c.Request); err != nil {
		writeError(c, http.StatusUnauthorized, "unauthorized")
		return
	}
	if s.reindex == nil {
		writeError(c, http.StatusServiceUnavailable, "reindex not configured")
		return
	}
	items, err := s.reindex.ListAppIDs(c.Request.Context())
	if err != nil {
		writeError(c, http.StatusBadRequest, err.Error())
		return
	}
	writeOK(c, map[string]any{"items": items})
}

func (s *Server) handleIndexRebuild(c *gin.Context) {
	if c.Request.Method != http.MethodPost {
		writeError(c, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	if err := s.requireInternalAuth(c.Request); err != nil {
		writeError(c, http.StatusUnauthorized, "unauthorized")
		return
	}
	if s.reindex == nil {
		writeError(c, http.StatusServiceUnavailable, "reindex not configured")
		return
	}

	var req reindexRequest
	if err := readJSON(c.Request, &req); err != nil {
		writeError(c, http.StatusBadRequest, "invalid json")
		return
	}

	appIDs := req.AppIDs
	if req.All {
		list, err := s.reindex.ListAppIDs(c.Request.Context())
		if err != nil {
			writeError(c, http.StatusBadRequest, err.Error())
			return
		}
		appIDs = list
	}
	if len(appIDs) == 0 {
		writeError(c, http.StatusBadRequest, "app_ids required")
		return
	}

	opts := reindex.Options{
		BatchSize:   req.BatchSize,
		DeleteIndex: boolOrDefault(req.DeleteIndex, true),
		CreateIndex: boolOrDefault(req.CreateIndex, true),
		Refresh:     boolOrDefault(req.Refresh, false),
	}
	job, err := s.reindex.StartRebuild(appIDs, opts)
	if err != nil {
		writeError(c, http.StatusBadRequest, err.Error())
		return
	}
	writeOK(c, job)
}

func (s *Server) handleIndexJob(c *gin.Context) {
	if c.Request.Method != http.MethodGet {
		writeError(c, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	if err := s.requireInternalAuth(c.Request); err != nil {
		writeError(c, http.StatusUnauthorized, "unauthorized")
		return
	}
	if s.reindex == nil {
		writeError(c, http.StatusServiceUnavailable, "reindex not configured")
		return
	}
	id := strings.TrimSpace(c.Param("id"))
	if id == "" {
		writeError(c, http.StatusBadRequest, "invalid job id")
		return
	}
	job, ok := s.reindex.GetJob(id)
	if !ok {
		writeError(c, http.StatusNotFound, "job not found")
		return
	}
	writeOK(c, job)
}

func splitTags(raw string) []string {
	if raw == "" {
		return []string{}
	}
	parts := strings.FieldsFunc(raw, func(r rune) bool {
		return r == ',' || r == ';' || r == ' ' || r == '\n' || r == '\r' || r == '\t'
	})
	out := make([]string, 0, len(parts))
	seen := map[string]struct{}{}
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		if _, ok := seen[p]; ok {
			continue
		}
		seen[p] = struct{}{}
		out = append(out, p)
	}
	return out
}

func parseLimit(raw string, fallback int) int {
	if raw == "" {
		return fallback
	}
	n, err := parseInt(raw)
	if err != nil || n <= 0 {
		return fallback
	}
	if n > maxLimit {
		return maxLimit
	}
	return n
}

func parseInt(s string) (int, error) {
	n := 0
	for _, r := range s {
		if r < '0' || r > '9' {
			return 0, errInvalidNumber
		}
		n = n*10 + int(r-'0')
	}
	return n, nil
}

var errInvalidNumber = &parseError{msg: "invalid number"}

type parseError struct{ msg string }

func (e *parseError) Error() string { return e.msg }

type assetCreateRequest struct {
	ID               string           `json:"id"`
	CreatorUserID    string           `json:"creator_user_id"`
	Name             string           `json:"name"`
	AssetType        string           `json:"asset_type"`
	PrimaryContent   map[string]any   `json:"primary_content"`
	Properties       map[string]any   `json:"properties"`
	Files            []map[string]any `json:"files"`
	Media            string           `json:"media"`
	Thumbnail        string           `json:"thumbnail"`
	Keywords         string           `json:"keywords"`
	Status           string           `json:"status"`
	Extra            map[string]any   `json:"extra"`
	TagIDs           []string         `json:"tag_ids"`
	CreatedTimestamp int64            `json:"created_timestamp"`
	UpdatedTimestamp int64            `json:"updated_timestamp"`
}

type tagCreateRequest struct {
	ID               string         `json:"id"`
	Name             string         `json:"name"`
	Color            string         `json:"color"`
	Extra            map[string]any `json:"extra"`
	CreatedTimestamp int64          `json:"created_timestamp"`
	UpdatedTimestamp int64          `json:"updated_timestamp"`
}

type viewCreateRequest struct {
	ID               string         `json:"id"`
	Name             string         `json:"name"`
	Description      string         `json:"description"`
	IconURL          string         `json:"icon_url"`
	ParentID         string         `json:"parent_id"`
	Path             string         `json:"path"`
	Level            int            `json:"level"`
	Sort             int            `json:"sort"`
	DisplayConfig    map[string]any `json:"display_config"`
	CreatedTimestamp int64          `json:"created_timestamp"`
	UpdatedTimestamp int64          `json:"updated_timestamp"`
}

type tagListRequest struct {
	TagIDs []string `json:"tag_ids"`
}

type reindexRequest struct {
	AppIDs      []string `json:"app_ids"`
	All         bool     `json:"all"`
	BatchSize   int      `json:"batch_size"`
	DeleteIndex *bool    `json:"delete_index"`
	CreateIndex *bool    `json:"create_index"`
	Refresh     *bool    `json:"refresh"`
}

func parseAssetUpdates(r *http.Request) (map[string]any, []string, bool, error) {
	var raw map[string]json.RawMessage
	if err := readJSON(r, &raw); err != nil {
		return nil, nil, false, errorsNew("invalid json")
	}
	updates := map[string]any{}
	tagIDs := []string{}
	hasTags := false

	for key, value := range raw {
		switch key {
		case "name", "asset_type", "media", "thumbnail", "keywords", "status":
			var v *string
			if err := json.Unmarshal(value, &v); err != nil {
				return nil, nil, false, errorsNew("invalid " + key)
			}
			updates[key] = stringOrNil(v)
		case "primary_content", "properties", "files", "extra":
			if isNullJSON(value) {
				updates[key] = nil
				continue
			}
			var v any
			if err := json.Unmarshal(value, &v); err != nil {
				return nil, nil, false, errorsNew("invalid " + key)
			}
			updates[key] = v
		case "tag_ids":
			if err := json.Unmarshal(value, &tagIDs); err != nil {
				return nil, nil, false, errorsNew("invalid tag_ids")
			}
			hasTags = true
		}
	}
	return updates, tagIDs, hasTags, nil
}

func parseViewUpdates(r *http.Request) (map[string]any, error) {
	var raw map[string]json.RawMessage
	if err := readJSON(r, &raw); err != nil {
		return nil, errorsNew("invalid json")
	}
	updates := map[string]any{}
	for key, value := range raw {
		switch key {
		case "name", "description", "icon_url", "parent_id", "path":
			var v *string
			if err := json.Unmarshal(value, &v); err != nil {
				return nil, errorsNew("invalid " + key)
			}
			updates[key] = stringOrNil(v)
		case "level", "sort":
			var v *int
			if err := json.Unmarshal(value, &v); err != nil {
				return nil, errorsNew("invalid " + key)
			}
			if v == nil {
				updates[key] = nil
			} else {
				updates[key] = *v
			}
		case "display_config":
			if isNullJSON(value) {
				updates[key] = nil
				continue
			}
			var v any
			if err := json.Unmarshal(value, &v); err != nil {
				return nil, errorsNew("invalid display_config")
			}
			updates[key] = v
		}
	}
	return updates, nil
}

func stringOrNil(v *string) any {
	if v == nil {
		return nil
	}
	if strings.TrimSpace(*v) == "" {
		return nil
	}
	return *v
}

func normalizeName(name string) string {
	return strings.ToLower(strings.TrimSpace(name))
}

func nowMillis() int64 {
	return time.Now().UnixMilli()
}

func boolOrDefault(value *bool, fallback bool) bool {
	if value == nil {
		return fallback
	}
	return *value
}

func errorsNew(msg string) error {
	return &parseError{msg: msg}
}

func isNullJSON(v []byte) bool {
	return strings.TrimSpace(string(v)) == "null"
}
