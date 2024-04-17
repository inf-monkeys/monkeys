import { ApiProperty } from '@nestjs/swagger';

export class UpdateSqlKnowledgeBaseDto {
  @ApiProperty({
    description: 'Display Name of the sql knowledge base',
    required: false,
    type: String,
  })
  displayName: string;

  @ApiProperty({
    description: 'Description of the sql knowledge base',
    required: false,
    type: String,
  })
  description: string;

  @ApiProperty({
    description: 'Icon url of the sql knowledge base',
    required: false,
    type: String,
  })
  iconUrl: string;
}
