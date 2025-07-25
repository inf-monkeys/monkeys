import React, { useCallback, useEffect, useState } from 'react';

import { createLazyFileRoute } from '@tanstack/react-router';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TableDatabase } from 'src/components/layout/ugc-pages/table-data/table/detail';

import { useDatabase, useDatabaseTables } from '@/apis/table-data';
import { TableDetailHeader } from '@/components/layout/ugc-pages/table-data/table/detail/header';
import { VirtuaDatabaseTableList } from '@/components/layout/ugc-pages/table-data/table/virtua-sidebar';
import { Button } from '@/components/ui/button';
import { VinesLoading } from '@/components/ui/loading';
import { Separator } from '@/components/ui/separator.tsx';
import { Tabs, TabsList } from '@/components/ui/tabs.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn, getI18nContent } from '@/utils';

const TableDataDetail: React.FC = () => {
  const { t } = useTranslation();

  const { databaseId } = Route.useParams();

  const { data: tableDetail } = useDatabase(databaseId);
  const { data: tableList, isLoading } = useDatabaseTables(databaseId);

  const [tableId, setTableId] = useState('');
  const [visible, setVisible] = useState(true);

  const displayName = tableDetail?.displayName;

  const [height, setHeight] = useState(0);
  const containerRef = useCallback((node: HTMLDivElement) => {
    if (node) {
      setHeight(node.getBoundingClientRect().height - 60);
    }
  }, []);

  const isEmpty = !tableList?.length;
  useEffect(() => {
    if (tableList && !isEmpty) {
      setTableId(tableList[0].name);
    }
    if (isEmpty) {
      setTableId('');
    }
  }, [tableList]);

  return (
    <Tabs className="size-full" value={tableId} onValueChange={setTableId}>
      <main ref={containerRef} className="flex size-full">
        <motion.div
          className="flex size-full max-w-64 flex-col gap-global overflow-hidden"
          initial={{ width: 256, paddingRight: 16 }}
          animate={{
            width: visible ? 256 : 0,
            paddingRight: visible ? 16 : 0,
          }}
        >
          <header className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  icon={<Undo2 />}
                  variant="outline"
                  size="small"
                  onClick={() => {
                    history.back();
                  }}
                />
              </TooltipTrigger>
              <TooltipContent>{t('common.utils.back')}</TooltipContent>
            </Tooltip>
            <h1 className="line-clamp-1 text-base font-bold">
              {displayName ? getI18nContent(displayName) : t('ugc-page.table-data.detail.title')}
            </h1>
          </header>
          <TabsList className="!h-auto bg-transparent">
            {isEmpty ? (
              <div className="vines-center size-full" style={{ height }}>
                <p className="text-gray-500">{t('common.load.empty')}</p>
              </div>
            ) : height ? (
              <VirtuaDatabaseTableList data={tableList} height={height} />
            ) : null}
          </TabsList>
        </motion.div>
        <Separator orientation="vertical" className="vines-center mx-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="group z-10 flex h-4 w-3.5 cursor-pointer items-center justify-center rounded-sm border bg-border px-0.5 transition-opacity hover:opacity-75 active:opacity-95"
                onClick={() => setVisible(!visible)}
              >
                <ChevronRight className={cn(visible && 'scale-x-[-1]')} />
              </div>
            </TooltipTrigger>
            <TooltipContent>{visible ? t('common.sidebar.hide') : t('common.sidebar.show')}</TooltipContent>
          </Tooltip>
        </Separator>
        <div className="relative size-full flex-1">
          <AnimatePresence>
            {isLoading ? (
              <motion.div
                className="vines-center absolute left-0 top-0 size-full"
                key="text-data-detail-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <VinesLoading />
              </motion.div>
            ) : (
              <>
                <TableDetailHeader database={tableDetail!} />
                <motion.div
                  key={tableId}
                  className="mt-2 size-full"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                >
                  <TableDatabase database={tableDetail!} tableId={tableId} />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </main>
    </Tabs>
  );
};

export const Route = createLazyFileRoute('/$teamId/table-data/$databaseId/')({
  component: TableDataDetail,
});
