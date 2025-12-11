// 数据分类
export interface DataCategory {
  id: string;
  name: string;
  icon?: string;
  children?: DataCategory[];
}

// 数据项
export interface DataItem {
  id: string;
  name: string;
  category: string;
  type: string;
  size?: number;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive' | 'archived';
  description?: string;
  metadata?: Record<string, any>;
}

// 数据列表响应
export interface DataListResponse {
  items: DataItem[];
  total: number;
  page: number;
  pageSize: number;
}

// 数据查询参数
export interface DataQueryParams {
  category?: string;
  keyword?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 数据导入导出
export interface DataExportOptions {
  category?: string;
  format: 'csv' | 'json' | 'excel';
  fields?: string[];
}

export interface DataImportResult {
  success: number;
  failed: number;
  errors?: Array<{ row: number; message: string }>;
}
