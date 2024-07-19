import React from 'react';

import { RotateCcw } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { IWorkflowInput } from '@/schema/workspace/workflow-input.ts';
import { nanoIdLowerCase } from '@/utils';

interface IFieldNameProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<IWorkflowInput>;
}

export const FieldName: React.FC<IFieldNameProps> = ({ form }) => {
  const { t } = useTranslation();

  return (
    <FormField
      name="name"
      control={form.control}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('workspace.flow-view.endpoint.start-tool.input.config-form.name.label')}</FormLabel>
          <div className="relative flex items-center px-1">
            <FormControl>
              <Input
                placeholder={t('workspace.flow-view.endpoint.start-tool.input.config-form.name.placeholder')}
                {...field}
                className="grow"
              />
            </FormControl>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="absolute right-2 scale-75"
                  variant="outline"
                  icon={<RotateCcw />}
                  size="small"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.setValue('name', nanoIdLowerCase(6));
                  }}
                />
              </TooltipTrigger>
              <TooltipContent>
                {t('workspace.flow-view.endpoint.start-tool.input.config-form.name.reset')}
              </TooltipContent>
            </Tooltip>
          </div>
          <FormDescription>
            {t('workspace.flow-view.endpoint.start-tool.input.config-form.name.desc', {
              name: field.value,
            })}
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
