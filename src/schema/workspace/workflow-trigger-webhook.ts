import z from 'zod';

const MethodEnum = z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'], {
  errorMap: (issue) => {
    switch (issue.code) {
      case 'invalid_type':
        return { message: '不受支持的类型' };
      case 'invalid_enum_value':
        return { message: '类型只能为「GET」、「POST」、「PUT」、「DELETE」、「PATCH」、「HEAD」、「OPTIONS」' };
      default:
        return { message: '未知错误' };
    }
  },
});

export const EMethodEnum = MethodEnum.Enum;

const AuthTypeEnum = z.enum(['NONE', 'BASIC', 'CUSTOM_HEADER'], {
  errorMap: (issue) => {
    switch (issue.code) {
      case 'invalid_type':
        return { message: '不受支持的类型' };
      case 'invalid_enum_value':
        return { message: '类型只能为「NONE」、「BASIC」、「CUSTOM_HEADER」' };
      default:
        return { message: '未知错误' };
    }
  },
});

export enum AuthTypeLabelEnum {
  NONE = '不认证',
  BASIC = '基础认证 (Basic Auth)',
  CUSTOM_HEADER = '自定义请求头',
}

export const EAuthTypeEnum = AuthTypeEnum.Enum;

const ResponseUntilEnum = z.enum(['WORKFLOW_STARTED', 'WORKFLOW_COMPLETED_OR_FINISHED'], {
  errorMap: (issue) => {
    switch (issue.code) {
      case 'invalid_type':
        return { message: '不受支持的类型' };
      case 'invalid_enum_value':
        return { message: '类型只能为「WORKFLOW_STARTED」、「WORKFLOW_COMPLETED_OR_FINISHED」' };
      default:
        return { message: '未知错误' };
    }
  },
});

export enum ResponseUntilLabelEnum {
  WORKFLOW_STARTED = '工作流启动之后立即返回',
  WORKFLOW_COMPLETED_OR_FINISHED = '工作流执行成功或者失败之后返回',
}

export const EResponseUntilEnum = ResponseUntilEnum.Enum;

export const workflowTriggerWebhookSchema = z.object({
  method: MethodEnum,
  auth: AuthTypeEnum,
  responseUntil: ResponseUntilEnum,

  basicAuthConfig: z
    .object({
      username: z.string().min(1, '用户名不能为空'),
      password: z.string().min(1, '密码不能为空'),
    })
    .optional(),
  headerAuthConfig: z
    .object({
      headerKey: z.string().min(1, 'Header key 不能为空'),
      headerValue: z.string().min(1, 'Header value 不能为空'),
    })
    .optional(),
});

export type IWorkflowTriggerWebhook = z.infer<typeof workflowTriggerWebhookSchema>;
