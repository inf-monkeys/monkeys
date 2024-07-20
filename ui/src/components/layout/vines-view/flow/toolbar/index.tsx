import React from 'react';

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
import { useTranslation } from 'react-i18next';

import { MoreToolbar } from '@/components/layout/vines-view/flow/toolbar/more.tsx';
import { ToolButton } from '@/components/layout/vines-view/flow/toolbar/tool-button.tsx';
import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { Card } from '@/components/ui/card.tsx';
import { useHotkeys } from '@/hooks/use-hotkeys';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { IVinesFlowRenderType } from '@/package/vines-flow/core/typings.ts';
import { useVinesFlow } from '@/package/vines-flow/use.ts';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useCanvasInteractionStore } from '@/store/useCanvasStore/interaction.ts';
import { useFlowStore } from '@/store/useFlowStore';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events.ts';

interface IVinesToolbarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const VinesToolbar: React.FC<IVinesToolbarProps> = () => {
  const { t } = useTranslation();

  const { updatePageData } = useVinesPage();
  const { vines } = useVinesFlow();
  const { isLatestWorkflowVersion, workflowId } = useFlowStore();
  const { canvasMode, isWorkflowRUNNING, setCanvasMode, setVisible } = useCanvasStore();
  const { canvasDisabled, isCanvasMoving, setCanvasDisabled, setCanvasMoving, setIsUserInteraction } =
    useCanvasInteractionStore();

  const [, setLocalRenderDirection] = useLocalStorage<string>('vines-ui-process-page-render-direction', 'false', false);
  const [, setLocalRenderType] = useLocalStorage<Record<string, IVinesFlowRenderType>>(
    'vines-ui-process-page-render-type',
    {},
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
      setLocalRenderType({ [workflowId]: nextRenderType });
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
      <ToolButton
        icon={<ZoomInIcon />}
        tip={t('workspace.flow-view.tooltip.zoom-in')}
        keys={['ctrl', '+']}
        onClick={handleZoomIn}
      />
      <ToolButton
        icon={<Fullscreen />}
        tip={t('workspace.flow-view.tooltip.reset')}
        keys={['ctrl', '1']}
        onClick={handleFitScreen}
      />
      <ToolButton
        icon={<ZoomOutIcon />}
        tip={t('workspace.flow-view.tooltip.zoom-out')}
        keys={['ctrl', '-']}
        onClick={handleZoomOut}
      />
      <ToolButton
        icon={isCanvasMoving ? <Hand /> : <MousePointer2 />}
        tip={isCanvasMoving ? t('workspace.flow-view.tooltip.mouse') : t('workspace.flow-view.tooltip.drag')}
        keys={['space']}
        onClick={handleCanvasMove}
      />
      <ToolButton
        className={cn(
          !isEditMode && '[&_svg]:stroke-red-10',
          (isNotLatestWorkflowVersion || isWorkflowRUNNING) && 'hidden',
        )}
        icon={<Lock />}
        tip={isEditMode ? t('workspace.flow-view.tooltip.only-read') : t('workspace.flow-view.tooltip.edit')}
        keys={['ctrl', 'L']}
        onClick={handleToggleMode}
      />
      <ToolButton
        className={cn(isWorkflowRUNNING && 'hidden')}
        icon={isHorizontal ? <BetweenHorizontalStart /> : <BetweenVerticalStart />}
        tip={t('workspace.flow-view.tooltip.direction-of-alignment', {
          dir: isHorizontal ? t('workspace.flow-view.tooltip.horizontal') : t('workspace.flow-view.tooltip.vertically'),
        })}
        keys={['ctrl', 'D']}
        onClick={handleDirectionChange}
      />
      <ToolButton
        className={cn(isWorkflowRUNNING && 'hidden')}
        icon={<Workflow />}
        tip={t('workspace.flow-view.tooltip.display-mode', {
          mode: isRenderMini
            ? t('workspace.flow-view.tooltip.simplicity')
            : isRenderComplicate
              ? t('workspace.flow-view.tooltip.full-display')
              : t('workspace.flow-view.tooltip.normal'),
        })}
        onClick={handleRenderTypeChange}
      />
      <ToolButton
        className={cn(isWorkflowRUNNING && 'hidden')}
        icon={<Code />}
        tip={t('workspace.flow-view.tooltip.raw-data.button')}
        onClick={() => VinesEvent.emit('flow-raw-data-editor', workflowId)}
      />
      <MoreToolbar />
    </Card>
  );
};
