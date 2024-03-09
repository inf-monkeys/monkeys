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
