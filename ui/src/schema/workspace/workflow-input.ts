import z from 'zod';

export const inputType = z.enum(['string', 'number', 'boolean', 'file'], {
  error: 'Type must be one of string, number, boolean, file',
});

// 单个可见性条件
export const visibilityConditionSchema = z.object({
  field: z.string(), // 关联的其他表单项字段名
  operator: z.enum([
    'is',
    'isNot',
    'isGreaterThan',
    'isLessThan',
    'isGreaterThanOrEqual',
    'isLessThanOrEqual',
    'in',
    'notIn',
  ]), // 支持多种比较操作符
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.union([z.string(), z.number(), z.boolean()]))]), // 比较值，支持数组形式
});

// 可见性配置
export const visibilityConfigSchema = z.object({
  conditions: z.array(visibilityConditionSchema).min(1),
  logic: z.enum(['AND', 'OR']).default('AND'),
});

export const workflowInputSelectListLinkageSchema = z.array(
  z.object({
    name: z.string(),
    value: z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.array(z.string()),
      z.array(z.number()),
      z.array(z.boolean()),
    ]),
    selectFilter: z
      .object({
        list: z.array(z.string()),
        reserve: z.boolean(),
      })
      .optional(),
  }),
);

export const workflowInputSchema = z.object({
  displayName: z.union([
    z.string().min(1, { error: 'Display name cannot be empty' }),
    z.record(z.string(), z.string()).refine((val) => Object.values(val).some((v) => v && v.trim().length > 0), {
      error: 'At least one language must have a display name',
    }),
  ]),
  name: z
    .string()
    .min(1, { error: 'Field cannot be less than one characters' })
    .max(20, { error: 'Field cannot be more than twenty characters' }),
  description: z
    .union([
      z.string(),
      z.record(z.string(), z.string()).refine((val) => Object.values(val).some((v) => v && v.trim().length > 0), {
        error: 'At least one language must have a description',
      }),
    ])
    .optional(),
  placeholder: z
    .union([
      z.string(),
      z.record(z.string(), z.string()).refine((val) => Object.values(val).some((v) => v && v.trim().length > 0), {
        error: 'At least one language must have a placeholder',
      }),
    ])
    .optional(),
  tips: z
    .union([
      z.string(),
      z.record(z.string(), z.string()).refine((val) => Object.values(val).some((v) => v && v.trim().length > 0), {
        error: 'At least one language must have tips',
      }),
    ])
    .optional(),
  type: inputType,
  default: z
    .union([z.string(), z.number(), z.boolean(), z.array(z.string()), z.array(z.number()), z.array(z.boolean())])
    .optional(),
  required: z.boolean().optional(),
  multipleValues: z.boolean().optional(),
  assetType: z.string().optional(),

  enableImageMask: z.boolean().optional(),

  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  numberPrecision: z.number().optional(),

  enableSelectList: z.boolean().optional(),
  selectList: z
    .array(
      z.object({
        value: z.union([z.string(), z.number()]),
        label: z.union([
          z.string().min(1, { error: 'Label cannot be empty' }),
          z.record(z.string(), z.string()).refine((val) => Object.values(val).some((v) => v && v.trim().length > 0), {
            error: 'At least one language must have a label',
          }),
        ]),
        linkage: workflowInputSelectListLinkageSchema.optional(),
      }),
    )
    .optional(),

  textareaMiniHeight: z.number().optional(),

  foldUp: z.boolean().optional(),
  enableReset: z.boolean().optional(),
  singleColumn: z.boolean().optional(),
  comfyuiModelServerId: z.string().optional(),
  comfyuiModelTypeName: z.string().optional(),

  // 字段可见性配置
  visibility: visibilityConfigSchema.optional(),

  // 提示词字典（支持多种结构，前端做归一化处理）
  promptDictionary: z.any().optional(),

  flag: z.boolean().optional(),
});

export type IWorkflowInput = z.infer<typeof workflowInputSchema>;
export type IWorkflowInputSelectListLinkage = z.infer<typeof workflowInputSelectListLinkageSchema>;
export type IVisibilityCondition = z.infer<typeof visibilityConditionSchema>;
export type IVisibilityConfig = z.infer<typeof visibilityConfigSchema>;
