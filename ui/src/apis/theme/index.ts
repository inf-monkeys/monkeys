import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { Theme, ThemeCreate, ThemeMarket } from '@/apis/theme/typings.ts';

export const useThemeList = () => useSWR<Theme[] | undefined>('/api/theme', vinesFetcher());

export const useThemeMarket = () => useSWR<ThemeMarket[] | undefined>('/api/theme/public', vinesFetcher());

export const useCreateTheme = () =>
  useSWRMutation<Theme | undefined, unknown, string, ThemeCreate>('/api/theme', vinesFetcher({ method: 'POST' }));

export const deleteTheme = (themeId: string) => vinesFetcher({ method: 'DELETE' })(`/api/theme/${themeId}`);
