import { vinesFetcher } from '@/apis/fetcher';

import { preloadUgcItems, useUgcItems } from './index';
import { IListUgcDto, IPreloadUgcItemsFnType } from './typings';

export interface VRTask {
  id: string;
  taskName: string;
  thumbnailUrl: string;
  modelUrl: string;
  status: 'pending' | 'completed';
  evaluationResult?: {
    score_1: number;
    score_2: number;
    score_3: number;
    score_4: number;
    score_5: number;
    score_6: number;
    score_7: number;
    score_8: number;
    score_9: number;
    score_10: number;
  };
  createdTimestamp: number;
  updatedTimestamp: number;
  evaluatedAt?: number;
  createdBy?: string;
}

export interface CreateVRTaskDto {
  taskName: string;
  modelUrl: string;
  thumbnailUrl?: string;
}

export const useUgcVREvaluationTasks = (dto: IListUgcDto) => useUgcItems<VRTask>(dto, '/api/vr-evaluation/tasks');

export const preloadUgcVREvaluationTasks: IPreloadUgcItemsFnType = (dto: IListUgcDto) =>
  preloadUgcItems<VRTask>(dto, '/api/vr-evaluation/tasks');

export const createVRTask = (payload: CreateVRTaskDto): Promise<VRTask> => {
  return vinesFetcher<VRTask>({
    method: 'POST',
    simple: true,
  })('/api/vr-evaluation/tasks', payload).then((result) => result as VRTask);
};
