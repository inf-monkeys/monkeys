import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GetFeishuTableUrlDto {
  @ApiProperty({
    description: '模型训练ID',
    example: 'model-training-123',
  })
  @IsString()
  id: string;
}

export class FeishuTableUrlResponseDto {
  @ApiProperty({
    description: '飞书表格URL',
    example: 'https://caka-labs.feishu.cn/base/IQ6ibUNZra4eQgs8P2pcSXjnnoe?table=tblO6VoXRtwncnHx&view=vewGBz8reI',
  })
  url: string;
}
