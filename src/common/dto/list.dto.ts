import { PaginationDto } from '@/common/dto/pagination.dto';
import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

type OrderColumn = 'createdTimestamp' | 'updatedTimestamp';
type OrderBy = 'DESC' | 'ASC';
export type AssetFilter = {
  userIds?: string[];
  createdTimestamp?: (number | null)[];
  updatedTimestamp?: (number | null)[];
  tagIds?: string[];
  marketPlaceTagIds?: string[];
  ids?: string[];
  [key: string]: any;
};

export class ListDto extends PaginationDto {
  @ApiProperty({
    description: '搜索关键词',
    required: false,
  })
  @Joiful.string()
  search?: string;

  @ApiProperty({
    description: '排序字段',
    required: false,
  })
  @Joiful.string().allow(['createdTimestamp', 'updatedTimestamp']).default('createdTimestamp')
  orderColumn?: OrderColumn;

  @ApiProperty({
    description: '排序规则',
    required: false,
  })
  @Joiful.string().allow(['ASC', 'DESC']).default('DESC')
  orderBy?: OrderBy;

  @ApiProperty({
    description: '筛选规则',
    required: false,
  })
  @Joiful.object().default({})
  filter?: AssetFilter;
}
