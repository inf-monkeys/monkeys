import { get } from 'lodash';

import { useSystemConfig } from '@/apis/common';
import { ISystemConfig } from '@/apis/common/typings';
import { cn } from '@/utils';

import { GlobalDesignBoardOperationBarArea } from './area';

export const GlobalDesignBoardOperationBar = () => {
  const { data: oem } = useSystemConfig();

  const themeMode = get(oem, 'theme.themeMode', 'border') as ISystemConfig['theme']['themeMode'];

  return (
    <div
      className={cn(
        `h-full w-72 flex-col rounded-lg bg-slate-1 p-global`,
        themeMode === 'border' && 'border border-input',
        themeMode === 'shadow' && 'shadow-around',
      )}
    >
      <GlobalDesignBoardOperationBarArea />
    </div>
  );
};
