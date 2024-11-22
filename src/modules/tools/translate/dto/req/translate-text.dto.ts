import { ApiProperty } from '@nestjs/swagger';
import * as Joiful from 'joiful';

export class TranslateTextDto {
  @ApiProperty({
    description: '要翻译的文本',
    type: String,
    required: true,
    example: 'Hello world',
  })
  @Joiful.string().required()
  text: string;

  @ApiProperty({
    description: '源语言代码 (例如: en, zh, auto)',
    type: String,
    required: false,
    default: 'auto',
    example: 'en',
  })
  @Joiful.string().optional()
  sourceLanguageCode?: string;

  @ApiProperty({
    description: '目标语言代码 (例如: en, zh)',
    type: String,
    required: false,
    default: 'zh',
    example: 'zh',
  })
  @Joiful.string().optional()
  targetLanguageCode?: string;
}
