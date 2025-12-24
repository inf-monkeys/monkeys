package model

// Asset represents the data_assets_v2 row.
type Asset struct {
  ID               string                 `json:"id"`
  TeamID           string                 `json:"team_id"`
  CreatorUserID    string                 `json:"creator_user_id,omitempty"`
  Name             string                 `json:"name"`
  AssetType        string                 `json:"asset_type"`
  PrimaryContent   map[string]any         `json:"primary_content"`
  Properties       map[string]any         `json:"properties,omitempty"`
  Files            []map[string]any       `json:"files,omitempty"`
  Media            string                 `json:"media,omitempty"`
  Thumbnail        string                 `json:"thumbnail,omitempty"`
  Keywords         string                 `json:"keywords,omitempty"`
  Status           string                 `json:"status"`
  Extra            map[string]any         `json:"extra,omitempty"`
  TagIDs           []string               `json:"tag_ids,omitempty"`
  CreatedTimestamp int64                  `json:"created_timestamp"`
  UpdatedTimestamp int64                  `json:"updated_timestamp"`
}

type Tag struct {
  ID               string         `json:"id"`
  TeamID           string         `json:"team_id"`
  Name             string         `json:"name"`
  NameNorm         string         `json:"name_norm"`
  Color            string         `json:"color,omitempty"`
  Extra            map[string]any `json:"extra,omitempty"`
  CreatedTimestamp int64          `json:"created_timestamp"`
  UpdatedTimestamp int64          `json:"updated_timestamp"`
}

type View struct {
  ID               string         `json:"id"`
  TeamID           string         `json:"team_id,omitempty"`
  Name             string         `json:"name"`
  Description      string         `json:"description,omitempty"`
  IconURL          string         `json:"icon_url,omitempty"`
  ParentID         string         `json:"parent_id,omitempty"`
  Path             string         `json:"path"`
  Level            int            `json:"level"`
  Sort             int            `json:"sort"`
  DisplayConfig    map[string]any `json:"display_config,omitempty"`
  CreatedTimestamp int64          `json:"created_timestamp"`
  UpdatedTimestamp int64          `json:"updated_timestamp"`
}
