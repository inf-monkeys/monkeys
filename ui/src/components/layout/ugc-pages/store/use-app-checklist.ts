import { useEffect, useState } from 'react';

import { MonkeyWorkflow } from '@inf-monkeys/monkeys';
import { useAsyncEffect } from 'ahooks';
import { isArray } from 'lodash';
import { useTranslation } from 'react-i18next';

import { getComfyUIStoreList, getComfyUIWorkflowList } from '@/apis/comfyui';
import { getToolList } from '@/apis/tools';
import { getWorkflowList } from '@/apis/workflow';
import { VinesCore } from '@/package/vines-flow/core';
import { getI18nContent } from '@/utils';

export const useAppChecklist = (enable = false, workflow?: MonkeyWorkflow) => {
  const { t, i18n } = useTranslation();

  const [pinnedViews, setPinnedViews] = useState<string[]>([]);
  const [unpinnedViews, setUnpinnedViews] = useState<string[]>([]);
  useEffect(() => {
    if (!enable) return;
    if (workflow?.exposeOpenaiCompatibleInterface) {
      setPinnedViews([t('workspace.wrapper.space.tabs.对话视图')]);
      setUnpinnedViews([
        t('workspace.wrapper.space.tabs.预览视图'),
        t('workspace.wrapper.space.tabs.流程视图'),
        t('workspace.wrapper.space.tabs.日志视图'),
      ]);
    } else {
      setPinnedViews([t('workspace.wrapper.space.tabs.预览视图')]);
      setUnpinnedViews([
        t('workspace.wrapper.space.tabs.对话视图'),
        t('workspace.wrapper.space.tabs.流程视图'),
        t('workspace.wrapper.space.tabs.日志视图'),
      ]);
    }
  }, [enable, workflow]);

  const [isLoading, setIsLoading] = useState(false);
  const [addedTools, setAddedTools] = useState<string[]>([]);
  const [pendingTools, setPendingTools] = useState<string[]>([]);
  useAsyncEffect(async () => {
    if (!enable) return;
    setIsLoading(true);

    // region 初始化 VinesFlow
    const vinesCore = new VinesCore(i18n);

    const tools = await getToolList();
    if (isArray(tools)) {
      vinesCore.updateTools(tools);
    }

    const workflows = await getWorkflowList({ page: 1, limit: 9999 });
    if (isArray(workflows)) {
      vinesCore.updateWorkflows(workflows);
    }

    const comfyUIWorkflows = await getComfyUIWorkflowList({ page: 1, limit: 9999 });
    await vinesCore.updateComfyUIWorkflows(isArray(comfyUIWorkflows) ? comfyUIWorkflows : []);

    vinesCore.update({ workflow });
    // endregion

    const originalNodes = vinesCore.getAllNodes();
    const nodes = originalNodes.slice(1, originalNodes.length - 1);

    const toolNamesWithNodes: string[] = [];
    const pendingToolsWithNodes: string[] = [];

    const comfyUIStore = await getComfyUIStoreList({ page: 1, limit: 9999 });
    for (const { id, _task } of nodes) {
      const name = id.substring(0, id.lastIndexOf('_'));
      const toolName = getI18nContent(vinesCore.getTool(name)?.displayName) ?? name;

      if (name === 'comfyui:run_comfyui_workflow') {
        const comfyUIWorkflowId = _task?.['inputParameters']?.workflow;

        const addedComfyUIWorkflow = comfyUIWorkflows?.find((it) => it.id === comfyUIWorkflowId);
        if (addedComfyUIWorkflow) {
          const finalName = getI18nContent(addedComfyUIWorkflow.displayName);
          toolNamesWithNodes.push(toolName + (finalName ? `「${finalName}」` : ''));
          continue;
        } else {
          const storeComfyUIWorkflow = comfyUIStore?.find((it) => it.id === comfyUIWorkflowId);
          if (storeComfyUIWorkflow) {
            const finalName = getI18nContent(storeComfyUIWorkflow.displayName);
            pendingToolsWithNodes.push(toolName + (finalName ? `「${finalName}」` : ''));
            continue;
          }
        }
      }

      toolNamesWithNodes.push(toolName);
    }

    setAddedTools(Array.from(new Set(toolNamesWithNodes)));
    setPendingTools(Array.from(new Set(pendingToolsWithNodes)));

    setIsLoading(false);
  }, [enable]);

  return {
    pinnedViews,
    unpinnedViews,

    isLoading,
    addedTools,
    pendingTools,
  };
};
