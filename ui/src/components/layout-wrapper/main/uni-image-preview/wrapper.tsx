import React from 'react';

import { useSystemConfig } from '@/apis/common';

import { useUniImagePreview } from './context';

interface UniImagePreviewWrapperProps {
  children: React.ReactNode;
  imageUrl?: string;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

export const UniImagePreviewWrapper: React.FC<UniImagePreviewWrapperProps> = ({
  children,
  imageUrl,
  onClick,
  className,
}) => {
  const { openPreview } = useUniImagePreview();
  const { data: oem } = useSystemConfig();
  const enableUniImagePreview = oem?.theme.uniImagePreview ?? false;

  if (!enableUniImagePreview) {
    return <>{children}</>;
  }

  const childElement = React.Children.only(children) as React.ReactElement;
  const childOnClick = childElement.props.onClick as ((e: React.MouseEvent) => void) | undefined;

  const handleClick = (e: React.MouseEvent) => {
    childOnClick?.(e);
    onClick?.(e);
    if (e.defaultPrevented) return;

    // 尝试从子元素中获取图片URL
    const target = e.target as HTMLElement | null;
    const img = target instanceof HTMLElement ? (target.tagName === 'IMG' ? target : target.closest('img')) : null;

    if (img instanceof HTMLImageElement) {
      openPreview(imageUrl || img.src);
    }
  };

  return React.cloneElement(childElement, {
    onClick: handleClick,
    className: className ? `${childElement.props.className || ''} ${className}`.trim() : childElement.props.className,
    style: {
      ...childElement.props.style,
      cursor: 'pointer',
    },
  });
};
