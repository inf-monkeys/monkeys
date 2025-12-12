import React from 'react';

import { SWRInfiniteResponse } from 'swr/infinite';

import type { EventEmitter } from 'ahooks/lib/useEventEmitter';
import { get } from 'lodash';
import { Check, CirclePause, FileMinus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useSystemConfig } from '@/apis/common';
import { ExectuionResultGridDisplayType } from '@/apis/common/typings';
import { VinesAbstractDataPreview } from '@/components/layout/workspace/vines-view/_common/data-display/abstract';
import { extract3DModelUrls, extractVideoUrls } from '@/components/layout/workspace/vines-view/_common/data-display/abstract/utils';
import { IAddDeletedInstanceId } from '@/components/layout/workspace/vines-view/form/execution-result/grid/index.tsx';
import { Button } from '@/components/ui/button';
import { VinesLoading } from '@/components/ui/loading';
import { getAlt } from '@/utils';
import { IVinesExecutionResultItem } from '@/utils/execution.ts';

import { VirtuaExecutionResultGridImageItem } from '../virtua/item/image';
import { VirtuaExecutionResultGridWrapper } from '../virtua/item/wrapper';
import { ExecutionResultItemLoading } from './loading';

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
  estimatedTime?: number;
  displayType?: ExectuionResultGridDisplayType;
  pomLayoutHint?: boolean;
}

export type IClickBehavior = 'preview' | 'select' | 'fill-form' | 'none';
export type ISelectionModeDisplayType = 'operation-button' | 'dropdown-menu';

