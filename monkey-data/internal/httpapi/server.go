package httpapi

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"monkey-data/internal/config"
	"monkey-data/internal/reindex"
	"monkey-data/internal/service"
)

type Server struct {
	cfg      config.Config
	service  *service.Service
	reindex  *reindex.Manager
	engine   *gin.Engine
}

type apiResponse struct {
	Code string `json:"code"`
	Data any    `json:"data"`
}

type errorData struct {
	Message string `json:"message"`
}

const (
	codeOK               = "OK"
	codeInvalidArgument  = "INVALID_ARGUMENT"
	codeUnauthorized     = "UNAUTHORIZED"
	codeNotFound         = "NOT_FOUND"
	codeConflict         = "CONFLICT"
	codeMethodNotAllowed = "METHOD_NOT_ALLOWED"
	codeInternal         = "INTERNAL"
)

func NewServer(cfg config.Config, svc *service.Service, reindexer *reindex.Manager) *Server {
	s := &Server{cfg: cfg, service: svc, reindex: reindexer, engine: gin.New()}
	s.routes()
	return s
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	s.engine.ServeHTTP(w, r)
}

func (s *Server) routes() {
	s.engine.Any("/healthz", s.handleHealthz)
	s.engine.Any("/readyz", s.handleReadyz)

	s.engine.Any("/v2/assets/search", s.handleSearchAssets)
	s.engine.Any("/v2/assets", s.handleAssets)
	s.engine.Any("/v2/assets/", s.handleAssetByID)
	s.engine.Any("/v2/assets/:id", s.handleAssetByID)

	s.engine.Any("/v2/tags", s.handleTags)
	s.engine.Any("/v2/tags/", s.handleTagByID)
	s.engine.Any("/v2/tags/:id", s.handleTagByID)

	s.engine.Any("/v2/views/tree", s.handleViewTree)
	s.engine.Any("/v2/views", s.handleViews)
	s.engine.Any("/v2/views/", s.handleViewByID)
	s.engine.Any("/v2/views/:id/tags", s.handleViewTags)
	s.engine.Any("/v2/views/:id", s.handleViewByID)

	s.engine.Any("/v2/index/app-ids", s.handleIndexAppIDs)
	s.engine.Any("/v2/index/rebuild", s.handleIndexRebuild)
	s.engine.Any("/v2/index/jobs/:id", s.handleIndexJob)
}

func (s *Server) requireInternalAuth(r *http.Request) error {
	if s.cfg.InternalToken == "" {
		return nil
	}
	if r.Header.Get("X-Internal-Token") != s.cfg.InternalToken {
		return errors.New("unauthorized")
	}
	return nil
}

func (s *Server) getAppAndTeam(r *http.Request) (string, string, error) {
	appID := strings.TrimSpace(r.Header.Get(s.cfg.AppIDHeader))
	teamID := strings.TrimSpace(r.Header.Get(s.cfg.TeamIDHeader))
	if appID == "" {
		return "", "", errors.New("app_id required")
	}
	if teamID == "" {
		return "", "", errors.New("team_id required")
	}
	return appID, teamID, nil
}

func writeResponse(c *gin.Context, status int, code string, data any) {
	c.JSON(status, apiResponse{Code: code, Data: data})
}

func writeOK(c *gin.Context, data any) {
	writeResponse(c, http.StatusOK, codeOK, data)
}

func writeError(c *gin.Context, status int, message string) {
	code := codeForStatus(status)
	writeResponse(c, status, code, errorData{Message: message})
}

func codeForStatus(status int) string {
	switch status {
	case http.StatusUnauthorized:
		return codeUnauthorized
	case http.StatusNotFound:
		return codeNotFound
	case http.StatusConflict:
		return codeConflict
	case http.StatusMethodNotAllowed:
		return codeMethodNotAllowed
	case http.StatusBadRequest:
		return codeInvalidArgument
	default:
		return codeInternal
	}
}

func readJSON(r *http.Request, dst any) error {
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	return dec.Decode(dst)
}
