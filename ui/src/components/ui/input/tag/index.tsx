import React, { cloneElement, forwardRef, ReactElement, useEffect, useRef, useState } from 'react';

import { useFocusWithin, useMemoizedFn, useThrottleEffect } from 'ahooks';
import { BasicTarget } from 'ahooks/lib/utils/domTarget';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckIcon, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CustomItemComponentProps, Virtualizer } from 'virtua';

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { MultiSelectOption } from '@/components/ui/multi-select';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { cn } from '@/utils';

interface ITagInputProps extends Omit<React.HTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  addOnBlur?: boolean;

  options?: MultiSelectOption[];
}

const Item = forwardRef<HTMLDivElement, CustomItemComponentProps>(({ children, style, ...props }, ref) => {
  children = children as ReactElement;

  return cloneElement(children, {
    ref,
    style: { ...children.props.style, ...style },
    ...props,
  });
});
Item.displayName = 'Item';

export const TagInput = forwardRef<HTMLInputElement, ITagInputProps>(
  ({ value = [], onChange, placeholder, disabled, addOnBlur = true, options = [], ...props }, ref) => {
    const { t } = useTranslation();

    const inputRef = useRef<HTMLInputElement | null>(null);
    const focused = useFocusWithin(ref as BasicTarget<HTMLInputElement>);

    const [inputValue, setInputValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [onScrollbar, setOnScrollbar] = useState(false);

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

    const [focusDeleteTagIndex, setFocusDeleteTagIndex] = useState<number | null>(null);

    const [isAllSelected, setIsAllSelected] = useState(false);
    const toggleAll = useMemoizedFn(() => {
      if (isAllSelected) {
        onChange(value.filter((tag) => !options.some((option) => option.value === tag)));
      } else {
        onChange(Array.from(new Set([...value, ...options.map((option) => option.value)])));
      }
    });
    useThrottleEffect(
      () => {
        setIsAllSelected(options.every((option) => value.includes(option.value)));
      },
      [options, value],
      { wait: 100 },
    );

    const length = value?.length ?? 0;
    const optionsLength = options.length;
    const hasOptions = optionsLength !== 0;

    const scrollRef = useRef<HTMLDivElement>(null);

    return (
      <div
        ref={ref}
        className="relative flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input px-3 py-2 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-vines-500 has-[:focus-visible]:ring-offset-2"
        onClick={() => inputRef.current?.focus()}
      >
        {value?.map((tag, i) => (
          <div
            className="flex min-h-6 items-center rounded bg-secondary py-1 ring-offset-background data-[state=active]:ring-2 data-[state=active]:ring-vines-500 data-[state=active]:ring-offset-2"
            data-state={i === focusDeleteTagIndex ? 'active' : ''}
            key={i}
          >
            <span className="select-none rounded bg-transparent pl-2 text-xs">{tag}</span>
            <button
              className={cn(
                'rounded-full px-1 outline-none ring-offset-background focus:ring-2 focus:ring-vines-500 focus:ring-offset-2',
                disabled && 'hidden',
              )}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleUnselect(i);
                }
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={() => handleUnselect(i)}
            >
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
        ))}
        <Input
          ref={inputRef}
          className="peer h-auto w-auto flex-1 rounded-none border-none bg-transparent p-0 ring-transparent ring-offset-transparent focus-visible:ring-transparent"
          value={inputValue}
          onChange={setInputValue}
          placeholder={placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            if (!onScrollbar) {
              setIsFocused(false);
            }
          }}
          onEnterPress={() => {
            if (inputValue) {
              onChange([...value, inputValue]);
              setInputValue('');
            }
          }}
          onDelPress={() => {
            if (focusDeleteTagIndex !== null) {
              onChange(value.filter((_, i) => i !== focusDeleteTagIndex));
              setFocusDeleteTagIndex(null);
            } else {
              setFocusDeleteTagIndex(length - 1 < 0 ? 0 : length - 1);
            }
          }}
          {...props}
        />

        <AnimatePresence>
          {isFocused && hasOptions && (
            <motion.div
              className="absolute -bottom-36 left-0 -mb-1.5 w-full rounded border border-input shadow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onMouseLeave={() => setOnScrollbar(false)}
              onMouseEnter={() => setOnScrollbar(true)}
              onMouseUp={() => inputRef.current?.focus()}
            >
              <Command className="[&_[cmdk-input-wrapper]]:invisible [&_[cmdk-input-wrapper]]:h-0">
                <CommandInput className="invisible" placeholder={t('components.ui.multi-select.search-placeholder')} />
                <CommandList className="relative">
                  <CommandEmpty className="vines-center absolute left-0 top-0 size-full text-center text-sm">
                    {t('components.ui.multi-select.search-empty')}
                  </CommandEmpty>
                  <ScrollArea ref={scrollRef} style={{ height: 141 }} disabledOverflowMask>
                    <CommandGroup>
                      {!inputValue && optionsLength > 1 && (
                        <div>
                          <CommandItem
                            key="all"
                            onSelect={toggleAll}
                            className="cursor-pointer"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          >
                            <div
                              className={cn(
                                'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                isAllSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible',
                              )}
                            >
                              <CheckIcon className="h-4 w-4" />
                            </div>
                            <span>{t('components.ui.multi-select.select-all')}</span>
                          </CommandItem>
                        </div>
                      )}
                      <Virtualizer scrollRef={scrollRef} item={Item}>
                        {options
                          .filter((it) =>
                            inputValue ? it.label.toLowerCase().includes(inputValue.toLowerCase()) : true,
                          )
                          .map((option, i) => {
                            const isSelected = value.includes(option.value);
                            return (
                              <div key={i}>
                                <CommandItem
                                  onSelect={() => {
                                    if (isSelected) {
                                      onChange(value.filter((tag) => tag !== option.value));
                                    } else {
                                      onChange([...value, option.value]);
                                    }
                                  }}
                                  className="cursor-pointer"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                >
                                  <div
                                    className={cn(
                                      'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                      isSelected
                                        ? 'bg-primary text-primary-foreground'
                                        : 'opacity-50 [&_svg]:invisible',
                                    )}
                                  >
                                    <CheckIcon className="h-4 w-4" />
                                  </div>
                                  {option.icon && <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                                  <span>{option.label}</span>
                                </CommandItem>
                              </div>
                            );
                          })}
                      </Virtualizer>
                    </CommandGroup>
                  </ScrollArea>
                </CommandList>
              </Command>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  },
);
TagInput.displayName = 'TagInput';
