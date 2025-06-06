import React from 'react';

import { I18nValue } from '@inf-monkeys/monkeys';
import dayjs from 'dayjs';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';

import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { IUgcTagSelectorProps, UgcTagSelector } from '@/components/layout/ugc/view/tag-selector';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { IVinesIconSize, VinesIcon } from '@/components/ui/vines-icon';
import { DEFAULT_WORKFLOW_ICON_URL } from '@/consts/icons.ts';
import { getI18nContent } from '@/utils';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const RenderTime: React.FC<{ time: number | string }> = ({ time: rawTime }) => {
  const { i18n } = useTranslation();
  rawTime = _.isNumber(rawTime) ? rawTime : _.toNumber(rawTime);
  const time = rawTime >= 1000000000000 ? rawTime : rawTime * 1000;
  return (
    <Tooltip
      content={dayjs(time).format(i18n.language.startsWith('zh') ? 'YYYY-MM-DD HH:mm:ss' : 'MM-DD-YYYY HH:mm:ss')}
    >
      <TooltipTrigger asChild>
        <span className="cursor-default">{formatTimeDiffPrevious(time)}</span>
      </TooltipTrigger>
    </Tooltip>
  );
};

export const RenderUser: React.FC<{
  user: Partial<IVinesUser>;
  fallbackName?: string;
}> = ({ user, fallbackName }) => {
  const { t } = useTranslation();
  fallbackName = fallbackName ?? t('common.utils.unknown-user');
  return (
    <div className="flex items-center gap-1">
      <Avatar className="size-5">
        <AvatarImage className="aspect-auto" src={user?.photo} alt={user?.name ?? fallbackName} />
        <AvatarFallback className="rounded-none p-2 text-xs">
          {(user?.name ?? fallbackName).substring(0, 2)}
        </AvatarFallback>
      </Avatar>
      <span>{user?.name ?? fallbackName}</span>
    </div>
  );
};
export const RenderDescription: React.FC<{
  description?: string | I18nValue;
}> = ({ description }) => {
  const { t } = useTranslation();
  if (typeof description != 'string') description = getI18nContent(description);
  return !description || description === '' ? (
    <span className="line-clamp-3 text-opacity-70">{t('components.layout.ugc.utils.no-description')}</span>
  ) : (
    <Tooltip content={<span className="flex max-w-64 flex-wrap">{description}</span>} contentProps={{ side: 'bottom' }}>
      <TooltipTrigger asChild>
        <span className="line-clamp-3 text-opacity-70">{description}</span>
      </TooltipTrigger>
    </Tooltip>
  );
};

export const RenderIcon: React.FC<{
  iconUrl?: string;
  size?: IVinesIconSize;
}> = ({ iconUrl, size = 'md' }) => (
  <VinesIcon size={size}>{iconUrl && iconUrl.trim() != '' ? iconUrl : DEFAULT_WORKFLOW_ICON_URL}</VinesIcon>
);

export const RenderTags = (props: IUgcTagSelectorProps) => <UgcTagSelector {...props} />;
