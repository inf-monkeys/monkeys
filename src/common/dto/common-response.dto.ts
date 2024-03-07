import { ApiProperty } from '@nestjs/swagger';

export class CommonResponseDto {
  @ApiProperty({
    description: '业务状态码，可以通过此状态码判断操作是否成功，200 表示成功。',
    required: true,
    type: Number,
    example: 200,
  })
  code: number;

  @ApiProperty({
    description: '描述信息',
    required: true,
    type: String,
    example: '操作成功',
  })
  message: string;
}
