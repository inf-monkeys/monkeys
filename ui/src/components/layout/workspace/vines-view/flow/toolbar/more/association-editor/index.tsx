import React, { ReactNode } from 'react';

import { Plus } from 'lucide-react';

import { useWorkflowAssociationList } from '@/apis/workflow/association';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useFlowStore } from '@/store/useFlowStore';

import { WorkflowAssociationEditor } from './editor';
import { WorkflowAssociationEditorItem } from './item';

interface IWorkflowAssociationEditorProps {
  children?: ReactNode;
}

export const WorkflowAssociationEditorDialog: React.FC<IWorkflowAssociationEditorProps> = ({ children }) => {
  const { workflowId } = useFlowStore();

  const { data, mutate } = useWorkflowAssociationList(workflowId);

  return (
    <>
      <Dialog>
        <DialogContent className="flex h-[36rem] flex-col">
          <DialogTitle>关联编辑器</DialogTitle>
          <div className="flex h-full flex-col gap-2">
            {(data ?? []).map((item) => (
              <WorkflowAssociationEditorItem key={item.id} data={item} mutate={mutate} />
            ))}
            <Button variant="outline" icon={<Plus />}>
              新建关联
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
