import useSWR from 'swr';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { VinesToolDef } from '@/package/vines-flow/core/tools/typings.ts';

export const useToolLists = (apikey?: string) =>
  useSWR<VinesToolDef[] | undefined>('/api/tools', vinesFetcher({ apikey }), {
    refreshInterval: 600000,
    revalidateOnFocus: false,
  });

export enum QRCodeStatus {
  WAIT_FOR_QRCODE_GENERATE = 'WAIT_FOR_QRCODE_GENERATE',
  PENDING_SCAN = 'PENDING_SCAN',
  LOGGED_IN = 'LOGGED_IN',
  LOGOUT = 'LOGOUT',
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

export const generateQrcode = (
  toolName: string,
  api: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  context?: { [x: string]: any },
) =>
  vinesFetcher<GeneQRCodeResult>({ method: method, simple: true })(`/api/tools/${toolName}${api}`, {
    context: context || {},
  });
