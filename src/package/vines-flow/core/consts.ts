import { VinesToolDefProperties } from '@/package/vines-flow/core/tools/typings.ts';
import { IVinesFlowRenderType } from '@/package/vines-flow/core/typings.ts';

export const VINES_DEF_NODE = {
  [IVinesFlowRenderType.COMPLICATE]: {
    width: 400,
    height: 480,
    padding: {
      vertical: 6,
      horizontal: 4,
    },
  },
  [IVinesFlowRenderType.SIMPLIFY]: {
    width: 80,
    height: 80,
    padding: {
      vertical: 10,
      horizontal: 6,
    },
  },
  [IVinesFlowRenderType.MINI]: {
    width: 318,
    height: 80,
    padding: {
      vertical: 8,
      horizontal: 12,
    },
  },
};

export const VINES_ENV_VARIABLES: VinesToolDefProperties[] = [
  {
    name: 'userId',
    displayName: '用户 ID',
    type: 'string',
  },
  {
    name: 'teamId',
    displayName: '团队 ID',
    type: 'string',
  },
  {
    name: 'chatSessionId',
    displayName: '会话 ID',
    type: 'string',
  },
];
