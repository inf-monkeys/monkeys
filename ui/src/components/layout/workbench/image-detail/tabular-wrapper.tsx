import React, { useEffect } from 'react';

import { useEventEmitter } from 'ahooks';
import { useTranslation } from 'react-i18next';

import { useVinesFlow } from '@/package/vines-flow';
import { VinesWorkflowExecution } from '@/package/vines-flow/core/typings';

import { TabularRender, TTabularEvent } from '../../workspace/vines-view/form/tabular/render';

interface TabularRenderWrapperProps {
  height?: number;
  execution?: VinesWorkflowExecution;
  processedInputs: any[];
  showInputDiffBanner: boolean;
  originalInputValues: Record<string, any>;
  onProcessedInputsChange: (inputs: any[]) => void;
  onShowInputDiffBannerChange: (show: boolean) => void;
  onOriginalInputValuesChange: (values: Record<string, any>) => void;
}

// TabularRender包装组件，用于获取工作流输入参数
export const TabularRenderWrapper: React.FC<TabularRenderWrapperProps> = ({
  height,
  execution,
  processedInputs,
  showInputDiffBanner,
  originalInputValues,
  onProcessedInputsChange,
  onShowInputDiffBannerChange,
  onOriginalInputValuesChange,
}) => {
  const { vines } = useVinesFlow();
  const tabular$ = useEventEmitter<TTabularEvent>();
  const { t } = useTranslation();
  const [windowHeight, setWindowHeight] = React.useState(window.innerHeight);

  // 监听窗口大小变化
  React.useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 从vines中获取工作流输入参数
  const inputs = vines.workflowInput;
  const workflowId = vines.workflowId;

  // 计算动态高度，确保表单能够适应窗口高度
  const dynamicHeight = height || Math.max(1000, windowHeight - 150);

  // 处理输入字段和原始图片
  useEffect(() => {
    if (!inputs || inputs.length === 0) {
      // console.log('TabularRenderWrapper: 没有输入字段可用');
      onProcessedInputsChange([]);
      return;
    }

    const newInputs = execution
      ? inputs.map((input) => {
          return {
            ...input,
            default: execution.input?.[input.name] ?? input.default,
          };
        })
      : [];
    // console.log('TabularRenderWrapper: 表单输入字段:', newInputs);
    onProcessedInputsChange(newInputs);

    // 保存原始输入值
    if (execution?.input) {
      onOriginalInputValuesChange(execution.input);
    }
  }, [inputs, execution, onProcessedInputsChange, onOriginalInputValuesChange]);

  // 监听表单值变化
  useEffect(() => {
    if (!execution?.input || !processedInputs.length) return;

    const currentValues = processedInputs.reduce(
      (acc, input) => {
        acc[input.name] = input.default;
        return acc;
      },
      {} as Record<string, any>,
    );

    // 比较当前值与原始值
    const hasChanged = Object.keys(originalInputValues).some((key) => originalInputValues[key] !== currentValues[key]);

    onShowInputDiffBannerChange(hasChanged);
  }, [processedInputs, originalInputValues, execution, onShowInputDiffBannerChange]);

  if (!processedInputs.length) {
    return (
      <div className="vines-center size-full text-center text-xl text-muted-foreground">
        {t('workspace.image-detail.no-inputs', '无输入参数')}
      </div>
    );
  }

  return (
    <div className="relative size-full">
      {false && (
        <div className="left-0 right-0 top-0 z-10 mb-4 rounded bg-yellow-100 px-4 py-2 text-center text-sm text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          {t('workspace.image-detail.input-diff-banner', '输入参数已修改')}
        </div>
      )}
      <TabularRender
        inputs={processedInputs}
        height={dynamicHeight}
        event$={tabular$}
        workflowId={workflowId}
        scrollAreaClassName=""
      ></TabularRender>
    </div>
  );
};
