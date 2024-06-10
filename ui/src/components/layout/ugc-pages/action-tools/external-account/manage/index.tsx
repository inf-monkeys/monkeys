import React from 'react';

import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { deleteCredential, useCredentials } from '@/apis/credential';
import { IVinesCredentialType } from '@/apis/credential/typings.ts';
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
import { DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.tsx';

interface IExternalAccountManageProps {
  detail: IVinesCredentialType | null;
}

export const ExternalAccountManage: React.FC<IExternalAccountManageProps> = ({ detail }) => {
  const { t } = useTranslation();

  const { data: credentials, mutate } = useCredentials(detail?.name);

  const rows = detail?.properties?.filter((p) => p.type !== 'notice');

  const handleDelete = (id: string) => {
    toast.promise(deleteCredential(id), {
      loading: t('common.delete.loading'),
      success: t('common.delete.success'),
      error: t('common.delete.error'),
      finally: () => void mutate(),
    });
  };

  return (
    <>
      <DialogTitle>{detail?.displayName}</DialogTitle>
      <DialogDescription>
        {t('ugc-page.action-tools.ugc-view.subtitle.external-account.manage.content')}
      </DialogDescription>
      <div className="relative w-full overflow-auto">
        <Table className="w-full">
          <TableCaption>{t('common.load.no-more')}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-background">
                {t('ugc-page.action-tools.ugc-view.subtitle.external-account.manage.columns.name')}
              </TableHead>
              <TableHead className="sticky right-0 bg-background">
                {t('ugc-page.action-tools.ugc-view.subtitle.external-account.manage.columns.operate')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {credentials?.map(({ displayName, id }, i) => (
              <TableRow key={i} className="table-row">
                <TableCell className="sticky left-0 w-full min-w-24 max-w-64 break-words bg-background">
                  {displayName}
                </TableCell>
                <TableCell className="sticky right-0 w-full min-w-16 max-w-64 bg-background">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button icon={<Trash2 />} variant="outline" size="small" />
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
                        <AlertDialogAction onClick={() => id && handleDelete(id)}>
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
      </div>
    </>
  );
};
