/* eslint-disable react-hooks/rules-of-hooks */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { useCreation } from 'ahooks';
import { motion } from 'framer-motion';
import { get } from 'lodash';
import { createPortal } from 'react-dom';

import { useSystemConfig } from '@/apis/common';
import { VinesDesignBoardViewWrapper } from '@/components/layout-wrapper/design/view-wrapper.tsx';
import { VinesViewWrapper } from '@/components/layout-wrapper/workspace/view-wrapper.tsx';
import { Page404 } from '@/components/layout/workspace/404.tsx';
import { useVinesRoute } from '@/components/router/use-vines-route';
import { IFRAME_MAP } from '@/components/ui/vines-iframe/consts.ts';
import useUrlState from '@/hooks/use-url-state';
import { AgentStoreProvider, createAgentStore } from '@/store/useAgentStore';
import { CanvasStoreProvider, createCanvasStore } from '@/store/useCanvasStore';
import { createDesignBoardStore, DesignBoardProvider } from '@/store/useDesignBoardStore';
import { getGlobalDesignBoardStore } from '@/store/useDesignBoardStore/shared';
import { createExecutionStore, ExecutionStoreProvider } from '@/store/useExecutionStore';
import { createFlowStore, FlowStoreProvider } from '@/store/useFlowStore';
import { createOutputSelectionStore, OutputSelectionStoreProvider } from '@/store/useOutputSelectionStore';
import { useViewStore } from '@/store/useViewStore';
import { cn } from '@/utils';
import { IframeWrapper } from '@/view/iframe-wrapper';

import { VinesViewFrame } from './frame';
import { GlobalDesignBoardAssociationBar } from './global-design-board-association-bar';
import { GlobalDesignBoardOperationBar } from './global-design-board-operation-bar';
import { WorkbenchOperationBar } from './operation-bar';

interface IVinesViewProps {
  id?: string;
  designBoardId?: string;
  workflowId?: string;
  agentId?: string;
  pageId?: string;
  type?: string;
  from?: string;
  iframeUrl?: string;
}

/**
 * tldraw 不支持处在 transform: scale(...) 的祖先节点下（会出现选框/指针坐标系错位）。
 * LF 目前使用全局 transform 缩放（见 __root.tsx），所以这里对画板做一个“脱离 transform 渲染”的兜底：
 * - 在原位置渲染一个占位容器用于测量屏幕 rect
 * - 将真实内容通过 portal 渲染到 document.body，并用 fixed 定位到同样的 rect
 * 这样视觉位置/尺寸不变，但内容不再受 transform 影响，选框会对齐。
 */
const TransformScaleSafePortal: React.FC<{ children: React.ReactNode; active: boolean }> = ({ children, active }) => {
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useEffect(() => {
    if (!active) {
      setEnabled(false);
      setRect(null);
      return;
    }
    if (typeof document === 'undefined') return;
    // 仅在启用了 OEM transform 缩放时启用（LF）
    setEnabled(Boolean(document.querySelector('main.oem-scale-root')));
  }, [active]);

  useLayoutEffect(() => {
    if (!enabled || !active) return;
    const el = anchorRef.current;
    if (!el) return;

    let raf = 0;
    const measure = () => {
      if (!anchorRef.current) return;
      const r = anchorRef.current.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    const schedule = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    // 初次测量（layout effect 阶段，避免首帧闪烁）
    measure();

    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
    };
  }, [enabled]);

  if (!active || !enabled) return <>{children}</>;

  return (
    <>
      <div ref={anchorRef} className="size-full" />
      {rect
        ? createPortal(
            <div
              style={{
                position: 'fixed',
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                zIndex: 50,
              }}
            >
              {children}
            </div>,
            document.body,
          )
        : null}
    </>
  );
};

