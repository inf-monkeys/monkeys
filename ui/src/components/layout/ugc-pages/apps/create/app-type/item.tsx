import React from 'react';

import { useTranslation } from 'react-i18next';

import { ICreateAppType } from '@/components/layout/ugc-pages/apps/create/app-type/typings.ts';
import { VinesIcon } from '@/components/ui/vines-icon';
import { cn } from '@/utils';

export const AppTypeItem: React.FC<{
  type: ICreateAppType;
  selected: boolean;
  onSelect: (type: ICreateAppType) => void | Promise<void>;
}> = ({ type, selected, onSelect }) => {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        'flex-1 cursor-pointer rounded-md p-4 outline transition-all [&_*]:transition-all',
        selected
          ? 'outline-[3px] outline-[--tw-ring-color] ring-vines-500'
          : 'outline-[2px] outline-[hsl(var(--border))]',
      )}
      onClick={() => onSelect(type)}
    >
      <div className="flex gap-3">
        <div>
          <VinesIcon src={type === 'agent' ? 'lucide:bot:#ceefc5' : 'lucide:server:#ceefc5'} size="md" />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex w-full items-center justify-between">
            <span className="text-base">{t(`ugc-page.app.create.dialog.type.${type}.label`)}</span>
            <span
              className={cn(
                'button-theme-primary rounded-md px-2 py-1 text-xs',
                selected ? 'bg-[--bg-color] text-white' : 'outline outline-[1px] outline-[hsl(var(--border))]',
              )}
            >
              {t(`ugc-page.app.create.dialog.type.${type}.tag`)}
            </span>
          </div>
          <ul className="list-disc space-y-1 pl-5">
            {(t(`ugc-page.app.create.dialog.type.${type}.descriptions`, { returnObjects: true }) as string[]).map(
              (desc, index) => (
                <li className="text-xs opacity-65 " key={index}>
                  {desc}
                </li>
              ),
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};
