import React from 'react';

import { ToolProperty } from '@inf-monkeys/monkeys';
import { useTranslation } from 'react-i18next';

import { FormControl } from '@/components/ui/form.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { getI18nContent } from '@/utils';

interface IFieldOptionsProps {
  input: VinesWorkflowVariable;
  value: any;
  onChange: (value: any) => void;
}

export const FieldOptions: React.FC<IFieldOptionsProps> = ({ input: { type, ...other }, value, onChange }) => {
  const { t } = useTranslation();

  const options = (other as ToolProperty)?.options ?? [];

  return (
    type === 'options' && (
      <Select
        onValueChange={(val) =>
          onChange((options.find((it) => ('value' in it ? it.value.toString() : '' === val)) as any)?.value ?? '')
        }
        defaultValue={value as string}
      >
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder={t('workspace.pre-view.actuator.execution-form.options')} />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {options?.map((it, i) => (
            <SelectItem value={'value' in it ? it.value.toString() : ''} key={i}>
              {getI18nContent(it.name)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  );
};
