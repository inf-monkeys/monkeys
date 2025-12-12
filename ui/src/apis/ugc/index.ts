import useSWR, { preload } from 'swr';

import { AssetType, MonkeyWorkflow } from '@inf-monkeys/monkeys';
import _, { get } from 'lodash';
import qs from 'qs';
import { undefined } from 'zod';

import { preloadUgcAgentsV2, useUgcAgentsV2 } from '@/apis/agents-v2';
import { IComfyuiWorkflow } from '@/apis/comfyui/typings.ts';
import { IComfyuiModel } from '@/apis/comfyui-model/typings.ts';
import { IDesignProject } from '@/apis/designs/typings.ts';
import { vinesFetcher } from '@/apis/fetcher.ts';
import { ILLMChannel, ILLMModel } from '@/apis/llm/typings.ts';
import { IMediaData } from '@/apis/media-data/typings.ts';
import { ISDModel } from '@/apis/sd/typings.ts';
import { ITableData } from '@/apis/table-data/typings.ts';
import { EXTERNAL_TOOLS_CATEGORIES_MAP, INTERNAL_TOOLS_NAMESPACE } from '@/apis/tools/consts.tsx';
import { ICommonTool, IWorkflowTool } from '@/apis/tools/typings.ts';
import { IPaginationListData } from '@/apis/typings.ts';
import { IApplicationStoreItemDetail } from '@/apis/ugc/asset-typings.ts';
import { IKnowledgeBaseFrontEnd } from '@/apis/vector/typings.ts';
import { ACTION_TOOLS_CATEGORIES_MAP } from '@/apis/workflow/typings.ts';
import { paginationWrapper } from '@/apis/wrapper.ts';
import { getI18nContent } from '@/utils';

import { useSystemConfig } from '../common';
import { IModelTraining } from '../model-training/typings';
import { IAssetItem, IAssetPublicCategory, IAssetTag, IListUgcDto, IUgcFilterRules } from './typings';

