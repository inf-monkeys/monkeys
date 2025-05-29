import z from 'zod';

export const createDesignProjectSchema = z.object({
  displayName: z.string(),
  description: z.string().max(200, '描述不能超过200个字符').optional(),
  iconUrl: z.string().optional(),
});

export type ICreateDesignProject = z.infer<typeof createDesignProjectSchema>;
