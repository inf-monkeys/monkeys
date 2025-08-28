import { Injectable } from '@nestjs/common';
import { Response } from 'express';

export interface ReActStepEvent {
  type: 'step_start' | 'step_progress' | 'step_complete' | 'task_complete' | 'error';
  stepId: string;
  stepType: 'new_task' | 'update_todo_list' | 'ask_followup_question' | 'task_completion' | 'thinking';
  timestamp: number;
  data: {
    title?: string;
    content?: string;
    result?: string;
    toolCall?: {
      name: string;
      arguments: any;
    };
    todos?: Array<{
      id: string;
      content: string;
      status: 'pending' | 'in_progress' | 'completed';
    }>;
    question?: string;
    suggestions?: string[];
    error?: string;
  };
}

/**
 * ReAct步骤管理器 - 负责管理和发送ReAct执行步骤的实时事件
 */
@Injectable()
export class ReActStepManager {
  private sessions = new Map<
    string,
    {
      response: Response;
      steps: ReActStepEvent[];
      currentStep: number;
      maxSteps: number;
      isActive: boolean;
    }
  >();

  /**
   * 初始化ReAct会话
   */
  initializeSession(sessionId: string, response: Response, maxSteps: number = 10) {
    console.log(`[ReActStepManager] 初始化会话: ${sessionId}`);

    // 设置SSE响应头
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // 发送初始连接事件
    this.sendSSEEvent(response, 'connected', {
      sessionId,
      timestamp: Date.now(),
      maxSteps,
    });

    this.sessions.set(sessionId, {
      response,
      steps: [],
      currentStep: 0,
      maxSteps,
      isActive: true,
    });

    // 处理客户端断开连接
    response.on('close', () => {
      console.log(`[ReActStepManager] 客户端断开连接: ${sessionId}`);
      this.closeSession(sessionId);
    });

    return sessionId;
  }

  /**
   * 发送步骤开始事件
   */
  sendStepStart(sessionId: string, stepType: ReActStepEvent['stepType'], title: string, toolCall?: any) {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) return;

    const stepId = `step_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const event: ReActStepEvent = {
      type: 'step_start',
      stepId,
      stepType,
      timestamp: Date.now(),
      data: {
        title,
        toolCall,
      },
    };

    session.steps.push(event);
    session.currentStep++;

    console.log(`[ReActStepManager] 发送步骤开始: ${sessionId} - ${stepType} - ${title}`);

    this.sendSSEEvent(session.response, 'step_start', event);
    return stepId;
  }

  /**
   * 发送步骤进度事件
   */
  sendStepProgress(sessionId: string, stepId: string, content: string) {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) return;

    const event: ReActStepEvent = {
      type: 'step_progress',
      stepId,
      stepType: 'thinking', // 默认为思考步骤
      timestamp: Date.now(),
      data: {
        content,
      },
    };

    this.sendSSEEvent(session.response, 'step_progress', event);
  }

  /**
   * 发送步骤完成事件
   */
  sendStepComplete(sessionId: string, stepId: string, result: string, metadata?: any) {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) return;

    // 找到对应的步骤并更新
    const step = session.steps.find((s) => s.stepId === stepId);
    if (!step) return;

    const event: ReActStepEvent = {
      type: 'step_complete',
      stepId,
      stepType: step.stepType,
      timestamp: Date.now(),
      data: {
        ...step.data,
        result,
        ...metadata,
      },
    };

    console.log(`[ReActStepManager] 发送步骤完成: ${sessionId} - ${stepId}`);

    this.sendSSEEvent(session.response, 'step_complete', event);
  }

  /**
   * 发送任务完成事件
   */
  sendTaskComplete(sessionId: string, finalResult: string, summary?: string) {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) return;

    const event: ReActStepEvent = {
      type: 'task_complete',
      stepId: `final_${Date.now()}`,
      stepType: 'task_completion',
      timestamp: Date.now(),
      data: {
        title: '任务完成',
        result: finalResult,
        content: summary,
      },
    };

    console.log(`[ReActStepManager] 发送任务完成: ${sessionId}`);

    this.sendSSEEvent(session.response, 'task_complete', event);

    // 关闭会话
    setTimeout(() => {
      this.closeSession(sessionId);
    }, 1000);
  }

  /**
   * 发送错误事件
   */
  sendError(sessionId: string, error: string, stepId?: string) {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) return;

    const event: ReActStepEvent = {
      type: 'error',
      stepId: stepId || `error_${Date.now()}`,
      stepType: 'thinking',
      timestamp: Date.now(),
      data: {
        error,
      },
    };

    console.log(`[ReActStepManager] 发送错误: ${sessionId} - ${error}`);

    this.sendSSEEvent(session.response, 'error', event);
  }

  /**
   * 检查会话是否存在且活跃
   */
  isSessionActive(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    return session ? session.isActive : false;
  }

  /**
   * 获取会话信息
   */
  getSession(sessionId: string) {
    return this.sessions.get(sessionId);
  }

  /**
   * 关闭会话
   */
  closeSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      console.log(`[ReActStepManager] 关闭会话: ${sessionId}`);
      session.isActive = false;
      if (!session.response.destroyed) {
        this.sendSSEEvent(session.response, 'close', { sessionId });
        session.response.end();
      }
      this.sessions.delete(sessionId);
    }
  }

  /**
   * 发送SSE事件
   */
  private sendSSEEvent(response: Response, event: string, data: any) {
    if (response.destroyed) return;

    try {
      const eventData = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      response.write(eventData);
    } catch (error) {
      console.error(`[ReActStepManager] 发送SSE事件失败:`, error);
    }
  }

  /**
   * 清理所有过期会话（定期调用）
   */
  cleanupExpiredSessions(maxAge: number = 30 * 60 * 1000) {
    // 30分钟
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      const lastActivity = session.steps.length > 0 ? Math.max(...session.steps.map((s) => s.timestamp)) : now;

      if (now - lastActivity > maxAge) {
        console.log(`[ReActStepManager] 清理过期会话: ${sessionId}`);
        this.closeSession(sessionId);
      }
    }
  }
}
