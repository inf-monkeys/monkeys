import React, { useState } from 'react';

import { createFileRoute, Link } from '@tanstack/react-router';

import { CircularProgress } from '@nextui-org/progress';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Undo2 } from 'lucide-react';

import { useVectorCollection } from '@/apis/vector';
import { TextDetailHeader } from '@/components/layout/ugc-pages/text-data/text-detail/header';
import { ParagraphList } from '@/components/layout/ugc-pages/text-data/text-detail/paragraph-list';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator.tsx';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils';

const TextDataDetail: React.FC = () => {
  const { textId } = Route.useParams();
  const { data: detail, isLoading } = useVectorCollection(textId);

  const [activeTab, setActiveTab] = useState('paragraph');
  const [visible, setVisible] = useState(true);

  const displayName = detail?.displayName;

  return (
    <Tabs className="size-full" value={activeTab} onValueChange={setActiveTab}>
      <main className="flex size-full">
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
                <Link to="/$teamId/text-data">
                  <Button icon={<Undo2 />} variant="outline" size="small" className="-m-1 -ml-0.5 -mr-2 scale-85" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>返回</TooltipContent>
            </Tooltip>
            <h1 className="line-clamp-1 text-2xl font-bold">{displayName ? displayName : '文本数据'}</h1>
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
                <TextDetailHeader textId={textId} />
                <motion.div
                  key={activeTab}
                  className="mt-2 size-full"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'paragraph' && <ParagraphList textId={textId} />}
                </motion.div>
              </>
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
