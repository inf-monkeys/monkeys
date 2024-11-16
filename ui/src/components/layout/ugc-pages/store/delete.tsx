import React from 'react';

import { useMemoizedFn } from 'ahooks';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { deleteApplicationOnStore } from '@/apis/application-store';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface IDeleteAppProps {
  id: string;
  mutate: () => void;
}

export const DeleteApp: React.FC<IDeleteAppProps> = ({ id, mutate }) => {
  const { t } = useTranslation();

  const handleDeleteApplicationOnStore = useMemoizedFn((id: string) => {
    return toast.promise(deleteApplicationOnStore(id, 'workflow'), {
      loading: t('common.delete.loading'),
      success: () => {
        void mutate();
        return t('common.delete.success');
      },
      error: t('common.delete.error'),
    });
  });

  return (
    <AlertDialog>
      <Tooltip>
        <AlertDialogTrigger asChild>
          <TooltipTrigger asChild>
            <Button size="small" className="[&>div>svg]:stroke-red-10" icon={<Trash2 />} variant="outline" />
          </TooltipTrigger>
        </AlertDialogTrigger>
        <TooltipContent>{t('components.layout.ugc.import-dialog.delete.label')}</TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('components.layout.ugc.import-dialog.delete.label')}</AlertDialogTitle>
          <AlertDialogDescription>{t('components.layout.ugc.import-dialog.delete.desc')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.utils.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={() => handleDeleteApplicationOnStore(id)}>
            {t('common.utils.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
