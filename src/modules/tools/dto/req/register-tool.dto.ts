import { ToolImportType } from '@/common/typings/tools';
import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

export class RegisterToolDto {
  @ApiProperty({
    required: true,
    type: String,
    description: 'Import type',
  })
  @Joiful.string().required()
  importType: ToolImportType;

  @ApiProperty({
    required: true,
    type: String,
    description: 'Manifest json url',
  })
  @Joiful.string().optional()
  manifestUrl: string;

  @ApiProperty({
    required: true,
    type: String,
    description: 'Swagger Spec url',
  })
  @Joiful.string().optional()
  openapiSpecUrl: string;

  @ApiProperty({
    required: true,
    type: String,
    description: 'namespace',
  })
  @Joiful.string().optional()
  namespace: string;
}
