import { useCallback, useEffect, useRef } from 'react';

export interface InfiniteScrollProps {
  /**
   * 是否正在加载数据
   */
  isLoading: boolean;
  /**
   * 是否还有更多数据
   */
  hasMore: boolean;
  /**
   * 加载下一页的回调函数
   */
  next: () => unknown;
  /**
   * IntersectionObserver 的阈值，范围 0-1
   * @default 1
   */
  threshold?: number;
  /**
   * IntersectionObserver 的 root 元素
   * @default null
   */
  root?: Element | Document | null;
  /**
   * IntersectionObserver 的 rootMargin
   * @default '0px'
   */
  rootMargin?: string;
  /**
   * 是否反向观察（观察第一个元素而不是最后一个）
   * @default false
   */
  reverse?: boolean;
  /**
   * 子元素
   */
  children?: React.ReactNode;
}

export function InfiniteScroll({
  isLoading,
  hasMore,
  next,
  threshold = 1,
  root = null,
  rootMargin = '0px',
  reverse = false,
  children,
}: InfiniteScrollProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  const observerCallback = useCallback(
    (node: HTMLElement | null) => {
      if (isLoading) return;

      // 断开之前的观察
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      // 创建新的 IntersectionObserver
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isLoading) {
            next();
          }
        },
        { threshold, root, rootMargin }
      );

      // 观察新节点
      if (node) {
        observerRef.current.observe(node);
      }
    },
    [hasMore, isLoading, next, threshold, root, rootMargin]
  );

  useEffect(() => {
    // 验证 threshold 值
    if (threshold < 0 || threshold > 1) {
      console.warn('InfiniteScroll: threshold should be between 0 and 1');
    }

    return () => {
      // 清理观察器
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold]);

  // 如果没有子元素，直接返回 null
  if (!children) return null;

  // 将 children 转换为数组
  const childArray = Array.isArray(children) ? children : [children];

  // 找到需要附加 ref 的元素索引
  const targetIndex = reverse ? 0 : childArray.length - 1;

  return (
    <>
      {childArray.map((child, index) => {
        // 如果是目标元素且有更多数据，附加 ref
        if (index === targetIndex && hasMore) {
          return (
            <div key={index} ref={observerCallback}>
              {child}
            </div>
          );
        }
        return <div key={index}>{child}</div>;
      })}
    </>
  );
}
