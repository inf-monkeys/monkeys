import { readConfig } from '@/common/config/readYaml';
import { SuccessResponse } from '@/common/response';
import { HttpService } from '@nestjs/axios';
import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Controller('/text-expansion')
export class TextExpansionController {
  constructor(private readonly http: HttpService) {}

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
      const url = 'https://artist.infmonkeys.com/api/workflow/executions/6900c009e24dec807a305671/start-sync';

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


