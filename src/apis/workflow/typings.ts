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
