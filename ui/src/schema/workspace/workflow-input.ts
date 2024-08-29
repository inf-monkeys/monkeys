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

export const workflowInputSchema = z.object({
  displayName: z.string().min(1, 'Display name cannot be empty'),
  name: z
    .string()
    .min(2, 'Field cannot be less than two characters')
    .max(20, 'Field cannot be more than twenty characters'),
  description: z.string().optional(),
  tips: z.string().optional(),
  type: inputType,
  default: z
    .union([z.string(), z.number(), z.boolean(), z.array(z.string()), z.array(z.number()), z.array(z.boolean())])
    .optional(),
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
        label: z.string(),
      }),
    )
    .optional(),

  foldUp: z.boolean().optional(),
  enableReset: z.boolean().optional(),
  singleColumn: z.boolean().optional(),
  comfyuiModelServerId: z.string().optional(),
  comfyuiModelTypeName: z.string().optional(),
});

export type IWorkflowInput = z.infer<typeof workflowInputSchema>;
