import z from 'zod';

const MethodEnum = z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'], {
  errorMap: (issue) => {
    switch (issue.code) {
      case 'invalid_type':
        return { message: 'Unsupported type' };
      case 'invalid_enum_value':
        return { message: 'Method can only be "GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"' };
      default:
        return { message: 'Unknown error' };
    }
  },
});

export const EMethodEnum = MethodEnum.Enum;

const AuthTypeEnum = z.enum(['NONE', 'BASIC', 'CUSTOM_HEADER'], {
  errorMap: (issue) => {
    switch (issue.code) {
      case 'invalid_type':
        return { message: 'Unsupported type' };
      case 'invalid_enum_value':
        return { message: 'Type can only be "NONE", "BASIC", "CUSTOM_HEADER"' };
      default:
        return { message: 'Unknown error' };
    }
  },
});

export enum AuthTypeLabelEnum {
  NONE = 'workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.form.auth.none',
  BASIC = 'workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.form.auth.basic',
  CUSTOM_HEADER = 'workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.form.auth.custom-header',
}

export const EAuthTypeEnum = AuthTypeEnum.Enum;

const ResponseUntilEnum = z.enum(['WORKFLOW_STARTED', 'WORKFLOW_COMPLETED_OR_FINISHED'], {
  errorMap: (issue) => {
    switch (issue.code) {
      case 'invalid_type':
        return { message: 'Unsupported type' };
      case 'invalid_enum_value':
        return { message: 'Response until can only be "WORKFLOW_STARTED", "WORKFLOW_COMPLETED_OR_FINISHED"' };
      default:
        return { message: 'Unknown error' };
    }
  },
});

export enum ResponseUntilLabelEnum {
  WORKFLOW_STARTED = 'workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.form.response-until.workflow-started',
  WORKFLOW_COMPLETED_OR_FINISHED = 'workspace.flow-view.endpoint.start-tool.trigger.create.webhook-trigger.form.response-until.workflow-completed-or-finished',
}

export const EResponseUntilEnum = ResponseUntilEnum.Enum;

export const workflowTriggerWebhookSchema = z.object({
  method: MethodEnum,
  auth: AuthTypeEnum,
  responseUntil: ResponseUntilEnum,

  basicAuthConfig: z
    .object({
      username: z.string().min(1, 'Username is required'),
      password: z.string().min(1, 'Password is required'),
    })
    .optional(),
  headerAuthConfig: z
    .object({
      headerKey: z.string().min(1, 'Header key is required'),
      headerValue: z.string().min(1, 'Header value is required'),
    })
    .optional(),
});

export type IWorkflowTriggerWebhook = z.infer<typeof workflowTriggerWebhookSchema>;
