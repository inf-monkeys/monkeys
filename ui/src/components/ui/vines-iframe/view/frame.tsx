import useUrlState from '@/hooks/use-url-state';
import { cn } from '@/utils';

export const VinesViewFrame = ({ children }: { children: React.ReactNode }) => {
  const [{ mode }] = useUrlState<{ mode: 'normal' | 'fast' | 'mini' }>({ mode: 'normal' });
  return (
    <div className={cn('size-full overflow-hidden bg-slate-1', mode === 'mini' ? '' : 'rounded-xl border')}>
      {children}
    </div>
  );
};
