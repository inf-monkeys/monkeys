import React, { useEffect, useState } from 'react';

import { Waypoints } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useKnowledgeBaseDocuments } from '@/apis/vector';
import { IKnowledgeBaseDocument } from '@/apis/vector/typings.ts';
import { InfiniteScrollingDataTable } from '@/components/ui/data-table/infinite.tsx';

import { columns } from './consts';

interface IParagraphListProps {
  knowledgeBaseId: string;
}

export const DocumentsList: React.FC<IParagraphListProps> = ({ knowledgeBaseId }) => {
  const { t } = useTranslation();

  const { data, isLoading } = useKnowledgeBaseDocuments(knowledgeBaseId);

  const [list, setList] = useState<IKnowledgeBaseDocument[]>([]);
  useEffect(() => {
    setList(data?.list ?? []);
  }, [data?.list]);

  return (
    <>
      <InfiniteScrollingDataTable className="h-3/5" columns={columns} data={list} loading={isLoading} />
      <div className="mt-2 flex w-full items-center gap-4">
        <div className="flex items-center gap-2">
          <Waypoints className="stroke-muted-foreground" size={14} />
          <span className="text-xs text-muted-foreground">
            {t('ugc-page.text-data.detail.tabs.documents.stats.file-count', {
              count: list?.length ?? 0,
            })}
          </span>
        </div>
      </div>
    </>
  );
};
