# 私有桶 URL 转换 - 实施总结

## 已完成的工作

### 1. 创建核心服务 ✅

**文件**: `src/modules/assets/media/media.url-transformer.service.ts`

这个服务提供了统一的 URL 转换能力：
- `transformUrl(url)` - 转换单个 URL
- `transformUrls(urls)` - 批量转换 URL 数组
- `transformUrlsInObject(obj, fields)` - 转换对象中指定字段
- `transformUrlsInObjects(objects, fields)` - 批量转换对象数组

**核心逻辑**：
1. 检查 URL 是否来自已注册的存储桶（通过 `MediaBucketRegistryService`）
2. 如果是，使用 `MediaPresignService` 生成预签名 URL
3. 如果不是或失败，返回原 URL

### 2. 注册到模块 ✅

**文件**: `src/modules/assets/media/media.module.ts`

已将 `MediaUrlTransformerService` 添加到：
- `providers` 数组 - 可在模块内使用
- `exports` 数组 - 可被其他模块导入使用

### 3. 创建完整文档 ✅

**文件**: `docs/PRIVATE_BUCKET_URL_TRANSFORMATION.md`

包含：
- 工作原理说明
- 详细的使用示例
- Repository/Service 适配指南
- 测试方法
- 性能优化建议
- 常见问题解答

---

## 接下来需要做的事情

### 阶段1: 高优先级适配（用户可见的 URL）

#### 1.1 Team Repository

**文件**: `src/database/repositories/team.repository.ts`

**需要修改的方法**: `refreshLogo(teams)`

**当前代码**:
```typescript
private async refreshLogo(teams: TeamEntity[]) {
  const promises = teams.filter(Boolean).map(async (team) => {
    if (team.iconUrl) {
      const s3Helpers = new S3Helpers();
      const { refreshed, refreshedUrl } = await s3Helpers.refreshSignedUrl(team.iconUrl);
      if (refreshed) {
        team.iconUrl = refreshedUrl;
        await this.teamRepository.save(team);
      }
    }
    // ... darkmodeIconUrl 类似逻辑
  });
  await Promise.all(promises);
}
```

**建议的新代码**:
```typescript
import { MediaUrlTransformerService } from '@/modules/assets/media/media.url-transformer.service';

@Injectable()
export class TeamRepository {
  constructor(
    // ... 现有依赖
    private readonly urlTransformer: MediaUrlTransformerService,
  ) {}

  private async transformUrls(teams: TeamEntity[]) {
    const promises = teams.filter(Boolean).map(async (team) => {
      // 直接转换，不需要保存到数据库
      team.iconUrl = await this.urlTransformer.transformUrl(team.iconUrl);
      team.darkmodeIconUrl = await this.urlTransformer.transformUrl(team.darkmodeIconUrl);
    });
    await Promise.all(promises);
  }

  // 将所有调用 refreshLogo 的地方改为 transformUrls
  public async getTeamById(id: string) {
    const team = await this.teamRepository.findOne({ where: { id } });
    if (team) {
      await this.transformUrls([team]);
    }
    return team;
  }
}
```

**关键变化**：
- ❌ 移除 `S3Helpers` 依赖
- ✅ 注入 `MediaUrlTransformerService`
- ✅ 不再需要 `save()` - URL 转换是临时的，每次读取时动态生成
- ✅ 支持多种存储桶（不仅限于 S3）

#### 1.2 User Repository

**文件**: `src/database/repositories/user.repository.ts`

**字段**: `photo` (用户头像)

**需要添加**:
```typescript
private async transformUrls(users: UserEntity[]) {
  const promises = users.map(async (user) => {
    user.photo = await this.urlTransformer.transformUrl(user.photo);
  });
  await Promise.all(promises);
}
```

#### 1.3 Workflow Execution Service

**文件**: `src/modules/workflow/workflow.execution.service.ts`

这是**最重要**的适配，因为工作流输出包含大量用户生成的图片。

**需要适配的位置**:

1. `getWorkflowInstanceById()` - 返回单个执行结果
2. `listWorkflowExecutions()` - 返回执行列表
3. 任何返回 `output` 字段的方法

**实现示例**:
```typescript
import { MediaUrlTransformerService } from '@/modules/assets/media/media.url-transformer.service';

@Injectable()
export class WorkflowExecutionService {
  constructor(
    // ... 现有依赖
    private readonly urlTransformer: MediaUrlTransformerService,
  ) {}

  // 递归转换输出中的图片 URL
  private async transformOutputUrls(output: any): Promise<any> {
    if (!output) return output;

    // 处理数组
    if (Array.isArray(output)) {
      return Promise.all(output.map(item => this.transformOutputUrls(item)));
    }

    // 处理对象
    if (typeof output === 'object') {
      const result = { ...output };

      // 特殊处理：type: 'image' 的输出项
      if (result.type === 'image' && typeof result.data === 'string') {
        result.data = await this.urlTransformer.transformUrl(result.data);
        return result;
      }

      // 递归处理所有字段
      for (const [key, value] of Object.entries(result)) {
        result[key] = await this.transformOutputUrls(value);
      }

      return result;
    }

    // 基本类型：检查是否是图片 URL
    if (typeof output === 'string' && this.looksLikeImageUrl(output)) {
      return this.urlTransformer.transformUrl(output);
    }

    return output;
  }

  private looksLikeImageUrl(str: string): boolean {
    if (!str.startsWith('http')) return false;
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(str);
  }

  async getWorkflowInstanceById(workflowInstanceId: string) {
    const execution = await this.conductorService.getWorkflow(workflowInstanceId);

    // 转换输出中的所有图片 URL
    if (execution.output) {
      execution.output = await this.transformOutputUrls(execution.output);
    }

    return execution;
  }
}
```

