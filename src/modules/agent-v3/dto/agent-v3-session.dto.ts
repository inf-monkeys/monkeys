import { ApiProperty } from '@nestjs/swagger';

export class AgentV3SessionCreateDto {
  @ApiProperty({ required: false })
  title?: string;

  @ApiProperty({ required: false, description: '默认模型 ID，例如 openai:gpt-4o' })
  modelId?: string;
}

export class AgentV3SessionUpdateDto {
  @ApiProperty({ required: false })
  title?: string | null;

  @ApiProperty({ required: false })
  modelId?: string | null;
}

export class AgentV3ChatRequestDto {
  @ApiProperty()
  sessionId: string;

  @ApiProperty()
  message: string;

  @ApiProperty({ required: false })
  modelId?: string;

  @ApiProperty({ required: false, type: [String] })
  imageMediaIds?: string[];
}
