import type {
  DataCategory,
  DataItem,
  DataListResponse,
  DataQueryParams,
  ViewQueryParams,
  CreateViewDto,
  UpdateViewDto,
  ViewTreeResponse,
  DataTag,
} from '@/types/data';
import { apiRequest } from './http';

const API_BASE = '/api/admin/data-v2';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  return apiRequest<T>(url, options);
}

function buildQuery(params?: Record<string, any>) {
  return new URLSearchParams(
    Object.entries(params || {})
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => [key, String(value)])
  ).toString();
}

// ========== 视图管理 ==========

export async function getViewTreeV2(teamId: string): Promise<DataCategory[]> {
  const query = buildQuery({ teamId });
  const url = `${API_BASE}/views/tree${query ? `?${query}` : ''}`;
  const response = await request<ViewTreeResponse>(url);
  return response.tree;
}

export async function getViewsV2(params?: ViewQueryParams & { teamId?: string }): Promise<DataCategory[]> {
  const query = buildQuery(params);
  const url = `${API_BASE}/views${query ? `?${query}` : ''}`;
  return request<DataCategory[]>(url);
}

export async function createViewV2(
  teamId: string,
  data: CreateViewDto & { tagIds?: string[] },
): Promise<DataCategory> {
  const query = buildQuery({ teamId });
  return request<DataCategory>(`${API_BASE}/views${query ? `?${query}` : ''}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateViewV2(
  teamId: string,
  id: string,
  data: UpdateViewDto & { tagIds?: string[] },
): Promise<{ success: boolean }> {
  const query = buildQuery({ teamId });
  return request<{ success: boolean }>(`${API_BASE}/views/${id}${query ? `?${query}` : ''}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteViewV2(teamId: string, id: string): Promise<{ success: boolean }> {
  const query = buildQuery({ teamId });
  return request<{ success: boolean }>(`${API_BASE}/views/${id}${query ? `?${query}` : ''}`, {
    method: 'DELETE',
  });
}

export async function batchUpdateViewSortV2(
  teamId: string,
  items: Array<{ id: string; sort: number }>,
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/views/batch/sort`, {
    method: 'POST',
    body: JSON.stringify({ teamId, items }),
  });
}

export async function getViewTagsV2(teamId: string, id: string): Promise<string[]> {
  const query = buildQuery({ teamId });
  const res = await request<{ items: string[] }>(`${API_BASE}/views/${id}/tags${query ? `?${query}` : ''}`);
  return res.items || [];
}

export async function setViewTagsV2(teamId: string, id: string, tagIds: string[]): Promise<{ success: boolean }> {
  const query = buildQuery({ teamId });
  return request<{ success: boolean }>(`${API_BASE}/views/${id}/tags${query ? `?${query}` : ''}`, {
    method: 'PUT',
    body: JSON.stringify({ tagIds }),
  });
}

// ========== 标签 ==========

export async function listTagsV2(params: {
  teamId: string;
  keyword?: string;
  limit?: number;
  pageToken?: string;
}): Promise<{ items: DataTag[]; nextPageToken?: string }> {
  const query = buildQuery({
    teamId: params.teamId,
    keyword: params.keyword,
    limit: params.limit,
    pageToken: params.pageToken,
  });
  const url = `${API_BASE}/tags${query ? `?${query}` : ''}`;
  const response = await request<{ items: DataTag[]; nextPageToken?: string }>(url);
  return {
    items: response.items || [],
    nextPageToken: response.nextPageToken,
  };
}

// ========== 资产 ==========

export async function getDataListV2(params?: DataQueryParams & { teamId?: string; tags?: string; pageToken?: string; name?: string }) {
  const query = buildQuery(params);
  const url = `${API_BASE}${query ? `?${query}` : ''}`;
  const response = await request<{
    list: DataItem[];
    total: number;
    page: number;
    pageSize: number;
    nextPageToken?: string;
  }>(url);

  return {
    items: response.list || [],
    total: response.total ?? 0,
    page: response.page ?? 1,
    pageSize: response.pageSize ?? (params?.pageSize || 20),
    nextPageToken: response.nextPageToken,
  } as DataListResponse & { nextPageToken?: string };
}

export async function getDataNextPageV2(
  params: DataQueryParams & { teamId?: string; tags?: string; pageToken?: string; name?: string }
): Promise<{ items: DataItem[]; hasMore: boolean; pageSize: number; nextPageToken?: string }> {
  const query = buildQuery(params);
  const url = `${API_BASE}/nextpage${query ? `?${query}` : ''}`;
  const response = await request<{
    list: DataItem[];
    hasMore: boolean;
    pageSize: number;
    nextPageToken?: string;
  }>(url);

  return {
    items: response?.list || [],
    hasMore: !!response?.hasMore,
    pageSize: response?.pageSize || params.pageSize || 20,
    nextPageToken: response?.nextPageToken,
  };
}

export async function getDataItemV2(teamId: string, id: string): Promise<DataItem> {
  const query = buildQuery({ teamId });
  return request<DataItem>(`${API_BASE}/${id}${query ? `?${query}` : ''}`);
}

export async function createDataItemV2(teamId: string, data: Partial<DataItem>): Promise<DataItem> {
  const query = buildQuery({ teamId });
  return request<DataItem>(`${API_BASE}${query ? `?${query}` : ''}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateDataItemV2(teamId: string, id: string, data: Partial<DataItem>): Promise<DataItem> {
  const query = buildQuery({ teamId });
  return request<DataItem>(`${API_BASE}/${id}${query ? `?${query}` : ''}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteDataItemV2(teamId: string, id: string): Promise<void> {
  const query = buildQuery({ teamId });
  return request<void>(`${API_BASE}/${id}${query ? `?${query}` : ''}`, {
    method: 'DELETE',
  });
}

export async function batchDeleteDataItemsV2(teamId: string, ids: string[]): Promise<void> {
  return request<void>(`${API_BASE}/batch-delete`, {
    method: 'POST',
    body: JSON.stringify({ teamId, ids }),
  });
}