---

### 阶段2: 中优先级适配（资产和配置）

#### 2.1 Media Repository

**文件**: `src/database/repositories/media.repository.ts`
**字段**: `iconUrl`

#### 2.2 Knowledge Base Repositories

**文件**:
- `src/database/repositories/knowledge-base.repository.ts`
- `src/database/repositories/knowledge-base-sql.repository.ts`

**字段**: `iconUrl`

#### 2.3 Model Repositories

**文件**:
- `src/database/repositories/llm-model.repository.ts`
- `src/database/repositories/comfyui-model.repository.ts`

**字段**: `iconUrl`

---

### 阶段3: 低优先级（其他场景）

- Design 相关的 `thumbnailUrl`
- VR Evaluation 的 `thumbnailUrl`
- Conversation App 的 `iconUrl`
- 等等...

---

## 实施步骤建议

### Step 1: 确保 Media 模块被正确导入

在需要使用 `MediaUrlTransformerService` 的模块中，导入 `MediaModule`:

```typescript
// 例如: src/modules/auth/auth.module.ts
import { MediaModule } from '@/modules/assets/media/media.module';

@Module({
  imports: [MediaModule],  // 添加这一行
  // ...
})
export class AuthModule {}
```

### Step 2: 从 TeamRepository 开始

这是最简单的适配，可以作为模板：

1. 注入 `MediaUrlTransformerService`
2. 修改 `refreshLogo` 方法为 `transformUrls`
3. 移除数据库 save 操作
4. 测试团队图标是否正常显示

### Step 3: 适配 WorkflowExecutionService

这是最复杂但最重要的适配：

1. 创建 `transformOutputUrls` 方法
2. 在所有返回 execution 的地方调用此方法
3. 重点测试包含图片输出的工作流

### Step 4: 逐步适配其他 Repository

按照优先级顺序，逐个适配其他 Repository。

### Step 5: 清理旧代码

确认所有功能正常后：
- 移除 `S3Helpers` 相关的 `refreshSignedUrl` 调用
- 更新相关文档

---

## 依赖关系

```
MediaUrlTransformerService
  ↓ depends on
MediaBucketRegistryService (已有)
  ↓ depends on
config.s3ThumbnailBuckets (配置)

MediaUrlTransformerService
  ↓ depends on
MediaPresignService (已有)
  ↓ depends on
StorageOperations (已有, 使用 OpenDAL)
```

**重要**: 所有依赖都已存在并正常工作（缩略图服务在用），不需要额外配置。

---

## 测试清单

### 功能测试

- [ ] 团队图标正常显示（私有桶）
- [ ] 用户头像正常显示（私有桶）
- [ ] 工作流输出的图片正常显示（私有桶）
- [ ] 公开桶的图片仍然正常（不受影响）
- [ ] 外部 CDN 图片仍然正常（不受影响）

### 性能测试

- [ ] 单个 URL 转换耗时 < 50ms
- [ ] 批量 URL 转换并发处理
- [ ] 大量工作流执行结果查询性能可接受

### 错误处理测试

- [ ] 无效 URL 不会导致崩溃
- [ ] Presign 失败时返回原 URL
- [ ] null/undefined 正确处理

---

## 配置示例

确保 `config.yaml` 中配置了私有桶：

```yaml
s3-thumbnail-buckets:
  - id: "main-storage"
    name: "主存储桶"
    provider: "s3"  # 或 "oss"
    urlPatterns:
      - id: "cdn"
        type: "bucket-hostname"
        hostname: "cdn.your-domain.com"
        preferred: true
    config:
      bucket: "your-bucket-name"
      region: "us-east-1"
      access_key_id: "${S3_ACCESS_KEY}"
      secret_access_key: "${S3_SECRET_KEY}"
    thumbnailPrefix: ".thumbnails/"
```

---

## 监控和调试

### 启用调试日志

在 `MediaUrlTransformerService` 中已经包含了 debug 日志：

```typescript
this.logger.debug(`Transformed URL from ${url} to signed URL (bucket: ${result.bucketId})`);
```

设置日志级别为 `debug` 可以看到所有转换记录。

### 检查转换是否生效

在浏览器开发者工具中检查返回的 URL：

**私有桶 URL 应该包含签名参数**：
```
https://bucket.example.com/image.jpg?X-Amz-Algorithm=...&X-Amz-Signature=...
```

**公开桶 URL 保持不变**：
```
https://public-cdn.example.com/image.jpg
```

---

## 常见问题处理

### Q: MediaModule 导入后编译失败？

A: 检查是否有循环依赖。如果有，使用 `forwardRef`:

```typescript
imports: [forwardRef(() => MediaModule)]
```

### Q: 性能下降明显？

A: 考虑：
1. 使用批量转换方法
2. 增加 Redis 缓存层
3. 调整 presign URL 有效期

### Q: 某些 URL 没有被转换？

A: 检查：
1. URL 是否在 `s3-thumbnail-buckets` 配置中
2. `urlPatterns` 的 hostname 是否匹配
3. 是否正确调用了 `transformUrl` 方法

---

## 下一步行动

1. **阅读文档**: `docs/PRIVATE_BUCKET_URL_TRANSFORMATION.md`
2. **选择起点**: 建议从 TeamRepository 开始
3. **测试验证**: 每适配一个模块就进行测试
4. **逐步推进**: 按优先级顺序完成所有适配

---

## 联系和支持

如有问题，请查看：
- 缩略图服务实现: `src/modules/assets/media/media.thumbnail.service.ts`
- Presign 服务: `src/modules/assets/media/media.presign.service.ts`
- 核心转换服务: `src/modules/assets/media/media.url-transformer.service.ts`
