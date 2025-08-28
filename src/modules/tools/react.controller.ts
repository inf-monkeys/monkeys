import { Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReActStepManager } from './builtin/react-step-manager';
import { ReActToolsService } from './builtin/react-tools';

@Controller('react')
export class ReActController {
  constructor(
    private readonly reactToolsService: ReActToolsService,
    private readonly stepManager: ReActStepManager,
  ) {}

  /**
   * 测试端点 - 验证路由是否正常工作
   */
  @Get('test')
  testEndpoint() {
    return {
      success: true,
      message: 'ReAct controller is working!',
      timestamp: Date.now()
    };
  }

  /**
   * 建立ReAct步骤的SSE连接
   */
  @Get('session/:sessionId/stream')
  streamReActSteps(@Param('sessionId') sessionId: string, @Query('maxSteps') maxSteps: string, @Res() response: Response) {
    const maxStepsNum = parseInt(maxSteps) || 10;
    console.log(`[ReActController] 建立SSE连接: ${sessionId}, maxSteps: ${maxStepsNum}`);

    // 初始化SSE会话
    this.stepManager.initializeSession(sessionId, response, maxStepsNum);

    // 注意：这里不要调用 response.end()，因为SSE连接需要保持开放
  }

  @Get('task/:sessionId/status')
  getTaskStatus(@Param('sessionId') sessionId: string) {
    const taskState = this.reactToolsService.getTaskState(sessionId);
    return {
      success: true,
      data: taskState,
    };
  }

  @Post('task/:sessionId/pause')
  pauseTask(@Param('sessionId') sessionId: string) {
    const success = this.reactToolsService.pauseTask(sessionId);
    return {
      success,
      message: success ? 'Task paused successfully' : 'Failed to pause task',
    };
  }

  @Post('task/:sessionId/resume')
  resumeTask(@Param('sessionId') sessionId: string) {
    const success = this.reactToolsService.resumeTask(sessionId);
    return {
      success,
      message: success ? 'Task resumed successfully' : 'Failed to resume task',
    };
  }

  @Post('task/:sessionId/stop')
  stopTask(@Param('sessionId') sessionId: string) {
    const success = this.reactToolsService.stopTask(sessionId);
    return {
      success,
      message: success ? 'Task stopped successfully' : 'Failed to stop task',
    };
  }

  @Get('task/:sessionId/can-continue')
  canContinue(@Param('sessionId') sessionId: string) {
    const canContinue = this.reactToolsService.canContinue(sessionId);
    return {
      success: true,
      data: { canContinue },
    };
  }
}
