import axios, { AxiosError, AxiosInstance, Method } from 'axios';
import { HttpException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { config } from '@/common/config';

type MonkeyResponse<T> = {
  code: string;
  data: T;
};

@Injectable()
export class MonkeyDataClient {
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;
  private readonly internalToken: string;
  private readonly appId: string;

  constructor() {
    const rawBaseUrl = config.monkeyData?.baseUrl || '';
    this.baseUrl = rawBaseUrl.replace(/\/+$/, '');
    this.internalToken = config.monkeyData?.internalToken || '';
    this.appId = config.server.appId;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: config.monkeyData?.timeoutMs ?? 2000,
    });
  }

  private ensureConfigured() {
    if (!this.baseUrl) {
      throw new ServiceUnavailableException('monkey-data baseUrl 未配置');
    }
    if (!this.appId) {
      throw new ServiceUnavailableException('appId 未配置');
    }
  }

  private buildHeaders(teamId: string): Record<string, string> {
    const headers: Record<string, string> = {
      'X-App-Id': this.appId,
      'X-Team-Id': teamId,
    };
    if (this.internalToken) {
      headers['X-Internal-Token'] = this.internalToken;
    }
    return headers;
  }

  private extractErrorMessage(payload: any, fallback: string): string {
    if (payload && typeof payload === 'object') {
      const nestedMessage = payload?.data?.message;
      if (typeof nestedMessage === 'string' && nestedMessage.trim()) {
        return nestedMessage;
      }
      if (typeof payload.message === 'string' && payload.message.trim()) {
        return payload.message;
      }
    }
    return fallback;
  }

  private unwrapResponse<T>(payload: MonkeyResponse<T> | T): T {
    if (payload && typeof payload === 'object' && 'data' in (payload as any)) {
      return (payload as MonkeyResponse<T>).data;
    }
    return payload as T;
  }

  private async request<T>(method: Method, path: string, teamId: string, options?: { params?: any; data?: any }): Promise<T> {
    this.ensureConfigured();
    try {
      const res = await this.client.request<MonkeyResponse<T>>({
        method,
        url: path,
        headers: this.buildHeaders(teamId),
        params: options?.params,
        data: options?.data,
      });
      return this.unwrapResponse(res.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        const status = axiosError.response?.status ?? 500;
        const message = this.extractErrorMessage(axiosError.response?.data, axiosError.message || 'monkey-data 请求失败');
        throw new HttpException(message, status);
      }
      throw error;
    }
  }

  searchAssets(teamId: string, params: { viewId?: string; tags?: string[]; limit: number; pageToken?: string }) {
    const tags = params.tags?.join(',') || undefined;
    return this.request<{ items: string[]; next_page_token?: string }>('GET', '/v2/assets/search', teamId, {
      params: {
        view_id: params.viewId || undefined,
        tags,
        limit: params.limit,
        page_token: params.pageToken || undefined,
      },
    });
  }

  getAsset(teamId: string, id: string) {
    return this.request<any>('GET', `/v2/assets/${id}`, teamId);
  }

  createAsset(teamId: string, payload: any) {
    return this.request<{ id: string }>('POST', '/v2/assets', teamId, { data: payload });
  }

  updateAsset(teamId: string, id: string, payload: any) {
    return this.request<{ ok: boolean }>('PUT', `/v2/assets/${id}`, teamId, { data: payload });
  }

  deleteAsset(teamId: string, id: string) {
    return this.request<{ ok: boolean }>('DELETE', `/v2/assets/${id}`, teamId);
  }

  getViewTree(teamId: string) {
    return this.request<{ items: any[] }>('GET', '/v2/views/tree', teamId);
  }

  createView(teamId: string, payload: any) {
    return this.request<{ id: string }>('POST', '/v2/views', teamId, { data: payload });
  }

  updateView(teamId: string, id: string, payload: any) {
    return this.request<{ ok: boolean }>('PUT', `/v2/views/${id}`, teamId, { data: payload });
  }

  deleteView(teamId: string, id: string) {
    return this.request<{ ok: boolean }>('DELETE', `/v2/views/${id}`, teamId);
  }

  getViewTags(teamId: string, id: string) {
    return this.request<{ items: string[] }>('GET', `/v2/views/${id}/tags`, teamId);
  }

  setViewTags(teamId: string, id: string, tagIds: string[]) {
    return this.request<{ ok: boolean }>('PUT', `/v2/views/${id}/tags`, teamId, { data: { tag_ids: tagIds } });
  }

  listTags(teamId: string, params: { keyword?: string; limit: number; pageToken?: string }) {
    return this.request<{ items: any[]; next_page_token?: string }>('GET', '/v2/tags', teamId, {
      params: {
        keyword: params.keyword || undefined,
        limit: params.limit,
        page_token: params.pageToken || undefined,
      },
    });
  }
}
