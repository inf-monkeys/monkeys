import { get } from 'lodash';

import { useSystemConfig } from '@/apis/common';
import { CustomizationWorkbenchViewTheme, ISystemConfig } from '@/apis/common/typings';
import useUrlState from '@/hooks/use-url-state';
import { cn } from '@/utils';

export const VinesViewFrame = ({ children }: { children: React.ReactNode }) => {
  const [{ mode }] = useUrlState<{ mode: 'normal' | 'fast' | 'mini' }>({ mode: 'normal' });

  const { data: oem } = useSystemConfig();

  const themeMode = get(oem, 'theme.themeMode', 'border') as ISystemConfig['theme']['themeMode'];
  const workbenchViewTheme = get(oem, 'theme.workbenchViewTheme', 'default') as CustomizationWorkbenchViewTheme;

  return (
    <div
      className={cn(
        'size-full overflow-hidden',
        workbenchViewTheme === 'default' && 'bg-slate-1',
        mode === 'mini' ? '' : 'rounded-lg',
        workbenchViewTheme !== 'bsd-blue' && themeMode === 'border' && 'border border-input',
        workbenchViewTheme !== 'bsd-blue' && themeMode === 'shadow' && 'shadow-around',
      )}
      style={
        workbenchViewTheme === 'bsd-blue'
          ? {
              borderRadius: '20px',
              background:
                'linear-gradient(0deg, rgba(0,0,0,0.3), rgba(0,0,0,0.3)), linear-gradient(157deg, rgba(23,23,23,0) 65%, rgba(39,77,189,0.715) 88%, #2D62FF 97%)',
              boxSizing: 'border-box',
              border: '1px solid',
              borderImage:
                'conic-gradient(from 158deg at 74% 49%, #12DCFF -5deg, #3159D1 51deg, #8099E3 159deg, #3159D1 259deg, #258AE2 295deg, #12DCFF 355deg, #3159D1 411deg) 1',
              backdropFilter: 'blur(32px)',
            }
          : undefined
      }
    >
      {children}
    </div>
  );
};
