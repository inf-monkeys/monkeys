import React, { FC, memo, useMemo } from 'react';

import { ExternalLink } from 'lucide-react';
import ReactMarkdown, { Components, Options } from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils';

export const MemoizedReactMarkdown: FC<Options> = memo(
  ReactMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children && prevProps.className === nextProps.className,
);

interface IVinesMarkdownProps extends Options {
  className?: string;

  allowHtml?: boolean;
}

export const VinesMarkdown: React.FC<IVinesMarkdownProps> = ({ allowHtml, className, children }) => {
  const components: Components = useMemo(
    () => ({
      a: ({ href, children }) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              className="flex items-center gap-1 underline hover:decoration-2 [&>*]:cursor-pointer"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={14} className="-mb-1" />
              <Label>{children}</Label>
            </a>
          </TooltipTrigger>
          <TooltipContent align="start">点击将跳转到外部网站，请注意安全</TooltipContent>
        </Tooltip>
      ),
      img: ({ src, alt }) => (
        <Avatar className="w-auto select-none rounded">
          <AvatarImage className="aspect-auto w-auto rounded" src={src} alt={alt} />
          <AvatarFallback className="rounded-none p-2 text-xs">{alt}</AvatarFallback>
        </Avatar>
      ),
    }),
    [],
  );

  const rehypePlugins = useMemo(() => [allowHtml && rehypeRaw, rehypeKatex].filter(Boolean) as any, [allowHtml]);
  const remarkPlugins = useMemo(() => [remarkGfm, remarkMath, remarkBreaks], []);

  return (
    <MemoizedReactMarkdown
      className={cn('prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0', className)}
      components={components}
      rehypePlugins={rehypePlugins}
      remarkPlugins={remarkPlugins}
    >
      {children}
    </MemoizedReactMarkdown>
  );
};
