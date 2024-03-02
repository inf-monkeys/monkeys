import React from 'react';

import { Pencil } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/utils';

interface ISettingsHeaderProps extends React.ComponentPropsWithoutRef<'div'> {
  avatarUrl?: string;
  name?: string;
  desc?: string;
  onAvatarClick?: () => void | Promise<void>;
  onNameClick?: () => void | Promise<void>;
  onDescClick?: () => void | Promise<void>;
  buttons?: React.ReactNode;
}

export const SettingsHeader: React.FC<ISettingsHeaderProps> = ({
  avatarUrl,
  name,
  desc,
  onAvatarClick,
  onNameClick,
  onDescClick,
  buttons,
  children,
}) => {
  return (
    <div className="flex w-full flex-col rounded-lg border-1 border-border [&>slot>*]:border-t [&>slot>*]:p-4">
      <div className="flex w-full justify-between gap-4 border-none p-4">
        <div className="flex items-center gap-4">
          <div className="group relative cursor-pointer">
            {onAvatarClick ? (
              <Tooltip content="点击修改头像">
                <Avatar className="size-9" onClick={async () => onAvatarClick?.()}>
                  <AvatarImage className="aspect-auto" src={avatarUrl} alt={name} />
                  <AvatarFallback className="rounded-none p-2 text-xs">{(name ?? 'AI').substring(0, 2)}</AvatarFallback>
                </Avatar>
              </Tooltip>
            ) : (
              <Avatar className="size-9">
                <AvatarImage className="aspect-auto" src={avatarUrl} alt={name} />
                <AvatarFallback className="rounded-none p-2 text-xs">{(name ?? 'AI').substring(0, 2)}</AvatarFallback>
              </Avatar>
            )}
          </div>
          <div className="flex flex-col justify-center">
            <div
              className={cn(
                'group flex items-center gap-2 transition-all ',
                onNameClick && 'cursor-pointer hover:opacity-75',
              )}
              onClick={onNameClick}
            >
              <h3 className="line-clamp-1 text-sm font-bold">{name}</h3>
              {onNameClick && <Pencil size={10} className="opacity-0 transition-all group-hover:opacity-100" />}
            </div>
            <div
              className={cn(
                'group flex  items-center gap-2 transition-all',
                onDescClick && 'cursor-pointer hover:opacity-75',
              )}
              onClick={async () => {
                onDescClick?.();
              }}
            >
              <h3 className="text-text2 line-clamp-1 text-xs">{desc}</h3>
              {onDescClick && <Pencil size={10} className="opacity-0 transition-all group-hover:opacity-100" />}
            </div>
          </div>
        </div>

        <div className="flex gap-2">{buttons}</div>
      </div>
      {children}
    </div>
  );
};
