import React from 'react';

import { Tag } from '@/components/ui/tag/index.tsx';
import { cn } from '@/utils';

export interface ITagGroupItem {
  color?: 'primary' | 'secondary' | 'tertiary' | 'warning' | 'danger' | null | undefined;
  children: React.ReactNode;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
}

export interface ITagGroupProps {
  className?: string;
  tagList: ITagGroupItem[];
  onTagClose?: (tagChildren: React.ReactNode, e: MouseEvent, tagKey?: string | number) => void;
  size?: 'large' | 'small';
  shape?: 'square' | 'circle';
  width?: string | number;
  maxTagCount: number;
  closable?: boolean;
}

const TagGroup: React.FC<ITagGroupProps> = ({
  className,
  width,
  tagList,
  closable = false,
  maxTagCount,
  onTagClose,
  size,
  shape,
}) => {
  return (
    <div className={cn('flex items-center gap-2 rounded-md bg-muted p-2', className)} style={{ width }}>
      {tagList.slice(0, maxTagCount).map((tag, index) => (
        <Tag
          className="bg-slate-5 shadow-sm"
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
