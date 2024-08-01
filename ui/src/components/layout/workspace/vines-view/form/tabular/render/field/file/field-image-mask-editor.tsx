import React, { useState } from 'react';

import { useEventEmitter } from 'ahooks';
import { motion } from 'framer-motion';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { IImageMaskEditorEvent, ImageMaskEditor } from '@/components/ui/image-mask-editor';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { IWorkflowInputForm } from '@/schema/workspace/workflow-input-form.ts';
import { cn } from '@/utils';

interface IFieldImageMaskEditorProps {
  maxWidth?: number;
  maxHeight?: number;
  form: UseFormReturn<IWorkflowInputForm>;
  name: string;
  value: any;
  isMultiple: boolean;
}

export const FieldImageMaskEditor: React.FC<IFieldImageMaskEditorProps> = ({
  maxWidth,
  maxHeight,
  name,
  value,
  form,
  isMultiple,
}) => {
  const { t } = useTranslation();

  const [maskEditorVisible, setMaskEditorVisible] = useState(false);

  const maskEditor$ = useEventEmitter<IImageMaskEditorEvent>();

  return (
    <div className="relative size-full">
      <ImageMaskEditor
        className="h-64 w-full max-w-full"
        maxWidth={maxWidth}
        onFinished={(urls) => {
          form.setValue(name, isMultiple ? urls : urls[0]);
          setMaskEditorVisible(false);
        }}
        event$={maskEditor$}
        enableMini
      >
        <Button
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMaskEditorVisible(false);
          }}
        >
          {t('common.utils.cancel')}
        </Button>
      </ImageMaskEditor>
      <motion.div
        className={cn(
          'vines-center absolute left-0 top-0 z-10 size-full flex-col gap-4 overflow-hidden rounded-md bg-background p-4',
          maskEditorVisible && 'pointer-events-none z-0',
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: maskEditorVisible ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div
          className={cn(
            'size-full overflow-hidden rounded-md border border-input',
            !value && 'vines-center flex-col gap-4 p-2',
          )}
        >
          {value ? (
            <ScrollArea style={{ height: maxHeight }}>
              <img
                src={value}
                alt="mask"
                className="aspect-square w-full transform rounded-lg object-cover object-center shadow transition-transform duration-200 ease-in-out"
              />
            </ScrollArea>
          ) : (
            <span className="text-sm text-gray-10">
              {t('workspace.pre-view.actuator.execution-form.mask-editor.empty')}
            </span>
          )}
        </div>

        <div className="space-x-4">
          <Button
            variant="outline"
            size="small"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMaskEditorVisible(true);
              maskEditor$.emit('trigger-select-image');
            }}
          >
            {t(`workspace.pre-view.actuator.execution-form.mask-editor.${value ? 're-edit' : 'empty-action'}`)}
          </Button>
          {value && (
            <Button
              variant="outline"
              size="small"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.setValue(name, void 0);
              }}
            >
              {t('workspace.pre-view.actuator.execution-form.mask-editor.clear')}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
