import { stringify } from '@/utils/fast-stable-stringify.ts';

interface CurlOptions {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
}

export function curl({ url, method, headers, body }: CurlOptions): string {
  let curl = `curl -X ${method!.toUpperCase()} '${url}' \\\n`;

  // 添加头部
  if (headers) {
    Object.keys(headers).forEach((header) => {
      curl += ` -H '${header}: ${headers![header]}' \\\n`;
    });
  }

  // 添加数据
  if (body) {
    if (typeof body === 'object') {
      body = stringify(body);
    }
    curl += ` -d '${body}'\n`;
  }

  return curl;
}
