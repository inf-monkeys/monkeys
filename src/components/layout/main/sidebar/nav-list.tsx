import React, { memo, useState } from 'react';

import { ScrollShadow } from '@nextui-org/scroll-shadow';
import { ChevronDownIcon } from 'lucide-react';

import { NavButton } from '@/components/layout/main/sidebar/nav-button.tsx';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion.tsx';
import { SIDEBAR_MAP } from '@/consts/sidebar.tsx';

interface INavListProps extends React.ComponentPropsWithoutRef<'div'> {}

export const NavList: React.FC<INavListProps> = memo(() => {
  const [activeIndex, setActiveIndex] = useState<string[]>(SIDEBAR_MAP.map(({ name }) => name));

  return (
    <ScrollShadow hideScrollBar className="h-full flex-1 overflow-y-scroll pb-8" visibility="bottom">
      <Accordion
        type="multiple"
        className="flex w-full flex-col gap-1 text-xs text-slateA-8 text-opacity-70"
        value={activeIndex}
        onValueChange={setActiveIndex}
      >
        {SIDEBAR_MAP.map(({ items, name, icon, label, path }, i) => (
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
                    {label}
                  </NavButton>
                </AccordionTrigger>
                <AccordionContent className="flex flex-col gap-1 first:mt-1">
                  {items.map(({ label: subLabel, path: subPath }, index) => (
                    <NavButton key={index} to={subPath}>
                      {subLabel}
                    </NavButton>
                  ))}
                </AccordionContent>
              </>
            ) : (
              <NavButton key={i} icon={icon} to={path}>
                {label}
              </NavButton>
            )}
          </AccordionItem>
        ))}
      </Accordion>
    </ScrollShadow>
  );
});
NavList.displayName = 'NavList';
