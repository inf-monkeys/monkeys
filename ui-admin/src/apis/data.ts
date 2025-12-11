import type {
  DataCategory,
  DataItem,
  DataListResponse,
  DataQueryParams,
  DataExportOptions,
  DataImportResult,
} from '@/types/data';
import { getStoredToken } from './auth';

const API_BASE = '/api/admin';

// HTTP 请求封装
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || '请求失败');
  }

  return response.json();
}

// 获取数据分类列表
export async function getDataCategories(): Promise<DataCategory[]> {
  return request<DataCategory[]>(`${API_BASE}/data/categories`);
}

// 获取数据列表
export async function getDataList(
  params?: DataQueryParams
): Promise<DataListResponse> {
  const queryString = new URLSearchParams(
    Object.entries(params || {})
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)])
  ).toString();

  const url = queryString
    ? `${API_BASE}/data?${queryString}`
    : `${API_BASE}/data`;

  return request<DataListResponse>(url);
}

// 获取单个数据项
export async function getDataItem(id: string): Promise<DataItem> {
  return request<DataItem>(`${API_BASE}/data/${id}`);
}

// 创建数据项
export async function createDataItem(
  data: Partial<DataItem>
): Promise<DataItem> {
  return request<DataItem>(`${API_BASE}/data`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// 更新数据项
export async function updateDataItem(
  id: string,
  data: Partial<DataItem>
): Promise<DataItem> {
  return request<DataItem>(`${API_BASE}/data/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// 删除数据项
export async function deleteDataItem(id: string): Promise<void> {
  return request<void>(`${API_BASE}/data/${id}`, {
    method: 'DELETE',
  });
}

// 批量删除数据项
export async function batchDeleteDataItems(ids: string[]): Promise<void> {
  return request<void>(`${API_BASE}/data/batch-delete`, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

// 导出数据
export async function exportData(
  options: DataExportOptions
): Promise<Blob> {
  const token = getStoredToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/data/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    throw new Error('导出失败');
  }

  return response.blob();
}

// 导入数据
export async function importData(
  file: File,
  category?: string
): Promise<DataImportResult> {
  const token = getStoredToken();
  const formData = new FormData();
  formData.append('file', file);
  if (category) {
    formData.append('category', category);
  }

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/data/import`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || '导入失败');
  }

  return response.json();
}
