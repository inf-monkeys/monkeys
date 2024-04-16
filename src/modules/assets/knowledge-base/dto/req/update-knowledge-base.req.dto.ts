import { ApiProperty } from '@nestjs/swagger';

export class UpdateKnowledgeBaseDto {
  @ApiProperty({
    description: 'Display Name of the knowledge base',
    required: false,
    type: String,
  })
  displayName: string;

  @ApiProperty({
    description: 'Description of the knowledge base',
    required: false,
    type: String,
  })
  description: string;

  @ApiProperty({
    description: 'Icon url of the knowledge base',
    required: false,
    type: String,
  })
  iconUrl: string;
}
