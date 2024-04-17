import React, { forwardRef, useCallback, useMemo, useState } from 'react';

import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDownIcon, type LucideIcon } from 'lucide-react';

import { AccordionContent, AccordionTrigger } from '@/components/ui/accordion.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { cn } from '@/utils';

interface TreeDataItem<T = unknown> {
  id: string;
  label: string;
  value?: T;
  icon?: LucideIcon;
  children?: TreeDataItem[];
}

type TreeProps<R = unknown> = React.HTMLAttributes<HTMLDivElement> & {
  data: TreeDataItem<R>[] | TreeDataItem<R>;
  initialSelectedItemId?: string;
  onSelectChange?: (item: R | TreeDataItem | undefined) => void;
  expandAll?: boolean;
  folderIcon?: LucideIcon;
  itemIcon?: LucideIcon;
  labelRenderer?: (item: any, onExpand: () => void) => React.ReactNode;
  leafRenderer?: (item: any) => React.ReactNode;
};

const Tree = forwardRef<HTMLDivElement, TreeProps>(
  ({ data, initialSelectedItemId, onSelectChange, expandAll, folderIcon, itemIcon, className, ...props }, ref) => {
    const [selectedItemId, setSelectedItemId] = useState<string | undefined>(initialSelectedItemId);

    const handleSelectChange = useCallback(
      (item: TreeDataItem | undefined) => {
        setSelectedItemId(item?.id);
        onSelectChange?.(item?.value ?? item);
      },
      [onSelectChange],
    );

    const expandedItemIds = useMemo(() => {
      const ids: string[] = [];

      function walkTreeItems(items: TreeDataItem[] | TreeDataItem, targetId?: string) {
        if (items instanceof Array) {
          for (let i = 0; i < items.length; i++) {
            ids.push(items[i]!.id);
            if (walkTreeItems(items[i]!, targetId) && !expandAll) {
              return true;
            }
            if (!expandAll) ids.pop();
          }
        } else if (!expandAll && items.id === targetId) {
          return true;
        } else if (items.children) {
          return walkTreeItems(items.children, targetId);
        }
      }

      walkTreeItems(data, initialSelectedItemId);
      return ids;
    }, [data, initialSelectedItemId]);

    return (
      <div className={cn('overflow-hidden', className)}>
        <ScrollArea>
          <div className="relative p-2">
            <TreeItem
              data={data}
              ref={ref}
              selectedItemId={selectedItemId}
              handleSelectChange={handleSelectChange}
              expandedItemIds={expandedItemIds}
              FolderIcon={folderIcon}
              ItemIcon={itemIcon}
              {...props}
            />
          </div>
        </ScrollArea>
      </div>
    );
  },
);

Tree.displayName = 'Tree';

type TreeItemProps = TreeProps & {
  selectedItemId?: string;
  handleSelectChange: (item: TreeDataItem | undefined) => void;
  expandedItemIds: string[];
  FolderIcon?: LucideIcon;
  ItemIcon?: LucideIcon;
};

const TreeItem = forwardRef<HTMLDivElement, TreeItemProps>(
  (
    {
      className,
      data,
      selectedItemId,
      handleSelectChange,
      expandedItemIds,
      FolderIcon,
      ItemIcon,
      labelRenderer,
      leafRenderer,
      ...props
    },
    ref,
  ) => {
    return (
      <div ref={ref} role="tree" className={className} {...props}>
        <ul className="flex flex-col gap-1">
          {data instanceof Array ? (
            data.map((item) => (
              <li key={item.id}>
                {item.children?.length ? (
                  <AccordionPrimitive.Root type="multiple" defaultValue={expandedItemIds}>
                    <AccordionPrimitive.Item value={item.id}>
                      <AccordionTrigger
                        className={cn(
                          'flex items-center rounded-md border border-transparent bg-background p-2 transition-colors hover:border-input hover:bg-accent hover:text-accent-foreground [&[data-state=open]>svg]:rotate-180',
                          selectedItemId === item.id &&
                            'border-input shadow-sm hover:bg-accent hover:text-accent-foreground',
                          labelRenderer && 'p-0 pr-2',
                        )}
                        onClick={() => !labelRenderer && handleSelectChange(item)}
                      >
                        {item.icon && (
                          <item.icon className="mr-2 h-4 w-4 shrink-0 text-accent-foreground/50" aria-hidden="true" />
                        )}
                        {!item.icon && FolderIcon && (
                          <FolderIcon className="mr-2 h-4 w-4 shrink-0 text-accent-foreground/50" aria-hidden="true" />
                        )}
                        {labelRenderer ? (
                          labelRenderer(item, () => handleSelectChange(item))
                        ) : (
                          <span className="truncate text-sm">{item.label}</span>
                        )}
                        <ChevronDownIcon className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                      </AccordionTrigger>
                      <AccordionContent className="mt-1 pl-6">
                        <TreeItem
                          data={item.children ? item.children : item}
                          selectedItemId={selectedItemId}
                          handleSelectChange={handleSelectChange}
                          expandedItemIds={expandedItemIds}
                          FolderIcon={FolderIcon}
                          ItemIcon={ItemIcon}
                          labelRenderer={labelRenderer}
                          leafRenderer={leafRenderer}
                        />
                      </AccordionContent>
                    </AccordionPrimitive.Item>
                  </AccordionPrimitive.Root>
                ) : (
                  <Leaf
                    item={item}
                    isSelected={selectedItemId === item.id}
                    onClick={() => handleSelectChange(item)}
                    Icon={ItemIcon}
                  >
                    {leafRenderer?.(item)}
                  </Leaf>
                )}
              </li>
            ))
          ) : (
            <li>
              <Leaf
                item={data}
                isSelected={selectedItemId === data.id}
                onClick={() => handleSelectChange(data)}
                Icon={ItemIcon}
              >
                {leafRenderer?.(data)}
              </Leaf>
            </li>
          )}
        </ul>
      </div>
    );
  },
);

TreeItem.displayName = 'TreeItem';

const Leaf = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    item: TreeDataItem;
    isSelected?: boolean;
    Icon?: LucideIcon;
  }
>(({ className, item, isSelected, Icon, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'flex cursor-pointer items-center rounded-md border border-transparent bg-background p-2 transition-colors hover:border-input hover:bg-accent hover:text-accent-foreground',
        className,
        children && 'p-0',
        isSelected && 'border-input shadow-sm',
      )}
      {...props}
    >
      {item.icon && <item.icon className="mr-2 h-4 w-4 shrink-0 text-accent-foreground/50" aria-hidden="true" />}
      {!item.icon && Icon && <Icon className="mr-2 h-4 w-4 shrink-0 text-accent-foreground/50" aria-hidden="true" />}
      {children ? children : <span className="truncate text-sm">{item.label}</span>}
    </div>
  );
});

Leaf.displayName = 'Leaf';

export { Tree, type TreeDataItem };
