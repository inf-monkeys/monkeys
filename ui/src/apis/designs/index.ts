import { vinesFetcher } from '@/apis/fetcher.ts';

export const createDesign = (info = { name: 'unknown', teamId: 'unknown', snapshot: {} }) =>
  vinesFetcher({
    method: 'POST',
    simple: true,
  })(`/api/designs`, info);

export const updateDesign = (info = { name: 'unknown', teamId: 'unknown', snapshot: {} }) =>
  vinesFetcher({
    method: 'POST',
    simple: true,
  })(`/api/designs`, info);

export const deleteDesign = (designId: string) =>
  vinesFetcher({
    method: 'DELETE',
    simple: true,
  })(`/api/designs/${designId}`);

export const revokeApiKey = (id: string) =>
  vinesFetcher<string, { id: string }>({ method: 'POST', useToast: true })(`/api/auth/apikey/${id}/revoke`, {
    id,
  });
