import { ApiProperty } from '@nestjs/swagger';
import { ChatCompletionMessageParam, ChatCompletionRole } from 'openai/resources';

export class ChatCompletionMessageDto {
  role: ChatCompletionRole;
  content: string;
}

export class CreateChatCompletionsDto {
  @ApiProperty({
    description: '使用的模型名称，例如"chatgpt"',
    example: 'chatgpt',
  })
  model: string;

  @ApiProperty({
    description: '系统预设 prompt',
  })
  systemPrompt: string;

  @ApiProperty({
    description: 'Messages',
    type: ChatCompletionMessageDto,
    isArray: true,
  })
  messages: Array<ChatCompletionMessageParam>;

  @ApiProperty({
    description: '生成的最大令牌数',
    example: 4096,
    required: false,
  })
  max_tokens?: number;

  @ApiProperty({
    description: '生成回复的随机性。较高的值意味着更高的随机性',
    example: 0.7,
    required: false,
  })
  temperature?: number;

  @ApiProperty({
    description: '减少模型重复相同内容的倾向的惩罚',
    example: 0.5,
    required: false,
  })
  frequency_penalty?: number;

  @ApiProperty({
    description: '减少模型重复上下文中已经出现过的内容的倾向的惩罚',
    example: 0.5,
    required: false,
  })
  presence_penalty?: number;

  @ApiProperty({
    description: '工具列表',
    required: false,
    isArray: true,
    type: String,
  })
  tools?: string[];

  @ApiProperty({
    description: '指示API是否应以流的形式返回生成的回复',
    example: false,
    required: false,
  })
  stream?: boolean;
}
