import React from 'react';

import { useNavigate } from '@tanstack/react-router';

import { UserCog } from 'lucide-react';

import { VinesDarkMode } from '@/components/layout/main/vines-darkmode.tsx';
import { Button } from '@/components/ui/button';
import { I18nSelector } from '@/components/ui/i18n-selector';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Route } from '@/pages/login';

export const Toolbar: React.FC = () => {
  const navigate = useNavigate({ from: Route.fullPath });

  return (
    <div className="flex justify-between">
      <div className="flex items-center gap-2">
        <VinesDarkMode />
        <I18nSelector />
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="!size-9 bg-mauve-2 shadow-sm [&_svg]:stroke-black dark:[&_svg]:stroke-gold-12"
            icon={<UserCog />}
            size="small"
            onClick={() => {
              void navigate({
                to: '/$teamId/settings',
              });
            }}
          />
        </TooltipTrigger>
        <TooltipContent>用户与团队配置</TooltipContent>
      </Tooltip>
    </div>
  );
};
