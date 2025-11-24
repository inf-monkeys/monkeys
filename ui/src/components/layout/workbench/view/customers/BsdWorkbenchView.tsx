import React from 'react';

import { IPinPage } from '@/apis/pages/typings';
import { getI18nContent } from '@/utils';
import {
  InspirationGenerationOptions,
  InspirationGenerationPanel,
} from './scenes/InspirationGenerationPanel';

interface IBsdWorkbenchViewProps {
  page: Partial<IPinPage>;
}

type CustomOptions = {
  inspiration?: InspirationGenerationOptions;
};

const getCustomOptions = (page: Partial<IPinPage>): CustomOptions =>
  (page.customOptions as CustomOptions) ?? {};

export const BsdWorkbenchView: React.FC<IBsdWorkbenchViewProps> = ({ page }) => {
  const displayName = getI18nContent(page.displayName) ?? '波司登工作台';
  const { inspiration } = getCustomOptions(page);

  return (
    <div className="flex h-full w-full justify-center overflow-hidden bg-[#0f1729]/40 p-4 text-white lg:p-6">
      <InspirationGenerationPanel options={inspiration ?? { title: displayName }} />
    </div>
  );
};