export function VinesView({ id, designBoardId, workflowId, agentId, pageId, type, from, iframeUrl }: IVinesViewProps) {
  const setVisible = useViewStore((s) => s.setVisible);
  const setFrom = useViewStore((s) => s.setFrom);

  const isCurrentPage = id === pageId;
  const { data: oem } = useSystemConfig();

  const showFormEmbed = get(oem, 'theme.workbenchSidebarFormViewEmbed', false) as boolean;

  const [{ mode }] = useUrlState<{ mode: 'normal' | 'fast' | 'mini' }>({ mode: 'normal' });

  const { isUseWorkbench } = useVinesRoute();

  if (!((type ?? '') in IFRAME_MAP)) {
    return (
      <VinesViewFrame>
        <motion.div
          key={id}
          variants={{
            enter: {
              opacity: 1,
              display: 'block',
            },
            exit: {
              opacity: 0,
              transitionEnd: {
                display: 'none',
              },
            },
          }}
          animate={id === pageId ? 'enter' : 'exit'}
          className="absolute left-12 top-0 size-full"
        >
          <Page404 />
        </motion.div>
      </VinesViewFrame>
    );
  }

  const View = IFRAME_MAP[type ?? ''];

  const content = useCreation(() => {
    if (!id) return <Page404 />;

    if (type === 'iframe') {
      return <IframeWrapper iframeUrl={iframeUrl} />;
    }

    if (type === 'global-design-board' || type === 'design-board') {
      return (
        <DesignBoardProvider
          createStore={type === 'global-design-board' ? getGlobalDesignBoardStore : createDesignBoardStore}
        >
          <VinesDesignBoardViewWrapper designBoardId={designBoardId}>
            {type === 'global-design-board' ? (
              <div className={cn('flex size-full gap-global')}>
                {!showFormEmbed && <GlobalDesignBoardOperationBar />}
                <VinesViewFrame>
                  <View />
                </VinesViewFrame>
                <GlobalDesignBoardAssociationBar />
              </div>
            ) : (
              <VinesViewFrame>
                <View />
              </VinesViewFrame>
            )}
          </VinesDesignBoardViewWrapper>
        </DesignBoardProvider>
      );
    }

    if (workflowId) {
      return (
        <FlowStoreProvider createStore={createFlowStore}>
          <CanvasStoreProvider createStore={createCanvasStore}>
            <VinesViewWrapper workflowId={workflowId}>
              {type === 'preview' ? (
                <ExecutionStoreProvider createStore={createExecutionStore}>
                  <OutputSelectionStoreProvider createStore={createOutputSelectionStore}>
                    {isUseWorkbench ? (
                      <div className={cn('flex size-full', mode === 'mini' ? 'gap-2' : 'gap-global')}>
                        <VinesViewFrame>
                          <View />
                        </VinesViewFrame>
                        <WorkbenchOperationBar />
                      </div>
                    ) : (
                      <VinesViewFrame>
                        <View />
                      </VinesViewFrame>
                    )}
                  </OutputSelectionStoreProvider>
                </ExecutionStoreProvider>
              ) : (
                <VinesViewFrame>
                  <View />
                </VinesViewFrame>
              )}
            </VinesViewWrapper>
          </CanvasStoreProvider>
        </FlowStoreProvider>
      );
    }

    return (
      <AgentStoreProvider createStore={createAgentStore}>
        <VinesViewFrame>
          <View />
        </VinesViewFrame>
      </AgentStoreProvider>
    );
  }, [id]);

  const wrappedContent =
    type === 'global-design-board' || type === 'design-board' ? (
      <TransformScaleSafePortal active={isCurrentPage}>{content}</TransformScaleSafePortal>
    ) : (
      content
    );

  useEffect(() => {
    const finalVisible = id === pageId;
    setTimeout(
      () => {
        setVisible(finalVisible);
      },
      finalVisible ? 0 : 216,
    );
  }, [pageId, id]);

  useEffect(() => {
    setFrom(from);
  }, [from]);

  return (
    <motion.div
      key={id}
      variants={{
        enter: {
          opacity: 1,
          display: 'block',
        },
        exit: {
          opacity: 0,
          transitionEnd: {
            display: 'none',
          },
        },
      }}
      animate={id === pageId ? 'enter' : 'exit'}
      className="absolute left-0 top-0 size-full"
    >
      {wrappedContent}
    </motion.div>
  );
}
