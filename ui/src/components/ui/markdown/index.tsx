import React, { FC, memo, useMemo } from 'react';

import { useClipboard } from '@mantine/hooks';
import { Copy, CopyCheck, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown, { Components, Options } from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card.tsx';
import { VinesHighlighter } from '@/components/ui/highlighter';
import { FALLBACK_LANG } from '@/components/ui/highlighter/useHighlight.ts';
import { isSingleLine } from '@/components/ui/highlighter/utils.ts';
import { Label } from '@/components/ui/label.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn, execCopy } from '@/utils';

export const MemoizedReactMarkdown: FC<Options> = memo(
  ReactMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children && prevProps.className === nextProps.className,
);

interface IVinesMarkdownProps extends Options {
  className?: string;

  allowHtml?: boolean;
}

export const VinesMarkdown: React.FC<IVinesMarkdownProps> = ({ allowHtml, className, children }) => {
  const { t } = useTranslation();
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
        <Avatar className="size-auto max-w-full select-none rounded">
          <AvatarImage className="aspect-auto w-auto rounded" src={src} alt={alt} />
          <AvatarFallback className="rounded-none p-2 text-xs">{alt}</AvatarFallback>
        </Avatar>
      ),
      pre: (props: any) => {
        const codeProps = props?.children?.props;
        const language = codeProps?.className?.replace('language-', '') || FALLBACK_LANG;
        const codeChild = codeProps?.children;

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const clipboard = useClipboard();

        const code = (Array.isArray(codeChild) ? (codeChild[0] as string) : codeChild)?.trim() ?? '';
        const showLanguage = !isSingleLine(code) && language;

        return (
          <Card className="group/codeblock relative my-2 px-3">
            <VinesHighlighter className="px-3 [&>pre]:m-2 [&>pre]:text-start" language={language}>
              {code}
            </VinesHighlighter>
            <Button
              icon={clipboard.copied ? <CopyCheck /> : <Copy />}
              variant="outline"
              size="small"
              className="absolute right-1 top-1 scale-80 opacity-0 group-hover/codeblock:opacity-75"
              onClick={() => {
                clipboard.copy(code);
                if (!clipboard.copied && !execCopy(code)) toast.error(t('common.toast.copy-failed'));
                else toast.success(t('common.toast.copy-success'));
              }}
            />
            {showLanguage && (
              <Label className="pointer-events-none absolute bottom-2 right-2 opacity-0 transition-opacity group-hover/codeblock:opacity-70">
                {language}
              </Label>
            )}
          </Card>
        );
      },
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
