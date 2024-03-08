import { useMatches } from '@tanstack/react-router';

export const useVinesRoute = () => {
  const matches = useMatches();

  const routeMatch = matches.find((it) => it.routeId.includes('/$teamId'));
  const routeId = routeMatch?.routeId;
  const routeIds = routeId
    ?.substring(1)
    ?.split('/')
    ?.filter((it: string) => it);

  const routeAppId = routeIds?.at(1);

  // 之后再考虑是否改为开头匹配 vines-
  const isUseOutside =
    !routeIds || ['vines-process', 'vines-log', 'vines-chat', 'vines-preview'].includes(routeIds?.[3]);
  const isUseWorkSpace = routeAppId === 'workspace';

  return {
    matches,
    routeMatch,
    routeId,
    routeIds,
    routeAppId,
    isUseOutside,
    isUseWorkSpace,
  };
};
