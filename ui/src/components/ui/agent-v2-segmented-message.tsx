import React, { useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { AgentV2LiveTodoUpdate } from '@/components/ui/agent-v2-live-todo-update';
import { AgentV2TaskCompletion } from '@/components/ui/agent-v2-task-completion';
import { cn } from '@/utils';
import { IParsedSegment } from '@/utils/agent-v2-response-parser';

interface IAgentV2SegmentedMessageProps {
  segments: IParsedSegment[];
  isStreaming?: boolean;
  className?: string;
  animationDelay?: number; // 每段动画延迟时间(ms)
}

const SegmentRenderer: React.FC<{
  segment: IParsedSegment;
  index: number;
  animationDelay: number;
}> = ({ segment, index, animationDelay }) => {
  switch (segment.type) {
    case 'text':
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * (animationDelay / 1000), duration: 0.3 }}
          className="prose prose-sm max-w-none leading-relaxed text-gray-800"
        >
          {segment.content.split('\n').map((line, lineIndex) => (
            <p key={lineIndex} className={cn('mb-2', line.trim() === '' && 'mb-4')}>
              {line || '\u00A0'}
            </p>
          ))}
        </motion.div>
      );

    case 'todo_update':
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: index * (animationDelay / 1000), duration: 0.4, ease: 'easeOut' }}
          className="my-4"
        >
          {segment.data && (
            <AgentV2LiveTodoUpdate todosText={segment.data.todosText} enableLiveUpdate={true} animationDelay={400} />
          )}
        </motion.div>
      );

    case 'task_completion':
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: index * (animationDelay / 1000), duration: 0.4, ease: 'easeOut' }}
          className="my-4"
        >
          {segment.data && <AgentV2TaskCompletion result={segment.data.result} />}
        </motion.div>
      );

    case 'followup_question':
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: index * (animationDelay / 1000), duration: 0.4, ease: 'easeOut' }}
          className="my-4 rounded-lg border border-blue-200 bg-blue-50 p-4"
        >
          <div className="text-sm font-medium text-blue-900">智能体询问</div>
          <div className="mt-2 text-blue-800">{segment.data?.question || '正在准备问题...'}</div>
          {segment.data?.suggestions && segment.data.suggestions.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-medium text-blue-700">建议回答:</div>
              <div className="mt-1 space-y-1">
                {segment.data.suggestions.map((suggestion: string, idx: number) => (
                  <div key={idx} className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">
                    {suggestion}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      );

    default:
      return null;
  }
};

export const AgentV2SegmentedMessage: React.FC<IAgentV2SegmentedMessageProps> = ({
  segments,
  isStreaming = false,
  className,
  animationDelay = 300,
}) => {
  const [visibleSegments, setVisibleSegments] = useState<IParsedSegment[]>([]);

  useEffect(() => {
    if (isStreaming) {
      // 流式展示：逐段显示
      segments.forEach((segment, index) => {
        setTimeout(() => {
          setVisibleSegments((prev) => {
            // 避免重复添加
            if (prev.find((s) => s.id === segment.id)) {
              return prev;
            }
            return [...prev, segment];
          });
        }, index * animationDelay);
      });
    } else {
      // 非流式：立即显示所有段落
      setVisibleSegments(segments);
    }
  }, [segments, isStreaming, animationDelay]);

  return (
    <div className={cn('space-y-2', className)}>
      <AnimatePresence>
        {visibleSegments.map((segment, index) => (
          <SegmentRenderer key={segment.id} segment={segment} index={index} animationDelay={animationDelay} />
        ))}
      </AnimatePresence>

      {/* 流式输入指示器 */}
      {isStreaming && visibleSegments.length < segments.length && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-sm text-gray-500"
        >
          <div className="flex space-x-1">
            <div className="size-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></div>
            <div className="size-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></div>
            <div className="size-2 animate-bounce rounded-full bg-gray-400"></div>
          </div>
          <span>智能体正在思考...</span>
        </motion.div>
      )}
    </div>
  );
};
