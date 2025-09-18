import React from 'react';

import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/utils';
import {
    AlignCenterHorizontal,
    AlignCenterVertical,
    AlignLeft,
    AlignRight,
    ArrowDown,
    ArrowDownToLine,
    ArrowUp,
    ArrowUpToLine,
    ChevronDown,
    ChevronUp,
    StretchHorizontal,
    StretchVertical,
} from 'lucide-react';
import type { Editor } from 'tldraw';

interface RightSidebarProps extends React.ComponentPropsWithoutRef<'div'> {
  visible: boolean;
  width?: number;
  onToggle: () => void;
  editor?: Editor | null;
}

/**
 * 设计板右侧属性侧边栏（参考 Figma Inspector）
 * - 固定宽度，支持折叠
 * - 内含若干占位分区：位置尺寸、圆角、图层、填充、描边、导出
 */
export const DesignBoardRightSidebar: React.FC<RightSidebarProps> = ({
  className,
  visible,
  onToggle,
  width = 220,
  editor,
  ...rest
}) => {
  // 当不可见时，不渲染侧栏（用于与左侧顶栏的布局按钮联动）
  if (!visible) {
    return null;
  }
  const handleAlign = (
    type: 'left' | 'center-horizontal' | 'right' | 'top' | 'center-vertical' | 'bottom',
  ) => {
    if (!editor) return;
    const e: any = editor as any;
    const exec = () => {
      if (typeof e.alignSelectedShapes === 'function') return e.alignSelectedShapes(type);
      if (typeof e.alignShapes === 'function') return e.alignShapes(e.getSelectedShapeIds?.(), type);
    };
    if (typeof e.run === 'function') e.run(exec);
    else exec();
  };

  const handleDistribute = (dir: 'horizontal' | 'vertical') => {
    if (!editor) return;
    const e: any = editor as any;
    const exec = () => {
      if (typeof e.distributeSelectedShapes === 'function') return e.distributeSelectedShapes(dir);
      if (typeof e.distributeShapes === 'function') return e.distributeShapes(e.getSelectedShapeIds?.(), dir);
    };
    if (typeof e.run === 'function') e.run(exec);
    else exec();
  };

  const handleZIndex = (
    action: 'bringToFront' | 'bringForward' | 'sendBackward' | 'sendToBack',
  ) => {
    if (!editor) return;
    const e: any = editor as any;
    const exec = () => {
      if (typeof e[action] === 'function') return e[action]();
    };
    if (typeof e.run === 'function') e.run(exec);
    else exec();
  };

  return (
    <div
      className={cn('pointer-events-none z-10', className)}
      style={{ position: 'absolute', right: 0, top: 0, height: '100%' }}
      {...rest}
    >
      <div
        className="pointer-events-auto m-2 flex h-[calc(100%-16px)] flex-row overflow-hidden rounded-lg border border-neutral-200 bg-white/95 shadow-lg backdrop-blur-sm"
        style={{ width: width + 12, transition: 'width 160ms ease' }}
      >
      {/* 移除开合按钮 */}

      <motion.div
        className="flex h-full flex-col overflow-hidden"
        initial={{ width: width }}
        animate={{ width: width }}
      >
            <div className="flex h-full flex-col">
              <Tabs defaultValue="design" className="h-full w-full" variant="ghost">
                <div className="px-global pt-global">
                  <TabsList className="w-full">
                    <TabsTrigger value="design">设计</TabsTrigger>
                    <TabsTrigger value="comment">注释</TabsTrigger>
                    <TabsTrigger value="history">历史</TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-auto px-global pb-global">
                  <TabsContent value="design" className="mt-0">
                    <div className="flex flex-col gap-3">
                      {/* 快捷工具：一排 8 个按钮（6 对齐 + 2 分布） */}
                      <div className="text-xs">
                        <div className="grid grid-cols-8 gap-1">
                          <Button size="icon" variant="ghost" title="左对齐" onClick={() => handleAlign('left')}>
                            <AlignLeft size={16} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title="水平居中"
                            onClick={() => handleAlign('center-horizontal')}
                          >
                            <AlignCenterHorizontal size={16} />
                          </Button>
                          <Button size="icon" variant="ghost" title="右对齐" onClick={() => handleAlign('right')}>
                            <AlignRight size={16} />
                          </Button>
                          <Button size="icon" variant="ghost" title="上对齐" onClick={() => handleAlign('top')}>
                            <ArrowUp size={16} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title="垂直居中"
                            onClick={() => handleAlign('center-vertical')}
                          >
                            <AlignCenterVertical size={16} />
                          </Button>
                          <Button size="icon" variant="ghost" title="下对齐" onClick={() => handleAlign('bottom')}>
                            <ArrowDown size={16} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title="水平等间距"
                            onClick={() => handleDistribute('horizontal')}
                          >
                            <StretchHorizontal size={16} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title="垂直等间距"
                            onClick={() => handleDistribute('vertical')}
                          >
                            <StretchVertical size={16} />
                          </Button>
                        </div>
                        {/* 层级 */}
                        <div className="mt-1 grid grid-cols-8 gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            title="置顶"
                            onClick={() => handleZIndex('bringToFront')}
                          >
                            <ArrowUpToLine size={16} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title="上移一层"
                            onClick={() => handleZIndex('bringForward')}
                          >
                            <ChevronUp size={16} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title="下移一层"
                            onClick={() => handleZIndex('sendBackward')}
                          >
                            <ChevronDown size={16} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title="置底"
                            onClick={() => handleZIndex('sendToBack')}
                          >
                            <ArrowDownToLine size={16} />
                          </Button>
                        </div>
                      </div>

                      <section>
                        <h1 className="mb-2 text-sm font-semibold">位置与尺寸</h1>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <input className="h-7 rounded border bg-background px-2" placeholder="X" />
                          <input className="h-7 rounded border bg-background px-2" placeholder="Y" />
                          <input className="h-7 rounded border bg-background px-2" placeholder="W" />
                          <input className="h-7 rounded border bg-background px-2" placeholder="H" />
                        </div>
                      </section>

                      <Separator className="my-1" />

                      <section>
                        <h1 className="mb-2 text-sm font-semibold">圆角</h1>
                        <input className="h-7 w-full rounded border bg-background px-2 text-xs" placeholder="R 0" />
                      </section>

                      <Separator className="my-1" />

                      <section>
                        <h1 className="mb-2 text-sm font-semibold">图层</h1>
                        <div className="flex items-center justify-between text-xs">
                          <span>不透明度</span>
                          <input className="h-7 w-20 rounded border bg-background px-2 text-right" defaultValue="100%" />
                        </div>
                      </section>

                      <Separator className="my-1" />

                      <section>
                        <h1 className="mb-2 text-sm font-semibold">填充</h1>
                        <div className="flex items-center gap-2 text-xs">
                          <div className="h-4 w-4 rounded-sm border bg-black" />
                          <span>线性渐变</span>
                          <input className="ml-auto h-7 w-20 rounded border bg-background px-2 text-right" defaultValue="100%" />
                        </div>
                      </section>

                      <Separator className="my-1" />

                      <section>
                        <h1 className="mb-2 text-sm font-semibold">描边</h1>
                        <div className="flex items-center gap-2 text-xs">
                          <div className="h-4 w-4 rounded-sm border bg-white" />
                          <span>颜色</span>
                          <input className="ml-auto h-7 w-20 rounded border bg-background px-2 text-right" defaultValue="1px" />
                        </div>
                      </section>

                      <Separator className="my-1" />

                      <section>
                        <h1 className="mb-2 text-sm font-semibold">导出</h1>
                        <div className="text-xs text-muted-foreground">PNG / JPG / SVG</div>
                      </section>
                    </div>
                  </TabsContent>

                  <TabsContent value="comment" className="mt-0" />
                  <TabsContent value="history" className="mt-0" />
                </div>
              </Tabs>
            </div>
      </motion.div>
      </div>
    </div>
  );
};

export default DesignBoardRightSidebar;


