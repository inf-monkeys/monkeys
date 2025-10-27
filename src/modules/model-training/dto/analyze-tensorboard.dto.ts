import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AnalyzeTensorboardDto {
  @ApiProperty({
    description: '模型训练ID',
    example: '68faf75166a3d52a2fa44d9b',
  })
  @IsString()
  model_training_id: string;
}

export class TensorboardDataPoint {
  @ApiProperty({
    description: '步骤数',
    example: 1,
  })
  step: number;

  @ApiProperty({
    description: '数值',
    example: 0.42479532957077026,
  })
  value: number;

  @ApiProperty({
    description: '时间戳',
    example: 1761285177.5636961,
  })
  time: number;
}

export class TensorboardAnalysisResult {
  @ApiProperty({
    description: '损失数据',
    type: [TensorboardDataPoint],
  })
  'loss/average': TensorboardDataPoint[];

  @ApiProperty({
    description: '学习率数据',
    type: [TensorboardDataPoint],
  })
  'lr/unet': TensorboardDataPoint[];
}

export class TensorboardTrainingType {
  @ApiProperty({
    description: '时间戳',
    example: 20251024135227,
  })
  timestamp: number;

  @ApiProperty({
    description: '事件文件路径',
    example: '/root/data-local/dataset/log/model_training/lora/68faf75166a3d52a2fa44d9b/20251024135227/network_train/events.out.tfevents.1761285174.ins-qc6vt-dbfcd4799-lqrqt.13568.0',
  })
  event_file_path: string;

  @ApiProperty({
    description: '分析结果',
    type: TensorboardAnalysisResult,
  })
  analysis_result: TensorboardAnalysisResult;
}

export class TensorboardAnalysisResults {
  @ApiProperty({
    description: 'LoRA训练数据',
    type: TensorboardTrainingType,
  })
  lora: TensorboardTrainingType;
}

export class AnalyzeTensorboardResponseDto {
  @ApiProperty({
    description: '模型训练ID',
    example: '68faf75166a3d52a2fa44d9b',
  })
  model_training_id: string;

  @ApiProperty({
    description: '基础路径',
    example: '/root/data-local/dataset/log/model_training',
  })
  base_path: string;

  @ApiProperty({
    description: '最大时间戳',
    example: 20251024135227,
  })
  max_timestamp: number;

  @ApiProperty({
    description: '训练类型',
    example: 'lora',
  })
  training_type: string;

  @ApiProperty({
    description: '分析结果',
    type: TensorboardAnalysisResults,
  })
  analysis_results: TensorboardAnalysisResults;
}
