import { get } from 'lodash';

import { useSystemConfig } from '@/apis/common';
import useUrlState from '@/hooks/use-url-state';
import { cn } from '@/utils';

export const VinesViewFrame = ({ children }: { children: React.ReactNode }) => {
  const [{ mode }] = useUrlState<{ mode: 'normal' | 'fast' | 'mini' }>({ mode: 'normal' });
  
  const { data: oem } = useSystemConfig();
  const themeMode = get(oem, 'theme.themeMode', 'shadow');
  const isShadowMode = themeMode === 'shadow';
  const roundedClass = isShadowMode ? 'rounded-lg' : 'rounded-xl';
  
  return (
    <div className={cn('size-full overflow-hidden bg-slate-1', mode === 'mini' ? '' : `${roundedClass} border`)}>
      {children}
    </div>
  );
};
