import React from 'react';

import { Link, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useWorkflowAssociationList } from '@/apis/workflow/association';
import { WorkflowAssociationEditor } from '@/components/layout/workspace/vines-view/flow/toolbar/more/association-editor/editor';
import { WorkflowAssociationEditorItem } from '@/components/layout/workspace/vines-view/flow/toolbar/more/association-editor/item';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import VinesEvent from '@/utils/events';

import { useGetUgcViewIconOnlyMode } from '../../util';

interface IGlobalWorkflowAssociationEditorProps {}

export const GlobalWorkflowAssociationEditorDialog: React.FC<IGlobalWorkflowAssociationEditorProps> = () => {
  const iconOnlyMode = useGetUgcViewIconOnlyMode();

  const { t } = useTranslation();

  const { data, mutate } = useWorkflowAssociationList('global');

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
        <DialogTrigger asChild>
          <Button variant="outline" size="small" icon={<Link />}>
            {iconOnlyMode ? null : '关联'}
          </Button>
        </DialogTrigger>
      </Dialog>
      <WorkflowAssociationEditor scope="global" />
    </>
  );
};
