import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WorkflowRepository } from '@/database/repositories/workflow.repository';
import { IRequest } from '@/common/typings/request';

@Injectable()
export class WorkflowAuthGuard implements CanActivate {
  constructor(private readonly workflowRepository: WorkflowRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<IRequest>();

    const workflowId = request.params['workflowId'] || (request.headers['x-monkeys-workflow-id'] as string);
    if (workflowId) {
      const { notAuthorized, userId } = await this.workflowRepository.hasWorkflowUnauthorized(workflowId);
      if (notAuthorized) {
        request.skipUnauthorized = true;

        request.teamId = request.headers['x-monkeys-teamid'] as string;
        request.userId = userId;
      }
    }

    return true;
  }
}
