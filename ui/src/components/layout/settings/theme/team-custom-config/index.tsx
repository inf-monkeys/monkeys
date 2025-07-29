import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useTeams } from '@/apis/authz/team';
import { useCustomConfigs } from '@/apis/authz/team/custom-configs';
import { IImagePreviewOperationBarStyle } from '@/apis/authz/team/typings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { TeamCustomConfigItem } from './item';

export const TeamCustomConfig = () => {
  const { t } = useTranslation();

  const { mutate } = useTeams();

  const { showFormInImageDetail, imagePreviewOperationBarStyle, update } = useCustomConfigs();

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

  const onImagePreviewOperationBarStyleChange = async (value: IImagePreviewOperationBarStyle) => {
    toast.promise(
      update('imagePreviewOperationBarStyle', value)
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
        <Card className="flex flex-col gap-global-1/2 border-0 p-0 shadow-none">
          <TeamCustomConfigItem label="show-form-in-image-detail">
            <Switch
              id="form-visibility"
              checked={showFormInImageDetail}
              onCheckedChange={(checked) => onFormVisibilityChange(checked)}
            />
          </TeamCustomConfigItem>
          <TeamCustomConfigItem label="image-preview-operation-bar-style">
            <Tabs
              value={imagePreviewOperationBarStyle ?? 'normal'}
              onValueChange={(value) => onImagePreviewOperationBarStyleChange(value as IImagePreviewOperationBarStyle)}
            >
              <TabsList>
                <TabsTrigger value="simple">
                  {t('settings.theme.team-custom-config.configs.image-preview-operation-bar-style.options.simple')}
                </TabsTrigger>
                <TabsTrigger value="normal">
                  {t('settings.theme.team-custom-config.configs.image-preview-operation-bar-style.options.normal')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </TeamCustomConfigItem>
        </Card>
      </CardContent>
    </Card>
  );
};
