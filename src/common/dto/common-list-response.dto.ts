import { PaginationDto } from '@/common/dto/pagination.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CommonListResponseDto extends PaginationDto {
  @ApiProperty({
    description: '业务状态码，可以通过此状态码判断操作是否成功，200 表示成功。',
    required: true,
    type: Number,
    example: 200,
  })
  code: number;

  @ApiProperty({
    description: '总数目',
    required: true,
    type: Number,
  })
  total: number;
}
