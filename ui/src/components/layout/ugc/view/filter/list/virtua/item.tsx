import React from 'react';

import { Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IUgcFilterRules } from '@/apis/ugc/typings.ts';
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
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils';

interface IVirtuaUgcFilterListItemProps {
  data: Partial<IUgcFilterRules>;

  currentRuleId: string;
  onClick?: (ruleId: string) => void;
  onClickDelete?: (ruleId: string) => void;
}

export const VirtuaUgcFilterListItem: React.FC<IVirtuaUgcFilterListItemProps> = ({
  data,
  currentRuleId,
  onClickDelete,
  onClick,
}) => {
  const { t } = useTranslation();

  const ruleId = data.id!;
  const ruleName = data.name;

  return (
    <div
      key={ruleId}
      className={cn(
        'group mb-2 flex h-10 cursor-pointer items-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground',
        currentRuleId === ruleId ? 'border border-input bg-background text-accent-foreground shadow-sm' : 'p-[1px]',
      )}
      onClick={() => onClick?.(ruleId)}
    >
      <div className="flex w-full items-center justify-between px-4 text-sm">
        <span>{ruleName}</span>
        {onClickDelete && (
          <AlertDialog>
            <Tooltip content={t('common.utils.delete')}>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <div
                    className="p-2"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Trash size={14} className="opacity-0 transition-opacity group-hover:opacity-75" />
                  </div>
                </AlertDialogTrigger>
              </TooltipTrigger>
            </Tooltip>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t('common.dialog.delete-confirm.title', {
                    type: t('common.type.filter-group'),
                  })}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t('common.dialog.delete-confirm.content', {
                    name: ruleName,
                    type: t('common.type.filter-group'),
                  })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.utils.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={() => onClickDelete(ruleId)}>{t('common.utils.confirm')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
};
