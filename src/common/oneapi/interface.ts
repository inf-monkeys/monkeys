export interface OneApiUser {
  access_token: string;
  aff_code: string;
  display_name: string;
  email: string;
  github_id: string;
  id: number;
  group: string;
  inviter_id: number;
  lark_id: string;
  password: string;
  quota: number;
  request_count: number;
  role: number;
  status: number;
  used_quota: number;
  username: string;
  verification_code: string;
  wechat_id: string;
}

export interface OneAPIModel {
  created: number;
  id: string;
  object: string;
  owned_by: string;
  parent: string;
  permission: Array<{
    allow_create_engine: boolean;
    allow_fine_tuning: boolean;
    allow_logprobs: boolean;
    allow_sampling: boolean;
    allow_search_indices: boolean;
    allow_view: boolean;
    created: number;
    group: string;
    id: string;
    is_blocking: boolean;
    object: string;
    organization: string;
  }>;
  root: string;
}

export interface OneAPIToken {
  accessed_time: number;
  created_time: number;
  expired_time: number;
  id: number;
  key: string;
  models: string;
  name: string;
  remain_quota: string;
  status: string;
  subnet: string;
  unlimited_quota: boolean;
  used_quota: number;
  user_id: number;
}
