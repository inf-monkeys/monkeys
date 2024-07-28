import { I18nValue } from '@inf-monkeys/monkeys';

export const getI18NValue = (displayName: I18nValue | string, defaultLocale: string = 'en-US') => {
  if (!displayName) {
    return displayName;
  }
  if (typeof displayName === 'string') {
    return displayName;
  }
  const localeValue = displayName[defaultLocale];
  if (localeValue) {
    return localeValue;
  }
  return displayName[Object.keys(displayName)[0]];
};
