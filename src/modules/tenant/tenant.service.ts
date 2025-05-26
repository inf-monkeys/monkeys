import { conductorClient } from '@/common/conductor';
import { config } from '@/common/config';
import { WorkflowStatusEnum } from '@/common/dto/status.enum';
import { flattenObject } from '@/common/utils';
import { WorkflowExecutionEntity } from '@/database/entities/workflow/workflow-execution';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isBoolean } from 'lodash';
import { Repository } from 'typeorm';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(WorkflowExecutionEntity)
    private readonly workflowExecutionRepository: Repository<WorkflowExecutionEntity>,
  ) {}

  async findAll() {
    const totalExecutions = await this.workflowExecutionRepository.find();

    return {
      workflow: {
        execution: {
          // 从数据库拿到的是所有的统计
          total: {
            count: totalExecutions.length,
            success: totalExecutions.filter((e) => e.status === WorkflowStatusEnum.COMPLETED).length,
            failed: totalExecutions.filter((e) => e.status === WorkflowStatusEnum.FAILED).length,
          },
        },
      },
    };
  }

  async findBetween(startTime: number, endTime: number) {
    const { results: rawCurrentExecutions } = await conductorClient.workflowResource.searchV21(undefined, undefined, undefined, undefined, `startTime > ${startTime} AND startTime < ${endTime}`);
    const currentExecutions = rawCurrentExecutions.filter((e) => e.input?.__context?.appId === config.server.appId && e.startTime >= startTime && e.endTime <= endTime);

    const imageSuffix = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    const output = {
      image: currentExecutions
        .map((e) => Object.values(flattenObject(e.output)))
        .flat()
        .filter((value: string | number | null) => typeof value === 'string' && imageSuffix.some((suffix) => value.endsWith(suffix))).length,
    };

    return {
      workflow: {
        execution: {
          // 用户没有删除的（只有没有删除的可以查到输入输出内容）
          current: {
            count: currentExecutions.length,
            success: currentExecutions.filter((e) => e.status === WorkflowStatusEnum.COMPLETED).length,
            resultSuccess: currentExecutions.filter((e) => e.output && (isBoolean(e.output.success) ? e.output.success : true)).length,
            failed: currentExecutions.filter((e) => e.status === WorkflowStatusEnum.FAILED).length,
            output,
          },
        },
      },
    };
  }
}
