import React from 'react';

import { createLazyFileRoute, useNavigate, useParams } from '@tanstack/react-router';

import { useTranslation } from 'react-i18next';

import { useUgcMediaDataById } from '@/apis/ugc';
import { AssetDetailPage } from '@/components/layout/ugc/detail/asset-detail-page';
import { Button } from '@/components/ui/button';

// 隐藏转换功能的 assetType 白名单
const HIDE_CONVERSION_WHITELIST = ['design-models', 'neural-models'];

export const AssetDetail: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { navId, assetId } = useParams({ from: '/$teamId/nav/$navId/asset/$assetId/' });

  const assetType = navId.includes(':') ? navId.split(':')[1] : navId;

  // 直接通过 ID 获取单个资产数据（优化：从加载10000条记录改为加载1条）
  const { data: currentAsset, mutate, isLoading } = useUgcMediaDataById(assetId);

  const handleBack = () => {
    if (navId === 'concept-design:design-models') {
      navigate({ to: `/$teamId/nav/concept-design:design-models/neural-models` as any });
      return;
    }
    navigate({ to: `/$teamId/nav/${navId}` as any });
  };

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <h2 className="text-lg font-semibold text-gray-900">{t('asset.detail.loading')}</h2>
          <p className="mt-2 text-gray-600">{t('asset.detail.loadingAssetInfo')}</p>
        </div>
      </div>
    );
  }

  // 如果数据已加载但找不到资产，显示不存在
  if (!currentAsset) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">{t('asset.detail.notFound')}</h2>
          <p className="mt-2 text-gray-600">{t('asset.detail.checkId')}</p>
          <Button onClick={handleBack} className="mt-4">
            {t('asset.detail.backToList')}
          </Button>
        </div>
      </div>
    );
  }

  const hideConversion = HIDE_CONVERSION_WHITELIST.includes(assetType);

  return (
    <AssetDetailPage
      asset={currentAsset}
      assetType="media-file"
      onBack={handleBack}
      mutate={mutate}
      hideConversion={hideConversion}
    />
  );
};

export const Route = createLazyFileRoute('/$teamId/nav/$navId/asset/$assetId/')({
  component: AssetDetail,
});
