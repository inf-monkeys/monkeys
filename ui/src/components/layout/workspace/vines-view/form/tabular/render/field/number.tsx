import React from 'react';

import { isUndefined, toNumber } from 'lodash';
import { ControllerRenderProps, FieldValues } from 'react-hook-form';

import { FieldGroup } from '@/components/ui/form.tsx';
import { NumberField, NumberFieldInput } from '@/components/ui/input/number.tsx';
import { Slider } from '@/components/ui/slider.tsx';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';

interface IFieldNumberProps {
  input: VinesWorkflowVariable;
  value: any;
  onChange: (value: any) => void;
  field: Omit<ControllerRenderProps<FieldValues, string>, 'value' | 'onChange'>;
}

export const FieldNumber: React.FC<IFieldNumberProps> = ({ input: { type, typeOptions }, value, onChange, field }) => {
  const getNumberValue = (val: any, fallback: number) => {
    const num = Number(val);
    return isNaN(num) ? fallback : num;
  };

  return (
    type === 'number' &&
    (isUndefined(typeOptions?.minValue) || isUndefined(typeOptions?.maxValue) || typeOptions?.numberPrecision === 0 ? (
      <NumberField
        value={toNumber(value)}
        onChange={onChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.code === 'Enter' || e.keyCode === 13) {
            e.continuePropagation();
            e.preventDefault();
          }
        }}
        aria-label="number input"
        {...field}
      >
        <FieldGroup>
          <NumberFieldInput />
        </FieldGroup>
      </NumberField>
    ) : (
      <Slider
        className="mx-2"
        min={typeOptions.minValue}
        max={typeOptions.maxValue}
        step={typeOptions.numberPrecision}
        defaultValue={[getNumberValue(value, typeOptions.minValue ?? 0)]}
        value={[getNumberValue(value, typeOptions.minValue ?? 0)]}
        onValueChange={(v) => onChange(v[0])}
        {...field}
      />
    ))
  );
};
