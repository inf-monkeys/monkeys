import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

export class AddTwoNumberDto {
  @ApiProperty({
    description: 'Number A',
    type: String,
    required: true,
    example: 1,
  })
  @Joiful.number().required()
  numA: number;

  @ApiProperty({
    description: 'Number B',
    type: String,
    required: true,
    example: 2,
  })
  @Joiful.number().required()
  numB: number;
}
