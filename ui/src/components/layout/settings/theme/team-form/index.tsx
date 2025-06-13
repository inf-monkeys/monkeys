import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { Switch } from "@/components/ui/switch";
import { useFormVisibilityStore } from "@/store/useFormVisibilityStore";

export const TeamForm = () => {
    const { t } = useTranslation();
    const { isFormVisible, toggleFormVisibility } = useFormVisibilityStore();

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
                checked={isFormVisible}
                onCheckedChange={toggleFormVisibility}
              />
            </div>
          </div>
        </Card>
      </CardContent>
    </Card>
  );
};
