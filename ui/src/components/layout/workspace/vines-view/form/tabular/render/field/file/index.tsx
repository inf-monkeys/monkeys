import React from 'react';

import { isArray, isString } from 'lodash';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { VinesImageMaskPreview } from '@/components/ui/image-editor/mask/preview.tsx';
import { VinesUploader } from '@/components/ui/vines-uploader';
import useUrlState from '@/hooks/use-url-state.ts';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { IWorkflowInputForm } from '@/schema/workspace/workflow-input-form.ts';
import { cn } from '@/utils';

interface IFieldFileProps {
  input: VinesWorkflowVariable;
  form: UseFormReturn<IWorkflowInputForm>;
  value: any;

  miniMode?: boolean;
}

export const FieldFile: React.FC<IFieldFileProps> = ({
  value,
  input: { name, type, typeOptions },
  form,
  miniMode = false,
}) => {
  const { t } = useTranslation();

  const [{ mode }] = useUrlState<{ mode: 'normal' | 'fast' | 'mini' }>({ mode: 'normal' });

  const isMultiple = typeOptions?.multipleValues ?? false;

  const enableImageMask = typeOptions?.enableImageMask ?? false;

  return (
    type === 'file' &&
    (miniMode ? (
      <>
        {enableImageMask ? (
          <div className="flex items-center justify-between">
            <span className="text-xs text-opacity-70">
              {t('workspace.pre-view.actuator.execution-form.file.label')}
            </span>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="small" className="-mr-1 scale-90">
                  {t('workspace.pre-view.actuator.execution-form.file.click-to-open-in-image-mask-editor-and-upload')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[35rem]">
                <DialogHeader>
                  <DialogTitle>{t('components.ui.vines-image-mask-editor.preview.label')}</DialogTitle>
                </DialogHeader>
                <VinesImageMaskPreview
                  className="h-96"
                  src={value}
                  onFinished={(val) => form.setValue(name, isMultiple ? [val] : val)}
                />
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div
            className="flex items-center justify-between"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <span className="text-xs text-opacity-70">
              {t('workspace.pre-view.actuator.execution-form.file.label')}
            </span>
            <VinesUploader
              files={isArray(value) ? value : isString(value) ? [value] : []}
              onChange={(urls) => form.setValue(name, isMultiple ? urls : urls[0])}
              max={isMultiple ? void 0 : 1}
              basePath="user-files/workflow-input"
            />
          </div>
        )}
      </>
    ) : (
      <Card className={cn('w-full overflow-hidden', mode !== 'mini' && 'max-sm:max-w-[calc(100vw-3rem)]')}>
        <CardContent
          className={cn('relative p-0', enableImageMask && 'p-2')}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          {enableImageMask ? (
            <VinesImageMaskPreview src={value} onFinished={(val) => form.setValue(name, isMultiple ? [val] : val)} />
          ) : (
            <div
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <VinesUploader
                files={isArray(value) ? value : isString(value) ? [value] : []}
                onChange={(urls) => form.setValue(name, isMultiple ? urls : urls[0])}
                max={isMultiple ? void 0 : 1}
                basePath="user-files/workflow-input"
              />
            </div>
          )}
        </CardContent>
      </Card>
    ))
  );
};
