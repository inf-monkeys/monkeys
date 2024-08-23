import { vinesFetcher } from '@/apis/fetcher.ts';

export const manualUpdateModelListFromServer = (serverId: string) =>
  vinesFetcher<{
    remove: number;
    update: number;
    create: number;
  }>({ method: 'POST', simple: true })(`/api/comfyui-models/manual-update`, {
    serverId,
  });
