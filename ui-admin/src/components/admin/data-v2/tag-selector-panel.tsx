import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { DataTag } from '@/types/data';
import { useMemo, useState } from 'react';

interface TagSelectorPanelProps {
  tags: DataTag[];
  selectedIds: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  emptyText?: string;
}

export function TagSelectorPanel({
  tags,
  selectedIds,
  onChange,
  placeholder = '搜索标签...',
  emptyText = '暂无标签',
}: TagSelectorPanelProps) {
  const [keyword, setKeyword] = useState('');

  const filteredTags = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return tags;
    return tags.filter((tag) => {
      const name = tag.name.toLowerCase();
      const id = tag.id.toLowerCase();
      return name.includes(normalized) || id.includes(normalized);
    });
  }, [keyword, tags]);

  const selectedMap = useMemo(() => {
    return new Map(tags.map((tag) => [tag.id, tag]));
  }, [tags]);

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
      return;
    }
    onChange([...selectedIds, id]);
  };

  return (
    <div className="space-y-3">
      <Input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder={placeholder}
      />

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedIds.map((id) => {
            const tag = selectedMap.get(id);
            return (
              <Badge key={id} variant="secondary">
                {tag?.name || id}
              </Badge>
            );
          })}
        </div>
      )}

      <ScrollArea className="h-40 rounded-md border p-2">
        {filteredTags.length === 0 ? (
          <div className="py-4 text-center text-xs text-muted-foreground">{emptyText}</div>
        ) : (
          <div className="space-y-2">
            {filteredTags.map((tag) => (
              <label key={tag.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={selectedIds.includes(tag.id)}
                  onCheckedChange={() => toggle(tag.id)}
                />
                <span className="truncate">{tag.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{tag.id}</span>
              </label>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
