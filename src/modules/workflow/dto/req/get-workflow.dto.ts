import { ApiProperty } from '@nestjs/swagger';

export class GetWorkflowDto {
  @ApiProperty({
    description: '工作流版本，默认获取最新的版本',
    name: 'version',
    type: Number,
    required: false,
  })
  version: number;
}
