import * as joiful from 'joiful';

export class GetWorkflowJobsDto {
  @joiful.string()
  workflowInstanceId?: string;

  @joiful.string()
  timeout?: string;

  @joiful.string()
  ttl?: string;
}