export const useUgcItems = <T extends object>(dto: IListUgcDto, url: string, method: 'GET' | 'POST' = 'GET') => {
  const swrUrl = method === 'GET' ? `${url}?${qs.stringify(dto, { encode: false })}` : url;
  const fetcher =
    method === 'GET'
      ? vinesFetcher({ wrapper: paginationWrapper })
      : vinesFetcher({
          method,
          simple: true,
          wrapper: paginationWrapper,
        });
  return useSWR<IPaginationListData<IAssetItem<T>> | undefined>(method === 'GET' ? swrUrl : [swrUrl, dto], fetcher);
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const preloadUgcItems = <T extends object>(dto: IListUgcDto, url: string, method: 'GET' | 'POST' = 'GET') => {
  const swrUrl = method === 'GET' ? `${url}?${qs.stringify(dto, { encode: false })}` : url;
  const fetcher =
    method === 'GET'
      ? vinesFetcher({ wrapper: paginationWrapper })
      : vinesFetcher({
          method,
          simple: true,
          wrapper: paginationWrapper,
        });
  return preload(method === 'GET' ? swrUrl : [swrUrl, dto], fetcher);
};

export const useUgcWorkflows = (dto: IListUgcDto) => useUgcItems<MonkeyWorkflow>(dto, '/api/workflow/metadata');
export const preloadUgcWorkflows = (dto: IListUgcDto) => preloadUgcItems<MonkeyWorkflow>(dto, '/api/workflow/metadata');

export const useUgcAgents = (dto: IListUgcDto) => useUgcAgentsV2(dto);
export const preloadUgcAgents = (dto: IListUgcDto) => preloadUgcAgentsV2(dto);

export const useUgcDesignProjects = (dto: IListUgcDto) => useUgcItems<IDesignProject>(dto, '/api/design/project');
export const preloadUgcDesignProjects = (dto: IListUgcDto) =>
  preloadUgcItems<IDesignProject>(dto, '/api/design/project');

export const useUgcModelTraining = (dto: IListUgcDto) => useUgcItems<IModelTraining>(dto, '/api/model-training');
export const preloadUgcModelTraining = (dto: IListUgcDto) =>
  preloadUgcItems<IModelTraining>(dto, '/api/model-training');

export const useUgcActionTools = (dto: IListUgcDto) => useUgcItems<IWorkflowTool>(dto, '/api/tools');
export const useUgcComfyuiWorkflows = (dto: IListUgcDto) =>
  useUgcItems<IComfyuiWorkflow>(dto, '/api/comfyui/workflows');

const normalizeText = (raw: unknown): string => {
  if (raw === undefined || raw === null) {
    return '';
  }
  if (typeof raw === 'number') {
    return String(raw);
  }
  if (typeof raw === 'string') {
    const resolved = getI18nContent(raw, raw);
    return typeof resolved === 'string' ? resolved : raw;
  }
  const resolved = getI18nContent(raw as any);
  return typeof resolved === 'string' ? resolved : '';
};

export const useUgcTools = (dto: IListUgcDto) => {
  const { page, limit, search } = dto;
  const normalizedSearch = search?.trim().toLowerCase();

  const { data: oem } = useSystemConfig();

  const oemId = get(oem, ['theme', 'id'], undefined);

  const {
    data: actionToolsData,
    isLoading: isActionToolsLoading,
    mutate: mutateActionTools,
  } = useUgcActionTools({
    filter: undefined,
    page: 1,
    // FIXME
    limit: 99999,
  });

  const {
    data: comfyuiWorkflowsData,
    isLoading: isComfyuiWorkflowsLoading,
    mutate: mutateComfyuiWorkflows,
  } = useUgcComfyuiWorkflows({
    page: 1,
    limit: 99999,
    filter: undefined,
  });

  const {
    data: subWorkflowsData,
    isLoading: isSubWorkflowsLoading,
    mutate: mutateSubWorkflows,
  } = useUgcWorkflows({
    page: 1,
    limit: 99999,
    filter: undefined,
  });

  const processInternalToolList: ICommonTool[] =
    actionToolsData?.data
      .filter((tool) => INTERNAL_TOOLS_NAMESPACE.includes(tool.namespace))
      .map((actionTool) => {
        return {
          ...actionTool,
          toolType: 'tool',
          categories: actionTool.categories
            ? !Object.keys(ACTION_TOOLS_CATEGORIES_MAP).includes(actionTool.categories?.[0] ?? '')
              ? ['unknown']
              : actionTool.categories
            : ['unknown'],
        };
      }) ?? [];

  const processSubWorkflowList: ICommonTool[] =
    subWorkflowsData?.data.map((subWorkflow) => {
      return {
        ...subWorkflow,
        toolType: 'sub-workflow',
        categories: ['sub-workflow'],
        icon: subWorkflow.iconUrl,
      };
    }) ?? [];

  const processComfyuiWorkflowList: ICommonTool[] =
    comfyuiWorkflowsData?.data.map((comfyuiWorkflow) => {
      return {
        ...comfyuiWorkflow,
        toolType: 'comfyui',
        name: comfyuiWorkflow.id,
        categories: ['comfyui'],
      };
    }) ?? [];

  const processApiToolList: ICommonTool[] =
    actionToolsData?.data
      .filter((tool) => tool.namespace === 'api')
      .map((apiTool) => {
        return {
          ...apiTool,
          toolType: 'api',
          categories: ['api'],
        };
      }) ?? [];

  const processServiceToolList: ICommonTool[] =
    actionToolsData?.data
      .filter((tool) => !['api', ...INTERNAL_TOOLS_NAMESPACE].includes(tool.namespace))
      .map((serviceTool) => {
        return {
          ...serviceTool,
          toolType: 'service',
          categories: ['service', ...(serviceTool.categories ?? [])],
        };
      }) ?? [];

  const orderList = [
    ...Object.keys(ACTION_TOOLS_CATEGORIES_MAP),
    'unknown',
    ...Object.keys(EXTERNAL_TOOLS_CATEGORIES_MAP),
  ];

  const totalList =
    oemId === 'concept-design'
      ? processServiceToolList.filter((item) => get(item, 'namespace') === 'monkeys_tool_concept_design')
      : [
          ...processInternalToolList,
          ...processSubWorkflowList,
          ...processComfyuiWorkflowList,
          ...processApiToolList,
          ...processServiceToolList,
        ];
  const filteredList = normalizedSearch
    ? totalList.filter((item) => {
        const nameText = normalizeText((item as any)?.name);
        const displayNameText = normalizeText((item as any)?.displayName);
        const descriptionText = normalizeText((item as any)?.description);
        return [nameText, displayNameText, descriptionText]
          .map((text) => text.toLowerCase())
          .some((text) => text.includes(normalizedSearch));
      })
    : totalList;
  const sortedList = [...filteredList].sort(
    (a, b) => (orderList.indexOf(a.categories?.[0] ?? '') ?? 999) - (orderList.indexOf(b.categories?.[0] ?? '') ?? 0),
  );
  const sliceList = sortedList.slice(limit * (page - 1), limit * page);

  const data: IPaginationListData<ICommonTool> = {
    list: sliceList,
    page,
    limit,
    total: filteredList.length,
    data: sliceList,
  };

  const mutate = async () => {
    await mutateActionTools();
    await mutateComfyuiWorkflows();
    await mutateSubWorkflows();
  };

  return {
    isLoading: isActionToolsLoading || isComfyuiWorkflowsLoading || isSubWorkflowsLoading,
    mutate,
    data,
  };
};

export const useUgcTextModels = (dto: IListUgcDto) => useUgcItems<ILLMModel>(dto, '/api/llm-models');
export const preloadUgcTextModels = (dto: IListUgcDto) => preloadUgcItems<ILLMModel>(dto, '/api/llm-models');

export const useUgcImageModels = (dto: IListUgcDto) => useUgcItems<IComfyuiModel>(dto, '/api/comfyui-models');
export const preloadUgcImageModels = (dto: IListUgcDto) => preloadUgcItems<IComfyuiModel>(dto, '/api/comfyui-models');

export const useUgcKnowledgeBases = (dto: IListUgcDto) =>
  useUgcItems<IKnowledgeBaseFrontEnd>(dto, '/api/knowledge-bases');

export const preloadKnowledgeBases = (dto: IListUgcDto) =>
  preloadUgcItems<IKnowledgeBaseFrontEnd>(dto, '/api/knowledge-bases');

export const useUgcTableData = (dto: IListUgcDto) => useUgcItems<ITableData>(dto, '/api/sql-knowledge-bases');
export const preloadUgcTableData = (dto: IListUgcDto) => preloadUgcItems<ITableData>(dto, '/api/sql-knowledge-bases');

export const useUgcMediaData = (dto: IListUgcDto, filterNeuralModel?: 'only' | 'exclude' | 'all') => {
  const baseUrl = '/api/media-files';
  const url = filterNeuralModel ? `${baseUrl}?filterNeuralModel=${filterNeuralModel}` : baseUrl;
  const swrUrl = `${url}${filterNeuralModel ? '&' : '?'}${qs.stringify(dto, { encode: false })}`;
  const fetcher = vinesFetcher({ wrapper: paginationWrapper });
  return useSWR<IPaginationListData<IAssetItem<IMediaData>> | undefined>(swrUrl, fetcher);
};

export const preloadUgcMediaData = (dto: IListUgcDto, filterNeuralModel?: 'only' | 'exclude' | 'all') => {
  const baseUrl = '/api/media-files';
  const url = filterNeuralModel ? `${baseUrl}?filterNeuralModel=${filterNeuralModel}` : baseUrl;
  const swrUrl = `${url}${filterNeuralModel ? '&' : '?'}${qs.stringify(dto, { encode: false })}`;
  const fetcher = vinesFetcher({ wrapper: paginationWrapper });
  return preload(swrUrl, fetcher);
};

export const useUgcMediaDataById = (assetId: string) =>
  useSWR<IAssetItem<IMediaData> | undefined>(assetId ? `/api/media-files/${assetId}` : null, vinesFetcher());

export interface IFolderViewData {
  id: string;
  name: string;
  assetCount: number;
  lastUpdated: string;
  previewImages: string[];
  previewAssets: any[];
  filterRules: Partial<IListUgcDto['filter']>;
}

export const useUgcMediaDataForFolderView = (search?: string) => {
  const url = search ? `/api/media-files/folder-view?search=${encodeURIComponent(search)}` : '/api/media-files/folder-view';
  return useSWR<IFolderViewData[] | undefined>(url, vinesFetcher());
};

export const useUgcWorkflowsForFolderView = (search?: string) => {
  const url = search ? `/api/workflow/metadata/folder-view?search=${encodeURIComponent(search)}` : '/api/workflow/metadata/folder-view';
  return useSWR<IFolderViewData[] | undefined>(url, vinesFetcher());
};

export const useUgcApplicationStore = (dto: IListUgcDto) =>
  useUgcItems<IApplicationStoreItemDetail>(dto, '/api/assets/workflow/marketplace');
export const preloadUgcApplicationStore = (dto: IListUgcDto) =>
  preloadUgcItems<IApplicationStoreItemDetail>(dto, '/api/templates');

export const useUgcTextModelStore = (dto: IListUgcDto) =>
  useUgcItems<ILLMChannel>(dto, '/api/assets/llm-channel/marketplace');
export const preloadUgcTextModelStore = (dto: IListUgcDto) =>
  preloadUgcItems<ILLMChannel>(dto, '/api/assets/llm-channel/marketplace');

export const useUgcComfyUIWorkflowStore = (dto: IListUgcDto) =>
  useUgcItems<IComfyuiWorkflow>(dto, '/api/assets/comfyui-workflow/marketplace');
export const preloadComfyUIWorkflowStore = (dto: IListUgcDto) =>
  preloadUgcItems<IComfyuiWorkflow>(dto, '/api/assets/comfyui-workflow/marketplace');

export const useUgcImageModelStore = (dto: IListUgcDto) =>
  useUgcItems<ISDModel>(dto, '/api/assets/sd-model/marketplace');
export const preloadUgcImageModelStore = (dto: IListUgcDto) =>
  preloadUgcItems<ISDModel>(dto, '/api/assets/sd-model/marketplace');

export const useAssetTagList = () =>
  useSWR<IAssetTag[] | undefined>(`/api/assets/tags`, vinesFetcher(), {
    refreshInterval: 600000,
  });

export const useAssetFilterRuleList = (type: AssetType, isMarket = false) =>
  useSWR<IUgcFilterRules[] | undefined>(isMarket ? null : `/api/assets/filters?type=${type}`, vinesFetcher(), {
    refreshInterval: 600000,
  });

export const createAssetFilterRules = (name: string, rules: Partial<IListUgcDto['filter']>, type: AssetType) => {
  return vinesFetcher<IUgcFilterRules>({ method: 'POST', simple: true })('/api/assets/filters', { name, rules, type });
};
export const removeAssetFilterRules = (id: string) => {
  return vinesFetcher<boolean>({ method: 'DELETE' })(`/api/assets/filters/${id}`);
};

export const useAssetPublicCategories = (type: AssetType, isMarket = false) =>
  useSWR<IAssetPublicCategory[] | undefined>(isMarket ? `/api/assets/${type}/marketplace/tags` : null, vinesFetcher(), {
    refreshInterval: 600000,
  });

export const createTag = (name: string) => {
  return vinesFetcher<IAssetTag>({ method: 'POST', simple: true })(`/api/assets/tags/`, { name });
};

export const updateAssetTag = (type: AssetType, id: string, data: any) =>
  vinesFetcher({
    method: 'PUT',
    simple: true,
  })(
    `/api/assets/${type}/${id}/tags`,
    _.pickBy(data, (v) => !_.isNil(v)),
  );

export const useSearchReferenceWorkflows = (assetType?: AssetType, assetId?: string) =>
  useSWR<MonkeyWorkflow[] | undefined>(
    assetId && assetType ? `/api/assets/reference/workflow?assetType=${assetType}&assetId=${assetId}` : null,
    vinesFetcher(),
    {
      refreshInterval: 600000,
    },
  );

export const publishAssetItem = (type: AssetType, id: string, data: any) =>
  vinesFetcher<IAssetItem>({
    method: 'POST',
    simple: true,
  })(`/api/assets/${type}/public/${id}`, data);

export const forkAssetItem = (type: AssetType, id: string) =>
  vinesFetcher<IAssetItem>({
    method: 'POST',
    simple: true,
  })(`/api/assets/${type}/fork/${id}`);

export const updateAssetItem = (type: AssetType, id: string, data: any) =>
  vinesFetcher({
    method: 'PUT',
    simple: true,
  })(
    `/api/assets/${type}/${id}`,
    _.pickBy(data, (v) => !_.isNil(v)),
  );
