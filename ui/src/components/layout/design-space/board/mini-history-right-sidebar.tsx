import React from 'react';
import { mutate as swrMutate } from 'swr';

// 隐藏右侧历史栏滚动条（保留滚动能力）
const miniRightSidebarStyles = `
  .mini-right-sidebar-content {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
  }
  .mini-right-sidebar-content::-webkit-scrollbar {
    width: 0px;
    height: 0px;
    display: none; /* Chrome, Safari, Opera */
  }
  /* 等待占位：正方形+中心旋转 */
  @keyframes vinesSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .mini-history-waiting { display: flex; align-items: center; justify-content: center; }
  .mini-history-waiting .spinner { width: 28px; height: 28px; border: 3px solid #e5e7eb; border-top-color: #9ca3af; border-radius: 9999px; animation: vinesSpin 0.9s linear infinite; }
`;
if (typeof document !== 'undefined' && !document.getElementById('mini-right-sidebar-styles')) {
  const styleEl = document.createElement('style');
  styleEl.id = 'mini-right-sidebar-styles';
  styleEl.textContent = miniRightSidebarStyles;
  document.head.appendChild(styleEl);
}

import { useWorkflowExecutionAllOutputs } from '@/apis/workflow/execution/output';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { cn } from '@/utils';
import { newConvertExecutionResultToItemList } from '@/utils/execution';

interface MiniHistoryRightSidebarProps extends React.ComponentPropsWithoutRef<'div'> {
  visible: boolean;
  width?: number;
  onResizeWidth?: (nextWidth: number) => void;
}

/**
 * 右侧：MiniTools 历史记录侧栏（仅在 MiniTools 显示时出现）
 * - 从 ExternalLayerPanel 的历史视图复用样式/逻辑
 */
