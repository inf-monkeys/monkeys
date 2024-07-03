import { MonkeyToolCategories, MonkeyToolDisplayName, MonkeyToolIcon, MonkeyToolInput, MonkeyToolName, MonkeyToolOutput } from '@/common/decorators/monkey-block-api-extensions.decorator';
import { IRequest } from '@/common/typings/request';
import { ApiType, AuthType, ManifestJson, SchemaVersion } from '@/common/typings/tools';
import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { ComfyUIService } from './comfyui.service';
import { COMFYUI_TOOL_OPENAPI_PATH } from './comfyui.swagger';
import { RunComfyuiWorkflowDto } from './dto/req/execute-comfyui-workflow';

export const COMFYUI_NAMESPACE = 'comfyui';
export const COMFYUI_TOOL = 'run_comfyui_workflow';

@Controller('/comfyui/')
@ApiTags('ComfyUI')
export class ComfyuiExecutionController {
  constructor(private readonly comfyuiService: ComfyUIService) {}

  @Get('/manifest.json')
  @ApiExcludeEndpoint()
  public getMetadata(): ManifestJson {
    return {
      schema_version: SchemaVersion.v1,
      display_name: 'ComfyUI',
      namespace: COMFYUI_NAMESPACE,
      auth: {
        type: AuthType.none,
      },
      api: {
        type: ApiType.openapi,
        url: `${COMFYUI_TOOL_OPENAPI_PATH}-json`,
      },
      contact_email: 'dev@inf-monkeys.com',
    };
  }

  @Post('/')
  @MonkeyToolName(COMFYUI_TOOL)
  @MonkeyToolDisplayName({
    'zh-CN': '运行 ComfyUI 工作流',
    'en-US': 'Run ComfyUI Workflow',
  })
  @MonkeyToolCategories(['gen-image'])
  @MonkeyToolIcon('emoji:📷:#98ae36')
  @MonkeyToolInput([
    {
      displayName: 'ComfyUI Server',
      name: 'server',
      type: 'string',
      required: true,
      typeOptions: { assetType: 'comfyui-server' },
    },
    {
      displayName: {
        'zh-CN': '工作流',
        'en-US': 'Workflow',
      },
      name: 'workflow',
      type: 'string',
      required: true,
      typeOptions: { assetType: 'comfyui-workflow' },
    },
  ])
  @MonkeyToolOutput([
    {
      name: 'file_output',
      displayName: {
        'zh-CN': '文件输出列表',
        'en-US': 'File Output List',
      },
      type: 'string',
      typeOptions: {
        multipleValues: true,
      },
    },
    {
      name: 'text_output',
      displayName: {
        'zh-CN': '文本输出列表',
        'en-US': 'Text Output List',
      },
      type: 'string',
      typeOptions: {
        multipleValues: true,
      },
    },
  ])
  public async createComfyuiServer(@Req() req: IRequest, @Body() body: RunComfyuiWorkflowDto) {
    const { workflow, server, ...rest } = body;
    const data = await this.comfyuiService.runComfyuiWorkflow(server, workflow, rest);
    return data;
  }
}
