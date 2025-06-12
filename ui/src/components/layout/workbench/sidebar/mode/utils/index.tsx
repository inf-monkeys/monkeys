import { Dictionary, map } from 'lodash';

import { IPinPage } from '@/apis/pages/typings.ts';

export const pageGroupProcess = (
  originalGroups: {
    pageIds: string[];
    id: string;
    displayName: string | Record<string, string>;
    isBuiltIn: boolean;
    iconUrl?: string | undefined;
    sortIndex?: number | null | undefined;
  }[],
  pagesMap: Dictionary<IPinPage>,
) =>
  map(originalGroups, ({ pageIds, ...attr }) => ({
    ...attr,
    pages: map(pageIds, (pageId) => pagesMap[pageId]).filter(Boolean),
  }))
    .filter((it) => it.pages?.length)
    .sort((a, b) => {
      const isABuiltIn = a.isBuiltIn;
      const isBBuiltIn = b.isBuiltIn;

      const aVal = a.sortIndex;
      const bVal = b.sortIndex;

      const aHasIndex = aVal !== null && aVal !== undefined;
      const bHasIndex = bVal !== null && bVal !== undefined;

      // 1. both are built-in
      if (isABuiltIn && isBBuiltIn) {
        if (!aHasIndex && bHasIndex) return -1;
        if (aHasIndex && !bHasIndex) return 1;
        if (!aHasIndex && !bHasIndex) return 0;
        return aVal! - bVal!;
      }

      // 2. only one is built-in
      if (isABuiltIn && !isBBuiltIn) {
        if (!aHasIndex) return -1; // a is built-in without index → very front
        // a is built-in with index, b is not built-in
        if (!bHasIndex) return -1;
        return aVal! - bVal!;
      }

      if (!isABuiltIn && isBBuiltIn) {
        if (!bHasIndex) return 1;
        if (!aHasIndex) return 1;
        return aVal! - bVal!;
      }

      // 3. both not built-in
      if (!aHasIndex && !bHasIndex) return 0;
      if (!aHasIndex) return 1;
      if (!bHasIndex) return -1;

      return aVal! - bVal!;
    });