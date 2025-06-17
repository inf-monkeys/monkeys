import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useTeams } from '@/apis/authz/team';
import { useCustomConfigs } from '@/apis/authz/team/custom-configs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

export const TeamCustomConfig = () => {
  const { t } = useTranslation();

  const { mutate } = useTeams();

  const { showFormInImageDetail, update } = useCustomConfigs();

  const onFormVisibilityChange = async (checked: boolean) => {
    toast.promise(
      update('showFormInImageDetail', checked)
        .then((team) => {
          void mutate();
          return team;
        })
        .catch((error) => {
          console.log('error', error);
          throw error;
        }),
      {
        loading: t('common.update.loading'),
        success: t('common.update.success'),
        error: t('common.update.error'),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.theme.team-custom-config.title')}</CardTitle>
        <CardDescription>{t('settings.theme.team-custom-config.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Card className="border-0 p-0 shadow-none">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex flex-col">
                <h3 className="line-clamp-1 font-semibold leading-tight">
                  {t('settings.theme.team-custom-config.configs.show-form-in-image-detail.title')}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t('settings.theme.team-custom-config.configs.show-form-in-image-detail.description')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="form-visibility"
                checked={showFormInImageDetail}
                onCheckedChange={(checked) => onFormVisibilityChange(checked)}
              />
            </div>
          </div>
        </Card>
      </CardContent>
    </Card>
  );
};
