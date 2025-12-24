package repo

import (
  "math/rand"
  "sync"
  "time"

  "github.com/oklog/ulid/v2"
)

var (
  ulidMu      sync.Mutex
  ulidEntropy = ulid.Monotonic(rand.New(rand.NewSource(time.Now().UnixNano())), 0)
)

func newID() (string, error) {
  ulidMu.Lock()
  defer ulidMu.Unlock()
  id, err := ulid.New(ulid.Timestamp(time.Now()), ulidEntropy)
  if err != nil {
    return "", err
  }
  return id.String(), nil
}
