import React from 'react';

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

  const handleClick = (e: React.MouseEvent) => {
    onClick?.(e);

    // 尝试从子元素中获取图片URL
    const imgElement = e.target as HTMLElement;
    const img = imgElement.tagName === 'IMG' ? imgElement : imgElement.querySelector('img');

    if (img instanceof HTMLImageElement) {
      openPreview(imageUrl || img.src);
    }
  };

  return (
    <div className={className} onClick={handleClick} style={{ cursor: 'pointer' }}>
      {children}
    </div>
  );
};
