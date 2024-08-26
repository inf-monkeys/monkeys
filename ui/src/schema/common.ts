import z from 'zod';

export const pageSearchSchema = z.object({
  redirect_id: z.string().optional(),
  redirect_params: z.record(z.string(), z.string()).optional(),
  redirect_search: z.record(z.string(), z.string()).optional(),
});

export const loginCallbackPageSearchSchema = z.object({
  access_token: z.string().optional(),
});
