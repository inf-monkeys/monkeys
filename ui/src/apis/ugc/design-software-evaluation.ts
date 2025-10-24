import { vinesFetcher } from '@/apis/fetcher';

import { preloadUgcItems, useUgcItems } from './index';
import { IListUgcDto, IPreloadUgcItemsFnType } from './typings';

export interface DesignSoftwareTask {
  id: string;
  softwareName: string;
  softwareVersion?: string;
  taskDescription: string;
  thumbnailUrl?: string;
  documentUrl?: string;
  status: 'pending' | 'in-progress' | 'completed';
  evaluationResult?: {
    usability: number; // 易用性
    functionality: number; // 功能完整性
    performance: number; // 性能表现
    stability: number; // 稳定性
    documentation: number; // 文档质量
    uiDesign: number; // 界面设计
    learning_curve: number; // 学习曲线
    compatibility: number; // 兼容性
  };
  evaluationNotes?: string;
  createdTimestamp: number;
  updatedTimestamp: number;
  evaluatedAt?: number;
  createdBy?: string;
}

export interface CreateDesignSoftwareTaskDto {
  softwareName: string;
  softwareVersion?: string;
  taskDescription: string;
  thumbnailUrl?: string;
  documentUrl?: string;
}

export const useUgcDesignSoftwareEvaluationTasks = (dto: IListUgcDto) =>
  useUgcItems<DesignSoftwareTask>(dto, '/api/design-software-evaluation/tasks');

export const preloadUgcDesignSoftwareEvaluationTasks: IPreloadUgcItemsFnType = (dto: IListUgcDto) =>
  preloadUgcItems<DesignSoftwareTask>(dto, '/api/design-software-evaluation/tasks');

export const createDesignSoftwareTask = (payload: CreateDesignSoftwareTaskDto): Promise<DesignSoftwareTask> => {
  return vinesFetcher<DesignSoftwareTask>({
    method: 'POST',
    simple: true,
  })('/api/design-software-evaluation/tasks', payload).then((result) => result as DesignSoftwareTask);
};
