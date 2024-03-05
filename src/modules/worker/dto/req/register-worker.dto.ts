import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

export class RegisterWorkerDto {
  @ApiProperty({
    required: true,
    type: String,
    description: 'Menifest json url',
  })
  @Joiful.string().required()
  menifestJsonUrl: string;
}
