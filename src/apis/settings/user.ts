import useSWRMutation from 'swr/mutation';

import { useAuthzPostFetcher } from '@/apis/fetcher.ts';

export const useUpdateUserInfo = () => useSWRMutation('/api/users/profile', useAuthzPostFetcher);
