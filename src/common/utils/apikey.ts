import { generateRandomString } from './utils';

export const generateRandomApiKey = (prefix = 'sk-') => {
  return prefix + generateRandomString(48);
};
