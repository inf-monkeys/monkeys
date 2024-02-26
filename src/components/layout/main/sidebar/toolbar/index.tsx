import React from 'react';

import { Moon, Sun, SunMoon, UserCog } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group.tsx';
import { useAppStore } from '@/store/useAppStore';
import { EDarkModeTrigger } from '@/store/useAppStore/dark-mode.slice.ts';

export const Toolbar: React.FC = () => {
  const { darkMode, darkModeTrigger, setDarkMode, setDarkModeTrigger } = useAppStore();

  const handleDarkModeChange = (mode: string) => {
    if (mode === 'auto') {
      setDarkModeTrigger(EDarkModeTrigger.Auto);
    } else {
      setDarkModeTrigger(EDarkModeTrigger.Manual);
      setDarkMode(mode === 'dark');
    }
  };

  const darkModeValue = darkModeTrigger === EDarkModeTrigger.Auto ? 'auto' : darkMode ? 'dark' : 'light';

  return (
    <div className="flex justify-between">
      <ToggleGroup size="sm" type="single" value={darkModeValue} onValueChange={handleDarkModeChange}>
        <ToggleGroupItem value="dark" aria-label="深色模式">
          <Moon size={16} />
        </ToggleGroupItem>
        <ToggleGroupItem value="light" aria-label="浅色模式">
          <Sun size={16} />
        </ToggleGroupItem>
        <ToggleGroupItem value="auto" aria-label="跟随系统">
          <SunMoon size={16} />
        </ToggleGroupItem>
      </ToggleGroup>
      <Button
        className="!size-8 bg-mauve-2 shadow-sm [&_svg]:stroke-black dark:[&_svg]:stroke-gold-12"
        icon={<UserCog />}
        size="small"
      />
    </div>
  );
};
