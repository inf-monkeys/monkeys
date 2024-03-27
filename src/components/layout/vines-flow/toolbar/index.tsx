import React from 'react';

import { useHotkeys } from '@mantine/hooks';
import {
  BetweenHorizontalStart,
  BetweenVerticalStart,
  Code,
  Fullscreen,
  Hand,
  Lock,
  MousePointer2,
  Workflow,
  ZoomInIcon,
  ZoomOutIcon,
} from 'lucide-react';

import { ToolButton } from '@/components/layout/vines-flow/toolbar/tool-button.tsx';
import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { Card } from '@/components/ui/card.tsx';
import { IVinesFlowRenderType } from '@/package/vines-flow/core/typings.ts';
import { useVinesFlow } from '@/package/vines-flow/use.ts';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useFlowStore } from '@/store/useFlowStore';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';
import { usePageStore } from '@/store/usePageStore';
import { cn, useLocalStorage } from '@/utils';
import VinesEvent from '@/utils/events';

interface IVinesToolbarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const VinesToolbar: React.FC<IVinesToolbarProps> = () => {
  const { updatePageData } = useVinesPage();
  const { vines } = useVinesFlow();
  const { canvasMode, isLatestWorkflowVersion, isWorkflowRUNNING, setCanvasMode, setVisible } = useFlowStore();
  const { workflowId } = usePageStore();
  const { canvasDisabled, isCanvasMoving, setCanvasDisabled, setCanvasMoving, setIsUserInteraction } = useCanvasStore();

  const [, setLocalRenderDirection] = useLocalStorage<string>('vines-ui-process-page-render-direction', 'false', false);
  const [, setLocalRenderType] = useLocalStorage<string>(
    'vines-ui-process-page-render-type',
    IVinesFlowRenderType.SIMPLIFY,
    false,
  );

  const isEditMode = canvasMode === CanvasStatus.EDIT;
  const isHorizontal = vines.renderDirection === 'horizontal';
  const isRenderMini = vines.renderOptions.type === IVinesFlowRenderType.MINI;
  const isRenderComplicate = vines.renderOptions.type === IVinesFlowRenderType.COMPLICATE;

  const handleZoomIn = () => VinesEvent.emit('canvas-zoom-in');
  const handleZoomOut = () => VinesEvent.emit('canvas-zoom-out');
  const handleFitScreen = () => {
    VinesEvent.emit('canvas-auto-zoom');
    setIsUserInteraction(null);
  };
  const handleCanvasMove = () => {
    setCanvasMoving(!isCanvasMoving);
    setCanvasDisabled(!canvasDisabled);
  };
  const handleToggleMode = () =>
    setCanvasMode(canvasMode === CanvasStatus.EDIT ? CanvasStatus.READONLY : CanvasStatus.EDIT);
  const handleDirectionChange = () => {
    setVisible(false);
    void updatePageData('customOptions.render.useHorizontal', !isHorizontal);
    setLocalRenderDirection(!isHorizontal ? 'true' : 'false');
    setTimeout(() => vines.update({ renderDirection: isHorizontal ? 'vertical' : 'horizontal' }), 80);
  };
  const handleRenderTypeChange = () => {
    setVisible(false);
    setTimeout(() => {
      const map = Object.values(IVinesFlowRenderType);
      const currentIndex = map.indexOf(vines.renderOptions.type);
      const nextIndex = (currentIndex + 1) % map.length;
      const nextRenderType = map[nextIndex];
      vines.update({ renderType: nextRenderType });
      void updatePageData('customOptions.render.type', nextRenderType);
      setLocalRenderType(nextRenderType);
      setTimeout(() => setVisible(true), 80);
    }, 80);
  };

  useHotkeys([
    ['ctrl+l', handleToggleMode, { preventDefault: true }],
    ['ctrl+d', handleDirectionChange, { preventDefault: true }],
  ]);

  const isNotLatestWorkflowVersion = !isLatestWorkflowVersion;

  return (
    <Card className="absolute left-0 top-0 z-40 m-4 flex flex-col flex-nowrap gap-2 p-2">
      <ToolButton icon={<ZoomInIcon />} tip="放大" keys={['ctrl', '+']} onClick={handleZoomIn} />
      <ToolButton icon={<Fullscreen />} tip="适应屏幕" keys={['ctrl', '1']} onClick={handleFitScreen} />
      <ToolButton icon={<ZoomOutIcon />} tip="缩小" keys={['ctrl', '-']} onClick={handleZoomOut} />
      <ToolButton
        icon={isCanvasMoving ? <Hand /> : <MousePointer2 />}
        tip={isCanvasMoving ? '鼠标' : '移动视图'}
        keys={['space']}
        onClick={handleCanvasMove}
      />
      <ToolButton
        className={cn(
          !isEditMode && '[&_svg]:stroke-red-10',
          (isNotLatestWorkflowVersion || isWorkflowRUNNING) && 'hidden',
        )}
        icon={<Lock />}
        tip={isEditMode ? '只读模式' : '编辑模式'}
        keys={['ctrl', 'L']}
        onClick={handleToggleMode}
      />
      <ToolButton
        className={cn(isWorkflowRUNNING && 'hidden')}
        icon={isHorizontal ? <BetweenHorizontalStart /> : <BetweenVerticalStart />}
        tip={`排版方向：${isHorizontal ? '横向' : '纵向'}`}
        keys={['ctrl', 'D']}
        onClick={handleDirectionChange}
      />
      <ToolButton
        className={cn(isWorkflowRUNNING && 'hidden')}
        icon={<Workflow />}
        tip={`工具显示：${isRenderMini ? '极简' : isRenderComplicate ? '全参数' : '普通'}模式`}
        onClick={handleRenderTypeChange}
      />
      <ToolButton
        className={cn(isWorkflowRUNNING && 'hidden')}
        icon={<Code />}
        tip="开发者模式"
        onClick={() => VinesEvent.emit('flow-raw-data-editor', workflowId)}
      />
    </Card>
  );
};
