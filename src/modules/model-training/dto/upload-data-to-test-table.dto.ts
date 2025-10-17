import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UploadDataToTestTableDto {
  @ApiProperty({
    description: '模型训练ID',
    example: '68eca5d978a8adf6782398f5',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: '上传多少张图片到测试表',
    example: 100,
  })
  @IsNumber()
  quantity: number;

  @ApiProperty({
    description: '数据拉取任务的ID',
    example: '68eca5d978a8adf6782398f5',
  })
  @IsString()
  model_training_id: string;

  @ApiProperty({
    description: '输入数据拉取文件的完整路径',
    example: '/root/data-local/mat_v3',
    required: false,
  })
  @IsString()
  @IsOptional()
  save_path?: string;
}

export class UploadDataToTestTableResponseDto {
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
