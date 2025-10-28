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
  maxLength?: number;
}> = ({ description, maxLength = 250 }) => {
  const { t, i18n } = useTranslation();

  // 直接在组件内处理多语言，类似 detail-page 的做法
  // 当语言切换时，useTranslation 会触发组件重新渲染
  let descriptionText = '';
  if (!description) {
    descriptionText = '';
  } else if (typeof description === 'string') {
    descriptionText = description;
  } else if (typeof description === 'object' && description !== null) {
    // 根据当前语言获取对应的描述（与 detail-page 完全一致）
    if (i18n.language === 'zh') {
      descriptionText = description['zh-CN'] || description['en-US'] || '';
    } else if (i18n.language === 'en') {
      descriptionText = description['en-US'] || description['zh-CN'] || '';
    }
  }

  if (!descriptionText || descriptionText === '') {
    return <span className="line-clamp-2 text-opacity-70">{t('components.layout.ugc.utils.no-description')}</span>;
  }

  const truncatedDescription =
    descriptionText.length > maxLength ? descriptionText.slice(0, maxLength) + '...' : descriptionText;

  const needsTooltip = descriptionText.length > maxLength;

  return needsTooltip ? (
    <Tooltip
      content={<span className="flex max-w-md flex-wrap whitespace-pre-wrap break-words">{descriptionText}</span>}
      contentProps={{ side: 'bottom' }}
    >
      <TooltipTrigger asChild>
        <span className="line-clamp-2 cursor-default text-opacity-70">{truncatedDescription}</span>
      </TooltipTrigger>
    </Tooltip>
  ) : (
    <span className="line-clamp-2 text-opacity-70">{truncatedDescription}</span>
  );
};

export const RenderIcon: React.FC<{
  iconUrl?: string;
  size?: IVinesIconSize;
}> = ({ iconUrl, size = 'md' }) => (
  <VinesIcon size={size} fallbackColor="#eeeef1">
    {iconUrl && iconUrl.trim() != '' ? iconUrl : DEFAULT_WORKFLOW_ICON_URL}
  </VinesIcon>
);

export const RenderTags = (props: IUgcTagSelectorProps) => <UgcTagSelector {...props} />;
