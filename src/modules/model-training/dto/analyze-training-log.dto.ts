import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AnalyzeTrainingLogDto {
  @ApiProperty({
    description: '模型训练ID',
    example: '68faf75166a3d52a2fa44d9b',
  })
  @IsString()
  model_training_id: string;
}

export class TrainingLogAnalysisResult {
  @ApiProperty({
    description: '训练状态',
    example: 'Running',
  })
  status: string;

  @ApiProperty({
    description: '状态消息',
    example: '训练正在进行中 (基于最后一条日志)',
  })
  message: string;

  @ApiProperty({
    description: '进度数据',
    example: {
      percent: '20',
      current_step: '196',
      total_step: '1000',
      elapsed_time: '05:34',
      remaining_time: '22:51',
      avr_loss: '0.434',
      full_line: '[2025-10-24 13:58:28] - INFO - [main] - main] - [steps:  20%|██████████████████████████████████████▊                                                                                                                                                               | 196/1000 [05:34<22:51,  1.71s/it, avr_loss=0.434]'
    },
    required: false,
  })
  progress_data?: {
    percent: string;
    current_step: string;
    total_step: string;
    elapsed_time: string;
    remaining_time: string;
    avr_loss: string;
    full_line: string;
  } | null;

  @ApiProperty({
    description: '是否发现错误',
    example: false,
  })
  error_found: boolean;
}

export class AnalyzeTrainingLogResponseDto {
  @ApiProperty({
    description: '模型训练ID',
    example: '68faf75166a3d52a2fa44d9b',
  })
  model_training_id: string;

  @ApiProperty({
    description: '日志文件路径',
    example: '/root/data-local/c_test/logs/68faf75166a3d52a2fa44d9b.log',
  })
  log_file_path: string;

  @ApiProperty({
    description: '分析结果',
    type: TrainingLogAnalysisResult,
  })
  analysis_result: TrainingLogAnalysisResult;
}
