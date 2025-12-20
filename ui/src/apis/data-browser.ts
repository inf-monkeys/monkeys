import type {
  DataView,
  DataCategory,
  DataItem,
  DataListResponse,
  DataQueryParams,
  ViewQueryParams,
  ViewTreeResponse,
  AssetListResponse,
  AssetNextPageResponse,
} from '@/types/data';
import { vinesFetcher } from './fetcher';

const API_BASE = '/api/data-browser';

// 创建通用的 GET fetcher，使用 responseResolver 直接返回完整响应
const get = vinesFetcher<any>({
  method: 'GET',
  simple: true,
  responseResolver: async (response) => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }
});

// ========== 视图管理 ==========

/**
 * 获取视图树形结构
 */
export async function getViewTree(teamId?: string): Promise<DataView[]> {
  const params = new URLSearchParams();
  if (teamId) params.append('teamId', teamId);

  const queryString = params.toString();
  const url = `${API_BASE}/views/tree${queryString ? `?${queryString}` : ''}`;

  const response = await get<ViewTreeResponse>(url);
  return response?.tree || [];
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
    ? `${API_BASE}/views?${queryString}`
    : `${API_BASE}/views`;

  return (await get<DataView[]>(url)) || [];
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
export async function getView(id: string): Promise<DataView | null> {
  return await get<DataView>(`${API_BASE}/views/${id}`);
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
    ? `${API_BASE}/assets?${queryString}`
    : `${API_BASE}/assets`;

  const response = await get<AssetListResponse>(url);

  // 转换后端响应格式 (list -> items)
  return {
    items: response?.list || [],
    total: response?.total || 0,
    page: response?.page || 1,
    pageSize: response?.pageSize || 20,
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

  const url = `${API_BASE}/assets/nextpage?${queryString}`;

  const response = await get<AssetNextPageResponse>(url);

  return {
    items: response?.list || [],
    hasMore: !!response?.hasMore,
    pageSize: response?.pageSize || params.pageSize || 20,
  };
}

/**
 * 获取单个数据项
 */
export async function getDataItem(id: string): Promise<DataItem | null> {
  return await get<DataItem>(`${API_BASE}/assets/${id}`);
}
