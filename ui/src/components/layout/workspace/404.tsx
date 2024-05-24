import React from 'react';

import { Drill } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface IPage404Props extends React.ComponentPropsWithoutRef<'div'> {
  title?: string;
}

export const Page404: React.FC<IPage404Props> = ({ title }) => {
  const { t } = useTranslation();

  return (
    <div className="vines-center pointer-events-none size-full select-none flex-col gap-4">
      <Drill size={64} />
      <div className="flex flex-col text-center">
        {title && <h1 className="text-lg font-bold">{title}</h1>}
        <h2 className="font-bold">{t('workspace.404.description')}</h2>
      </div>
    </div>
  );
};
