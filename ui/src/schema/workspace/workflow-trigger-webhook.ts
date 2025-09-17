import z from 'zod';

const MethodEnum = z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'], {
  error: 'Method can only be "GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"',
});

export const EMethodEnum = MethodEnum.enum;

const AuthTypeEnum = z.enum(['NONE', 'BASIC', 'CUSTOM_HEADER'], {
  error: 'Type can only be "NONE", "BASIC", "CUSTOM_HEADER"',
});

export enum AuthTypeLabelEnum {
  NONE = 'workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.form.auth.none',
  BASIC = 'workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.form.auth.basic',
  CUSTOM_HEADER = 'workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.form.auth.custom-header',
}

export const EAuthTypeEnum = AuthTypeEnum.enum;

const ResponseUntilEnum = z.enum(['WORKFLOW_STARTED', 'WORKFLOW_COMPLETED_OR_FINISHED'], {
  error: 'Response until can only be "WORKFLOW_STARTED", "WORKFLOW_COMPLETED_OR_FINISHED"',
});

export enum ResponseUntilLabelEnum {
  WORKFLOW_STARTED = 'workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.form.response-until.workflow-started',
  WORKFLOW_COMPLETED_OR_FINISHED = 'workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.form.response-until.workflow-completed-or-finished',
}

export const EResponseUntilEnum = ResponseUntilEnum.enum;

export const workflowTriggerWebhookSchema = z.object({
  method: MethodEnum,
  auth: AuthTypeEnum,
  responseUntil: ResponseUntilEnum,

  basicAuthConfig: z
    .object({
      username: z.string().min(1, { error: 'Username is required' }),
      password: z.string().min(1, { error: 'Password is required' }),
    })
    .optional(),
  headerAuthConfig: z
    .object({
      headerKey: z.string().min(1, { error: 'Header key is required' }),
      headerValue: z.string().min(1, { error: 'Header value is required' }),
    })
    .optional(),
});

export type IWorkflowTriggerWebhook = z.infer<typeof workflowTriggerWebhookSchema>;
