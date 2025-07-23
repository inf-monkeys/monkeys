import { logger } from '@/common/logger';
import { generateDbId } from '@/common/utils';
import { TemporaryWorkflowEntity } from '@/database/entities/workflow/temporary-workflow.entity';
import { WorkflowRepository } from '@/database/repositories/workflow.repository';
import { WorkflowTriggerType } from '@inf-monkeys/monkeys';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import _ from 'lodash';
import { Repository } from 'typeorm';
import { ConductorService } from '../workflow/conductor/conductor.service';
import { CreateTemporaryWorkflowByInstanceDto, CreateTemporaryWorkflowDto } from '../workflow/dto/req/create-temporary-workflow.dto';
import { WorkflowExecutionService } from '../workflow/workflow.execution.service';

@Injectable()
export class TemporaryWorkflowService {
  constructor(
    @InjectRepository(TemporaryWorkflowEntity)
    private readonly temporaryWorkflowRepository: Repository<TemporaryWorkflowEntity>,
    private readonly workflowExecutionService: WorkflowExecutionService,
    private readonly workflowRepository: WorkflowRepository,
    private readonly conductorService: ConductorService,
  ) {}

  // 临时工作流相关方法
  /**
   * 创建临时工作流
   */
  async createTemporaryWorkflow(dto: CreateTemporaryWorkflowDto): Promise<{ temporaryId: string }> {
    const { workflowId, workflowVersion, inputData: originalInputData, expiresInHours = 24, teamId = 'default', userId = 'default' } = dto;

    // 验证工作流是否存在
    const version = workflowVersion || (await this.workflowRepository.getMaxVersion(workflowId));
    const workflow = await this.workflowRepository.getWorkflowById(workflowId, version);
    if (!workflow) {
      throw new NotFoundException('工作流不存在');
    }

    // 验证用户是否有权限访问该工作流
    if (workflow.teamId !== teamId) {
      throw new BadRequestException('无权访问该工作流');
    }

    // 生成临时ID
    const temporaryId = generateDbId();

    // 计算过期时间
    const expiresAt = Date.now() + expiresInHours * 60 * 60 * 1000;

    const inputData = workflow.variables.map((variable) => ({
      ...variable,
      default: originalInputData[variable.name] || variable.default,
    }));

    // 创建临时工作流记录
    const temporaryWorkflow = this.temporaryWorkflowRepository.create({
      id: generateDbId(),
      temporaryId,
      workflowId,
      workflowVersion: version,
      teamId,
      userId,
      status: 'PENDING',
      expiresAt,
      inputData,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      isDeleted: false,
    });

    await this.temporaryWorkflowRepository.save(temporaryWorkflow);

    logger.info(`创建临时工作流: ${temporaryId}, 工作流: ${workflowId}, 版本: ${version}`);

    return { temporaryId };
  }

  async createTemporaryWorkflowByInstance(dto: CreateTemporaryWorkflowByInstanceDto): Promise<{ temporaryId: string }> {
    const { workflowInstanceId, expiresInHours = 24, teamId = 'default', userId = 'default' } = dto;

    // 验证 instance 是否存在
    const instance = await this.workflowExecutionService.getWorkflowExecutionSimpleDetailFromDb(workflowInstanceId);
    if (!instance) {
      throw new NotFoundException('实例不存在');
    }

    const workflow = await this.workflowRepository.getWorkflowById(instance.workflowId, instance.version);
    if (!workflow) {
      throw new NotFoundException('工作流不存在');
    }

    const inputData = workflow.variables.map((variable) => ({
      ...variable,
      default: instance.input.find((input) => input.id === variable.name)?.data || variable.default,
    }));

    // 生成临时ID
    const temporaryId = generateDbId();

    // 计算过期时间
    const expiresAt = Date.now() + expiresInHours * 60 * 60 * 1000;

    // 创建临时工作流记录
    const temporaryWorkflow = this.temporaryWorkflowRepository.create({
      id: generateDbId(),
      temporaryId,
      workflowId: instance.workflowId,
      workflowVersion: instance.version,
      teamId,
      userId,
      status: 'PENDING',
      expiresAt,
      inputData,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      isDeleted: false,
    });

    await this.temporaryWorkflowRepository.save(temporaryWorkflow);

    logger.info(`创建临时工作流: ${temporaryId}, 工作流: ${instance.workflowId}, 版本: ${instance.version}`);

    return { temporaryId };
  }

