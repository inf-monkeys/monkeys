import React from 'react';

import { isUndefined } from 'lodash';
import { ControllerRenderProps, FieldValues } from 'react-hook-form';

import { Slider } from '@/components/ui/slider.tsx';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';

interface IFieldNumberProps {
  input: VinesWorkflowVariable;
  value: any;
  onChange: (value: any) => void;
  field: Omit<ControllerRenderProps<FieldValues, string>, 'value' | 'onChange'>;
}

export const FieldNumber: React.FC<IFieldNumberProps> = ({ input: { type, typeOptions }, value, onChange, field }) => {
  return (
    type === 'number' &&
    !(
      isUndefined(typeOptions?.minValue) ||
      isUndefined(typeOptions?.maxValue) ||
      typeOptions?.numberPrecision === 0
    ) && (
      <Slider
        min={typeOptions.minValue}
        max={typeOptions.maxValue}
        step={typeOptions.numberPrecision}
        defaultValue={[Number(value) || 0]}
        value={[Number(value) || 0]}
        onValueChange={(v) => onChange(v[0])}
        {...field}
      />
    )
  );
};