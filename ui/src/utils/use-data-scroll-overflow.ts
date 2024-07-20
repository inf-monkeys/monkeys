// ref: https://github.com/nextui-org/nextui/blob/b762141d1820a7952dd605fd5b999ef2f611c623/packages/hooks/use-data-scroll-overflow/src/index.ts

import React, { useEffect, useRef } from 'react';

export const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export type ScrollOverflowVisibility = 'auto' | 'top' | 'bottom' | 'left' | 'right' | 'both' | 'none';

export type ScrollOverflowOrientation = 'horizontal' | 'vertical';
export type ScrollOverflowCheck = ScrollOverflowOrientation | 'both';

export interface UseDataScrollOverflowProps {
  /**
   * The reference to the DOM element on which we're checking overflow.
   */
  domRef?: React.RefObject<HTMLElement>;
  /**
   * Determines the direction of overflow to check.
   * - "horizontal" will check for overflow on the x-axis.
   * - "vertical" will check for overflow on the y-axis.
   * - "both" (default) will check for overflow on both axes.
   *
   * @default "both"
   */
  overflowCheck?: ScrollOverflowCheck;
  /**
   * Controlled visible state. Passing "auto" will make the shadow visible only when the scroll reaches the edge.
   * use "left" / "right" for horizontal scroll and "top" / "bottom" for vertical scroll.
   * @default "auto"
   */
  visibility?: ScrollOverflowVisibility;
  /**
   * Enables or disables the overflow checking mechanism.
   * @default true
   */
  isEnabled?: boolean;
  /**
   * Defines a buffer or margin within which we won't treat the scroll as reaching the edge.
   *
   * @default 0 - meaning the check will behave exactly at the edge.
   */
  offset?: number;
  /**
   * List of dependencies to update the overflow check.
   */
  updateDeps?: any[];
  /**
   * Callback to be called when the overflow state changes.
   *
   * @param visibility ScrollOverflowVisibility
   */
  onVisibilityChange?: (overflow: ScrollOverflowVisibility) => void;
}

export function useDataScrollOverflow(props: UseDataScrollOverflowProps = {}) {
  const {
    domRef,
    isEnabled = true,
    overflowCheck = 'vertical',
    visibility = 'auto',
    offset = 0,
    onVisibilityChange,
    updateDeps = [],
  } = props;

  const visibleRef = useRef<ScrollOverflowVisibility>(visibility);

  useEffect(() => {
    const el = domRef?.current;

    if (!el || !isEnabled) return;

    const setAttributes = (
      _direction: string,
      hasBefore: boolean,
      hasAfter: boolean,
      prefix: string,
      suffix: string,
    ) => {
      if (visibility === 'auto') {
        const both = `${prefix}${capitalize(suffix)}Scroll`;

        if (hasBefore && hasAfter) {
          el.dataset[both] = 'true';
          el.removeAttribute(`data-${prefix}-scroll`);
          el.removeAttribute(`data-${suffix}-scroll`);
        } else {
          el.dataset[`${prefix}Scroll`] = hasBefore.toString();
          el.dataset[`${suffix}Scroll`] = hasAfter.toString();
          el.removeAttribute(`data-${prefix}-${suffix}-scroll`);
        }
      } else {
        const next = hasBefore && hasAfter ? 'both' : hasBefore ? prefix : hasAfter ? suffix : 'none';

        if (next !== visibleRef.current) {
          onVisibilityChange?.(next as ScrollOverflowVisibility);
          visibleRef.current = next as ScrollOverflowVisibility;
        }
      }
    };

    const checkOverflow = () => {
      const directions = [
        { type: 'vertical', prefix: 'top', suffix: 'bottom' },
        { type: 'horizontal', prefix: 'left', suffix: 'right' },
      ];

      for (const { type, prefix, suffix } of directions) {
        if (overflowCheck === type || overflowCheck === 'both') {
          const hasBefore = type === 'vertical' ? el.scrollTop > offset : el.scrollLeft > offset;
          const hasAfter =
            type === 'vertical'
              ? el.scrollTop + el.clientHeight + offset < el.scrollHeight
              : el.scrollLeft + el.clientWidth + offset < el.scrollWidth;

          setAttributes(type, hasBefore, hasAfter, prefix, suffix);
        }
      }
    };

    const clearOverflow = () => {
      ['top', 'bottom', 'top-bottom', 'left', 'right', 'left-right'].forEach((attr) => {
        el.removeAttribute(`data-${attr}-scroll`);
      });
    };

    // auto
    checkOverflow();
    el.addEventListener('scroll', checkOverflow);

    // controlled
    if (visibility !== 'auto') {
      clearOverflow();
      if (visibility === 'both') {
        el.dataset.topBottomScroll = String(overflowCheck === 'vertical');
        el.dataset.leftRightScroll = String(overflowCheck === 'horizontal');
      } else {
        el.dataset.topBottomScroll = 'false';
        el.dataset.leftRightScroll = 'false';

        ['top', 'bottom', 'left', 'right'].forEach((attr) => {
          el.dataset[`${attr}Scroll`] = String(visibility === attr);
        });
      }
    }

    return () => {
      el.removeEventListener('scroll', checkOverflow);
      clearOverflow();
    };
  }, [...updateDeps, isEnabled, visibility, overflowCheck, onVisibilityChange, domRef]);
}
