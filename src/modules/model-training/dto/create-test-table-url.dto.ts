import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTestTableUrlDto {
  @ApiProperty({
    description: '模型训练ID',
    example: '68eca5d978a8adf6782398f5',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: '模型名称',
    example: 'my_model_v1',
  })
  @IsString()
  model_name: string;

  @ApiProperty({
    description: '最大训练轮数',
    example: 100,
  })
  @IsNumber()
  max_train_epochs: number;

  @ApiProperty({
    description: '每N轮保存一次',
    example: 10,
  })
  @IsNumber()
  save_every_n_epochs: number;

  @ApiProperty({
    description: '自定义列',
    example: ['列1', '列2'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  custom_column?: string[];

  @ApiProperty({
    description: '是否包含图片长宽',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  length_width?: boolean;
}

export class CreateTestTableUrlResponseDto {
  @ApiProperty({
    description: '测试表URL',
    example: 'https://caka-labs.feishu.cn/base/IQ6ibUNZra4eQgs8P2pcSXjnnoe?table=tblO6VoXRtwncnHx&view=vewGBz8reI',
  })
  url: string;
}
