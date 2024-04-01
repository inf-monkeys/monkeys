import React, { useEffect, useMemo } from 'react';

import _ from 'lodash';
import { ArrowDownNarrowWide, ArrowDownWideNarrow } from 'lucide-react';

import {
  ISortCondition,
  ISortConditionOrderBy,
  ISortConditionOrderColumn,
  ISortConditionStorage,
  IUgcCustomProps,
} from '@/components/layout/ugc/typings.ts';
import { DEFAULT_SORT_CONDITION } from '@/components/layout/ugc/view/header/consts.ts';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocalStorage } from '@/utils';

interface IUgcHeaderSortButtonProps extends IUgcCustomProps {}

export const UgcHeaderSortButton: React.FC<IUgcHeaderSortButtonProps> = ({ assetKey }) => {
  const team = useVinesTeam();
  const teamId = team.teamId;

  const [sortConditionStorage, setSortConditionStorage] = useLocalStorage<ISortConditionStorage>(
    'vines-ui-asset-sort-condition',
    {},
  );

  const sortCondition: ISortCondition = _.get(sortConditionStorage, [teamId, assetKey], DEFAULT_SORT_CONDITION);

  useEffect(() => {
    if (!_.has(sortConditionStorage, [teamId, assetKey])) {
      setTimeout(() => {
        setSortConditionStorage({
          ...sortConditionStorage,
          [teamId]: {
            ...sortConditionStorage[teamId],
            [assetKey]: DEFAULT_SORT_CONDITION,
          },
        });
      });
    }
  }, [sortConditionStorage, teamId]);

  const sortConditionIcon = useMemo(
    () => (sortCondition.orderBy === 'ASC' ? <ArrowDownNarrowWide /> : <ArrowDownWideNarrow />),
    [sortCondition.orderBy],
  );

  return (
    <DropdownMenu>
      <Tooltip content="排序">
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button icon={sortConditionIcon} />
          </DropdownMenuTrigger>
        </TooltipTrigger>
      </Tooltip>
      <DropdownMenuContent>
        <DropdownMenuLabel>排序设置</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={sortCondition.orderBy}
          onValueChange={(v) => {
            setSortConditionStorage((prev) => {
              return {
                ...prev,
                [teamId]: {
                  ...prev[teamId],
                  [assetKey]: {
                    ...prev[teamId][assetKey],
                    orderBy: v as ISortConditionOrderBy,
                  },
                },
              };
            });
          }}
        >
          <DropdownMenuRadioItem value="ASC">升序</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="DESC">降序</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={sortCondition.orderColumn}
          onValueChange={(v) => {
            setSortConditionStorage((prev) => {
              return {
                ...prev,
                [teamId]: {
                  ...prev[teamId],
                  [assetKey]: {
                    ...prev[teamId][assetKey],
                    orderColumn: v as ISortConditionOrderColumn,
                  },
                },
              };
            });
          }}
        >
          <DropdownMenuRadioItem value="createdTimestamp">创建时间</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="updatedTimestamp">更新时间</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
