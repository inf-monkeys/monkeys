import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class JoinEvaluationDto {
  @ApiProperty({
    description: '要加入评测的图片资产ID列表',
    example: ['asset-id-1', 'asset-id-2'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  assetIds: string[];
}
