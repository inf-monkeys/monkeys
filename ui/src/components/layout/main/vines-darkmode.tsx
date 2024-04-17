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
import { useLocalStorage } from '@/utils';

interface IVinesDarkModeProps extends React.ComponentPropsWithoutRef<'div'> {}

export const VinesDarkMode: React.FC<IVinesDarkModeProps> = ({ className }) => {
  const [mode, setLocalDarkMode] = useLocalStorage<string>('vines-ui-dark-mode', 'auto', false);

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
              onCheckedChange={() => setLocalDarkMode('auto')}
              className="flex gap-2"
            >
              <SunMoon size={16} strokeWidth={1.5} />
              <span>跟随系统</span>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isLightMode}
              disabled={isLightMode}
              onCheckedChange={() => setLocalDarkMode('light')}
              className="flex gap-2"
            >
              <Sun size={16} strokeWidth={1.5} />
              <span>浅色模式</span>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isDarkMode}
              disabled={isDarkMode}
              onCheckedChange={() => setLocalDarkMode('dark')}
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
