import React, { memo } from 'react';

import { isEmpty } from 'lodash';
import { useTranslation } from 'react-i18next';

import { VinesAbstractBoolean } from '@/components/layout/workspace/vines-view/_common/data-display/abstract/node/boolean.tsx';
import { VinesAbstractImage } from '@/components/layout/workspace/vines-view/_common/data-display/abstract/node/image.tsx';
import { VinesAbstractPDB } from '@/components/layout/workspace/vines-view/_common/data-display/abstract/node/pdb.tsx';
import { VinesAbstractString } from '@/components/layout/workspace/vines-view/_common/data-display/abstract/node/string.tsx';
import { VinesAbstractUrl } from '@/components/layout/workspace/vines-view/_common/data-display/abstract/node/url.tsx';
import { VinesAbstractVideo } from '@/components/layout/workspace/vines-view/_common/data-display/abstract/node/video.tsx';
import { previewDataGenerator } from '@/components/layout/workspace/vines-view/_common/data-display/abstract/utils.ts';
import { JSONValue } from '@/components/ui/code-editor';
import { VinesImageGroup } from '@/components/ui/image';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { cn } from '@/utils';
import { stringify } from '@/utils/fast-stable-stringify.ts';

interface IVinesAbstractDataPreviewProps {
  className?: string;
  style?: React.CSSProperties;
  data: JSONValue;
  disabledOverflowMask?: boolean;
}

export const VinesAbstractDataPreview = memo<IVinesAbstractDataPreviewProps>(
  ({ data, className, style, disabledOverflowMask }) => {
    const { t } = useTranslation();

    const previewData = previewDataGenerator(data);

    const previewDataLength = previewData.length;
    const visibleKey = previewDataLength > 1;

    const isValueEmpty = previewDataLength === 1 && isEmpty(previewData?.[0]?.value?.toString());

    return (
      <ScrollArea
        className={cn('[&>div>div]:h-full', className)}
        style={style}
        disabledOverflowMask={disabledOverflowMask}
      >
        <div className="flex h-full w-full flex-col gap-1">
          <VinesImageGroup>
            {previewData.map(({ name, type, value }, i) => {
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
            {(!previewDataLength || isValueEmpty) && (
              <h1 className="m-auto text-sm font-bold">
                {t('workspace.pre-view.actuator.detail.abstract-data-preview.empty')}
              </h1>
            )}
          </VinesImageGroup>
        </div>
      </ScrollArea>
    );
  },
  ({ data: prevData }, { data: nextData }) => stringify(prevData) === stringify(nextData),
);

VinesAbstractDataPreview.displayName = 'VinesAbstractDataPreview';
