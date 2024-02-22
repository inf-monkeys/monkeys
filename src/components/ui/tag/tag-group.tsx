import React from 'react';

import { Tag } from '@/components/ui/tag/index.tsx';

interface TagGroupProps {
  tagList: {
    color?: 'primary' | 'secondary' | 'tertiary' | 'warning' | 'danger' | null | undefined;
    children: React.ReactNode;
    prefixIcon?: React.ReactNode;
    suffixIcon?: React.ReactNode;
  }[];
  onTagClose?: (tagChildren: React.ReactNode, e: MouseEvent, tagKey?: string | number) => void;
  size?: 'large' | 'small';
  shape?: 'square' | 'circle';
  width?: string | number;
  maxTagCount: number;
  closable?: boolean;
}

const TagGroup: React.FC<TagGroupProps> = ({
  width = 220,
  tagList,
  closable = false,
  maxTagCount,
  onTagClose,
  size,
  shape,
}) => {
  return (
    <div className="flex items-center gap-2 bg-grayA-4 bg-opacity-90 p-2" style={{ width }}>
      {tagList.slice(0, maxTagCount).map((tag, index) => (
        <Tag
          key={index}
          size={size}
          color={tag.color}
          shape={shape}
          closable={closable}
          onClose={onTagClose}
          prefixIcon={tag.prefixIcon}
          suffixIcon={tag.suffixIcon}
        >
          {tag.children}
        </Tag>
      ))}
      {tagList.length - maxTagCount > 0 && (
        <span className="cursor-default text-sm">+{tagList.length - maxTagCount}</span>
      )}
    </div>
  );
};
TagGroup.displayName = 'Tag';

export { TagGroup };
