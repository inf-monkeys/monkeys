// 数据视图
export interface DataView {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  parentId?: string;
  path: string;
  level: number;
  sort: number;
  filterConfig?: {
    conditions: Array<{
      field: string;
      operator: 'eq' | 'neq' | 'in' | 'nin' | 'contains' | 'between' | 'gt' | 'gte' | 'lt' | 'lte';
      value: any;
    }>;
    logic: 'AND' | 'OR';
  };
  displayConfig?: {
    columns?: string[];
    defaultSort?: {
      field: string;
      order: 'asc' | 'desc';
    };
    pageSize?: number;
  };
  creatorUserId: string;
  teamId?: string;
  isPublic: boolean;
  assetCount: number;
  createdTimestamp: number;
  updatedTimestamp: number;
  children?: DataView[];
}

// 数据分类（兼容旧代码）
export interface DataCategory extends DataView {}

// 数据资产
export interface DataAsset {
  id: string;
  name: string;
  viewId: string;
  assetType: 'image' | 'video' | '3d' | 'text' | 'document' | 'audio' | 'other';
  primaryContent: {
    type: 'text' | 'image' | 'video' | '3d';
    value: string;
    description?: string;
    metadata?: {
      width?: number;
      height?: number;
      duration?: number;
      format?: string;
      size?: number;
      thumbnailUrl?: string;
    };
  };
  properties?: Record<string, any>;
  files?: Array<{
    url: string;
    name: string;
    type: string;
    size: number;
  }>;
  viewCount: number;
  downloadCount: number;
  status: 'draft' | 'published' | 'archived';
  teamId?: string;
  creatorUserId: string;
  media?: string;
  thumbnail?: string;
  displayName: string;
  description?: string;
  isPublished: boolean;
  createdTimestamp: number;
  updatedTimestamp: number;
}

// 数据项（兼容旧代码）
export interface DataItem extends Partial<DataAsset> {
  category?: string;
  type?: string;
  size?: number;
  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, any>;
}

// 视图查询参数
export interface ViewQueryParams {
  parentId?: string;
  teamId?: string;
  keyword?: string;
}

// 资产查询参数
export interface AssetQueryParams {
  viewId?: string;
  assetType?: 'image' | 'video' | '3d' | 'text' | 'document' | 'audio' | 'other';
  status?: 'draft' | 'published' | 'archived';
  creatorUserId?: string;
  teamId?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

// 数据查询参数（兼容旧代码）
export interface DataQueryParams extends AssetQueryParams {
  category?: string;
}

// 数据列表响应
export interface DataListResponse {
  items: DataItem[];
  total: number;
  page: number;
  pageSize: number;
}

// 资产列表响应
export interface AssetListResponse {
  list: DataAsset[];
  total: number;
  page: number;
  pageSize: number;
}

// 视图树响应
export interface ViewTreeResponse {
  tree: DataView[];
}

// 创建视图 DTO
export interface CreateViewDto {
  name: string;
  description?: string;
  iconUrl?: string;
  parentId?: string;
  filterConfig?: DataView['filterConfig'];
  displayConfig?: DataView['displayConfig'];
  isPublic?: boolean;
  sort?: number;
  teamId?: string;
}

// 更新视图 DTO
export interface UpdateViewDto {
  name?: string;
  description?: string;
  iconUrl?: string;
  filterConfig?: DataView['filterConfig'];
  displayConfig?: DataView['displayConfig'];
  isPublic?: boolean;
  sort?: number;
}

// 移动视图 DTO
export interface MoveViewDto {
  newParentId?: string | null;
}

// 导出选项
export interface DataExportOptions {
  format: 'csv' | 'json' | 'excel';
  fields?: string[];
  category?: string;
}

// 导入结果
export interface DataImportResult {
  success: number;
  failed: number;
  errors?: Array<{
    row: number;
    message: string;
  }>;
}
