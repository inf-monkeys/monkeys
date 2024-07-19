import React from 'react';

import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { VinesImageMaskEditor } from '@/components/ui/image-mask-editor';
import { VinesUpdater } from '@/components/ui/updater';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { IWorkflowInputForm } from '@/schema/workspace/workflow-input-form.ts';

interface IFieldFileProps {
  input: VinesWorkflowVariable;
  form: UseFormReturn<IWorkflowInputForm>;
}

export const FieldFile: React.FC<IFieldFileProps> = ({ input: { name, type, typeOptions }, form }) => {
  const { t } = useTranslation();

  const isMultiple = typeOptions?.multipleValues ?? false;

  return (
    type === 'file' &&
    (typeOptions?.enableImageMask ? (
      <div className="flex items-center justify-between">
        <span className="text-xs text-opacity-70">{t('workspace.pre-view.actuator.execution-form.file.label')}</span>
        <VinesImageMaskEditor onFinished={(urls) => form.setValue(name, isMultiple ? urls : urls[0])}>
          <Button variant="outline" size="small" className="-mr-1 scale-90">
            {t('workspace.pre-view.actuator.execution-form.file.click-to-open-in-image-mask-editor-and-upload')}
          </Button>
        </VinesImageMaskEditor>
      </div>
    ) : (
      <div className="flex items-center justify-between">
        <span className="text-xs text-opacity-70">{t('workspace.pre-view.actuator.execution-form.file.label')}</span>
        <VinesUpdater
          limit={isMultiple ? void 0 : 1}
          onFinished={(urls) => form.setValue(name, isMultiple ? urls : urls[0])}
          basePath="user-files/workflow-input"
        >
          <Button variant="outline" size="small" className="-mr-1 scale-90">
            {t('workspace.pre-view.actuator.execution-form.file.click-to-upload')}
          </Button>
        </VinesUpdater>
      </div>
    ))
  );
};
