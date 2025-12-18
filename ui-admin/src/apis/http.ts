import { clearStoredToken, getStoredToken } from './auth-storage';

function redirectToLogin() {
  clearStoredToken();
  window.location.href = '/login';
}

export function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

function getContentType(headers: Headers): string {
  return headers.get('content-type') || '';
}

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function buildErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = (payload as any).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

/**
 * 统一的 Admin API 请求封装：
 * - 自动附带 Authorization
 * - 401 自动清 token 并跳转到 /login
 * - 支持 204 / 空响应体
 * - JSON 优先解析，否则返回 text
 */
export async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    ...(options?.headers as any),
  };

  const hasContentTypeHeader =
    Object.keys(headers).some((k) => k.toLowerCase() === 'content-type');
  const isFormData = typeof FormData !== 'undefined' && options?.body instanceof FormData;
  if (!hasContentTypeHeader && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const text = await response.text();
  const contentType = getContentType(response.headers);
  const maybeJson = contentType.includes('application/json') ? tryParseJson(text) : undefined;

  if (!response.ok) {
    if (response.status === 401) {
      redirectToLogin();
    }
    throw new Error(buildErrorMessage(maybeJson, text || '请求失败'));
  }

  if (response.status === 204) return undefined as T;
  if (!text || text.trim() === '') return undefined as T;

  if (maybeJson !== undefined) return maybeJson as T;
  return text as unknown as T;
}

export async function apiRequestBlob(url: string, options?: RequestInit): Promise<Blob> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options?.headers as any),
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      redirectToLogin();
    }
    throw new Error('请求失败');
  }

  return response.blob();
}

