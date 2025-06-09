import React from 'react';

import { KeyedMutator } from 'swr/_internal';

import { Check, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { IUpdatePageGroupParams, useDeletePageGroup, useUpdateGroupPages } from '@/apis/pages';
import { IPageGroup } from '@/apis/pages/typings.ts';
import { LANGUAGE_MAPPER } from '@/components/layout/workspace/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/input-editor/field/display-name';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog.tsx';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu.tsx';
import { SimpleDisplayNameDialog } from '@/components/ui/input/simple-display-name-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface IGroupItemProps extends React.ComponentPropsWithoutRef<'div'> {
  group: IPageGroup;
  pageId: string;
  mutate: KeyedMutator<IPageGroup[] | undefined>;
}

export const GroupItem: React.FC<IGroupItemProps> = ({
  group: { displayName, pageIds, id, isBuiltIn },
  pageId,
  mutate,
}) => {
  const { t, i18n } = useTranslation();

  const { trigger } = useUpdateGroupPages(id);
  const { trigger: deleteTrigger } = useDeletePageGroup(id);

  const isPinning = pageIds.includes(pageId);

  const handleUpdateGroup = (data: IUpdatePageGroupParams) => {
    toast.promise(trigger(data), {
      loading: t('workspace.wrapper.space.menu.group.update.loading'),
      success: (groups) => {
        void mutate(groups ?? [], { revalidate: false });

        return t('workspace.wrapper.space.menu.group.update.success');
      },
      error: t('workspace.wrapper.space.menu.group.update.error'),
    });
  };

  const handleTogglePin = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();

    handleUpdateGroup({
      pageId,
      mode: isPinning ? 'remove' : 'add',
    });
  };

  const handelDeleteGroup = () => {
    toast.promise(deleteTrigger(), {
      loading: t('workspace.wrapper.space.menu.group.delete.loading'),
      success: (groups) => {
        void mutate(groups ?? [], { revalidate: false });

        return t('workspace.wrapper.space.menu.group.delete.success');
      },
      error: t('workspace.wrapper.space.menu.group.delete.error'),
    });
  };

  const displayText = (() => {
    try {
      // @ts-expect-error
      const realDisplayName = JSON.parse(displayName);
      const currentLanguageKey = LANGUAGE_MAPPER[i18n.language as keyof typeof LANGUAGE_MAPPER] || 'zh-CN';
      const content = realDisplayName[currentLanguageKey];

      // return t([`workspace.wrapper.space.tabs.${content || 'unknown'}`, content || 'Unknown Group']);
      return content ?? 'Unamed Group';
    } catch {
      return displayName;
    }
  })();

  return (
    <DropdownMenuItem className="flex items-center justify-between gap-4" onClick={handleTogglePin}>
      <div className="flex max-w-48 items-center gap-1 break-words">
        {isPinning && <Check strokeWidth={1.5} size={16} />}
        {/* {t([
          `workspace.wrapper.space.menu.group.name-${getI18nContent(displayName) || 'unknown'}`,
          getI18nContent(displayName) || 'Unknown Group',
        ])} */}
        {displayText}
      </div>
      {!isBuiltIn && (
        <div
          className="flex items-center gap-1.5"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <AlertDialog>
            <Tooltip>
              <AlertDialogTrigger asChild>
                <TooltipTrigger asChild>
                  <Button className="-m-2 scale-[0.6]" icon={<Trash2 />} size="small" variant="outline" />
                </TooltipTrigger>
              </AlertDialogTrigger>
              <TooltipContent>{t('workspace.wrapper.space.menu.group.delete.label')}</TooltipContent>
            </Tooltip>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('workspace.wrapper.space.menu.group.delete.title')}</AlertDialogTitle>
                <AlertDialogDescription>{t('workspace.wrapper.space.menu.group.delete.desc')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('workspace.wrapper.space.menu.group.delete.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handelDeleteGroup}>
                  {t('workspace.wrapper.space.menu.group.delete.confirm')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Tooltip>
            <SimpleDisplayNameDialog
              title={t('workspace.wrapper.space.menu.group.rename.label')}
              placeholder={t('workspace.wrapper.space.menu.group.rename.placeholder')}
              initialValue={displayName}
              onFinished={(val) => handleUpdateGroup({ displayName: val })}
            >
              <TooltipTrigger asChild>
                <Button className="-m-2 scale-[0.6]" icon={<Pencil />} size="small" variant="outline" />
              </TooltipTrigger>
            </SimpleDisplayNameDialog>
            <TooltipContent>{t('workspace.wrapper.space.menu.group.rename.label')}</TooltipContent>
          </Tooltip>
        </div>
      )}
    </DropdownMenuItem>
  );
};
