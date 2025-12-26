package reindex

import (
	"context"
	"errors"
	"fmt"
	"sort"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"monkey-data/internal/repo"
)

const (
	JobStatusRunning = "running"
	JobStatusDone    = "done"
	JobStatusFailed  = "failed"

	ItemStatusQueued  = "queued"
	ItemStatusRunning = "running"
	ItemStatusDone    = "done"
	ItemStatusFailed  = "failed"
)

type JobSnapshot struct {
	ID                 string             `json:"id"`
	Status             string             `json:"status"`
	CreatedTimestamp   int64              `json:"created_timestamp"`
	StartedTimestamp   int64              `json:"started_timestamp"`
	CompletedTimestamp int64              `json:"completed_timestamp"`
	AppIDs             []string           `json:"app_ids"`
	Items              []JobItemSnapshot  `json:"items"`
	Error              string             `json:"error,omitempty"`
}

type JobItemSnapshot struct {
	AppID     string `json:"app_id"`
	Status    string `json:"status"`
	Total     int64  `json:"total"`
	Processed int64  `json:"processed"`
	Error     string `json:"error,omitempty"`
}

type Manager struct {
	reindexer     *Reindexer
	maxConcurrent int
	sem           chan struct{}
	mu            sync.Mutex
	jobs          map[string]*jobState
	runningAppIDs map[string]string
}

type jobState struct {
	id        string
	status    string
	createdAt int64
	startedAt int64
	endedAt   int64
	appIDs    []string
	items     map[string]*jobItem
	errMsg    string
}

type jobItem struct {
	appID     string
	status    string
	total     int64
	processed int64
	errMsg    string
}

func NewManager(reindexer *Reindexer, maxConcurrent int) *Manager {
	if maxConcurrent <= 0 {
		maxConcurrent = 1
	}
	return &Manager{
		reindexer:     reindexer,
		maxConcurrent: maxConcurrent,
		sem:           make(chan struct{}, maxConcurrent),
		jobs:          map[string]*jobState{},
		runningAppIDs: map[string]string{},
	}
}

func (m *Manager) ListAppIDs(ctx context.Context) ([]string, error) {
	if m == nil || m.reindexer == nil {
		return nil, errors.New("reindex not configured")
	}
	return m.reindexer.DiscoverAppIDs(ctx)
}

func (m *Manager) StartRebuild(appIDs []string, opts Options) (JobSnapshot, error) {
	if m == nil || m.reindexer == nil {
		return JobSnapshot{}, errors.New("reindex not configured")
	}

	normalized, err := normalizeAppIDs(appIDs)
	if err != nil {
		return JobSnapshot{}, err
	}
	if len(normalized) == 0 {
		return JobSnapshot{}, errors.New("app_ids required")
	}

	m.mu.Lock()
	for _, appID := range normalized {
		if jobID, ok := m.runningAppIDs[appID]; ok {
			m.mu.Unlock()
			return JobSnapshot{}, fmt.Errorf("app_id %s already running (job %s)", appID, jobID)
		}
	}
	jobID, err := newID()
	if err != nil {
		m.mu.Unlock()
		return JobSnapshot{}, err
	}

	job := &jobState{
		id:        jobID,
		status:    JobStatusRunning,
		createdAt: nowMillis(),
		startedAt: nowMillis(),
		appIDs:    normalized,
		items:     map[string]*jobItem{},
	}
	for _, appID := range normalized {
		job.items[appID] = &jobItem{
			appID:  appID,
			status: ItemStatusQueued,
		}
		m.runningAppIDs[appID] = jobID
	}
	m.jobs[jobID] = job
	m.mu.Unlock()

	go m.runJob(jobID, normalized, opts)

	return m.snapshot(job), nil
}

func (m *Manager) GetJob(id string) (JobSnapshot, bool) {
	m.mu.Lock()
	defer m.mu.Unlock()
	job, ok := m.jobs[id]
	if !ok {
		return JobSnapshot{}, false
	}
	return m.snapshot(job), true
}

