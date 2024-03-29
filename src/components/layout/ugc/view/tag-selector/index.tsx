import React, { useState } from 'react';

import { KeyedMutator } from 'swr/_internal';

import { AssetType } from '@inf-monkeys/vines';
import { CheckCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { updateAssetItem, useAssetTagList } from '@/apis/ugc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Tag } from '@/components/ui/tag';
import { cn } from '@/utils';

export interface IUgcTagSelectorProps {
  assetId: string;
  assetType: AssetType;
  assetTags?: string[];
  mutate: KeyedMutator<any>;
}

export const UgcTagSelector = ({ assetType, assetTags, assetId, mutate }: IUgcTagSelectorProps) => {
  const [visible, setVisible] = useState(false);

  const { data: tagsData } = useAssetTagList(assetType);

  const [localTags, setLocalTags] = useState<string[]>([]);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [searchValue, setSearchValue] = useState('');

  const searchedLocalTags = localTags.filter((t) =>
    searchValue && searchValue != '' ? t.includes(searchValue) : true,
  );

  const handleTagClick = (tag: string) => {
    const index = selectedTags.indexOf(tag);
    if (index === -1) {
      setSelectedTags((prev) => [...prev, tag]);
    } else {
      setSelectedTags((prev) => prev.toSpliced(index, 1));
    }
  };

  const handleSearchEnterPress = () => {
    if (localTags.indexOf(searchValue) === -1) {
      setLocalTags((prev) => [...prev, searchValue]);
    } else {
      handleTagClick(searchValue);
    }
  };

  const handleConfirmClick = () => {
    toast.promise(updateAssetItem(assetType, assetId, { assetTags: selectedTags }), {
      success: () => {
        setVisible(false);
        void mutate();
        return '更新成功';
      },
      loading: '更新中...',
      error: '更新失败，请检查网络状况后重试',
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
          setLocalTags(tagsData ?? []);
        }
      }}
    >
      <PopoverTrigger asChild>
        <div
          className="flex cursor-pointer flex-wrap gap-1 text-xs"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {assetTags && assetTags.length > 0 ? (
            assetTags.map((tag, index) => (
              <Tag color="primary" key={index} size="xs" className="cursor-pointer">
                {tag}
              </Tag>
            ))
          ) : (
            <span className="flex flex-nowrap items-center gap-1 opacity-75 transition-opacity hover:opacity-90">
              <Plus size={15} />
              添加标签
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
          placeholder="请输入标签名称，按 Enter 新建"
          value={searchValue}
          onChange={setSearchValue}
          onEnterPress={() => handleSearchEnterPress()}
        />
        <ScrollArea className="h-40">
          <div className="flex flex-col gap-2">
            {searchedLocalTags.length > 0 ? (
              searchedLocalTags.map((tag, index) => {
                const selected = selectedTags && selectedTags.find((t) => t === tag);
                return (
                  <div
                    key={index}
                    className={cn(
                      'transition-color flex cursor-pointer select-none justify-between rounded-sm p-2',
                      selected && 'bg-background',
                    )}
                    onClick={() => handleTagClick(tag)}
                  >
                    <Tag color="primary" size="xs" className="cursor-pointer">
                      {tag}
                    </Tag>
                    {selected && <CheckCircle size={15} />}
                  </div>
                );
              })
            ) : (
              <span className="flex h-16 items-center justify-center">暂无标签</span>
            )}
          </div>
        </ScrollArea>
        <div className="flex items-center justify-end gap-2">
          <Button theme="tertiary" onClick={() => setVisible(false)}>
            取消
          </Button>
          <Button variant="solid" theme="primary" onClick={() => handleConfirmClick()}>
            确认
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
