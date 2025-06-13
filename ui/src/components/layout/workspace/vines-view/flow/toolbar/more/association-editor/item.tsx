import React from 'react';

import { Edit, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { deleteWorkflowAssociation } from '@/apis/workflow/association';
import { IWorkflowAssociation } from '@/apis/workflow/association/typings';
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
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tag } from '@/components/ui/tag';
import { VinesLucideIcon } from '@/components/ui/vines-icon/lucide';
import { cn, getI18nContent } from '@/utils';
import VinesEvent from '@/utils/events';

interface IWorkflowAssociationEditorItemProps {
  data: IWorkflowAssociation;
  classNames?: string;
  mutate?: () => void;
}

export const WorkflowAssociationEditorItem: React.FC<IWorkflowAssociationEditorItemProps> = ({
  data,
  classNames,
  mutate,
}) => {
  const { t } = useTranslation();

  const handleRemoveAssociation = () => {
    toast.promise(deleteWorkflowAssociation(data.originWorkflowId, data.id), {
      loading: t('common.delete.loading'),
      error: t('common.delete.error'),
      success: () => {
        mutate?.();
        return t('common.delete.success');
      },
    });
  };

  return (
    <Card className={cn('mb-0.5 flex flex-col gap-2 p-4', classNames)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <VinesLucideIcon src={data.iconUrl ?? 'tools'} />
          <h1 className="font-bold">{getI18nContent(data.displayName)}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Tag className="bg-muted">
            {data.enabled
              ? t('workspace.flow-view.tooltip.more.association-editor.enabled.t')
              : t('workspace.flow-view.tooltip.more.association-editor.enabled.f')}
          </Tag>
          <Button
            icon={<Edit />}
            variant="outline"
            className="scale-80"
            onClick={() => {
              VinesEvent.emit('flow-association-editor', data, 'update');
            }}
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button icon={<Trash2 />} variant="outline" className={cn('scale-80 [&_svg]:stroke-red-10')} />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t('workspace.flow-view.tooltip.more.association-editor.delete.title')}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t('workspace.flow-view.tooltip.more.association-editor.delete.desc')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.utils.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleRemoveAssociation}>{t('common.utils.delete')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <Separator />
      <div className="break-word flex flex-col gap-2 px-2 text-xs">
        <span className="line-clamp-4">{getI18nContent(data.description)}</span>
      </div>
    </Card>
  );
};
