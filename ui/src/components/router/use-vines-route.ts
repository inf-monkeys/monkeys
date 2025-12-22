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

  // 检查是否是邀请页面
  const isInvitePage = routeAppId === 'invite';

  // 检查是否是图片详情页面
  const isImageDetailPage = routeIds?.[3] === 'image-detail';
  const isAssetDetailPage = routeIds?.[3] === 'asset-detail';

  // 之后再考虑是否改为开头匹配 vines-
  const isUseOutside = !routeIds;
  const isUseShareView = VINES_IFRAME_PAGE_IDS.includes(params?.['pageId']);
  const isUseIFrame = routeIds?.[4] === 'view-iframe';
  const isUseWorkbench = !routeAppId;
  // 图片详情页面应该使用WorkspaceLayout，但不显示侧边栏
  const isUseWorkSpace =
    (routeAppId === 'workspace' && !isUseShareView && !isUseIFrame) || isImageDetailPage || isAssetDetailPage;
  const isUseAgent = routeAppId === 'agent';
  // Agent 聊天页面：/$teamId/agents/$agentId
  const isAgentChatPage = routeAppId === 'agents' && routeIds?.[2] === '$agentId';
  const isUseDesign = routeAppId === 'design';
  const isUseEvaluation = routeAppId === 'evaluations' && routeIds?.[2] && routeIds?.[3]; // 有moduleId和tab时使用评测布局
  const isUseDataBrowser = routeAppId === 'data-browser'; // 数据浏览器页面
  const isUsePanel =
    (!!routeIds || !isUseWorkbench) && !isUseWorkSpace && !isUseAgent && !isUseDesign && !isUseEvaluation && !isAgentChatPage;
  const isUseAppStore = routeAppId === 'store';
  const isUseCustomNav = routeAppId === 'nav';

  const routeCustomNavId = isUseCustomNav ? routeMatch?.params?.['navId'] : undefined;
  const routeCustomSubModuleId = isUseCustomNav ? routeMatch?.params?.['subModuleId'] : undefined;
  const routeDesignProjectId = isUseDesign ? routeMatch?.params?.['designProjectId'] : undefined;

  // 对于图片详情页面，确保路由信息中包含workbench，以便高亮工作台选项
  // 对于邀请页面，设置为 'invite' 以绕过认证检查
  window['vinesRoute'] = isImageDetailPage || isAssetDetailPage
    ? ['workbench', params?.['teamId'], params?.['workflowId']]
    : isInvitePage
      ? ['invite', params?.['teamId'], params?.['inviteId']]
      : [routeAppId || 'main', params?.['teamId'], params?.['workflowId']];

  return {
    matches,
    routeMatch,
    routeId,
    routeIds,
    routeAppId,
    routeCustomNavId,
    routeCustomSubModuleId,
    routeDesignProjectId,
    isUseOutside,
    isUseWorkSpace,
    isUseShareView,
    isUseIFrame,
    isUseAgent,
    isAgentChatPage,
    isUseDesign,
    isUseWorkbench,
    isUsePanel,
    isImageDetailPage,
    isAssetDetailPage,
    isUseAppStore,
    isUseEvaluation,
    isUseCustomNav,
    isInvitePage,
    isUseDataBrowser,
  };
};
