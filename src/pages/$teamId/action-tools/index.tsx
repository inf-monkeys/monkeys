import React from 'react';

import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { BlockCredentialItem } from '@inf-monkeys/vines';
import _ from 'lodash';

import { preloadActionTools, useUgcActionTools } from '@/apis/ugc';
import { ICredentialType } from '@/apis/ugc/credential-typings.ts';
import { ACTION_TOOLS_COLUMNS } from '@/components/layout/action-tools/consts.tsx';
import { pricingText } from '@/components/layout/action-tools/utils.tsx';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { formatTime } from '@/utils/time.ts';

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
  const navigate = useNavigate();

  return (
    <main className="size-full">
      <UgcView
        assetKey="action-tools"
        assetType="block"
        assetName="执行类工具"
        useUgcFetcher={useUgcActionTools}
        preloadUgcFetcher={preloadActionTools}
        createColumns={() => ACTION_TOOLS_COLUMNS}
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
          void navigate({
            to: `/$teamId/action-tools/${item.name}`,
          });
        }}
        subtitle={<></>}
      />
    </main>
  );
};

export const Route = createFileRoute('/$teamId/action-tools/')({
  component: ActionTools,
  beforeLoad: teamIdGuard,
});
