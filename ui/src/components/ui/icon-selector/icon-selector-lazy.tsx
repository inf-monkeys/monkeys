import React, { memo, useEffect, useMemo, useRef, useState } from 'react';

import { I18nValue } from '@inf-monkeys/monkeys';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { ICONS_CATEGORIES } from '@/components/ui/icon-selector/consts.ts';
import { IVinesIconSelectorProps } from '@/components/ui/icon-selector/index.tsx';
import { VirtuaIconGrid } from '@/components/ui/icon-selector/virtua';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { useAppStore } from '@/store/useAppStore';
import { getI18nContent } from '@/utils';
import VinesEvent from '@/utils/events.ts';

const VinesIconSelector: React.FC<IVinesIconSelectorProps> = memo(({ onIconSelect }) => {
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
    const iconKeys = Object.keys(iconMetadata);

    return ICONS_CATEGORIES.reduce(
      (acc, { name: cateName, label }) => {
        if (cateName === 'all') {
          const icons = iconKeys.reduce((acc2, iconName) => {
            if (searchValue != '') {
              if (iconName.includes(searchValue) || iconMetadata[iconName].tags.includes(searchValue)) {
                acc2.push(iconName);
              }
            } else {
              acc2.push(iconName);
            }
            return acc2;
          }, [] as string[]);

          acc[cateName] = {
            icons,
            label,
          };
        } else {
          const icons = iconKeys.reduce((acc2, iconName) => {
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
          }, [] as string[]);

          acc[cateName] = {
            icons,
            label,
          };
        }

        return acc;
      },
      {} as Record<string, { icons: string[]; label: I18nValue }>,
    );
  }, [initialized, searchValue]);

  const [activeTab, setActiveTab] = useState('all');

  const tabsNode = useRef<HTMLDivElement>(null);

  return (
    <div className="flex h-96 w-full flex-col gap-2">
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
        {Object.entries(iconCateMap).map(([cateName, { icons }]) => (
          <TabsContent value={cateName} key={cateName}>
            <VirtuaIconGrid data={icons} rowCount={8} height={288} onIconSelect={onIconSelect} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
});

VinesIconSelector.displayName = 'VinesIconSelector';

export default VinesIconSelector;
