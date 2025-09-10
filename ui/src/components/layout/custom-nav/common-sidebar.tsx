import React from 'react';

import { isArray } from 'lodash';
import { useTranslation } from 'react-i18next';

import { CommonNavButton } from '@/components/layout/main/sidebar/common-nav-button';
import { useVinesRoute } from '@/components/router/use-vines-route';
import { Accordion, AccordionItem } from '@/components/ui/accordion.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { cn } from '@/utils';

export interface INavListSidebarMap {
  id: string;
  name: string;
  icon: React.ReactNode;
  to: string;
}

export type INavListSidebar = INavListSidebarMap[] | null | React.FC;

interface INavListProps extends React.ComponentPropsWithoutRef<'div'> {
  sidebarMap: INavListSidebar;
}

export const CustomNavCommonSidebar: React.FC<INavListProps> = ({ sidebarMap, className }) => {
  const { t } = useTranslation();

  const { routeCustomSubModuleId } = useVinesRoute();

  return sidebarMap ? (
    isArray(sidebarMap) ? (
      <ScrollArea className={cn('h-full flex-1 overflow-y-scroll', className)} scrollBarDisabled>
        <Accordion type="multiple" className="flex w-full flex-col gap-1 text-xs text-slateA-8 text-opacity-70">
          {sidebarMap.map(({ name, icon, to, id }, i) => {
            return (
              <AccordionItem key={i} value={name}>
                <CommonNavButton key={i} isActive={routeCustomSubModuleId === id} icon={icon} to={to as any}>
                  {t(name)}
                </CommonNavButton>
              </AccordionItem>
            );
          })}
        </Accordion>
      </ScrollArea>
    ) : (
      sidebarMap({ props: {} })
    )
  ) : null;
};
