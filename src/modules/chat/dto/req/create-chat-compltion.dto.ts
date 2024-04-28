import { ApiProperty } from '@nestjs/swagger';
import { ChatCompletionMessageParam } from 'openai/resources';

export class ChatCompletionsDto {
  @ApiProperty({
    description: '使用的模型名称，例如"chatgpt"',
    example: 'chatgpt',
  })
  model: string;

  @ApiProperty({
    description: '系统预设 prompt',
  })
  prompt: string;

  @ApiProperty({
    description: 'Messages',
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
    description: '指示API是否应以流的形式返回生成的回复',
    example: false,
    required: false,
  })
  stream?: boolean;

  @ApiProperty({
    description: '在采样时保留的最高置信度令牌的累积概率',
    example: 1,
    required: false,
  })
  top_p?: number;

  @ApiProperty({
    description: '要生成的完成数',
    example: 1,
    required: false,
  })
  n?: number;

  @ApiProperty({
    description: '用于表示响应应在何处停止的字符串数组',
    example: ['\n'],
    required: false,
    type: [String],
  })
  stop?: string[];
}
