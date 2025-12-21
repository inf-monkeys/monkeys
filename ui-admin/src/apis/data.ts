import type {
  DataView,
  DataCategory,
  DataItem,
  DataListResponse,
  DataQueryParams,
  DataExportOptions,
  DataImportResult,
  ViewQueryParams,
  CreateViewDto,
  UpdateViewDto,
  MoveViewDto,
  ViewTreeResponse,
  AssetListResponse,
  AssetNextPageResponse,
} from '@/types/data';
import { apiRequest, apiRequestBlob, getAuthHeaders } from './http';

const API_BASE = '/api/admin';

// HTTP 请求封装
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  return apiRequest<T>(url, options);
}

// ========== 视图管理 ==========

/**
 * 获取视图树形结构
 */
export async function getViewTree(teamId?: string): Promise<DataView[]> {
  const params = new URLSearchParams();
  if (teamId) params.append('teamId', teamId);

  const queryString = params.toString();
  const url = `${API_BASE}/data/views/tree${queryString ? `?${queryString}` : ''}`;

  const response = await request<ViewTreeResponse>(url);
  return response.tree;
}

/**
 * 获取视图列表
 */
export async function getViews(params?: ViewQueryParams): Promise<DataView[]> {
  const queryString = new URLSearchParams(
    Object.entries(params || {})
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)])
  ).toString();

  const url = queryString
    ? `${API_BASE}/data/views?${queryString}`
    : `${API_BASE}/data/views`;

  return request<DataView[]>(url);
}

/**
 * 获取数据分类列表（兼容旧接口）
 */
export async function getDataCategories(): Promise<DataCategory[]> {
  return getViewTree();
}

/**
 * 获取单个视图详情
 */
export async function getView(id: string): Promise<DataView> {
  return request<DataView>(`${API_BASE}/data/views/${id}`);
}

/**
 * 创建视图
 */
export async function createView(data: CreateViewDto): Promise<DataView> {
  return request<DataView>(`${API_BASE}/data/views`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * 更新视图
 */
export async function updateView(id: string, data: UpdateViewDto): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/data/views/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * 移动视图
 */
export async function moveView(id: string, data: MoveViewDto): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/data/views/${id}/move`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * 删除视图
 */
export async function deleteView(id: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/data/views/${id}`, {
    method: 'DELETE',
  });
}

/**
 * 批量更新视图排序
 */
export async function batchUpdateViewSort(items: Array<{ id: string; sort: number }>): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/data/views/batch/sort`, {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

// ========== 数据/资产管理 ==========

/**
 * 获取数据列表
 */
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

  const response = await request<AssetListResponse>(url);

  // 转换后端响应格式 (list -> items)
  return {
    items: response.list,
    total: response.total,
    page: response.page,
    pageSize: response.pageSize,
  };
}

/**
 * 获取下一页数据（滚动加载，不返回 total）
 */
export async function getDataNextPage(
  params: DataQueryParams
): Promise<{ items: DataItem[]; hasMore: boolean; pageSize: number }> {
  const queryString = new URLSearchParams(
    Object.entries(params || {})
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)])
  ).toString();

  const url = `${API_BASE}/data/nextpage?${queryString}`;

  const response = await request<AssetNextPageResponse>(url);

  return {
    items: response?.list || [],
    hasMore: !!response?.hasMore,
    pageSize: response?.pageSize || params.pageSize || 20,
  };
}

/**
 * 获取单个数据项
 */
export async function getDataItem(id: string): Promise<DataItem> {
  return request<DataItem>(`${API_BASE}/data/${id}`);
}

/**
 * 创建数据项
 */
export async function createDataItem(
  data: Partial<DataItem>
): Promise<DataItem> {
  return request<DataItem>(`${API_BASE}/data`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * 更新数据项
 */
export async function updateDataItem(
  id: string,
  data: Partial<DataItem>
): Promise<DataItem> {
  return request<DataItem>(`${API_BASE}/data/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * 设置数据资产置顶排序权重（0 表示取消置顶）
 */
export async function setDataItemPinOrder(
  id: string,
  pinOrder: number,
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/data/${id}/pin`, {
    method: 'PUT',
    body: JSON.stringify({ pinOrder }),
  });
}

/**
 * 删除数据项
 */
export async function deleteDataItem(id: string): Promise<void> {
  return request<void>(`${API_BASE}/data/${id}`, {
    method: 'DELETE',
  });
}

/**
 * 批量删除数据项
 */
export async function batchDeleteDataItems(ids: string[]): Promise<void> {
  return request<void>(`${API_BASE}/data/batch-delete`, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

/**
 * 批量更新数据项状态
 */
export async function batchUpdateDataStatus(
  ids: string[],
  status: 'draft' | 'published' | 'archived'
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`${API_BASE}/data/batch-update-status`, {
    method: 'POST',
    body: JSON.stringify({ ids, status }),
  });
}

// ========== 导入导出 ==========

/**
 * 导出数据
 */
export async function exportData(
  options: DataExportOptions
): Promise<Blob> {
  return apiRequestBlob(`${API_BASE}/data/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(options),
  });
}

/**
 * 导入数据
 */
export async function importData(
  file: File,
  category?: string
): Promise<DataImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  if (category) {
    formData.append('category', category);
  }

  return apiRequest<DataImportResult>(`${API_BASE}/data/import`, {
    method: 'POST',
    body: formData,
  });
}
