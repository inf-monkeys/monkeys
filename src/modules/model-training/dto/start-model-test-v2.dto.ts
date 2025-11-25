import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';

export class StartModelTestV2Dto {
  @ApiProperty({
    description: '模型训练ID',
    example: '6920a791a98cbf946e7bcd21',
  })
  @IsString()
  model_training_id: string;

  @ApiProperty({
    description: '底模路径',
    example: 'flux1-dev_unet.safetensors',
  })
  @IsString()
  model_path: string;

  @ApiProperty({
    description: 'Lora模型路径和标签ID映射',
    example: {
      'Lora 模型1': ['id1', 'id2', 'id3', 'id4'],
      'Lora 模型2': ['id1', 'id2', 'id3', 'id4'],
    },
    required: false,
  })
  @IsObject()
  @IsOptional()
  lora_path?: Record<string, string[]>;

  @ApiProperty({
    description: '测试文本数组（自定义测试时使用）',
    example: ['测试内容1', '测试内容2', '测试内容3'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  test_txt?: string[];
}

export class StartModelTestV2ResponseDto {
  @ApiProperty({
    description: '响应状态码',
    example: 200,
  })
  code: number;

  @ApiProperty({
    description: '响应消息',
    example: 'success',
  })
  message: string;

  @ApiProperty({
    description: '响应数据',
    example: {},
  })
  data?: any;
}


