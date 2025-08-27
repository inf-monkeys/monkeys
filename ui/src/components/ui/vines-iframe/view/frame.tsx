import { useRoundedClass } from '@/apis/common';
import useUrlState from '@/hooks/use-url-state';
import { cn } from '@/utils';

export const VinesViewFrame = ({ children }: { children: React.ReactNode }) => {
  const [{ mode }] = useUrlState<{ mode: 'normal' | 'fast' | 'mini' }>({ mode: 'normal' });

  const { roundedClass } = useRoundedClass();

  return (
    <div className={cn('size-full overflow-hidden bg-slate-1', mode === 'mini' ? '' : `${roundedClass} border`)}>
      {children}
    </div>
  );
};
