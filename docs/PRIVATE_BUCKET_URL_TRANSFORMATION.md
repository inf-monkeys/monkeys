# 私有桶 URL 自动转换机制

## 概述

本文档说明如何在 Monkeys 系统中统一处理私有桶图片 URL，确保所有返回给前端的图片 URL 都是可访问的。

## 核心服务

### `MediaUrlTransformerService`

位置：`src/modules/assets/media/media.url-transformer.service.ts`

**功能**：
- 自动检测 URL 是否来自已注册的私有桶
- 如果是私有桶，自动转换为预签名 URL
- 如果不是，保持原 URL 不变

**使用方法**：

```typescript
import { MediaUrlTransformerService } from '@/modules/assets/media/media.url-transformer.service';

// 1. 转换单个 URL
const signedUrl = await this.urlTransformer.transformUrl(originalUrl);

// 2. 批量转换 URL 数组
const signedUrls = await this.urlTransformer.transformUrls([url1, url2, url3]);

// 3. 转换对象中的 URL 字段
const entity = await this.urlTransformer.transformUrlsInObject(
  teamEntity,
  ['iconUrl', 'darkmodeIconUrl']  // 指定要转换的字段
);

// 4. 批量转换对象数组
const entities = await this.urlTransformer.transformUrlsInObjects(
  teamEntities,
  ['iconUrl', 'darkmodeIconUrl']
);
```

---

## 适配指南

### 1. Repository 层适配

#### 示例：TeamRepository

**旧代码（基于 S3Helpers）：**

```typescript
private async refreshLogo(teams: TeamEntity[]) {
  const promises = teams.filter(Boolean).map(async (team) => {
    if (team.iconUrl) {
      try {
        const s3Helpers = new S3Helpers();
        const { refreshed, refreshedUrl } = await s3Helpers.refreshSignedUrl(team.iconUrl);
        if (refreshed) {
          team.iconUrl = refreshedUrl;
          await this.teamRepository.save(team);
        }
      } catch (e) {}
    }
  });
  await Promise.all(promises);
}
```

**新代码（使用 MediaUrlTransformerService）：**

```typescript
import { MediaUrlTransformerService } from '@/modules/assets/media/media.url-transformer.service';

@Injectable()
export class TeamRepository {
  constructor(
    // ... 其他依赖
    private readonly urlTransformer: MediaUrlTransformerService,
  ) {}

  private async transformUrls(teams: TeamEntity[]): Promise<void> {
    const promises = teams.filter(Boolean).map(async (team) => {
      // 转换两个 URL 字段
      team.iconUrl = await this.urlTransformer.transformUrl(team.iconUrl);
      team.darkmodeIconUrl = await this.urlTransformer.transformUrl(team.darkmodeIconUrl);
    });
    await Promise.all(promises);
  }

  public async getTeamById(id: string) {
    const team = await this.teamRepository.findOne({ where: { id } });
    if (team) {
      await this.transformUrls([team]);
    }
    return team;
  }

  public async getTeamsByIds(ids: string[]) {
    const teams = await this.teamRepository.find({ where: { id: In(ids) } });
    await this.transformUrls(teams);
    return teams;
  }
}
```

**或者使用更简洁的批量方法：**

```typescript
private async transformUrls(teams: TeamEntity[]): Promise<void> {
  // 使用批量转换方法，一次性处理所有实体
  const transformed = await this.urlTransformer.transformUrlsInObjects(
    teams,
    ['iconUrl', 'darkmodeIconUrl']
  );

  // 将转换后的值赋回原对象
  teams.forEach((team, index) => {
    team.iconUrl = transformed[index].iconUrl;
    team.darkmodeIconUrl = transformed[index].darkmodeIconUrl;
  });
}
```

---

### 2. 需要适配的 Repository 列表

基于代码分析，以下 Repository 需要适配：

#### 高优先级（包含用户可见的图片 URL）

1. **TeamRepository** - `iconUrl`, `darkmodeIconUrl`
2. **UserRepository** - `photo` (用户头像)
3. **MediaRepository** - `iconUrl`
4. **WorkflowRepository** - workflow 关联中的 `iconUrl`

#### 中优先级

5. **KnowledgeBaseRepository** - `iconUrl`
6. **KnowledgeBaseSqlRepository** - `iconUrl`
7. **LlmModelRepository** - `iconUrl`
8. **CredentialRepository** - `iconUrl`
9. **ConversationAppRepository** - `iconUrl`
10. **ComfyuiModelRepository** - `iconUrl`
11. **DataViewRepository** - `iconUrl`
12. **DesignProjectRepository** - `thumbnailUrl`

---

### 3. Service 层适配

#### 工作流执行结果中的图片 URL

**位置**：`src/modules/workflow/workflow.execution.service.ts`

工作流的输出可能包含大量图片 URL，需要在返回给前端前转换：

```typescript
import { MediaUrlTransformerService } from '@/modules/assets/media/media.url-transformer.service';

@Injectable()
export class WorkflowExecutionService {
  constructor(
    // ... 其他依赖
    private readonly urlTransformer: MediaUrlTransformerService,
  ) {}

  async getWorkflowExecution(workflowInstanceId: string) {
    const execution = await this.conductorService.getWorkflow(workflowInstanceId);

    // 转换输出中的图片 URL
    if (execution.output) {
      execution.output = await this.transformOutputUrls(execution.output);
    }

    return execution;
  }

  private async transformOutputUrls(output: any): Promise<any> {
    if (!output) return output;

    // 如果是数组
    if (Array.isArray(output)) {
      return Promise.all(output.map(item => this.transformOutputUrls(item)));
    }

    // 如果是对象
    if (typeof output === 'object') {
      const result = { ...output };

      for (const [key, value] of Object.entries(result)) {
        // 如果是 type: 'image' 的输出项
        if (result.type === 'image' && key === 'data' && typeof value === 'string') {
          result[key] = await this.urlTransformer.transformUrl(value);
        }
        // 递归处理嵌套对象
        else if (typeof value === 'object' && value !== null) {
          result[key] = await this.transformOutputUrls(value);
        }
      }

      return result;
    }

    return output;
  }
}
```

