import { ApiProperty } from '@nestjs/swagger';

export class CreateChatSessionDto {
  @ApiProperty({
    name: 'displayName',
    required: true,
    type: String,
  })
  displayName: string;

  @ApiProperty({
    name: 'workflowId',
    required: true,
    type: String,
  })
  workflowId: string;
}
