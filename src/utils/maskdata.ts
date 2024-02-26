import MaskData from 'maskdata';

export const maskPhone = (phone: string) =>
  MaskData.maskPhone(phone, {
    maskWith: '*',
    unmaskedStartDigits: 3,
    unmaskedEndDigits: 4,
  });

export const maskEmail = (email: string) => MaskData.maskEmail2(email);
