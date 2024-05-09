import React from 'react';

import { ScrollShadow } from '@nextui-org/scroll-shadow';
import { ChevronDownIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { NavButton } from '@/components/layout/main/sidebar/nav-button.tsx';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion.tsx';
import { SIDEBAR_MAP } from '@/consts/sidebar.tsx';
import { useLocalStorage } from '@/utils';

interface INavListProps extends React.ComponentPropsWithoutRef<'div'> {}

export const NavList: React.FC<INavListProps> = () => {
  const { t } = useTranslation();

  const [activeIndex, setActiveIndex] = useLocalStorage<string[]>(
    'vines-ui-sidebar',
    SIDEBAR_MAP.map(({ name }) => name),
  );

  return (
    <ScrollShadow hideScrollBar className="h-full flex-1 overflow-y-scroll pb-8" visibility="bottom">
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
                <AccordionTrigger>
                  <NavButton
                    key={name + i}
                    icon={icon}
                    postfix={
                      <div className="flex flex-1 justify-end">
                        <ChevronDownIcon className="chevron h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                      </div>
                    }
                  >
                    {t(`components.layout.main.sidebar.list.${name}.index`)}
                  </NavButton>
                </AccordionTrigger>
                <AccordionContent className="flex flex-col gap-1 first:mt-1">
                  {items.map(({ name: subName, path: subPath }, index) => (
                    <NavButton key={index} to={subPath}>
                      {t(`components.layout.main.sidebar.list.${name}.${subName}`)}
                    </NavButton>
                  ))}
                </AccordionContent>
              </>
            ) : (
              <NavButton key={i} icon={icon} to={path}>
                {t(`components.layout.main.sidebar.list.${name}.index`)}
              </NavButton>
            )}
          </AccordionItem>
        ))}
      </Accordion>
    </ScrollShadow>
  );
};
