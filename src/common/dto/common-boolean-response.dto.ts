import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { CommonResponseDto } from './common-response.dto';

export class CommonBooleanResposeDto extends CommonResponseDto {
  @ApiProperty({
    description: '是否成功',
    type: Boolean,
    required: true,
  })
  @Expose()
  data: boolean;
}
