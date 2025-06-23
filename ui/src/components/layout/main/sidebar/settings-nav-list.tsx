import React from 'react';

import { useSearch } from '@tanstack/react-router';

import { useTranslation } from 'react-i18next';

import { useSystemConfig } from '@/apis/common';
import { Accordion, AccordionItem } from '@/components/ui/accordion.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { SETTINGS_SIDEBAR_MAP } from '@/consts/setttings/sidebar';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { cn } from '@/utils';

import { SettingsNavButton } from './settings-nav-button';

interface INavListProps extends React.ComponentPropsWithoutRef<'div'> {}

export const SettingsNavList: React.FC<INavListProps> = ({ className }) => {
  const { t } = useTranslation();

  const { data: config } = useSystemConfig();

  const showTeamQuota = config && (config.module === '*' || config.module.includes('payment'));

  const settingsSidebarMap = SETTINGS_SIDEBAR_MAP.filter((item) => {
    if (!showTeamQuota && item.id === 'quota') return false;
    return true;
  });

  const [activeIndex, setActiveIndex] = useLocalStorage<string[]>(
    'vines-ui-settings-sidebar',
    settingsSidebarMap.map(({ name }) => name),
  );

  const currentTabVariant = useSearch({
    strict: false,
    // @ts-expect-error
    select: (search) => search.tab,
  });

  return (
    <ScrollArea className={cn('h-full flex-1 overflow-y-scroll', className)} scrollBarDisabled>
      <Accordion
        type="multiple"
        className="flex w-full flex-col gap-1 text-xs text-slateA-8 text-opacity-70"
        value={activeIndex}
        onValueChange={setActiveIndex}
      >
        {settingsSidebarMap.map(({ name, icon, to }, i) => {
          const isActive = () => {
            const params = to?.split('?').at(-1);
            if (params) {
              const searchParams = new URLSearchParams(params);
              return searchParams.get('tab') === currentTabVariant;
            }
            return false;
          };

          return (
            <AccordionItem key={i} value={name}>
              <SettingsNavButton key={i} isActive={isActive()} icon={icon} to={to as any}>
                {t(name)}
              </SettingsNavButton>
            </AccordionItem>
          );
        })}
      </Accordion>
    </ScrollArea>
  );
};
