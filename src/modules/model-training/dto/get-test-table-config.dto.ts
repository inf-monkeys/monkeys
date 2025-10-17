import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GetTestTableConfigDto {
  @ApiProperty({
    description: '模型训练ID',
    example: '68eca5d978a8adf6782398f5',
  })
  @IsString()
  id: string;
}

export class GetTestTableConfigResponseDto {
  @ApiProperty({
    description: '文件存储ID',
    example: '68eca5d978a8adf6782398f5',
  })
  fileStorageId: string;

  @ApiProperty({
    description: '模型名称',
    example: 'my_model_v1',
    required: false,
  })
  modelName?: string;

  @ApiProperty({
    description: '训练轮数',
    example: 100,
    required: false,
  })
  maxTrainEpochs?: number;

  @ApiProperty({
    description: '多少轮保存一次',
    example: 10,
    required: false,
  })
  saveEveryNEpochs?: number;
}
