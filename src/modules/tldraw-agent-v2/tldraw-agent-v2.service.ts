import { Injectable, Logger } from '@nestjs/common';
import { TldrawAgentV2BridgeService, TldrawAgentV2Callbacks, TldrawAgentV2Request } from './services/tldraw-agent-v2-bridge.service';

export interface TldrawAgentV2StreamCallbacks {
  onInfo?: (message: string) => void;
  onDelta?: (payload: { content?: string; action?: any }) => void;
  onDone?: (message: string) => void;
  onError?: (message: string) => void;
}

@Injectable()
export class TldrawAgentV2Service {
  private readonly logger = new Logger(TldrawAgentV2Service.name);

  constructor(
    private readonly bridgeService: TldrawAgentV2BridgeService,
  ) {}

  /**
   * 启动流式处理
   */
  async startStream(
    sessionId: string,
    request: TldrawAgentV2Request,
    callbacks: TldrawAgentV2StreamCallbacks = {},
  ): Promise<void> {
    this.logger.log(`Starting stream for session: ${sessionId}`);

    try {
      // 转换回调格式
      const agentCallbacks: TldrawAgentV2Callbacks = {
        onMessage: (chunk: string) => {
          callbacks.onDelta?.({ content: chunk });
        },
        onToolCall: (toolCalls: any[]) => {
          toolCalls.forEach(tool => {
            callbacks.onDelta?.({ action: tool });
          });
        },
        onToolResult: (tool: any, result: any) => {
          // 工具执行结果处理
          this.logger.log(`Tool ${tool._type} completed`);
        },
        onComplete: (finalMessage: string) => {
          callbacks.onDone?.(finalMessage);
        },
        onError: (error: Error) => {
          callbacks.onError?.(error.message);
        },
      };

      // 处理请求 - 使用流式处理
      await this.bridgeService.processStreamRequest(sessionId, request, agentCallbacks);

    } catch (error) {
      this.logger.error(`Stream processing failed for session ${sessionId}:`, error);
      callbacks.onError?.(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * 启动新会话
   */
  async startSession(
    agentId: string,
    userId: string,
    teamId: string,
    editor?: any,
  ): Promise<string> {
    return this.bridgeService.startSession(agentId, userId, teamId, editor);
  }

  /**
   * 获取会话信息
   */
  getSession(sessionId: string) {
    return this.bridgeService.getSession(sessionId);
  }

  /**
   * 停止会话
   */
  async stopSession(sessionId: string): Promise<void> {
    return this.bridgeService.stopSession(sessionId);
  }

  /**
   * 更新会话的editor实例
   */
  updateSessionEditor(sessionId: string, editor: any): void {
    this.bridgeService.updateSessionEditor(sessionId, editor);
  }


  /**
   * 取消会话
   */
  cancelSession(sessionId: string): void {
    this.stopSession(sessionId);
  }

  /**
   * 重置会话
   */
  resetSession(sessionId: string): void {
    this.stopSession(sessionId);
  }
}
