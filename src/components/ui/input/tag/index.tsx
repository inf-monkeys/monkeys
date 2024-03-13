import React, { useEffect, useState } from 'react';

import { useFocusWithin } from '@mantine/hooks';
import { X } from 'lucide-react';

import { Badge } from '@/components/ui/badge.tsx';
import { Input } from '@/components/ui/input';

interface ITagInputProps {
  value?: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  addOnBlur?: boolean;
}

export const TagInput: React.FC<ITagInputProps> = ({
  value = [],
  onChange,
  placeholder,
  disabled,
  addOnBlur = true,
}) => {
  const { ref, focused } = useFocusWithin();

  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (!focused && addOnBlur && inputValue) {
      onChange([...value, inputValue]);
      setInputValue('');
    }
  }, [focused]);

  return (
    <div
      className="flex min-h-10 w-full flex-wrap items-center gap-1 rounded-md border border-input px-3 py-2 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-vines-500 has-[:focus-visible]:ring-offset-2"
      onClick={() => ref.current?.focus()}
    >
      {value?.map((tag, index) => (
        <Badge className="group" key={index} onClick={() => !disabled && onChange(value.filter((_, i) => i !== index))}>
          {tag}
          <X className="-mr-1 ml-1 cursor-pointer group-hover:[&]:stroke-gray-8" size={14} />
        </Badge>
      ))}
      <Input
        ref={ref}
        className="peer h-auto w-auto flex-1 rounded-none border-none p-0 focus-visible:ring-transparent"
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
      />
    </div>
  );
};
