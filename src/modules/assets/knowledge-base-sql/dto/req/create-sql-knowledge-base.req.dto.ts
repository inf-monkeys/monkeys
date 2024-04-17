import { ApiProperty } from '@nestjs/swagger';

export class CreateSqlKnowledgeBaseDto {
  @ApiProperty({
    description: 'Display Name of the sql knowledge base',
    required: true,
    type: String,
  })
  displayName: string;

  @ApiProperty({
    description: 'Description of the sql knowledge base',
    required: true,
    type: String,
  })
  description: string;

  @ApiProperty({
    description: 'Embedding model of the sql knowledge base',
    required: true,
    type: String,
  })
  embeddingModel: string;

  @ApiProperty({
    description: 'Icon url of the sql knowledge base',
    required: false,
    type: String,
  })
  iconUrl: string;
}
