import MaskData from 'maskdata';
import * as validator from 'validator';

export const maskPhone = (phone: string) =>
  MaskData.maskPhone(phone, {
    maskWith: '*',
    unmaskedStartDigits: 3,
    unmaskedEndDigits: 4,
  });

export const maskEmail = (email: string) => {
  if (!validator.isEmail(email)) return email;
  return MaskData.maskEmail2(email);
};

export const maskPassword = (password: string) =>
  MaskData.maskPassword(password, { unmaskedStartCharacters: 8, unmaskedEndCharacters: 6, maxMaskedCharacters: 30 });
