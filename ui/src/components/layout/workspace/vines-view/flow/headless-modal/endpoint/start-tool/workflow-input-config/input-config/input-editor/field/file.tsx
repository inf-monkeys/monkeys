import React from 'react';

import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Card, CardContent } from '@/components/ui/card.tsx';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { VinesImageMaskPreview } from '@/components/ui/image-editor/mask/preview.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Switch } from '@/components/ui/switch';
import { VinesUploader } from '@/components/ui/vines-uploader';
import { IWorkflowInput } from '@/schema/workspace/workflow-input.ts';
import { useFlowStore } from '@/store/useFlowStore';

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
            <div className="flex w-[30rem] flex-col gap-4">
              <Label>{t('workspace.flow-view.endpoint.start-tool.input.config-form.file.label', { extra: '' })}</Label>
              <FormField
                name="default"
                control={form.control}
                render={({ field: { value } }) => (
                  <Card className="w-full overflow-hidden">
                    <CardContent className="relative p-2">
                      <VinesImageMaskPreview
                        src={value?.toString() ?? ''}
                        onFinished={(val) => form.setValue('default', val)}
                      />
                    </CardContent>
                  </Card>
                )}
              />
            </div>
          ) : (
            <div
              className="w-[38rem] space-y-2"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <Label>
                {t('workspace.flow-view.endpoint.start-tool.input.config-form.file.label', {
                  extra: multipleValues ? t('workspace.flow-view.endpoint.start-tool.input.config-form.file.list') : '',
                })}
              </Label>
              <VinesUploader
                className="rounded border border-input"
                files={(multipleValues ? form.getValues('default') : [form.getValues('default')]) as string[]}
                max={multipleValues ? void 0 : 1}
                onChange={(urls) => form.setValue('default', multipleValues ? urls : urls[0])}
                basePath="user-files/workflow-input"
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
