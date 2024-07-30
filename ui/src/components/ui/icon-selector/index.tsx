import React, { memo, useEffect, useMemo, useRef, useState } from 'react';

import { I18nValue } from '@inf-monkeys/monkeys';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { ICONS_CATEGORIES } from '@/components/ui/icon-selector/consts.ts';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { LucideIconRender } from '@/components/ui/vines-icon/lucide/render.tsx';
import { useAppStore } from '@/store/useAppStore';
import { getI18nContent } from '@/utils';
import VinesEvent from '@/utils/events.ts';

interface IVinesIconSelectorProps extends Omit<React.ComponentPropsWithoutRef<'div'>, 'onChange'> {
  onIconSelect?: (iconName: string) => void | Promise<void>;
}

export const VinesIconSelector: React.FC<IVinesIconSelectorProps> = memo(({ children, onIconSelect }) => {
  const { t } = useTranslation();

  const [searchValue, setSearchValue] = useState('');

  const initialized = useAppStore((s) => s.iconInitialized);
  useEffect(() => {
    if (!initialized) {
      VinesEvent.emit('vines-trigger-init-icons');
    }
  }, [initialized]);

  const iconMetadata = useAppStore((s) => s.iconMetadata);

  const iconCateMap = useMemo(() => {
    return ICONS_CATEGORIES.reduce(
      (acc, { name: cateName, label }) => {
        acc[cateName] =
          cateName === 'all'
            ? {
                icons: Object.keys(iconMetadata).reduce((acc2, iconName) => {
                  if (searchValue != '') {
                    if (iconName.includes(searchValue) || iconMetadata[iconName].tags.includes(searchValue)) {
                      acc2.push(iconName);
                    }
                  } else {
                    acc2.push(iconName);
                  }
                  return acc2;
                }, [] as string[]),
                label,
              }
            : {
                icons: Object.keys(iconMetadata).reduce((acc2, iconName) => {
                  if (iconMetadata[iconName].categories.includes(cateName)) {
                    if (searchValue != '') {
                      if (iconName.includes(searchValue) || iconMetadata[iconName].tags.includes(searchValue)) {
                        acc2.push(iconName);
                      }
                    } else {
                      acc2.push(iconName);
                    }
                  }
                  return acc2;
                }, [] as string[]),
                label,
              };
        return acc;
      },
      {} as Record<string, { icons: string[]; label: I18nValue }>,
    );
  }, [initialized, searchValue]);

  const [activeTab, setActiveTab] = useState('all');

  const tabsNode = useRef<HTMLDivElement>(null);

  return (
    <div className="flex h-[calc(100vh-10rem)] w-full flex-col gap-2">
      <div className="relative flex w-full items-center">
        <Search className="absolute ml-3 size-4 shrink-0 opacity-50" />
        <Input
          className="pl-9"
          placeholder={t('components.ui.icon-selector.search.placeholder')}
          onChange={setSearchValue}
        />
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between">
          <div ref={tabsNode} className="max-w-[400px] overflow-x-hidden overflow-y-clip pr-2">
            <TabsList>
              {Object.keys(iconCateMap).map((cateName) => (
                <TabsTrigger value={cateName} key={cateName}>
                  {getI18nContent(iconCateMap[cateName].label)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <div className="relative flex items-center">
            <div className="pointer-events-none absolute -left-4 h-full w-10 bg-gradient-to-l from-background from-60%" />
            <Button
              icon={<ChevronLeft size={16} />}
              variant="outline"
              className="!scale-75"
              onClick={() => tabsNode.current?.scrollBy({ left: -200, behavior: 'smooth' })}
            />
            <Button
              icon={<ChevronRight size={16} />}
              variant="outline"
              className="!scale-75"
              onClick={() => tabsNode.current?.scrollBy({ left: 200, behavior: 'smooth' })}
            />
          </div>
        </div>
        {Object.keys(iconCateMap).map((cateName) => (
          <TabsContent value={cateName} key={cateName}>
            <ScrollArea className="h-[calc(100vh-16rem)]">
              <div className="flex h-full flex-wrap gap-2">
                {iconCateMap[cateName].icons.map((iconName) => {
                  return (
                    <Tooltip key={iconName}>
                      <TooltipTrigger>
                        <div
                          className="cursor-pointer rounded-md bg-gray-3 bg-opacity-60 p-3 transition-all hover:bg-opacity-15"
                          onClick={() => {
                            onIconSelect?.(iconName);
                          }}
                        >
                          <LucideIconRender src={iconName} className="size-6" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">{iconName}</TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
});

VinesIconSelector.displayName = 'VinesIconSelector';
