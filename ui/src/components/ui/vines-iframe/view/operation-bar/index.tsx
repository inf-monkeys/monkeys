import React, { useEffect, useMemo } from 'react';

import { get } from 'lodash';

import { useSystemConfig } from '@/apis/common';
import { ISystemConfig } from '@/apis/common/typings';
import { useWorkflowAssociationList } from '@/apis/workflow/association';
import { IWorkflowAssociation } from '@/apis/workflow/association/typings';
import useUrlState from '@/hooks/use-url-state';
import { useFlowStore } from '@/store/useFlowStore';

import { CommonOperationBar } from '../common-operation-bar';
import { OperationItem } from './item';

interface IWorkbenchOperationBarProps extends React.ComponentPropsWithoutRef<'div'> {
  onDataChange?: (data: IWorkflowAssociation[]) => void;
}

export const WorkbenchOperationBar: React.FC<IWorkbenchOperationBarProps> = ({ onDataChange }) => {
  const { workflowId } = useFlowStore();

  const [{ mode }] = useUrlState<{ mode: 'normal' | 'fast' | 'mini' }>({ mode: 'normal' });

  const { data: oem } = useSystemConfig();

  const density = oem?.theme.density ?? 'default';

  const themeMode = get(oem, 'theme.themeMode', 'border') as ISystemConfig['theme']['themeMode'];

  const { data: initialData } = useWorkflowAssociationList(workflowId);

  const enabledData = useMemo(() => initialData?.filter((it) => it.enabled) ?? [], [initialData]);

  useEffect(() => {
    onDataChange?.(enabledData);
  }, [enabledData, onDataChange]);

  return (
    <CommonOperationBar
      data={enabledData}
      mode={mode}
      density={density}
      themeMode={themeMode}
      tipButtonProps={{ mode, density, type: 'form-view' }}
      renderItem={(item, { expanded }) => <OperationItem data={item} expanded={expanded} />}
    />
  );
};
