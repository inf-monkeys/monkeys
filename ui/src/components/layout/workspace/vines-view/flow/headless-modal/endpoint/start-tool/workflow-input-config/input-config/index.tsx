import React from 'react';

import { isBoolean } from 'lodash';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { InputEditor } from '@/components/layout/workspace/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/input-editor';
import { WorkflowInputList } from '@/components/layout/workspace/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/input-list';
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

  const { vines } = useVinesFlow();

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

  return (
    <div className={cn('relative flex h-[30rem] w-full flex-col gap-4 py-2', className)}>
      <WorkflowInputList
        inputs={inputs}
        className="px-2"
        contentWidth={contentWidth}
        defaultValueText={t('workspace.flow-view.endpoint.start-tool.input.def')}
      >
        {(variableId) => (
          <div className="flex items-center gap-1">
            <Button
              icon={<Edit />}
              variant="outline"
              className="scale-80"
              onClick={() => VinesEvent.emit('flow-input-editor', vines.workflowId, variableId)}
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  icon={<Trash2 />}
                  variant="outline"
                  className={cn('scale-80 [&_svg]:stroke-red-10', !isLatestWorkflowVersion && 'hidden')}
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
      <Button
        className={cn(!isLatestWorkflowVersion && 'hidden')}
        variant="outline"
        icon={<Plus />}
        onClick={() => VinesEvent.emit('flow-input-editor', vines.workflowId)}
      >
        {t('workspace.flow-view.endpoint.start-tool.input.add')}
      </Button>
      <InputEditor />
    </div>
  );
};
