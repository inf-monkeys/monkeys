import React, { useState } from 'react';

import { DialogTrigger } from '@radix-ui/react-dialog';
import { get, isEmpty } from 'lodash';
import { MoreVertical, Pencil, Settings2, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { deleteWorkspacePage, toggleWorkspacePagePin } from '@/apis/pages';
import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Input } from '@/components/ui/input.tsx';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';

interface ITabMenuProps extends React.ComponentPropsWithoutRef<'div'> {}

export const TabMenu: React.FC<ITabMenuProps> = () => {
  const { workflowId, page, pages, pageId, navigateTo, pagesMutate, setPages } = useVinesPage();

  const { visibleCustomSetting, setVisibleCustomSetting } = usePageStore();

  const [toggleNameDialogVisible, setToggleNameDialogVisible] = useState(false);
  const [pageDisplayName, setPageDisplayName] = useState(page?.displayName ?? '');

  const handleDeletePage = async () => {
    toast(`确定要删除「${page?.displayName ?? '未知视图'}」吗？`, {
      action: {
        label: '确定',
        onClick: async () => {
          const newPages = await deleteWorkspacePage(workflowId, pageId);

          if (newPages) {
            await pagesMutate(newPages, { revalidate: false });
            const newPageId = newPages.at(-1)?._id;
            if (newPageId) {
              await navigateTo(newPageId);
            }
          }
        },
      },
    });
  };

  const handleRenamePage = async () => {
    if (!pages) return;
    const currentPage = pages.findIndex(({ _id }) => _id === pageId);
    if (currentPage === -1) return;

    const newPages = [...pages];
    newPages[currentPage].displayName = pageDisplayName;
    toast.promise(setPages(newPages), {
      loading: '正在保存...',
      success: '保存成功',
      error: '保存失败',
    });
  };

  const isPin = get(page, 'pinned', false);

  const handlePinPage = async (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!pages) return;
    const currentPage = pages.findIndex(({ _id }) => _id === pageId);
    if (currentPage === -1) return;

    toast.promise(toggleWorkspacePagePin(pageId, !isPin), {
      loading: '正在标星中...',
      success: (newPage) => {
        if (newPage) {
          const newPages = [...pages];
          newPages[currentPage].pinned = newPage.pinned;
          toast.promise(setPages(newPages), {
            loading: '正在保存...',
            success: '保存成功',
            error: '保存失败',
          });
        }
        return '已标星';
      },
      error: '标星失败',
    });
  };

  return (
    <Dialog open={toggleNameDialogVisible} onOpenChange={setToggleNameDialogVisible}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="!scale-90 [&_svg]:stroke-gold-12" icon={<MoreVertical />} variant="borderless" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DialogTrigger asChild>
              <DropdownMenuItem
                className="flex items-center gap-2"
                onClick={() => setPageDisplayName(page?.displayName ?? '')}
              >
                <Pencil strokeWidth={1.5} size={16} />
                <p>重命名</p>
              </DropdownMenuItem>
            </DialogTrigger>
            <DropdownMenuItem
              className={cn('flex items-center gap-2', isPin && 'text-yellow-9')}
              onClick={handlePinPage}
            >
              <Star
                className={cn(isPin && '[&_polygon]:fill-yellow-9 [&_polygon]:stroke-yellow-9')}
                strokeWidth={1.5}
                size={16}
              />
              <p>{isPin ? '取消' : ''}标星</p>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2"
              onClick={() => setVisibleCustomSetting(!visibleCustomSetting)}
            >
              <Settings2 strokeWidth={1.5} size={16} />
              <p>{visibleCustomSetting ? '关闭' : ''}偏好设置</p>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center gap-2 text-red-10"
              disabled={page?.type === 'process'}
              onClick={handleDeletePage}
            >
              <Trash2 strokeWidth={1.5} size={16} />
              <p>删除视图</p>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>重命名视图</DialogTitle>
        </DialogHeader>
        <div className="gap-4 py-4">
          <Input
            placeholder={page?.displayName ?? '请输入视图名称'}
            maxLength={16}
            value={pageDisplayName}
            onChange={setPageDisplayName}
          />
        </div>
        <DialogFooter>
          <Button
            variant="solid"
            onClick={() => {
              if (isEmpty(pageDisplayName)) {
                toast.error('请输入有效的内容');
                return;
              } else if (pageDisplayName !== page?.displayName) {
                void handleRenamePage();
              }
              setToggleNameDialogVisible(false);
            }}
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
