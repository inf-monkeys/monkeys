import axios from 'axios';

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

export class OneApiSystemApiClient {
  baseURL: string;
  rootToken: string;
  constructor(baseURL: string, rootToken: string) {
    this.baseURL = baseURL;
    this.rootToken = rootToken;
  }

  public async getUserByUsername(username: string): Promise<OneApiUser | undefined> {
    const { data } = await axios.get<{
      data: OneApiUser[];
      message: string;
      success: boolean;
    }>(`/api/user/search`, {
      params: {
        keyword: username,
      },
      baseURL: this.baseURL,
      headers: {
        Authorization: `Bearer ${this.rootToken}`,
      },
    });

    if (!data.success) {
      throw new Error(data.message);
    }

    return data.data?.find((user) => user.username === username);
  }

  public async registerUser(username: string, password: string, displayName: string) {
    const { data } = await axios.post<{ success: boolean; message: string }>(
      `/api/user`,
      {
        display_name: displayName,
        password,
        username,
      },
      {
        headers: {
          Authorization: `Bearer ${this.rootToken}`,
        },
      },
    );
    const { success, message } = data;
    if (!success) {
      throw new Error(message);
    }
    const user = await this.getUserByUsername(username);
    if (!user) {
      throw new Error('Failed to create user');
    }
    return user;
  }

  public async addUserIfNotExists(username: string, password: string, displayName: string) {
    const existUser = await this.getUserByUsername(username);
    if (existUser) {
      return existUser;
    }
    return await this.registerUser(username, password, displayName);
  }
}
