import { VinesToolDefProperties } from '@/package/vines-flow/core/tools/typings.ts';
import { IVinesFlowRenderType } from '@/package/vines-flow/core/typings.ts';

export const VINES_CANVAS_PADDING = 50;

export const VINES_DEF_NODE = {
  [IVinesFlowRenderType.COMPLICATE]: {
    width: 400,
    height: 480,
  },
  [IVinesFlowRenderType.SIMPLIFY]: {
    width: 80,
    height: 80,
  },
  [IVinesFlowRenderType.MINI]: {
    width: 318,
    height: 80,
  },
};

export const VINES_ENV_VARIABLES: VinesToolDefProperties[] = [
  {
    name: '__context.userId',
    displayName: '用户 ID',
    type: 'string',
  },
  {
    name: '__context.teamId',
    displayName: '团队 ID',
    type: 'string',
  },
  {
    name: '__context.chatSessionId',
    displayName: '会话 ID',
    type: 'string',
  },
];
