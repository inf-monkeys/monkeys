import { vinesFetcher } from '@/apis/fetcher';

import {
  IdentifyAndMeasureRequest,
  IdentifyAndMeasureResponse,
  IdentifyGarmentRequest,
  IdentifyGarmentResponse,
  MeasureGarmentRequest,
  MeasureGarmentResponse,
  MeasurementTableRow,
} from './typings';

// 获取 POM API 的基础 URL (从环境变量或使用默认值)
const getPomApiBaseUrl = (): string => {
  // 可以从环境变量获取，或者硬编码
  return process.env.POM_API_URL || 'http://localhost:3000';
};

/**
 * =================================================================
 * 识别服装类型 API
 * =================================================================
 */

export const identifyGarment = async (payload: IdentifyGarmentRequest): Promise<IdentifyGarmentResponse> => {
  const baseUrl = getPomApiBaseUrl();
  return vinesFetcher<IdentifyGarmentResponse>({
    method: 'POST',
    simple: false,
  })(`${baseUrl}/pom/identify`, payload).then((result) => result as IdentifyGarmentResponse);
};

/**
 * =================================================================
 * 测量服装尺寸 API
 * =================================================================
 */

export const measureGarment = async (payload: MeasureGarmentRequest): Promise<MeasureGarmentResponse> => {
  const baseUrl = getPomApiBaseUrl();
  return vinesFetcher<MeasureGarmentResponse>({
    method: 'POST',
    simple: false,
  })(`${baseUrl}/pom/measure`, payload).then((result) => result as MeasureGarmentResponse);
};

/**
 * =================================================================
 * 识别并测量服装 API (推荐使用)
 * =================================================================
 */

export const identifyAndMeasureGarment = async (
  payload: IdentifyAndMeasureRequest,
): Promise<IdentifyAndMeasureResponse> => {
  const baseUrl = getPomApiBaseUrl();
  return vinesFetcher<IdentifyAndMeasureResponse>({
    method: 'POST',
    simple: false,
  })(`${baseUrl}/pom/identify-and-measure`, payload).then((result) => result as IdentifyAndMeasureResponse);
};

/**
 * =================================================================
 * 工具函数
 * =================================================================
 */

/**
 * 将图片文件转换为 Base64
 */
export const imageFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // 移除 data URI 前缀
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * 导出测量结果为 CSV
 */
export const exportMeasurementsToCSV = (
  measurements: MeasurementTableRow[],
  garmentType: string,
  filename?: string,
): void => {
  // CSV 头部
  const headers = ['Name', 'Size', 'Unit'];

  // CSV 内容
  const rows = measurements.map((m) => {
    return [m.name, m.size !== null ? m.size.toString() : '', m.unit];
  });

  // 组合 CSV
  const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');

  // 创建 Blob 并下载
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `measurements_${garmentType}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
