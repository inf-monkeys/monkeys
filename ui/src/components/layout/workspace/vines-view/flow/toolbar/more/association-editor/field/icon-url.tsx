import React, { useState } from 'react';

import { EditIcon } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { VinesIconSelector } from '@/components/ui/icon-selector';
import { VinesLucideIcon } from '@/components/ui/vines-icon/lucide';
import { IWorkflowAssociationForEditor } from '@/schema/workspace/workflow-association';

interface IFieldIconUrlProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<IWorkflowAssociationForEditor>;
}

export const FieldIconUrl: React.FC<IFieldIconUrlProps> = ({ form }) => {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);

  // 图标选择处理
  const handleIconSelect = (icon?: string) => {
    form.setValue('iconUrl', icon || '');
    setDialogOpen(false);
  };

  const currentIconUrl = form.watch('iconUrl');

  return (
    <FormField
      name="iconUrl"
      control={form.control}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('workspace.flow-view.tooltip.more.association-editor.editor.field.icon-url.label')}</FormLabel>
          <FormControl>
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-lg border border-input bg-background">
                <VinesLucideIcon src={currentIconUrl ?? 'link'} />
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <EditIcon size={16} />
                    {t('workspace.flow-view.tooltip.more.association-editor.editor.field.icon-url.select-icon')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogTitle>
                    {t('workspace.flow-view.tooltip.more.association-editor.editor.field.icon-url.dialog-title')}
                  </DialogTitle>
                  <VinesIconSelector onIconSelect={handleIconSelect} />
                </DialogContent>
              </Dialog>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
