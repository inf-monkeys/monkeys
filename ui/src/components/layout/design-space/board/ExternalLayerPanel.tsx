import { capitalize } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Editor, TLShapeId } from 'tldraw';
import { VisibilityOff, VisibilityOn } from './icons';

interface ExternalLayerPanelProps {
  editor: Editor;
}

// 递归的形状项组件
const ShapeItem: React.FC<{
  shapeId: TLShapeId;
  editor: Editor;
  depth: number;
  parentIsSelected?: boolean;
  parentIsHidden?: boolean;
}> = ({ shapeId, editor, depth, parentIsSelected = false, parentIsHidden = false }) => {
  const [shape, setShape] = useState<any>(null);
  const [children, setChildren] = useState<TLShapeId[]>([]);
  const [isHidden, setIsHidden] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [shapeName, setShapeName] = useState('');
  const [isEditingShapeName, setIsEditingShapeName] = useState(false);

  // 获取形状名称
  // 优先 meta.name；
  // frame: 优先 props.name；
  // geo: 使用 props.geo 的具体形状名（如 rectangle / ellipse 等），而不是统一的 Geo；
  // 其余：props.text / props.name；再退化为 util.getText 或类型名。
  const getShapeName = (editor: Editor, shapeId: TLShapeId): string => {
    const shape = editor.getShape(shapeId);
    if (!shape) return 'Unknown shape';
    const metaName = (shape as any).meta?.name as string | undefined;
    const propsText = (shape as any).props?.text as string | undefined;
    const propsName = (shape as any).props?.name as string | undefined;
    const type = (shape as any).type as string;
    const geoKind = (shape as any).props?.geo as string | undefined;
    // 对 frame 优先读取 props.name（tldraw 默认即为“Frame”且可编辑），避免回退到“Frame shape”
    if (type === 'frame' && (propsName?.trim() || metaName?.trim())) {
      return (metaName?.trim() || propsName?.trim()) as string;
    }
    // 对 geo 使用具体图形名（如 Rectangle / Ellipse），避免统一显示为 Geo
    if (type === 'geo') {
      if (metaName?.trim()) return metaName.trim();
      if (propsName?.trim()) return propsName.trim();
      if (propsText?.trim()) return propsText.trim();
      if (geoKind) {
        const label = geoKind.replace(/[-_]+/g, ' ');
        return capitalize(label);
      }
      return (
        editor.getShapeUtil(shape).getText(shape) ||
        capitalize(type)
      );
    }
    return (
      (metaName && metaName.trim()) ||
      (propsText && propsText.trim()) ||
      (propsName && propsName.trim()) ||
      editor.getShapeUtil(shape).getText(shape) ||
      capitalize(type)
    );
  };

  // 更新形状状态
  const updateShapeState = () => {
    if (!editor) return;
    
    try {
      const currentShape = editor.getShape(shapeId);
      const currentChildren = editor.getSortedChildIdsForParent(shapeId);
      const currentIsHidden = editor.isShapeHidden(shapeId);
      const currentIsSelected = editor.getSelectedShapeIds().includes(shapeId);
      const currentShapeName = getShapeName(editor, shapeId);
      
      setShape(currentShape);
      setChildren(currentChildren);
      setIsHidden(currentIsHidden);
      setIsSelected(currentIsSelected);
      setShapeName(currentShapeName);
    } catch (error) {
      console.warn('Error updating shape state:', error);
    }
  };

  // 监听变化
  useEffect(() => {
    if (!editor) return;
    
    updateShapeState();
    
    const dispose = editor.store.listen(() => {
      updateShapeState();
    });
    
    return dispose;
  }, [editor, shapeId]);

  // 处理点击
  const handleClick = () => {
    if (!editor || !shape) return;
    
    try {
      if (editor.inputs.ctrlKey || editor.inputs.shiftKey) {
        if (isSelected) {
          editor.deselect(shape);
        } else {
          editor.select(...editor.getSelectedShapes(), shape);
        }
      } else {
        editor.select(shape);
      }
    } catch (error) {
      console.warn('Error selecting shape:', error);
    }
  };

  // 处理可见性切换
  const handleToggleVisibility = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!editor || !shape) return;
    
    try {
      editor.updateShape({
        ...shape,
        meta: {
          ...shape.meta,
          hidden: !shape.meta.hidden,
        },
      });
    } catch (error) {
      console.warn('Error toggling visibility:', error);
    }
  };

  // 重命名图层：同步到 meta.name 以及可能存在的 props 字段（text / name）
  const handleRenameShape = (newName: string) => {
    if (!editor || !shape) return;
    const trimmed = newName.trim();
    try {
      const next: any = { ...shape };
      next.meta = { ...(shape as any).meta, name: trimmed || shapeName };

      // 同步到常见可见文本字段
      if (next.props) {
        // 文本/便签
        if (typeof next.props.text === 'string') {
          next.props = { ...next.props, text: trimmed || shapeName };
        }
        // frame 的名称
        if (typeof next.props.name === 'string') {
          next.props = { ...next.props, name: trimmed || shapeName };
        }
      }

      editor.updateShape(next);
      setShapeName(trimmed || shapeName);
    } catch (e) {
      // ignore
    }
    setIsEditingShapeName(false);
  };

  if (!shape) return null;

  const selectedBg = '#E8F4FE';
  const childSelectedBg = '#F3F9FE';
  const childBg = '#00000006';

  return (
    <>
      <div
        className="shape-item"
        onClick={handleClick}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setIsEditingShapeName(true);
        }}
        style={{
          paddingLeft: 10 + depth * 20,
          opacity: isHidden ? 0.5 : 1,
          background: isSelected
            ? selectedBg
            : parentIsSelected
              ? childSelectedBg
              : depth > 0
                ? childBg
                : undefined,
        }}
      >
        {isEditingShapeName ? (
          <input
            autoFocus
            className="shape-name-input"
            defaultValue={shapeName}
            onClick={(e) => e.stopPropagation()}
            onBlur={(e) => handleRenameShape(e.currentTarget.value)}
            onKeyDown={(ev) => {
              if (ev.key === 'Enter') handleRenameShape((ev.target as HTMLInputElement).value);
              if (ev.key === 'Escape') setIsEditingShapeName(false);
            }}
            style={{ border: 'none', background: 'none', outline: 'none', fontSize: '13px', width: '100%' }}
          />
        ) : (
          <div className="shape-name">{shapeName}</div>
        )}
        <button
          className="shape-visibility-toggle"
          onClick={handleToggleVisibility}
        >
          {shape.meta.hidden ? <VisibilityOff /> : <VisibilityOn />}
        </button>
      </div>
      
      {children.length > 0 && (
        <div>
          {children.map((childId) => (
            <ShapeItem
              key={childId}
              shapeId={childId}
              editor={editor}
              depth={depth + 1}
              parentIsSelected={parentIsSelected || isSelected}
              parentIsHidden={parentIsHidden || isHidden}
            />
          ))}
        </div>
      )}
    </>
  );
};

