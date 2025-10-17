import React, { useEffect, useRef, useState } from 'react';

import { useNavigate, useSearch } from '@tanstack/react-router';

import { useMemoizedFn } from 'ahooks';
import { AnimatePresence, motion } from 'framer-motion';
import { get } from 'lodash';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AssetRecordType, createShapeId, getSnapshot, TLShapeId } from 'tldraw';

import { useSystemConfig } from '@/apis/common';
import { updateDesignBoardMetadata, useDesignBoardMetadata } from '@/apis/designs';
import { useWorkspacePages } from '@/apis/pages';
import { Board } from '@/components/layout/design-space/board';
import { DesignBoardRightSidebar } from '@/components/layout/design-space/board/right-sidebar';
import { useVinesTeam } from '@/components/router/guard/team';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FrameSizeInput } from '@/components/ui/vines-design/frame-size-input';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useSetCurrentPage } from '@/store/useCurrentPageStore';
import { useDesignBoardStore } from '@/store/useDesignBoardStore';
import { useGetTemp, useSetTemp } from '@/store/useGlobalTempStore';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events';
import { IVinesExecutionResultItem } from '@/utils/execution';
import { downloadFile, getImageSize } from '@/utils/file.ts';

interface DesignBoardViewProps {
  embed?: boolean;
}

