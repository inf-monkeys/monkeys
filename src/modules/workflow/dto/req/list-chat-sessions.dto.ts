import { ApiProperty } from '@nestjs/swagger';

export class ListChatSessionsDto {
  @ApiProperty({
    description: 'workflowId',
    type: String,
  })
  workflowId: string;
}
