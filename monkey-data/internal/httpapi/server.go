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

func NewServer(cfg config.Config, svc *service.Service) *Server {
  s := &Server{cfg: cfg, service: svc, mux: http.NewServeMux()}
  s.routes()
  return s
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
  s.mux.ServeHTTP(w, r)
}

func (s *Server) routes() {
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

func writeJSON(w http.ResponseWriter, status int, payload any) {
  w.Header().Set("Content-Type", "application/json")
  w.WriteHeader(status)
  _ = json.NewEncoder(w).Encode(payload)
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
