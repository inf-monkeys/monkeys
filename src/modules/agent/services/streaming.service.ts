import { Injectable, Logger } from '@nestjs/common';
import { streamText } from 'ai';
import { ModelRegistryService } from './model-registry.service';
import { MessageService, Message } from './message.service';
import { ThreadService } from './thread.service';
import { AgentService } from './agent.service';
import { UIMessagePart } from '@/database/entities/agents/message.entity';

export interface StreamOptions {
  threadId: string;
  teamId: string;
  userId: string;
  agentId?: string;
  modelId?: string;
  userMessage: string;
  imageMediaIds?: string[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface SSEEvent {
  type: string;
  [key: string]: any;
}

/**
 * 流式处理服务
 *
 * **职责**：
 * - 使用 AI SDK v6 进行流式对话
 * - 处理工具调用
 * - 保存消息到数据库
 * - 返回 SSE 格式的事件流
 */
@Injectable()
export class StreamingService {
  private readonly logger = new Logger(StreamingService.name);

  constructor(
    private readonly modelRegistry: ModelRegistryService,
    private readonly messageService: MessageService,
    private readonly threadService: ThreadService,
    private readonly agentService: AgentService,
  ) {}

  /**
   * 主流式处理方法 - 返回 AI SDK 标准格式
   * 供 assistant-ui 直接使用
   */
  async streamForAssistantUI(opts: StreamOptions): Promise<any> {
    const { threadId, teamId, userId, userMessage, imageMediaIds, agentId } = opts;

    try {
      // 1. 设置 Thread 为运行状态
      await this.threadService.setRunning(threadId, true, teamId);

      // 2. 保存用户消息
      await this.messageService.saveUserMessage({
        threadId,
        teamId,
        text: userMessage,
        mediaIds: imageMediaIds,
      });

      // 3. 获取 Agent 配置
      let agent = null;
      if (agentId) {
        agent = await this.agentService.get(agentId, teamId);
      }

      // 4. 确定模型
      const modelId = opts.modelId || agent?.config.model || 'openai:gpt-4';
      const model = this.modelRegistry.resolveModel(modelId);

      // 5. 获取历史消息
      const history = await this.messageService.getThreadHistory(threadId, teamId);

      // 6. 构建系统提示词
      const systemPrompt = this.buildSystemPrompt(opts.systemPrompt || agent?.config.instructions);

      // 7. 准备参数
      const temperature = opts.temperature ?? agent?.config.temperature ?? 0.7;

      this.logger.debug(`Starting AI SDK stream for thread ${threadId}`);

      // 8. 使用 AI SDK streamText
      const result = streamText({
        model,
        system: systemPrompt,
        messages: history as any,
        temperature,
      });

      // 9. 在后台保存消息（不阻塞流）
      // 使用异步 IIFE 来处理保存逻辑
      (async () => {
        try {
          const fullText = await result.text;
          const usage = await result.usage;
          const finishReason = await result.finishReason;

          await this.messageService.saveAssistantMessage({
            threadId,
            teamId,
            parts: [{ type: 'text', text: fullText }],
            metadata: {
              model: modelId,
              tokens: usage
                ? {
                    prompt: (usage as any).promptTokens || 0,
                    completion: (usage as any).completionTokens || 0,
                    total: (usage as any).totalTokens || 0,
                  }
                : undefined,
              finishReason: finishReason as any,
            },
          });

          await this.threadService.setRunning(threadId, false, teamId);
        } catch (error) {
          this.logger.error(`Error saving message for thread ${threadId}:`, error);
          await this.threadService.setRunning(threadId, false, teamId);
        }
      })();

      // 10. 返回 AI SDK 标准流响应
      return result;
    } catch (error) {
      this.logger.error(`Stream error for thread ${threadId}:`, error);
      await this.threadService.setRunning(threadId, false, teamId);
      throw error;
    }
  }

  /**
   * 旧的 SSE 格式流式处理（向后兼容）
   */
  async *streamAgentResponse(opts: StreamOptions): AsyncGenerator<string> {
    const { threadId, teamId, userId, userMessage, imageMediaIds, agentId } = opts;

    try {
      // 1. 设置 Thread 为运行状态
      await this.threadService.setRunning(threadId, true, teamId);

      // 2. 保存用户消息
      await this.messageService.saveUserMessage({
        threadId,
        teamId,
        text: userMessage,
        mediaIds: imageMediaIds,
      });

      // 3. 获取 Agent 配置（如果提供了 agentId）
      let agent = null;
      if (agentId) {
        agent = await this.agentService.get(agentId, teamId);
      }

      // 4. 确定使用的模型
      const modelId = opts.modelId || agent?.config.model || 'openai:gpt-4';
      const model = this.modelRegistry.resolveModel(modelId);

      // 5. 获取历史消息
      const history = await this.messageService.getThreadHistory(threadId, teamId);

      // 6. 构建系统提示词
      const systemPrompt = this.buildSystemPrompt(opts.systemPrompt || agent?.config.instructions);
      const messages: Message[] = [{ role: 'system', content: systemPrompt }, ...history];

      // 7. 准备模型参数
      const temperature = opts.temperature ?? agent?.config.temperature ?? 0.7;

      // 8. 开始流式处理
      this.logger.debug(`Starting stream for thread ${threadId} with model ${modelId}`);

      // AI SDK v6 streamText 参数
      const stream = streamText({
        model,
        messages: messages as any, // AI SDK v6 会自动处理消息格式
        temperature,
        // maxTokens 在 v6 中可能不在顶层参数，而是在 model 配置中
        // tools: 稍后添加工具支持
      });

      // 9. 处理流式事件
      const assistantParts: UIMessagePart[] = [];
      let textContent = '';

      // AI SDK v6 使用 textStream
      for await (const chunk of stream.textStream) {
        // 文本增量
        textContent += chunk;

        yield this.sseEvent({
          type: 'content_delta',
          delta: chunk,
          timestamp: Date.now(),
        });
      }

      // 10. 等待流完成并获取结果
      const result = await stream;

      // 保存 assistant 消息
      if (textContent) {
        assistantParts.push({ type: 'text', text: textContent });
      }

      // AI SDK v6 的 usage 和 finishReason 结构
      const usage = await result.usage;
      const finishReason = await result.finishReason;

      await this.messageService.saveAssistantMessage({
        threadId,
        teamId,
        parts: assistantParts,
        metadata: {
          model: modelId,
          tokens: usage
            ? {
                prompt: (usage as any).promptTokens || 0,
                completion: (usage as any).completionTokens || 0,
                total: (usage as any).totalTokens || 0,
              }
            : undefined,
          finishReason: finishReason as any,
        },
      });

      // 11. 发送完成事件
      yield this.sseEvent({
        type: 'done',
        usage: usage,
        finishReason: finishReason,
        timestamp: Date.now(),
      });
    } catch (error) {
      this.logger.error(`Stream error for thread ${threadId}:`, error);

      yield this.sseEvent({
        type: 'error',
        error: error.message,
        timestamp: Date.now(),
      });
    } finally {
      // 12. 设置 Thread 为非运行状态
      await this.threadService.setRunning(threadId, false, teamId);
    }
  }

  /**
   * 构建系统提示词
   */
  private buildSystemPrompt(customPrompt?: string): string {
    const base = `You are a helpful AI assistant powered by Monkeys platform.`;
    return customPrompt ? `${base}\n\n${customPrompt}` : base;
  }

  /**
   * 格式化为 SSE 事件
   */
  private sseEvent(data: SSEEvent): string {
    return `data: ${JSON.stringify(data)}\n\n`;
  }
}
