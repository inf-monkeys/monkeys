import { MonkeyWorkflow } from '@inf-monkeys/monkeys';

import { IAssetPublishPolicy } from '@/apis/typings.ts';

export interface IApplicationPublishConfig {
  policy?: IAssetPublishPolicy;
  extraAssetData?: Partial<MonkeyWorkflow>;
}
