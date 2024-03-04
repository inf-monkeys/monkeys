import * as dotenv from 'dotenv';

dotenv.config();

interface Config extends NodeJS.ProcessEnv {
  POST: string;
  /** 应用 ID，必填 */
  APP_ID: string;
  /** 应用的公开 URL 地址，不要在地址的最后加 / */
  APP_URL: string;

  PORT: string;

  /** MongoDB 的连接地址，例如：mongodb://user:pass@127.0.0.1:27017/vines */
  MONGO_URL: string;
  /** Redis 的连接地址，例如：redis://:pass@127.0.0.1:6379/0 */
  REDIS_URL: string;
  /** Conductor api 地址，例如：http://127.0.0.1:8080/api */
  CONDUCTOR_BASE_URL: string;
  CONDUCTOR_CLIENT_POLLING_INTERVAL?: string;
  CONDUCTOR_USERNAME?: string;
  CONDUCTOR_PASSWORD?: string;
  /** 用来加密工作流中的 secret，建议使用 32 位随机字符串 */
  AES_ENCRYPT_KEY: string;

  // 阿里云短信服务相关配置，用来发送登录验证短信
  SMS_TEMPLATE_CODE: string;
  SMS_SIGN_NAME: string;
  SMS_AK: string;
  SMS_SK: string;

  // OSS 配置，桶需要支持公开访问
  S3_ACCESS_KEY: string;
  S3_SECRET_KEY: string;
  S3_BUCKET: string;
  S3_ENDPOINT: string;
  S3_REGION: string;
  OSS_BASE_URL: string;

  /** jwt token 密钥，建议使用 32 位随机字符串 */
  JWT_SECRET: string;
  JWT_ADMIN_SECRET: string;
  /** jwt token 过期时间，默认值 30d */
  JWT_EXPIRED_TIME?: string;

  /** n8n api 地址，可选，填写后可以使用 n8n 内的 block */
  N8N_BASE_URL?: string;
  /** n8n 公开可访问的 URL，用于存放图像 */
  N8N_PUBLIC_BASE_URL?: string;
  /** n8n api 密钥，可选 */
  N8N_API_KEY?: string;

  /** 所有 worker 的地址列表，多个值用英文逗号分隔，例如：http://a:3721,http://b:3721 */
  WORKER_BASE_URL_LIST?: string;

  // 用于访问风控服务，可选
  USE_VOLC_RISK?: string;
  VOLC_ACCESSKEY?: string;
  VOLC_SECRETKEY?: string;
  VOLC_RISK_ACCESSKEY?: string;
  VOLC_RISK_SECRETKEY?: string;
  VOLC_RISK_APPID?: string;

  // 本地测试
  LOCAL_TEST_USER_ID?: string;
  LOCAL_TEST_TEAM_ID?: string;

  // vines 文本数据管理 python backend 地址
  VINES_TEXT_RESOURCE_BACKEND_URL?: string;

  // 扣费相关配置
  BALANCE_INITIAL_VALUE: string;
  BALANCE_VALIDATE_ENCRYPT_SALT: string;
  // 微信支付配置，用于充值，可选

  // 微信支付相关字段
  WXPAY_MCHID: string;
  WXPAY_APPID: string;
  WXPAY_PUBLIC_KEY: string;
  WXPAY_PRIVATE_KEY: string;
  WXPAY_NOTIFY_URL: string;
  WXPAY_API_V3_KEY: string;

  // Midjourney 服务的地址
  MJ_API?: string;
  ALARM_SERVER_URL?: string;

  VECTOR_SEARCH_ENGINE: string;

  // password
  PASSWORD_SALT: string;

  // web socket
  WEBSOCKET_PORT: string;

  // others
  DOMAINS_USE_PROXY: string;
  PROXY_URL: string;

  // Comfyui
  COMFYUI_BASE_URL: string;
}

