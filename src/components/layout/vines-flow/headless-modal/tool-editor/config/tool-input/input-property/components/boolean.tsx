import React from 'react';

import { isBoolean } from 'lodash';

import { IVinesInputPropertyProps } from '@/components/layout/vines-flow/headless-modal/tool-editor/config/tool-input/input-property';
import { Switch } from '@/components/ui/switch';

export const BooleanInput: React.FC<IVinesInputPropertyProps> = ({ value, onChange, disabled }) => {
  return (
    <Switch
      checked={isBoolean(value) ? value : (value as string) === 'true'}
      onCheckedChange={onChange}
      disabled={disabled}
    />
  );
};
