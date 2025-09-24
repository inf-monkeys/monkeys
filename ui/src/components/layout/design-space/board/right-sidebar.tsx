import React from 'react';
import { createPortal } from 'react-dom';
import './layer-panel.css';

/* 添加样式来处理滚动条显示/隐藏 */
const rightSidebarStyles = `
  .right-sidebar-content {
    /* WebKit浏览器隐藏滚动条 */
    -webkit-scrollbar: none;
  }
  
  .right-sidebar-content:hover {
    /* 悬停时显示滚动条 */
    -webkit-scrollbar: thin;
    -webkit-scrollbar-track: transparent;
    -webkit-scrollbar-thumb: rgba(156, 163, 175, 0.5);
    -webkit-scrollbar-thumb:hover: rgba(156, 163, 175, 0.8);
  }
  
  /* 确保内容不被滚动条覆盖 */
  .right-sidebar-content:hover {
    scrollbar-width: thin;
    scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
  }
`;

/* 将样式插入到页面头部 */
if (typeof document !== 'undefined' && !document.getElementById('right-sidebar-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'right-sidebar-styles';
  styleElement.textContent = rightSidebarStyles;
  document.head.appendChild(styleElement);
}

// 移除 framer-motion 的宽度动画以降低拖拽抖动

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/utils';
import * as SliderPrimitive from '@radix-ui/react-slider';
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
  MoreHorizontal,
  Plus
} from 'lucide-react';
import type { Editor } from 'tldraw';

