import React from 'react';

import { isBoolean } from 'lodash';
import { Edit, LayoutPanelLeft, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { InputEditor } from '@/components/layout/workspace/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/input-editor';
import { WorkflowInputList } from '@/components/layout/workspace/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/input-list';
import { InputWidgets } from '@/components/layout/workspace/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/input-widgets';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog.tsx';
import { Button } from '@/components/ui/button';
import { useVinesFlow } from '@/package/vines-flow';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useFlowStore } from '@/store/useFlowStore';
import { cloneDeep, cn } from '@/utils';
import VinesEvent from '@/utils/events.ts';

interface IInputConfigProps {
  className?: string;
  contentWidth?: number;
}

export const InputConfig: React.FC<IInputConfigProps> = ({ className, contentWidth }) => {
  const { t } = useTranslation();

  const isLatestWorkflowVersion = useFlowStore((s) => s.isLatestWorkflowVersion);
  const isWorkflowReadOnly = useCanvasStore((s) => s.isWorkflowReadOnly);

  const { vines } = useVinesFlow();
  const workflowId = vines.workflowId;

  const inputs = vines.workflowInput.map((it) =>
    isBoolean(it.default) ? { ...it, default: it.default.toString() } : it,
  );

  const handleRemoveInput = (variableId: string) => {
    const newInputs = cloneDeep(inputs);
    const index = newInputs.findIndex((it) => it.name === variableId);
    if (index !== -1) {
      newInputs.splice(index, 1);
    }
    vines.update({ variables: newInputs });
  };

  const disabled = !isLatestWorkflowVersion || isWorkflowReadOnly;

  return (
    <div className={cn('relative flex h-[30rem] w-full flex-col gap-4 py-2', className)}>
      <WorkflowInputList
        inputs={inputs}
        className="px-2"
        contentWidth={contentWidth}
        defaultValueText={t('workspace.flow-view.endpoint.start-tool.input.def')}
      >
        {(variableId, specialType) => (
          <div className="flex items-center gap-1">
            {!disabled && (
              <Button
                icon={<Edit />}
                variant="outline"
                className="scale-80"
                disabled={disabled}
                onClick={() =>
                  VinesEvent.emit(specialType ? 'flow-input-widgets' : 'flow-input-editor', workflowId, variableId)
                }
              />
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  icon={<Trash2 />}
                  variant="outline"
                  className={cn('scale-80 [&_svg]:stroke-red-10', disabled && 'hidden')}
                />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('workspace.flow-view.endpoint.start-tool.input.delete.title')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('workspace.flow-view.endpoint.start-tool.input.delete.desc')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {t('workspace.flow-view.endpoint.start-tool.input.delete.cancel')}
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleRemoveInput(variableId)}>
                    {t('workspace.flow-view.endpoint.start-tool.input.delete.action')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </WorkflowInputList>
      <div className={cn('grid grid-cols-3 gap-2', disabled && 'hidden')}>
        <Button
          className="col-span-2"
          variant="outline"
          icon={<Plus />}
          onClick={() => VinesEvent.emit('flow-input-editor', workflowId)}
        >
          {t('workspace.flow-view.endpoint.start-tool.input.add')}
        </Button>
        <Button
          icon={<LayoutPanelLeft />}
          variant="outline"
          disabled
          onClick={() => VinesEvent.emit('flow-input-widgets', workflowId)}
        >
          小组件
        </Button>
      </div>
      <InputEditor />
      <InputWidgets />
    </div>
  );
};
