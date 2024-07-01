import { useState } from 'react';

import { KeyedMutator } from 'swr/_internal';

import { AssetType } from '@inf-monkeys/monkeys';
import { CheckCircle, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { createTag, updateAssetTag, useAssetTagList } from '@/apis/ugc';
import { IAssetTag } from '@/apis/ugc/typings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Tag } from '@/components/ui/tag';
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils';

export interface IUgcTagSelectorProps {
  assetId: string;
  assetType: AssetType;
  assetTags?: IAssetTag[];
  mutate: KeyedMutator<any>;
}

export const UgcTagSelector = ({ assetType, assetTags, assetId, mutate }: IUgcTagSelectorProps) => {
  const { t } = useTranslation();

  const [visible, setVisible] = useState(false);

  const { data: tagsData } = useAssetTagList();

  const [localTags, setLocalTags] = useState<IAssetTag[]>([]);

  const [selectedTags, setSelectedTags] = useState<IAssetTag[]>([]);

  const [searchValue, setSearchValue] = useState('');

  const searchedLocalTags = localTags.filter((t) =>
    searchValue && searchValue != '' ? t.name.includes(searchValue) || t._pinyin?.includes(searchValue) : true,
  );

  const handleTagClick = (tagId: string) => {
    const index = selectedTags.findIndex((t) => t.id === tagId);
    if (index === -1) {
      setSelectedTags((prev) => [...prev, localTags.find((x) => x.id === tagId)!]);
    } else {
      setSelectedTags((prev) => prev.toSpliced(index, 1));
    }
  };

  const handleSearchEnterPress = async () => {
    const tag = localTags.find((x) => x.name === searchValue);
    if (!tag) {
      const tagCreated = await createTag(searchValue);
      if (tagCreated) {
        setLocalTags((prev) => [...prev, tagCreated]);
      }
    } else {
      handleTagClick(tag.id);
    }
  };

  const handleConfirmClick = () => {
    toast.promise(updateAssetTag(assetType, assetId, { tagIds: selectedTags.map((x) => x.id) }), {
      success: () => {
        setVisible(false);
        void mutate();
        return t('common.update.success');
      },
      loading: t('common.update.loading'),
      error: t('common.update.error'),
    });
  };

  return (
    <Popover
      open={visible}
      onOpenChange={(v) => {
        setVisible(v);
        if (v) {
          setSelectedTags(assetTags ?? []);
          setSearchValue('');
          setLocalTags(tagsData || []);
        }
      }}
    >
      <PopoverTrigger asChild>
        <div
          className="flex cursor-pointer flex-wrap items-center gap-1 overflow-hidden text-xs"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {assetTags && assetTags.length > 0 ? (
            (() => {
              const rest = assetTags.length - 4;
              return (
                <>
                  {assetTags.slice(0, 4).map((tag, index) => (
                    <Tag color="primary" key={index} size="xs" className="cursor-pointer">
                      {tag.name}
                    </Tag>
                  ))}
                  {rest > 0 && (
                    <Tooltip
                      content={
                        <div className="flex gap-1">
                          {assetTags.slice(4).map((tag, index) => (
                            <Tag color="primary" key={index} size="xs" className="cursor-pointer">
                              {tag.name}
                            </Tag>
                          ))}
                        </div>
                      }
                    >
                      <TooltipTrigger asChild>
                        <span className="px-1">+{rest}</span>
                      </TooltipTrigger>
                    </Tooltip>
                  )}
                </>
              );
            })()
          ) : (
            <span className="flex flex-nowrap items-center gap-1 opacity-75 transition-opacity hover:opacity-90">
              <Plus size={15} />
              {t('components.layout.ugc.view.tag-selector.create-button')}
            </span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="flex w-64 flex-col gap-4"
        onClick={(e) => {
          e.stopPropagation();
        }}
        align="start"
      >
        <Input
          placeholder={t('components.layout.ugc.view.tag-selector.placeholder')}
          value={searchValue}
          onChange={setSearchValue}
          onEnterPress={() => handleSearchEnterPress()}
        />
        <ScrollArea className="h-40">
          <div className="flex flex-col gap-2">
            {searchedLocalTags.length > 0 ? (
              searchedLocalTags.map((tag, index) => {
                const selected = selectedTags && selectedTags.find((t) => t.id === tag.id);
                return (
                  <div
                    key={index}
                    className={cn(
                      'transition-color flex cursor-pointer select-none justify-between rounded-sm p-2',
                      selected && 'bg-background',
                    )}
                    onClick={() => handleTagClick(tag.id)}
                  >
                    <Tag color="primary" size="xs" className="cursor-pointer">
                      {tag.name}
                    </Tag>
                    {selected && <CheckCircle size={15} />}
                  </div>
                );
              })
            ) : (
              <span className="flex h-16 items-center justify-center">{t('common.load.empty')}</span>
            )}
          </div>
        </ScrollArea>
        <div className="flex items-center justify-end gap-2">
          <Button theme="tertiary" onClick={() => setVisible(false)}>
            {t('common.utils.cancel')}
          </Button>
          <Button variant="solid" theme="primary" onClick={() => handleConfirmClick()}>
            {t('common.utils.confirm')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
