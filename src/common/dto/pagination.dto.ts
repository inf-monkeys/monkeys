import { transformApiNumberValue } from '@/common/utils/api';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import * as Joiful from 'joiful';

export const Page = ApiProperty({
  description: '当前页数，从 1 开始',
  type: Number,
  required: false,
  default: 1,
  example: 1,
});

export const Limit = ApiProperty({
  description: '每页数目，默认为 10',
  type: Number,
  required: false,
  default: 10,
  example: 10,
});

export class PaginationDto {
  @Page
  @Joiful.number().required()
  @Transform(transformApiNumberValue)
  page: number;

  @Limit
  @Joiful.number().required()
  @Transform(transformApiNumberValue)
  limit: number;
}
