import React from 'react';

import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { VinesImageMaskEditor } from '@/components/ui/image-mask-editor';
import { Label } from '@/components/ui/label.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Switch } from '@/components/ui/switch';
import { Uploader } from 'src/components/ui/uploader';
import { IWorkflowInput } from '@/schema/workspace/workflow-input.ts';
import { useFlowStore } from '@/store/useFlowStore';
import { cn } from '@/utils';

interface IFieldFileProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<IWorkflowInput>;
}

export const FieldFile: React.FC<IFieldFileProps> = ({ form }) => {
  const { t } = useTranslation();

  const isLatestWorkflowVersion = useFlowStore((s) => s.isLatestWorkflowVersion);

  const { multipleValues } = form.getValues();
  const enableImageMask = form.watch('enableImageMask');

  return (
    isLatestWorkflowVersion && (
      <>
        <Separator orientation="vertical" className="mx-2" />
        <div className="space-y-2">
          {enableImageMask ? (
            <div className="flex w-96 flex-col gap-4">
              <Label>{t('workspace.flow-view.endpoint.start-tool.input.config-form.file.label', { extra: '' })}</Label>
              <FormField
                name="default"
                control={form.control}
                render={({ field: { value } }) => {
                  const src = value?.toString();
                  return (
                    <>
                      <ScrollArea className="h-52">
                        <img
                          src={src}
                          alt="image"
                          className={cn(
                            'max-w-96 rounded-md border border-input bg-background object-cover shadow-md',
                            !src && 'hidden',
                          )}
                        />
                      </ScrollArea>
                      <div className={cn('vines-center w-full', !src && 'rounded-md border border-input py-16')}>
                        <VinesImageMaskEditor onFinished={(urls) => form.setValue('default', urls[0])}>
                          <Button variant="outline" size="small" className="-mr-1 scale-90">
                            {t(
                              'workspace.pre-view.actuator.execution-form.file.click-to-open-in-image-mask-editor-and-upload',
                            )}
                          </Button>
                        </VinesImageMaskEditor>
                      </div>
                    </>
                  );
                }}
              />
            </div>
          ) : (
            <div className="w-[38rem] space-y-2">
              <Label>
                {t('workspace.flow-view.endpoint.start-tool.input.config-form.file.label', {
                  extra: multipleValues ? t('workspace.flow-view.endpoint.start-tool.input.config-form.file.list') : '',
                })}
              </Label>
              <Uploader
                limit={multipleValues ? void 0 : 1}
                onFinished={(urls) => form.setValue('default', multipleValues ? urls : urls[0])}
                basePath="user-files/workflow-input"
                mode="embed"
              />
              <p className="text-xs text-muted-foreground">
                {t('workspace.flow-view.endpoint.start-tool.input.config-form.file.desc')}
              </p>
            </div>
          )}

          {!multipleValues && (
            <FormField
              name="enableImageMask"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
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
        </div>
      </>
    )
  );
};
