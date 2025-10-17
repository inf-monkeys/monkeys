import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GetTrainingConfigDto {
  @ApiProperty({
    description: '模型训练ID',
    example: '68eca5d978a8adf6782398f5',
  })
  @IsString()
  id: string;
}

export class GetTrainingConfigResponseDto {
  @ApiProperty({
    description: '文件存储ID',
    example: '68eca5d978a8adf6782398f5',
  })
  fileStorageId: string;

  @ApiProperty({
    description: '学习率',
    example: '2e-6',
  })
  learningRate: string;

  @ApiProperty({
    description: '模型名称',
    example: 'my_model_v1',
  })
  modelName: string;

  @ApiProperty({
    description: '模型训练类型',
    example: 'flux',
  })
  modelTrainingType: string;

  @ApiProperty({
    description: '最大训练轮数',
    example: 6,
  })
  maxTrainEpochs: number;

  @ApiProperty({
    description: '训练批次大小',
    example: 1,
  })
  trainBatchSize: number;

  @ApiProperty({
    description: '每N轮保存一次',
    example: 2,
  })
  saveEveryNEpochs: number;
}
