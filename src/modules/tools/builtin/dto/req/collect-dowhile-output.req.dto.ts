import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

export class CollectDoWhileOutputDto {
  @ApiProperty({
    description: 'DoWhile Task Reference Name',
    type: String,
    required: true,
  })
  @Joiful.string().required()
  doWhileTaskReferenceName: string;

  @ApiProperty({
    description: 'Json path expression',
    type: String,
    required: false,
  })
  @Joiful.string().optional()
  jsonPathExpression: string;
}
