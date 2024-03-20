import Dysmsapi20170525, * as $Dysmsapi20170525 from '@alicloud/dysmsapi20170525';
// 依赖的模块可通过下载工程中的模块依赖文件或右上角的获取 SDK 依赖信息查看
import * as $OpenApi from '@alicloud/openapi-client';
import * as $Util from '@alicloud/tea-util';
import { config } from '../config';

export async function sendSms(phoneNumbers: string, verifyCode: number) {
  if (config.auth.sms.provider === 'dysms') {
    const ak = config.auth.sms.config.accessKeyId;
    const sk = config.auth.sms.config.accessKeySecret;
    const templateCode = config.auth.sms.config.templateCode;
    const signName = config.auth.sms.config.signName;
    const smsConfig = new $OpenApi.Config({
      accessKeyId: ak,
      accessKeySecret: sk,
      regionId: config.auth.sms.config.regionId || 'cn-beijing',
    });
    // 访问的域名
    smsConfig.endpoint = `dysmsapi.aliyuncs.com`;
    const client = new Dysmsapi20170525(smsConfig);
    const sendSmsRequest = new $Dysmsapi20170525.SendSmsRequest({
      phoneNumbers,
      signName,
      templateCode,
      templateParam: JSON.stringify({
        code: verifyCode.toString(),
      }),
    });
    const runtime = new $Util.RuntimeOptions({});
    const res = await client.sendSmsWithOptions(sendSmsRequest, runtime);
    return res;
  } else {
    throw new Error(`Unsupported sms provider: ${config.auth.sms.provider}`);
  }
}
