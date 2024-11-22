import {
  MonkeyToolCategories,
  MonkeyToolDescription,
  MonkeyToolDisplayName,
  MonkeyToolIcon,
  MonkeyToolInput,
  MonkeyToolName,
  MonkeyToolOutput,
} from '@/common/decorators/monkey-block-api-extensions.decorator';
import { ApiType, AuthType, ManifestJson, SchemaVersion } from '@/common/typings/tools';
import { translateText } from '@/common/utils/translate';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TranslateTextDto } from './dto/req/translate-text.dto';
import { TRANSLATE_TOOL_OPENAPI_PATH } from './translate.swagger';

@Controller('/translate-tool')
@ApiTags('文本翻译')
export class TranslateToolsController {
  @Get('/manifest.json')
  @ApiExcludeEndpoint()
  public getMetadata(): ManifestJson {
    return {
      schema_version: SchemaVersion.v1,
      display_name: '翻译工具',
      namespace: 'monkey_tools_translate',
      auth: {
        type: AuthType.none,
      },
      api: {
        type: ApiType.openapi,
        url: `${TRANSLATE_TOOL_OPENAPI_PATH}-json`,
      },
      contact_email: 'dev@inf-monkeys.com',
    };
  }

  @Post('/translate')
  @ApiOperation({
    summary: '文本翻译',
    description: '将文本从一种语言翻译成另一种语言',
  })
  @MonkeyToolName('translate_text')
  @MonkeyToolDisplayName({
    'zh-CN': '文本翻译',
    'en-US': 'Text Translation',
  })
  @MonkeyToolCategories(['extra'])
  @MonkeyToolDescription({
    'zh-CN': '将文本从一种语言翻译成另一种语言',
    'en-US': 'Translate text from one language to another',
  })
  @MonkeyToolIcon('emoji:🌐:#87CEEB')
  @MonkeyToolInput([
    {
      name: 'text',
      displayName: {
        'zh-CN': '要翻译的文本',
        'en-US': 'Text to translate',
      },
      required: true,
      type: 'string',
    },
    {
      name: 'sourceLanguageCode',
      displayName: {
        'zh-CN': '源语言代码',
        'en-US': 'Source Language Code',
      },
      required: false,
      default: 'auto',
      type: 'string',
    },
    {
      name: 'targetLanguageCode',
      displayName: {
        'zh-CN': '目标语言代码',
        'en-US': 'Target Language Code',
      },
      required: false,
      default: 'en',
      type: 'string',
    },
    {
      name: 'help',
      type: 'notice',
      displayName: `| 语言 | 语言代码 | 语言 | 语言代码 |
| --- | --- | --- | --- |
| 自动 | auto | 英语 | en |
| 中文（简体） | zh | 中文（繁体） | zh-TW |
| 日语 | ja | 法语 | fr |
| 法语（加拿大） | fr-CA | 德语 | de |
| 韩语 | ko | 俄语 | ru |
| 阿尔巴尼亚语 | sq | 阿姆哈拉语 | am |
| 阿拉伯语 | ar | 亚美尼亚语 | hy |
| 阿塞拜疆语 | az | 孟加拉语 | bn |
| 波斯尼亚语 | bs | 保加利亚语 | bg |
| 加泰罗尼亚语 | ca | 克罗地亚语 | hr |
| 捷克语 | cs | 丹麦语 | da |
| 达里语 | fa-AF | 荷兰语 | nl |
| 爱沙尼亚语 | et | 波斯语（波斯语） | fa |
| 菲律宾语，塔加洛语 | tl | 芬兰语 | fi |
| 格鲁吉亚语 | ka | 希腊语 | el |
| 古吉拉特语 | gu | 海地克里奥尔语 | ht |
| 豪萨语 | ha | 希伯来语 | he |
| 印地语 | hi | 匈牙利语 | hu |
| 冰岛语 | is | 印度尼西亚语 | id |
| 爱尔兰语 | ga | 意大利语 | it |
| 卡纳达语 | kn | 哈萨克语 | kk |
| 拉脱维亚语 | lv | 立陶宛语 | lt |
| 马其顿语 | mk | 马来语 | ms |
| 马拉雅拉姆语 | ml | 马耳他语 | mt |
| 马拉地语 | mr | 蒙古语 | mn |
| 挪威语（博克马尔语） | no | 普什图语 | ps |
| 波兰语 | pl | 葡萄牙语（巴西） | pt |
| 葡萄牙语（葡萄牙） | pt-PT | 旁遮普语 | pa |
| 罗马尼亚语 | ro | 塞尔维亚语 | sr |
| 僧伽罗语 | si | 斯洛伐克语 | sk |
| 斯洛文尼亚语 | sl | 索马里语 | so |
| 西班牙语 | es | 西班牙语（墨西哥） | es-MX |
| 斯瓦希里语 | sw | 瑞典语 | sv |
| 泰米尔语 | ta | 泰卢固语 | te |
| 泰语 | th | 土耳其语 | tr |
| 乌克兰语 | uk | 乌尔都语 | ur |
| 乌兹别克语 | uz | 越南语 | vi |
| 威尔士语 | cy | 南非荷兰语 | af |`,
    },
  ])
  @MonkeyToolOutput([
    {
      name: 'text',
      displayName: {
        'zh-CN': '翻译结果',
        'en-US': 'Translated Text',
      },
      required: true,
      type: 'string',
    },
  ])
  public async translateText(@Body() body: TranslateTextDto) {
    const { text, sourceLanguageCode = 'auto', targetLanguageCode = 'zh' } = body;
    const translatedText = await translateText(text, sourceLanguageCode, targetLanguageCode);
    return {
      text: translatedText,
    };
  }
}
