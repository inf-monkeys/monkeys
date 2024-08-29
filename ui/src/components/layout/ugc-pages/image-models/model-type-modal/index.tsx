import React, { useState } from 'react';

import { mutate } from 'swr';

import { Ellipsis, HardDriveDownload, HardDriveUpload, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  updateComfyuiModelTypesFromInternals,
  updateComfyuiModelTypesToInternals,
  useComfyuiModelTypes,
} from '@/apis/comfyui-model';
import { CreateTypeModal } from '@/components/layout/ugc-pages/image-models/model-type-modal/create-type-modal';
import { ModelTypeOperateDropdown } from '@/components/layout/ugc-pages/image-models/model-type-modal/operate-dropdown';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.tsx';

interface IImageModelTypeModalProps {
  children?: React.ReactNode;
}

export const ImageModelTypeModal: React.FC<IImageModelTypeModalProps> = ({ children }) => {
  const { t } = useTranslation();

  const mutateComfyuiModelsAndTypes = () =>
    mutate((key) => typeof key === 'string' && key.startsWith('/api/comfyui-models'));

  const [open, setOpen] = useState(false);
  const { data } = useComfyuiModelTypes();

  const [isLoading, setIsLoading] = useState(false);

  const rows = [
    {
      displayName: t('comfyui.comfyui-model-type.table.columns.display-name.label'),
      key: 'displayName',
    },
    {
      displayName: t('comfyui.comfyui-model-type.table.columns.description.label'),
      key: 'description',
    },
    {
      displayName: t('comfyui.comfyui-model-type.table.columns.path.label'),
      key: 'path',
    },
    {
      displayName: t('comfyui.comfyui-model-type.table.columns.name.label'),
      key: 'name',
    },
    {
      displayName: t('comfyui.comfyui-model-type.table.columns.operate.label'),
      key: 'operate',
    },
  ];

  const handleUpdateToInternals = () => {
    setIsLoading(true);
    toast.promise(updateComfyuiModelTypesToInternals(), {
      loading: t('common.operate.loading'),
      success: (data) => {
        void mutateComfyuiModelsAndTypes();
        return t('comfyui.utils.toast.update-result', {
          ...data,
        });
      },
      error: t('common.operate.error'),
      finally: () => setIsLoading(false),
    });
  };

  const handleUpdateFromInternals = () => {
    setIsLoading(true);
    toast.promise(updateComfyuiModelTypesFromInternals(), {
      loading: t('common.operate.loading'),
      success: (data) => {
        void mutateComfyuiModelsAndTypes();
        return t('comfyui.utils.toast.update-result', {
          ...data,
        });
      },
      error: t('common.operate.error'),
      finally: () => setIsLoading(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t('comfyui.comfyui-model-type.title')}</DialogTitle>
        </DialogHeader>
        <Table className="w-full">
          <TableCaption>{t('common.load.no-more')}</TableCaption>
          <TableHeader>
            <TableRow>{rows?.map(({ displayName }, i) => <TableHead key={i}>{displayName}</TableHead>)}</TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((type, i) => (
              <TableRow key={i} className="table-row">
                <TableCell className="sticky left-0 min-w-24 max-w-64 break-words bg-background">
                  {type.displayName}
                </TableCell>
                <TableCell className="max-w-100 sticky left-1 min-w-24 break-words bg-background">
                  {type.description}
                </TableCell>
                <TableCell className="max-w-100 sticky left-1 min-w-24 break-words bg-background">
                  {type.path}
                </TableCell>
                <TableCell className="max-w-100 sticky left-1 min-w-24 break-words bg-background">
                  {type.name}
                </TableCell>
                <TableCell className="sticky right-0 min-w-16 max-w-64 bg-background">
                  <ModelTypeOperateDropdown
                    item={type}
                    trigger={<Button variant="outline" icon={<Ellipsis />} />}
                    tooltipTriggerContent={t('comfyui.comfyui-model-type.table.columns.operate.label')}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <DialogFooter className="flex w-full justify-between">
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="small"
              icon={<HardDriveDownload />}
              loading={isLoading}
              onClick={handleUpdateToInternals}
            >
              {t('comfyui.comfyui-model-type.update-to-internals')}
            </Button>
            <Button
              variant="outline"
              size="small"
              icon={<HardDriveUpload />}
              loading={isLoading}
              onClick={handleUpdateFromInternals}
            >
              {t('comfyui.comfyui-model-type.update-from-internals')}
            </Button>
          </div>
          <div className="flex-1" />
          <div>
            <CreateTypeModal mutate={mutate}>
              <Button variant="outline" size="small" icon={<Plus />} loading={isLoading}>
                {t('common.utils.create')}
              </Button>
            </CreateTypeModal>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
