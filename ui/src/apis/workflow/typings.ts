export type WorkflowListQuery = {
  /** 当前页数，从 1 开始 **/
  page?: number;
  /** 每页数目，默认为 10 **/
  limit?: number;
  /** 搜索关键词 **/
  search?: string;
  /** 排序字段 **/
  orderColumn?: string;
  /** 排序规则 **/
  orderBy?: string;
};

export const IAppCategoryNameMap = {
  all: '全部组件',
  process: '流程控制',
  image: '图像处理',
  text: '文本处理',
  file: '文件处理',
  'gen-image': '图像生成',
  'gen-text': '文本生成',
  auto: '自动化',
  db: '数据存储',
  query: '搜索增强',
  extra: '扩展能力',
  'train-model': '模型训练',
  bio: '生命科学',
  human: '用户交互',
};

export interface IVinesWorkflowRateLimiter {
  version?: number;
  enabled?: boolean;
  windowMs?: number;
  max?: number;
}
