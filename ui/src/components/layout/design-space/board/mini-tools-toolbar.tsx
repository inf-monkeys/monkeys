import { useEffect, useState } from 'react';

import './mini-tools-toolbar.scss';

import { useSystemConfig } from '@/apis/common';
import { useWorkspacePages } from '@/apis/pages';
import type { IPinPage } from '@/apis/pages/typings.ts';
import { VinesIcon } from '@/components/ui/vines-icon';
import { getI18nContent } from '@/utils';

// 小工具工具栏组件
export const MiniToolsToolbar: React.FC = () => {
  // 工作台被 pin 的应用
  const { data: pinnedPages } = useWorkspacePages();
  const { data: oem } = useSystemConfig();

  // 检查是否显示 sidebar
  const showPageAndLayerSidebar = oem?.theme?.designProjects?.showPageAndLayerSidebar || false;
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  useEffect(() => {
    const handler = (e: any) => setLeftCollapsed(Boolean(e?.detail?.collapsed));
    window.addEventListener('vines:toggle-left-sidebar-body', handler as any);
    return () => window.removeEventListener('vines:toggle-left-sidebar-body', handler as any);
  }, []);
  // 工具栏位置：跟随左侧栏实际宽度
  const [leftSidebarWidth, setLeftSidebarWidth] = useState<number>(300);
  useEffect(() => {
    const handler = (e: any) => {
      const w = Number(e?.detail?.width);
      if (!Number.isNaN(w)) setLeftSidebarWidth(w);
    };
    window.addEventListener('vines:left-sidebar-width-change', handler as any);
    return () => window.removeEventListener('vines:left-sidebar-width-change', handler as any);
  }, []);
  // 工具栏位置：
  // - 侧栏展开：始终在 sidebar 右边 10px（左边距10 + 宽度 + 10）
  // - 侧栏收起：回到最左边 16px
  const toolbarLeft = showPageAndLayerSidebar ? (leftCollapsed ? '16px' : `${leftSidebarWidth + 40}px`) : '16px';

  // 提取应用图标
  const getPageIcon = (page: IPinPage): string | undefined => {
    return (
      (page as any)?.designProject?.iconUrl ||
      (page as any)?.workflow?.iconUrl ||
      (page as any)?.agent?.iconUrl ||
      (page as any)?.instance?.icon ||
      undefined
    );
  };

  // mini 开关状态（不影响 toolbar 定位，仅用于样式或激活态）
  const [miniActive, setMiniActive] = useState(false);
  const [currentMiniPageId, setCurrentMiniPageId] = useState<string | null>(null);
  useEffect(() => {
    const onMini = (e: any) => {
      const pid = e?.detail?.pageId ?? null;
      setMiniActive(Boolean(pid));
      setCurrentMiniPageId(pid);
    };
    window.addEventListener('vines:mini-state', onMini as any);
    return () => window.removeEventListener('vines:mini-state', onMini as any);
  }, []);

  return (
    <>
      {!leftCollapsed && (
        <div
          className="mini-tools-toolbar"
          style={{
            '--toolbar-left': toolbarLeft,
          } as React.CSSProperties & { '--toolbar-left': string }}
          data-toolbar-left={toolbarLeft}
        >
          <div className="custom-toolbar">
            {/* 直接显示所有应用 */}
            {(pinnedPages?.pages ?? []).map((page) => {
              // 参照工作台：优先展示"应用/项目/Agent"的名称，而非视图名
              const label = (page as any)?.workflow?.displayName
                ? (getI18nContent((page as any).workflow.displayName) as string)
                : (page as any)?.designProject?.displayName
                  ? (getI18nContent((page as any).designProject.displayName) as string)
                  : (page as any)?.agent?.displayName
                    ? (getI18nContent((page as any).agent.displayName) as string)
                    : (getI18nContent(page.displayName as any) as string) || (page as any)?.instance?.name || page.id;
              const icon = getPageIcon(page) || 'lucide:app-window';
              return (
                <button
                  key={page.id}
                  className={`tool-button ${miniActive && currentMiniPageId === page.id ? 'selected' : ''}`}
                  title={label}
                  style={{ pointerEvents: 'auto', cursor: 'pointer', zIndex: 10000 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    // 如果当前应用已经打开，则关闭它
                    if (miniActive && currentMiniPageId === page.id) {
                      window.dispatchEvent(new CustomEvent('vines:close-pinned-page-mini'));
                      return;
                    }

                    // 否则，关闭所有可能的状态，然后打开目标小工具
                    window.dispatchEvent(new CustomEvent('vines:close-pinned-page-mini'));

                    // 短暂延迟后打开目标小工具
                    setTimeout(() => {
                      window.dispatchEvent(
                        new CustomEvent('vines:open-pinned-page-mini', { detail: { pageId: page.id, page } }),
                      );
                      window.dispatchEvent(
                        new CustomEvent('vines:open-pinned-page', { detail: { pageId: page.id, page } }),
                      );
                    }, 50);
                  }}
                >
                  <VinesIcon
                    size="xs"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {icon}
                  </VinesIcon>
                  <span className="tool-button-label">{label}</span>
                </button>
              );
            })}
            {(!pinnedPages?.pages || pinnedPages.pages.length === 0) && (
              <div style={{ padding: '8px 16px', color: 'var(--color-text-2)', fontSize: '14px' }}>暂无置顶应用</div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
