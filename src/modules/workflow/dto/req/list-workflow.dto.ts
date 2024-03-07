import { OrderBy } from '@/common/dto/order.enum';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

enum OrderByColumn {
  CREATED_TIMESTAMP = 'createdTimestamp',
  UPDATED_TIMESTAMP = 'updatedTimestamp',
}
export class ListWorkflowDto extends PaginationDto {
  @ApiProperty({
    description: '搜索关键词',
    required: false,
  })
  @Joiful.string()
  freeText: string;

  @ApiProperty({
    description: '查询的团队 ID',
    required: false,
  })
  @Joiful.string()
  teamId: string;

  @ApiProperty({
    description: '排序规则',
    enum: OrderBy,
    default: OrderBy.DESC,
    required: false,
  })
  @Joiful.string().allow(OrderBy.ASC, OrderBy.DESC).default(OrderBy.DESC)
  order: OrderBy;

  @ApiProperty({
    description: '排序字段',
    enum: OrderByColumn,
    default: OrderByColumn.UPDATED_TIMESTAMP,
    required: false,
  })
  @Joiful.string().allow(OrderByColumn.UPDATED_TIMESTAMP, OrderByColumn.CREATED_TIMESTAMP).default(OrderByColumn.UPDATED_TIMESTAMP)
  orderBy: OrderByColumn;
}
