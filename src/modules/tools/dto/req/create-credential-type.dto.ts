import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

export class CreateCredentialTypeDto {
  @ApiProperty({
    description: '是否公开',
    required: false,
    default: false,
    type: Boolean,
  })
  @Joiful.boolean()
  public: boolean;

  @ApiProperty({
    description: '密钥类型',
    type: String,
    required: false,
  })
  @Joiful.string()
  name: string;

  @ApiProperty({
    description: '显示名称',
    type: String,
    required: true,
  })
  @Joiful.string().required()
  displayName: string;

  @ApiProperty({
    description: 'LOGO',
    type: String,
    required: false,
  })
  @Joiful.string()
  logo: string;

  @ApiProperty({
    description: 'Block 表单配置',
    type: Object,
    required: false,
    isArray: true,
  })
  @Joiful.array().items((joi) => joi.string())
  properties: any;

  @ApiProperty({
    description: '换取 token 的脚本',
    type: String,
    required: true,
  })
  @Joiful.string().required()
  tokenScript: string;

  @ApiProperty({
    description: '测试连通性的脚本',
    type: String,
    required: false,
  })
  @Joiful.string()
  testConnectionScript: string;
}
