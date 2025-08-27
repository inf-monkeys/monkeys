import { get } from 'lodash';

import { useRoundedClass, useSystemConfig } from '@/apis/common';
import { ISystemConfig } from '@/apis/common/typings';
import useUrlState from '@/hooks/use-url-state';
import { cn } from '@/utils';

export const VinesViewFrame = ({ children }: { children: React.ReactNode }) => {
  const [{ mode }] = useUrlState<{ mode: 'normal' | 'fast' | 'mini' }>({ mode: 'normal' });

  const { roundedClass } = useRoundedClass();

  const { data: oem } = useSystemConfig();

  const themeMode = get(oem, 'theme.themeMode', 'border') as ISystemConfig['theme']['themeMode'];

  return (
    <div
      className={cn(
        'size-full overflow-hidden bg-slate-1',
        mode === 'mini' ? '' : roundedClass,
        themeMode === 'border' && 'border border-input',
        themeMode === 'shadow' && 'shadow-around',
      )}
    >
      {children}
    </div>
  );
};
