import { BaseEntityDto } from '@/common/dto/base-entity.dto';
import { IJSONObject, MonkeyWorkflowDef, ToolProperty } from '@inf-monkeys/monkeys';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class WorkflowDto extends BaseEntityDto {
  @ApiProperty({
    description: '名称',
    required: true,
    type: String,
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: '描述',
    required: false,
    type: String,
  })
  @Expose()
  desc?: string;

  @ApiProperty({
    description: '图标',
    required: false,
    type: String,
  })
  @Expose()
  logo?: string;

  @ApiProperty({
    description: '是否激活',
    required: true,
    type: Boolean,
  })
  @Expose()
  active: boolean;

  @ApiProperty({
    description: '创建者用户 ID',
    required: true,
    type: String,
  })
  @Expose()
  creatorUserId: string;

  @ApiProperty({
    description: '团队 ID',
    required: true,
    type: String,
  })
  @Expose()
  teamId: string;

  @ApiProperty({
    description: 'pointCost',
    required: false,
    type: Number,
  })
  @Expose()
  pointCost?: number;

  @ApiProperty({
    description: '工作流定义',
    required: true,
    type: Object,
  })
  @Expose()
  workflowDef: IJSONObject | MonkeyWorkflowDef;

  @ApiProperty({
    description: '变量',
    required: false,
    isArray: true,
    type: Object,
  })
  @Expose()
  variables?: ToolProperty[];

  @ApiProperty({
    description: '从其派生的流程 ID',
    required: false,
    type: String,
  })
  @Expose()
  forkFromId?: string;

  @ApiProperty({
    description: '是否隐藏',
    required: false,
    type: Boolean,
  })
  @Expose()
  hidden?: boolean;
  // @ApiProperty({
  //   description: '主工作流 ID',
  //   required: false,
  //   type: String,
  // })
  // @Expose()
  // masterWorkflowId?: string;
}
