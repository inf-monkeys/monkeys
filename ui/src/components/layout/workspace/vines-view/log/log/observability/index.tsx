import React, { useState } from 'react';

import { Ellipsis, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useWorkflowObservability } from '@/apis/workflow/observability';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.tsx';
import { useVinesFlow } from '@/package/vines-flow';

import { CreateModal } from './create-modal';
import { WorkflowObservabilityOperateDropdown } from './operate-dropdown';

interface IVinesLogViewLogObservabilityModalProps {
  children?: React.ReactNode;
}

export const VinesLogViewLogObservabilityModal: React.FC<IVinesLogViewLogObservabilityModalProps> = ({ children }) => {
  const { t } = useTranslation();

  const { vines } = useVinesFlow();

  const [open, setOpen] = useState(false);

  const { data, mutate } = useWorkflowObservability(vines.workflowId);

  const [isLoading, setIsLoading] = useState(false);

  const rows = [
    // {
    //   displayName: t('workspace.logs-view.observability.table.columns.id'),
    //   key: 'id',
    // },
    {
      displayName: t('workspace.logs-view.observability.table.columns.name'),
      key: 'name',
    },
    {
      displayName: t('workspace.logs-view.observability.table.columns.platform'),
      key: 'platform',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t('workspace.logs-view.observability.title')}</DialogTitle>
        </DialogHeader>
        <Table className="w-full">
          <TableCaption>{t('common.load.no-more')}</TableCaption>
          <TableHeader>
            <TableRow>{rows?.map(({ displayName }, i) => <TableHead key={i}>{displayName}</TableHead>)}</TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((observability) => (
              <TableRow key={observability.id} className="table-row">
                {/* <TableCell className="sticky left-0 min-w-24 max-w-64 break-words bg-background">
                  {observability.id}
                </TableCell> */}
                <TableCell className="max-w-100 sticky left-1 min-w-24 break-words bg-background">
                  {observability.name || 'untitled'}
                </TableCell>
                <TableCell className="max-w-100 sticky left-1 min-w-24 break-words bg-background">
                  {observability.platform}
                </TableCell>
                <TableCell className="sticky right-0 min-w-16 max-w-64 bg-background">
                  <WorkflowObservabilityOperateDropdown
                    item={observability}
                    trigger={<Button variant="outline" icon={<Ellipsis />} />}
                    tooltipTriggerContent={t('workspace.logs-view.observability.operate.dropdown-label')}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <DialogFooter className="flex w-full justify-between">
          <div className="flex gap-3"></div>
          <div className="flex-1" />
          <div>
            <CreateModal>
              <Button variant="outline" size="small" icon={<Plus />} loading={isLoading}>
                {t('common.utils.create')}
              </Button>
            </CreateModal>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
