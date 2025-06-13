import React, { ReactNode } from 'react';

import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useWorkflowAssociationList } from '@/apis/workflow/association';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useFlowStore } from '@/store/useFlowStore';
import VinesEvent from '@/utils/events';

import { WorkflowAssociationEditor } from './editor';
import { WorkflowAssociationEditorItem } from './item';

interface IWorkflowAssociationEditorProps {
  children?: ReactNode;
}

export const WorkflowAssociationEditorDialog: React.FC<IWorkflowAssociationEditorProps> = ({ children }) => {
  const { workflowId } = useFlowStore();

  const { t } = useTranslation();

  const { data, mutate } = useWorkflowAssociationList(workflowId);

  return (
    <>
      <Dialog>
        <DialogContent className="flex h-[36rem] flex-col">
          <DialogTitle>{t('workspace.flow-view.tooltip.more.association-editor.title')}</DialogTitle>
          <div className="flex h-full flex-col gap-2">
            {(data ?? []).map((item) => (
              <WorkflowAssociationEditorItem key={item.id} data={item} mutate={mutate} />
            ))}
            <Button
              variant="outline"
              icon={<Plus />}
              onClick={() => {
                VinesEvent.emit('flow-association-editor', {}, 'create');
              }}
            >
              {t('workspace.flow-view.tooltip.more.association-editor.add')}
            </Button>
          </div>
          <DialogFooter></DialogFooter>
        </DialogContent>
        <DialogTrigger asChild>{children}</DialogTrigger>
      </Dialog>
      <WorkflowAssociationEditor />
    </>
  );
};
