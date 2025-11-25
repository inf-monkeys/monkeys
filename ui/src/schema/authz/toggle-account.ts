import z from 'zod';

import { PHONE_REGEX, VERIFY_CODE_REGEX } from '@/consts/authz';

export const toggleAccountViaSmsSchema = z.object({
  phoneNumber: z.string().refine((s) => PHONE_REGEX.test(s), { message: 'auth.login.validation.invalid-phone' }),
  verifyCode: z.string().refine((s) => VERIFY_CODE_REGEX.test(s), { message: 'auth.login.validation.invalid-verify-code' }),
  oldVerifyCode: z.string().refine((s) => VERIFY_CODE_REGEX.test(s), { message: 'auth.login.validation.invalid-verify-code' }),
});
export type IToggleAccountViaSms = z.infer<typeof toggleAccountViaSmsSchema>;
