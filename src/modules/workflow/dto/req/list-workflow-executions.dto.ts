import { OrderBy } from '@/common/dto/order.enum';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

export class ListWorkflowExecutionsDto extends PaginationDto {
  @ApiProperty({
    description: '工作流版本',
    name: 'version',
    type: Number,
    required: true,
    default: 1,
  })
  @Joiful.number().optional()
  version: number;

  @ApiProperty({
    description: '按照时间排序规则',
    enum: OrderBy,
    default: OrderBy.DESC,
    required: false,
  })
  @Joiful.string().allow(OrderBy.ASC, OrderBy.DESC).default(OrderBy.DESC)
  order: OrderBy;

  @ApiProperty({
    description: 'Chat Session Id',
    type: String,
    required: false,
  })
  chatSessionId?: string;
}
