import { ApiProperty } from '@nestjs/swagger';

export class BaseEntityDto {
  @ApiProperty({
    description: '创建时间（时间戳）',
    type: Number,
    required: true,
  })
  createdTimestamp: number;

  @ApiProperty({
    description: '更新时间（时间戳）',
    type: Number,
    required: true,
  })
  updatedTimestamp: number;

  @ApiProperty({
    description: '是否被删除',
    type: Boolean,
    required: false,
  })
  isDeleted?: boolean;
}
