import { Injectable, Logger } from '@nestjs/common';
import { AgentV3ModelRegistryService } from './agent-v3.model-registry.service';
import { AgentV3HistoryService } from './agent-v3.history.service';
import { AgentV3MessageRepository } from '@/database/repositories/agent-v3-message.repository';
import { sseEvent, nowTs } from './agent-v3.sse';
import { streamText, tool, stepCountIs } from 'ai';
import { z } from 'zod';

export interface AgentV3RunLoopOptions {
  sessionId: string;
  teamId: string;
  userId: string;
  modelId?: string;
  userMessage: string;
  imageMediaIds?: string[];
  /**
   * 追加到默认系统提示词之后（用于特定场景，如 tldraw）
   */
  systemPrompt?: string;
  /**
   * 追加工具（会与内置 reasoning 工具合并）
   */
  tools?: Record<string, unknown>;
}

type ReasoningInput = {
  summary: string;
  next_actions: string[];
  ready_to_reply: boolean;
  concerns?: string;
  notes?: string;
};

const reasoningTool = tool<ReasoningInput, ReasoningInput>({
  description: 'Reflect on your progress and decide whether you are ready to reply.',
  inputSchema: z.object({
    summary: z.string(),
    next_actions: z.array(z.string()).default([]),
    ready_to_reply: z.boolean(),
    concerns: z.string().optional(),
    notes: z.string().optional(),
  }),
  execute: async (input) => input,
});

@Injectable()
export class AgentV3RunLoopService {
  private readonly logger = new Logger(AgentV3RunLoopService.name);

  constructor(
    private readonly modelRegistry: AgentV3ModelRegistryService,
    private readonly historyService: AgentV3HistoryService,
    private readonly messageRepo: AgentV3MessageRepository,
  ) {}

