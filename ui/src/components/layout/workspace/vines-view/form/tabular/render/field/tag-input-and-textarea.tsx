import React, { useMemo } from 'react';

import { isArray } from 'lodash';
import { Book, RefreshCcw } from 'lucide-react';
import { ControllerRenderProps, FieldValues, UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { TagInput } from '@/components/ui/input/tag';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { IWorkflowInputForm } from '@/schema/workspace/workflow-input-form.ts';
import { getI18nContent } from '@/utils';

interface IFieldTagInputAndTextareaProps {
  input: VinesWorkflowVariable;
  value: any;
  onChange: (value: any) => void;
  form: UseFormReturn<IWorkflowInputForm>;
  field: Omit<ControllerRenderProps<FieldValues, string>, 'value' | 'onChange'>;

  miniMode?: boolean;
}

export const FieldTagInputAndTextarea: React.FC<IFieldTagInputAndTextareaProps> = ({
  input: { name, type, typeOptions, displayName: inputDisplayName },
  value,
  onChange,
  form,
  field,
  miniMode = false,
}) => {
  const { t } = useTranslation();

  const isNumber = type === 'number';
  const isMultiple = typeOptions?.multipleValues ?? false;

  const visible = useMemo(() => type === 'string' || (miniMode && type === 'file'), [type, typeOptions, miniMode]);

  const displayName = getI18nContent(inputDisplayName);

  const placeholder =
    typeOptions?.placeholder ?? t('workspace.pre-view.actuator.execution-form.string', { displayName });

  // 智能优化处理函数
  const handleSmartOptimize = () => {
    // 这里可以添加智能优化的逻辑
    console.log('Smart optimize for:', name);
  };

  // 提示词词典处理函数
  const handleShowDictionary = () => {
    // 这里可以添加显示提示词词典的逻辑
    console.log('Show dictionary for:', name);
  };

  return (
    visible &&
    (isMultiple ? (
      <TagInput
        value={isArray(value) ? value.map((it: string | number | boolean) => it.toString()) : []}
        onChange={(value) =>
          form.setValue(
            name,
            value.filter((it) => (isNumber ? !isNaN(Number(it)) : it)),
          )
        }
        placeholder={placeholder}
      />
    ) : (
      <div className="relative">
        <textarea
          placeholder={placeholder}
          // 目前是写的
          value={(value as string) ?? ''}
          onChange={(e) => {
            const newValue = e.target.value;
            if (isNumber) {
              const numberValue = Number(newValue);
              onChange(isNaN(numberValue) ? '' : numberValue);
            } else {
              onChange(newValue);
            }
          }}
          className="flex h-[180px] w-full resize-none rounded-md border border-input bg-[#FFFFFF] px-3 py-2 pr-4 text-sm text-gray-500 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vines-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#111113]"
          style={{ height: '180px' }}
          {...field}
        />
        {type === 'string' && (
          <div className="absolute bottom-4 left-4 flex gap-2">
            <Button
              variant="outline"
              size="small"
              className="vines-button flex select-none items-center justify-center gap-1 whitespace-nowrap rounded-md border border-input bg-white px-3 py-1 text-sm font-medium text-gray-800 shadow-sm ring-offset-background transition hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vines-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:bg-[#1E1E1E] dark:text-white dark:hover:bg-[#2D2D2D] dark:hover:text-white"
              onClick={handleSmartOptimize}
            >
              <RefreshCcw className="h-4 w-4 text-gray-800 dark:text-white" />
              智能优化
            </Button>
            <Button
              variant="outline"
              size="small"
              className="vines-button flex select-none items-center justify-center gap-1 whitespace-nowrap rounded-md border border-input bg-white px-3 py-1 text-sm font-medium text-gray-800 shadow-sm ring-offset-background transition hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vines-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:bg-[#1E1E1E] dark:text-white dark:hover:bg-[#2D2D2D] dark:hover:text-white"
              onClick={handleShowDictionary}
            >
              <Book className="h-4 w-4 text-gray-800 dark:text-white" />
              提示词词典
            </Button>
          </div>
        )}
      </div>
    ))
  );
};
