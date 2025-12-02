import React from 'react';

import { PanelCard, PanelHeader } from '@/components/layout/workbench/view/customers/scenes/components/PanelSection';
import { cn } from '@/utils';

interface RatioSelectorProps {
  value: string;
  options: string[];
  onChange: (ratio: string) => void;
}

const RatioIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <defs>
      <linearGradient id="ratioIconGradient1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#6991FF" />
        <stop offset="100%" stopColor="#5B50FF" />
      </linearGradient>
    </defs>
    <path
      d="M4 3.5h12a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5Z"
      stroke="url(#ratioIconGradient1)"
      strokeWidth="1.2"
      fill="none"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
    <path
      d="M4 10.4V16h5.6V10.4H4Z"
      stroke="url(#ratioIconGradient1)"
      strokeWidth="1.2"
      fill="none"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </svg>
);

export const RatioSelector: React.FC<RatioSelectorProps> = ({ value, options, onChange }) => {
  return (
    <PanelCard className="gap-3" padding={12}>
      <PanelHeader icon={<RatioIcon />} title="图像比例" description="调整图片的生成比例" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {options.map((ratio) => {
          const active = value === ratio;
          return (
            <button
              key={ratio}
              type="button"
              onClick={() => onChange(ratio)}
              className={cn(
                'h-12 w-full rounded-[12px] px-4 text-base font-medium text-white transition',
                active
                  ? 'border border-white/70 bg-[#1b2550] shadow-[0_0_0_1px_rgba(255,255,255,0.35)]'
                  : 'bg-[#0e1330] hover:bg-[#131a3d]',
              )}
            >
              <span
                style={{
                  fontFamily: 'Noto Sans SC',
                  fontSize: 14,
                  fontWeight: 'normal',
                  lineHeight: '140%',
                  letterSpacing: '0em',
                  color: '#FFFFFF',
                }}
              >
                {ratio}
              </span>
            </button>
          );
        })}
      </div>
    </PanelCard>
  );
};

