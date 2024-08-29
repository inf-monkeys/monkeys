import React, { useState } from 'react';

import { Check, Ellipsis, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useComfyuiServers } from '@/apis/comfyui';
import { ImportComfyUIServerModal } from '@/components/layout/ugc-pages/comfyui/comfyui-server-list/import-comfyui-server';
import { ComfyuiServerListOperateDropdown } from '@/components/layout/ugc-pages/comfyui/comfyui-server-list/operate-dropdown';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.tsx';

interface IImportToolModalProps {
  children?: React.ReactNode;
}

export const ComfyUIServerListModal: React.FC<IImportToolModalProps> = ({ children }) => {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const { data, mutate } = useComfyuiServers();

  const rows = [
    {
      displayName: t('comfyui.comfyui-server.table.columns.address.label'),
      key: 'address',
    },
    {
      displayName: t('comfyui.comfyui-server.table.columns.description.label'),
      key: 'description',
    },
    {
      displayName: t('comfyui.comfyui-server.table.columns.status.label'),
      key: 'status',
    },
    {
      displayName: t('comfyui.comfyui-server.table.columns.is-default.label'),
      key: 'isDefault',
    },
    {
      displayName: t('comfyui.comfyui-server.table.columns.operate.label'),
      key: 'operate',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t('comfyui.comfyui-server.title')}</DialogTitle>
        </DialogHeader>
        <Table className="w-full">
          <TableCaption>{t('common.load.no-more')}</TableCaption>
          <TableHeader>
            <TableRow>{rows?.map(({ displayName }, i) => <TableHead key={i}>{displayName}</TableHead>)}</TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((server, i) => (
              <TableRow key={i} className="table-row">
                <TableCell className="sticky left-0 min-w-24 max-w-64 break-words bg-background">
                  {server.address}
                </TableCell>
                <TableCell className="max-w-100 sticky left-1 min-w-24 break-words bg-background">
                  {server.description}
                </TableCell>
                <TableCell className="max-w-100 sticky left-1 min-w-24 break-words bg-background">
                  {server.status}
                </TableCell>
                <TableCell className="max-w-100 sticky left-1 min-w-24 break-words bg-background">
                  {server.isDefault && <Check />}
                </TableCell>
                <TableCell className="sticky right-0 min-w-16 max-w-64 bg-background">
                  <ComfyuiServerListOperateDropdown
                    item={server}
                    trigger={<Button variant="outline" icon={<Ellipsis />} />}
                    tooltipTriggerContent={t('comfyui.comfyui-server.table.columns.operate.label')}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <DialogFooter>
          <ImportComfyUIServerModal mutate={mutate}>
            <Button variant="outline" size="small" icon={<Plus />}>
              {t('common.utils.add')}
            </Button>
          </ImportComfyUIServerModal>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
