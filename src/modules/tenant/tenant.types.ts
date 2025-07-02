export type Output = {
  data: string;
  type: 'image' | 'text' | 'json';
  key: string;
};

export type I18nValue = {
  'zh-CN': string;
  'en-US': string;
};

export type Input = {
  data: string | number | boolean;
  displayName: string | I18nValue;
  type: 'string' | 'number' | 'boolean' | 'file';
  flag: boolean;
};

export type ExtraMetadata = object;

export type Execution = {
  workflowId: string;
  workflowInstanceId: string;
  input: Input[];
  rawInput: any;
  output: Output[];
  rawOutput: any;
  extraMetadata: ExtraMetadata | undefined;
  searchableText: string;
  createTime?: number;
};