const {
  APP_ID = 'vines',
  APP_URL = 'http://localhost:3000',
  MONGO_URL = '',
  REDIS_URL = 'redis://localhost:6379',
  CONDUCTOR_BASE_URL,
  CONDUCTOR_CLIENT_POLLING_INTERVAL = '100',
  CONDUCTOR_CLIENT_POLLING_CONCURRENCY = '20',
  CONDUCTOR_USERNAME,
  CONDUCTOR_PASSWORD,
  CONDUCTOR_CLIENT_NAME_PREFIX = undefined,
  AES_ENCRYPT_KEY,

  N8N_BASE_URL,
  N8N_PUBLIC_BASE_URL,
  N8N_API_KEY,

  JWT_SECRET,
  JWT_EXPIRED_TIME = '30d',

  SMS_TEMPLATE_CODE,
  SMS_SIGN_NAME,
  SMS_AK,
  SMS_SK,

  S3_ACCESS_KEY,
  S3_SECRET_KEY,
  S3_BUCKET,
  S3_ENDPOINT,
  S3_REGION,
  OSS_BASE_URL,

  LOCAL_TEST_USER_ID,
  LOCAL_TEST_TEAM_ID,

  USE_VOLC_RISK,
  VOLC_ACCESSKEY,
  VOLC_SECRETKEY,
  VOLC_RISK_ACCESSKEY,
  VOLC_RISK_SECRETKEY,
  VOLC_RISK_APPID,

  VINES_TEXT_RESOURCE_BACKEND_URL,

  BALANCE_VALIDATE_ENCRYPT_SALT = '5xIo1DqveI32NqDsrwWM3Jk0a8LNLxcf',
  BALANCE_INITIAL_VALUE: BALANCE_INITIAL_VALUE_STRING,
  WXPAY_MCHID = '',
  WXPAY_APPID = '',
  WXPAY_PUBLIC_KEY = '',
  WXPAY_PRIVATE_KEY = '',
  WXPAY_NOTIFY_URL = '',
  WXPAY_API_V3_KEY = '',

  MJ_API,
  DOMAINS_USE_PROXY = 'huggingface.co,github.com,githubusercontent,sema.airi.net,google.com,googleapis.com,hf.space,twitter.com,pinecone.io,civitai.com',
  PROXY_URL = '',
  TWITTER_CLIENT_ID = '',
  TWITTER_CLIENT_SECRET = '',
  TWITTER_OAUTH2_CALLBACK_URL = '',
  CRON_ENABLED = 'true',
  HEALTH_CHECK_QUEUE_NAME = 'block-health-check',
  HEALTH_CHECK_COMPLETED = 'health-check-completed',
  PORT = '3000',
  WEBSOCKET_PORT = '4000',

  SENTRY_DSN = '',
  ALARM_SERVER_URL = '',
  ENABLE_MAGIC_PHONE_CODE = '',
  MILVUS_SERVICE_URL = undefined,
  JWT_ADMIN_SECRET = 'hbHNlLCJuYW1lIjoicm9vdCIsInJvbGUiOiJy',
  PASSWORD_SALT = '5XCmJg0kDGfK2oWzkURSmDVbAyiWS0tg',
  COMFYUI_BASE_URL = undefined,
  IGNORE_BLOCKS_CACHE = undefined,
  SKIP_LOAD_DEFAULT_BLOCKS = undefined,

  BASE_FOLDER = process.cwd(),
} = process.env as Config;

if (!APP_ID) {
  throw new Error('APP_ID is required');
}
if (!APP_URL) {
  throw new Error('APP_URL is required');
}
if (!REDIS_URL) {
  throw new Error('REDIS_URL is required');
}
// if (!MONGO_URL) {
//   throw new Error('MONGO_URL is required');
// }

if (!PASSWORD_SALT) {
  throw new Error('PASSWORD_SALT is required');
}

const WORKER_BASE_URL_LIST = process.env.WORKER_BASE_URL_LIST?.split(',') || [];

export {
  AES_ENCRYPT_KEY,
  ALARM_SERVER_URL,
  APP_ID,
  APP_URL,
  BALANCE_INITIAL_VALUE_STRING,
  BALANCE_VALIDATE_ENCRYPT_SALT,
  BASE_FOLDER,
  COMFYUI_BASE_URL,
  CONDUCTOR_BASE_URL,
  CONDUCTOR_CLIENT_NAME_PREFIX,
  CONDUCTOR_CLIENT_POLLING_CONCURRENCY,
  CONDUCTOR_CLIENT_POLLING_INTERVAL,
  CONDUCTOR_PASSWORD,
  CONDUCTOR_USERNAME,
  CRON_ENABLED,
  DOMAINS_USE_PROXY,
  ENABLE_MAGIC_PHONE_CODE,
  HEALTH_CHECK_COMPLETED,
  HEALTH_CHECK_QUEUE_NAME,
  IGNORE_BLOCKS_CACHE,
  JWT_ADMIN_SECRET,
  JWT_EXPIRED_TIME,
  JWT_SECRET,
  LOCAL_TEST_TEAM_ID,
  LOCAL_TEST_USER_ID,
  MILVUS_SERVICE_URL,
  MJ_API,
  MONGO_URL,
  N8N_API_KEY,
  N8N_BASE_URL,
  N8N_PUBLIC_BASE_URL,
  OSS_BASE_URL,
  PASSWORD_SALT,
  PORT,
  PROXY_URL,
  REDIS_URL,
  S3_ACCESS_KEY,
  S3_BUCKET,
  S3_ENDPOINT,
  S3_REGION,
  S3_SECRET_KEY,
  SENTRY_DSN,
  SKIP_LOAD_DEFAULT_BLOCKS,
  SMS_AK,
  SMS_SIGN_NAME,
  SMS_SK,
  SMS_TEMPLATE_CODE,
  TWITTER_CLIENT_ID,
  TWITTER_CLIENT_SECRET,
  TWITTER_OAUTH2_CALLBACK_URL,
  USE_VOLC_RISK,
  VINES_TEXT_RESOURCE_BACKEND_URL,
  VOLC_ACCESSKEY,
  VOLC_RISK_ACCESSKEY,
  VOLC_RISK_APPID,
  VOLC_RISK_SECRETKEY,
  VOLC_SECRETKEY,
  WEBSOCKET_PORT,
  WORKER_BASE_URL_LIST,
  WXPAY_API_V3_KEY,
  WXPAY_APPID,
  WXPAY_MCHID,
  WXPAY_NOTIFY_URL,
  WXPAY_PRIVATE_KEY,
  WXPAY_PUBLIC_KEY,
};
