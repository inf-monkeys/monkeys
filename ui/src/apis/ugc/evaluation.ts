import { EvaluationModule } from '@/apis/evaluation/typings';

import { preloadUgcItems, useUgcItems } from './index';
import { IListUgcDto, IPreloadUgcItemsFnType } from './typings';

export const useUgcEvaluationModules = (dto: IListUgcDto) =>
  useUgcItems<EvaluationModule>(dto, '/api/evaluation/modules');

export const preloadUgcEvaluationModules: IPreloadUgcItemsFnType = (dto: IListUgcDto) =>
  preloadUgcItems<EvaluationModule>(dto, '/api/evaluation/modules');
