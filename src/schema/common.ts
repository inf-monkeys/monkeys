import z from 'zod';

export const pageSearchSchema = z.object({
  redirect_url: z.string().optional(),
});
