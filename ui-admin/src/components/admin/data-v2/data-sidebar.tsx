import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { DataCategory, CreateViewDto, UpdateViewDto, DataTag } from '@/types/data';
import { batchUpdateViewSortV2, getViewTagsV2 } from '@/apis/data-v2';
import {
  ChevronDown,
  ChevronRight,
  Database,
  Plus,
  RefreshCw,
  MoreVertical,
  Trash2,
  Edit,
  FolderPlus,
  GripVertical,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { TagSelectorPanel } from './tag-selector-panel';

type CreateViewV2Dto = CreateViewDto & { tagIds?: string[] };
type UpdateViewV2Dto = UpdateViewDto & { tagIds?: string[] };

interface DataSidebarV2Props {
  teamId: string;
  categories: DataCategory[];
  selectedCategory?: string;
  availableTags: DataTag[];
  onSelectCategory: (categoryId: string) => void;
  onCreateCategory: (data: CreateViewV2Dto) => void;
  onUpdateCategory: (categoryId: string, data: UpdateViewV2Dto) => void;
  onDeleteCategory: (categoryId: string) => void;
  onRefresh: () => void;
}

export function DataSidebarV2({
  teamId,
  categories,
  selectedCategory,
  availableTags,
  onSelectCategory,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onRefresh,
}: DataSidebarV2Props) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryTagIds, setNewCategoryTagIds] = useState<string[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>(undefined);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isResizing, setIsResizing] = useState(false);
  const [collapseAllVersion, setCollapseAllVersion] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth >= 200 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const contentWidth = sidebarWidth - 24;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const flattenCategories = (cats: DataCategory[]): DataCategory[] => {
    const result: DataCategory[] = [];
    const flatten = (items: DataCategory[]) => {
      for (const item of items) {
        result.push(item);
        if (item.children && item.children.length > 0) {
          flatten(item.children);
        }
      }
    };
    flatten(cats);
    return result;
  };

  const allCategories = flattenCategories(categories);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    if (!teamId) {
      toast.error('请先填写团队 ID');
      return;
    }

    const activeItem = allCategories.find((cat) => cat.id === active.id);
    const overItem = allCategories.find((cat) => cat.id === over.id);

    if (!activeItem || !overItem) {
      return;
    }

    if (activeItem.parentId !== overItem.parentId) {
      toast.error('只能在同一层级内调整顺序');
      return;
    }

    const siblings = allCategories.filter(
      (cat) => cat.parentId === activeItem.parentId
    );

    const oldIndex = siblings.findIndex((item) => item.id === active.id);
    const newIndex = siblings.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reorderedItems = arrayMove(siblings, oldIndex, newIndex);
    const updates = reorderedItems.map((item, index) => ({
      id: item.id,
      sort: index,
    }));

    try {
      await batchUpdateViewSortV2(teamId, updates);
      toast.success('排序已更新');
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || '更新排序失败');
    }
  };

  const handleCreateSubmit = () => {
    if (!newCategoryName.trim()) return;
    if (!teamId) {
      toast.error('请先填写团队 ID');
      return;
    }

    onCreateCategory({
      name: newCategoryName.trim(),
      description: newCategoryDescription.trim() || undefined,
      parentId: selectedParentId === '__root__' ? undefined : selectedParentId,
      isPublic: true,
      tagIds: newCategoryTagIds,
    });

    setNewCategoryName('');
    setNewCategoryDescription('');
    setNewCategoryTagIds([]);
    setSelectedParentId(undefined);
    setCreateDialogOpen(false);
  };

  const handleOpenCreateDialog = (parentId?: string) => {
    setSelectedParentId(parentId || '__root__');
    setCreateDialogOpen(true);
  };

  const flattenCategoriesWithLevel = (
    cats: DataCategory[],
    level = 0
  ): Array<DataCategory & { displayLevel: number }> => {
    const result: Array<DataCategory & { displayLevel: number }> = [];
    for (const cat of cats) {
      result.push({ ...cat, displayLevel: level });
      if (cat.children && cat.children.length > 0) {
        result.push(...flattenCategoriesWithLevel(cat.children, level + 1));
      }
    }
    return result;
  };

  const flatCategories = flattenCategoriesWithLevel(categories);

  return (
    <div
      className="relative flex h-full flex-col border-r bg-muted/5"
      style={{ width: `${sidebarWidth}px` }}
    >
      <div className="flex h-14 items-center justify-between border-b px-4">
        <h2 className="text-sm font-semibold">数据视图</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs hover:bg-accent/80"
            onClick={() => setCollapseAllVersion((v) => v + 1)}
            title="收起所有节点"
          >
            收起
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onRefresh}
            title="刷新"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="创建视图"
                onClick={() => handleOpenCreateDialog()}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>创建数据视图</DialogTitle>
                <DialogDescription>
                  创建一个新的数据视图来组织您的资产
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">名称</Label>
                  <Input
                    id="name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="输入视图名称"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">描述</Label>
                  <Textarea
                    id="description"
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                    placeholder="输入视图描述（可选）"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent">父视图</Label>
                  <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                    <SelectTrigger id="parent">
                      <SelectValue placeholder="无（创建为顶级视图）" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__root__">无（创建为顶级视图）</SelectItem>
                      {flatCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {'\u00A0'.repeat(cat.displayLevel * 4)}
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>默认筛选标签</Label>
                  <TagSelectorPanel
                    tags={availableTags}
                    selectedIds={newCategoryTagIds}
                    onChange={setNewCategoryTagIds}
                    emptyText="暂无可用标签"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  取消
                </Button>
                <Button onClick={handleCreateSubmit}>创建</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-0.5" style={{ maxWidth: '100%', overflow: 'hidden' }}>
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

          {categories.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              暂无视图
              <br />
              点击右上角 + 创建新视图
            </div>
          ) : (
            <div style={{ maxWidth: '100%' }}>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={allCategories.map((cat) => cat.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {categories.map((category) => (
                    <CategoryTreeItem
                      key={category.id}
                      teamId={teamId}
                      category={category}
                      availableTags={availableTags}
                      selectedCategory={selectedCategory}
                      onSelectCategory={onSelectCategory}
                      onUpdateCategory={onUpdateCategory}
                      onDeleteCategory={onDeleteCategory}
                      onCreateSubCategory={handleOpenCreateDialog}
                      level={0}
                      contentWidth={contentWidth}
                      collapseAllVersion={collapseAllVersion}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>
      </ScrollArea>

      <div
        className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/20 active:bg-primary/40 transition-colors"
        onMouseDown={handleMouseDown}
        style={{ cursor: isResizing ? 'col-resize' : 'col-resize' }}
      />
    </div>
  );
}

interface CategoryTreeItemProps {
  teamId: string;
  category: DataCategory;
  availableTags: DataTag[];
  selectedCategory?: string;
  onSelectCategory: (categoryId: string) => void;
  onUpdateCategory: (categoryId: string, data: UpdateViewV2Dto) => void;
  onDeleteCategory: (categoryId: string) => void;
  onCreateSubCategory: (parentId: string) => void;
  level: number;
  contentWidth: number;
  collapseAllVersion: number;
}

function CategoryTreeItem({
  teamId,
  category,
  availableTags,
  selectedCategory,
  onSelectCategory,
  onUpdateCategory,
  onDeleteCategory,
  onCreateSubCategory,
  level,
  contentWidth,
  collapseAllVersion,
}: CategoryTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTagIds, setEditTagIds] = useState<string[]>([]);
  const loadTagsSeqRef = useRef(0);

  const hasChildren = category.children && category.children.length > 0;
  const isSelected = selectedCategory === category.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = Database;

  useEffect(() => {
    setIsExpanded(false);
  }, [collapseAllVersion]);

  useEffect(() => {
    if (!editDialogOpen) return;
    if (!teamId) {
      toast.error('请先填写团队 ID');
      setEditDialogOpen(false);
      return;
    }
    const seq = (loadTagsSeqRef.current += 1);
    void (async () => {
      try {
        const tags = await getViewTagsV2(teamId, category.id);
        if (loadTagsSeqRef.current !== seq) return;
        setEditTagIds(tags);
      } catch (error: any) {
        if (loadTagsSeqRef.current !== seq) return;
        toast.error(error?.message || '加载视图标签失败');
      }
    })();
  }, [editDialogOpen, teamId, category.id]);

  const handleOpenEditDialog = () => {
    setEditName(category.name);
    setEditDescription(category.description || '');
    setEditDialogOpen(true);
  };

  const handleEditSubmit = () => {
    if (!editName.trim()) return;
    if (!teamId) {
      toast.error('请先填写团队 ID');
      return;
    }

    onUpdateCategory(category.id, {
      name: editName.trim(),
      description: editDescription.trim() || undefined,
      tagIds: editTagIds,
    });

    setEditDialogOpen(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, maxWidth: '100%', overflow: 'hidden' }}
      className="w-full"
    >
      <div className="group relative flex items-center w-full min-w-0">
        <div
          {...attributes}
          {...listeners}
          className="absolute left-0 h-full flex items-center px-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          style={{ paddingLeft: `${level * 0.75}rem` }}
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </div>

        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'w-full justify-start font-normal pr-10 overflow-hidden min-w-0',
            isSelected && 'bg-accent text-accent-foreground'
          )}
          style={{
            paddingLeft: `${(level + 1) * 0.75 + 1.5}rem`,
            maxWidth: `${contentWidth}px`,
          }}
          onClick={() => onSelectCategory(category.id)}
        >
          {hasChildren && (
            <span
              className="mr-1 p-0.5 hover:bg-accent rounded inline-flex items-center cursor-pointer"
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
            </span>
          )}
          {!hasChildren && <span className="w-5" />}
          <Icon className="mr-2 h-4 w-4" />
          <span className="flex-1 text-left truncate">{category.name}</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleOpenEditDialog}>
              <Edit className="mr-2 h-4 w-4" />
              编辑视图
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onCreateSubCategory(category.id)}
            >
              <FolderPlus className="mr-2 h-4 w-4" />
              添加子视图
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                if (confirm(`确定要删除视图 "${category.name}" 吗？`)) {
                  onDeleteCategory(category.id);
                }
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑视图</DialogTitle>
            <DialogDescription>
              修改视图的名称、描述与默认筛选标签
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">名称</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="输入视图名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">描述</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="输入视图描述（可选）"
              />
            </div>
            <div className="space-y-2">
              <Label>默认筛选标签</Label>
              <TagSelectorPanel
                tags={availableTags}
                selectedIds={editTagIds}
                onChange={setEditTagIds}
                emptyText="暂无可用标签"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleEditSubmit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {hasChildren && isExpanded && (
        <div className="mt-0.5 space-y-0.5 w-full">
          {category.children!.map((child) => (
            <CategoryTreeItem
              key={child.id}
              teamId={teamId}
              category={child}
              availableTags={availableTags}
              selectedCategory={selectedCategory}
              onSelectCategory={onSelectCategory}
              onUpdateCategory={onUpdateCategory}
              onDeleteCategory={onDeleteCategory}
              onCreateSubCategory={onCreateSubCategory}
              level={level + 1}
              contentWidth={contentWidth}
              collapseAllVersion={collapseAllVersion}
            />
          ))}
        </div>
      )}
    </div>
  );
}
