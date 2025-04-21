import { ApiProperty } from '@nestjs/swagger';

// 为图片URL添加DTO
export class ImageUrlDto {
  @ApiProperty({
    description: '图片URL或Base64编码的图片数据',
    example: 'https://example.com/image.jpg',
  })
  url: string;

  @ApiProperty({
    description: '图片详细度',
    required: false,
    enum: ['auto', 'low', 'high'],
    default: 'auto',
  })
  detail?: 'auto' | 'low' | 'high';
}

// 为图片内容部分添加DTO
export class ImageContentPartDto {
  @ApiProperty({
    description: '内容类型',
    enum: ['image_url'],
    default: 'image_url',
  })
  type: 'image_url';

  @ApiProperty({
    description: '图片URL信息',
    type: ImageUrlDto,
  })
  image_url: ImageUrlDto;
}

// 为文本内容部分添加DTO
export class TextContentPartDto {
  @ApiProperty({
    description: '内容类型',
    enum: ['text'],
    default: 'text',
  })
  type: 'text';

  @ApiProperty({
    description: '文本内容',
  })
  text: string;
}

// 内容部分可以是文本或图片
export type ContentPartDto = TextContentPartDto | ImageContentPartDto;

export class CreateChatCompletionsDto {
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
    type: 'array',
  })
  messages: Array<{
    role: string;
    content: string | Array<ContentPartDto>;
    name?: string;
  }>;

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
