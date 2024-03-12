import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';
import { ComfyuiWorkflowFileType } from './import-from-comfyui.dto';

export class UpdateComfyUIWorkflowDto {
  @ApiProperty({
    description: 'Server name',
    type: String,
    required: true,
    default: 'false',
  })
  @Joiful.string().required()
  serverName: string;

  @ApiProperty({
    description: '工作流类型',
    enum: ComfyuiWorkflowFileType,
  })
  fileType: ComfyuiWorkflowFileType;

  @ApiProperty({
    description: '图像文件链接',
    type: String,
    required: false,
    default: 'false',
  })
  @Joiful.string().optional()
  imageUrl: string;

  @ApiProperty({
    description: 'workflow.json 文件链接',
    type: String,
    required: false,
    default: 'false',
  })
  @Joiful.string().optional()
  workflowJsonUrl: string;

  @ApiProperty({
    description: 'workflow_api.json 文件链接',
    type: String,
    required: false,
    default: 'false',
  })
  @Joiful.string().optional()
  workflowApiJsonUrl: string;

  @ApiProperty({
    description: 'Block Name',
    type: String,
    required: false,
    default: 'false',
  })
  @Joiful.string().required()
  blockName: string;
}
