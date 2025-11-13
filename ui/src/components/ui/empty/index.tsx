import { ReactElement } from 'react';

import { Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useSystemConfig } from '@/apis/common';

export interface IEmptyProps extends React.ComponentPropsWithoutRef<'div'> {
  icon?: ReactElement;
  size?: string | number;
  customIconSize?: string | number;
}

export const Empty = ({ icon, size = 24, customIconSize = size, ...props }: IEmptyProps) => {
  const { t } = useTranslation();

  const { data: oem, isLoading, error } = useSystemConfig();
  const showIcon = !isLoading && !error;
  const emptyIcon = oem?.theme?.icons?.empty?.url;

  console.log(showIcon, emptyIcon);
  return (
    <div className="flex flex-col items-center gap-2" {...props}>
      {showIcon ? (
        icon ? (
          icon
        ) : emptyIcon ? (
          <img
            src={emptyIcon}
            alt="empty"
            style={{ width: customIconSize, height: customIconSize, objectFit: 'contain' }}
          />
        ) : (
          <Inbox size={size} />
        )
      ) : null}
      <p>{t('common.load.empty')}</p>
    </div>
  );
};
