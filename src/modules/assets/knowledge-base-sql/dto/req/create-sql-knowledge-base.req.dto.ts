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

  @ApiProperty({
    description: 'Create type of the sql knowledge base',
    required: false,
    type: String,
  })
  createType: string;

  @ApiProperty({
    description: 'Host of external sql database',
    required: false,
    type: String,
  })
  host: string;

  @ApiProperty({
    description: 'Port of external sql database',
    required: false,
    type: Number,
  })
  port: number;

  @ApiProperty({
    description: 'Username of external sql database',
    required: false,
    type: String,
  })
  username: string;

  @ApiProperty({
    description: 'Password of external sql database',
    required: false,
    type: String,
  })
  password: string;

  @ApiProperty({
    description: 'Database name of external sql database',
    required: false,
    type: String,
  })
  database: string;

  @ApiProperty({
    description: 'Schema name of external sql database',
    required: false,
    type: String,
  })
  schema: string;
}
