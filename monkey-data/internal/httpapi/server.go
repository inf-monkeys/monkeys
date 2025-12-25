package httpapi

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"monkey-data/internal/config"
	"monkey-data/internal/service"
)

type Server struct {
	cfg     config.Config
	service *service.Service
	mux     *http.ServeMux
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

func NewServer(cfg config.Config, svc *service.Service) *Server {
	s := &Server{cfg: cfg, service: svc, mux: http.NewServeMux()}
	s.routes()
	return s
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	s.mux.ServeHTTP(w, r)
}

func (s *Server) routes() {
	s.mux.HandleFunc("/healthz", s.handleHealthz)
	s.mux.HandleFunc("/readyz", s.handleReadyz)
	s.mux.HandleFunc("/v2/assets/search", s.handleSearchAssets)
	s.mux.HandleFunc("/v2/assets/", s.handleAssetByID)
	s.mux.HandleFunc("/v2/assets", s.handleAssets)

	s.mux.HandleFunc("/v2/tags/", s.handleTagByID)
	s.mux.HandleFunc("/v2/tags", s.handleTags)

	s.mux.HandleFunc("/v2/views/tree", s.handleViewTree)
	s.mux.HandleFunc("/v2/views/", s.handleViewByID)
	s.mux.HandleFunc("/v2/views", s.handleViews)
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

func writeResponse(w http.ResponseWriter, status int, code string, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(apiResponse{Code: code, Data: data})
}

func writeOK(w http.ResponseWriter, data any) {
	writeResponse(w, http.StatusOK, codeOK, data)
}

func writeError(w http.ResponseWriter, status int, message string) {
	code := codeForStatus(status)
	writeResponse(w, status, code, errorData{Message: message})
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

func extractID(path, prefix string) string {
	if !strings.HasPrefix(path, prefix) {
		return ""
	}
	return strings.TrimPrefix(path, prefix)
}
