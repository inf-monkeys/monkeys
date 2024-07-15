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

  // 之后再考虑是否改为开头匹配 vines-
  const isUseOutside = !routeIds;
  const isUseWorkSpace = routeAppId === 'workspace';
  const isUseVinesCore = VINES_IFRAME_PAGE_IDS.includes(params?.['pageId']);

  window['vinesRoute'] = [routeAppId || 'main', params?.['teamId'], params?.['workflowId']];

  return {
    matches,
    routeMatch,
    routeId,
    routeIds,
    routeAppId,
    isUseOutside,
    isUseWorkSpace,
    isUseVinesCore,
  };
};
