import { useTranslation } from 'react-i18next';

export interface ITeamCustomConfigItemProps {
  children: React.ReactNode;
  label: string;
}

export const TeamCustomConfigItem: React.FC<ITeamCustomConfigItemProps> = ({ children, label }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col">
        <div className="flex flex-col">
          <h3 className="line-clamp-1 font-semibold leading-tight">
            {t(`settings.theme.team-custom-config.configs.${label}.title`)}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t(`settings.theme.team-custom-config.configs.${label}.description`)}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">{children}</div>
    </div>
  );
};
