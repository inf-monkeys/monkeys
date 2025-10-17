import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class SubmitDataUploadTaskDto {
  @ApiProperty({
    description: '模型训练ID',
    example: '68eca5d978a8adf6782398f5',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: '飞书表格URL',
    example: 'https://caka-labs.feishu.cn/base/IQ6ibUNZra4eQgs8P2pcSXjnnoe?table=tbl15UTvvmfDTf5C&view=vew5h0JxuR',
  })
  @IsUrl({}, { message: '请输入有效的飞书表格URL' })
  spreadsheet_url: string;

  @ApiProperty({
    description: '图片列名称',
    example: '数据集编号',
  })
  @IsString()
  image_column_name: string;

  @ApiProperty({
    description: '文本列名称',
    example: '自然语言打标',
  })
  @IsString()
  txt_column_name: string;

  @ApiProperty({
    description: '图片字段名称',
    example: '数据',
  })
  @IsString()
  image_field: string;

  @ApiProperty({
    description: '路径后缀',
    example: '100_1',
    required: false,
  })
  @IsString()
  @IsOptional()
  path_suffix?: string;

  @ApiProperty({
    description: '摘要文本名称',
    example: '1',
    required: false,
  })
  @IsString()
  @IsOptional()
  summary_txt_name?: string;

  @ApiProperty({
    description: '摘要中最大记录数',
    example: 5,
    required: false,
  })
  @IsOptional()
  max_records_in_summary?: number;
}

export class SubmitDataUploadTaskResponseDto {
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
