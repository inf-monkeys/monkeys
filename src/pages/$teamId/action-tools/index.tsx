import React, { useState } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { BlockCredentialItem } from '@inf-monkeys/vines';
import _ from 'lodash';

import { BlockPricing } from '@/apis/tools/typings.ts';
import { preloadActionTools, useUgcActionTools } from '@/apis/ugc';
import { ICredentialType } from '@/apis/ugc/credential-typings.ts';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderDescription, RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { ImportToolModal } from '@/components/layout/workspace/tools/import-tool';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/utils/time.ts';

const pricingText = (pricing: BlockPricing) => {
  if (pricing.mode === 'free') {
    return '免费';
  } else if (pricing.mode === 'per-execute') {
    return `每次运行收费 ${pricing.unitPriceAmount / 100} 元`;
  } else if (pricing.mode === 'per-1k-token') {
    return `每 1K Token 收费 ${pricing.unitPriceAmount / 100}`;
  } else if (pricing.mode === 'per-1min') {
    return `每 1 分钟收费 ${pricing.unitPriceAmount / 100}`;
  } else if (pricing.mode === 'per-1mb-file') {
    return `每 1 MB 文件收费 ${pricing.unitPriceAmount / 100}`;
  } else {
    return '未知';
  }
};

const determinedCredentialVisible = (
  credentials?: BlockCredentialItem[],
  credentialTypesHash?: {
    [type: string]: ICredentialType;
  },
): { required: boolean; missing: boolean; credentialNames?: string[] } => {
  if (!credentials?.length) return { required: false, missing: false };
  return {
    required: true,
    missing: !credentials?.length,
    credentialNames: _.uniq(
      credentials.map(({ name }) => credentialTypesHash?.[name]?.displayName).filter((s) => s),
    ) as string[],
  };
};

export const ActionTools: React.FC = () => {
  const [importToolVisible, setImportToolVisible] = useState(false);

  return (
    <main className="size-full">
      <UgcView
        assetKey="action-tools"
        assetType="block"
        assetName="执行类工具"
        useUgcFetcher={useUgcActionTools}
        preloadUgcFetcher={preloadActionTools}
        createColumns={(columnHelper) => {
          return [
            columnHelper.accessor('icon', {
              id: 'logo',
              header: '图标',
              cell: ({ getValue }) => RenderIcon({ iconUrl: getValue() as string }),
              maxSize: 48,
            }),
            columnHelper.accessor('displayName', {
              id: 'title',
              header: '名称',
              cell: ({ getValue }) => (
                <a className="transition-colors hover:text-primary-500" target="_blank" rel="noreferrer">
                  {getValue() as string}
                </a>
              ),
            }),
            columnHelper.accessor('description', {
              id: 'description',
              header: '描述',
              cell: ({ getValue }) => RenderDescription({ description: getValue() as string }),
            }),
            columnHelper.accessor('extra.estimateTime', {
              id: 'estimateTime',
              header: '预估执行时间',
              cell: ({ getValue }) => {
                const estimateTime = getValue() as number;
                return <span>预计执行 {estimateTime ? formatTime(estimateTime) : '30 秒'}</span>;
              },
            }),
            columnHelper.accessor('pricing', {
              id: 'pricing',
              header: '费用',
              cell: ({ getValue }) => {
                const pricing = getValue() as BlockPricing | undefined;
                return <span className="text-text2">{pricing ? pricingText(pricing) : '免费'}</span>;
              },
            }),
            columnHelper.display({
              id: 'thirdPartyAccount',
              header: '外部账号',
              // cell: ({ row }) => {
              //   const { required } = determinedCredentialVisible(row.original.credentials, credentialTypesHash);
              //   return required ? (
              //     <span className="cursor-pointer text-primary" onClick={() => {}}>
              //       配置
              //     </span>
              //   ) : (
              //     <span className="text-text2">-</span>
              //   );
              // },
            }),
          ];
        }}
        renderOptions={{
          subtitle: (item) => {
            const estimateTime = item.extra?.estimateTime;
            const pricing = item.pricing;
            return (
              <span className="line-clamp-1">
                预计执行 {estimateTime ? formatTime(estimateTime) : '30 秒'}，{pricing ? pricingText(pricing) : '免费'}
              </span>
            );
          },
          cover: (item) => {
            return RenderIcon({ iconUrl: item.icon, size: 'gallery' });
          },
        }}
        onItemClick={(item) => {
          // open(`/${item.teamId}/workspace/${item.workflowId}`, '_blank');
        }}
        subtitle={
          <>
            <Button
              variant="solid"
              onClick={() => {
                setImportToolVisible(true);
              }}
            >
              导入
            </Button>
          </>
        }
      />

      <ImportToolModal visible={importToolVisible} setVisible={setImportToolVisible} />
    </main>
  );
};

export const Route = createFileRoute('/$teamId/action-tools/')({
  component: ActionTools,
  beforeLoad: teamIdGuard,
});
