import { cn } from '@/utils';

interface IconButtonProps extends React.ComponentPropsWithoutRef<'div'> {
  mode: 'normal' | 'fast' | 'mini';
  isCompact: boolean;
  children: React.ReactNode;
}

export const IconButton = ({ mode, isCompact, children, className, ...rest }: IconButtonProps) => {
  return (
    <div
      className={cn(
        'z-10 flex cursor-pointer items-center justify-center gap-global-1/2 rounded-md p-global-1/2 transition-colors hover:bg-accent hover:text-accent-foreground',
        mode === 'mini'
          ? 'size-[calc(var(--global-icon-size)+8px)]'
          : isCompact
            ? 'size-[calc(var(--operation-bar-width))]'
            : 'size-[var(--operation-bar-width)]',
        className,
        // mode === 'mini'
        //   ? 'mx-global-1/2 mt-global-1/2 size-[calc(var(--global-icon-size)+8px)]'
        //   : isCompact
        //     ? 'mx-global-1/2 mt-global size-[calc(var(--operation-bar-width))]'
        //     : 'mx-global mt-global size-[var(--operation-bar-width)]',
      )}
      {...rest}
    >
      {children}
    </div>
  );
};
