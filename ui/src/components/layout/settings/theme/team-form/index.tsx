import { useTeams } from "@/apis/authz/team";
import { useCustomConfigs } from "@/apis/authz/team/custom-configs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export const TeamForm = () => {
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
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.theme.team-form.title')}</CardTitle>
        <CardDescription>{t('settings.theme.team-form.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Card className="border-0 shadow-none p-0">
          <div className="flex items-center justify-between pl-6">
            <div>
              <CardTitle>{t('settings.theme.team-form.form-configuration')}</CardTitle>
              <CardDescription>{t('settings.theme.team-form.displayed')}</CardDescription>
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
