import { VINES_DEF_NODE } from '@/package/vines-flow/core/consts.ts';
import { IVinesFlowRenderType } from '@/package/vines-flow/core/typings.ts';
import { _vines, useVinesRefresher } from '@/package/vines-flow/index.ts';

export const useVinesFlow = () => {
  const { _refresher } = useVinesRefresher();

  const calculateAdaptiveZoom = (containerWidth: number, containerHeight: number): number => {
    const {
      canvasSize: { width, height },
    } = _vines;
    const vinesNodeLength = _vines.getAllNodes().length;
    if (!vinesNodeLength) return 0;

    const useHorizontal = _vines.renderDirection === 'horizontal';
    const vinesRenderType = _vines.renderOptions.type;

    const { padding: canvasPadding } = VINES_DEF_NODE[vinesRenderType];

    const padding = useHorizontal
      ? containerWidth / canvasPadding.horizontal
      : containerHeight / canvasPadding.vertical;

    const containerSize = useHorizontal ? containerWidth : containerHeight;
    const canvasSize = useHorizontal ? width : height;

    if (vinesRenderType !== IVinesFlowRenderType.COMPLICATE) {
      const zoomRatio = (containerSize - padding - Math.max((6 - vinesNodeLength) * padding, 0)) / canvasSize;
      if (!Number.isNaN(zoomRatio)) {
        return zoomRatio;
      }
    }

    return (containerSize - padding) / canvasSize;
  };

  return {
    vines: _vines,
    vinesTools: _vines.tools,

    vinesCanvasSize: _vines.canvasSize,

    calculateAdaptiveZoom,

    VINES_REFRESHER: _refresher,
  };
};
