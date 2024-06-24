import axios, { AxiosRequestConfig } from 'axios';
import { OneApiUser } from './interface';

export class OneApiBaseClient {
  baseURL: string;
  token: string;
  constructor(baseURL: string, token: string) {
    this.baseURL = baseURL;
    this.token = token;
  }

  public async request<T>(config: AxiosRequestConfig) {
    return await axios<T>({
      ...config,
      baseURL: this.baseURL,
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });
  }
}

export class OneApiSystemApiClient extends OneApiBaseClient {
  baseURL: string;
  rootToken: string;
  constructor(baseURL: string, rootToken: string) {
    super(baseURL, rootToken);
  }

  public async getUserByUsername(username: string): Promise<OneApiUser | undefined> {
    const { data } = await this.request<{
      data: OneApiUser[];
      message: string;
      success: boolean;
    }>({
      method: 'GET',
      url: `/api/user/search`,
      params: {
        keyword: username,
      },
    });

    if (!data.success) {
      throw new Error(data.message);
    }

    return data.data?.find((user) => user.username === username);
  }

  public async registerUser(username: string, password: string, displayName: string) {
    const { data } = await this.request<{ success: boolean; message: string }>({
      method: 'POST',
      url: `/api/user`,
      data: {
        display_name: displayName,
        password,
        username,
      },
    });

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

export class OneApiClient extends OneApiBaseClient {
  baseURL: string;
  userToken: string;

  constructor(baseURL: string, userToken: string) {
    super(baseURL, userToken);
  }

  public async loadModels() {
    const { data } = await this.request<{
      data: { [x: number]: string[] };
      message: string;
      success: boolean;
    }>({
      method: 'GET',
      url: '/api/models',
    });

    if (!data.success) {
      throw new Error(data.message);
    }

    return data.data;
  }

  public async createChannel(type: number, data: { [x: string]: any }) {
    const allModels = await this.loadModels();
    const channelModels = allModels[type];

    const reqData = {
      ...data,
      groups: ['default'],
      model_mapping: '',
      models: channelModels.join(','),
      type,
      other: '',
      group: 'default',
      config: '{"region":"","sk":"","ak":"","user_id":""}',
    };

    const {
      data: { success, message },
    } = await this.request<{
      success: boolean;
      message: string;
    }>({
      method: 'POST',
      url: '/api/channel',
      data: reqData,
    });

    if (!success) {
      throw new Error(message);
    }
  }
}
