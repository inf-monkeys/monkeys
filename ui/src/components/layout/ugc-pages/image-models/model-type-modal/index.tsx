import React, { useState } from 'react';

import { Ellipsis, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useComfyuiModelTypes } from '@/apis/comfyui-model';
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

  const [open, setOpen] = useState(false);
  const { data, mutate } = useComfyuiModelTypes();

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
        <DialogFooter>
          <CreateTypeModal mutate={mutate}>
            <Button variant="outline" size="small" icon={<Plus />}>
              {t('common.utils.create')}
            </Button>
          </CreateTypeModal>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
