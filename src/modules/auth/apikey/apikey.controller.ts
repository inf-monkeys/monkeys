import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApikeyService } from './apikey.service';
import { CreateApiKeyDto } from './dto/create-apikey.dto';

@Controller('/auth/apikey')
@ApiTags('APIKey')
@UseGuards(CompatibleAuthGuard)
export class ApikeyController {
  constructor(private readonly apiKeyService: ApikeyService) {}

  @ApiOperation({
    description: '创建 apikey',
    summary: '创建 apikey',
  })
  @Post('/')
  public async createApiKey(@Req() req: IRequest, @Body() body: CreateApiKeyDto) {
    const { userId, teamId } = req;
    const data = await this.apiKeyService.createApiKey(userId, teamId, body);
    return new SuccessResponse({
      data,
    });
  }

  @ApiOperation({
    description: '获取 apikey 列表',
    summary: '获取 apikey 列表',
  })
  @Get('/')
  public async listApiKeys(@Req() req: IRequest) {
    const { userId, teamId } = req;
    const data = await this.apiKeyService.listApiKeys(userId, teamId);
    return new SuccessResponse({
      data,
    });
  }

  @ApiOperation({
    description: '废弃指定 apiKey',
    summary: '废弃指定 apiKey',
  })
  @Post('/:apiKeyId/revoke')
  public async revokeApiKey(@Req() req: IRequest, @Param('apiKeyId') apiKeyId: string) {
    const { userId, teamId } = req;
    const data = await this.apiKeyService.revokeApiKey(userId, teamId, apiKeyId);
    return new SuccessResponse({
      data,
    });
  }
}
