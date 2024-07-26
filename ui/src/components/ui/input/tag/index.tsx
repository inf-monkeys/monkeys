import React, { forwardRef, useEffect, useRef, useState } from 'react';

import { useFocusWithin } from 'ahooks';
import { BasicTarget } from 'ahooks/lib/utils/domTarget';
import { X } from 'lucide-react';

import { Badge } from '@/components/ui/badge.tsx';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils';

interface ITagInputProps extends Omit<React.HTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  addOnBlur?: boolean;
}

export const TagInput = forwardRef<HTMLInputElement, ITagInputProps>(
  ({ value = [], onChange, placeholder, disabled, addOnBlur = true, ...props }, ref) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const focused = useFocusWithin(ref as BasicTarget<HTMLInputElement>);

    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
      if (!focused && addOnBlur && inputValue) {
        onChange([...value, inputValue]);
        setInputValue('');
      }
    }, [focused]);

    const handleUnselect = (index: number) => {
      if (disabled) return;
      onChange(value.filter((_, i) => i !== index));
    };

    return (
      <div
        ref={ref}
        className="flex min-h-10 w-full flex-wrap items-center gap-1 rounded-md border border-input px-3 py-2 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-vines-500 has-[:focus-visible]:ring-offset-2"
        onClick={() => inputRef.current?.focus()}
      >
        {value?.map((tag, index) => (
          <Badge className="bg-muted" key={index}>
            <span className="text-xs text-gold-12">{tag}</span>
            <button
              className={cn(
                'ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2',
                disabled && 'hidden',
              )}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleUnselect(index);
                }
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={() => handleUnselect(index)}
            >
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </button>
          </Badge>
        ))}
        <Input
          ref={inputRef}
          className="peer h-auto w-auto flex-1 rounded-none border-none bg-transparent p-0 ring-transparent ring-offset-transparent focus-visible:ring-transparent"
          value={inputValue}
          onChange={setInputValue}
          placeholder={placeholder}
          onEnterPress={() => {
            if (inputValue) {
              onChange([...value, inputValue]);
              setInputValue('');
            }
          }}
          onDelPress={() => onChange(value.slice(0, -1))}
          {...props}
        />
      </div>
    );
  },
);
TagInput.displayName = 'TagInput';
