import z from 'zod';

export const inputType = z.enum(['string', 'number', 'boolean', 'file'], {
  errorMap: (issue) => {
    switch (issue.code) {
      case 'invalid_type':
        return { message: '不受支持的类型' };
      case 'invalid_enum_value':
        return { message: '类型只能为「string」、「number」、「boolean」、「file」' };
      default:
        return { message: '未知错误' };
    }
  },
});

export const workflowInputSchema = z.object({
  displayName: z.string().min(1, '名称不能为空'),
  name: z.string().min(2, '字段不能小于两位').max(20, '字段不能小于二十位'),
  type: inputType,
  default: z
    .union([z.string(), z.number(), z.boolean(), z.array(z.string()), z.array(z.number()), z.array(z.boolean())])
    .optional(),
  multipleValues: z.boolean().optional(),
  assetType: z.string().optional(),
});

export type IWorkflowInput = z.infer<typeof workflowInputSchema>;
