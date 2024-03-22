import { config } from '@/common/config';

export const NONE_AUTH_DOC = `
此服务没有开启任何鉴权方式，可直接调用 API，不需要传递任何鉴权机制。
`;

export const APIKEY_AUTH_DOC = `
你需要先到 Monkeys 控制台创建一个 APIKey，之后在调用接口时，在请求头中通过 \`authorization\` 请求头传递此 apikey，示例如下：

\`\`\`bash
curl -XGET {{APP_URL}}/api/some-api' \
  -H 'Authorization: 'Bearer <YOUR_API_KEY>'
\`\`\`
`.replaceAll('{{APP_URL}}', config.server.appUrl);
