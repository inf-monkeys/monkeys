import { ApiProperty } from '@nestjs/swagger';

export class RegisterComfyuiServerDto {
  @ApiProperty({
    description: 'Display Name',
    required: true,
    type: String,
  })
  displayName: string;

  @ApiProperty({
    description: 'Base Url',
    required: true,
    type: String,
  })
  baseUrl: string;
}
