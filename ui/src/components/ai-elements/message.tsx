import type { UIMessage } from 'ai';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, HTMLAttributes } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/utils/index';

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage['role'];
};

export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn(
      'group flex w-full items-end justify-end gap-2 py-4',
      from === 'user' ? 'is-user' : 'is-assistant flex-row-reverse justify-end',
      className,
    )}
    {...props}
  />
);

const messageContentVariants = cva('flex flex-col gap-2 overflow-hidden rounded-lg text-sm', {
  variants: {
    variant: {
      contained: ['max-w-[80%] px-4 py-3', 'bg-secondary text-foreground'],
      flat: ['max-w-[80%] bg-secondary px-4 py-3 text-foreground'],
    },
  },
  defaultVariants: {
    variant: 'contained',
  },
});

export type MessageContentProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof messageContentVariants>;

export const MessageContent = ({ children, className, variant, ...props }: MessageContentProps) => (
  <div className={cn(messageContentVariants({ variant, className }))} {...props}>
    {children}
  </div>
);

export type MessageAvatarProps = ComponentProps<typeof Avatar> & {
  src: string;
  name?: string;
};

export const MessageAvatar = ({ src, name, className, ...props }: MessageAvatarProps) => (
  <Avatar className={cn('size-8 ring-1 ring-border', className)} {...props}>
    <AvatarImage alt="" className="mb-0 mt-0" src={src} />
    <AvatarFallback>{name?.slice(0, 2) || 'ME'}</AvatarFallback>
  </Avatar>
);
