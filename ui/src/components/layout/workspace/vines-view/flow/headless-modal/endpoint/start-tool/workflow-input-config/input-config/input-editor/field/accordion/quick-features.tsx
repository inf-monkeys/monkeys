import React from 'react';

import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Switch } from '@/components/ui/switch';
import { IWorkflowInput } from '@/schema/workspace/workflow-input.ts';

interface IFieldQuickFeaturesProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<IWorkflowInput>;
}

export const FieldQuickFeatures: React.FC<IFieldQuickFeaturesProps> = ({ form }) => {
  const { t } = useTranslation();

  return (
    <>
      <FormField
        name="enableVoice"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <div className="-mb-2 flex items-center justify-between py-2">
              <FormLabel>
                {t('workspace.flow-view.endpoint.start-tool.input.config-form.type-options.voice.label')}
              </FormLabel>
              <FormControl>
                <Switch size="small" checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </div>
            <FormDescription>
              {t('workspace.flow-view.endpoint.start-tool.input.config-form.type-options.voice.desc')}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        name="enableExpand"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <div className="-mb-2 flex items-center justify-between py-2">
              <FormLabel>
                {t('workspace.flow-view.endpoint.start-tool.input.config-form.type-options.expand.label')}
              </FormLabel>
              <FormControl>
                <Switch size="small" checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </div>
            <FormDescription>
              {t('workspace.flow-view.endpoint.start-tool.input.config-form.type-options.expand.desc')}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

