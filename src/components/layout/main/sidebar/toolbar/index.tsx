import React from 'react';

import { Moon, Sun, SunMoon, UserCog } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppStore } from '@/store/useAppStore';
import { EDarkModeTrigger } from '@/store/useAppStore/dark-mode.slice.ts';
import { useLocalStorage } from '@/utils';

export const Toolbar: React.FC = () => {
  const { setDarkMode, setDarkModeTrigger } = useAppStore();
  const [mode, setLocalDarkMode] = useLocalStorage<string>('vines-dark-mode', 'auto', false);

  const handleDarkModeChange = (mode: string) => {
    setLocalDarkMode(mode);
    if (mode === 'auto') {
      setDarkModeTrigger(EDarkModeTrigger.Auto);
    } else {
      setDarkModeTrigger(EDarkModeTrigger.Manual);
      setDarkMode(mode === 'dark');
    }
  };

  return (
    <div className="flex justify-between">
      <ToggleGroup
        className="rounded-md bg-mauve-2 shadow-sm [&_[aria-checked='true']]:bg-mauve-4"
        size="sm"
        type="single"
        value={mode}
        onValueChange={handleDarkModeChange}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem value="dark" aria-label="深色模式">
              <Moon size={16} />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>深色模式</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem value="light" aria-label="浅色模式">
              <Sun size={16} />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>浅色模式</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem value="auto" aria-label="跟随系统">
              <SunMoon size={16} />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>跟随系统</TooltipContent>
        </Tooltip>
      </ToggleGroup>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="!size-8 bg-mauve-2 shadow-sm [&_svg]:stroke-black dark:[&_svg]:stroke-gold-12"
            icon={<UserCog />}
            size="small"
          />
        </TooltipTrigger>
        <TooltipContent>用户与团队配置</TooltipContent>
      </Tooltip>
    </div>
  );
};
