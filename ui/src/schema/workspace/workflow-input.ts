import z from 'zod';

export const inputType = z.enum(['string', 'number', 'boolean', 'file'], {
  errorMap: (issue) => {
    switch (issue.code) {
      case 'invalid_type':
        return { message: 'Unsupported type' };
      case 'invalid_enum_value':
        return { message: 'Type must be one of string, number, boolean, file' };
      default:
        return { message: 'Unknown error' };
    }
  },
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
    z.string().min(1, 'Display name cannot be empty'),
    z
      .record(z.string())
      .refine(
        (val) => Object.values(val).some((v) => v && v.trim().length > 0),
        'At least one language must have a display name',
      ),
  ]),
  name: z
    .string()
    .min(1, 'Field cannot be less than one characters')
    .max(20, 'Field cannot be more than twenty characters'),
  description: z
    .union([
      z.string(),
      z
        .record(z.string())
        .refine(
          (val) => Object.values(val).some((v) => v && v.trim().length > 0),
          'At least one language must have a description',
        ),
    ])
    .optional(),
  placeholder: z
    .union([
      z.string(),
      z
        .record(z.string())
        .refine(
          (val) => Object.values(val).some((v) => v && v.trim().length > 0),
          'At least one language must have a placeholder',
        ),
    ])
    .optional(),
  tips: z
    .union([
      z.string(),
      z
        .record(z.string())
        .refine(
          (val) => Object.values(val).some((v) => v && v.trim().length > 0),
          'At least one language must have tips',
        ),
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
          z.string().min(1, 'Label cannot be empty'),
          z
            .record(z.string())
            .refine(
              (val) => Object.values(val).some((v) => v && v.trim().length > 0),
              'At least one language must have a label',
            ),
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
});

export type IWorkflowInput = z.infer<typeof workflowInputSchema>;
export type IWorkflowInputSelectListLinkage = z.infer<typeof workflowInputSelectListLinkageSchema>;
