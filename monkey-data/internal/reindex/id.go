package reindex

import (
	"math/rand"
	"sync"
	"time"

	"github.com/oklog/ulid/v2"
)

var (
	jobIDMu      sync.Mutex
	jobIDEntropy = ulid.Monotonic(rand.New(rand.NewSource(time.Now().UnixNano())), 0)
)

func newID() (string, error) {
	jobIDMu.Lock()
	defer jobIDMu.Unlock()
	id, err := ulid.New(ulid.Timestamp(time.Now()), jobIDEntropy)
	if err != nil {
		return "", err
	}
	return id.String(), nil
}
