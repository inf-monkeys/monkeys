import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

export class RegisterToolDto {
  @ApiProperty({
    required: true,
    type: String,
    description: 'Manifest json url',
  })
  @Joiful.string().required()
  manifestJsonUrl: string;
}
