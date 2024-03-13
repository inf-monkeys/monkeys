import { ApiProperty } from '@nestjs/swagger';

export class UpdateChatSessionDto {
  @ApiProperty({
    name: 'displayName',
    required: true,
    type: String,
  })
  displayName: string;
}
