package repo

import (
  "errors"
  "regexp"
  "strings"
)

var appIDPattern = regexp.MustCompile(`^[A-Za-z0-9_]+$`)

func validateAppID(appID string) error {
  if appID == "" {
    return errors.New("app_id required")
  }
  if !appIDPattern.MatchString(appID) {
    return errors.New("invalid app_id")
  }
  return nil
}

func tableName(appID, base string) (string, error) {
  if err := validateAppID(appID); err != nil {
    return "", err
  }
  return `"` + strings.TrimSpace(appID) + "_" + base + `"`, nil
}
