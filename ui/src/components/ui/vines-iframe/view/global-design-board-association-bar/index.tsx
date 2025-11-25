import React, { useMemo } from 'react';

import { get } from 'lodash';

import { useSystemConfig } from '@/apis/common';
import { ISystemConfig } from '@/apis/common/typings';
import { useGetDesignAssociationList } from '@/apis/designs/index.ts';
import useUrlState from '@/hooks/use-url-state';

import { CommonOperationBar } from '../common-operation-bar';
import { GlobalDesignBoardAssociationBarItem } from './item';

interface IGlobalDesignBoardAssociationBarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const GlobalDesignBoardAssociationBar: React.FC<IGlobalDesignBoardAssociationBarProps> = () => {
  const [{ mode }] = useUrlState<{
    mode: 'normal' | 'fast' | 'mini';
  }>({ mode: 'normal' });

  const { data: oem } = useSystemConfig();

  const density = oem?.theme.density ?? 'default';

  const themeMode = get(oem, 'theme.themeMode', 'border') as ISystemConfig['theme']['themeMode'];

  const { data: initialData } = useGetDesignAssociationList();

  const enabledData = useMemo(() => initialData?.filter((it) => it.enabled) ?? [], [initialData]);

  return (
    <CommonOperationBar
      data={enabledData}
      mode={mode}
      density={density}
      themeMode={themeMode}
      tipButtonProps={{ mode, density, type: 'global-design-board' }}
      renderItem={(item, { expanded }) => <GlobalDesignBoardAssociationBarItem data={item} expanded={expanded} />}
    />
  );
};
