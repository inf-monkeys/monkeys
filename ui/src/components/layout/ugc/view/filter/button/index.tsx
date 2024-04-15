import React, { useState } from 'react';

import { mutate } from 'swr';

import { format } from 'date-fns';
import { CalendarIcon, Filter } from 'lucide-react';
import { toast } from 'sonner';

import { useTeamUsers } from '@/apis/authz/team';
import { createAssetFilterRules, useAssetTagList } from '@/apis/ugc';
import { IListUgcDto } from '@/apis/ugc/typings.ts';
import { IUgcCustomProps } from '@/components/layout/ugc/typings.ts';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar.tsx';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label.tsx';
import MultipleSelector from '@/components/ui/multiple-selector';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils';

export interface IUgcViewFilterButtonProps extends IUgcCustomProps {
  filter: Partial<IListUgcDto['filter']>;
  onChange: (filter: Partial<IListUgcDto['filter']>) => void;
  defaultAddToFavourite?: boolean;
}

export const UgcViewFilterButton: React.FC<IUgcViewFilterButtonProps> = ({
  filter,
  onChange: onFilterChange,
  defaultAddToFavourite = false,
  assetType,
}) => {
  const [visible, setVisible] = useState(false);

  const { team } = useVinesTeam();

  const { data: teamMember } = useTeamUsers(team?.id);
  const { data: tagsData } = useAssetTagList();

  const [addToFavourite, setAddToFavourite] = useState(defaultAddToFavourite);

  const [filterName, setFilterName] = useState('');

  const defaultUsersOptions = (teamMember?.list ?? []).map((user) => {
    return {
      label: user.name,
      value: user.id,
    };
  });
  const defaultTagsOptions = (tagsData ?? []).map((tag) => {
    return {
      label: tag.name,
      value: tag.id,
    };
  });

  return (
    <Popover open={visible} onOpenChange={setVisible}>
      <Tooltip content="筛选">
        <PopoverTrigger asChild>
          <TooltipTrigger asChild>
            <Button icon={<Filter />} variant="outline" size="small" />
          </TooltipTrigger>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent className="flex w-72 flex-col gap-2">
        <div className="flex flex-col gap-3">
          <Label>创建者</Label>
          <MultipleSelector
            value={(filter?.userIds ?? []).map((userId) => {
              return {
                label: teamMember?.list.find((user) => user.id === userId)?.name ?? '未知用户',
                value: userId,
              };
            })}
            onChange={(options) => {
              onFilterChange({
                ...filter,
                userIds: options.map((option) => option.value),
              });
            }}
            defaultOptions={defaultUsersOptions}
            placeholder="请选择用户"
          />
        </div>
        <div className="flex flex-col gap-3">
          <Label>标签</Label>
          <MultipleSelector
            value={(filter?.tagIds ?? []).map((tagId) => {
              const tag = tagsData?.find((x) => x.id === tagId);
              return {
                label: tag?.name || tagId,
                value: tagId,
              };
            })}
            onChange={(options) => {
              onFilterChange({
                ...filter,
                tagIds: options.map((option) => option.value),
              });
            }}
            defaultOptions={defaultTagsOptions}
            placeholder="请选择标签"
          />
        </div>
        <div className="mb-2 flex flex-col gap-3">
          <Label>创建时间</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  (!filter.createdTimestamp || filter.createdTimestamp.length === 0) && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filter.createdTimestamp?.[0] ? (
                  filter.createdTimestamp?.[1] ? (
                    <>
                      {format(filter.createdTimestamp[0], 'yyyy-MM-dd')} -{' '}
                      {format(filter.createdTimestamp[1], 'yyyy-MM-dd')}
                    </>
                  ) : (
                    format(filter.createdTimestamp[0], 'yyyy-MM-dd')
                  )
                ) : (
                  <span>请选择创建时间</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={filter.createdTimestamp?.[0] ? new Date(filter.createdTimestamp[0]) : undefined}
                selected={{
                  from: filter.createdTimestamp?.[0] ? new Date(filter.createdTimestamp[0]) : undefined,
                  to: filter.createdTimestamp?.[1] ? new Date(filter.createdTimestamp[1]) : undefined,
                }}
                onSelect={(selectedDate) => {
                  onFilterChange({
                    ...filter,
                    createdTimestamp: [
                      selectedDate?.from ? selectedDate.from.getTime() : null,
                      selectedDate?.to ? selectedDate.to.getTime() : null,
                    ],
                  });
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="mb-2 flex flex-col gap-3 ">
          <Label>更新时间</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  (!filter.updatedTimestamp || filter.updatedTimestamp.length === 0) && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filter.updatedTimestamp?.[0] ? (
                  filter.updatedTimestamp?.[1] ? (
                    <>
                      {format(filter.updatedTimestamp[0], 'yyyy-MM-dd')} -{' '}
                      {format(filter.updatedTimestamp[1], 'yyyy-MM-dd')}
                    </>
                  ) : (
                    format(filter.updatedTimestamp[0], 'yyyy-MM-dd')
                  )
                ) : (
                  <span>请选择更新时间</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={filter.updatedTimestamp?.[0] ? new Date(filter.updatedTimestamp[0]) : undefined}
                selected={{
                  from: filter.updatedTimestamp?.[0] ? new Date(filter.updatedTimestamp[0]) : undefined,
                  to: filter.updatedTimestamp?.[1] ? new Date(filter.updatedTimestamp[1]) : undefined,
                }}
                onSelect={(selectedDate) => {
                  onFilterChange({
                    ...filter,
                    updatedTimestamp: [
                      selectedDate?.from ? selectedDate.from.getTime() : null,
                      selectedDate?.to ? selectedDate.to.getTime() : null,
                    ],
                  });
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
        {addToFavourite && (
          <div className="flex flex-col gap-3">
            <Label>分组名称</Label>
            <Input placeholder="请输入分组名称" value={filterName} onChange={setFilterName} />
          </div>
        )}
        <div className="flex items-center justify-between py-3">
          <Label>将筛选条件保存为分组</Label>
          <Switch checked={addToFavourite} onCheckedChange={setAddToFavourite} />
        </div>
        <div className="mt-2 flex gap-2 self-end">
          <Button
            theme="tertiary"
            className="flex-1"
            onClick={() => {
              onFilterChange({});
              setVisible(false);
            }}
          >
            重置
          </Button>
          <Button
            variant="solid"
            className="flex-1"
            onClick={() => {
              if (addToFavourite) {
                if (!filterName.trim()) {
                  toast.warning('请输入分组名称');
                  return;
                }
                toast.promise(createAssetFilterRules(filterName, filter, assetType), {
                  loading: '保存中...',
                  success: () => {
                    setVisible(false);
                    void mutate(`/api/assets/filters?type=${assetType}`);
                    return '保存成功';
                  },
                  error: '保存失败，请检查网络后重试',
                });
              } else {
                setVisible(false);
              }
            }}
          >
            保存
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
