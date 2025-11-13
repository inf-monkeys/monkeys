import useSWR from 'swr';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { ICreateDesignProject } from '@/schema/workspace/create-design-project.ts';
import { IDesignAssociationForEditor } from '@/schema/workspace/design-association';

import { IDesignAssociation, IDesignBoardItem, IDesignBoardMetadata, IDesignProject } from './typings';

export const createDesignMetadata = (
  designProjectId: string,
  payload: {
    displayName: string;
    snapshot: any;
    pinned: boolean;
    teamId: string;
  },
) =>
  vinesFetcher<IAssetItem<IDesignBoardMetadata>>({
    method: 'POST',
    simple: true,
  })(`/api/design/project/${designProjectId}/metadata`, {
    designProjectId,
    ...payload,
  });

export const createDesignProject = (createDesignProjectDto: ICreateDesignProject) =>
  vinesFetcher<IAssetItem<IDesignProject>>({
    method: 'POST',
    simple: true,
  })('/api/design/project', createDesignProjectDto);

export const useGetDesignProjectList = () =>
  useSWR<IAssetItem<IDesignProject>[] | undefined>(`/api/design/project`, vinesFetcher());

export const useGetDesignProject = (designId?: string | null) =>
  useSWR<IAssetItem<IDesignProject> | undefined>(designId ? `/api/design/project/${designId}` : null, vinesFetcher());

export const deleteDesignProject = (designId: string) =>
  vinesFetcher({
    method: 'DELETE',
  })(`/api/design/project/${designId}`);

export const updateDesignProject = (designId: string, design: Partial<IAssetItem<IDesignProject>>) =>
  vinesFetcher<IAssetItem<IDesignProject>, Partial<IAssetItem<IDesignProject>>>({ method: 'PUT', simple: true })(
    `/api/design/project/${designId}`,
    design,
  );

export const useDesignProjectMetadataList = (designProjectId?: string | null) =>
  useSWR<IDesignBoardItem[] | undefined>(
    designProjectId ? `/api/design/project/${designProjectId}/metadata` : null,
    vinesFetcher(),
  );

export const useDesignBoardMetadata = (designBoardId: string) =>
  useSWR<IAssetItem<IDesignBoardMetadata> | undefined>(
    designBoardId ? `/api/design/metadata/${designBoardId}` : null,
    vinesFetcher(),
  );

export const updateDesignBoardMetadata = (designBoardId: string, metadata: Partial<IAssetItem<IDesignBoardMetadata>>) =>
  vinesFetcher<IAssetItem<IDesignBoardMetadata>, Partial<IAssetItem<IDesignBoardMetadata>>>({
    method: 'PUT',
    simple: true,
  })(`/api/design/metadata/${designBoardId}`, metadata);

export const createDesignAssociation = (createDesignAssociationDto: IDesignAssociationForEditor) =>
  vinesFetcher<IDesignAssociation>({
    method: 'POST',
    simple: true,
  })('/api/design/association', createDesignAssociationDto);

export const updateDesignAssociation = (associationId: string, association: Partial<IDesignAssociation>) =>
  vinesFetcher<IDesignAssociation, Partial<IDesignAssociation>>({
    method: 'PUT',
    simple: true,
  })(`/api/design/association/${associationId}`, association);

export const deleteDesignAssociation = (associationId: string) =>
  vinesFetcher({
    method: 'DELETE',
  })(`/api/design/association/${associationId}`);

export const useGetDesignAssociationList = () =>
  useSWR<IDesignAssociation[] | undefined>(`/api/design/association`, vinesFetcher());

export const generateDesignBoardThumbnail = (designBoardId: string, imageData: string) =>
  vinesFetcher<{ success: boolean }, { imageData: string }>({
    method: 'POST',
    simple: true,
  })(`/api/design/metadata/${designBoardId}/generate-thumbnail`, { imageData });

export const forkDesignTemplate = (templateProjectId: string) =>
  vinesFetcher<IAssetItem<IDesignProject>>({
    method: 'POST',
    simple: true,
  })(`/api/design/project/${templateProjectId}/fork`);

export const exportDesignProject = (projectId: string) =>
  vinesFetcher<any>({
    method: 'GET',
    simple: true,
  })(`/api/design/project/${projectId}/export`);

export const importDesignProject = (importData: any) =>
  vinesFetcher<IAssetItem<IDesignProject>>({
    method: 'POST',
    simple: true,
  })('/api/design/project/import', importData);