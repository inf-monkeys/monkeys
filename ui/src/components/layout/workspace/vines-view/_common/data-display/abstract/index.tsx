import React, { memo } from 'react';

import { isEmpty } from 'lodash';
import { CircleSlash, CircleX } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useSystemConfig } from '@/apis/common';
import { VinesAbstractBoolean } from '@/components/layout/workspace/vines-view/_common/data-display/abstract/node/boolean.tsx';
import { VinesAbstractImage } from '@/components/layout/workspace/vines-view/_common/data-display/abstract/node/image.tsx';
import { VinesAbstractPDB } from '@/components/layout/workspace/vines-view/_common/data-display/abstract/node/pdb.tsx';
import { VinesAbstractString } from '@/components/layout/workspace/vines-view/_common/data-display/abstract/node/string.tsx';
import { VinesAbstractUrl } from '@/components/layout/workspace/vines-view/_common/data-display/abstract/node/url.tsx';
import { VinesAbstractVideo } from '@/components/layout/workspace/vines-view/_common/data-display/abstract/node/video.tsx';
import { previewDataGenerator } from '@/components/layout/workspace/vines-view/_common/data-display/abstract/utils.ts';
import { VinesImageGroup } from '@/components/ui/image';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { cn } from '@/utils';
import { stringify } from '@/utils/fast-stable-stringify.ts';

interface IVinesAbstractDataPreviewProps {
  className?: string;
  style?: React.CSSProperties;
  data: any;
  overflowMask?: boolean;
}

export const VinesAbstractDataPreview = memo<IVinesAbstractDataPreviewProps>(
  ({ data, className, style, overflowMask = false }) => {
    const { t } = useTranslation();

    const { data: oem } = useSystemConfig();

    const previewData = previewDataGenerator(data);

    const previewDataLength = previewData.length;
    const visibleKey = previewDataLength > 1;

    const isValueEmpty = previewDataLength === 1 && isEmpty(previewData?.[0]?.value?.toString());

    const isResultFailed = data && data.success === false;

    return (
      <ScrollArea className={cn('[&>div>div]:h-full', className)} style={style} disabledOverflowMask={!overflowMask}>
        <div className="flex h-full w-full flex-col gap-1">
          <VinesImageGroup>
            {!isResultFailed &&
              previewData.map(({ name, type, value }, i) => {
                return (
                  <div key={name} className="flex flex-col items-start justify-center">
                    {visibleKey && <h1 className="break-all text-sm font-medium">{name}</h1>}
                    {type === 'string' && <VinesAbstractString>{value}</VinesAbstractString>}
                    {type === 'boolean' && <VinesAbstractBoolean>{value}</VinesAbstractBoolean>}
                    {type === 'url' && <VinesAbstractUrl>{value}</VinesAbstractUrl>}
                    {type === 'image' && <VinesAbstractImage>{value}</VinesAbstractImage>}
                    {type === 'pdb' && (
                      <VinesAbstractPDB height={(style?.height as number) ?? void 0}>{value}</VinesAbstractPDB>
                    )}
                    {type === 'video' && <VinesAbstractVideo>{value?.toString() ?? ''}</VinesAbstractVideo>}
                    {i !== previewDataLength - 1 && <Separator className="mt-3" />}
                  </div>
                );
              })}
            {!isResultFailed && (!previewDataLength || isValueEmpty) && (
              <div className="flex h-40 w-full flex-col items-center justify-center gap-2">
                <CircleSlash className="stroke-gray-10" size={36} />
                <h1 className="text-sm font-bold">
                  {t('workspace.pre-view.actuator.detail.abstract-data-preview.empty')}
                </h1>
              </div>
            )}
            {isResultFailed && (
              <div className="flex h-40 w-full flex-col items-center justify-center gap-2">
                <CircleX
                  className={cn(!oem?.theme?.icons?.error && 'stroke-red-10')}
                  style={oem?.theme?.icons?.error ? { stroke: oem.theme.icons.error } : {}}
                  size={36}
                />
                <h1 className="text-sm font-bold">{t('common.workflow.status.FAILED')}</h1>
              </div>
            )}
          </VinesImageGroup>
        </div>
      </ScrollArea>
    );
  },
  ({ data: prevData }, { data: nextData }) => stringify(prevData) === stringify(nextData),
);

VinesAbstractDataPreview.displayName = 'VinesAbstractDataPreview';
