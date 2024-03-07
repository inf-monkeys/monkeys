import React from 'react';

import { Moon, Sun, SunMoon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppStore } from '@/store/useAppStore';
import { EDarkModeTrigger } from '@/store/useAppStore/dark-mode.slice.ts';
import { useLocalStorage } from '@/utils';

interface IVinesDarkModeProps extends React.ComponentPropsWithoutRef<'div'> {}

export const VinesDarkMode: React.FC<IVinesDarkModeProps> = ({ className }) => {
  const { setDarkMode, setDarkModeTrigger } = useAppStore();
  const [mode, setLocalDarkMode] = useLocalStorage<string>('vines-ui-dark-mode', 'auto', false);

  const handleDarkModeChange = (mode: string) => {
    setLocalDarkMode(mode);
    if (mode === 'auto') {
      setDarkModeTrigger(EDarkModeTrigger.Auto);
    } else {
      setDarkModeTrigger(EDarkModeTrigger.Manual);
      setDarkMode(mode === 'dark');
    }
  };

  const isAutoMode = mode === 'auto';
  const isDarkMode = mode === 'dark';
  const isLightMode = mode === 'light';

  return (
    <Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <TooltipTrigger asChild>
            <Button
              className={className}
              icon={
                isAutoMode ? (
                  <SunMoon size={16} strokeWidth={1.5} />
                ) : isDarkMode ? (
                  <Moon size={16} strokeWidth={1.5} />
                ) : (
                  <Sun size={16} strokeWidth={1.5} />
                )
              }
              size="small"
              variant="outline"
            />
          </TooltipTrigger>
        </DropdownMenuTrigger>
        <DropdownMenuContent className={className}>
          <DropdownMenuGroup>
            <DropdownMenuCheckboxItem
              checked={isAutoMode}
              disabled={isAutoMode}
              onCheckedChange={() => handleDarkModeChange('auto')}
              className="flex gap-2"
            >
              <SunMoon size={16} strokeWidth={1.5} />
              <span>跟随系统</span>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isLightMode}
              disabled={isLightMode}
              onCheckedChange={() => handleDarkModeChange('light')}
              className="flex gap-2"
            >
              <Sun size={16} strokeWidth={1.5} />
              <span>浅色模式</span>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isDarkMode}
              disabled={isDarkMode}
              onCheckedChange={() => handleDarkModeChange('dark')}
              className="flex gap-2"
            >
              <Moon size={16} strokeWidth={1.5} />
              <span>深色模式</span>
            </DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <TooltipContent>{isAutoMode ? '跟随系统' : isDarkMode ? '深色模式' : '浅色模式'}</TooltipContent>
    </Tooltip>
  );
};
