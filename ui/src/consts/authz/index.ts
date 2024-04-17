export const MSG_INVALID_PHONE = '请输入正确的手机号码';
export const PHONE_REGEX = /^1[3456789]\d{9}$/;

export const MSG_INVALID_VERIFY_CODE = '请输入正确的验证码';
export const VERIFY_CODE_REGEX = /\d{6}/;

export const MSG_INVALID_EMAIL = '请输入正确的邮箱';
export const EMAIL_REGEX = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;

export const MSG_INVALID_PASSWORD = '密码须包含大小写字母与数字，长度不少于 8 位';

export const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d).{8,32}$/;
