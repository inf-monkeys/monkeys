import React, { memo, useEffect, useMemo, useRef, useState } from 'react';

import { I18nValue } from '@inf-monkeys/monkeys';
import { Meta, UppyFile } from '@uppy/core';
import { ChevronLeft, ChevronRight, Search, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { ICONS_CATEGORIES } from '@/components/ui/icon-selector/consts.ts';
import { IVinesIconSelectorProps } from '@/components/ui/icon-selector/index.tsx';
import { VirtuaIconGrid } from '@/components/ui/icon-selector/virtua';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VinesUploader } from '@/components/ui/vines-uploader';
import { useAppStore } from '@/store/useAppStore';
import { getI18nContent } from '@/utils';
import VinesEvent from '@/utils/events.ts';

const VinesIconSelector: React.FC<IVinesIconSelectorProps> = memo(({ onIconSelect }) => {
  const { t } = useTranslation();

  const [searchValue, setSearchValue] = useState('');
  const [customIcons, setCustomIcons] = useState<string[]>([]);

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

          // 添加自定义图标到"全部"分类
          if (searchValue === '') {
            icons.push(...customIcons);
          } else {
            // 如果搜索值不为空，检查自定义图标是否匹配
            const matchingCustomIcons = customIcons.filter((iconUrl) =>
              iconUrl.toLowerCase().includes(searchValue.toLowerCase()),
            );
            icons.push(...matchingCustomIcons);
          }

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
  }, [initialized, searchValue, customIcons]);

  const [activeTab, setActiveTab] = useState('all');
  const [uploadedNormalIcon, setUploadedNormalIcon] = useState<string>('');
  const [uploadedActiveIcon, setUploadedActiveIcon] = useState<string>('');

  const tabsNode = useRef<HTMLDivElement>(null);

  // 处理自定义上传的图标
  const handleCustomIconUpload = (
    urls: string[],
    files?: UppyFile<Meta, Record<string, never>>[],
    isActive?: boolean,
  ) => {
    if (urls.length > 0) {
      const iconUrl = `custom-icon:${urls[0]}`;

      if (isActive) {
        setUploadedActiveIcon(iconUrl);
      } else {
        setUploadedNormalIcon(iconUrl);
      }

      // 如果两个图标都上传了，则合并它们
      if (isActive && uploadedNormalIcon) {
        const combinedIconUrl = `${uploadedNormalIcon}|${iconUrl}`;
        setCustomIcons((prev) => {
          if (!prev.includes(combinedIconUrl)) {
            return [...prev, combinedIconUrl];
          }
          return prev;
        });
        onIconSelect?.(combinedIconUrl);
        // 重置状态
        setUploadedNormalIcon('');
        setUploadedActiveIcon('');
      } else if (!isActive) {
        // 如果只上传了普通图标
        if (!uploadedActiveIcon) {
          setCustomIcons((prev) => {
            if (!prev.includes(iconUrl)) {
              return [...prev, iconUrl];
            }
            return prev;
          });
          onIconSelect?.(iconUrl);
        }
      }
    }
  };

  // 获取标签页顺序，将自定义上传放在前面
  const getTabOrder = () => {
    const tabNames = Object.keys(iconCateMap);
    const customTabIndex = 1; // 放在"全部"标签之后

    // 将自定义标签插入到指定位置
    const orderedTabs = [...tabNames];
    orderedTabs.splice(customTabIndex, 0, 'custom');

    return orderedTabs;
  };

  const tabOrder = getTabOrder();

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
              {tabOrder.map((cateName) => (
                <TabsTrigger value={cateName} key={cateName}>
                  {cateName === 'custom' ? (
                    <div className="flex items-center gap-1">
                      <Upload size={14} />
                      {t('components.ui.icon-selector.custom.upload')}
                    </div>
                  ) : (
                    getI18nContent(iconCateMap[cateName].label)
                  )}
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
        <TabsContent value="custom">
          <div className="flex h-72 flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/25 p-6">
            <div className="flex w-full flex-col gap-2 overflow-y-auto">
              <VinesUploader
                accept={['png', 'jpg', 'jpeg', 'webp', 'svg']}
                maxSize={5}
                max={1}
                onChange={(urls, files) => handleCustomIconUpload(urls, files, false)}
                basePath="user-files/icons"
                className="w-full"
              >
                <Button variant="outline" className="w-full">
                  {t('components.ui.icon-selector.custom.select-normal-icon')}
                </Button>
              </VinesUploader>
              <VinesUploader
                accept={['png', 'jpg', 'jpeg', 'webp', 'svg']}
                maxSize={5}
                max={1}
                onChange={(urls, files) => handleCustomIconUpload(urls, files, true)}
                basePath="user-files/icons"
                className="w-full"
              >
                <Button variant="outline" className="w-full">
                  {t('components.ui.icon-selector.custom.select-active-icon')}
                </Button>
              </VinesUploader>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
});

VinesIconSelector.displayName = 'VinesIconSelector';

export default VinesIconSelector;
