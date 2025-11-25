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

const getPageInfo = (page?: Partial<IPinPage>) => page?.workflow ?? page?.agent ?? page?.designProject ?? page?.info;

export const BsdWorkbenchView: React.FC<IBsdWorkbenchViewProps> = ({ page }) => {
  const displayName =
    getI18nContent(getPageInfo(page)?.displayName) ?? getI18nContent(page.displayName) ?? '波司登工作台';
  const { inspiration } = getCustomOptions(page);

  return (
    <div
      className="flex h-full w-full justify-center overflow-hidden p-4 text-white lg:p-6"
      style={{
        background:
          'linear-gradient(0deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), linear-gradient(157deg, rgba(23, 23, 23, 0) 65%, rgba(39, 77, 189, 0.715) 88%, #2D62FF 97%)',
        borderRadius: 20,
        border: '1px solid transparent',
        borderImage:
          'conic-gradient(from 158deg at 74% 49%, #12DCFF -5deg, #3159D1 51deg, #8099E3 159deg, #3159D1 259deg, #258AE2 295deg, #12DCFF 355deg, #3159D1 411deg) 1',
        backdropFilter: 'blur(32px)',
      }}
    >
      <InspirationGenerationPanel options={inspiration ?? { title: displayName }} />
    </div>
  );
};
