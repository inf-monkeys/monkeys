import React from 'react';

import { useTranslation } from 'react-i18next';

import { NavButton } from '@/components/layout/main/sidebar/nav-button.tsx';
import { Accordion, AccordionItem } from '@/components/ui/accordion.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { SETTINGS_SIDEBAR_MAP } from '@/consts/setttings/sidebar';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { cn } from '@/utils';

interface INavListProps extends React.ComponentPropsWithoutRef<'div'> {}

export const SettingsNavList: React.FC<INavListProps> = ({ className }) => {
  const { t } = useTranslation();

  const [activeIndex, setActiveIndex] = useLocalStorage<string[]>(
    'vines-ui-settings-sidebar',
    SETTINGS_SIDEBAR_MAP.map(({ name }) => name),
  );

  return (
    <ScrollArea className={cn('h-full flex-1 overflow-y-scroll', className)} scrollBarDisabled>
      <Accordion
        type="multiple"
        className="flex w-full flex-col gap-1 text-xs text-slateA-8 text-opacity-70"
        value={activeIndex}
        onValueChange={setActiveIndex}
      >
        {SETTINGS_SIDEBAR_MAP.map(({ name, icon, to }, i) => (
          <AccordionItem key={i} value={name}>
            <NavButton key={i} icon={icon} to={to}>
              {t(name)}
            </NavButton>
          </AccordionItem>
        ))}
      </Accordion>
    </ScrollArea>
  );
};
