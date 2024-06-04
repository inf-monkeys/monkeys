import React, { memo } from 'react';

import { VinesAbstractBoolean } from '@/components/layout/vines-view/execution/data-display/abstract/node/boolean.tsx';
import { VinesAbstractImage } from '@/components/layout/vines-view/execution/data-display/abstract/node/image.tsx';
import { VinesAbstractPDB } from '@/components/layout/vines-view/execution/data-display/abstract/node/pdb.tsx';
import { VinesAbstractString } from '@/components/layout/vines-view/execution/data-display/abstract/node/string.tsx';
import { VinesAbstractUrl } from '@/components/layout/vines-view/execution/data-display/abstract/node/url.tsx';
import { VinesAbstractVideo } from '@/components/layout/vines-view/execution/data-display/abstract/node/video.tsx';
import { previewDataGenerator } from '@/components/layout/vines-view/execution/data-display/abstract/utils.ts';
import { JSONValue } from '@/components/ui/code-editor';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { cn } from '@/utils';
import { stringify } from '@/utils/fast-stable-stringify.ts';

interface IVinesAbstractDataPreviewProps {
  className?: string;
  style?: React.CSSProperties;
  data: JSONValue;
}

export const VinesAbstractDataPreview = memo<IVinesAbstractDataPreviewProps>(
  ({ data, className, style }) => {
    const previewData = previewDataGenerator(data);

    const previewDataLength = previewData.length;

    return (
      <ScrollArea className={cn('[&>div>div]:h-full', className)} style={style}>
        <div className="flex h-full w-full flex-col gap-1">
          {previewData.map(({ name, type, value }, i) => {
            return (
              <div key={name} className="flex flex-col items-start justify-center">
                <h1 className="break-all font-medium">{name}</h1>
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
          {!previewDataLength && <h1 className="m-auto text-sm font-bold">该工具执行后暂无输出</h1>}
        </div>
      </ScrollArea>
    );
  },
  ({ data: prevData }, { data: nextData }) => stringify(prevData) === stringify(nextData),
);

VinesAbstractDataPreview.displayName = 'VinesAbstractDataPreview';
