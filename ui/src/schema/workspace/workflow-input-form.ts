import z from 'zod';

export const workflowInputFormSchema = z.record(
  z.union([z.string(), z.number(), z.boolean(), z.array(z.string()), z.array(z.number()), z.array(z.boolean())]),
);

export type IWorkflowInputForm = z.infer<typeof workflowInputFormSchema>;
