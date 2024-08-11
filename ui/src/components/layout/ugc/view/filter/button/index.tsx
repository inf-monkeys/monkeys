import React, { useState } from 'react';

import { mutate } from 'swr';

import { format } from 'date-fns';
import { CalendarIcon, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
import { MultiSelect } from '@/components/ui/multi-select';
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
  const { t, i18n } = useTranslation();

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

  const timeFormat = i18n.language === 'zh' ? 'yyyy-MM-dd' : 'MM-dd-yyyy';

  return (
    <Popover open={visible} onOpenChange={setVisible}>
      <Tooltip content={t('common.utils.filter')}>
        <PopoverTrigger asChild>
          <TooltipTrigger asChild>
            <Button icon={<Filter />} variant="outline" size="small" />
          </TooltipTrigger>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent className="flex w-72 flex-col gap-2">
        <div className="flex flex-col gap-3">
          <Label>{t('components.layout.ugc.view.filter.button.creator.label')}</Label>
          <MultiSelect
            options={defaultUsersOptions}
            value={filter?.userIds ?? []}
            onValueChange={(userIds) =>
              onFilterChange({
                ...filter,
                userIds,
              })
            }
            placeholder={t('components.layout.ugc.view.filter.button.creator.placeholder')}
          />
        </div>
        <div className="flex flex-col gap-3">
          <Label>{t('components.layout.ugc.view.filter.button.tag.label')}</Label>
          <MultiSelect
            options={defaultTagsOptions}
            value={filter?.tagIds ?? []}
            onValueChange={(tagIds) =>
              onFilterChange({
                ...filter,
                tagIds,
              })
            }
            placeholder={t('components.layout.ugc.view.filter.button.tag.placeholder')}
          />
        </div>
        <div className="mb-2 flex flex-col gap-3">
          <Label>{t('components.layout.ugc.view.filter.button.created-time.label')}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  (!filter?.createdTimestamp || filter?.createdTimestamp.length === 0) && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filter?.createdTimestamp?.[0] ? (
                  filter?.createdTimestamp?.[1] ? (
                    <>
                      {format(filter?.createdTimestamp[0], timeFormat)} -{' '}
                      {format(filter?.createdTimestamp[1], timeFormat)}
                    </>
                  ) : (
                    format(filter?.createdTimestamp[0], timeFormat)
                  )
                ) : (
                  <span>{t('components.layout.ugc.view.filter.button.created-time.placeholder')}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={filter?.createdTimestamp?.[0] ? new Date(filter?.createdTimestamp[0]) : undefined}
                selected={{
                  from: filter?.createdTimestamp?.[0] ? new Date(filter?.createdTimestamp[0]) : undefined,
                  to: filter?.createdTimestamp?.[1] ? new Date(filter?.createdTimestamp[1]) : undefined,
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
          <Label>{t('components.layout.ugc.view.filter.button.updated-time.label')}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  (!filter?.updatedTimestamp || filter?.updatedTimestamp.length === 0) && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filter?.updatedTimestamp?.[0] ? (
                  filter?.updatedTimestamp?.[1] ? (
                    <>
                      {format(filter?.updatedTimestamp[0], timeFormat)} -{' '}
                      {format(filter?.updatedTimestamp[1], timeFormat)}
                    </>
                  ) : (
                    format(filter?.updatedTimestamp[0], timeFormat)
                  )
                ) : (
                  <span>{t('components.layout.ugc.view.filter.button.updated-time.placeholder')}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={filter?.updatedTimestamp?.[0] ? new Date(filter?.updatedTimestamp[0]) : undefined}
                selected={{
                  from: filter?.updatedTimestamp?.[0] ? new Date(filter?.updatedTimestamp[0]) : undefined,
                  to: filter?.updatedTimestamp?.[1] ? new Date(filter?.updatedTimestamp[1]) : undefined,
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
            <Label>{t('components.layout.ugc.view.filter.button.filter-group-name.label')}</Label>
            <Input
              placeholder={t('components.layout.ugc.view.filter.button.filter-group-name.placeholder')}
              value={filterName}
              onChange={setFilterName}
            />
          </div>
        )}
        <div className="flex items-center justify-between py-3">
          <Label>{t('components.layout.ugc.view.filter.button.save-filter-group.label')}</Label>
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
            {t('common.utils.reset')}
          </Button>
          <Button
            variant="solid"
            className="flex-1"
            onClick={() => {
              if (addToFavourite) {
                if (!filterName.trim()) {
                  toast.warning(t('components.layout.ugc.view.filter.button.toast.no-filter-group-name'));
                  return;
                }
                toast.promise(createAssetFilterRules(filterName, filter, assetType), {
                  loading: t('common.save.loading'),
                  success: () => {
                    setVisible(false);
                    void mutate(`/api/assets/filters?type=${assetType}`);
                    return t('common.save.success');
                  },
                  error: t('common.save.error'),
                });
              } else {
                setVisible(false);
              }
            }}
          >
            {t('common.utils.save')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
