import useSWR from 'swr';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { ICreateDesignProject } from '@/schema/workspace/create-design-project.ts';

import { IDesignBoardItem, IDesignBoardMetadata, IDesignProject } from './typings';

export const createDesignProject = (createDesignProjectDto: ICreateDesignProject) =>
  vinesFetcher<IAssetItem<IDesignProject>>({
    method: 'POST',
    simple: true,
  })('/api/design/project', createDesignProjectDto);

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

export const useDesignProjectMetadataList = (designProjectId: string) =>
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
  vinesFetcher<IAssetItem<IDesignBoardMetadata>, Partial<IAssetItem<IDesignProject>>>({ method: 'PUT', simple: true })(
    `/api/design/metadata/${designBoardId}`,
    metadata,
  );
