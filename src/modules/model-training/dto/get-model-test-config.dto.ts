import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GetModelTestConfigDto {
  @ApiProperty({
    description: '模型训练ID',
    example: '68eca5d978a8adf6782398f5',
  })
  @IsString()
  id: string;
}

export class GetModelTestConfigResponseDto {
  @ApiProperty({
    description: '飞书测试表URL',
    example: 'https://caka-labs.feishu.cn/base/IQ6ibUNZra4eQgs8P2pcSXjnnoe?table=tblO6VoXRtwncnHx&view=vewGBz8reI',
    required: false,
  })
  feishuTestTableUrl?: string;

  @ApiProperty({
    description: '模型训练类型',
    example: 'flux',
    required: false,
  })
  modelTrainingType?: string;
}
