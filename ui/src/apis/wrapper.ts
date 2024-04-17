import { pick } from 'lodash';

import { IOriginData } from '@/apis/typings.ts';

export const paginationWrapper = <T>(_: T, originData: IOriginData<T>) =>
  pick(originData, ['data', 'page', 'limit', 'total']) as T;
