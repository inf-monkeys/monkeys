import React from 'react';

import { useNavigate } from '@tanstack/react-router';

import { UserCog } from 'lucide-react';

import { VinesDarkMode } from '@/components/layout/main/vines-darkmode.tsx';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Route } from '@/pages/login.tsx';

export const Toolbar: React.FC = () => {
  const navigate = useNavigate({ from: Route.fullPath });

  return (
    <div className="flex justify-between">
      <VinesDarkMode />
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
