import React from 'react';

import { CheckCircle, CircleX, Waypoints } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useKnowledgeBaseDocuments } from '@/apis/vector';
import { IKnowledgeBaseDocument, KnowledgebaseTaskStatus } from '@/apis/vector/typings.ts';
import { DocumentOperateCell } from '@/components/layout/ugc-pages/text-data/text-detail/document-list/document-operate-cell.tsx';
import { InfiniteScrollingDataTable } from '@/components/ui/data-table/infinite.tsx';
import { VinesLoading } from '@/components/ui/loading';

interface IParagraphListProps {
  knowledgeBaseId: string;
}

export const DocumentsList: React.FC<IParagraphListProps> = ({ knowledgeBaseId }) => {
  const { t } = useTranslation();

  const { data, isLoading } = useKnowledgeBaseDocuments(knowledgeBaseId);

  const list = (data?.list ?? []) as IKnowledgeBaseDocument[];

  return (
    <>
      <InfiniteScrollingDataTable
        className="h-3/5"
        columns={[
          {
            accessorKey: 'id',
            header: t('ugc-page.text-data.detail.tabs.documents.table.id'),
            id: 'id',
            cell: ({ cell }) => {
              const text = (cell.getValue() as string) ?? '';
              return <span>{text?.length > 200 ? text.slice(0, 200) + '...' : text}</span>;
            },
          },
          {
            accessorKey: 'filename',
            header: t('ugc-page.text-data.detail.tabs.documents.table.filename'),
            id: 'filename',
            cell: ({ cell }) => {
              const text = (cell.getValue() as string) ?? '';
              return <span>{text?.length > 200 ? text.slice(0, 200) + '...' : text}</span>;
            },
          },
          {
            accessorKey: 'fileUrl',
            header: t('ugc-page.text-data.detail.tabs.documents.table.file-url'),
            id: 'fileUrl',
            cell: ({ cell }) => {
              const text = (cell.getValue() as string) ?? '';
              return <span>{text?.length > 200 ? text.slice(0, 200) + '...' : text}</span>;
            },
          },
          {
            accessorKey: 'indexStatus',
            header: t('ugc-page.text-data.detail.tabs.documents.table.index-status'),
            id: 'indexStatus',
            cell: ({ cell }) => {
              const status = (cell.getValue() as string) ?? '';
              return status === KnowledgebaseTaskStatus.COMPLETED ? (
                <CheckCircle className="stroke-vines-500" />
              ) : status === KnowledgebaseTaskStatus.FAILED ? (
                <CircleX className="stroke-red-10" />
              ) : (
                <VinesLoading size="sm" />
              );
            },
          },
          {
            accessorKey: 'failedMessage',
            header: t('ugc-page.text-data.detail.tabs.documents.table.failed-message'),
            id: 'failedMessage',
            cell: ({ cell }) => {
              const text = (cell.getValue() as string) ?? '';
              const i18nText = t([`ugc-page.text-data.detail.header.task-list.message.${text}`, text]);
              return <span>{text?.length > 200 ? text.slice(0, 200) + '...' : i18nText}</span>;
            },
          },
          {
            accessorFn: (row) => row,
            id: 'operate',
            header: t('ugc-page.text-data.detail.tabs.documents.table.operate'),
            size: 64,
            cell: DocumentOperateCell,
          },
        ]}
        data={list}
        loading={isLoading}
      />
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
