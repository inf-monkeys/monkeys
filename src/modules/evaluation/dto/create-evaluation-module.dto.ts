import { GlickoConfig } from '@/database/entities/evaluation/evaluation-module.entity';
import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

const IsRequiredString = Joiful.string().required();
const IsParticipantIdArray = Joiful.array().items((s) => s.string());

export class CreateEvaluationModuleDto {
  @ApiProperty({
    description: '评测模块名称',
    name: 'displayName',
    type: String,
    required: true,
  })
  @IsRequiredString
  displayName: string;

  @ApiProperty({
    description: '评测模块描述',
    name: 'description',
    type: String,
    required: false,
  })
  @Joiful.string()
  description?: string;

  @ApiProperty({
    description: '评判标准描述',
    name: 'evaluationCriteria',
    type: String,
    required: false,
  })
  @Joiful.string()
  evaluationCriteria?: string;

  @ApiProperty({
    description: '参与评测的资产ID列表',
    name: 'participantAssetIds',
    type: [String],
    required: false,
  })
  @IsParticipantIdArray
  participantAssetIds?: string[];

  @ApiProperty({
    description: 'Glicko-2 算法配置',
    name: 'glickoConfig',
    type: Object,
    required: false,
  })
  @Joiful.object()
  glickoConfig?: GlickoConfig;
}
