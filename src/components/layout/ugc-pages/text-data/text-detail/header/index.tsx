import React from 'react';

import { FileText, FileType, FileUp, Import, UploadCloud } from 'lucide-react';

import { ImportParagraph } from '@/components/layout/ugc-pages/text-data/text-detail/import/import-paragraph.tsx';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';

interface ITextDetailHeaderProps {
  textId: string;
}

export const TextDetailHeader: React.FC<ITextDetailHeaderProps> = ({ textId }) => {
  return (
    <header className="flex w-full items-center justify-end px-4 py-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="small" icon={<Import />}>
            导入数据
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            <FileUp size={16} className="mr-1.5 mt-0.5" />
            导入文档
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <UploadCloud size={16} className="mr-1.5 mt-0.5" />从 OSS 导入
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <ImportParagraph textId={textId}>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <FileType size={16} className="mr-1.5 mt-0.5" />
              导入段落
            </DropdownMenuItem>
          </ImportParagraph>
          <ImportParagraph textId={textId} batch>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <FileText size={16} className="mr-1.5 mt-0.5" />
              批量导入段落
            </DropdownMenuItem>
          </ImportParagraph>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};
