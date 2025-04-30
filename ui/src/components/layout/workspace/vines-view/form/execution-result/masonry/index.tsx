import React from 'react';

import { useWindowSize } from '@react-hook/window-size';
import {
  MasonryScroller,
  type MasonryScrollerProps,
  useContainerPosition,
  usePositioner,
  type UsePositionerOptions,
  useResizeObserver,
  useScrollToIndex,
  type UseScrollToIndexOptions,
} from 'masonic';

export function Masonry<Item>(props: MasonryProps<Item>) {
  const containerRef = props.containerRef;
  const windowSize = useWindowSize({
    initialWidth: props.ssrWidth,
    initialHeight: props.ssrHeight,
  });
  const containerPos = useContainerPosition(containerRef, windowSize);
  const nextProps = Object.assign(
    {
      offset: containerPos.offset,
      width: containerPos.width,
      height: containerRef.current!.scrollHeight ?? 800,
      containerRef,
    },
    props,
  ) as any;
  nextProps.positioner = usePositioner(nextProps);
  nextProps.resizeObserver = useResizeObserver(nextProps.positioner);
  const scrollToIndex = useScrollToIndex(nextProps.positioner, {
    height: nextProps.height,
    offset: containerPos.offset,
    align: typeof props.scrollToIndex === 'object' ? props.scrollToIndex.align : void 0,
  });
  const index =
    props.scrollToIndex && (typeof props.scrollToIndex === 'number' ? props.scrollToIndex : props.scrollToIndex.index);

  React.useEffect(() => {
    if (index !== void 0) scrollToIndex(index);
  }, [index, scrollToIndex]);

  return React.createElement(MasonryScroller, nextProps);
}

export interface MasonryProps<Item>
  extends Omit<MasonryScrollerProps<Item>, 'offset' | 'width' | 'height' | 'containerRef' | 'positioner'>,
    Pick<
      UsePositionerOptions,
      'columnWidth' | 'columnGutter' | 'rowGutter' | 'columnCount' | 'maxColumnCount' | 'maxColumnWidth'
    > {
  /**
   * Scrolls to a given index within the grid. The grid will re-scroll
   * any time the index changes.
   */
  scrollToIndex?:
    | number
    | {
        index: number;
        align: UseScrollToIndexOptions['align'];
      };
  /**
   * This is the width that will be used for the browser `window` when rendering this component in SSR.
   * This prop isn't relevant for client-side only apps.
   */
  ssrWidth?: number;
  /**
   * This is the height that will be used for the browser `window` when rendering this component in SSR.
   * This prop isn't relevant for client-side only apps.
   */
  ssrHeight?: number;
  width?: number;
  containerRef: React.MutableRefObject<HTMLElement | null>;
  /**
   * This determines how often (in frames per second) to update the scroll position of the
   * browser `window` in state, and as a result the rate the masonry grid recalculates its visible cells.
   * The default value of `12` has been very reasonable in my own testing, but if you have particularly
   * heavy `render` components it may be prudent to reduce this number.
   *
   * @default 12
   */
  scrollFps?: number;
}

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  Masonry.displayName = 'Masonry';
}