  private buildSystemPrompt(now: Date): string {
    const tz = 'Asia/Shanghai';
    const formatter = new Intl.DateTimeFormat('zh-CN', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const formatted = formatter.format(now);
    return `
You are Agent V3.

Current time (${tz}): ${formatted}

Available tools:
- reasoning: reflect on your reasoning progress and decide whether you are ready to reply.

Tool usage:
1. For non-trivial tasks, call the reasoning tool before giving a final answer.
2. When ready_to_reply is false, do NOT provide a final user-facing answer yet.
3. When ready_to_reply becomes true, respond to the user in natural language.
`.trim();
  }

  /**
   * 主循环：返回 SSE 字符串流
   */
  async *runAgentLoop(opts: AgentV3RunLoopOptions): AsyncGenerator<string> {
    const { sessionId, teamId, modelId, userMessage, imageMediaIds } = opts;
    const start = Date.now();

    // 初始状态
    yield sseEvent({
      type: 'status',
      status: 'processing',
      message: 'Processing your request...',
      timestamp: nowTs(),
    });

    // 写入本轮 user 消息到 DB
    const sequence = await this.messageRepo.getNextSequence(sessionId, teamId);
    const userContent = JSON.stringify([{ type: 'text', text: userMessage }, ...(imageMediaIds || []).map((id) => ({ type: 'image', media_id: id }))]);
    await this.messageRepo.insertMessage({
      sessionId,
      teamId,
      role: 'user',
      content: userContent,
      toolCallId: undefined,
      toolName: undefined,
      toolInput: undefined,
      toolOutput: undefined,
      modelId: undefined,
      sequence,
    });

    const maxIterations = 8;
    let iteration = 0;
    let readyToReply = false;

    while (iteration < maxIterations && !readyToReply) {
      iteration++;

      yield sseEvent({
        type: 'iteration_info',
        current_iteration: iteration,
        max_iterations: maxIterations,
        message: `Reasoning iteration ${iteration}`,
        timestamp: nowTs(),
      });

      const baseSystemPrompt = this.buildSystemPrompt(new Date());
      const systemPrompt = opts.systemPrompt ? `${baseSystemPrompt}\n\n${opts.systemPrompt}` : baseSystemPrompt;
      const model = this.modelRegistry.resolveModel(teamId, modelId);
      const history = await this.historyService.buildMessagesForModel(sessionId, teamId, systemPrompt);

      let pendingText = '';
      let lastReasoningReady: boolean | null = null;

      const tools = { reasoning: reasoningTool, ...(opts.tools || {}) };

      let stream;
      try {
        stream = streamText({
          model,
          messages: history,
          tools,
          toolChoice: 'auto',
          stopWhen: stepCountIs(20), // 允许最多20步推理，支持多轮工具调用
        });
      } catch (error) {
        this.logger.error(`[AgentV3] Failed to create stream: ${error.message}`, error.stack);
        throw error;
      }

      // streaming: 文本 + 工具调用
      try {
        for await (const event of stream.fullStream) {
          // NOTE: AI SDK v5 事件模型参考文档，这里只用到 text/tool-calls 的基本能力
          if (event.type === 'text-delta') {
            const delta = event.text ?? '';
            if (!delta) continue;
            pendingText += delta;
            // 这里可以按需拆分为 content_start/content_delta 事件，目前简化为最终一次性下发
          }

          if (event.type === 'tool-call') {
            const toolName = event.toolName;
            const toolCallId = event.toolCallId;
            const args = 'args' in event ? event.args : (event as any).input;

            yield sseEvent({
              type: 'tool_call',
              tool_call_id: toolCallId,
              tool_name: toolName,
              tool_input: args,
              timestamp: nowTs(),
            });

            yield sseEvent({
              type: 'tool_executing',
              tool_call_id: toolCallId,
              tool_name: toolName,
              message: `Executing tool ${toolName}...`,
              timestamp: nowTs(),
            });

            if (toolName === 'reasoning') {
              try {
                const seq = await this.messageRepo.getNextSequence(sessionId, teamId);
                await this.messageRepo.insertMessage({
                  sessionId,
                  teamId,
                  role: 'assistant',
                  content: '',
                  toolCallId,
                  toolName,
                  toolInput: JSON.stringify(args),
                  toolOutput: undefined,
                  modelId,
                  sequence: seq,
                });
                await this.messageRepo.insertMessage({
                  sessionId,
                  teamId,
                  role: 'tool',
                  content: args?.summary || '',
                  toolCallId,
                  toolName,
                  toolInput: undefined,
                  toolOutput: JSON.stringify(args),
                  modelId: undefined,
                  sequence: seq + 1,
                });
              } catch (e) {
                this.logger.warn(`AgentV3 reasoning persistence error: ${(e as Error).message}`);
              }

              lastReasoningReady = !!args?.ready_to_reply;

              yield sseEvent({
                type: 'tool_result',
                tool_call_id: toolCallId,
                tool_name: toolName,
                tool_output: args,
                success: true,
                timestamp: nowTs(),
              });
            }
          }

          if (event.type === 'tool-result') {
            const toolCallId = event.toolCallId;
            const toolName = event.toolName;
            const result = 'result' in event ? event.result : (event as any).output;

            // reasoning 工具已在 tool-call 事件中处理，跳过避免重复
            if (toolName !== 'reasoning') {
              yield sseEvent({
                type: 'tool_result',
                tool_call_id: toolCallId,
                tool_name: toolName,
                tool_output: result,
                success: true,
                timestamp: nowTs(),
              });
            }
          }

          if (event.type === 'finish') {
            break;
          }
        }

        readyToReply = lastReasoningReady ?? true;
      } catch (streamError) {
        this.logger.error(`[AgentV3] Stream error: ${streamError.message}`, streamError.stack);

        yield sseEvent({
          type: 'error',
          error_code: 'STREAM_ERROR',
          error_message: streamError.message,
          timestamp: nowTs(),
        });

        return;
      }

      if (readyToReply) {
        const finalText = pendingText.trim();
        const seq = await this.messageRepo.getNextSequence(sessionId, teamId);
        await this.messageRepo.insertMessage({
          sessionId,
          teamId,
          role: 'assistant',
          content: finalText,
          toolCallId: undefined,
          toolName: undefined,
          toolInput: undefined,
          toolOutput: undefined,
          modelId,
          sequence: seq,
        });

        yield sseEvent({
          type: 'content_start',
          message: 'Starting response generation...',
          guarded: false,
          timestamp: nowTs(),
        });

        yield sseEvent({
          type: 'content_delta',
          delta: finalText,
          guarded: false,
          timestamp: nowTs(),
        });

        yield sseEvent({
          type: 'content_done',
          guarded: false,
          timestamp: nowTs(),
        });

        yield sseEvent({
          type: 'status',
          status: 'done',
          message: 'Completed',
          timestamp: nowTs(),
        });

        const duration = (Date.now() - start) / 1000;
        yield sseEvent({
          type: 'done',
          total_duration: duration,
          timestamp: nowTs(),
        });
        return;
      }
    }

    // 未能在 maxIterations 内完成
    const fallback = 'I was unable to complete the task within the allowed steps.';
    const seq = await this.messageRepo.getNextSequence(sessionId, teamId);
    await this.messageRepo.insertMessage({
      sessionId,
      teamId,
      role: 'assistant',
      content: fallback,
      toolCallId: undefined,
      toolName: undefined,
      toolInput: undefined,
      toolOutput: undefined,
      modelId,
      sequence: seq,
    });

    yield sseEvent({
      type: 'content_start',
      message: 'Starting response generation...',
      guarded: false,
      timestamp: nowTs(),
    });

    yield sseEvent({
      type: 'content_delta',
      delta: fallback,
      guarded: false,
      timestamp: nowTs(),
    });

    yield sseEvent({
      type: 'content_done',
      guarded: false,
      timestamp: nowTs(),
    });

    yield sseEvent({
      type: 'status',
      status: 'done',
      message: 'Completed',
      timestamp: nowTs(),
    });

    const duration = (Date.now() - start) / 1000;
    yield sseEvent({
      type: 'done',
      total_duration: duration,
      timestamp: nowTs(),
    });
  }
}