func (m *Manager) runJob(jobID string, appIDs []string, opts Options) {
	var hasError int32
	var wg sync.WaitGroup

	for _, appID := range appIDs {
		appID := appID
		wg.Add(1)
		go func() {
			defer wg.Done()
			m.sem <- struct{}{}
			defer func() { <-m.sem }()

			m.setItemStatus(jobID, appID, ItemStatusRunning)
			err := m.reindexer.Rebuild(context.Background(), appID, opts, func(p Progress) {
				m.updateItemProgress(jobID, appID, p)
			})
			if err != nil {
				atomic.StoreInt32(&hasError, 1)
				m.setItemError(jobID, appID, err)
			}
			if err == nil {
				m.setItemStatus(jobID, appID, ItemStatusDone)
			} else {
				m.setItemStatus(jobID, appID, ItemStatusFailed)
			}
			m.clearRunning(appID)
		}()
	}

	wg.Wait()

	m.mu.Lock()
	defer m.mu.Unlock()
	job := m.jobs[jobID]
	if job == nil {
		return
	}
	job.endedAt = nowMillis()
	if hasError == 1 {
		job.status = JobStatusFailed
		if job.errMsg == "" {
			job.errMsg = "one or more app_id failed"
		}
	} else {
		job.status = JobStatusDone
	}
}

func (m *Manager) setItemStatus(jobID, appID, status string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	job := m.jobs[jobID]
	if job == nil {
		return
	}
	item := job.items[appID]
	if item == nil {
		return
	}
	item.status = status
}

func (m *Manager) setItemError(jobID, appID string, err error) {
	if err == nil {
		return
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	job := m.jobs[jobID]
	if job == nil {
		return
	}
	item := job.items[appID]
	if item == nil {
		return
	}
	item.errMsg = err.Error()
	if job.errMsg == "" {
		job.errMsg = err.Error()
	}
}

func (m *Manager) updateItemProgress(jobID, appID string, p Progress) {
	m.mu.Lock()
	defer m.mu.Unlock()
	job := m.jobs[jobID]
	if job == nil {
		return
	}
	item := job.items[appID]
	if item == nil {
		return
	}
	if p.Total > 0 {
		item.total = p.Total
	}
	item.processed = p.Processed
}

func (m *Manager) clearRunning(appID string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.runningAppIDs, appID)
}

func (m *Manager) snapshot(job *jobState) JobSnapshot {
	items := make([]JobItemSnapshot, 0, len(job.items))
	for _, appID := range job.appIDs {
		item := job.items[appID]
		if item == nil {
			continue
		}
		items = append(items, JobItemSnapshot{
			AppID:     item.appID,
			Status:    item.status,
			Total:     item.total,
			Processed: item.processed,
			Error:     item.errMsg,
		})
	}

	return JobSnapshot{
		ID:                 job.id,
		Status:             job.status,
		CreatedTimestamp:   job.createdAt,
		StartedTimestamp:   job.startedAt,
		CompletedTimestamp: job.endedAt,
		AppIDs:             append([]string{}, job.appIDs...),
		Items:              items,
		Error:              job.errMsg,
	}
}

func normalizeAppIDs(appIDs []string) ([]string, error) {
	seen := map[string]struct{}{}
	out := make([]string, 0, len(appIDs))
	for _, raw := range appIDs {
		appID := strings.TrimSpace(raw)
		if appID == "" {
			continue
		}
		if err := repo.ValidateAppID(appID); err != nil {
			return nil, err
		}
		if _, ok := seen[appID]; ok {
			continue
		}
		seen[appID] = struct{}{}
		out = append(out, appID)
	}
	sort.Strings(out)
	return out, nil
}

func nowMillis() int64 {
	return time.Now().UnixMilli()
}
