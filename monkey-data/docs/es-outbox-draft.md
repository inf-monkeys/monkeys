# ES 索引与 Outbox 草案

## ES 索引命名
- 索引名：${appId}_data_assets_v2
- 分片/副本：按环境配置（建议 3 shards / 1 replica 起步）

## Mapping 建议
```json
{
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1,
    "refresh_interval": "1s"
  },
  "mappings": {
    "dynamic": "false",
    "properties": {
      "asset_id": { "type": "keyword" },
      "team_id": { "type": "keyword" },
      "tag_ids": { "type": "keyword" },
      "asset_type": { "type": "keyword" },
      "status": { "type": "keyword" },
      "updated_timestamp": { "type": "long" },
      "created_timestamp": { "type": "long" }
    }
  }
}
```

## 查询语义（ES）
- view 默认过滤：OR(子树 view 的 tag 组)，组内 AND
- 用户追加 tag：AND
- team_id 强制过滤

示例（仅示意）：
```json
{
  "size": 20,
  "track_total_hits": false,
  "sort": [
    { "updated_timestamp": { "order": "desc" } },
    { "asset_id": { "order": "desc" } }
  ],
  "query": {
    "bool": {
      "filter": [
        { "term": { "team_id": "t1" } },
        {
          "bool": {
            "should": [
              { "bool": { "must": [ { "term": { "tag_ids": "tA" } }, { "term": { "tag_ids": "tB" } } ] } },
              { "bool": { "must": [ { "term": { "tag_ids": "tC" } } ] } }
            ],
            "minimum_should_match": 1
          }
        },
        { "term": { "tag_ids": "userTag1" } }
      ]
    }
  },
  "search_after": [1735000000000, "a1"]
}
```

## 分页
- 排序：updated_timestamp desc, asset_id desc
- 采用 search_after + page_token
- page_token 可含 last_sort 与 anchor（可选）

## Outbox 模式
- 资源写入/更新成功后写入 data_outbox_events_v2
- Indexer 轮询：SELECT ... FOR UPDATE SKIP LOCKED LIMIT N
- 批量 upsert 到 ES（Bulk API）
- 幂等：按 asset_id 覆盖写入
- 失败重试：retry_count + 退避，记录 last_error（可选）

### Outbox 事件类型建议
- data_asset.upsert
- data_asset.delete
- data_asset.tags_updated

### 处理流程建议
1) 事务内写 data_assets_v2 / data_asset_tag_relations_v2
2) 同一事务内写 outbox 事件
3) Indexer 拉取未处理事件，组装 ES 文档
4) Bulk upsert 成功后标记 processed_timestamp

## 可观测指标建议
- outbox_pending_count
- outbox_lag_ms
- es_bulk_latency_ms
- es_query_latency_ms
- search_p95_ms