export const MiniHistoryRightSidebar: React.FC<MiniHistoryRightSidebarProps> = ({
  className,
  visible,
  width = 260,
  onResizeWidth,
  ...rest
}) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [resizing, setResizing] = React.useState(false);
  const rafIdRef = React.useRef<number | null>(null);

  const [workflowId, setWorkflowId] = React.useState<string | null>(null);
  const [historyPage, setHistoryPage] = React.useState<number>(1);
  const [historyPageSize] = React.useState<number>(8);
  const [pendingHistory, setPendingHistory] = React.useState<Array<{ instanceId: string; workflowId?: string | null; time: number; renderData?: any }>>([]);

  React.useEffect(() => {
    const handler = (e: any) => {
      const wf = e?.detail?.workflowId || null;
      setWorkflowId(wf || null);
      // 打开时重置到第一页
      if (wf) setHistoryPage(1);
    };
    window.addEventListener('vines:mini-state', handler as any);
    return () => window.removeEventListener('vines:mini-state', handler as any);
  }, []);

  // 监听任务创建/完成 - 管理等待中的历史占位
  React.useEffect(() => {
    const onCreated = (e: any) => {
      const instanceId = e?.detail?.instanceId;
      const wf = e?.detail?.workflowId || workflowId;
      if (!instanceId || !wf) return;
      setPendingHistory((list) => [{ instanceId, workflowId: wf, time: Date.now() }, ...list.filter((i) => i.instanceId !== instanceId)]);
    };
    const onCompleted = (e: any) => {
      const instanceId = e?.detail?.instanceId;
      if (!instanceId) return;
      const renderData = e?.detail?.render?.data;
      // 立即触发历史接口刷新
      swrMutate(`/api/workflow/executions/all/outputs?limit=1000&page=1`);
      if (renderData) {
        setPendingHistory((list) =>
          list.map((i) => (i.instanceId === instanceId ? { ...i, renderData, time: Date.now() } : i)),
        );
        setTimeout(() => {
          setPendingHistory((list) => list.filter((i) => i.instanceId !== instanceId));
        }, 5000);
      } else {
        setTimeout(() => {
          setPendingHistory((list) => list.filter((i) => i.instanceId !== instanceId));
        }, 1500);
      }
    };
    window.addEventListener('vines:create-placeholder', onCreated as any);
    window.addEventListener('vines:mini-execution-completed', onCompleted as any);
    return () => {
      window.removeEventListener('vines:create-placeholder', onCreated as any);
      window.removeEventListener('vines:mini-execution-completed', onCompleted as any);
    };
  }, [workflowId]);

  // 拉取全部工作流输出数据（用于筛选当前 workflowId 的历史）
  const { data: allOutputsPages } = useWorkflowExecutionAllOutputs({ limit: 1000, page: 1 });
  // 当后端数据返回包含某个 pending 的 instanceId 时，立即移除对应等待项
  React.useEffect(() => {
    try {
      const items = newConvertExecutionResultToItemList(allOutputsPages ?? []);
      const instanceSet = new Set<string>((items || []).map((it: any) => String(it?.instanceId || '')));
      setPendingHistory((list) => list.filter((p) => !instanceSet.has(String(p.instanceId))));
    } catch {}
  }, [allOutputsPages]);

  const onStartResize = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onResizeWidth) return;
      e.preventDefault();
      e.stopPropagation();
      setResizing(true);
    },
    [onResizeWidth],
  );

  React.useEffect(() => {
    if (!resizing) return;
    const handleMove = (e: MouseEvent) => {
      if (!containerRef.current || !onResizeWidth) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        const next = Math.max(220, Math.min(420, rect.right - e.clientX - 12));
        onResizeWidth(next);
      });
    };
    const handleUp = () => setResizing(false);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp, { once: true });
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp as any);
    };
  }, [resizing, onResizeWidth]);

  if (!visible || !workflowId) return null;

  // 历史列表渲染（复用 ExternalLayerPanel 的样式/逻辑）
  const renderHistory = () => {
    try {
      const items = newConvertExecutionResultToItemList(allOutputsPages ?? []);
      const allItems = items.filter((it: any) => it?.workflowId === workflowId && it?.status === 'COMPLETED');
      const totalPages = Math.ceil(allItems.length / historyPageSize) || 1;
      const page = Math.min(Math.max(1, historyPage), totalPages);
      const startIndex = (page - 1) * historyPageSize;
      const endIndex = startIndex + historyPageSize;
      const list = allItems.slice(startIndex, endIndex);

      let waitingList = (pendingHistory || []).filter((p) => p.workflowId === workflowId);
      if (list.length === 0 && waitingList.length === 0)
        return <div style={{ color: '#9ca3af', fontSize: 12, padding: '12px' }}>暂无历史</div>;

      const isImageUrl = (str: string): boolean => {
        if (!str || typeof str !== 'string') return false;
        try {
          const url = new URL(str);
          const ext = url.pathname.toLowerCase().split('.').pop();
          return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext || '');
        } catch {
          return str.startsWith('data:image/');
        }
      };

      const extractDisplayContent = (data: any): { type: 'image' | 'text'; content: string } | null => {
        if (typeof data === 'string') {
          if (isImageUrl(data)) return { type: 'image', content: data };
          try {
            const parsed = JSON.parse(data);
            if (parsed && typeof parsed === 'object' && parsed.outputtext)
              return { type: 'text', content: String(parsed.outputtext) };
          } catch {
            return null;
          }
          return null;
        }
        if (data && typeof data === 'object') {
          if (data.outputtext) return { type: 'text', content: String(data.outputtext) };
          for (const key of ['url', 'imageUrl', 'image', 'src']) {
            if (data[key] && typeof data[key] === 'string' && isImageUrl(data[key]))
              return { type: 'image', content: data[key] };
          }
          return null;
        }
        return null;
      };

      const formatTime = (timestamp: number | string | undefined) => {
        if (!timestamp) return '';
        let ts: any = timestamp;
        if (typeof ts === 'string') {
          ts = parseInt(ts, 10);
          if (isNaN(ts)) return '';
        }
        if (ts < 1e12) ts = ts * 1000;
        const date = new Date(ts);
        if (isNaN(date.getTime())) return '';
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        const ss = String(date.getSeconds()).padStart(2, '0');
        return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
      };

      return (
        <>
          <div style={{ fontSize: 12, color: '#6b7280', padding: '12px 12px 8px 12px' }}>历史记录</div>
          <div className="mini-right-sidebar-content" style={{ flex: 1, overflow: 'auto', columnCount: 2, columnGap: 8, padding: '0 12px 8px 12px', minHeight: 0 }}>
            {(() => {
              const doneInstanceSet = new Set<string>((list || []).map((it: any) => String(it?.instanceId || '')));
              const filteredWaiting = waitingList.filter((p) => !doneInstanceSet.has(String(p.instanceId)));

              const waitingNodes = filteredWaiting.map((p, idx) => {
                const timeStr = formatTime(p.time);
                if (p.renderData) {
                  const displayContent = extractDisplayContent(p.renderData);
                  if (displayContent?.type === 'image') {
                    return (
                      <div key={`pending-${p.instanceId}-${idx}`} style={{ position: 'relative', overflow: 'hidden', border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 8, breakInside: 'avoid', display: 'inline-block', width: '100%' }}>
                        <img src={displayContent.content} style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none' }} alt="历史记录" />
                        {timeStr && (
                          <div style={{ padding: '6px 8px', fontSize: 10, color: '#9ca3af', backgroundColor: '#f9fafb', textAlign: 'center', borderTop: '1px solid #e5e7eb' }}>{timeStr}</div>
                        )}
                      </div>
                    );
                  }
                  if (displayContent?.type === 'text') {
                    return (
                      <div key={`pending-${p.instanceId}-${idx}`} style={{ border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 8, breakInside: 'avoid', display: 'inline-block', width: '100%', overflow: 'hidden' }}>
                        <div style={{ padding: 8, fontSize: 12, maxHeight: 120, overflow: 'auto' }}>
                          <pre style={{ margin: 0, fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{displayContent.content}</pre>
                        </div>
                        {timeStr && (
                          <div style={{ padding: '6px 8px', fontSize: 10, color: '#9ca3af', backgroundColor: '#f9fafb', textAlign: 'center', borderTop: '1px solid #e5e7eb' }}>{timeStr}</div>
                        )}
                      </div>
                    );
                  }
                }
                return (
                  <div
                    key={`pending-${p.instanceId}-${idx}`}
                    className="mini-history-waiting"
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      marginBottom: 8,
                      breakInside: 'avoid',
                      display: 'flex',
                      flexDirection: 'column',
                      width: '100%',
                      overflow: 'hidden',
                      background: '#fff',
                      aspectRatio: '1 / 1',
                      minHeight: 160,
                    }}
                  >
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div className="spinner" />
                    </div>
                    {timeStr && (
                      <div style={{ padding: '6px 8px', fontSize: 10, color: '#9ca3af', backgroundColor: '#f9fafb', textAlign: 'center', borderTop: '1px solid #e5e7eb' }}>{timeStr}</div>
                    )}
                  </div>
                );
              });

              const doneNodes = list
                .map((it: any, idx: number) => {
                const displayContent = extractDisplayContent(it?.render?.data);
                if (!displayContent) return null;
                const timeStr = formatTime(it?.endTime || it?.createTime || it?.startTime);

                if (displayContent.type === 'image') {
                  return (
                    <div
                      key={idx}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', displayContent.content);
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      style={{
                        position: 'relative',
                        overflow: 'hidden',
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        cursor: 'grab',
                        marginBottom: 8,
                        breakInside: 'avoid',
                        display: 'inline-block',
                        width: '100%',
                      }}
                      onMouseDown={(e) => {
                        (e.currentTarget as HTMLDivElement).style.cursor = 'grabbing';
                      }}
                      onMouseUp={(e) => {
                        (e.currentTarget as HTMLDivElement).style.cursor = 'grab';
                      }}
                    >
                      <img src={displayContent.content} style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none' }} alt="历史记录" />
                      {timeStr && (
                        <div style={{ padding: '6px 8px', fontSize: 10, color: '#9ca3af', backgroundColor: '#f9fafb', textAlign: 'center', borderTop: '1px solid #e5e7eb' }}>
                          {timeStr}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div
                    key={idx}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      marginBottom: 8,
                      breakInside: 'avoid',
                      display: 'inline-block',
                      width: '100%',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ padding: 8, fontSize: 12, maxHeight: 120, overflow: 'auto' }}>
                      <pre style={{ margin: 0, fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{displayContent.content}</pre>
                    </div>
                    {timeStr && (
                      <div style={{ padding: '6px 8px', fontSize: 10, color: '#9ca3af', backgroundColor: '#f9fafb', textAlign: 'center', borderTop: '1px solid #e5e7eb' }}>
                        {timeStr}
                      </div>
                    )}
                  </div>
                );
              })
                .filter(Boolean);

              return [...waitingNodes, ...doneNodes];
            })()}
          </div>

          {(() => {
            const total = totalPages;
            if (total <= 1) return null;
            return (
              <div style={{ padding: '8px 12px 12px 12px', borderTop: '1px solid #e5e7eb', width: '100%', flexShrink: 0, backgroundColor: '#fff', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px' }}>
                <Pagination className="w-full" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <PaginationContent className="w-full" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <PaginationItem>
                      <PaginationPrevious onClick={() => setHistoryPage(Math.max(1, page - 1))} style={{ cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }} />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext onClick={() => setHistoryPage(Math.min(total, page + 1))} style={{ cursor: page === total ? 'not-allowed' : 'pointer', opacity: page === total ? 0.5 : 1 }} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            );
          })()}
        </>
      );
    } catch {
      return null;
    }
  };

  return (
    <div
      className={cn('pointer-events-none z-10', className)}
      style={{ position: 'absolute', right: 0, top: 0, height: '100%' }}
      {...rest}
    >
      <div
        ref={containerRef}
        className="pointer-events-auto flex flex-row overflow-hidden rounded-lg border border-neutral-200 bg-white/95 shadow-lg backdrop-blur-sm"
        style={{ width: width + 12, transition: resizing ? 'none' : 'width 160ms ease', position: 'relative', margin: '10px', height: 'calc(100% - 20px)' }}
      >
        {/* 左侧拖拽调宽手柄 */}
        <div onMouseDown={onStartResize} style={{ position: 'absolute', top: 0, left: -6, width: 12, height: '100%', cursor: 'col-resize', zIndex: 1 }}>
          <div style={{ position: 'absolute', top: 0, left: 6, width: 1, height: '100%', background: '#e5e7eb' }} />
        </div>

        <div className="flex h-full flex-col overflow-hidden" style={{ width }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>{renderHistory()}</div>
        </div>
      </div>
    </div>
  );
};

export default MiniHistoryRightSidebar;


