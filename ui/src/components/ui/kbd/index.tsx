import React from 'react';

import { KbdKey, kbdKeysMap, kbdWindowsKeysMap } from '@/components/ui/kbd/typings';
import { cn } from '@/utils';

interface IKbdProps extends React.ComponentPropsWithoutRef<'div'> {
  keys: KbdKey | KbdKey[] | string[] | string;
}

const windowsPlatforms = /(Win32)|(Win64)|(Windows)|(WinCE)/i;

export const Kbd: React.FC<IKbdProps> = ({ className, keys }) => {
  const kbdList = typeof keys === 'string' ? [keys] : Array.isArray(keys) ? keys : [];
  return (
    <div className={cn('text-xxs flex items-center space-x-0.5 font-bold no-underline', className)}>
      {kbdList.map((key) => (
        <p key={key} className="rounded-sm border-input bg-gray-2 p-1 shadow-md dark:bg-gray-5">
          {windowsPlatforms && key in kbdWindowsKeysMap ? kbdWindowsKeysMap[key] : kbdKeysMap[key] ?? key}
        </p>
      ))}
    </div>
  );
};
