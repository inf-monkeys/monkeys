# NestJS 对接 Go 模块草案（V2）

> 目的：NestJS 作为对外网关，完成鉴权/上下文解析，然后转发到 monkey-data（Go）内部服务。
> 说明：以下示例为草案，不直接修改现有业务逻辑。

## 配置建议
- GO_DATA_V2_URL：Go 服务地址，例如 http://monkey-data:8081
- GO_DATA_V2_TOKEN：内部鉴权 Token
- GO_DATA_V2_TIMEOUT_MS：请求超时（建议 2000ms）

## Header 约定
- X-App-Id：多租户表/索引选择（从现有 appId 来源）
- X-Team-Id：强制过滤条件
- X-Internal-Token：内网鉴权

## Client Provider（示意）
```ts
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DataV2Client {
  constructor(private readonly http: HttpService, private readonly cfg: ConfigService) {}

  private baseUrl() {
    return this.cfg.get<string>('GO_DATA_V2_URL');
  }

  private headers(appId: string, teamId: string) {
    return {
      'X-App-Id': appId,
      'X-Team-Id': teamId,
      'X-Internal-Token': this.cfg.get<string>('GO_DATA_V2_TOKEN') || '',
    };
  }

  async searchAssets(appId: string, teamId: string, params: Record<string, any>) {
    const res = await firstValueFrom(
      this.http.get(`${this.baseUrl()}/v2/assets/search`, {
        params,
        headers: this.headers(appId, teamId),
        timeout: Number(this.cfg.get('GO_DATA_V2_TIMEOUT_MS') || 2000),
      }),
    );
    return res.data;
  }
}
```

## Controller 转发示例
```ts
import { Controller, Get, Query, Req } from '@nestjs/common';

@Controller('/api/data-v2')
export class DataV2Controller {
  constructor(private readonly client: DataV2Client) {}

  @Get('/assets/search')
  async search(@Query() query: any, @Req() req: any) {
    const appId = req.appId;   // 从现有上下文解析
    const teamId = req.teamId; // 从现有上下文解析
    return this.client.searchAssets(appId, teamId, query);
  }
}
```

## 错误与重试策略
- GET 可重试（例如 1 次），POST/PATCH/DELETE 不自动重试
- 统一超时（2s 左右）
- 失败时透传错误码与 message

## 注意事项
- Go 服务不做权限校验，必须在 NestJS 侧完成鉴权/授权
- app_id 仅用于选择表与索引，必须来自服务端上下文
