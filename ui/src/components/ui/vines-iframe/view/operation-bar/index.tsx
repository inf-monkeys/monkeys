import React, { useEffect, useMemo } from 'react';

import useSWR from 'swr';

import type { MonkeyWorkflow } from '@inf-monkeys/monkeys';
import { get } from 'lodash';

import { useSystemConfig } from '@/apis/common';
import { ISystemConfig } from '@/apis/common/typings';
import { getWorkflow } from '@/apis/workflow';
import { useWorkflowAssociationList } from '@/apis/workflow/association';
import { IWorkflowAssociation } from '@/apis/workflow/association/typings';
import useUrlState from '@/hooks/use-url-state';
import { useFlowStore } from '@/store/useFlowStore';
import { useOutputSelectionStore } from '@/store/useOutputSelectionStore';

import { CommonOperationBar } from '../common-operation-bar';
import { isAssociationCompatibleWithSelection } from './compat';
import { OperationItem } from './item';

interface IWorkbenchOperationBarProps extends React.ComponentPropsWithoutRef<'div'> {
  onDataChange?: (data: IWorkflowAssociation[]) => void;
}

export const WorkbenchOperationBar: React.FC<IWorkbenchOperationBarProps> = ({ onDataChange }) => {
  const { workflowId } = useFlowStore();
  const { selectedOutputItems } = useOutputSelectionStore();

  const [{ mode }] = useUrlState<{ mode: 'normal' | 'fast' | 'mini' }>({ mode: 'normal' });

  const { data: oem } = useSystemConfig();

  const density = oem?.theme.density ?? 'default';

  const themeMode = get(oem, 'theme.themeMode', 'border') as ISystemConfig['theme']['themeMode'];

  const { data: initialData } = useWorkflowAssociationList(workflowId);

  const enabledData = useMemo(
    () =>
      initialData
        ?.filter((it) => it.enabled)
        .sort((a, b) => {
          if (a.type === 'new-design' && b.type !== 'new-design') {
            return -1;
          }
          if (a.type !== 'new-design' && b.type === 'new-design') {
            return 1;
          }
          const aSortIndex = a.sortIndex ?? 0;
          const bSortIndex = b.sortIndex ?? 0;
          return aSortIndex - bSortIndex;
        }) ?? [],
    [initialData],
  );

  const targetWorkflowIds = useMemo(() => {
    const ids =
      enabledData
        .filter((it): it is Extract<IWorkflowAssociation, { type: 'to-workflow' }> => it.type === 'to-workflow')
        .map((it) => it.targetWorkflowId)
        .filter(Boolean) ?? [];
    return Array.from(new Set(ids)).sort();
  }, [enabledData]);

  const { data: targetWorkflows } = useSWR<MonkeyWorkflow[]>(
    targetWorkflowIds.length ? ['operation-bar-target-workflows', ...targetWorkflowIds] : null,
    async () => Promise.all(targetWorkflowIds.map((id) => getWorkflow(id))),
  );

  const targetWorkflowMap = useMemo(() => {
    return new Map<string, MonkeyWorkflow>((targetWorkflows ?? []).map((wf) => [wf.workflowId, wf]));
  }, [targetWorkflows]);

  const filteredData = useMemo(() => {
    if (!selectedOutputItems.length) return enabledData;
    return enabledData.filter((association) => {
      const targetWorkflow =
        association.type === 'to-workflow' ? targetWorkflowMap.get(association.targetWorkflowId) : undefined;
      return isAssociationCompatibleWithSelection({ association, selectedItems: selectedOutputItems, targetWorkflow });
    });
  }, [enabledData, selectedOutputItems, targetWorkflowMap]);

  useEffect(() => {
    onDataChange?.(enabledData);
  }, [enabledData, onDataChange]);

  return (
    <CommonOperationBar
      data={filteredData}
      mode={mode}
      density={density}
      themeMode={themeMode}
      tipButtonProps={{ mode, density, type: 'form-view' }}
      renderItem={(item, { expanded }) => <OperationItem data={item} expanded={expanded} />}
    />
  );
};
