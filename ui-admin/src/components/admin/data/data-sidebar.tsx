import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { DataCategory } from '@/types/data';
import {
    ChevronDown,
    ChevronRight,
    Database,
    Folder,
    FolderOpen,
} from 'lucide-react';
import { useState } from 'react';

interface DataSidebarProps {
  categories: DataCategory[];
  selectedCategory?: string;
  onSelectCategory: (categoryId: string) => void;
}

export function DataSidebar({
  categories,
  selectedCategory,
  onSelectCategory,
}: DataSidebarProps) {
  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/5">
      {/* 标题 */}
      <div className="flex h-14 items-center border-b px-4">
        <h2 className="text-sm font-semibold">数据分类</h2>
      </div>

      {/* 分类列表 */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-0.5">
          {/* 全部数据 */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'w-full justify-start font-normal',
              !selectedCategory && 'bg-accent text-accent-foreground'
            )}
            onClick={() => onSelectCategory('')}
          >
            <Database className="mr-2 h-4 w-4" />
            全部数据
          </Button>

          <Separator className="my-2" />

          {/* 分类树 */}
          {categories.map((category) => (
            <CategoryTreeItem
              key={category.id}
              category={category}
              selectedCategory={selectedCategory}
              onSelectCategory={onSelectCategory}
              level={0}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

interface CategoryTreeItemProps {
  category: DataCategory;
  selectedCategory?: string;
  onSelectCategory: (categoryId: string) => void;
  level: number;
}

function CategoryTreeItem({
  category,
  selectedCategory,
  onSelectCategory,
  level,
}: CategoryTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;
  const isSelected = selectedCategory === category.id;

  const Icon = hasChildren
    ? isExpanded
      ? FolderOpen
      : Folder
    : Database;

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'w-full justify-start font-normal',
          isSelected && 'bg-accent text-accent-foreground'
        )}
        style={{ paddingLeft: `${(level + 1) * 0.75}rem` }}
        onClick={() => onSelectCategory(category.id)}
      >
        {hasChildren && (
          <button
            className="mr-1 p-0.5 hover:bg-accent rounded"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        )}
        {!hasChildren && <span className="w-5" />}
        <Icon className="mr-2 h-4 w-4" />
        <span className="flex-1 text-left truncate">{category.name}</span>
      </Button>

      {/* 子分类 */}
      {hasChildren && isExpanded && (
        <div className="mt-0.5 space-y-0.5">
          {category.children!.map((child) => (
            <CategoryTreeItem
              key={child.id}
              category={child}
              selectedCategory={selectedCategory}
              onSelectCategory={onSelectCategory}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