// 页面项组件
const PageItem: React.FC<{
  pageId: string;
  editor: Editor;
  isActive: boolean;
}> = ({ pageId, editor, isActive }) => {
  const [pageName, setPageName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  // 获取页面名称
  const getPageName = () => {
    try {
      const page = editor.getPage(pageId as any);
      return page?.name || 'Untitled Page';
    } catch (error) {
      return 'Untitled Page';
    }
  };

  // 更新页面名称
  useEffect(() => {
    setPageName(getPageName());
  }, [pageId, editor]);

  // 监听页面变化
  useEffect(() => {
    if (!editor) return;
    
    const dispose = editor.store.listen(() => {
      setPageName(getPageName());
    });
    
    return dispose;
  }, [editor, pageId]);

  // 切换到此页面
  const handlePageClick = () => {
    if (!isActive) {
      editor.setCurrentPage(pageId as any);
    }
  };

  // 重命名页面
  const handleRename = (newName: string) => {
    if (newName.trim() && newName !== pageName) {
      try {
        editor.renamePage(pageId as any, newName.trim());
      } catch (error) {
        console.warn('Error renaming page:', error);
      }
    }
    setIsEditingName(false);
  };

  return (
    <div
      className="page-item"
      onClick={handlePageClick}
      onDoubleClick={() => setIsEditingName(true)}
      style={{
        padding: '8px 12px',
        cursor: 'pointer',
        backgroundColor: isActive ? '#E8F4FE' : 'transparent',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {isEditingName ? (
        <input
          autoFocus
          className="page-name-input"
          defaultValue={pageName}
          onBlur={() => setIsEditingName(false)}
          onChange={(ev) => handleRename(ev.target.value)}
          onKeyDown={(ev) => {
            if (ev.key === 'Enter' || ev.key === 'Escape') {
              handleRename(ev.currentTarget.value);
            }
          }}
          style={{
            border: 'none',
            background: 'none',
            outline: 'none',
            fontSize: '13px',
            width: '100%',
          }}
        />
      ) : (
        <div style={{ fontSize: '13px', fontWeight: isActive ? 'bold' : 'normal' }}>
          {pageName}
        </div>
      )}
    </div>
  );
};

export const ExternalLayerPanel: React.FC<ExternalLayerPanelProps> = ({ editor }) => {
  const [currentPageShapeIds, setCurrentPageShapeIds] = useState<TLShapeId[]>([]);
  const [pages, setPages] = useState<{ id: string; name: string }[]>([]);
  const [currentPageId, setCurrentPageId] = useState<string>('');
  const [pagesSectionHeight, setPagesSectionHeight] = useState(200); // 页面部分的高度
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartHeight, setDragStartHeight] = useState(0);
  const [searchQuery, setSearchQuery] = useState(''); // 页面搜索查询
  const [isPageSectionCollapsed, setIsPageSectionCollapsed] = useState(false); // 页面区域是否收起
  const [totalAvailableHeight, setTotalAvailableHeight] = useState(0); // 可用的总高度
  const [isSearchVisible, setIsSearchVisible] = useState(false); // 搜索框是否显示
  const panelRef = useRef<HTMLDivElement>(null); // 整个面板的引用

  // 更新页面列表
  const updatePages = () => {
    if (!editor) return;
    
    try {
      const allPages = editor.getPages();
      const pageList = allPages.map(page => ({
        id: page.id,
        name: page.name || 'Untitled Page'
      }));
      setPages(pageList);
      setCurrentPageId(editor.getCurrentPageId());
    } catch (error) {
      console.warn('Error updating pages:', error);
    }
  };

  // 更新当前页面的顶级形状
  const updateCurrentPageShapes = () => {
    if (!editor) return;
    
    try {
      const currentPageId = editor.getCurrentPageId();
      const shapeIds = editor.getSortedChildIdsForParent(currentPageId);
      setCurrentPageShapeIds(shapeIds);
    } catch (error) {
      console.warn('Error updating current page shapes:', error);
    }
  };

  // 监听编辑器变化
  useEffect(() => {
    if (!editor) return;
    
    updatePages();
    updateCurrentPageShapes();
    
    const dispose = editor.store.listen(() => {
      updatePages();
      updateCurrentPageShapes();
    });
    
    return dispose;
  }, [editor]);

  // 计算可用的总高度
  const calculateAvailableHeight = useCallback(() => {
    if (!panelRef.current) return;
    
    const panelHeight = panelRef.current.clientHeight;
    
    // 计算固定元素的高度
    const pageHeaderHeight = 50; // 页面标题栏高度
    const layerHeaderHeight = 50; // 图层标题栏高度  
    const dragHandleHeight = isPageSectionCollapsed ? 0 : 8; // 拖拽手柄高度
    const fixedHeight = pageHeaderHeight + layerHeaderHeight + dragHandleHeight;
    
    const available = Math.max(200, panelHeight - fixedHeight);
    setTotalAvailableHeight(available);
    
    // 调整页面高度范围
    const minPageHeight = 100;
    const maxPageHeight = Math.max(minPageHeight, available - 150); // 给图层区域至少留150px
    
    if (pagesSectionHeight > maxPageHeight) {
      setPagesSectionHeight(maxPageHeight);
    } else if (pagesSectionHeight < minPageHeight) {
      setPagesSectionHeight(minPageHeight);
    }
  }, [isPageSectionCollapsed, pagesSectionHeight]);

  // 监听窗口大小变化和初始化
  useEffect(() => {
    // 延迟计算，确保DOM已经渲染
    const timer = setTimeout(() => {
      calculateAvailableHeight();
    }, 200);
    
    const handleResize = () => {
      calculateAvailableHeight();
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [calculateAvailableHeight]);

  // 当收起状态改变时重新计算
  useEffect(() => {
    calculateAvailableHeight();
  }, [isPageSectionCollapsed, calculateAvailableHeight]);

  // 处理拖拽开始
  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartY(e.clientY);
    setDragStartHeight(pagesSectionHeight);
    e.preventDefault();
  };

  // 处理拖拽中
  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging || totalAvailableHeight === 0) return;
    
    const deltaY = e.clientY - dragStartY;
    const newHeight = dragStartHeight + deltaY;
    
    // 动态计算最小和最大高度
    const minHeight = 100; // 最小100px
    const maxHeight = Math.max(minHeight, totalAvailableHeight - 150); // 给图层区域至少留150px
    
    const constrainedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
    setPagesSectionHeight(constrainedHeight);
  }, [isDragging, dragStartY, dragStartHeight, totalAvailableHeight]);

  // 处理拖拽结束
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 监听全局鼠标事件
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  // 处理添加新页面
  const handleAddPage = () => {
    if (!editor) return;
    
    try {
      const newPageName = `页面 ${pages.length + 1}`;
      const newPage = editor.createPage({ name: newPageName });
      editor.setCurrentPage(newPage.id as any);
    } catch (error) {
      console.warn('Error adding new page:', error);
    }
  };

  // 处理收起/展开页面区域
  const handleTogglePageSection = () => {
    setIsPageSectionCollapsed(!isPageSectionCollapsed);
  };

  // 过滤页面列表（基于搜索查询）
  const filteredPages = pages.filter(page => 
    page.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 计算图层区域的动态高度  
  const layersHeight = useMemo(() => {
    if (totalAvailableHeight <= 0) return 'auto';
    
    if (isPageSectionCollapsed) {
      // 页面区域收起时，图层区域占据所有可用高度
      return totalAvailableHeight - 50; // 减去图层标题栏高度
    } else {
      // 页面区域展开时，图层区域 = 总高度 - 页面区域高度 - 图层标题栏高度
      const calculated = totalAvailableHeight - pagesSectionHeight - 50;
      const minLayersHeight = 100; // 图层区域最小高度
      return Math.max(minLayersHeight, calculated);
    }
  }, [totalAvailableHeight, isPageSectionCollapsed, pagesSectionHeight]);

  return (
    <div 
      ref={panelRef}
      className="layer-panel" 
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      {/* 页面列表部分 - 可调节高度 */}
      <div 
        className="pages-section" 
        style={{ 
          height: isPageSectionCollapsed ? 'auto' : `${pagesSectionHeight}px`,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          minHeight: isPageSectionCollapsed ? 'auto' : '100px',
          maxHeight: isPageSectionCollapsed ? 'auto' : `${totalAvailableHeight > 0 ? totalAvailableHeight - 150 : 400}px`,
          overflow: 'hidden'
        }}
      >
        {/* 页面标题栏 - 带按钮 */}
        <div 
          className="layer-panel-title" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '10px 12px',
            position: 'relative',
            flexShrink: 0, // 防止标题栏被压缩
            height: '50px', // 固定高度
            boxSizing: 'border-box'
          }}
        >
          <span>页面</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* 搜索按钮 */}
            <button
              onClick={() => {
                setIsSearchVisible(!isSearchVisible);
                if (!isSearchVisible) {
                  // 延迟聚焦，确保输入框已经显示
                  setTimeout(() => {
                    const searchInput = document.querySelector('.page-search-input') as HTMLInputElement;
                    if (searchInput) {
                      searchInput.focus();
                    }
                  }, 10);
                }
              }}
              style={{
                width: '20px',
                height: '20px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '3px',
                fontSize: '12px'
              }}
              title="搜索页面"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              🔍
            </button>
            
            {/* 添加页面按钮 */}
            <button
              onClick={handleAddPage}
              style={{
                width: '20px',
                height: '20px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '3px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
              title="添加新页面"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              +
            </button>
            
            {/* 收起/展开按钮 */}
            <button
              onClick={handleTogglePageSection}
              style={{
                width: '20px',
                height: '20px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '3px',
                fontSize: '10px'
              }}
              title={isPageSectionCollapsed ? "展开页面列表" : "收起页面列表"}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {isPageSectionCollapsed ? '▼' : '▲'}
            </button>
          </div>
        </div>

        {/* 搜索输入框 */}
        <input
          className="page-search-input"
          type="text"
          placeholder="搜索页面..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            display: isSearchVisible ? 'block' : 'none',
            margin: '0 12px 8px 12px',
            padding: '4px 8px',
            border: '1px solid #e1e1e1',
            borderRadius: '4px',
            fontSize: '12px',
            outline: 'none',
            flexShrink: 0, // 防止被压缩
            height: '28px', // 固定高度
            boxSizing: 'border-box'
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'}
          onBlur={(e) => e.currentTarget.style.borderColor = '#e1e1e1'}
        />

        {/* 页面列表 */}
        {!isPageSectionCollapsed && (
          <div 
            className="pages-list" 
            style={{ 
              height: `${pagesSectionHeight - 50 - (isSearchVisible ? 36 : 0)}px`, // 计算实际可用高度：总高度 - 标题栏 - 搜索框（如果显示）
              overflow: 'auto'
            }}
          >
            {filteredPages.length > 0 ? (
              filteredPages.map((page) => (
                <PageItem
                  key={page.id}
                  pageId={page.id}
                  editor={editor}
                  isActive={page.id === currentPageId}
                />
              ))
            ) : (
              <div style={{ 
                padding: '16px', 
                textAlign: 'center', 
                color: '#666', 
                fontSize: '12px' 
              }}>
                {searchQuery ? '未找到匹配的页面' : '暂无页面'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 拖拽手柄 - 只在页面区域展开时显示 */}
      {!isPageSectionCollapsed && (
        <div 
          className="resize-handle"
          onMouseDown={handleDragStart}
          style={{
            height: '8px',
            backgroundColor: isDragging ? '#2563eb' : '#f1f5f9',
            cursor: 'row-resize',
            position: 'relative',
            flexShrink: 0,
            transition: isDragging ? 'none' : 'background-color 0.2s',
            borderTop: '1px solid #e1e1e1',
            borderBottom: '1px solid #e1e1e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            if (!isDragging) {
              e.currentTarget.style.backgroundColor = '#e2e8f0';
            }
          }}
          onMouseLeave={(e) => {
            if (!isDragging) {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
            }
          }}
        >
          {/* 拖拽手柄指示器 */}
          <div style={{
            width: '30px',
            height: '2px',
            backgroundColor: isDragging ? 'white' : '#94a3b8',
            borderRadius: '1px',
            transition: isDragging ? 'none' : 'background-color 0.2s'
          }} />
        </div>
      )}

      {/* 图层列表部分 - 动态高度 */}
      <div className="shapes-section" style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: 0, // 确保可以正确收缩
        overflow: 'hidden'
      }}>
        <div className="layer-panel-title">图层</div>
        <div className="shape-tree" style={{ flex: 1, overflow: 'auto' }}>
          {currentPageShapeIds.map((shapeId) => (
            <ShapeItem
              key={shapeId}
              shapeId={shapeId}
              editor={editor}
              depth={0}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
