import { AgentV3MessageRepository } from '@/database/repositories/agent-v3-message.repository';
import { Injectable, Logger } from '@nestjs/common';
import { ModelMessage } from 'ai';
import { MediaFileRepository } from '@/database/repositories/media.repository';
import { MediaFileEntity } from '@/database/entities/assets/media/media-file';
import { MediaFileService } from '@/modules/assets/media/media.service';

@Injectable()
export class AgentV3HistoryService {
  private readonly logger = new Logger(AgentV3HistoryService.name);

  constructor(
    private readonly messageRepo: AgentV3MessageRepository,
    private readonly mediaRepo: MediaFileRepository,
    private readonly mediaService: MediaFileService,
  ) {}

  /**
   * 构建发送给 LLM 的消息列表。
   * - 完整保留所有工具 result（包括 reasoning）
   * - 对 reasoning 工具的 assistant tool_call 清空 arguments
   */
  async buildMessagesForModel(sessionId: string, teamId: string, systemPrompt: string): Promise<ModelMessage[]> {
    const rows = await this.messageRepo.listAllForSession(sessionId, teamId);

    const messages: ModelMessage[] = [];

    // system prompt 作为第一条消息
    messages.push({
      role: 'system',
      content: systemPrompt,
    });

    for (const row of rows) {
      const { role, content, toolCallId, toolName, toolInput, toolOutput } = row;

      if (role === 'system') {
        // 已由 systemPrompt 覆盖，这里忽略
        continue;
      }

      if (role === 'user') {
        let parts: any[] = [];
        try {
          parts = content ? JSON.parse(content) : [];
        } catch {
          parts = content ? [{ type: 'text', text: content }] : [];
        }

        const textParts = parts.filter((p) => p?.type === 'text').map((p) => p.text as string);
        const imageParts = parts.filter((p) => p?.type === 'image' && p.media_id);

        const mergedText = textParts.join('\n').trim();
        const imageUrls: string[] = [];

        for (const img of imageParts) {
          const mediaId = img.media_id as string;
          if (!mediaId) continue;
          const media = await this.mediaRepo.getMediaByIdAndTeamId(mediaId, teamId);
          if (media && (media as MediaFileEntity).type === 'image') {
            const url = await this.mediaService.getPublicUrl(media as MediaFileEntity);
            imageUrls.push(url);
          }
        }

        const contentParts: any[] = [];
        if (mergedText) {
          contentParts.push({ type: 'text', text: mergedText });
        }
        for (const url of imageUrls) {
          contentParts.push({ type: 'image', image: url });
        }

        // 只在有图片时使用数组格式，纯文本时使用字符串格式（兼容代理服务器）
        messages.push({
          role: 'user',
          content: imageUrls.length > 0 ? contentParts : mergedText || '',
        });
        continue;
      }

      if (role === 'assistant' && toolCallId && toolName) {
        let argsForModel = toolInput;
        if (toolName === 'reasoning') {
          // reasoning 工具的 input 不回灌给 LLM
          argsForModel = '';
        }

        // 解析 toolInput（数据库中存储为 JSON 字符串）
        let input: any;
        if (typeof argsForModel === 'string') {
          if (argsForModel === '') {
            input = {}; // 空字符串转为空对象
          } else {
            try {
              input = JSON.parse(argsForModel);
            } catch {
              // 如果解析失败，保持为字符串
              input = argsForModel;
            }
          }
        } else {
          input = argsForModel;
        }

        // AI SDK v5 标准格式：content 是包含 tool-call part 的数组
        messages.push({
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolCallId: toolCallId,
              toolName: toolName,
              input: input,
            },
          ],
        } as any);
        continue;
      }

      if (role === 'tool' && toolCallId && toolName) {
        let payload: any = toolOutput;
        if (typeof payload === 'string') {
          try {
            payload = JSON.parse(payload);
          } catch {
            // keep as string
          }
        }

        // AI SDK v5 标准格式：使用 LanguageModelV2ToolResultOutput
        // 参考：createToolModelOutput 函数的实现
        const output = typeof payload === 'string' ? { type: 'text' as const, value: payload } : { type: 'json' as const, value: payload === undefined ? null : payload };

        // AI SDK v5 标准：tool 消息的 content 是 ToolResultPart 数组
        messages.push({
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId,
              toolName,
              output,
            },
          ],
        } as any);
        continue;
      }

      if (role === 'assistant' && !toolCallId) {
        const text = content || '';
        if (text.trim()) {
          messages.push({
            role: 'assistant',
            content: text,
          });
        }
        continue;
      }
    }

    return messages;
  }
}
