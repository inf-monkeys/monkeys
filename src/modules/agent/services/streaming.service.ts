import { generateDbId } from '@/common/utils';
import { UIMessagePart } from '@/database/entities/agents/message.entity';
import { forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { streamText } from 'ai';
import { AgentToolExecutorService } from './agent-tool-executor.service';
import { AgentToolRegistryService } from './agent-tool-registry.service';
import { AgentService } from './agent.service';
import { Message, MessageService } from './message.service';
import { ModelRegistryService } from './model-registry.service';
import { ThreadService } from './thread.service';

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
    @Inject(forwardRef(() => AgentToolRegistryService))
    private readonly agentToolRegistry: AgentToolRegistryService,
    @Inject(forwardRef(() => AgentToolExecutorService))
    private readonly agentToolExecutor: AgentToolExecutorService,
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
      const userMsg = await this.messageService.saveUserMessage({
        threadId,
        teamId,
        text: userMessage,
        mediaIds: imageMediaIds,
      });

      // 3. 获取或创建 Agent 配置
      let agent = null;
      if (agentId) {
        try {
          // 尝试获取或自动创建默认 agent
          this.logger.debug(`Attempting to get or create agent: ${agentId}`);
          agent = await this.agentService.getOrCreateDefaultAgent(agentId, teamId, userId);
          this.logger.debug(`Agent resolved: ${agent.id}, name: ${agent.name}`);
        } catch (error) {
          this.logger.error(`Failed to get or create default agent ${agentId}:`, error);
          // 如果不是默认 agent 且不存在，尝试直接获取
          if (error instanceof NotFoundException) {
            try {
              agent = await this.agentService.get(agentId, teamId);
              this.logger.debug(`Agent found by direct lookup: ${agent.id}`);
            } catch {
              this.logger.warn(`Agent ${agentId} not found, using default configuration`);
              // 继续执行，使用默认配置
            }
          } else {
            // 其他错误，抛出
            throw error;
          }
        }
      }

      // 4. 确定模型
      const modelId = opts.modelId || agent?.config.model || 'openai:gpt-4';
      const model = this.modelRegistry.resolveModel(modelId);

      // 5. 获取历史消息（不包含当前用户消息），并在构建请求时显式追加本次用户输入
      const history = await this.messageService.getThreadHistory(threadId, teamId);

      // 6. 构建系统提示词
      const systemPrompt = this.buildSystemPrompt(opts.systemPrompt || agent?.config.instructions);

      // 7. 准备参数
      const temperature = opts.temperature ?? agent?.config.temperature ?? 0.7;
      const maxSteps = agent?.config.stopWhen?.maxSteps || 20;

      // 将系统提示词 + 历史 + 本次用户消息一起传入模型，确保当前轮能及时响应
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userMessage },
      ] as Message[];

      // 8. 获取工具（如果启用）
      //
      // 重要说明：
      // - 目前 Registry 转换出来的 AI SDK tools 仅包含 schema（无 execute），
      //   这会导致模型在“先 tool-call 再说话”的场景卡住（尤其是 tldraw-assistant）。
      // - 这里对 server-side tools 提供 execute（委托给 AgentToolExecutor），
      //   对 clientSide 工具直接跳过（前端执行链路暂未在后端 tool loop 中实现）。
      //
      // 这样至少保证：tldraw 默认 agent 不会产生“0 字节 chat 响应”，能正常给出文本回复。
      let tools: Record<string, any> | undefined;
      if (agent?.config.tools?.enabled) {
        try {
          const toolNames = agent.config.tools.toolNames || [];
          const built: Record<string, any> = {};

          for (const toolName of toolNames) {
            try {
              const resolvedTool = await this.agentToolRegistry.getToolByName(toolName, teamId);
              const isClientSide = resolvedTool?.metadata?.clientSide === true;

              // clientSide 工具：先不交给模型（否则会 tool-call 卡死）
              if (isClientSide) continue;

              built[toolName] = {
                description: resolvedTool.description,
                parameters: resolvedTool.parameters,
                execute: async (args: any, ctx: any) => {
                  const toolCallId = ctx?.toolCallId || ctx?.id;
                  const execResult = await this.agentToolExecutor.execute({
                    threadId,
                    // 这里没有 assistant messageId，先用 user message id 关联即可
                    messageId: userMsg.id,
                    teamId,
                    userId,
                    toolCallId,
                    toolName,
                    args,
                  });

                  if (execResult.success) return execResult.result;
                  throw new Error(execResult.error?.message || 'Tool execution failed');
                },
              };
            } catch (e) {
              this.logger.warn(`Failed to load tool ${toolName}: ${e?.message || e}`);
            }
          }

          tools = Object.keys(built).length > 0 ? built : undefined;
          this.logger.log(
            `✅ Tools prepared for agent ${agent.id} (${agent.name}): ${
              tools ? `enabled (${Object.keys(tools).length})` : 'disabled (no server-side tools)'
            }`,
          );
        } catch (error) {
          this.logger.error(`❌ Failed to prepare tools for agent ${agent?.id}:`, error);
        }
      } else {
        this.logger.warn(
          `⚠️ Tools not enabled for agent. agent?.config.tools?.enabled = ${agent?.config.tools?.enabled}`,
        );
      }

      this.logger.log(`🚀 Starting AI SDK stream for thread ${threadId}, tools: ${tools ? `enabled (${Object.keys(tools || {}).length} tools)` : 'disabled'}`);

      // 9. 使用 AI SDK streamText（包含工具）
      const result = streamText({
        model,
        system: systemPrompt,
        messages: messages as any,
        temperature,
        tools,
      });

      // 10. 在后台处理完整流（包含工具调用）
      (async () => {
        try {
          const parts: UIMessagePart[] = [];
          const toolCalls: any[] = [];

          // 监听完整流事件
          for await (const event of result.fullStream) {
            if (event.type === 'text-delta') {
              // 文本增量 - 在完成时一起保存
            } else if (event.type === 'tool-call') {
              // 工具调用事件
              const toolCallId = event.toolCallId;
              const toolName = event.toolName;
              const args = (event as any).args || event.input;

              this.logger.debug(`Tool call: ${toolName} (${toolCallId})`);

              // 检查工具是否为前端执行类型
              try {
                const tool = await this.agentToolRegistry.getToolByName(toolName, teamId);
                const isClientSide = tool?.metadata?.clientSide === true;

                if (isClientSide) {
                  // 前端执行的工具，跳过后端执行，仅记录调用
                  this.logger.debug(`Tool ${toolName} is client-side, skipping backend execution`);
                  toolCalls.push({
                    toolCallId,
                    toolName,
                    args,
                    result: null, // 结果由前端提供
                    clientSide: true,
                  });
                  continue;
                }
              } catch (error) {
                this.logger.warn(`Failed to check tool ${toolName} metadata:`, error.message);
              }

              // 后端执行工具
              try {
                const toolResult = await this.agentToolExecutor.execute({
                  threadId,
                  messageId: generateDbId(), // 临时 ID
                  teamId,
                  userId,
                  toolCallId,
                  toolName,
                  args,
                });

                toolCalls.push({
                  toolCallId,
                  toolName,
                  args,
                  result: toolResult.result,
                  error: toolResult.error,
                });
              } catch (error) {
                this.logger.error(`Tool execution failed for ${toolName}:`, error);
                toolCalls.push({
                  toolCallId,
                  toolName,
                  args,
                  error: {
                    message: error.message || 'Tool execution failed',
                  },
                });
              }
            }
          }

          // 获取最终结果
          const fullText = await result.text;
          const usage = await result.usage;
          const finishReason = await result.finishReason;

          // 构建消息 parts
          if (fullText) {
            parts.push({ type: 'text', text: fullText });
          }

          // 添加工具调用 parts
          for (const tc of toolCalls) {
            parts.push({
              type: 'tool-call',
              toolCallId: tc.toolCallId,
              toolName: tc.toolName,
              args: tc.args,
              state: tc.error ? 'output-error' : 'output-available',
              result: tc.result,
              isError: !!tc.error,
            } as any);

            if (tc.result || tc.error) {
              parts.push({
                type: 'tool-result',
                toolCallId: tc.toolCallId,
                toolName: tc.toolName,
                result: tc.result || tc.error,
                isError: !!tc.error,
              } as any);
            }
          }

          // 保存完整消息
          await this.messageService.saveAssistantMessage({
            threadId,
            teamId,
            parts,
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

      // 11. 返回 AI SDK 标准流响应
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

      // 3. 获取或创建 Agent 配置（如果提供了 agentId）
      let agent = null;
      if (agentId) {
        try {
          // 尝试获取或自动创建默认 agent
          this.logger.debug(`[SSE] Attempting to get or create agent: ${agentId}`);
          agent = await this.agentService.getOrCreateDefaultAgent(agentId, teamId, userId);
          this.logger.debug(`[SSE] Agent resolved: ${agent.id}, name: ${agent.name}`);
        } catch (error) {
          this.logger.error(`[SSE] Failed to get or create default agent ${agentId}:`, error);
          // 如果不是默认 agent 且不存在，尝试直接获取
          if (error instanceof NotFoundException) {
            try {
              agent = await this.agentService.get(agentId, teamId);
              this.logger.debug(`[SSE] Agent found by direct lookup: ${agent.id}`);
            } catch {
              this.logger.warn(`[SSE] Agent ${agentId} not found, using default configuration`);
              // 继续执行，使用默认配置
            }
          } else {
            // 其他错误，抛出
            throw error;
          }
        }
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
