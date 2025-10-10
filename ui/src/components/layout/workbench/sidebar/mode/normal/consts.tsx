import { IPageGroup, IPinPage } from '@/apis/pages/typings';
import { DEFAULT_GLOBAL_DESIGN_BOARD_ICON_URL } from '@/consts/icons';

export const GLOBAL_DESIGN_BOARD_PAGE_GROUP: IPageGroup = {
  id: 'global-design-board',
  pageIds: ['global-design-board'],
  displayName: {
    'zh-CN': '画板',
    'en-US': 'Board',
  },
  isBuiltIn: false,
  iconUrl: DEFAULT_GLOBAL_DESIGN_BOARD_ICON_URL,
  sortIndex: 0,
};

export const GLOBAL_DESIGN_BOARD_PAGE: IPinPage = {
  id: 'global-design-board',
  displayName: JSON.stringify({
    'zh-CN': '全局画板',
    'en-US': 'Global Board',
  }),
  type: 'global-design-board',
  workflowId: 'global-design-board',
  isBuiltIn: true,
  instance: {
    name: 'Global Board',
    icon: 'pencil-ruler',
    type: 'global-design-board',
    allowedPermissions: [],
  },
  designProject: {
    id: 'global-design-board',
    name: 'Global Board',
    displayName: JSON.stringify({
      'zh-CN': '全局画板',
      'en-US': 'Global Board',
    }),
    iconUrl: DEFAULT_GLOBAL_DESIGN_BOARD_ICON_URL,
    createdTimestamp: 0,
    updatedTimestamp: 0,
  },
};

export const CONCEPT_DESIGN_IFRAME_PAGE_GROUP: IPageGroup = {
  id: 'concept-design-iframe-page-group',
  pageIds: ['concept-design-iframe-conceptual-design', 'concept-design-iframe-innovation-system'],
  displayName: {
    'zh-CN': '工具',
    'en-US': 'Tools',
  },
  isBuiltIn: false,
  iconUrl: 'lucide:bot',
  sortIndex: 0,
};
