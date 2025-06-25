import { Controller, Get, Param, Sse, UseGuards, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Observable, interval, map, switchMap, takeWhile, startWith } from 'rxjs';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { IRequest } from '@/common/typings/request';
import { TaskQueueService } from '../services/task-queue.service';
import { TaskProgressService } from '../services/task-progress.service';
import { TaskStatus } from '../types/task.types';

@Controller('evaluation/sse')
@ApiTags('Evaluation SSE')
@UseGuards(CompatibleAuthGuard)
export class EvaluationSseController {
  constructor(
    private readonly taskQueueService: TaskQueueService,
    private readonly taskProgressService: TaskProgressService,
  ) {}

  @Sse('tasks/:taskId/progress')
  @ApiOperation({
    summary: '订阅任务进度SSE流',
    description: '通过Server-Sent Events实时获取评测任务进度',
  })
  streamTaskProgress(
    @Param('taskId') taskId: string,
    @Req() req: IRequest,
  ): Observable<{ data: any }> {
    return interval(1000).pipe(
      startWith(0),
      switchMap(async () => {
        const task = await this.taskQueueService.getTask(taskId);
        if (!task) {
          throw new Error('Task not found');
        }

        if (task.userId !== req.userId || task.teamId !== req.teamId) {
          throw new Error('Unauthorized');
        }

        const progress = await this.taskProgressService.getProgress(taskId);
        return {
          task,
          progress: progress || task.progress,
          timestamp: new Date().toISOString(),
        };
      }),
      takeWhile(
        (data) => 
          data.task.status === TaskStatus.PENDING || 
          data.task.status === TaskStatus.PROCESSING,
        true
      ),
      map((data) => ({ data })),
    );
  }

  @Sse('tasks')
  @ApiOperation({
    summary: '订阅用户任务列表SSE流',
    description: '通过Server-Sent Events实时获取用户的所有评测任务状态',
  })
  streamUserTasks(@Req() req: IRequest): Observable<{ data: any }> {
    const { teamId, userId } = req;

    return interval(2000).pipe(
      startWith(0),
      switchMap(async () => {
        const tasks = await this.taskQueueService.getTasksByUser(teamId, userId);
        const activeTasks = tasks.filter(
          task => task.status === TaskStatus.PENDING || task.status === TaskStatus.PROCESSING
        );
        
        const tasksWithProgress = await Promise.all(
          activeTasks.map(async (task) => {
            const progress = await this.taskProgressService.getProgress(task.id);
            return {
              ...task,
              progress: progress || task.progress,
            };
          })
        );

        return {
          tasks: tasksWithProgress,
          totalTasks: tasks.length,
          activeTasks: activeTasks.length,
          timestamp: new Date().toISOString(),
        };
      }),
      map((data) => ({ data })),
    );
  }

  @Sse('queue/status')
  @ApiOperation({
    summary: '订阅队列状态SSE流',
    description: '通过Server-Sent Events实时获取评测队列状态',
  })
  streamQueueStatus(): Observable<{ data: any }> {
    return interval(5000).pipe(
      startWith(0),
      switchMap(async () => {
        const queueLength = await this.taskQueueService.getQueueLength();
        return {
          ...queueLength,
          timestamp: new Date().toISOString(),
        };
      }),
      map((data) => ({ data })),
    );
  }
}