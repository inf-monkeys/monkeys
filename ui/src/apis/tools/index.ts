import useSWR from 'swr';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { VinesToolDef } from '@/package/vines-flow/core/tools/typings.ts';

export const useToolLists = () =>
  useSWR<VinesToolDef[] | undefined>('/api/tools', vinesFetcher(), {
    refreshInterval: 600000,
    revalidateOnFocus: false,
  });

export const useTool = (name?: string) =>
  useSWR<VinesToolDef | undefined>(name ? `/api/tools/${name}` : null, vinesFetcher(), {
    refreshInterval: 600000,
  });

export enum QRCodeStatus {
  WAIT_FOR_QRCODE_GENERATE = 'WAIT_FOR_QRCODE_GENERATE',
  PENDING_SCAN = 'PENDING_SCAN',
  LOGGED_IN = 'LOGGED_IN',
  LOGOUT = 'LOGOUT',
}

export interface QRCodeUserInfo {
  displayName: string;
  id: string;
  avatar: string;
}

export interface QRCodeStatusResult {
  sessionId: string;
  status: QRCodeStatus;
  userinfo?: QRCodeUserInfo;
}

export interface GeneQRCodeResult {
  sessionId: string;
  status: QRCodeStatus;
  qrcode?: {
    type: 'image' | 'iframe';
    src: string;
    width: number;
    height: number;
  };
  userinfo?: {
    displayName: string;
    id: string;
    avatar: string;
  };
}

const replaceUrlParams = (url: string, params: { [x: string]: any }) => {
  let resultUrl = url;

  // 遍历对象中的每个键值对
  for (const [key, value] of Object.entries(params)) {
    // 替换 URL 中的占位符
    resultUrl = resultUrl.replace(`{${key}}`, value);
  }

  return resultUrl;
};

export const callToolsApi = <T>(
  toolName: string,
  api: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  dataOrParams?: { [x: string]: any },
) => {
  api = replaceUrlParams(api, dataOrParams || {});
  if (method.toUpperCase() === 'GET') {
    return vinesFetcher<T>({ method: method, simple: false })(`/api/tools/${toolName}${api}`);
  } else {
    return vinesFetcher<T>({ method: method, simple: true })(`/api/tools/${toolName}${api}`, dataOrParams);
  }
};

export interface IImportToolParams {
  importType: string;
  manifestUrl?: string;
  openapiSpecUrl?: string;
}

export const importTool = (params: IImportToolParams) =>
  vinesFetcher({ method: 'POST', simple: true })(`/api/tools/register`, params);
