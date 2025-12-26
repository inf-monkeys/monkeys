package search

import (
  "crypto/hmac"
  "crypto/sha256"
  "encoding/base64"
  "encoding/hex"
  "encoding/json"
  "errors"
  "sort"
  "strings"
)

type pageTokenPayload struct {
  Version     int    `json:"v"`
  Anchor      int64  `json:"a"`
  LastUpdated int64  `json:"u"`
  LastID      string `json:"i"`
  TagsHash    string `json:"h"`
  AppID       string `json:"app"`
  TeamID      string `json:"team"`
}

func encodePageToken(secret []byte, payload pageTokenPayload) (string, error) {
  raw, err := json.Marshal(payload)
  if err != nil {
    return "", err
  }
  encoded := base64.RawURLEncoding.EncodeToString(raw)
  if len(secret) == 0 {
    return encoded, nil
  }
  mac := hmac.New(sha256.New, secret)
  mac.Write([]byte(encoded))
  sig := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
  return encoded + "." + sig, nil
}

func decodePageToken(secret []byte, token string) (pageTokenPayload, error) {
  if token == "" {
    return pageTokenPayload{}, errors.New("page_token required")
  }
  parts := strings.Split(token, ".")
  payloadPart := parts[0]
  if len(secret) == 0 {
    if len(parts) != 1 {
      return pageTokenPayload{}, errors.New("invalid page_token")
    }
    return decodePayload(payloadPart)
  }
  if len(parts) != 2 {
    return pageTokenPayload{}, errors.New("invalid page_token")
  }
  mac := hmac.New(sha256.New, secret)
  mac.Write([]byte(payloadPart))
  expected := mac.Sum(nil)
  sig, err := base64.RawURLEncoding.DecodeString(parts[1])
  if err != nil {
    return pageTokenPayload{}, errors.New("invalid page_token")
  }
  if !hmac.Equal(sig, expected) {
    return pageTokenPayload{}, errors.New("invalid page_token")
  }
  return decodePayload(payloadPart)
}

func decodePayload(payloadPart string) (pageTokenPayload, error) {
  raw, err := base64.RawURLEncoding.DecodeString(payloadPart)
  if err != nil {
    return pageTokenPayload{}, errors.New("invalid page_token")
  }
  var payload pageTokenPayload
  if err := json.Unmarshal(raw, &payload); err != nil {
    return pageTokenPayload{}, errors.New("invalid page_token")
  }
  if payload.Version == 0 {
    payload.Version = 1
  }
  return payload, nil
}

func normalizeTags(tags []string) []string {
  out := make([]string, 0, len(tags))
  seen := map[string]struct{}{}
  for _, tag := range tags {
    tag = strings.TrimSpace(tag)
    if tag == "" {
      continue
    }
    if _, ok := seen[tag]; ok {
      continue
    }
    seen[tag] = struct{}{}
    out = append(out, tag)
  }
  sort.Strings(out)
  return out
}

func normalizeGroups(groups [][]string) [][]string {
  out := make([][]string, 0, len(groups))
  for _, group := range groups {
    normalized := normalizeTags(group)
    if len(normalized) == 0 {
      continue
    }
    out = append(out, normalized)
  }
  sort.Slice(out, func(i, j int) bool {
    return strings.Join(out[i], ",") < strings.Join(out[j], ",")
  })
  return out
}

func hashQuery(groups [][]string, userTags []string, name string) string {
  parts := []string{}
  for _, group := range groups {
    parts = append(parts, strings.Join(group, ","))
  }
  parts = append(parts, "|")
  parts = append(parts, strings.Join(userTags, ","))
  parts = append(parts, "|")
  parts = append(parts, name)
  raw := strings.Join(parts, ";")
  sum := sha256.Sum256([]byte(raw))
  return hex.EncodeToString(sum[:])
}
