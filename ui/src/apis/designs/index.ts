import useSWR from 'swr';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { ICreateDesignProject } from '@/schema/workspace/create-design-project.ts';

import { IDesignProject } from './typings';

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
