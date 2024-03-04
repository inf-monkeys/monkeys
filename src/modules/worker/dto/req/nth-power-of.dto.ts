import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

export class NthPowerOfDto {
  @ApiProperty({
    description: 'Number',
    type: String,
    required: true,
    example: 10,
  })
  @Joiful.number().required()
  num: number;

  @ApiProperty({
    description: 'N',
    type: String,
    required: true,
    example: 2,
  })
  @Joiful.number().required()
  n: number;
}
