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

  const handleClick = (e: React.MouseEvent) => {
    onClick?.(e);

    // 尝试从子元素中获取图片URL
    const imgElement = e.target as HTMLElement;
    const img = imgElement.tagName === 'IMG' ? imgElement : imgElement.querySelector('img');

    if (img instanceof HTMLImageElement) {
      openPreview(imageUrl || img.src);
    }
  };

  if (!enableUniImagePreview) {
    return children;
  }

  return React.cloneElement(React.Children.only(children) as React.ReactElement, {
    onClick: handleClick,
    className: className
      ? `${(children as React.ReactElement).props.className || ''} ${className}`.trim()
      : (children as React.ReactElement).props.className,
    style: {
      ...(children as React.ReactElement).props.style,
      cursor: 'pointer',
    },
  });
};
