import React from 'react';

import { useHotkeys } from '@mantine/hooks';
import { AnimatePresence, motion } from 'framer-motion';
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
import { Card } from '@/components/ui/card.tsx';
import { IVinesFlowRenderType } from '@/package/vines-flow/core/typings.ts';
import { useVinesFlow } from '@/package/vines-flow/use.ts';
import { useFlowStore } from '@/store/useFlowStore';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';
import VinesEvent from '@/utils/events';

interface IVinesToolbarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const VinesToolbar: React.FC<IVinesToolbarProps> = () => {
  const { vines } = useVinesFlow();
  const { canvasMode, canvasDisabled, isCanvasMoving, setCanvasMode, setCanvasDisabled, setCanvasMoving, setVisible } =
    useFlowStore();

  const isEditMode = canvasMode === CanvasStatus.EDIT;
  const isHorizontal = vines.renderDirection === 'horizontal';
  const isRenderMini = vines.renderOptions.type === IVinesFlowRenderType.MINI;
  const isRenderComplicate = vines.renderOptions.type === IVinesFlowRenderType.COMPLICATE;

  const handleZoomIn = () => VinesEvent.emit('canvas-zoom-in');
  const handleZoomOut = () => VinesEvent.emit('canvas-zoom-out');
  const handleFitScreen = () => VinesEvent.emit('canvas-auto-zoom');
  const handleCanvasMove = () => {
    setCanvasMoving(!isCanvasMoving);
    setCanvasDisabled(!canvasDisabled);
  };
  const handleToggleMode = () =>
    setCanvasMode(canvasMode === CanvasStatus.EDIT ? CanvasStatus.READONLY : CanvasStatus.EDIT);
  const handleDirectionChange = () => {
    setVisible(false);
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
      setTimeout(() => setVisible(true), 80);
    }, 80);
  };

  useHotkeys([
    ['ctrl+l', handleToggleMode, { preventDefault: true }],
    ['ctrl+d', handleDirectionChange, { preventDefault: true }],
  ]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        key="vines-canvas-toolbar"
        className="absolute left-0 top-0 z-40 flex items-center p-4"
      >
        <Card className="flex flex-col flex-nowrap gap-2 p-2">
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
            className={isEditMode ? '' : '[&_svg]:stroke-red-10'}
            icon={<Lock />}
            tip={isEditMode ? '只读模式' : '编辑模式'}
            keys={['ctrl', 'L']}
            onClick={handleToggleMode}
          />
          <ToolButton
            icon={isHorizontal ? <BetweenHorizontalStart /> : <BetweenVerticalStart />}
            tip={`排版方向：${isHorizontal ? '横向' : '纵向'}`}
            keys={['ctrl', 'D']}
            onClick={handleDirectionChange}
          />
          <ToolButton
            icon={<Workflow />}
            tip={`工具显示：${isRenderMini ? '极简' : isRenderComplicate ? '全参数' : '普通'}模式`}
            onClick={handleRenderTypeChange}
          />
          <ToolButton icon={<Code />} tip="开发者模式" />
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};
