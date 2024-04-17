import z from 'zod';

import { MSG_INVALID_PHONE, MSG_INVALID_VERIFY_CODE, PHONE_REGEX, VERIFY_CODE_REGEX } from '@/consts/authz';

export const toggleAccountViaSmsSchema = z.object({
  phoneNumber: z.string().refine((s) => PHONE_REGEX.test(s), MSG_INVALID_PHONE),
  verifyCode: z.string().refine((s) => VERIFY_CODE_REGEX.test(s), MSG_INVALID_VERIFY_CODE),
  oldVerifyCode: z.string().refine((s) => VERIFY_CODE_REGEX.test(s), MSG_INVALID_VERIFY_CODE),
});
export type IToggleAccountViaSms = z.infer<typeof toggleAccountViaSmsSchema>;
