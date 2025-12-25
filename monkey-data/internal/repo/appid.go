package repo

import (
	"context"
	"errors"
	"sort"
	"strings"
)

const outboxTableSuffix = "_data_outbox_events_v2"

// ListAppIDs scans existing outbox tables and returns discovered app_id prefixes.
func (s *PGStore) ListAppIDs(ctx context.Context) ([]string, error) {
	if s.pool == nil {
		return nil, errors.New("pg pool not configured")
	}

	rows, err := s.pool.Query(ctx, `
    SELECT tablename
    FROM pg_catalog.pg_tables
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      AND RIGHT(tablename, char_length($1)) = $1
  `, outboxTableSuffix)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	seen := map[string]struct{}{}
	for rows.Next() {
		var tableName string
		if err := rows.Scan(&tableName); err != nil {
			return nil, err
		}
		appID := strings.TrimSuffix(tableName, outboxTableSuffix)
		if appID == "" || appID == tableName {
			continue
		}
		if !appIDPattern.MatchString(appID) {
			continue
		}
		seen[appID] = struct{}{}
	}
	if rows.Err() != nil {
		return nil, rows.Err()
	}

	appIDs := make([]string, 0, len(seen))
	for id := range seen {
		appIDs = append(appIDs, id)
	}
	sort.Strings(appIDs)
	return appIDs, nil
}
