import React from 'react';

import { cn } from '@/utils';

export type PanelCardProps = {
  children: React.ReactNode;
  className?: string;
  padding?: number | string | null;
  hover?: boolean;
  backgroundClassName?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export const PanelCard = React.forwardRef<HTMLDivElement, PanelCardProps>(
  ({ children, className, padding = 12, hover = true, backgroundClassName = 'bg-white/10', style, ...rest }, ref) => {
    const resolvedPadding = padding === null ? undefined : padding;

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col rounded-[15px] border border-[rgba(255,255,255,0.1)] transition-colors duration-400',
          hover && 'hover:border-white/40',
          backgroundClassName,
          className,
        )}
        style={resolvedPadding !== undefined ? { padding: resolvedPadding, ...style } : style}
        {...rest}
      >
        {children}
      </div>
    );
  },
);
PanelCard.displayName = 'PanelCard';

export const PanelHeader: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
}> = ({ icon, title, description, className }) => (
  <header className={cn('flex flex-col gap-1', className)}>
    <div className="flex items-center gap-2">
      {icon}
      <p
        className="text-white"
        style={{ fontFamily: 'Noto Sans SC', fontSize: 16, fontWeight: 500, lineHeight: '140%' }}
      >
        {title}
      </p>
    </div>
    {description && (
      <p
        className="text-white"
        style={{
          fontFamily: 'Noto Sans SC',
          fontSize: 12,
          fontWeight: 400,
          lineHeight: '140%',
          color: 'rgba(255,255,255,0.4)',
        }}
      >
        {description}
      </p>
    )}
  </header>
);

export const HistoryIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" width="20" height="20" viewBox="0 0 20 20">
    <defs>
      <clipPath id="hist-icon-clip">
        <rect x="0" y="0" width="20" height="20" rx="0" />
      </clipPath>
      <linearGradient x1="0.5" y1="0.0833333" x2="0.5" y2="0.9166666" id="hist-icon-grad">
        <stop offset="0%" stopColor="#8978F2" />
        <stop offset="100%" stopColor="#638BF6" />
      </linearGradient>
    </defs>
    <g clipPath="url(#hist-icon-clip)">
      <path
        d="M17.149959,14.282546C16.97213,14.578135,16.58846,14.673782,16.292686,14.496261C15.996913,14.318739,15.900868,13.935168,16.078084,13.639213C16.737966,12.540111,17.08551,11.281815,17.083292,9.999838C17.083292,6.087754,13.912044,2.916504,9.999959,2.916504C6.087875,2.916504,2.916626,6.087754,2.916626,9.999838C2.916626,13.911922,6.087876,17.083171,9.99996,17.083171C11.281756,17.085441,12.539895,16.738042,13.638919,16.07838C13.934897,15.900931,14.318684,15.996948,14.496233,16.292867C14.673782,16.588785,14.577899,16.972603,14.282043,17.150255C12.988752,17.926485,11.508314,18.335453,9.99996,18.33317C5.397668,18.33317,1.666626,14.602129,1.666626,9.999838C1.666626,5.397546,5.397668,1.666504,9.99996,1.666504C14.602251,1.666504,18.333294,5.397546,18.333294,9.999838C18.333294,11.529004,17.920168,12.999212,17.149959,14.282546ZM6.433085,12.682963L9.374959,9.740879L9.374959,6.249837C9.374959,5.904659,9.654781,5.624838,9.99996,5.624838C10.345138,5.624838,10.62496,5.904659,10.62496,6.249837L10.62496,9.999838C10.624924,10.165585,10.559052,10.32453,10.441834,10.441712L7.316834,13.566712C7.074085,13.81806,6.672415,13.821554,6.42533,13.574469C6.178243,13.327381,6.181737,12.925712,6.433085,12.682963Z"
        fill="url(#hist-icon-grad)"
      />
    </g>
  </svg>
);
