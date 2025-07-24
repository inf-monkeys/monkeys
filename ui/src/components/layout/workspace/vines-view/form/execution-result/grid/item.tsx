import React from 'react';

import { SWRInfiniteResponse } from 'swr/infinite';

import type { EventEmitter } from 'ahooks/lib/useEventEmitter';
import { Check, CirclePause, FileMinus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { VinesAbstractDataPreview } from '@/components/layout/workspace/vines-view/_common/data-display/abstract';
import { IAddDeletedInstanceId } from '@/components/layout/workspace/vines-view/form/execution-result/grid/index.tsx';
import { Button } from '@/components/ui/button';
import { VinesLoading } from '@/components/ui/loading';
import { getAlt } from '@/utils';
import { IVinesExecutionResultItem } from '@/utils/execution.ts';

import { VirtuaExecutionResultGridImageItem } from '../virtua/item/image';
import { VirtuaExecutionResultGridWrapper } from '../virtua/item/wrapper';

interface IExecutionResultItemProps {
  result: IVinesExecutionResultItem;
  event$?: EventEmitter<void>;
  isDeleted?: boolean;
  addDeletedInstanceId?: IAddDeletedInstanceId;
  mutate?: SWRInfiniteResponse['mutate'];
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (renderKey: string) => void;
  clickBehavior?: IClickBehavior;
  selectionModeDisplayType?: ISelectionModeDisplayType;
  workflowId?: string;
}

export type IClickBehavior = 'preview' | 'select' | 'fill-form' | 'none';
export type ISelectionModeDisplayType = 'operation-button' | 'dropdown-menu';

export const ExecutionResultItem: React.FC<IExecutionResultItemProps> = ({
  result,
  event$,
  isDeleted = false,
  addDeletedInstanceId,
  mutate,
  isSelectionMode = false,
  isSelected = false,
  onSelect,
  clickBehavior = 'preview',
  selectionModeDisplayType = 'dropdown-menu',
  workflowId,
}) => {
  const { render } = result;
  const { type, data, status } = render;
  const { t } = useTranslation();
  const alt = getAlt(result);

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(render.key);
  };

  const renderSelectionOverlay = () => {
    if ((clickBehavior !== 'select' && !isSelectionMode) || !isSelected) return null;
    return (
      <Button
        variant="outline"
        icon={<Check />}
        className="absolute bottom-global-1/2 right-global-1/2 z-50 !size-global-2"
      />
    );
  };

  if (isDeleted)
    return (
      <div className="flex h-10 items-center justify-center gap-1 rounded-lg border border-input shadow-sm">
        <FileMinus className="stroke-gray-11" size={16} />
        <span className="text-sm font-bold text-gray-11">{t('common.utils.deleted')}</span>
      </div>
    );

  switch (status) {
    case 'SCHEDULED':
    case 'RUNNING':
      return (
        <div
          key={render.key}
          className="relative flex h-40 items-center justify-center rounded-lg border border-input shadow-sm"
        >
          <VinesLoading />
        </div>
      );
    case 'PAUSED':
      return (
        <div
          key={render.key}
          className="relative flex h-40 w-full flex-col items-center justify-center gap-2 rounded-lg border border-input shadow-sm"
        >
          <CirclePause className="stroke-yellow-10" size={36} />
          <h1 className="text-sm font-bold">{t('common.workflow.status.PAUSED')}</h1>
        </div>
      );
  }

  switch (type) {
    case 'image':
      return (
        <div className="relative overflow-hidden rounded-lg border border-input shadow-sm">
          <VirtuaExecutionResultGridWrapper
            data={result}
            src={data as string}
            event$={event$}
            addDeletedInstanceId={addDeletedInstanceId}
            mutate={mutate}
            onSelect={onSelect}
            isSelected={isSelected}
            selectionModeDisplayType={selectionModeDisplayType}
          >
            <div className="h-full w-full">
              <VirtuaExecutionResultGridImageItem
                src={data as string}
                alt={alt}
                instanceId={result.instanceId}
                renderKey={render.key}
                isSelectionMode={isSelectionMode}
                onSelect={handleSelect}
                clickBehavior={clickBehavior}
                event$={event$}
                data={result}
                workflowId={workflowId}
              />
              {renderSelectionOverlay()}
            </div>
          </VirtuaExecutionResultGridWrapper>
        </div>
      );
    default:
      return (
        <div className="relative overflow-hidden rounded-lg border border-input shadow-sm" onClick={handleSelect}>
          <VirtuaExecutionResultGridWrapper
            data={result}
            event$={event$}
            addDeletedInstanceId={addDeletedInstanceId}
            mutate={mutate}
            onSelect={onSelect}
            isSelected={isSelected}
            selectionModeDisplayType={selectionModeDisplayType}
          >
            <div className="max-h-96 min-h-40 overflow-auto p-2">
              {renderSelectionOverlay()}
              <VinesAbstractDataPreview data={data} className="h-full" />
            </div>
          </VirtuaExecutionResultGridWrapper>
        </div>
      );
  }
};
