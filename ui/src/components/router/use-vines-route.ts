import { useMatches } from '@tanstack/react-router';

import { VINES_IFRAME_PAGE_IDS } from '@/components/ui/vines-iframe/consts.ts';

export const useVinesRoute = () => {
  const matches = useMatches();

  const routeMatch = matches.find((it) => it.routeId.includes('/$teamId'));
  const routeId = routeMatch?.routeId;
  const routeIds = routeId
    ?.substring(1)
    ?.split('/')
    ?.filter((it: string) => it);

  const routeAppId = routeIds?.at(1);

  const params = routeMatch?.params;

  // 检查是否是图片详情页面
  const isImageDetailPage = routeIds?.[3] === 'image-detail';

  // 之后再考虑是否改为开头匹配 vines-
  const isUseOutside = !routeIds;
  const isUseShareView = VINES_IFRAME_PAGE_IDS.includes(params?.['pageId']);
  const isUseIFrame = routeIds?.[4] === 'view-iframe';
  const isUseWorkbench = !routeAppId;
  // 图片详情页面也应该使用WorkspaceLayout
  const isUseWorkSpace = (routeAppId === 'workspace' && !isUseShareView && !isUseIFrame) || isImageDetailPage;
  const isUseAgent = routeAppId === 'agent';
  const isUsePanel = (!!routeIds || !isUseWorkbench) && !isUseWorkSpace && !isUseAgent;

  window['vinesRoute'] = [routeAppId || 'main', params?.['teamId'], params?.['workflowId']];

  return {
    matches,
    routeMatch,
    routeId,
    routeIds,
    routeAppId,
    isUseOutside,
    isUseWorkSpace,
    isUseShareView,
    isUseIFrame,
    isUseAgent,
    isUseWorkbench,
    isUsePanel,
    isImageDetailPage,
  };
};
