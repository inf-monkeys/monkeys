import React from 'react';

import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { VinesImageMaskEditor } from '@/components/ui/image-mask-editor';
import { Label } from '@/components/ui/label.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Switch } from '@/components/ui/switch';
import { Updater } from '@/components/ui/updater';
import { IWorkflowInput } from '@/schema/workspace/workflow-input.ts';
import { useFlowStore } from '@/store/useFlowStore';

interface IFieldFileProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<IWorkflowInput>;
}

export const FieldFile: React.FC<IFieldFileProps> = ({ form }) => {
  const { t } = useTranslation();

  const { isLatestWorkflowVersion } = useFlowStore();

  const { multipleValues } = form.getValues();
  const enableImageMask = form.watch('enableImageMask');

  return (
    isLatestWorkflowVersion && (
      <>
        <Separator orientation="vertical" className="mx-2" />
        <div className="flex w-[40rem] flex-col gap-4">
          {!multipleValues && (
            <FormField
              name="enableImageMask"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex w-full items-center justify-between">
                  <FormLabel>
                    {t(
                      'workspace.flow-view.endpoint.start-tool.input.config-form.type-options.enable-image-mask.label',
                    )}
                  </FormLabel>
                  <div className="flex-grow" />
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {enableImageMask ? (
            <>
              <div className="flex items-center justify-between">
                <Label>
                  {t('workspace.flow-view.endpoint.start-tool.input.config-form.file.label', { extra: '' })}
                </Label>
                <VinesImageMaskEditor onFinished={(urls) => form.setValue('default', urls[0])}>
                  <Button variant="outline" size="small" className="-mr-1 scale-90">
                    {t('workspace.pre-view.actuator.execution-form.file.click-to-open-in-image-mask-editor-and-upload')}
                  </Button>
                </VinesImageMaskEditor>
              </div>
              <FormField
                name="default"
                control={form.control}
                render={({ field: { value } }) => (
                  <img
                    src={value?.toString()}
                    alt="image"
                    className="max-w-96 rounded-md border border-input bg-background object-cover shadow-md"
                  />
                )}
              />
            </>
          ) : (
            <>
              <Label>
                {t('workspace.flow-view.endpoint.start-tool.input.config-form.file.label', {
                  extra: multipleValues ? t('workspace.flow-view.endpoint.start-tool.input.config-form.file.list') : '',
                })}
              </Label>
              <Updater
                limit={multipleValues ? void 0 : 1}
                onFinished={(urls) => form.setValue('default', multipleValues ? urls : urls[0])}
                basePath="user-files/workflow-input"
              />
              <p className="text-xs text-muted-foreground">
                {t('workspace.flow-view.endpoint.start-tool.input.config-form.file.desc')}
              </p>
            </>
          )}
        </div>
      </>
    )
  );
};
