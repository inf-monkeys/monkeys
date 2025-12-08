import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class StartModelTestDto {
  @ApiProperty({
    description: '模型训练ID',
    example: '68eca5d978a8adf6782398f5',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: '飞书表格URL',
    example: 'https://caka-labs.feishu.cn/base/IQ6ibUNZra4eQgs8P2pcSXjnnoe?table=tblO6VoXRtwncnHx&view=vewGBz8reI',
  })
  @IsString()
  spreadsheet_url: string;

  @ApiProperty({
    description: '模型类型',
    example: 'flux',
  })
  @IsString()
  model_type: string;

  @ApiProperty({
    description: '模型路径前缀',
    example: 'output',
    required: false,
  })
  @IsString()
  @IsOptional()
  path?: string;

  @ApiProperty({
    description: '自定义列名称',
    example: ['列1', '列2'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  custom_columns?: string[];

  @ApiProperty({
    description: '是否使用图片的长宽',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  length_width?: boolean;
}

export class StartModelTestResponseDto {
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
}
