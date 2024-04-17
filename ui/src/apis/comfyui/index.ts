import useSWR from 'swr';

import { IComfyuiModel } from '@/apis/comfyui/typings.ts';
import { vinesFetcher } from '@/apis/fetcher.ts';

export const useComfyuiModels = () => useSWR<IComfyuiModel | undefined>('/api/comfyui/all-models', vinesFetcher());
