import { readConfig } from '@/common/config/readYaml';
import { SuccessResponse } from '@/common/response';
import { HttpService } from '@nestjs/axios';
import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Controller('/text-expansion')
export class TextExpansionController {
  constructor(private readonly http: HttpService) {}

  @Post('/text-to-image')
  public async textToImage(@Body() body: { text?: string; prompt?: string }) {
    const userPrompt = (body?.text || body?.prompt || '').trim();
    if (!userPrompt) {
      throw new HttpException('text or prompt is required', HttpStatus.BAD_REQUEST);
    }

    // 从配置文件或环境变量获取 API Key
    const apiKey = readConfig('textExpansion.zaowuyunApiKey', process.env.ZAOWUYUN_API_KEY);
    if (!apiKey) {
      throw new HttpException('Zaowuyun API key not configured. Please set textExpansion.zaowuyunApiKey in config.yaml or ZAOWUYUN_API_KEY env variable', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    try {
      const url = readConfig('textExpansion.zaowuyunUrl', process.env.ZAOWUYUN_URL);
      if (!url) {
        throw new HttpException(
          'Zaowuyun URL not configured. Please set textExpansion.zaowuyunUrl in config.yaml or ZAOWUYUN_URL env variable',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const response = await firstValueFrom(
        this.http.post(
          url,
          {
            inputData: {
              prompt: userPrompt,
            },
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
          },
        ),
      );

      console.log('[TextToImage] HTTP 响应状态:', response.status);
      console.log('[TextToImage] 原始响应数据:', JSON.stringify(response.data, null, 2));

      // 解包响应数据（可能包装在 data 字段中）
      let data = response.data;
      
      // 提取图片 URL 和文本结果
      let imageUrl = '';
      let textResult = '';

      if (data && typeof data === 'object') {

        // 处理 images.0 或 images[0] 格式（造物云的格式）
        if (data['images.0']) {
          const img = data['images.0'];
          if (typeof img === 'string') {
            imageUrl = img;
          } else if (typeof img === 'object' && img) {
            // 如果 images.0 是对象，尝试提取 URL
            imageUrl = img['url'] || img['src'] || img['imageUrl'] || img['image_url'] || '';
          }
        } else if (data['images'] && Array.isArray(data['images']) && data['images'][0]) {
          const img = data['images'][0];
          if (typeof img === 'string') {
            imageUrl = img;
          } else if (typeof img === 'object' && img) {
            imageUrl = img['url'] || img['src'] || img['imageUrl'] || img['image_url'] || '';
          }
        } else if (data['images'] && typeof data['images'] === 'object') {
          // 可能是 { "0": "url" } 格式
          const img = data['images']['0'] || data['images'][0];
          if (typeof img === 'string') {
            imageUrl = img;
          } else if (typeof img === 'object' && img) {
            imageUrl = img['url'] || img['src'] || img['imageUrl'] || img['image_url'] || '';
          }
        }

        // 尝试从各种可能的字段中提取图片 URL
        if (!imageUrl) {
          imageUrl = data['imageUrl'] || data['image_url'] || data['image'] || data['imageURL'] || 
                     data['img'] || data['picture'] || data['photo'] || data['url'] || '';
        }

        // 尝试从 output 字段中提取
        if (!imageUrl && data['output']) {
          const output = data['output'];
          if (typeof output === 'object' && !Array.isArray(output)) {
            imageUrl = output['imageUrl'] || output['image_url'] || output['image'] || output['url'] || 
                       output['images.0'] || (output['images'] && output['images'][0]) || '';
          } else if (typeof output === 'string' && output.startsWith('http')) {
            imageUrl = output;
          }
        }

        // 遍历所有字段，查找以 output 开头的字段
        if (!imageUrl) {
          for (const key of Object.keys(data)) {
            if (key.startsWith('output')) {
              const val = data[key];
              if (typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://'))) {
                imageUrl = val;
                break;
              } else if (typeof val === 'object' && val) {
                const extracted = val['imageUrl'] || val['image_url'] || val['image'] || val['url'] || 
                                 val['images.0'] || (val['images'] && val['images'][0]) || '';
                if (extracted) {
                  imageUrl = extracted;
                  break;
                }
              }
            }
          }
        }

        // 提取文本描述（如果有）
        textResult = data['text'] || data['description'] || data['content'] || '';
        
        console.log('[TextToImage] 提取的图片 URL:', imageUrl);
        console.log('[TextToImage] 提取的文本:', textResult);
      }

      if (!imageUrl || !imageUrl.trim()) {
        console.error('[TextToImage] 无法提取图片 URL，完整响应数据:', JSON.stringify(data, null, 2));
        throw new HttpException(
          `Unable to extract image URL from response. Response data: ${JSON.stringify(data)}`, 
          HttpStatus.BAD_GATEWAY
        );
      }

      console.log('[TextToImage] 成功生成图片:', imageUrl);
      return new SuccessResponse({ 
        data: {
          imageUrl: imageUrl,
          text: textResult || userPrompt,
        }
      });
    } catch (error) {
      console.error('[TextToImage] 文生图失败，错误对象:', error);
      
      // 如果是 axios 错误，打印响应数据
      if ((error as any)?.response) {
        const axiosError = error as any;
        console.error('[TextToImage] Axios 错误状态:', axiosError.response?.status);
        console.error('[TextToImage] Axios 错误数据:', JSON.stringify(axiosError.response?.data, null, 2));
        
        const errorData = axiosError.response?.data;
        let errorMessage = 'Text-to-image generation failed';
        
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (typeof errorData === 'object' && errorData) {
          errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
        }
        
        throw new HttpException(errorMessage, HttpStatus.BAD_GATEWAY);
      }
      
      // 其他错误
      const message = (error as Error)?.message || 'Text-to-image generation failed';
      throw new HttpException(message, HttpStatus.BAD_GATEWAY);
    }
  }

  @Post('/expand')
  public async expand(@Body() body: { text?: string }) {
    const userText = (body?.text || '').trim();
    if (!userText) {
      throw new HttpException('text is required', HttpStatus.BAD_REQUEST);
    }

    // Prefer config.yaml, fallback to env; never expose in frontend
    const apiKey = readConfig('textExpansion.apiKey', process.env.TEXT_EXPANSION_API_KEY || process.env.MONKEYS_API_KEY);
    if (!apiKey) {
      throw new HttpException('Server API key not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    try {
      const url = readConfig('textExpansion.expandUrl', process.env.TEXT_EXPANSION_URL || process.env.MONKEYS_EXPAND_URL);
      if (!url) {
        throw new HttpException(
          'Text expansion URL not configured. Please set textExpansion.expandUrl in config.yaml or TEXT_EXPANSION_URL env variable',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const { data } = await firstValueFrom(
        this.http.post(
          url,
          {
            inputData: {
              user_prompt: userText,
            },
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
          },
        ),
      );

      // Extract expanded text from various possible response formats
      let expandedText = '' as string;

      if (data && typeof data === 'object') {
        // 1) Keys like output1, output2...
        for (const key of Object.keys(data)) {
          if (key.startsWith('output')) {
            const val = data[key];
            if (typeof val === 'string' && val.trim()) {
              expandedText = val;
              break;
            }
          }
        }

        // 2) output field
        if (!expandedText && 'output' in data) {
          const out = data['output'];
          if (Array.isArray(out) && out[0]) {
            const first = out[0] as any;
            expandedText = first?.text || first?.content || first?.data || first?.value || '';
          } else if (typeof out === 'object' && out) {
            const o = out as any;
            expandedText = o?.text || o?.content || o?.data || o?.value || o?.result || o?.message || '';
          } else if (typeof out === 'string') {
            expandedText = out;
          }
        }

        // 3) Raw fields
        if (!expandedText) {
          expandedText = data['text'] || data['content'] || data['data'] || data['result'] || data['message'] || '';
        }

        // 4) rawOutput
        if (!expandedText && 'rawOutput' in data) {
          const ro = data['rawOutput'];
          if (Array.isArray(ro) && ro[0]) {
            const first = ro[0] as any;
            expandedText = first?.text || first?.content || first?.data || '';
          } else if (typeof ro === 'object' && ro) {
            const r = ro as any;
            expandedText = r?.text || r?.content || r?.data || '';
          } else if (typeof ro === 'string') {
            expandedText = ro;
          }
        }
      }

      if (!expandedText || !expandedText.trim()) {
        throw new HttpException('Unable to extract expansion result', HttpStatus.BAD_GATEWAY);
      }

      return new SuccessResponse({ data: expandedText });
    } catch (error) {
      const message = (error as any)?.response?.data || (error as Error)?.message || 'Expansion failed';
      throw new HttpException(typeof message === 'string' ? message : JSON.stringify(message), HttpStatus.BAD_GATEWAY);
    }
  }
}


