import React from 'react';

import { FileText, FileType, FileUp, Import, UploadCloud } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { TaskList } from '@/components/layout/ugc-pages/text-data/text-detail/header/task-list.tsx';
import { ImportFile } from '@/components/layout/ugc-pages/text-data/text-detail/import/import-file.tsx';
import { ImportOSS } from '@/components/layout/ugc-pages/text-data/text-detail/import/import-oss.tsx';
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
  const { t } = useTranslation();
  return (
    <header className="flex w-full items-center justify-end gap-2 pb-2">
      <TaskList knowledgeBaseId={textId} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="small" icon={<Import />}>
            {t('ugc-page.text-data.detail.header.import.button')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <ImportFile textId={textId}>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <FileUp size={16} className="mr-1.5 mt-0.5" />
              {t('ugc-page.text-data.detail.header.import.options.file')}
            </DropdownMenuItem>
          </ImportFile>
          <DropdownMenuSeparator />
          <ImportOSS textId={textId}>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <UploadCloud size={16} className="mr-1.5 mt-0.5" />
              {t('ugc-page.text-data.detail.header.import.options.oss')}
            </DropdownMenuItem>
          </ImportOSS>
          <DropdownMenuSeparator />
          <ImportParagraph textId={textId}>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <FileType size={16} className="mr-1.5 mt-0.5" />
              {t('ugc-page.text-data.detail.header.import.options.paragraph')}
            </DropdownMenuItem>
          </ImportParagraph>
          <ImportParagraph textId={textId} batch>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <FileText size={16} className="mr-1.5 mt-0.5" />
              {t('ugc-page.text-data.detail.header.import.options.paragraph-batch')}
            </DropdownMenuItem>
          </ImportParagraph>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};
