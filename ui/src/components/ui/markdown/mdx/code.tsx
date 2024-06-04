import React from 'react';

import { useClipboard } from '@mantine/hooks';
import { Copy, CopyCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card.tsx';
import { VinesHighlighter } from '@/components/ui/highlighter';
import { languageMap } from '@/components/ui/highlighter/useHighlight.ts';
import { isSingleLine } from '@/components/ui/highlighter/utils.ts';
import { Label } from '@/components/ui/label.tsx';

interface IMdxCodeProps {
  children: string;
  language: (typeof languageMap)[number];
}

export const MdxCode: React.FC<IMdxCodeProps> = ({ children, language }) => {
  const clipboard = useClipboard();

  const code = (Array.isArray(children) ? (children[0] as string) : children)?.trim() ?? '';
  const showLanguage = !isSingleLine(code) && language;
  return (
    <Card className="group/codeblock relative my-2 px-3">
      <VinesHighlighter className="[&>pre]:m-2 [&>pre]:text-start" language={language}>
        {children}
      </VinesHighlighter>
      <Button
        icon={clipboard.copied ? <CopyCheck /> : <Copy />}
        variant="outline"
        size="small"
        className="absolute right-1 top-1 scale-80 opacity-0 group-hover/codeblock:opacity-75"
        onClick={() => clipboard.copy(children)}
      />
      {showLanguage && (
        <Label className="pointer-events-none absolute bottom-2 right-2 opacity-0 transition-opacity group-hover/codeblock:opacity-70">
          {language}
        </Label>
      )}
    </Card>
  );
};
