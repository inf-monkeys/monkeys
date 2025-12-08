import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class StartDataUploadDto {
  @ApiProperty({
    description: '模型训练ID',
    example: '68eca5d978a8adf6782398f5',
  })
  @IsString()
  modelTrainingId: string;

  @ApiProperty({
    description: '模型训练名称',
    example: '我的模型训练',
  })
  @IsString()
  projectName: string;

  @ApiProperty({
    description: '标签ID列表',
    example: ['691d44147b3d7a12cf46a227', '691d63d20fbd57442f000f2b'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  tagIds: string[];
}
