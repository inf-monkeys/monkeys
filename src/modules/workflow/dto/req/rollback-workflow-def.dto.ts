import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

export class RollbackWorkflowDto {
  @ApiProperty({
    description: '回滚版本',
    required: true,
    type: Number,
  })
  @Joiful.number()
  version: number;
}
