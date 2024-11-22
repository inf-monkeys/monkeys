import { config } from '@/common/config';
import AWS from 'aws-sdk';

AWS.config.update({
  region: config.aws.translate.region,
  credentials: new AWS.Credentials({
    accessKeyId: config.aws.translate.accessKey,
    secretAccessKey: config.aws.translate.secretKey,
  }),
});

const translate = new AWS.Translate();

/**
 * 翻译文本
 * @param text 要翻译的文本
 * @param sourceLanguageCode 源语言代码（例如：en）
 * @param targetLanguageCode 目标语言代码（例如：zh）
 * @returns Promise<string> 返回一个 Promise 对象，该对象解析为翻译后的文本
 */
export const translateText = (text: string, sourceLanguageCode = 'auto', targetLanguageCode = 'en'): Promise<string> => {
  const params = {
    Text: text,
    SourceLanguageCode: sourceLanguageCode,
    TargetLanguageCode: targetLanguageCode,
  };

  return new Promise((resolve) => {
    translate.translateText(params, (err, data) => {
      if (err) {
        resolve(text);
      } else {
        resolve(data.TranslatedText);
      }
    });
  });
};

export const containsChinese = (text: string): boolean => {
  const chineseRegex = /[\u4e00-\u9fa5]/;
  return chineseRegex.test(text);
};
