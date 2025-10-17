import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class SaveTrainingConfigDto {
  @ApiProperty({
    description: '模型训练ID',
    example: '68eca5d978a8adf6782398f5',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: '学习率',
    example: '0.001',
  })
  @IsString()
  learning_rate: string;

  @ApiProperty({
    description: '最大训练轮数',
    example: 100,
  })
  @IsNumber()
  max_train_epochs: number;

  @ApiProperty({
    description: '训练批次大小',
    example: 32,
  })
  @IsNumber()
  train_batch_size: number;

  @ApiProperty({
    description: '每N轮保存一次',
    example: 10,
  })
  @IsNumber()
  save_every_n_epochs: number;

  @ApiProperty({
    description: '模型训练类型',
    example: 'image_classification',
  })
  @IsString()
  model_training_type: string;

  @ApiProperty({
    description: '模型名称',
    example: 'my_model_v1',
  })
  @IsString()
  model_name: string;
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
