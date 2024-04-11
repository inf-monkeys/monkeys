import { ApiProperty } from '@nestjs/swagger';

export class CreateKnowledgeBaseDto {
  @ApiProperty({
    description: 'Display Name of the knowledge base',
    required: true,
    type: String,
  })
  displayName: string;

  @ApiProperty({
    description: 'Description of the knowledge base',
    required: true,
    type: String,
  })
  description: string;

  @ApiProperty({
    description: 'Embedding model of the knowledge base',
    required: true,
    type: String,
  })
  embeddingModel: string;

  @ApiProperty({
    description: 'Icon url of the knowledge base',
    required: false,
    type: String,
  })
  iconUrl: string;
}