---

### 4. Controller 层使用

一般不需要在 Controller 层直接调用，因为 Service/Repository 已经处理了。

但如果有特殊需求，可以这样使用：

```typescript
@Controller('/api/media')
export class MediaController {
  constructor(
    private readonly urlTransformer: MediaUrlTransformerService,
  ) {}

  @Get('/transform-url')
  async transformUrl(@Query('url') url: string) {
    const signedUrl = await this.urlTransformer.transformUrl(url);
    return { url: signedUrl };
  }
}
```

---

## 工作原理

### 1. URL 检测流程

```
输入 URL
  ↓
是否是 http(s):// ?
  ↓ 是
尝试解析为 URL 对象
  ↓
使用 BucketRegistry 查找匹配的桶
  ↓
找到匹配?
  ↓ 是
使用 MediaPresignService 生成预签名 URL
  ↓
返回预签名 URL

如果任何步骤失败，返回原 URL
```

### 2. 桶匹配机制

系统通过 `config.yaml` 中的 `s3-thumbnail-buckets` 配置识别私有桶：

```yaml
s3-thumbnail-buckets:
  - id: "my-private-bucket"
    name: "私有存储"
    provider: "s3"
    urlPatterns:
      - id: "cdn"
        type: "bucket-hostname"
        hostname: "private-bucket.example.com"
    config:
      bucket: "my-bucket"
      region: "us-east-1"
      access_key_id: "xxx"
      secret_access_key: "xxx"
```

任何来自 `https://private-bucket.example.com/*` 的 URL 都会被自动转换。

### 3. 预签名 URL 生成

- 使用 OpenDAL 的 `presignRead` 方法
- 默认有效期：3600 秒（1小时）
- 支持自定义有效期

---

## 迁移清单

### Phase 1: 核心用户数据（高优先级）

- [ ] TeamRepository - 团队图标
- [ ] UserRepository - 用户头像
- [ ] WorkflowExecutionService - 工作流输出中的图片

### Phase 2: 资产和配置（中优先级）

- [ ] MediaRepository - 媒体文件
- [ ] KnowledgeBaseRepository - 知识库图标
- [ ] LlmModelRepository - 模型图标
- [ ] WorkflowRepository - 工作流关联图标

### Phase 3: 其他（低优先级）

- [ ] 设计相关 Repository
- [ ] 评估任务缩略图
- [ ] 其他资产类型

---

## 测试验证

### 1. 单元测试

```typescript
describe('MediaUrlTransformerService', () => {
  it('should transform private bucket URL to presigned URL', async () => {
    const privateUrl = 'https://private-bucket.example.com/image.jpg';
    const result = await urlTransformer.transformUrl(privateUrl);
    expect(result).toContain('X-Amz-Signature');
  });

  it('should keep public URL unchanged', async () => {
    const publicUrl = 'https://public-cdn.example.com/image.jpg';
    const result = await urlTransformer.transformUrl(publicUrl);
    expect(result).toBe(publicUrl);
  });

  it('should handle null/undefined gracefully', async () => {
    expect(await urlTransformer.transformUrl(null)).toBeNull();
    expect(await urlTransformer.transformUrl(undefined)).toBeUndefined();
  });
});
```

### 2. 集成测试

1. 配置一个私有桶
2. 上传一张图片
3. 通过 API 获取包含该图片 URL 的数据
4. 验证返回的 URL 是预签名 URL
5. 使用返回的 URL 访问图片，确认可以访问

---

## 性能考虑

### 1. 批量处理

始终优先使用批量方法：

```typescript
// ✅ 好：批量处理
await this.urlTransformer.transformUrlsInObjects(entities, ['iconUrl']);

// ❌ 差：循环单个处理
for (const entity of entities) {
  entity.iconUrl = await this.urlTransformer.transformUrl(entity.iconUrl);
}
```

### 2. 缓存策略

当前实现不包含缓存，每次都会重新生成预签名 URL。

如果性能成为问题，可以考虑：
- 在 Redis 中缓存预签名 URL（TTL 设置为有效期的 80%）
- 在实体层面缓存（定期刷新）

---

## 常见问题

### Q1: 为什么不在数据库保存时就转换为预签名 URL？

A: 预签名 URL 有有效期（默认1小时），如果保存到数据库，过期后仍需刷新。当前方案在读取时转换，保证每次返回的都是有效的 URL。

### Q2: 如果 MediaPresignService 调用失败会怎样？

A: 会返回原 URL。这样设计是为了避免因为 URL 转换失败而阻塞整个业务流程。

### Q3: 需要修改前端代码吗？

A: 不需要。前端仍然接收 URL 字符串，只是值可能不同（预签名 URL vs 原始 URL）。

### Q4: 性能影响如何？

A: 每个 URL 转换大约增加 5-10ms（包含网络请求到 S3）。对于批量操作，建议使用并发处理。

---

## 参考

- 缩略图服务实现：`src/modules/assets/media/media.thumbnail.service.ts`
- Presign 服务：`src/modules/assets/media/media.presign.service.ts`
- Bucket 注册表：`src/modules/assets/media/media.bucket-registry.service.ts`
