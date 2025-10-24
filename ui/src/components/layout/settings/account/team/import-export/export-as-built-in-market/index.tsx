import React, { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { AssetType, I18nValue } from '@inf-monkeys/monkeys';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { IVinesTeam } from '@/apis/authz/team/typings.ts';
import { exportAssetsByAssetList } from '@/apis/marketplace';
import { useWorkspacePages } from '@/apis/pages';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { exportAssetsSchema, IExportAssets } from '@/schema/workspace/export-asset';
import { downloadFile } from '@/utils/file';

import { ExportAssetConfig } from './asset-config';
import { ExportAssetSelect } from './asset-select';

interface IExportTeamAsBuiltInMarketProps extends React.ComponentPropsWithoutRef<'div'> {
  team?: IVinesTeam;
}

export type SelectedAsset = {
  id: string;
  displayName?: string | I18nValue | null;
  type: AssetType;
  preferAppId?: string;
};

export type SelectedAssets = SelectedAsset[];

export type StagedAssets = {
  id: string;
  type: AssetType;
  assetVersion: number;
  appId: string;
  version: string;
  comments?: string;
}[];

export const ExportTeamAsBuiltInMarket: React.FC<IExportTeamAsBuiltInMarketProps> = ({ children }) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedAssets, setSelectedAssets] = useState<SelectedAssets>([]);
  const [step, setStep] = useState(1);

  const { data: pageWithGroups } = useWorkspacePages();
  console.log(pageWithGroups);

  const form = useForm<IExportAssets>({
    resolver: zodResolver(exportAssetsSchema),
    defaultValues: {
      assets: [],
    },
  });

  const handleNext = async () => {
    if (step === 1) {
      if (selectedAssets.length === 0) {
        toast.error(t('settings.account.team.import-export.no-assets-selected'));
        return;
      }
      setStep(2);
    } else {
      form.getValues().assets.forEach((asset, index) => {
        form.setValue(`assets.${index}.assetVersion`, Number(asset.assetVersion));
      });
      const result = await form.trigger();
      if (result) {
        const data = form.getValues();
        console.log(data);
        setIsLoading(true);
        toast.promise(exportAssetsByAssetList(data), {
          loading: t('common.operate.loading'),
          success: (data) => {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            downloadFile(blob, `presetApp.${new Date().getTime()}.json`);

            return t('common.operate.success');
          },
          error: (error) => {
            console.error(error);
            return error.message;
          },
          finally: () => {
            setIsLoading(false);
          },
        });
      } else {
        console.log(form.getValues());
        toast.error('Please check form like appId version');
      }
    }
  };

  useEffect(() => {
    if (!visible) {
      setStep(1);
      setSelectedAssets([]);
      form.reset();
    }
  }, [visible]);

  useEffect(() => {
    if (step === 2) {
      selectedAssets.forEach((asset, index) => {
        form.setValue(`assets.${index}.id`, asset.id);
        form.setValue(`assets.${index}.type`, asset.type);
        form.setValue(`assets.${index}.appId`, asset.preferAppId || '');
        form.setValue(`assets.${index}.assetVersion`, 1);
        form.setValue(`assets.${index}.version`, '');
        form.setValue(`assets.${index}.comments`, '');
      });
    }
  }, [step, selectedAssets, form]);

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[1200px]">
        <DialogHeader>
          <DialogTitle>
            {t('settings.account.team.import-export.export-as-built-in-market.title')} - Step {step}
          </DialogTitle>
        </DialogHeader>
        {step === 1 && <ExportAssetSelect onSelect={setSelectedAssets} />}
        {step === 2 && <ExportAssetConfig selectedAssets={selectedAssets} form={form} />}
        <DialogFooter>
          <Button loading={isLoading} variant="solid" onClick={handleNext}>
            {step === 1 ? t('common.utils.next') : t('common.utils.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
