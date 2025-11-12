import React from 'react';

import { get, isArray } from 'lodash';

import { IVinesInputPropertyProps } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { VinesUploader } from '@/components/ui/vines-uploader';

export const FileInput: React.FC<IVinesInputPropertyProps> = ({ def, value, onChange }) => {
  const accept = get(def, 'typeOptions.accept', '');
  const multipleValues = get(def, 'typeOptions.multipleValues', isArray(value));
  const maxSize = get(def, 'typeOptions.maxSize', void 0);

  // Normalize accept list:
  // - split by comma
  // - trim whitespace
  // - remove leading dot
  // - lower-case
  // - drop empty entries
  const finalAcceptList = (typeof accept === 'string' ? accept.split(',') : [])
    .map((it: string) => it.trim().replace(/^\./, '').toLowerCase())
    .filter(Boolean);
  const finalAccept = finalAcceptList.length ? finalAcceptList : null;
  const finalMaxSize = maxSize ? maxSize / 1024 / 1024 : void 0;

  return (
    <Card>
      <CardContent className="p-2">
        <VinesUploader
          files={(multipleValues && isArray(value) ? value : value ? [value] : []) as string[]}
          accept={finalAccept}
          maxSize={finalMaxSize}
          max={multipleValues ? void 0 : 1}
          onChange={(urls) => onChange(multipleValues ? urls : urls[0])}
          basePath="user-files/workflow-input"
        />
      </CardContent>
    </Card>
  );
};
