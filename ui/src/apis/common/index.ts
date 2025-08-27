import { useEffect } from 'react';

import useSWRImmutable from 'swr/immutable';

import { get } from 'lodash';

import { ISystemConfig } from '@/apis/common/typings.ts';
import { vinesFetcher } from '@/apis/fetcher.ts';

export const useSystemConfig = () =>
  useSWRImmutable<ISystemConfig | undefined, unknown, string>(
    '/api/configs',
    vinesFetcher({ simple: true, auth: false }),
  );

export const useRoundedClass = () => {
  const { data: oem } = useSystemConfig();
  const roundedSize = get(oem, 'theme.roundedSize') as ISystemConfig['theme']['roundedSize'];
  const themeMode = get(oem, 'theme.themeMode', 'shadow') as ISystemConfig['theme']['themeMode'];

  const defaultSize = themeMode === 'shadow' ? '0.5rem' : '0.75rem';

  useEffect(() => {
    const value = roundedSize ?? defaultSize;
    document.documentElement.style.setProperty('--rounded-size', value);
  }, [roundedSize, defaultSize]);

  return {
    roundedClass: 'rounded-[var(--rounded-size)]',
    roundedLClass: 'rounded-l-[var(--rounded-size)]',
    roundedRClass: 'rounded-r-[var(--rounded-size)]',
    roundedTClass: 'rounded-t-[var(--rounded-size)]',
    roundedBClass: 'rounded-b-[var(--rounded-size)]',
    roundedTLClass: 'rounded-tl-[var(--rounded-size)]',
    roundedTRClass: 'rounded-tr-[var(--rounded-size)]',
    roundedBLClass: 'rounded-bl-[var(--rounded-size)]',
  };
};
