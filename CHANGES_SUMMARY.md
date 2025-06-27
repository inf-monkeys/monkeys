# Tenant API 字段升级总结

## 变更概述

本次升级将原有的 `output` 和 `input` 字段分别重命名为 `rawOutput` 和 `rawInput`，并新增了处理后的 `output` 和 `input` 字段，结构与 `GET /api/workflow/executions/:workflowId/outputs` 保持一致。

## 涉及接口

1. `POST /api/tenant/outputs`
2. `POST /api/tenant/teams/:teamId/workflow-executions/search`

## 新字段结构

### Output 类型
```typescript
type Output = {
  data: string;
  type: 'image' | 'video' | 'text' | 'json';
  key: string;
};
```

### Input 类型
```typescript
type Input = {
  data: string | number | boolean;
  displayName: string | I18nValue;
  type: 'string' | 'number' | 'boolean' | 'file';
  flag: boolean;
};
```

### I18nValue 类型
```typescript
type I18nValue = {
  'zh-CN': string;
  'en-US': string;
};
```

### Execution 类型
```typescript
type Execution = {
  workflowId: string;
  workflowInstanceId: string;
  input: Input[];
  rawInput: any;
  output: Output[];
  rawOutput: any;
  extraMetadata: ExtraMetadata | undefined;
  searchableText: string;
};
```

## 新增功能

### 1. searchableText 模糊搜索
- 支持对 `searchableText` 字段进行模糊搜索
- 使用 SQL `ILIKE` 操作符实现

### 2. extraMetadata 数组查询
- 支持 `extraMetadata` 的数组查询（IN 查询）
- 兼容原有的对象查询方式
- 支持 TypeORM 的 `In()` 操作

## 实现细节

### 字段处理逻辑
- `output` 字段：使用 `flattenKeys`、`extractImageUrls`、`extractVideoUrls` 等工具函数处理
- `input` 字段：根据 workflow 定义中的 variables 进行格式化
- `searchableText`：自动生成包含 workflowId、workflowInstanceId、status、extraMetadata 的搜索文本

### 查询优化
- 支持 `extraMetadata` 的数组查询
- 支持 `searchableText` 的模糊搜索
- 保持原有的分页和排序功能

## 测试

使用 `test_tenant_api.js` 脚本进行测试：

```bash
# 安装依赖
npm install axios

# 修改脚本中的 TOKEN 和 teamId
# 运行测试
node test_tenant_api.js
```

## 兼容性

- 保持向后兼容，原有字段重命名为 `rawOutput` 和 `rawInput`
- 新增字段不影响现有功能
- 查询参数支持新旧两种格式 