  /**
   * 根据临时ID获取临时工作流信息
   */
  async getTemporaryWorkflowInfo(temporaryId: string): Promise<any> {
    const temporaryWorkflow = await this.temporaryWorkflowRepository.findOne({
      where: { temporaryId, isDeleted: false },
    });

    if (!temporaryWorkflow) {
      throw new NotFoundException('临时工作流不存在');
    }

    // 检查是否过期
    if (Date.now() > temporaryWorkflow.expiresAt) {
      throw new BadRequestException('临时工作流已过期');
    }

    return {
      temporaryId: temporaryWorkflow.temporaryId,
      workflowId: temporaryWorkflow.workflowId,
      workflowVersion: temporaryWorkflow.workflowVersion,
      status: temporaryWorkflow.status,
      inputData: temporaryWorkflow.inputData,
      expiresAt: temporaryWorkflow.expiresAt,
      createdTimestamp: temporaryWorkflow.createdTimestamp,
    };
  }

  /**
   * 执行临时工作流
   */
  async executeTemporaryWorkflow(temporaryId: string, originalInputData?: Record<string, any>, teamId?: string, userId?: string): Promise<{ workflowInstanceId: string }> {
    const temporaryWorkflow = await this.getTemporaryWorkflowByTemporaryId(temporaryId);

    if (temporaryWorkflow.status !== 'PENDING') {
      throw new BadRequestException('临时工作流状态不允许执行');
    }

    // 更新状态为执行中
    await this.temporaryWorkflowRepository.update(
      { id: temporaryWorkflow.id },
      {
        status: 'RUNNING',
        executionTime: Date.now(),
        updatedTimestamp: Date.now(),
      },
    );

    try {
      const originWorkflow = await this.workflowRepository.getWorkflowById(temporaryWorkflow.workflowId, temporaryWorkflow.workflowVersion);

      // 执行工作流
      await this.conductorService.saveWorkflowInConductor({
        workflowId: temporaryWorkflow.temporaryId,
        teamId: teamId || temporaryWorkflow.teamId,
        tasks: originWorkflow.tasks,
        output: originWorkflow.output,
        version: temporaryWorkflow.workflowVersion,
      });

      const inputData = _.merge(
        temporaryWorkflow.inputData
          ? temporaryWorkflow.inputData.reduce((acc, curr) => {
              acc[curr.name] = curr.default;
              return acc;
            }, {})
          : {},
        originalInputData,
      );

      const workflowInstanceId = await this.workflowExecutionService.startWorkflow(
        {
          teamId: teamId || temporaryWorkflow.teamId,
          userId: userId || temporaryWorkflow.userId,
          workflowId: temporaryWorkflow.temporaryId,
          inputData,
          version: temporaryWorkflow.workflowVersion,
          triggerType: WorkflowTriggerType.MANUALLY,
          group: `temporary-${temporaryId}`,
          extraMetadata: {
            source: 'temporary-workflow',
            temporaryId,
          },
        },
        true,
      );

      // 更新临时工作流记录
      await this.temporaryWorkflowRepository.update(
        { id: temporaryWorkflow.id },
        {
          workflowInstanceId,
          updatedTimestamp: Date.now(),
        },
      );

      logger.info(`执行临时工作流: ${temporaryId}, 实例ID: ${workflowInstanceId}`);

      return { workflowInstanceId };
    } catch (error) {
      // 执行失败，更新状态
      await this.temporaryWorkflowRepository.update(
        { id: temporaryWorkflow.id },
        {
          status: 'FAILED',
          errorMessage: error.message,
          updatedTimestamp: Date.now(),
        },
      );

      logger.error(`执行临时工作流失败: ${temporaryId}`, error);
      throw error;
    }
  }

