# Workflow Batch Editor - 使用示例

## 快速开始

### 前置条件
```bash
# 确保服务已启动
cd /Users/honker233/ZaoWuYun/monkeys
npm run start:dev

# 获取认证 token（替换为实际的登录接口）
TOKEN="your_bearer_token_here"
```

## 示例 1: 批量重命名工作流

### 场景
你有 10 个工作流，名字都包含 "upload image"，现在想统一改成 "upload model"。

### 步骤 1: 预览修改
```bash
curl -X POST http://localhost:33002/workflow-batch-editor/batch-rename \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "displayNamePattern": "upload image"
    },
    "renamePattern": {
      "search": "upload image",
      "replace": "upload model",
      "useRegex": false,
      "caseSensitive": false
    },
    "dryRun": true
  }'
```

### 步骤 2: 查看预览结果
```json
{
  "affectedWorkflows": [
    {
      "workflowId": "workflow_001",
      "oldDisplayName": { "en": "My upload image workflow", "zh": "我的上传图片工作流" },
      "newDisplayName": { "en": "My upload model workflow", "zh": "我的上传模型工作流" },
      "version": 2
    },
    // ... 更多工作流
  ],
  "totalAffected": 10,
  "isDryRun": true
}
```

### 步骤 3: 确认无误后执行
```bash
curl -X POST http://localhost:33002/workflow-batch-editor/batch-rename \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "displayNamePattern": "upload image"
    },
    "renamePattern": {
      "search": "upload image",
      "replace": "upload model",
      "useRegex": false,
      "caseSensitive": false
    },
    "dryRun": false
  }'
```

---

## 示例 2: 批量修改参数（使用 AI）

### 场景
你有 20 个使用 Gemini 3 Pro 生图的工作流，想把所有的宽高比改成 1:1，生成数量改成 2。

### 使用 AI 辅助编辑（最简单）
```bash
curl -X POST http://localhost:33002/workflow-batch-editor/ai-assisted-edit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "naturalLanguageRequest": "把所有 Gemini 生图的 ratio 改成 1:1，数量改成 2",
    "dryRun": true
  }'
```

### AI 响应
```json
{
  "parsedPlan": {
    "operationType": "update_params",
    "confidence": 0.9,
    "filter": {
      "toolName": "gemini_3_pro_image_generate",
      "toolNamespace": "third_party_api"
    },
    "operations": [
      {
        "type": "update_param",
        "target": "aspect_ratio",
        "newValue": "1:1",
        "mode": "override"
      },
      {
        "type": "update_param",
        "target": "num_images",
        "newValue": 2,
        "mode": "override"
      }
    ],
    "reasoning": "用户想要修改所有使用 Gemini 生图工具的工作流，将宽高比改为 1:1，生成数量改为 2"
  },
  "previewChanges": [
    {
      "workflowId": "workflow_101",
      "workflowName": "Gemini生图-科技风",
      "changes": [
        {
          "field": "generate_image_1.aspect_ratio",
          "before": "16:9",
          "after": "1:1"
        },
        {
          "field": "generate_image_1.num_images",
          "before": 1,
          "after": 2
        }
      ]
    }
    // ... 更多工作流
  ],
  "totalAffected": 20,
  "isDryRun": true
}
```

### 确认后执行
```bash
# 只需将 dryRun 改为 false
curl -X POST http://localhost:33002/workflow-batch-editor/ai-assisted-edit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "naturalLanguageRequest": "把所有 Gemini 生图的 ratio 改成 1:1，数量改成 2",
    "dryRun": false
  }'
```

---

## 示例 3: 批量修改多个参数

### 场景
你有一批 jimeng 生图的工作流，需要统一配置：
- 宽高比: 16:9
- 分辨率: 1920x1080
- 生成数量: 2

### 方法 1: 使用 AI（推荐）
```bash
curl -X POST http://localhost:33002/workflow-batch-editor/ai-assisted-edit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "naturalLanguageRequest": "把所有 jimeng 生图的工作流，宽高比改成 16:9，分辨率改成 1920x1080，数量改成 2",
    "dryRun": true
  }'
```

### 方法 2: 直接调用 API
```bash
curl -X POST http://localhost:33002/workflow-batch-editor/batch-update-parameters \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "toolName": "jimeng_image_generate",
      "toolNamespace": "third_party_api"
    },
    "parameterUpdates": [
      {
        "parameterName": "aspect_ratio",
        "newValue": "16:9",
        "mode": "override"
      },
      {
        "parameterName": "image_size",
        "newValue": "1920x1080",
        "mode": "override"
      },
      {
        "parameterName": "num_images",
        "newValue": 2,
        "mode": "override"
      }
    ],
    "dryRun": true,
    "autoValidate": true
  }'
```

---

## 示例 4: 只修改未设置的参数

### 场景
你想为所有工作流设置默认的生成数量为 2，但不覆盖已经手动设置过的。

### 使用 default 模式
```bash
curl -X POST http://localhost:33002/workflow-batch-editor/batch-update-parameters \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "toolName": "gemini_3_pro_image_generate"
    },
    "parameterUpdates": [
      {
        "parameterName": "num_images",
        "newValue": 2,
        "mode": "default"
      }
    ],
    "dryRun": true
  }'
```

**结果:**
- 如果某个工作流的 `num_images` 已经设置为 3，则保持 3 不变
- 如果某个工作流的 `num_images` 未设置或为空，则设置为 2

---

## 示例 5: 使用正则表达式重命名

### 场景
你想把所有以 "v1_" 开头的工作流名称改成 "v2_" 开头。

