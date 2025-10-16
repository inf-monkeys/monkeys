import { useEffect, useState } from 'react';

import './mini-tools-toolbar.scss';

import { useWorkspacePages } from '@/apis/pages';
import type { IPinPage } from '@/apis/pages/typings.ts';
import { VinesIcon } from '@/components/ui/vines-icon';
import { getI18nContent } from '@/utils';

// 小工具工具栏组件
export const MiniToolsToolbar: React.FC = () => {
  // 工作台被 pin 的应用
  const { data: pinnedPages } = useWorkspacePages();

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
    <div
      className="mini-tools-toolbar"
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: '20px',
        zIndex: 9999,
        pointerEvents: 'auto',
      }}
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

                // 简单直接的切换逻辑：总是先关闭所有状态，然后打开目标小工具
                // 这样可以避免复杂的状态判断和中间状态问题

                // 1. 先关闭所有可能的状态
                window.dispatchEvent(new CustomEvent('vines:close-pinned-page-mini'));

                // 2. 短暂延迟后打开目标小工具
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
                  width: '100%',
                  height: '100%',
                }}
              >
                {icon}
              </VinesIcon>
            </button>
          );
        })}
        {(!pinnedPages?.pages || pinnedPages.pages.length === 0) && (
          <div style={{ padding: '8px 16px', color: 'var(--color-text-2)', fontSize: '14px' }}>暂无置顶应用</div>
        )}
      </div>
    </div>
  );
};
