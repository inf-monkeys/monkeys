import React, { useState } from 'react';

import { CircularProgress } from '@nextui-org/progress';
import { AnimatePresence, motion } from 'framer-motion';

import { useTextSearch } from '@/apis/vector';
import { columns } from '@/components/layout/ugc-pages/text-data/text-detail/paragraph-list/consts.tsx';
import { Button } from '@/components/ui/button';
import { InfiniteScrollingDataTable } from '@/components/ui/data-table/infinite.tsx';

interface IParagraphListProps {
  textId: string;
}

export const ParagraphList: React.FC<IParagraphListProps> = ({ textId }) => {
  const [from, setFrom] = useState(30);
  const { data, isLoading } = useTextSearch(textId, { from });

  const hits = data?.hits ?? [];

  return (
    <>
      <InfiniteScrollingDataTable
        className="h-3/5"
        columns={columns}
        data={hits}
        tfoot={
          <tfoot className="relative">
            <tr>
              <td className="absolute w-full py-4 text-center">
                <Button variant="outline" size="small" onClick={() => setFrom((prev) => prev + 30)}>
                  加载更多
                </Button>
              </td>
            </tr>
          </tfoot>
        }
      />
      <div className="mt-2 flex w-full items-center gap-2">
        <AnimatePresence>
          {isLoading && (
            <motion.div
              key="paragraph-loading"
              className="flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.2,
                delay: 0.2,
              }}
            >
              <CircularProgress
                className="-m-3 scale-50 [&_circle:last-child]:stroke-vines-500"
                size="lg"
                aria-label="Loading..."
              />
              <span className="text-xs text-muted-foreground">正在加载数据...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
