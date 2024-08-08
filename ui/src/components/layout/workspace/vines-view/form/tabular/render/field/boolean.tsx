import React from 'react';

import { isArray, isBoolean } from 'lodash';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { BOOLEAN_VALUES } from '@/components/layout/workspace/vines-view/form/tabular/render';
import { TagInput } from '@/components/ui/input/tag';
import { Switch } from '@/components/ui/switch';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { IWorkflowInputForm } from '@/schema/workspace/workflow-input-form.ts';

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
          <Switch
            checked={isBoolean(value) ? value : BOOLEAN_VALUES.includes((value as string)?.toString())}
            onCheckedChange={onChange}
          />
        )}
      </div>
    )
  );
};
