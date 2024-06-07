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
      curl += `   --header '${header}: ${headers![header]}' \\\n`;
    });
  }

  // 添加数据
  if (body) {
    if (typeof body === 'object') {
      body = JSON.stringify(body, null, 4);
    }
    curl += `   --data '${body}'\n`;
  } else {
    curl = curl.slice(0, curl.length - 2) + '\n';
  }

  return curl;
}
