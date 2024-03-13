import React from 'react';

import { Info } from 'lucide-react';

import { IVinesInputPropertyProps } from '@/components/layout/vines-flow/headless-modal/tool-editor/config/tool-input/input-property';
import { Input } from '@/components/ui/input';
import { TagInput } from '@/components/ui/input/tag';

export const BlankInput: React.FC<IVinesInputPropertyProps> = ({ def, value, onChange, disabled }) => {
  return (
    <div className="flex flex-col gap-2">
      {Array.isArray(value) ? (
        <TagInput
          placeholder={(def.description ?? `请输入${def.displayName}`).concat('，回车新增')}
          value={typeof value !== 'object' ? (value as unknown)?.toString()?.split(',') : (value as string[])}
          onChange={onChange}
          disabled={disabled}
        />
      ) : (
        <Input value={value as string} onChange={onChange} disabled={disabled} />
      )}
      <div className="flex items-center gap-2 rounded bg-gray-600 bg-opacity-20 px-2 py-1 shadow-sm">
        <Info size={14} />
        <span className="text-xs">不受支持的配置项，建议使用「开发模式」编辑</span>
      </div>
    </div>
  );
};
