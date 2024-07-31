import { useMemo, useRef } from 'react';

import { useNavigate, useSearch } from '@tanstack/react-router';

import { useMemoizedFn, useUpdate } from 'ahooks';
import { BooleanOptional, IParseOptions } from 'qs';
import qs from 'qs';
import type * as React from 'react';

export interface Options {
  parseOptions?: IParseOptions<BooleanOptional>;
}

type UrlState = Record<string, any>;

const useUrlState = <S extends UrlState = UrlState>(initialState?: S | (() => S), options?: Options) => {
  type State = Partial<{ [key in keyof S]: any }>;
  const { parseOptions } = options || {};

  const search = useSearch({
    strict: false,
  });

  const navigate = useNavigate();

  const update = useUpdate();

  const initialStateRef = useRef(typeof initialState === 'function' ? (initialState as () => S)() : initialState || {});

  const queryFromUrl = useMemo(() => {
    return qs.parse(search, parseOptions);
  }, [search]);

  const targetQuery: State = useMemo(
    () => ({
      ...initialStateRef.current,
      ...queryFromUrl,
    }),
    [queryFromUrl],
  );

  const setState = (s: React.SetStateAction<State>) => {
    const newQuery = typeof s === 'function' ? s(targetQuery) : s;

    const mergedQuery = { ...queryFromUrl, ...newQuery };

    // Remove undefined values
    Object.keys(mergedQuery).forEach((key) => mergedQuery[key] === undefined && delete mergedQuery[key]);

    update();
    void navigate({
      search: mergedQuery,
    });
  };

  return [targetQuery, useMemoizedFn(setState)] as const;
};

export default useUrlState;
