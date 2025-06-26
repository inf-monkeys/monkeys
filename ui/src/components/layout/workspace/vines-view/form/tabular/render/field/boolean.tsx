import React from 'react';

import { isArray, isBoolean } from 'lodash';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { BOOLEAN_VALUES } from '@/components/layout/workspace/vines-view/form/tabular/render';
import { TagInput } from '@/components/ui/input/tag';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { IWorkflowInputForm } from '@/schema/workspace/workflow-input-form.ts';
import { cn } from '@/utils';

interface IFieldBooleanProps {
  input: VinesWorkflowVariable;
  value: any;
  onChange: (value: any) => void;
  form: UseFormReturn<IWorkflowInputForm>;
}

export const FieldBoolean: React.FC<IFieldBooleanProps> = ({
  input: { name, type, displayName, typeOptions },
  value,
  onChange,
  form,
}) => {
  const { t } = useTranslation();

  const isMultiple = typeOptions?.multipleValues ?? false;
  const isChecked = isBoolean(value) ? value : BOOLEAN_VALUES.includes((value as string)?.toString());

  return (
    type === 'boolean' && (
      <div>
        {isMultiple ? (
          <TagInput
            value={isArray(value) ? value.map((it: any) => it.toString()) : []}
            onChange={(value) =>
              form.setValue(
                name,
                value.filter((it) => BOOLEAN_VALUES.includes(it)),
              )
            }
            placeholder={t('workspace.pre-view.actuator.execution-form.string', { displayName })}
          />
        ) : (
          <div className="flex w-full gap-2">
            <button
              type="button"
              onClick={() => onChange(false)}
              className={cn(
                'flex-1 rounded-md border py-2 text-center',
                !isChecked
                  ? 'border-transparent bg-white text-[#363531] dark:bg-black dark:text-white'
                  : 'border-[#E5E5EA] bg-[#F9F9F9] text-[#D7D6D4] dark:border-[#3A3A3C] dark:bg-[#2C2C2E] dark:text-[#86868B]',
              )}
            >
              {t('common.utils.no')}
            </button>
            <button
              type="button"
              onClick={() => onChange(true)}
              className={cn(
                'flex-1 rounded-md border py-2 text-center',
                isChecked
                  ? 'border-transparent bg-white text-[#363531] dark:bg-black dark:text-white'
                  : 'border-[#E5E5EA] bg-[#F9F9F9] text-[#D7D6D4] dark:border-[#3A3A3C] dark:bg-[#2C2C2E] dark:text-[#86868B]',
              )}
            >
              {t('common.utils.yes')}
            </button>
          </div>
        )}
      </div>
    )
  );
};
