import React, { useState } from 'react';

import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { deleteComfyuiServer, useComfyuiServers } from '@/apis/comfyui';
import { ImportComfyUIServerModal } from '@/components/layout/ugc-pages/tools/comfyui-server-list/import-comfyui-server';
import { AlertDialog } from '@/components/ui/alert-dialog.tsx';
import {
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.tsx';

interface IImportToolModalProps {
  children?: React.ReactNode;
}

export const ComfyUIServerListModal: React.FC<IImportToolModalProps> = ({ children }) => {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const { data } = useComfyuiServers();

  const rows = [
    {
      displayName: t('ugc-page.tools.import.comfyui-server.table.columns.address.label'),
      key: 'address',
    },
    {
      displayName: t('ugc-page.tools.import.comfyui-server.table.columns.description.label'),
      key: 'description',
    },
  ];

  const handleDelete = async (address: string) => {
    toast.promise(deleteComfyuiServer(address), {
      loading: t('common.operate.loading'),
      success: () => {
        setOpen(false);
        return t('common.operate.success');
      },
      error: t('common.operate.error'),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('ugc-page.tools.import.comfyui-server.title')}</DialogTitle>
        </DialogHeader>
        <Table className="w-full">
          <TableCaption>{t('common.load.no-more')}</TableCaption>
          <TableHeader>
            <TableRow>
              {rows?.map(({ displayName }, i) => <TableHead key={i}>{displayName}</TableHead>)}
              <TableHead className="sticky right-0 bg-background">
                {t('ugc-page.action-tools.ugc-view.subtitle.external-account.manage.columns.operate')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map(({ address, description, isDefault }, i) => (
              <TableRow key={i} className="table-row">
                <TableCell className="sticky left-0 min-w-24 max-w-64 break-words bg-background">{address}</TableCell>
                <TableCell className="max-w-100 sticky left-1 min-w-24 break-words bg-background">
                  {description}
                </TableCell>
                <TableCell className="sticky right-0 min-w-16 max-w-64 bg-background">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button icon={<Trash2 />} variant="outline" size="small" disabled={isDefault} />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t('ugc-page.action-tools.ugc-view.subtitle.external-account.manage.delete.title')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('ugc-page.action-tools.ugc-view.subtitle.external-account.manage.delete.content')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.utils.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(address)}>
                          {t('common.utils.confirm')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <DialogFooter>
          <ImportComfyUIServerModal>
            <Button variant="outline" size="small" icon={<Plus />}>
              {t('common.utils.add')}
            </Button>
          </ImportComfyUIServerModal>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
