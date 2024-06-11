import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateCredentialDto } from './dto/req/create-credential.dto';
import { ListCredentialsDto } from './dto/req/list-credentials.dto';
import { UpdateCredentialDto } from './dto/req/update-credential.dto';
import { ToolsCredentialsService } from './tools.credential.service';

@Controller('')
@ApiTags('Tools/Credentials')
@UseGuards(CompatibleAuthGuard)
export class ToolsCredentialsController {
  constructor(private readonly service: ToolsCredentialsService) {}

  @Get('/credential-types')
  @ApiOperation({
    summary: '获取所有的 credential 定义',
    description: '获取所有的 credential 定义',
  })
  public async getCredentialTypes() {
    const result = await this.service.getCredentialTypes();
    return new SuccessResponse({
      data: result,
    });
  }

  @Get('/credential-types/:credentialType')
  @ApiOperation({
    summary: '获取 credential 类型',
    description: '获取 credential 类型',
  })
  public async getCredentialType(@Param('credentialType') credentialType: string) {
    const result = await this.service.getCredentialType(credentialType);
    return new SuccessResponse({
      data: result,
    });
  }

  @Get('/credentials/')
  @ApiOperation({
    summary: '获取所有的 credential 内容',
    description: '获取所有的 credential 内容',
  })
  public async listCredentials(@Req() req: IRequest, @Query() query: ListCredentialsDto) {
    const { teamId } = req;
    const { credentialType } = query;
    const result = await this.service.listCredentials(teamId, credentialType);
    return new SuccessResponse({
      data: result,
    });
  }

  @Post('/credentials/')
  @ApiOperation({
    summary: '创建 credential',
    description: '创建 credential',
  })
  public async createCredential(@Req() req: IRequest, @Body() body: CreateCredentialDto) {
    const { teamId, userId } = req;
    const { displayName, data, type } = body;
    const result = await this.service.createCredentail(teamId, userId, displayName, type, data);
    return new SuccessResponse({
      data: result,
    });
  }

  @Get('/credentials/:credentialId')
  @ApiOperation({
    summary: '获取密钥详情',
    description: '获取密钥详情',
  })
  public async getCredential(@Req() req: IRequest, @Param('credentialId') credentialId: string) {
    const { teamId } = req;
    const result = await this.service.getCredentialById(teamId, credentialId);
    return new SuccessResponse({
      data: result,
    });
  }

  @Put('/credentials/:credentialId')
  @ApiOperation({
    summary: '修改密钥',
    description: '修改密钥',
  })
  public async updateCredential(@Req() req: IRequest, @Param('credentialId') credentialId: string, @Body() dto: UpdateCredentialDto) {
    const { teamId } = req;
    const { displayName, data } = dto;
    const result = await this.service.updateCredential(teamId, credentialId, displayName, data);
    return new SuccessResponse({
      data: result,
    });
  }

  @Delete('/credentials/:credentialId')
  @ApiOperation({
    summary: '删除密钥',
    description: '删除密钥',
  })
  public async deleteCredential(@Req() req: IRequest, @Param('credentialId') credentialId: string) {
    const { teamId } = req;
    const result = await this.service.deleteCredential(teamId, credentialId);
    return new SuccessResponse({
      data: result,
    });
  }
}
