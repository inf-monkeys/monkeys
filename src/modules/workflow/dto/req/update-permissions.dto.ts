import { ApiProperty } from '@nestjs/swagger';

export class UpdatePermissionsDto {
  @ApiProperty({
    name: 'Enable Not Authorized',
    required: true,
    type: Boolean,
  })
  notAuthorized: boolean;
}
