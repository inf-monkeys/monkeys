import React, { useCallback, useEffect, useState } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { CircularProgress } from '@nextui-org/progress';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Undo2 } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';

import { useDatabase, useDatabaseTables } from '@/apis/table-data';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator.tsx';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils';

const TableDataDetail: React.FC = () => {
  const { tableId } = Route.useParams();

  const { data: tableDetail } = useDatabase(tableId);
  const { data: tableList, isLoading } = useDatabaseTables(tableId);

  const [activeTab, setActiveTab] = useState('paragraph');
  const [visible, setVisible] = useState(true);

  const displayName = tableDetail?.[0]?.name;

  const [height, setHeight] = useState(0);
  const containerRef = useCallback((node: HTMLDivElement) => {
    if (node) {
      setHeight(node.getBoundingClientRect().height - 60);
    }
  }, []);

  useEffect(() => {
    if (tableList && tableList?.length) {
      setActiveTab(tableList[0]._id);
    }
  }, [tableList]);

  return (
    <Tabs className="size-full" value={activeTab} onValueChange={setActiveTab}>
      <main ref={containerRef} className="flex size-full">
        <motion.div
          className="flex size-full max-w-64 flex-col gap-4 overflow-clip"
          initial={{ width: 256, paddingRight: 16 }}
          animate={{
            width: visible ? 256 : 0,
            paddingRight: visible ? 16 : 0,
            transition: { duration: 0.2 },
          }}
        >
          <header className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  icon={<Undo2 />}
                  variant="outline"
                  size="small"
                  className="-m-1 -ml-0.5 -mr-2 scale-85"
                  onClick={() => {
                    history.back();
                  }}
                />
              </TooltipTrigger>
              <TooltipContent>返回</TooltipContent>
            </Tooltip>
            <h1 className="line-clamp-1 text-2xl font-bold">{displayName ? displayName : '表格数据'}</h1>
          </header>
          <TabsList className="!h-auto bg-transparent">
            {height && (
              <Virtuoso
                className="w-full"
                style={{ height }}
                data={tableList}
                itemContent={(_, table) => (
                  <TabsTrigger
                    value={table._id}
                    className="mb-2 h-10 w-full justify-start data-[state=active]:border data-[state=active]:border-input data-[state=active]:font-normal"
                  >
                    {table.name}
                  </TabsTrigger>
                )}
              />
            )}
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
            <TooltipContent>{visible ? '收起' : '展开'}</TooltipContent>
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
                transition={{ duration: 0.2 }}
              >
                <CircularProgress
                  className="[&_circle:last-child]:stroke-vines-500"
                  size="lg"
                  aria-label="Loading..."
                />
              </motion.div>
            ) : (
              <>
                <motion.div
                  key={activeTab}
                  className="mt-2 size-full"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div>{activeTab}</div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </main>
    </Tabs>
  );
};

export const Route = createFileRoute('/$teamId/table-data/$tableId/')({
  component: TableDataDetail,
});