### 使用正则表达式
```bash
curl -X POST http://localhost:33002/workflow-batch-editor/batch-rename \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "displayNamePattern": "^v1_"
    },
    "renamePattern": {
      "search": "^v1_",
      "replace": "v2_",
      "useRegex": true,
      "caseSensitive": false
    },
    "dryRun": true
  }'
```

**示例结果:**
- `v1_gemini_workflow` → `v2_gemini_workflow`
- `v1_jimeng_workflow` → `v2_jimeng_workflow`

---

## 示例 6: 按工作流 ID 精确修改

### 场景
你只想修改 3 个特定的工作流。

### 直接指定工作流 ID
```bash
curl -X POST http://localhost:33002/workflow-batch-editor/batch-update-parameters \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "workflowIds": ["workflow_001", "workflow_002", "workflow_003"]
    },
    "parameterUpdates": [
      {
        "parameterName": "aspect_ratio",
        "newValue": "1:1",
        "mode": "override"
      }
    ],
    "dryRun": false
  }'
```

---

## 示例 7: 检查验证错误

### 场景
批量修改后，想确保所有工作流都是有效的。

### 启用自动验证
```bash
curl -X POST http://localhost:33002/workflow-batch-editor/batch-update-parameters \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "toolName": "gemini_3_pro_image_generate"
    },
    "parameterUpdates": [
      {
        "parameterName": "model",
        "newValue": "gemini-3.5-pro",
        "mode": "override"
      }
    ],
    "dryRun": true,
    "autoValidate": true
  }'
```

### 查看验证结果
```json
{
  "previewChanges": [
    {
      "workflowId": "workflow_101",
      "changes": [...],
      "validationIssues": [
        {
          "taskReferenceName": "generate_image_1",
          "issueType": "ERROR",
          "message": "工具不存在: gemini-3.5-pro"
        }
      ]
    }
  ]
}
```

如果有验证错误，修改会被阻止（在非 dry run 模式下）。

---

## 示例 8: AI 解析详情

### 场景
你想看 AI 是如何理解你的自然语言请求的。

### 启用解析详情
```bash
curl -X POST http://localhost:33002/workflow-batch-editor/ai-assisted-edit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "naturalLanguageRequest": "把所有生图工作流的默认提示词改成：高清，细节丰富，专业摄影",
    "dryRun": true,
    "includeParsingDetails": true
  }'
```

### 响应包含解析详情
```json
{
  "parsedPlan": { ... },
  "previewChanges": [ ... ],
  "parsingDetails": {
    "rawLlmResponse": "{ ... }",
    "extractedIntent": "用户想要修改所有生图工作流的 prompt 参数",
    "toolsAnalyzed": ["gemini_3_pro_image_generate", "jimeng_image_generate"]
  }
}
```

---

## 常用自然语言模板

### 重命名类
```bash
# 替换文本
"把所有名字包含 'xxx' 的工作流改成 'yyy'"

# 添加前缀
"给所有生图工作流加上前缀 'prod_'"

# 添加后缀
"给所有工作流名称加上后缀 '_v2'"
```

### 参数修改类
```bash
# 单个参数
"把所有 Gemini 的 ratio 改成 1:1"

# 多个参数
"把所有 jimeng 的宽高比改成 16:9，分辨率改成 1920x1080"

# 按工具类型
"把所有生图工具的默认数量改成 2"

# 按名称模糊匹配
"把所有名字包含'测试'的工作流的温度改成 0.7"
```

---

## 错误处理

### 处理部分失败
如果批量操作中某个工作流失败，整个事务会回滚：

```json
{
  "executionResult": {
    "successCount": 0,
    "failedCount": 5,
    "errors": [
      {
        "workflowId": "workflow_001",
        "error": "工作流验证失败: 参数类型不匹配"
      },
      {
        "workflowId": "workflow_002",
        "error": "找不到工具: gemini_4_pro"
      }
    ]
  }
}
```

**建议:**
1. 查看错误信息
2. 修正问题（如修改参数值、安装缺失的工具）
3. 重新执行

---

## 性能优化建议

### 大批量修改（100+ 工作流）
```bash
# 1. 先测试小范围
curl ... -d '{
  "filter": { "workflowIds": ["workflow_001", "workflow_002"] },
  ...
  "dryRun": true
}'

# 2. 确认无误后再扩大范围
curl ... -d '{
  "filter": { "toolName": "gemini_3_pro_image_generate" },
  ...
  "dryRun": false
}'

# 3. 分批执行（可选）
# 批次 1: 工作流 1-50
# 批次 2: 工作流 51-100
# ...
```

---

## 最佳实践

1. **总是先 Dry Run**: 预览结果，确认无误
2. **使用 AI 辅助**: 自然语言更直观，减少出错
3. **启用自动验证**: 确保修改后的工作流有效
4. **小范围测试**: 先在少量工作流上测试
5. **做好备份**: 重要修改前导出工作流备份

---

## 常见问题排查

### Q: AI 解析错误
**原因:** 自然语言描述不够清晰
**解决:**
- 使用更明确的工具名称
- 指定具体的参数名
- 改用直接 API 调用

### Q: 找不到匹配的工作流
**原因:** 过滤条件太严格
**解决:**
- 检查 `displayNamePattern` 是否正确
- 尝试更宽松的搜索条件
- 检查 `toolName` 和 `toolNamespace` 是否正确

### Q: 验证失败
**原因:** 参数值不合法
**解决:**
- 检查参数值的类型和格式
- 查看 `validationIssues` 了解具体问题
- 修正后重新执行

---

## 更多帮助

查看 [README.md](./README.md) 了解完整的 API 文档和技术细节。
