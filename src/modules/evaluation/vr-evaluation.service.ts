import { generateDbId } from '@/common/utils';
import { VREvaluationTaskEntity, VRTaskStatus } from '@/database/entities/evaluation/vr-evaluation-task.entity';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export interface CreateVRTaskDto {
  taskName: string;
  thumbnailUrl: string;
  modelUrl: string;
}

export interface UpdateEvaluationDataDto {
  taskId: string;
  evaluationResult: {
    score_1: number;
    score_2: number;
    score_3: number;
    score_4: number;
    score_5: number;
    score_6: number;
    score_7: number;
    score_8: number;
    score_9: number;
    score_10: number;
  };
}

@Injectable()
export class VREvaluationService {
  constructor(
    @InjectRepository(VREvaluationTaskEntity)
    private readonly vrTaskRepository: Repository<VREvaluationTaskEntity>,
  ) {}

  /**
   * 获取所有待评测的任务列表（供 Vision Pro 调用）
   */
  async getTaskList(teamId: string) {
    const tasks = await this.vrTaskRepository.find({
      where: {
        teamId,
        isDeleted: false,
      },
      order: {
        createdTimestamp: 'DESC',
      },
    });

    return {
      task_count: tasks.length,
      tasks: tasks.map((task) => ({
        task_id: task.id,
        task_name: task.taskName,
        thumbnail_url: task.thumbnailUrl,
        model_url: task.modelUrl,
        status: task.status,
      })),
    };
  }

  /**
   * 更新评测数据（供 Vision Pro 调用）
   */
  async updateEvaluationData(dto: UpdateEvaluationDataDto) {
    const { taskId, evaluationResult } = dto;

    const task = await this.vrTaskRepository.findOne({
      where: { id: taskId, isDeleted: false },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // 验证分数范围（1-5）
    const scores = Object.values(evaluationResult);
    for (const score of scores) {
      if (score < 1 || score > 5) {
        throw new BadRequestException('Score must be between 1 and 5');
      }
    }

    task.evaluationResult = evaluationResult;
    task.status = VRTaskStatus.COMPLETED;
    task.evaluatedAt = new Date();

    await this.vrTaskRepository.save(task);

    return { state: 'success' };
  }

  /**
   * 创建 VR 评测任务（供 Web 端调用）
   */
  async createTask(teamId: string, userId: string, dto: CreateVRTaskDto) {
    const task = this.vrTaskRepository.create({
      id: generateDbId(),
      teamId,
      createdBy: userId,
      taskName: dto.taskName,
      thumbnailUrl: dto.thumbnailUrl,
      modelUrl: dto.modelUrl,
      status: VRTaskStatus.PENDING,
    });

    return await this.vrTaskRepository.save(task);
  }

  /**
   * 获取任务列表（供 Web 端调用）
   */
  async listTasks(teamId: string, page: number = 1, limit: number = 20) {
    const [tasks, total] = await this.vrTaskRepository.findAndCount({
      where: {
        teamId,
        isDeleted: false,
      },
      order: {
        createdTimestamp: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: tasks,
      total,
      page,
      limit,
    };
  }

  /**
   * 获取任务详情
   */
  async getTaskDetail(taskId: string, teamId: string) {
    return await this.vrTaskRepository.findOne({
      where: {
        id: taskId,
        teamId,
        isDeleted: false,
      },
    });
  }

  /**
   * 删除任务
   */
  async deleteTask(taskId: string, teamId: string) {
    const task = await this.vrTaskRepository.findOne({
      where: { id: taskId, teamId, isDeleted: false },
    });

    if (!task) {
      throw new NotFoundException('Task not found or access denied');
    }

    task.isDeleted = true;
    await this.vrTaskRepository.save(task);

    return { success: true };
  }

  /**
   * 获取统计数据
   */
  async getStatistics(teamId: string) {
    const [total, pending, completed] = await Promise.all([
      this.vrTaskRepository.count({ where: { teamId, isDeleted: false } }),
      this.vrTaskRepository.count({ where: { teamId, status: VRTaskStatus.PENDING, isDeleted: false } }),
      this.vrTaskRepository.count({ where: { teamId, status: VRTaskStatus.COMPLETED, isDeleted: false } }),
    ]);

    return {
      total,
      pending,
      completed,
      completionRate: total > 0 ? ((completed / total) * 100).toFixed(2) : '0.00',
    };
  }
}