interface RightSidebarProps extends React.ComponentPropsWithoutRef<'div'> {
  visible: boolean;
  width?: number;
  onToggle: () => void;
  editor?: Editor | null;
  onResizeWidth?: (nextWidth: number) => void;
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
  onResizeWidth,
  ...rest
}) => {
  // 当不可见时，不渲染侧栏（用于与左侧顶栏的布局按钮联动）
  if (!visible) {
    return null;
  }
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [resizing, setResizing] = React.useState(false);
  const rafIdRef = React.useRef<number | null>(null);
  const [hasSelection, setHasSelection] = React.useState<boolean>(false);
  const [selectedCount, setSelectedCount] = React.useState<number>(0);
  const [opacity, setOpacity] = React.useState<number>(100);
  const [editingOpacity, setEditingOpacity] = React.useState<boolean>(false);
  const [corner, setCorner] = React.useState<string>('0');
  const [canEditCorner, setCanEditCorner] = React.useState<boolean>(false);
  const [editingCorner, setEditingCorner] = React.useState<boolean>(false);
  const lastSelectionKeyRef = React.useRef<string>("");
  const [fillPickerOpen, setFillPickerOpen] = React.useState<boolean>(false);
  const [tempFillColor, setTempFillColor] = React.useState<string>('#000000');
  const [fills, setFills] = React.useState<string[]>([]);
  const [canShowFill, setCanShowFill] = React.useState<boolean>(true);
  
  // 将十六进制颜色映射到tldraw支持的颜色名称
  const mapHexToTldrawColor = (hex: string): string => {
    const colorMap: Record<string, string> = {
      '#000000': 'black',
      '#808080': 'grey',
      '#800080': 'violet',
      '#0000FF': 'blue',
      '#87CEEB': 'light-blue',
      '#FFFF00': 'yellow',
      '#FFA500': 'orange',
      '#008000': 'green',
      '#90EE90': 'light-green',
      '#FFB6C1': 'light-red',
      '#FF0000': 'red',
      '#FFFFFF': 'white',
    };
    
    // 尝试精确匹配
    if (colorMap[hex.toLowerCase()]) {
      return colorMap[hex.toLowerCase()];
    }
    
    // 如果没有精确匹配，根据颜色相似度选择最接近的颜色
    const rgb = hexToRgb(hex);
    if (!rgb) return 'black';
    
    const { r, g, b } = rgb;
    
    // 计算与预定义颜色的距离
    const distances = Object.entries(colorMap).map(([hexColor, colorName]) => {
      const colorRgb = hexToRgb(hexColor);
      if (!colorRgb) return { colorName, distance: Infinity };
      
      const distance = Math.sqrt(
        Math.pow(r - colorRgb.r, 2) + 
        Math.pow(g - colorRgb.g, 2) + 
        Math.pow(b - colorRgb.b, 2)
      );
      return { colorName, distance };
    });
    
    // 返回距离最小的颜色
    return distances.reduce((min, current) => 
      current.distance < min.distance ? current : min
    ).colorName;
  };

  // 应用填充颜色到选中的形状
  const applyFillToSelection = React.useCallback((fillColor: string) => {
    if (!editor) return;
    const selectedShapes = editor.getSelectedShapes();
    if (selectedShapes.length === 0) return;
    
    selectedShapes.forEach(shape => {
      try {
        const tldrawColor = mapHexToTldrawColor(fillColor);
        const updateProps: any = { ...shape.props };

        // 如果形状支持填充模式，开启实心填充
        if ('fill' in shape.props) updateProps.fill = 'solid';

        // 无论何种类型，尽可能设置可用的颜色相关属性
        if ('backgroundColor' in shape.props) updateProps.backgroundColor = tldrawColor;
        if ('fillColor' in shape.props) updateProps.fillColor = tldrawColor;
        if ('color' in shape.props) updateProps.color = tldrawColor; // geo 等用调色板名
        if ('textColor' in shape.props) updateProps.textColor = tldrawColor;
        if ('stroke' in shape.props) updateProps.stroke = tldrawColor;

        editor.updateShape({ id: shape.id, type: shape.type, props: updateProps });
      } catch (error) {
        console.warn('Failed to apply fill color:', error);
      }
    });
  }, [editor]);
  
  const [posX, setPosX] = React.useState<string>('0');
  const [posY, setPosY] = React.useState<string>('0');
  const [sizeW, setSizeW] = React.useState<string>('0');
  const [sizeH, setSizeH] = React.useState<string>('0');
  const [canEditSize, setCanEditSize] = React.useState<boolean>(false);
  const [editingPosX, setEditingPosX] = React.useState<boolean>(false);
  const [editingPosY, setEditingPosY] = React.useState<boolean>(false);
  const [editingW, setEditingW] = React.useState<boolean>(false);
  const [editingH, setEditingH] = React.useState<boolean>(false);
  const fillBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const fillPanelRef = React.useRef<HTMLDivElement | null>(null);
  const [fillPanelPos, setFillPanelPos] = React.useState<{ top: number; left: number } | null>(null);
  // 颜色选择器（HSV + Alpha）
  const [pickerHue, setPickerHue] = React.useState<number>(0); // 0-360
  const [pickerS, setPickerS] = React.useState<number>(1); // 0-1
  const [pickerV, setPickerV] = React.useState<number>(1); // 0-1
  const [pickerA, setPickerA] = React.useState<number>(1); // 0-1
  const [colorFormat, setColorFormat] = React.useState<'hex' | 'rgb' | 'css' | 'hsl' | 'hsb'>('hex');

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
  
  // 颜色格式转换函数
  const getColorValue = () => {
    const { r, g, b } = hsvToRgb(pickerHue, pickerS, pickerV);
    const alpha = Math.round(pickerA * 100);
    
    switch (colorFormat) {
      case 'hex':
        return rgbToHex({ r, g, b }).slice(1);
      case 'rgb':
        return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
      case 'css':
        return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${pickerA.toFixed(2)})`;
      case 'hsl':
        const hsl = rgbToHsl({ r, g, b });
        return `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%)`;
      case 'hsb':
        return `hsb(${Math.round(pickerHue)}, ${Math.round(pickerS * 100)}%, ${Math.round(pickerV * 100)}%)`;
      default:
        return rgbToHex({ r, g, b }).slice(1);
    }
  };
  const hsvToRgb = (h: number, s: number, v: number) => {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
    };
  };
  const rgbToHex = ({ r, g, b }: { r: number; g: number; b: number }) => '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
  
  const rgbToHsl = ({ r, g, b }: { r: number; g: number; b: number }) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    
    return { h: h * 360, s, l };
  };
  const hexToRgb = (hex: string) => {
    const m = hex.replace('#', '').trim();
    if (![3, 6].includes(m.length)) return null;
    const v = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
    const r = parseInt(v.slice(0, 2), 16);
    const g = parseInt(v.slice(2, 4), 16);
    const b = parseInt(v.slice(4, 6), 16);
    return { r, g, b };
  };
  const rgbToHsv = ({ r, g, b }: { r: number; g: number; b: number }) => {
    const rn = r / 255, gn = g / 255, bn = b / 255;
    const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
    const d = max - min;
    let h = 0;
    if (d === 0) h = 0;
    else if (max === rn) h = 60 * (((gn - bn) / d) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / d + 2);
    else h = 60 * ((rn - gn) / d + 4);
    if (h < 0) h += 360;
    const s = max === 0 ? 0 : d / max;
    const v = max;
    return { h, s, v };
  };

  // 当临时色改变时同步到 HSV
  React.useEffect(() => {
    const rgb = hexToRgb(tempFillColor);
    if (rgb) {
      const { h, s, v } = rgbToHsv(rgb);
      setPickerHue(h); setPickerS(s); setPickerV(v);
    }
  }, [tempFillColor]);

  React.useEffect(() => {
    if (!fillPickerOpen) return;
    const updatePos = () => {
      const btn = fillBtnRef.current;
      const container = containerRef.current;
      if (!btn || !container) return;
      const btnRect = btn.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const panelWidth = 240;
      const panelHeight = 420;
      const gap = 10; // 与 sidebar 左边保持 10px 间距
      const left = containerRect.left - panelWidth - gap;
      // 计算画布底部位置（sidebar底部）
      const canvasBottom = containerRect.bottom;
      const maxTop = canvasBottom - panelHeight - gap; // 底部距离画布10px
      const top = Math.min(maxTop, btnRect.top);
      setFillPanelPos({ top, left });
    };
    updatePos();
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, true);
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (fillPanelRef.current && fillPanelRef.current.contains(t)) return;
      if (fillBtnRef.current && fillBtnRef.current.contains(t as Node)) return;
      setFillPickerOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
      document.removeEventListener('mousedown', onDocClick);
    };
  }, [fillPickerOpen]);

  // 监听选择变化
  React.useEffect(() => {
    if (!editor) return;
    const update = () => {
      const ids = editor.getSelectedShapeIds?.() || [];
      const selKey = ids.join(',');
      if (selKey !== lastSelectionKeyRef.current) {
        // 选区变化：结束所有编辑态，允许同步新值
        lastSelectionKeyRef.current = selKey;
        setEditingCorner(false);
        setEditingPosX(false);
        setEditingPosY(false);
        setEditingW(false);
        setEditingH(false);
        setEditingOpacity(false);
      }
      setHasSelection(ids.length > 0);
      setSelectedCount(ids.length);
      // 决定是否显示“填充”分区：选中 frame / image 时隐藏
      try {
        if (ids.length === 1) {
          const s = editor.getShape(ids[0]) as any;
          const type = String(s?.type || '');
          setCanShowFill(!(type === 'frame' || type === 'image'));
        } else if (ids.length > 1) {
          const hasFrameOrImage = ids.some((id: any) => {
            const s = editor.getShape(id) as any;
            return s && (s.type === 'frame' || s.type === 'image');
          });
          setCanShowFill(!hasFrameOrImage);
        } else {
          setCanShowFill(true);
        }
      } catch {
        setCanShowFill(true);
      }
      // 同步 X / Y 显示（使用选区外接框）
      try {
        const e: any = editor as any;
        const b = e.getSelectionPageBounds?.();
        if (b && typeof b.x === 'number' && typeof b.y === 'number') {
          if (!editingPosX) setPosX(String(Math.round(b.x)));
          if (!editingPosY) setPosY(String(Math.round(b.y)));
          if (typeof b.w === 'number' && typeof b.h === 'number') {
            if (!editingW) setSizeW(String(Math.round(b.w)));
            if (!editingH) setSizeH(String(Math.round(b.h)));
          }
        } else if (ids.length > 0) {
          const s = editor.getShape(ids[0]) as any;
          if (s && typeof s.x === 'number' && typeof s.y === 'number') {
            if (!editingPosX) setPosX(String(Math.round(s.x)));
            if (!editingPosY) setPosY(String(Math.round(s.y)));
          }
          const wv = (s as any)?.props?.w;
          const hv = (s as any)?.props?.h;
          if (typeof wv === 'number' && !editingW) setSizeW(String(Math.round(wv)));
          if (typeof hv === 'number' && !editingH) setSizeH(String(Math.round(hv)));
        }
      } catch {}

      // 同步 opacity / 圆角
      try {
        if (ids.length >= 1) {
          const s = editor.getShape(ids[0]) as any;
          const op = (s?.opacity ?? s?.props?.opacity ?? s?.meta?.opacity);
          if (typeof op === 'number' && !editingOpacity) {
            const pct = Math.round(Math.max(0, Math.min(1, op)) * 100);
            setOpacity(pct);
          }
          const r = (s?.props?.r ?? s?.props?.radius ?? s?.props?.cornerRadius ?? s?.meta?.cornerRadius);
          if (typeof r === 'number' && !editingCorner) {
            setCorner(String(Math.max(0, Math.round(r))));
            setCanEditCorner(true);
          } else {
            setCanEditCorner(false);
          }
        } else {
          if (!editingOpacity) setOpacity(100);
          setCanEditCorner(false);
        }
      } catch {}

      // 检测是否可直接编辑尺寸（单选且 shape 拥有 props.w/h）
      try {
        if (ids.length === 1) {
          const s = editor.getShape(ids[0]) as any;
          setCanEditSize(typeof s?.props?.w === 'number' && typeof s?.props?.h === 'number');
        } else {
          setCanEditSize(false);
        }
      } catch {
        setCanEditSize(false);
      }
    };
    update();
    const dispose = editor.store.listen(() => {
      update();
    });
    return dispose;
  }, [editor, editingPosX, editingPosY, editingW, editingH, editingOpacity, editingCorner]);

  const applyOpacityToSelection = React.useCallback((pct: number) => {
    if (!editor) return;
    const e: any = editor as any;
    const ids = e.getSelectedShapeIds?.() || [];
    if (!ids.length) return;
    const value01 = Math.max(0, Math.min(1, pct / 100));
    ids.forEach((id: any) => {
      const s = editor.getShape(id) as any;
      if (!s) return;
      const next: any = { id: s.id, type: s.type };
      // 三种常见位置：shape.opacity / props.opacity / meta.opacity
      if (typeof s.opacity === 'number') next.opacity = value01;
      if (typeof s.props === 'object' && typeof s.props.opacity === 'number') next.props = { ...s.props, opacity: value01 };
      if (typeof s.meta === 'object') next.meta = { ...(s.meta || {}), opacity: value01 };
      editor.updateShape(next);
    });
  }, [editor]);

  const applyCornerToSelection = React.useCallback((radius: number) => {
    if (!editor) return;
    const e: any = editor as any;
    const ids = e.getSelectedShapeIds?.() || [];
    if (!ids.length) return;
    ids.forEach((id: any) => {
      const s = editor.getShape(id) as any;
      if (!s) return;
      if (typeof s.props === 'object') {
        const props = { ...s.props } as any;
        if (typeof props.r === 'number') props.r = radius;
        else if (typeof props.radius === 'number') props.radius = radius;
        else if (typeof props.cornerRadius === 'number') props.cornerRadius = radius;
        else return; // 无可编辑的圆角字段
        editor.updateShape({ id: s.id, type: s.type, props });
      }
    });
  }, [editor]);

  const handleExportAll = async () => {
    if (!editor) return;
    try {
      const pageId = (editor as any).getCurrentPageId?.();
      let ids: any[] = [];
      if (pageId && typeof (editor as any).getSortedChildIdsForParent === 'function') {
        ids = (editor as any).getSortedChildIdsForParent(pageId) || [];
      }
      if ((!ids || ids.length === 0) && typeof (editor as any).getCurrentPageShapeIds === 'function') {
        ids = (editor as any).getCurrentPageShapeIds() || [];
      }
      if (!ids || ids.length === 0) {
        // 没有可导出的形状，直接返回
        return;
      }
      const { blob } = await (editor as any).toImage(ids, { format: 'png', scale: 1 });
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Board-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  const onStartResize = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!onResizeWidth) return;
    e.preventDefault();
    e.stopPropagation();
    setResizing(true);
  }, [onResizeWidth]);

  React.useEffect(() => {
    if (!resizing) return;
    const handleMove = (e: MouseEvent) => {
      if (!containerRef.current || !onResizeWidth) return;
      const rect = containerRef.current.getBoundingClientRect();
      // raf 节流，避免高频 setState 导致卡顿
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        const next = Math.max(200, Math.min(400, rect.right - e.clientX - 12));
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

  // 对齐是否可用：通常需要至少 2 个选中形状
  const canAlign = selectedCount >= 2;

  // 层级操作可用性（遵循 tldraw API 能力 + 选中态 + 非只读）
  const canZIndex = React.useMemo(() => {
    if (!editor) return { bringToFront: false, bringForward: false, sendBackward: false, sendToBack: false };
    const e: any = editor as any;
    const readonly = Boolean(e?.getInstanceState?.()?.isReadonly);
    const hasSel = selectedCount > 0;
    return {
      bringToFront: Boolean(e?.bringToFront) && hasSel && !readonly,
      bringForward: Boolean(e?.bringForward) && hasSel && !readonly,
      sendBackward: Boolean(e?.sendBackward) && hasSel && !readonly,
      sendToBack: Boolean(e?.sendToBack) && hasSel && !readonly,
    };
  }, [editor, selectedCount]);

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
      const ids = e.getSelectedShapeIds?.() || [];
      if (!ids.length) return;
      if (typeof e[action] === 'function') return e[action](ids);
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
        ref={containerRef}
        className="pointer-events-auto flex flex-row overflow-hidden rounded-lg border border-neutral-200 bg-white/95 shadow-lg backdrop-blur-sm"
        style={{ 
          width: width + 12, 
          transition: resizing ? 'none' : 'width 160ms ease', 
          position: 'relative',
          margin: '10px',
          height: 'calc(100% - 20px)'
        }}
      >
      {/* 移除开合按钮 */}
      {/* 左侧拖拽调宽手柄 */}
      <div
        onMouseDown={onStartResize}
        style={{
          position: 'absolute',
          top: 0,
          left: -6,
          width: 12,
          height: '100%',
          cursor: 'col-resize',
          zIndex: 1,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 6,
            width: 1,
            height: '100%',
            background: '#e5e7eb',
          }}
        />
      </div>

      <div
        className="flex h-full flex-col overflow-hidden"
        style={{ width }}
      >
            <div className="flex h-full flex-col">
              <Tabs defaultValue="design" className="h-full w-full" variant="ghost">
                {/* 顶部菜单栏：与左侧一致样式，放置三项切换 */}
                <div className="top-button-bar" style={{ padding: '8px 12px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <TabsList>
                    <TabsTrigger value="design">设计</TabsTrigger>
                    {/* <TabsTrigger value="comment">注释</TabsTrigger>
                    <TabsTrigger value="history">历史</TabsTrigger> */}
                  </TabsList>
                  </div>
                </div>

                <div 
                  className="right-sidebar-content" 
                  style={{ 
                    height: 'calc(100% - 48px)',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    scrollbarWidth: 'none', /* Firefox */
                    msOverflowStyle: 'none', /* IE and Edge */
                    /* 内容居中且与左侧保持对称的间距 */
                    padding: '10px 0 12px 12px'
                  }}
                >
                  {!hasSelection ? (
                    <div className="flex h-full flex-col">
                      <div className="flex-1" />
                      <div className="sticky bottom-0 left-0 right-0">
                        <Button className="w-full" variant="outline" onClick={handleExportAll}>导出全部</Button>
                      </div>
                    </div>
                  ) : (
                  <>
                  <TabsContent value="design" className="mt-0">
                    <div className="flex flex-col gap-3">
                      {/* 工具行已移至“位置”块顶部 */}

                      <section>
                        <h1 className="mt-2 mb-2 text-sm font-semibold">位置</h1>
                        <div className="mb-1 text-[11px] text-neutral-500">对齐</div>
                        <div className="mb-2 flex items-center gap-1">
                          <Button size="icon" variant="ghost" title="左对齐" disabled={!canAlign} onClick={() => canAlign && handleAlign('left')}>
                            <AlignLeft size={16} />
                          </Button>
                          <Button size="icon" variant="ghost" title="水平居中" disabled={!canAlign} onClick={() => canAlign && handleAlign('center-horizontal')}>
                            <AlignCenterHorizontal size={16} />
                          </Button>
                          <Button size="icon" variant="ghost" title="右对齐" disabled={!canAlign} onClick={() => canAlign && handleAlign('right')}>
                            <AlignRight size={16} />
                          </Button>
                          <div className="mx-1 h-4 w-px bg-neutral-200" />
                          <Button size="icon" variant="ghost" title="上对齐" disabled={!canAlign} onClick={() => canAlign && handleAlign('top')}>
                            <ArrowUp size={16} />
                          </Button>
                          <Button size="icon" variant="ghost" title="垂直居中" disabled={!canAlign} onClick={() => canAlign && handleAlign('center-vertical')}>
                            <AlignCenterVertical size={16} />
                          </Button>
                          <Button size="icon" variant="ghost" title="下对齐" disabled={!canAlign} onClick={() => canAlign && handleAlign('bottom')}>
                            <ArrowDown size={16} />
                          </Button>
                          <div className="ml-auto" />
                          <Button size="icon" variant="ghost" title="更多">
                            <MoreHorizontal size={16} />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] text-neutral-500">X</span>
                            <input
                              className="h-7 rounded border bg-background px-2"
                              disabled={!hasSelection}
                              value={posX}
                              onFocus={() => setEditingPosX(true)}
                              onChange={(e) => setPosX(e.currentTarget.value.replace(/[^-0-9]/g, ''))}
                              onBlur={() => {
                                setEditingPosX(false);
                                if (!editor) return;
                                const e: any = editor as any;
                                const target = Number(posX);
                                if (Number.isNaN(target)) return;
                                const b = e.getSelectionPageBounds?.();
                                const currentX = b?.x ?? 0;
                                const dx = Math.round(target - currentX);
                                if (!dx) return;
                                const ids = editor.getSelectedShapeIds?.() || [];
                                if (typeof e.nudgeSelectedShapes === 'function') return e.nudgeSelectedShapes({ x: dx, y: 0 });
                                if (typeof e.nudgeShapes === 'function') return e.nudgeShapes(ids, { x: dx, y: 0 });
                                // 兜底：逐个平移
                                ids.forEach((id: any) => {
                                  const s = editor.getShape(id) as any;
                                  if (!s) return;
                                  editor.updateShape({ ...s, x: (s.x || 0) + dx });
                                });
                              }}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] text-neutral-500">Y</span>
                            <input
                              className="h-7 rounded border bg-background px-2"
                              disabled={!hasSelection}
                              value={posY}
                              onFocus={() => setEditingPosY(true)}
                              onChange={(e) => setPosY(e.currentTarget.value.replace(/[^-0-9]/g, ''))}
                              onBlur={() => {
                                setEditingPosY(false);
                                if (!editor) return;
                                const e: any = editor as any;
                                const target = Number(posY);
                                if (Number.isNaN(target)) return;
                                const b = e.getSelectionPageBounds?.();
                                const currentY = b?.y ?? 0;
                                const dy = Math.round(target - currentY);
                                if (!dy) return;
                                const ids = editor.getSelectedShapeIds?.() || [];
                                if (typeof e.nudgeSelectedShapes === 'function') return e.nudgeSelectedShapes({ x: 0, y: dy });
                                if (typeof e.nudgeShapes === 'function') return e.nudgeShapes(ids, { x: 0, y: dy });
                                ids.forEach((id: any) => {
                                  const s = editor.getShape(id) as any;
                                  if (!s) return;
                                  editor.updateShape({ ...s, y: (s.y || 0) + dy });
                                });
                              }}
                            />
                          </div>
                        </div>
                      </section>

                      <Separator className="my-1" />

                      <section>
                        <h1 className="mb-2 text-sm font-semibold">布局</h1>
                        <div className="mb-1 text-[11px] text-neutral-500">图层</div>
                        <div className="mb-2 flex items-center gap-1">
                          <Button size="icon" variant="ghost" title="上移一层" disabled={!canZIndex.bringForward} onClick={() => canZIndex.bringForward && handleZIndex('bringForward')}>
                            <ChevronUp size={16} />
                          </Button>
                          <Button size="icon" variant="ghost" title="下移一层" disabled={!canZIndex.sendBackward} onClick={() => canZIndex.sendBackward && handleZIndex('sendBackward')}>
                            <ChevronDown size={16} />
                          </Button>
                          <Button size="icon" variant="ghost" title="移到最顶" disabled={!canZIndex.bringToFront} onClick={() => canZIndex.bringToFront && handleZIndex('bringToFront')}>
                            <ArrowUpToLine size={16} />
                          </Button>
                          <Button size="icon" variant="ghost" title="移到最低" disabled={!canZIndex.sendToBack} onClick={() => canZIndex.sendToBack && handleZIndex('sendToBack')}>
                            <ArrowDownToLine size={16} />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] text-neutral-500">W</span>
                            <input
                              className="h-7 rounded border bg-background px-2"
                              disabled={!canEditSize}
                              value={sizeW}
                              onFocus={() => setEditingW(true)}
                              onChange={(e) => setSizeW(e.currentTarget.value.replace(/[^0-9]/g, ''))}
                              onBlur={() => {
                                setEditingW(false);
                                if (!editor || !canEditSize) return;
                                const id = (editor.getSelectedShapeIds?.() || [])[0];
                                if (!id) return;
                                const s = editor.getShape(id) as any;
                                const target = Number(sizeW);
                                if (Number.isNaN(target) || target <= 0) return;
                                const e: any = editor as any;
                                if (s?.props) {
                                  editor.updateShape({ ...s, props: { ...s.props, w: target } });
                                } else if (typeof e.resizeSelectedShapes === 'function') {
                                  const b = e.getSelectionPageBounds?.();
                                  const currentW = b?.w ?? 0;
                                  const scaleX = currentW ? target / currentW : 1;
                                  e.resizeSelectedShapes({ scaleX, scaleY: 1 });
                                }
                              }}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] text-neutral-500">H</span>
                            <input
                              className="h-7 rounded border bg-background px-2"
                              disabled={!canEditSize}
                              value={sizeH}
                              onFocus={() => setEditingH(true)}
                              onChange={(e) => setSizeH(e.currentTarget.value.replace(/[^0-9]/g, ''))}
                              onBlur={() => {
                                setEditingH(false);
                                if (!editor || !canEditSize) return;
                                const id = (editor.getSelectedShapeIds?.() || [])[0];
                                if (!id) return;
                                const s = editor.getShape(id) as any;
                                const target = Number(sizeH);
                                if (Number.isNaN(target) || target <= 0) return;
                                const e: any = editor as any;
                                if (s?.props) {
                                  editor.updateShape({ ...s, props: { ...s.props, h: target } });
                                } else if (typeof e.resizeSelectedShapes === 'function') {
                                  const b = e.getSelectionPageBounds?.();
                                  const currentH = b?.h ?? 0;
                                  const scaleY = currentH ? target / currentH : 1;
                                  e.resizeSelectedShapes({ scaleX: 1, scaleY });
                                }
                              }}
                            />
                          </div>
                        </div>
                      </section>

                      <Separator className="my-1" />

                      <section>
                        <h1 className="mb-2 text-sm font-semibold">外观</h1>
                        {/* 暂时注释：圆角输入 */}
                        {false && (
                          <>
                            <div className="mb-1 text-[11px] text-neutral-500">圆角</div>
                            <input
                              className="mb-2 h-7 w-full rounded border bg-background px-2 text-xs"
                              disabled={!hasSelection}
                              value={corner}
                              onFocus={() => setEditingCorner(true)}
                              onChange={(e) => setCorner(e.currentTarget.value.replace(/[^0-9]/g, ''))}
                              onBlur={() => {
                                setEditingCorner(false);
                                const v = Number(corner);
                                if (!Number.isFinite(v)) return;
                                applyCornerToSelection(Math.max(0, v));
                              }}
                            />
                          </>
                        )}
                        <div className="mb-1 text-[11px] text-neutral-500">不透明度</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <SliderPrimitive.Root
                              className={cn('relative flex w-full touch-none select-none items-center')}
                              value={[opacity]}
                              max={100}
                              min={0}
                              step={1}
                              onValueChange={(v) => {
                                const next = Array.isArray(v) ? Number(v[0]) : 0;
                                const clamped = Math.max(0, Math.min(100, next));
                                setEditingOpacity(true);
                                setOpacity(clamped);
                                applyOpacityToSelection(clamped);
                              }}
                              onBlur={() => setEditingOpacity(false)}
                            >
                              <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-md bg-[#E0E0E0] dark:bg-gray-700">
                                <SliderPrimitive.Range className="absolute h-full bg-[#6C6C6C] dark:bg-gray-400" />
                              </SliderPrimitive.Track>
                              <SliderPrimitive.Thumb className="block h-5 w-2 cursor-grab rounded-sm border-0 bg-[#6C6C6C] ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-800 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-300" />
                            </SliderPrimitive.Root>
                          </div>
                          <input
                            className="h-7 w-12 rounded border bg-background px-1 text-right text-xs"
                            value={opacity}
                            onChange={(e) => {
                              const num = Number(e.currentTarget.value.replace(/[^0-9]/g, ''));
                              if (Number.isNaN(num)) return setOpacity(0);
                              const v = Math.max(0, Math.min(100, num));
                              setOpacity(v);
                              applyOpacityToSelection(v);
                            }}
                            onBlur={() => setOpacity((v) => Math.max(0, Math.min(100, v)))}
                          />
                        </div>
                      </section>

                      <Separator className="my-1" />

                      {canShowFill && (
                      <section>
                        <div className="mb-2 flex items-center justify-between">
                          <h1 className="text-sm font-semibold">填充</h1>
                          <Button
                            ref={fillBtnRef}
                            size="icon"
                            variant="ghost"
                            title={fills.length >= 1 ? '仅支持一个填充颜色，删除后可再添加' : '添加填充'}
                            disabled={fills.length >= 1}
                            onClick={() => {
                              if (fills.length >= 1) return;
                              setFillPickerOpen((v) => !v);
                            }}
                          >
                            <Plus size={16} />
                          </Button>
                        </div>
                        {fillPickerOpen && fillPanelPos && createPortal(
                          (
                            <div
                              ref={fillPanelRef}
                              style={{ position: 'fixed', top: fillPanelPos.top, left: fillPanelPos.left, width: 240, height: 420, zIndex: 9999 }}
                              className="rounded-xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-800"
                            >
                              {/* 标题区域 */}
                              <div className="border-b border-neutral-100 px-4 py-3 dark:border-neutral-700">
                                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">颜色</h3>
                              </div>
                              
                              {/* 内容区域 */}
                              <div className="p-4">
                                {/* SV 面板 */}
                                <div
                                  style={{ 
                                    position: 'relative', 
                                    width: 208, 
                                    height: 140, 
                                    background: `hsl(${pickerHue} 100% 50%)`, 
                                    borderRadius: 8, 
                                    cursor: 'crosshair',
                                    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)',
                                  }}
                                  onMouseDown={(e) => {
                                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                                    const update = (clientX: number, clientY: number) => {
                                      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
                                      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
                                      setPickerS(x);
                                      setPickerV(1 - y);
                                    };
                                    update(e.clientX, e.clientY);
                                    const move = (ev: MouseEvent) => update(ev.clientX, ev.clientY);
                                    const up = () => {
                                      document.removeEventListener('mousemove', move);
                                      document.removeEventListener('mouseup', up);
                                    };
                                    document.addEventListener('mousemove', move);
                                    document.addEventListener('mouseup', up, { once: true });
                                  }}
                                >
                                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #fff, rgba(255,255,255,0))', borderRadius: 8 }} />
                                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #000, rgba(0,0,0,0))', borderRadius: 8 }} />
                                  <div style={{ 
                                    position: 'absolute', 
                                    left: pickerS * 208 - 8, 
                                    top: (1 - pickerV) * 140 - 8, 
                                    width: 16, 
                                    height: 16, 
                                    borderRadius: '50%', 
                                    border: '3px solid #fff', 
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.1)' 
                                  }} />
                                </div>
                                {/* Hue 滑条 */}
                                <div
                                  style={{ 
                                    position: 'relative', 
                                    marginTop: 12, 
                                    width: 208, 
                                    height: 16, 
                                    borderRadius: 8, 
                                    cursor: 'pointer', 
                                    background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
                                    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)',
                                  }}
                                  onMouseDown={(e) => {
                                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                                    const update = (clientX: number) => {
                                      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
                                      setPickerHue(x * 360);
                                    };
                                    update(e.clientX);
                                    const move = (ev: MouseEvent) => update(ev.clientX);
                                    const up = () => {
                                      document.removeEventListener('mousemove', move);
                                      document.removeEventListener('mouseup', up);
                                    };
                                    document.addEventListener('mousemove', move);
                                    document.addEventListener('mouseup', up, { once: true });
                                  }}
                                >
                                  <div style={{ 
                                    position: 'absolute', 
                                    left: (pickerHue / 360) * 208 - 8, 
                                    top: -2, 
                                    width: 16, 
                                    height: 20, 
                                    borderRadius: 8, 
                                    background: '#fff', 
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.1)' 
                                  }} />
                                </div>
                                {/* Alpha 滑条 */}
                                <div
                                  style={{ 
                                    position: 'relative', 
                                    marginTop: 12, 
                                    width: 208, 
                                    height: 16, 
                                    borderRadius: 8, 
                                    cursor: 'pointer', 
                                    backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)', 
                                    backgroundSize: '12px 12px', 
                                    backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px',
                                    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)',
                                  }}
                                  onMouseDown={(e) => {
                                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                                    const update = (clientX: number) => {
                                      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
                                      setPickerA(x);
                                    };
                                    update(e.clientX);
                                    const move = (ev: MouseEvent) => update(ev.clientX);
                                    const up = () => {
                                      document.removeEventListener('mousemove', move);
                                      document.removeEventListener('mouseup', up);
                                    };
                                    document.addEventListener('mousemove', move);
                                    document.addEventListener('mouseup', up, { once: true });
                                  }}
                                >
                                  <div style={{ 
                                    position: 'absolute', 
                                    inset: 0, 
                                    borderRadius: 8, 
                                    background: (() => { 
                                      const { r, g, b } = hsvToRgb(pickerHue, pickerS, pickerV); 
                                      return `linear-gradient(to right, rgba(${r},${g},${b},0), rgba(${r},${g},${b},1))`; 
                                    })() 
                                  }} />
                                  <div style={{ 
                                    position: 'absolute', 
                                    left: pickerA * 208 - 8, 
                                    top: -2, 
                                    width: 16, 
                                    height: 20, 
                                    borderRadius: 8, 
                                    background: '#fff', 
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.1)' 
                                  }} />
                                </div>
                                {/* 底部控制区域 */}
                                <div className="mt-4 space-y-3">
                                  <div className="flex items-center gap-1">
                                    <div className="relative">
                                      <select
                                        className="h-8 w-10 appearance-none border border-neutral-200 bg-white px-1 text-xs dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                                        style={{ borderRadius: '5px' }}
                                        value={colorFormat}
                                        onChange={(e) => setColorFormat(e.target.value as any)}
                                      >
                                        <option value="hex">Hex</option>
                                        <option value="rgb">RGB</option>
                                        <option value="css">CSS</option>
                                        <option value="hsl">HSL</option>
                                        <option value="hsb">HSB</option>
                                      </select>
                                      <ChevronDown className="absolute right-0.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 pointer-events-none text-neutral-500" />
                                    </div>
                                    <input
                                      className="h-8 w-24 border border-neutral-200 bg-white px-1.5 text-xs font-mono dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                                      style={{ borderRadius: '5px' }}
                                      value={getColorValue()}
                                      readOnly
                                    />
                                    <input
                                      className="h-8 w-8 border border-neutral-200 bg-white px-1 text-center text-xs dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                                      style={{ borderRadius: '5px' }}
                                      value={Math.round(pickerA * 100)}
                                      onChange={(e) => {
                                        const n = Number(e.currentTarget.value.replace(/[^0-9]/g, ''));
                                        const clamped = isNaN(n) ? 0 : Math.max(0, Math.min(100, n));
                                        setPickerA(clamped / 100);
                                      }}
                                    />
                                    <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">%</span>
                                  </div>
                                  
                                  <Button
                                    size="small"
                                    className="w-full bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                                    onClick={() => {
                                      const { r, g, b } = hsvToRgb(pickerHue, pickerS, pickerV);
                                      const hex = rgbToHex({ r, g, b });
                                      setTempFillColor(hex);
                                      setFills((list) => [hex, ...list]);
                                      // 应用填充颜色到选中的形状
                                      applyFillToSelection(hex);
                                      setFillPickerOpen(false);
                                    }}
                                  >
                                    添加
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ),
                          document.body
                        )}
                        <div className="flex flex-col gap-2 text-xs">
                          {fills.length === 0 && (
                            <div className="text-neutral-400">暂无填充，点击右上角加号添加</div>
                          )}
                          {fills.map((c, idx) => (
                            <div key={idx} className="flex items-center gap-2 rounded border p-2">
                              <div 
                                className="h-4 w-4 rounded-sm border cursor-pointer hover:scale-110 transition-transform" 
                                style={{ background: c }}
                                onClick={() => applyFillToSelection(c)}
                                title="点击应用此颜色"
                              />
                              <span className="text-xs">{c}</span>
                              <div className="ml-auto" />
                              <Button size="small" variant="ghost" onClick={() => setFills((l) => l.filter((_, i) => i !== idx))}>删除</Button>
                            </div>
                          ))}
                        </div>
                      </section>
                      )}

                    </div>
                  </TabsContent>

                  <TabsContent value="comment" className="mt-0" />
                  <TabsContent value="history" className="mt-0" />
                  </>
                  )}
                </div>
              </Tabs>
            </div>
      </div>
      </div>
    </div>
  );
};

export default DesignBoardRightSidebar;


