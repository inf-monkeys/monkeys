/**
 * =================================================================
 * POM (Product on Model) 类型定义
 * =================================================================
 */

// 服装类型
export type GarmentType =
  | 'Top:T-shirt'
  | 'Top:Shirt'
  | 'Pant:Jeans'
  | 'Pant:Pant'
  | 'Dress'
  | 'Coat'
  | 'Unsupported garment type';

// 测量数据的原始格式（key-value）
export interface MeasurementsDict {
  [key: string]: number | null;
}

// 测量数据的表格格式
export interface MeasurementTableRow {
  name: string;
  size: number | null;
  unit: string;
}

// API 凭证
export interface PomCredential {
  api_key?: string;
  project_id?: string;
}

/**
 * =================================================================
 * 识别服装类型 API
 * =================================================================
 */

// 识别请求
export interface IdentifyGarmentRequest {
  image: string; // URL or Base64
  credential?: PomCredential;
}

// 识别响应
export interface IdentifyGarmentResponse {
  code: number;
  success: boolean;
  data: {
    garment_type: GarmentType;
    measurements: {
      Name: string[];
      Unit: string[];
    };
  };
  message: string;
}

/**
 * =================================================================
 * 测量服装尺寸 API
 * =================================================================
 */

// 测量请求
export interface MeasureGarmentRequest {
  image: string; // URL or Base64
  garment_type: GarmentType;
  known_measurements?: MeasurementsDict;
  credential?: PomCredential;
}

// 测量响应
export interface MeasureGarmentResponse {
  code: number;
  success: boolean;
  data: {
    garment_type: GarmentType;
    measurements: MeasurementsDict; // 原始格式
    measurements_table: MeasurementTableRow[]; // 表格格式
  };
  message: string;
}

/**
 * =================================================================
 * 识别并测量 API
 * =================================================================
 */

// 识别并测量请求
export interface IdentifyAndMeasureRequest {
  image: string; // URL or Base64
  known_measurements?: MeasurementsDict;
  credential?: PomCredential;
}

// 识别并测量响应
export interface IdentifyAndMeasureResponse {
  code: number;
  success: boolean;
  data: {
    garment_type: GarmentType;
    measurements: MeasurementsDict; // 原始格式
    measurements_table: MeasurementTableRow[]; // 表格格式
  };
  message: string;
}

/**
 * =================================================================
 * 前端UI使用的扩展类型
 * =================================================================
 */

// 测量任务状态
export type MeasurementTaskStatus = 'idle' | 'identifying' | 'measuring' | 'completed' | 'error';

// 测量任务
export interface MeasurementTask {
  id: string;
  imageUrl: string;
  status: MeasurementTaskStatus;
  garmentType?: GarmentType;
  measurements?: MeasurementTableRow[];
  error?: string;
  createdAt: number;
  completedAt?: number;
}

// 导出选项
export interface ExportCsvOptions {
  filename?: string;
  includeGarmentType?: boolean;
}