const DesignBoardView: React.FC<DesignBoardViewProps> = ({ embed = false }) => {
  const { t, i18n } = useTranslation();

  const { operation, tid, designProjectId, activePageFromType } = useSearch({ strict: false }) as {
    operation?: string;
    tid?: string;
    designProjectId?: string;
    activePageFromType?: string;
  };

  const { data: workspaceData } = useWorkspacePages();

  const { teamId } = useVinesTeam();

  const setCurrentPage = useSetCurrentPage();

  const navigate = useNavigate();

  const getTemp = useGetTemp();
  const setTemp = useSetTemp();

  const { editor, setEditor, designBoardId, setDesignBoardId } = useDesignBoardStore();

  const [themeMode] = useLocalStorage<string>('vines-ui-dark-mode', 'auto', false);

  const { data: metadata, mutate: mutateMetadata } = useDesignBoardMetadata(designBoardId);
  const { data: oem } = useSystemConfig();

  const containerHeight = usePageStore((s) => s.containerHeight);
  const workbenchVisible = usePageStore((s) => s.workbenchVisible);

  const [sidebarVisible, setSidebarVisible] = useState(!workbenchVisible);
  const [rightSidebarWidth, setRightSidebarWidth] = useState<number>(220);

  const [frameShapeId, setFrameShapeId] = useState<TLShapeId>(createShapeId('shape:parentFrame'));

  const [canvasWidth, setCanvasWidth] = useState<number>(1280);
  const [canvasHeight, setCanvasHeight] = useState<number>(720);

  useEffect(() => {
    if (!metadata || !editor) return;
    editor.loadSnapshot(metadata.snapshot);
  }, [metadata, editor]);

  useEffect(() => {
    if (!editor) return;

    // 确保 colorScheme 值符合 tldraw 的预期格式
    let colorScheme: 'light' | 'dark' | 'system';
    if (themeMode === 'auto') {
      colorScheme = 'system';
    } else if (themeMode === 'dark') {
      colorScheme = 'dark';
    } else if (themeMode === 'light') {
      colorScheme = 'light';
    } else {
      // 如果 themeMode 不是预期值，默认使用 system
      colorScheme = 'system';
    }

    editor.user.updateUserPreferences({
      colorScheme,
    });
  }, [editor, themeMode]);

  i18n.on('languageChanged', (lang) => {
    if (!editor) return;
    editor.user.updateUserPreferences({
      locale: lang === 'zh' ? 'zh-cn' : 'en',
    });
  });

  // lock frame
  useEffect(() => {
    if (!editor) return;
    editor.sideEffects.registerBeforeDeleteHandler('shape', (shape) => {
      if (shape.id === frameShapeId) return false;
      return;
    });
  }, [editor]);

  // 监听来自左侧布局切换按钮的事件，联动右侧侧栏显示/隐藏
  useEffect(() => {
    const handler = (e: any) => {
      const visible = e?.detail?.visible;
      if (typeof visible === 'boolean') setSidebarVisible(visible);
    };
    window.addEventListener('vines:toggle-right-sidebar', handler as any);
    return () => window.removeEventListener('vines:toggle-right-sidebar', handler as any);
  }, []);

  const handleExport = async () => {
    if (!editor) {
      toast.error('Board uninitialized');
      return;
    }
    toast.promise(
      async () => {
        const ids = [frameShapeId];
        const { blob } = await editor.toImage(ids, { format: 'png', scale: 0.5 });
        const file = new File([blob], `${metadata?.displayName ?? 'Board'}-${Date.now()}.png`, { type: blob.type });
        downloadFile(file);
      },
      {
        success: () => {
          return t('common.export.success');
        },
        error: t('common.export.error'),
        loading: t('common.export.loading'),
      },
    );
  };

  const handleSave = () => {
    if (!editor) return;
    const snapshot = getSnapshot(editor.store);
    toast.promise(
      updateDesignBoardMetadata(designBoardId, {
        snapshot,
      }),
      {
        success: () => {
          void mutateMetadata();
          return t('common.update.success');
        },
        error: t('common.update.error'),
        loading: t('common.update.loading'),
      },
    );
  };

  // OEM：是否显示左右侧边栏，统一由 showPageAndLayerSidebar 控制
  const showPageAndLayerSidebar = get(oem, 'theme.designProjects.showPageAndLayerSidebar', false);

  // Ctrl/Cmd + S：阻止浏览器保存页面，执行静默保存并提示“已自动保存”
  useEffect(() => {
    const handleKeydown = async (e: KeyboardEvent) => {
      const isSaveHotkey = (e.key === 's' || e.code === 'KeyS') && (e.ctrlKey || e.metaKey);
      if (!isSaveHotkey) return;
      e.preventDefault();
      if (!editor || !designBoardId) {
        toast.success('已自动保存');
        return;
      }
      try {
        const snapshot = getSnapshot(editor.store);
        await updateDesignBoardMetadata(designBoardId, { snapshot });
        void mutateMetadata();
        toast.success('已自动保存');
      } catch (_) {
        // 失败也提示“已自动保存”
        toast.success('已自动保存');
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [editor, designBoardId, mutateMetadata, t]);

  // 自动保存：监听 store 变更，2 秒防抖 & 并发保护
  const autosaveTimerRef = useRef<number | null>(null);
  const autosaveInFlightRef = useRef<boolean>(false);
  const pendingAutosaveRef = useRef<boolean>(false);

  useEffect(() => {
    if (!editor || !designBoardId) return;

    const flushSave = async () => {
      if (autosaveInFlightRef.current) {
        pendingAutosaveRef.current = true;
        return;
      }
      autosaveInFlightRef.current = true;
      try {
        const snapshot = getSnapshot(editor.store);
        await updateDesignBoardMetadata(designBoardId, { snapshot });
        void mutateMetadata();
      } catch (e) {
        // 静默失败，避免频繁 toast；必要时可改为节流提示
      } finally {
        autosaveInFlightRef.current = false;
        if (pendingAutosaveRef.current) {
          pendingAutosaveRef.current = false;
          // 继续排队一次
          if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
          autosaveTimerRef.current = window.setTimeout(flushSave, 2000);
        }
      }
    };

    const scheduleSave = () => {
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = window.setTimeout(flushSave, 2000);
    };

    // 仅在文档层数据变化时触发。tldraw v3 store 变更事件可通过 listen 订阅
    const unsubscribe = editor.store.listen(
      () => {
        scheduleSave();
      },
      { scope: 'document' },
    );

    // 页面卸载/组件卸载时做一次 flush
    const handleBeforeUnload = () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
      // 同步保存可能阻塞卸载，这里仅尽力触发（不阻塞）
      void flushSave();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      unsubscribe();
    };
  }, [editor, designBoardId, mutateMetadata]);

  const handleInsertImages = async (operation: string, tid: string) => {
    if (operation === 'insert-images' && tid && editor) {
      const data = getTemp(tid) as IVinesExecutionResultItem[] | undefined;
      if (!data) return;
      setTemp(tid, null);

      const processedData = await Promise.all(
        data.map(async (item) => {
          const imageUrl = item.render.data as string;
          const { width, height } = await getImageSize(imageUrl);
          return {
            id: AssetRecordType.createId(),
            url: imageUrl,
            width,
            height,
          };
        }),
      );

      editor.createAssets(
        processedData.map((item) => {
          return {
            id: item.id,
            type: 'image',
            typeName: 'asset',
            props: {
              name: item.id,
              src: item.url,
              mimeType: 'image/png',
              isAnimated: false,
              h: item.height,
              w: item.width,
            },
            meta: {},
          };
        }),
      );

      for (const item of processedData) {
        editor.createShape({
          type: 'image',
          props: {
            assetId: item.id,
            w: item.width,
            h: item.height,
          },
        });
      }

      navigate({
        search: {
          designProjectId,
        },
      });
    }
  };

  useEffect(() => {
    if (operation === 'insert-images' && tid && editor) {
      void handleInsertImages(operation, tid);
    }
  }, [operation, tid, editor]);

  const handleEventExport = useMemoizedFn((boardId?: string) => {
    if (boardId !== designBoardId) return;
    void handleExport();
  });

  const handleEventSave = useMemoizedFn((boardId?: string) => {
    if (boardId !== designBoardId) return;
    void handleSave();
  });

  useEffect(() => {
    VinesEvent.on('design-board-export', handleEventExport);
    VinesEvent.on('design-board-save', handleEventSave);
    return () => {
      VinesEvent.off('design-board-export', handleEventExport);
      VinesEvent.off('design-board-save', handleEventSave);
    };
  }, []);

  return (
    <div className={cn('relative flex h-full max-h-full')}>
      <div className="flex h-full max-w-64">
        {!embed && get(oem, 'theme.designProjects.showBoardOperationSidebar', true) && (
          <>
            <motion.div
              className="flex flex-col gap-global overflow-hidden [&_h1]:line-clamp-1 [&_span]:line-clamp-1"
              initial={workbenchVisible ? { width: 0, padding: '1rem 0' } : { width: 220, padding: '1rem 1rem' }}
              animate={{
                width: sidebarVisible ? 220 : 0,
                padding: sidebarVisible ? '1rem 1rem' : '1rem 0',
              }}
            >
              <AnimatePresence>
                {sidebarVisible && (
                  <motion.div
                    className="flex h-full flex-col justify-between"
                    initial={{ opacity: 0, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, filter: 'blur(10px)' }}
                  >
                    <div className="flex flex-col">
                      <p className="mb-1.5 grid grid-cols-2 justify-start text-xs font-semibold capitalize">
                        <span>{t('design.view-config.canvas-setting.width')}</span>
                        <span className="pl-2">{t('design.view-config.canvas-setting.height')}</span>
                      </p>
                      <FrameSizeInput />
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <Button variant="outline" onClick={handleExport}>
                        {t('common.utils.export')}
                      </Button>
                      <Button variant="outline" onClick={handleSave}>
                        {t('common.utils.save')}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            <Separator orientation="vertical" className="vines-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="group z-10 flex h-4 w-3.5 cursor-pointer items-center justify-center rounded-sm border bg-border px-0.5 transition-opacity hover:opacity-75 active:opacity-95"
                    onClick={() => setSidebarVisible(!sidebarVisible)}
                  >
                    <ChevronRight className={cn(sidebarVisible && 'scale-x-[-1]')} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>{sidebarVisible ? t('common.sidebar.hide') : t('common.sidebar.show')}</TooltipContent>
              </Tooltip>
            </Separator>
          </>
        )}
      </div>
      <Board
        canvasHeight={720}
        canvasWidth={1280}
        persistenceKey={designBoardId}
        editor={editor}
        setEditor={setEditor}
        instance={{ frameShapeId }}
      />
      {/* 右侧属性侧边栏（按 OEM 同开关控制） */}
      {showPageAndLayerSidebar && (
        <DesignBoardRightSidebar
          visible={sidebarVisible}
          onToggle={() => setSidebarVisible(!sidebarVisible)}
          width={rightSidebarWidth}
          onResizeWidth={(w) => setRightSidebarWidth(w)}
          editor={editor}
        />
      )}
    </div>
  );
};

export default DesignBoardView;
