import { useEffect, useRef, useState } from 'react';

import { CheckCircle, Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { createTag, useAssetTagList } from '@/apis/ugc';
import { IAssetTag } from '@/apis/ugc/typings';

export interface IUploadTagSelectorProps {
  selectedTags: IAssetTag[];
  onTagsChange: (tags: IAssetTag[]) => void;
}

export const UploadTagSelector = ({ selectedTags, onTagsChange }: IUploadTagSelectorProps) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const { data: tagsData } = useAssetTagList();
  const [localTags, setLocalTags] = useState<IAssetTag[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // 初始化标签列表
  useEffect(() => {
    if (tagsData) {
      setLocalTags(tagsData);
    }
  }, [tagsData]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setVisible(false);
      }
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [visible]);

  const searchedLocalTags = localTags.filter((t) =>
    searchValue && searchValue != '' ? t.name.includes(searchValue) || t._pinyin?.includes(searchValue) : true,
  );

  const handleTagClick = (tagId: string) => {
    const index = selectedTags.findIndex((t) => t.id === tagId);
    if (index === -1) {
      const tag = localTags.find((x) => x.id === tagId);
      if (tag) {
        onTagsChange([...selectedTags, tag]);
      }
    } else {
      onTagsChange(selectedTags.filter((t) => t.id !== tagId));
    }
  };

  const handleRemoveTag = (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onTagsChange(selectedTags.filter((t) => t.id !== tagId));
  };

  const handleSearchEnterPress = async () => {
    if (!searchValue.trim()) return;
    const tag = localTags.find((x) => x.name === searchValue);
    if (!tag) {
      try {
        const tagCreated = await createTag(searchValue);
        if (tagCreated) {
          setLocalTags((prev) => [...prev, tagCreated]);
          // 创建新标签后自动选中
          const exists = selectedTags.find((t) => t.id === tagCreated.id);
          if (!exists) {
            onTagsChange([...selectedTags, tagCreated]);
          }
          setSearchValue('');
        }
      } catch (error) {
        console.error('Failed to create tag:', error);
      }
    } else {
      handleTagClick(tag.id);
      setSearchValue('');
    }
  };

  return (
    <div className="relative">
      {/* 触发器 */}
      <div
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          setVisible(!visible);
        }}
        className="flex min-h-[2rem] cursor-pointer flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm transition-colors hover:border-input/80"
      >
        {selectedTags && selectedTags.length > 0 ? (
          <>
            {selectedTags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
              >
                {tag.name}
                <X
                  size={12}
                  className="cursor-pointer hover:text-primary/80"
                  onClick={(e) => handleRemoveTag(tag.id, e)}
                />
              </span>
            ))}
          </>
        ) : (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Plus size={14} />
            <span>{t('components.layout.ugc.view.tag-selector.create-button')}</span>
          </span>
        )}
      </div>

      {/* 弹出层 */}
      {visible && (
        <div
          ref={popoverRef}
          className="absolute left-0 top-full z-50 mt-1 w-64 rounded-md border bg-popover p-3 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 搜索输入框 */}
          <input
            type="text"
            placeholder={t('components.layout.ugc.view.tag-selector.placeholder')}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void handleSearchEnterPress();
              }
            }}
            className="mb-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />

          {/* 标签列表 */}
          <div className="max-h-40 space-y-1 overflow-y-auto">
            {searchedLocalTags.length > 0 ? (
              searchedLocalTags.map((tag) => {
                const selected = selectedTags && selectedTags.find((t) => t.id === tag.id);
                return (
                  <div
                    key={tag.id}
                    onClick={() => handleTagClick(tag.id)}
                    className={`flex cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-sm transition-colors ${
                      selected ? 'bg-primary/10 text-primary' : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <span>{tag.name}</span>
                    {selected && <CheckCircle size={14} className="text-primary" />}
                  </div>
                );
              })
            ) : (
              <div className="flex h-16 items-center justify-center text-sm text-muted-foreground">
                {t('common.load.empty')}
              </div>
            )}
          </div>

          {/* 关闭按钮 */}
          <div className="mt-3 flex justify-end border-t pt-2">
            <button
              onClick={() => setVisible(false)}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {t('common.utils.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