  /**
   * 获取临时工作流执行结果
   */
  async getTemporaryWorkflowResult(temporaryId: string): Promise<any> {
    const temporaryWorkflow = await this.getTemporaryWorkflowByTemporaryId(temporaryId);

    if (temporaryWorkflow.status === 'PENDING') {
      throw new BadRequestException('临时工作流尚未执行');
    }

    if (temporaryWorkflow.status === 'RUNNING') {
      // 如果正在执行，尝试获取最新状态
      if (temporaryWorkflow.workflowInstanceId) {
        try {
          const result = await this.workflowExecutionService.getWorkflowExecutionSimpleDetail(temporaryWorkflow.teamId, temporaryWorkflow.workflowInstanceId);

          // 根据执行结果更新状态
          const newStatus = result.status === 'COMPLETED' ? 'COMPLETED' : result.status === 'FAILED' ? 'FAILED' : 'RUNNING';

          if (newStatus !== temporaryWorkflow.status) {
            await this.temporaryWorkflowRepository.update(
              { id: temporaryWorkflow.id },
              {
                status: newStatus,
                outputData: result.rawOutput,
                completionTime: newStatus === 'COMPLETED' || newStatus === 'FAILED' ? Date.now() : undefined,
                updatedTimestamp: Date.now(),
              },
            );
          }

          return result;
        } catch (error) {
          logger.warn(`获取临时工作流执行状态失败: ${temporaryId}`, error);
        }
      }

      return {
        status: 'RUNNING',
        message: '工作流正在执行中',
      };
    }

    // 返回已保存的结果
    return {
      status: temporaryWorkflow.status,
      output: temporaryWorkflow.outputData,
      error: temporaryWorkflow.errorMessage,
      executionTime: temporaryWorkflow.executionTime,
      completionTime: temporaryWorkflow.completionTime,
    };
  }

  /**
   * 执行并等待临时工作流结果
   */
  async executeAndWaitForTemporaryWorkflow(temporaryId: string, inputData: Record<string, any>, teamId?: string, userId?: string): Promise<any> {
    // 先执行工作流
    await this.executeTemporaryWorkflow(temporaryId, inputData, teamId, userId);

    // 等待执行完成
    let result;
    let attempts = 0;
    const maxAttempts = 60; // 最多等待5分钟

    while (attempts < maxAttempts) {
      result = await this.getTemporaryWorkflowResult(temporaryId);

      if (result.status === 'COMPLETED' || result.status === 'FAILED') {
        break;
      }

      // 等待10秒后重试
      await new Promise((resolve) => setTimeout(resolve, 10000));
      attempts++;
    }

    return result;
  }

  /**
   * 定时清理过期的临时工作流
   */
  async cleanupExpiredTemporaryWorkflows(): Promise<number> {
    const result = await this.temporaryWorkflowRepository.update({ expiresAt: { $lt: Date.now() } as any, isDeleted: false }, { isDeleted: true, updatedTimestamp: Date.now() });
    logger.info(`清理过期临时工作流: ${result.affected} 条记录`);
    return result.affected || 0;
  }

  /**
   * 根据临时ID获取临时工作流实体（内部方法）
   */
  private async getTemporaryWorkflowByTemporaryId(temporaryId: string): Promise<TemporaryWorkflowEntity> {
    const temporaryWorkflow = await this.temporaryWorkflowRepository.findOne({
      where: { temporaryId, isDeleted: false },
    });

    if (!temporaryWorkflow) {
      throw new NotFoundException('临时工作流不存在');
    }

    // 检查是否过期
    if (Date.now() > temporaryWorkflow.expiresAt) {
      throw new BadRequestException('临时工作流已过期');
    }

    return temporaryWorkflow;
  }
}
