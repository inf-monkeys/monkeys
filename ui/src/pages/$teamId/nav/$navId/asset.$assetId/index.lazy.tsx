import React from 'react';

import { createLazyFileRoute, useNavigate, useParams } from '@tanstack/react-router';

import { useTranslation } from 'react-i18next';

import { useUgcMediaData } from '@/apis/ugc';
import { AssetDetailPage } from '@/components/layout/ugc/detail/asset-detail-page';
import { Button } from '@/components/ui/button';

export const AssetDetail: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { navId, assetId } = useParams({ from: '/$teamId/nav/$navId/asset/$assetId/' });

  // 获取资产数据
  const { data: assetsData, mutate } = useUgcMediaData({
    page: 1,
    limit: 10000,
    filter: {},
  });

  // 查找当前资产
  const currentAsset = assetsData?.data?.find((asset) => asset.id === assetId);

  const handleBack = () => {
    navigate({ to: `/$teamId/nav/${navId}` as any });
  };

  if (!currentAsset) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">资产未找到</h2>
          <p className="mt-2 text-gray-600">请检查资产ID是否正确</p>
          <Button onClick={handleBack} className="mt-4">
            返回列表
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AssetDetailPage
      asset={currentAsset}
      assetType="media-file"
      onBack={handleBack}
      mutate={mutate}
    />
  );
};

export const Route = createLazyFileRoute('/$teamId/nav/$navId/asset/$assetId/')({
  component: AssetDetail,
});