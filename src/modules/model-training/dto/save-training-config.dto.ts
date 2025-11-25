import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, Matches } from 'class-validator';

export class SaveTrainingConfigDto {
  @ApiProperty({
    description: '模型训练ID',
    example: '68eca5d978a8adf6782398f5',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: '学习率',
    example: '2e-5',
  })
  @IsString()
  @IsOptional()
  @Matches(/^\d+(\.\d+)?e-\d+$/i, {
    message: '学习率格式不正确，需要数字e-数字格式（如：2e-5 或 2.5e-6）',
  })
  learning_rate?: string;

  @ApiProperty({
    description: '网络学习率',
    example: '2e-6',
  })
  @IsString()
  @IsOptional()
  @Matches(/^\d+(\.\d+)?e-\d+$/i, {
    message: '网络学习率格式不正确，需要数字e-数字格式（如：2e-6 或 2.5e-6）',
  })
  unet_learning_rate?: string;

  @ApiProperty({
    description: '文本学习率',
    example: '2e-6',
  })
  @IsString()
  @IsOptional()
  @Matches(/^\d+(\.\d+)?e-\d+$/i, {
    message: '文本学习率格式不正确，需要数字e-数字格式（如：2e-6 或 2.5e-6）',
  })
  text_encoder_lr?: string;

  @ApiProperty({
    description: '模型名称（输出名称）',
    example: 'my_model_v1',
  })
  @IsString()
  @IsOptional()
  output_name?: string;

  @ApiProperty({
    description: '模型名称（1.0使用）',
    example: 'my_model_v1',
  })
  @IsString()
  @IsOptional()
  model_name?: string;

  @ApiProperty({
    description: '模型训练类型',
    example: 'lora',
  })
  @IsString()
  @IsOptional()
  model_training_type?: string;

  @ApiProperty({
    description: '最大训练轮数（2.0使用）',
    example: 6,
  })
  @IsNumber()
  @IsOptional()
  max_train_epoches?: number;

  @ApiProperty({
    description: '最大训练轮数（1.0使用）',
    example: 6,
  })
  @IsNumber()
  @IsOptional()
  max_train_epochs?: number;

  @ApiProperty({
    description: '训练批次大小（2.0使用）',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  batch_size?: number;

  @ApiProperty({
    description: '训练批次大小（1.0使用）',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  train_batch_size?: number;

  @ApiProperty({
    description: '每N轮保存一次',
    example: 2,
  })
  @IsNumber()
  @IsOptional()
  save_every_n_epochs?: number;

  @ApiProperty({
    description: '网络维度',
    example: 128,
  })
  @IsNumber()
  @IsOptional()
  network_dim?: number;

  @ApiProperty({
    description: '网络缩放因子',
    example: 2,
  })
  @IsNumber()
  @IsOptional()
  network_alpha?: number;

  @ApiProperty({
    description: '底模选择',
    example: 'flux1-dev_unet.safetensors',
  })
  @IsString()
  @IsOptional()
  pretrained_model?: string;

  @ApiProperty({
    description: '样本重复次数',
    example: 100,
  })
  @IsNumber()
  @IsOptional()
  repeat?: number;

  @ApiProperty({
    description: '文件存储ID',
    example: '68eca5d978a8adf6782398f5',
  })
  @IsString()
  @IsOptional()
  file_storage_id?: string;

  @ApiProperty({
    description: '测试集（数字或字符串数组）',
    example: 5,
  })
  @IsOptional()
  test_set?: number | string[];

  @ApiProperty({
    description: '数据上传标签ID数组',
    example: ['tag1', 'tag2', 'tag3'],
  })
  @IsArray()
  @IsOptional()
  data_upload_tag_ids?: string[];
}

export class SaveTrainingConfigResponseDto {
  @ApiProperty({
    description: '是否更新成功',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: '响应消息',
    example: '训练配置保存成功',
  })
  message: string;
}
