import React from 'react';

import { EditIcon } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { LANGUAGES_LIST } from '@/components/ui/i18n-selector/consts';
import { Input } from '@/components/ui/input';
import { IWorkflowInput } from '@/schema/workspace/workflow-input.ts';

interface IFieldDisplayNameProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<IWorkflowInput>;
}

export const FieldDisplayName: React.FC<IFieldDisplayNameProps> = ({ form }) => {
  const { t } = useTranslation();

  return (
    <FormField
      name="displayName"
      control={form.control}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('workspace.flow-view.endpoint.start-tool.input.config-form.display-name.label')}</FormLabel>
          <FormControl>
            <>
              <Input
                placeholder={t('workspace.flow-view.endpoint.start-tool.input.config-form.display-name.placeholder')}
                {...field}
                className="grow"
                autoFocus
              />
              <Dialog>
                <DialogTrigger asChild>
                  <Button icon={<EditIcon />} variant="outline" size="icon" className="absolute right-2 top-2" />
                </DialogTrigger>
                <DialogContent>
                  <DialogTitle>Edit i18n Name</DialogTitle>
                  {LANGUAGES_LIST.map(([key, label]) => (
                    <div key={key} className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-gray-11" htmlFor={`i18n-input-${key}`}>
                        {label}
                      </label>
                      <Input
                        id={`i18n-input-${key}`}
                        placeholder={t(
                          'workspace.flow-view.endpoint.start-tool.input.config-form.display-name.placeholder',
                        )}
                        // {...field}
                        className="grow"
                      />
                    </div>
                  ))}
                  <DialogFooter>
                    <Button>Save</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
