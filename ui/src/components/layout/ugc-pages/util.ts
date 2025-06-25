import { useSystemConfig } from '@/apis/common';

export const useGetUgcViewIconOnlyMode = () => {
  const { data: oem } = useSystemConfig();
  return oem?.theme.ugcViewIconOnlyMode ?? false;
};
