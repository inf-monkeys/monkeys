import React from 'react';

import { createFileRoute, Link } from '@tanstack/react-router';

import { CircularProgress } from '@nextui-org/progress';
import { AnimatePresence, motion } from 'framer-motion';
import { Undo2 } from 'lucide-react';

import { useVectorCollection } from '@/apis/vector';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator.tsx';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const TextDataDetail: React.FC = () => {
  const { textId } = Route.useParams();
  const { data: detail, isLoading } = useVectorCollection(textId);

  const displayName = detail?.displayName;

  return (
    <Tabs defaultValue="paragraph" className="size-full">
      <main className="flex size-full">
        <div className="flex size-full max-w-64 flex-col gap-4">
          <header className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/$teamId/text-data">
                  <Button icon={<Undo2 />} variant="outline" size="small" className="-m-1 scale-85" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>返回</TooltipContent>
            </Tooltip>
            <h1 className="text-2xl font-bold">{displayName ? displayName : '文本数据'}</h1>
          </header>
          <TabsList className="flex !h-auto flex-col gap-2 bg-transparent">
            <TabsTrigger
              value="paragraph"
              className="h-10 w-full justify-start data-[state=active]:border data-[state=active]:border-input data-[state=active]:font-normal"
            >
              段落
            </TabsTrigger>
            <TabsTrigger
              value="basic-info"
              className="h-10 w-full justify-start data-[state=active]:border data-[state=active]:border-input data-[state=active]:font-normal"
            >
              基本信息
            </TabsTrigger>
            <TabsTrigger
              value="associated-workflows"
              className="h-10 w-full justify-start data-[state=active]:border data-[state=active]:border-input data-[state=active]:font-normal"
            >
              关联工作流
            </TabsTrigger>
          </TabsList>
        </div>
        <Separator orientation="vertical" className="mx-4" />
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
              <motion.div
                className="size-full"
                key="text-data-detail"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              ></motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </Tabs>
  );
};

export const Route = createFileRoute('/$teamId/text-data/$textId/')({
  component: TextDataDetail,
  beforeLoad: teamIdGuard,
});
