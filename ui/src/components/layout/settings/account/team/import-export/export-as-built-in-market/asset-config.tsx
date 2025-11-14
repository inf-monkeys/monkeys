import { useState } from 'react';

import dayjs from 'dayjs';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IExportAssets } from '@/schema/workspace/export-asset';
import { getI18nContent } from '@/utils';

import { SelectedAssets } from '.';

interface IExportAssetConfigProps {
  selectedAssets: SelectedAssets;
  form: UseFormReturn<IExportAssets>;
}

export const ExportAssetConfig: React.FC<IExportAssetConfigProps> = ({ selectedAssets, form }) => {
  const { t } = useTranslation();

  const [universalVersion, setUniversalVersion] = useState<string | undefined>(undefined);

  const handleUpdateUniversalVersion = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (universalVersion) {
      selectedAssets.forEach((asset, index) => {
        form.setValue(`assets.${index}.version`, universalVersion);
      });
    }
  };

  const handleGenerateUniversalVersion = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const version = dayjs().format('YYYYMMDDHHmmss');
    setUniversalVersion(version);
  };
  return (
    <Form {...form}>
      <form>
        <div className="flex w-full justify-between gap-global">
          <Card className="flex-1 p-global">
            <ScrollArea className="h-[70vh] pr-4">
              <div className="space-y-global">
                <div className="flex items-center gap-global">
                  <h3 className="text-sm font-medium">一键填写版本号</h3>
                  <div className="flex-1">
                    <Input
                      placeholder={t(
                        'settings.account.team.import-export.export-as-built-in-market.form.version.placeholder',
                      )}
                      type="text"
                      value={universalVersion}
                      onChange={setUniversalVersion}
                    />
                  </div>
                  <Button variant="outline" onClick={handleUpdateUniversalVersion}>
                    {t('common.utils.update')}
                  </Button>
                  <Button variant="outline" onClick={handleGenerateUniversalVersion}>
                    {t('common.utils.generate')}
                  </Button>
                </div>
                {selectedAssets.map((asset, index) => (
                  <div key={asset.id} className="space-y-global-1/2">
                    <h3 className="text-sm font-medium">
                      {t('common.type.' + asset.type)} - {getI18nContent(asset.displayName)} - {asset.id}
                    </h3>
                    <div className="flex gap-global-1/2">
                      <Input
                        {...form.register(`assets.${index}.appId`)}
                        placeholder={t(
                          'settings.account.team.import-export.export-as-built-in-market.form.app-id.placeholder',
                        )}
                        value={form.watch(`assets.${index}.appId`)}
                        onChange={(value) => form.setValue(`assets.${index}.appId`, value)}
                      />
                      <Input
                        {...form.register(`assets.${index}.assetVersion`)}
                        placeholder={t(
                          'settings.account.team.import-export.export-as-built-in-market.form.asset-version.placeholder',
                        )}
                        type="number"
                        value={form.watch(`assets.${index}.assetVersion`)}
                        onChange={(value) => form.setValue(`assets.${index}.assetVersion`, Number(value))}
                      />
                      <Input
                        {...form.register(`assets.${index}.version`)}
                        placeholder={t(
                          'settings.account.team.import-export.export-as-built-in-market.form.version.placeholder',
                        )}
                        value={form.watch(`assets.${index}.version`)}
                        onChange={(value) => form.setValue(`assets.${index}.version`, value)}
                      />
                      <Input
                        {...form.register(`assets.${index}.comments`)}
                        placeholder={t(
                          'settings.account.team.import-export.export-as-built-in-market.form.comments.placeholder',
                        )}
                        value={form.watch(`assets.${index}.comments`)}
                        onChange={(value) => form.setValue(`assets.${index}.comments`, value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </form>
    </Form>
  );
};