const ExecutionResultItemComponent: React.FC<IExecutionResultItemProps> = ({
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
  estimatedTime = 180,
  displayType = 'masonry',
  pomLayoutHint = false,
}) => {
  const { render, startTime } = result;
  const { type, data, status } = render;
  const { t } = useTranslation();
  const alt = getAlt(result);

  const { data: oem } = useSystemConfig();

  const progressType = get(oem, 'theme.views.form.progress', 'infinite');

  const isVideo = React.useMemo(() => {
    if (type === 'video') return true;
    try {
      const text = typeof data === 'string' ? data : JSON.stringify(data);
      return extractVideoUrls(text).length > 0;
    } catch {
      return false;
    }
  }, [type, data]);

  // 3D 模型下载：给 Wrapper 传 src，即可复用「像图片一样」的下载按钮（Download icon）
  const downloadSrc = React.useMemo(() => {
    try {
      const text = typeof data === 'string' ? data : JSON.stringify(data);
      return extract3DModelUrls(text)?.[0];
    } catch {
      return undefined;
    }
  }, [data]);

  // 检测是否为 POM 相关结果：
  // - 当前条目直接包含 measurements_table
  // - 或者当前工作流已被识别为 POM（pomLayoutHint），且该条目处于运行中/排队/暂停状态
  const isPom = React.useMemo(() => {
    const obj: any = data as any;
    const payload = obj && typeof obj === 'object' ? (obj.data ? obj.data : obj) : null;
    const hasMeasurementsTable = !!(payload && Array.isArray(payload.measurements_table));

    if (hasMeasurementsTable) return true;

    if (pomLayoutHint && ['SCHEDULED', 'RUNNING', 'PAUSED'].includes(status)) {
      return true;
    }

    return false;
  }, [data, status, pomLayoutHint]);

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
      <div
        className={`flex items-center justify-center gap-1 rounded-lg border border-input shadow-sm ${
          displayType === 'grid'
            ? // 网格模式下，非 POM 仍保持方形比例，POM 使用内容自适应高度避免与相邻卡片重叠
              isPom
              ? 'h-full'
              : isVideo
                ? 'h-full'
                : 'aspect-square h-full'
            : 'h-10'
        }`}
      >
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
          className={`relative flex flex-col items-center justify-center gap-4 rounded-lg border border-input p-4 shadow-sm ${
            displayType === 'grid'
              ? // 网格模式下，非 POM 使用固定方形比例，POM 根据内容自适应高度，避免结果表格被压缩后与下方卡片重叠
                isPom
                ? 'h-full'
                : isVideo
                  ? 'h-full'
                  : 'aspect-square h-full'
              : // 非网格（masonry 等）模式下，POM 运行中卡片组固定高度避免重叠
                isPom
                ? 'h-[500px]'
                : 'h-40'
          }`}
        >
          {progressType === 'estimate' ? (
            <ExecutionResultItemLoading startTime={startTime} estimatedTime={estimatedTime} status={status} />
          ) : (
            <VinesLoading />
          )}
        </div>
      );
    case 'PAUSED':
      return (
        <div
          key={render.key}
          className={`relative flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-input shadow-sm ${
            displayType === 'grid'
              ? // 网格模式下，非 POM 使用固定方形比例，POM 根据内容自适应高度
                isPom
                ? 'h-full'
                : isVideo
                  ? 'h-full'
                  : 'aspect-square h-full'
              : // 非网格（masonry 等）模式下，POM 暂停卡片组固定高度避免重叠
                isPom
                ? 'h-[500px]'
                : 'h-40'
          }`}
        >
          <CirclePause className="stroke-yellow-10" size={36} />
          <h1 className="text-sm font-bold">{t('common.workflow.status.PAUSED')}</h1>
        </div>
      );
  }

  switch (type) {
    case 'image':
      return (
        <div
          className={`relative overflow-hidden rounded-lg border border-input shadow-sm ${
            displayType === 'grid' ? 'aspect-square h-full' : ''
          }`}
          // 为每个卡片增加左右外边距，避免相邻边框在视觉上贴合产生“重叠线”
          style={{ marginLeft: 6, marginRight: 6 }}
        >
          <VirtuaExecutionResultGridWrapper
            data={result}
            src={data as string}
            event$={event$}
            addDeletedInstanceId={addDeletedInstanceId}
            mutate={mutate}
            onSelect={onSelect}
            isSelected={isSelected}
            selectionModeDisplayType={selectionModeDisplayType}
            displayType={displayType}
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
                displayType={displayType}
              />
              {renderSelectionOverlay()}
            </div>
          </VirtuaExecutionResultGridWrapper>
        </div>
      );
    default:
      return (
        <div
          className={`relative overflow-hidden rounded-lg border border-input shadow-sm ${
            displayType === 'grid'
              ? // 网格模式下，非 POM 使用固定方形比例，POM 根据内容自适应高度
                isPom
                ? 'h-full'
                : isVideo
                  ? 'h-full'
                  : 'aspect-square h-full'
              : // 非 grid 模式下，POM 卡片固定高度避免重叠
                isPom
                ? 'h-[500px]'
                : ''
          }`}
          onClick={handleSelect}
          // 同步为非图片卡片增加左右外边距，避免边框贴合
          style={{ marginLeft: 6, marginRight: 6 }}
        >
          <VirtuaExecutionResultGridWrapper
            data={result}
            src={downloadSrc}
            event$={event$}
            addDeletedInstanceId={addDeletedInstanceId}
            mutate={mutate}
            onSelect={onSelect}
            isSelected={isSelected}
            selectionModeDisplayType={selectionModeDisplayType}
            displayType={displayType}
          >
            <div
              className={`p-2 ${
                displayType === 'grid'
                  ? 'h-full'
                  : // 非 grid 模式下，POM 内容区占满固定高度；非 POM 使用原来的自适应高度
                    isPom
                    ? 'h-full'
                    : isVideo
                      ? ''
                      : 'max-h-96 min-h-40'
              } ${isPom || isVideo ? 'overflow-hidden' : 'overflow-auto'}`}
            >
              {renderSelectionOverlay()}
              <VinesAbstractDataPreview data={data} className="h-full" />
            </div>
          </VirtuaExecutionResultGridWrapper>
        </div>
      );
  }
};

const areEqual = (prev: IExecutionResultItemProps, next: IExecutionResultItemProps) => {
  const prevRender = prev.result.render;
  const nextRender = next.result.render;

  return (
    prevRender.key === nextRender.key &&
    prevRender.status === nextRender.status &&
    prevRender.type === nextRender.type &&
    prevRender.data === nextRender.data &&
    prevRender.isDeleted === nextRender.isDeleted &&
    prev.result.status === next.result.status &&
    prev.result.instanceId === next.result.instanceId &&
    prev.isDeleted === next.isDeleted &&
    prev.isSelectionMode === next.isSelectionMode &&
    prev.isSelected === next.isSelected &&
    prev.clickBehavior === next.clickBehavior &&
    prev.selectionModeDisplayType === next.selectionModeDisplayType &&
    prev.workflowId === next.workflowId &&
    prev.pomLayoutHint === next.pomLayoutHint
  );
};

export const ExecutionResultItem = React.memo(ExecutionResultItemComponent, areEqual);
