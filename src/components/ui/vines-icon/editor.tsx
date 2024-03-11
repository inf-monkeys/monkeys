import React from 'react';

import { RotateCcw } from 'lucide-react';

import { VinesIconSelector } from '@/components/ui/icon-selector';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon/index.tsx';

interface IVinesIconEditorProps {
  value: string;
  defaultValue?: string;
  onChange: (value: string) => void;
}

export const VinesIconEditor: React.FC<IVinesIconEditorProps> = ({ value, defaultValue, onChange }) => {
  return (
    <div className="flex">
      <VinesIconSelector emojiLink={value} onChange={onChange}>
        <div className="relative cursor-pointer">
          <VinesIcon size="lg">{value}</VinesIcon>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="absolute bottom-0 right-0 cursor-pointer rounded-br-md rounded-tl-md bg-white bg-opacity-45 p-1 shadow hover:bg-opacity-60 [&_svg]:stroke-vines-500"
                onClick={(e) => {
                  e.preventDefault();
                  onChange(defaultValue || 'emoji:🍀:#ceefc5');
                }}
              >
                <RotateCcw size={8} />
              </div>
            </TooltipTrigger>
            <TooltipContent>点击重置</TooltipContent>
          </Tooltip>
        </div>
      </VinesIconSelector>
    </div>
  );
};
