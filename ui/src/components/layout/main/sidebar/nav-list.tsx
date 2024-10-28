import React from 'react';

import { ChevronRightIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { NavButton } from '@/components/layout/main/sidebar/nav-button.tsx';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { SIDEBAR_MAP } from '@/consts/sidebar.tsx';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { cn } from '@/utils';

interface INavListProps extends React.ComponentPropsWithoutRef<'div'> {}

export const NavList: React.FC<INavListProps> = ({ className }) => {
  const { t } = useTranslation();

  const [activeIndex, setActiveIndex] = useLocalStorage<string[]>(
    'vines-ui-sidebar',
    SIDEBAR_MAP.map(({ name }) => name),
  );

  return (
    <ScrollArea className={cn('h-full flex-1 overflow-y-scroll', className)} scrollBarDisabled>
      <Accordion
        type="multiple"
        className="flex w-full flex-col gap-1 text-xs text-slateA-8 text-opacity-70"
        value={activeIndex}
        onValueChange={setActiveIndex}
      >
        {SIDEBAR_MAP.map(({ items, name, icon, path }, i) => (
          <AccordionItem key={i} value={name}>
            {items ? (
              <>
                <AccordionTrigger className="font-normal">
                  <NavButton
                    key={name + i}
                    icon={icon}
                    postfix={
                      <div className="flex flex-1 justify-end">
                        <ChevronRightIcon className="chevron h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                      </div>
                    }
                  >
                    {t(`components.layout.main.sidebar.list.${name}.label`)}
                  </NavButton>
                </AccordionTrigger>
                <AccordionContent className="flex flex-col gap-1 first:mt-1">
                  {items.map(({ name: subName, path: subPath }, index) => (
                    <NavButton key={index} to={subPath}>
                      {t(`components.layout.main.sidebar.list.${name}.${subName}.label`)}
                    </NavButton>
                  ))}
                </AccordionContent>
              </>
            ) : (
              <NavButton key={i} icon={icon} to={path}>
                {t(`components.layout.main.sidebar.list.${name}.label`)}
              </NavButton>
            )}
          </AccordionItem>
        ))}
      </Accordion>
    </ScrollArea>
  );
};
