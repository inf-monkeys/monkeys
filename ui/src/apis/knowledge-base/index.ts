import useSWR from 'swr';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { IKnowledgeBaseFrontEnd } from '@/apis/knowledge-base/typings';

export const useKnowledgeBases = () =>
  useSWR<IKnowledgeBaseFrontEnd[] | undefined>('/api/knowledge-bases', vinesFetcher());
