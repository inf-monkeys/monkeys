import { IDisplayMode, ISortCondition } from '@/components/layout/ugc/typings.ts';

export const DEFAULT_SORT_CONDITION: ISortCondition = {
  orderBy: 'DESC',
  orderColumn: 'updatedTimestamp',
};

export const DEFAULT_DISPLAY_MODE: IDisplayMode = 'card';
