import useSWR from 'swr';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { ILLMModel } from '@/apis/llm/typings.ts';

export const useLLMModels = () => useSWR<ILLMModel[] | undefined>('/api/llm-models', vinesFetcher());
