import React from 'react';

import { BlockDefPropertyTypeOptions } from '@inf-monkeys/vines/src/models/BlockDefDto.ts';
import { get } from 'lodash';

import { IVinesInputPropertyProps } from '@/components/layout/vines-flow/headless-modal/tool-editor/config/tool-input/input-property';
import { SdModelPresets } from '@/components/layout/vines-flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/sd-model.tsx';
export interface IVinesInputPresetProps {
  typeOptions: BlockDefPropertyTypeOptions;
  componentMode: 'component' | 'input';
  setComponentMode: React.Dispatch<React.SetStateAction<'component' | 'input'>>;
}

export const PresetInput: React.FC<IVinesInputPropertyProps & IVinesInputPresetProps> = ({
  typeOptions,
  ...childProps
}) => {
  const assetType = get(typeOptions, 'assetType', null);

  return <div className="relative min-h-8">{assetType === 'sd-model' && <SdModelPresets {...childProps} />}</div>;
};
