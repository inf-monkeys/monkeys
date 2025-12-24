package repo

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
)

type OutboxEvent struct {
	EventID     int64
	TeamID      string
	AggregateID string
	EventType   string
}

func (s *PGStore) insertOutboxEvent(ctx context.Context, tx pgx.Tx, appID, teamID, assetID, eventType string) error {
	outboxTable, err := tableName(appID, "data_outbox_events_v2")
	if err != nil {
		return err
	}
	payload, err := toJSONB(map[string]any{"asset_id": assetID})
	if err != nil {
		return err
	}
	now := nowMillis()
	_, err = tx.Exec(ctx,
		fmt.Sprintf(`INSERT INTO %s (team_id, aggregate_id, event_type, payload, created_timestamp, retry_count) VALUES ($1,$2,$3,$4,$5,0)`, outboxTable),
		teamID, assetID, eventType, payload, now,
	)
	return err
}

func (s *PGStore) LockOutboxBatch(ctx context.Context, appID, workerID string, limit int, lockTimeout time.Duration) ([]OutboxEvent, error) {
	if s.pool == nil {
		return nil, errors.New("pg pool not configured")
	}
	outboxTable, err := tableName(appID, "data_outbox_events_v2")
	if err != nil {
		return nil, err
	}
	if limit <= 0 {
		limit = 100
	}
	lockBefore := nowMillis() - lockTimeout.Milliseconds()

	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return nil, err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback(ctx)
		}
	}()

	rows, err := tx.Query(ctx,
		fmt.Sprintf(`SELECT event_id, team_id, aggregate_id, event_type
      FROM %s
      WHERE processed_timestamp IS NULL
        AND (locked_at IS NULL OR locked_at < $1)
      ORDER BY event_id ASC
      LIMIT $2
      FOR UPDATE SKIP LOCKED`, outboxTable),
		lockBefore, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	events := []OutboxEvent{}
	for rows.Next() {
		var ev OutboxEvent
		if err := rows.Scan(&ev.EventID, &ev.TeamID, &ev.AggregateID, &ev.EventType); err != nil {
			return nil, err
		}
		events = append(events, ev)
	}
	if rows.Err() != nil {
		return nil, rows.Err()
	}

	if len(events) > 0 {
		ids := make([]int64, 0, len(events))
		for _, ev := range events {
			ids = append(ids, ev.EventID)
		}
		_, err = tx.Exec(ctx,
			fmt.Sprintf(`UPDATE %s SET locked_at=$1, locked_by=$2 WHERE event_id = ANY($3)`, outboxTable),
			nowMillis(), workerID, pgx.Array(ids),
		)
		if err != nil {
			return nil, err
		}
	}

	err = tx.Commit(ctx)
	if err != nil {
		return nil, err
	}
	return events, nil
}

func (s *PGStore) MarkOutboxProcessed(ctx context.Context, appID string, eventIDs []int64) error {
	if s.pool == nil {
		return errors.New("pg pool not configured")
	}
	if len(eventIDs) == 0 {
		return nil
	}
	outboxTable, err := tableName(appID, "data_outbox_events_v2")
	if err != nil {
		return err
	}
	_, err = s.pool.Exec(ctx,
		fmt.Sprintf(`UPDATE %s SET processed_timestamp=$1, locked_at=NULL, locked_by=NULL WHERE event_id = ANY($2)`, outboxTable),
		nowMillis(), pgx.Array(eventIDs),
	)
	return err
}

func (s *PGStore) MarkOutboxFailed(ctx context.Context, appID, workerID string, eventIDs []int64) error {
	if s.pool == nil {
		return errors.New("pg pool not configured")
	}
	if len(eventIDs) == 0 {
		return nil
	}
	outboxTable, err := tableName(appID, "data_outbox_events_v2")
	if err != nil {
		return err
	}
	_, err = s.pool.Exec(ctx,
		fmt.Sprintf(`UPDATE %s SET retry_count=retry_count+1, locked_at=$1, locked_by=$2 WHERE event_id = ANY($3)`, outboxTable),
		nowMillis(), workerID, pgx.Array(eventIDs),
	)
	return err
}
