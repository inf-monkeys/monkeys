import axios, { AxiosRequestConfig } from 'axios';
import { OneAPIToken, OneApiUser, OneapiChannel } from './interface';

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

  private async updateUserQuota(userId: number, quota: number) {
    const { data } = await this.request<{ success: boolean; message: string }>({
      method: 'PUT',
      url: `/api/user/`,
      data: {
        id: userId,
        quota,
      },
    });

    if (!data.success) {
      throw new Error(data.message);
    }
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
    await this.updateUserQuota(user.id, 100000000000);
    return user;
  }

  public async addUserIfNotExists(username: string, password: string, displayName: string) {
    const existUser = await this.getUserByUsername(username);
    if (existUser) {
      return existUser;
    }
    return await this.registerUser(username, password, displayName);
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

  private async listChannels() {
    const { data } = await this.request<{
      data: OneapiChannel[];
      message: string;
      success: boolean;
    }>({
      method: 'GET',
      url: '/api/channel',
      params: {
        p: 0,
      },
    });

    if (!data.success) {
      throw new Error(data.message);
    }

    return data.data;
  }

  public async searchChannelByKeyword(keyword: string) {
    const { data } = await this.request<{
      success: boolean;
      message: string;
      data: OneapiChannel[];
    }>({
      method: 'GET',
      url: '/api/channel/search',
      params: {
        keyword,
      },
    });

    if (!data.success) {
      throw new Error(data.message);
    }

    return data.data;
  }

  public async getChannel(channelId: number) {
    const { data } = await this.request<{
      success: boolean;
      message: string;
      data: OneapiChannel;
    }>({
      method: 'GET',
      url: `/api/channel/${channelId}`,
    });

    if (!data.success) {
      throw new Error(data.message);
    }

    return data.data;
  }

  private data2channel(channelType: number, modelPrefix: string, data: { [x: string]: any }) {
    const models = (data?.models as string[]) ?? [];
    if (!models || models?.length === 0) {
      throw new Error('No models provided');
    }

    // const channelModelsWithPrefix = models.map((model) => `${modelPrefix}_${model}`).join(',');
    const channelModelsWithPrefix = models.join(',');
    const modelMappings = {};
    models.forEach((model) => {
      // modelMappings[`${modelPrefix}_${model}`] = model;
      modelMappings[model] = model;
    });

    return {
      ...data,
      groups: ['default'],
      model_mapping: JSON.stringify(modelMappings),
      models: channelModelsWithPrefix,
      type: parseInt(channelType.toString(), 10),
      other: '',
      group: 'default',
      config: '{"region":"","sk":"","ak":"","user_id":""}',
      name: `${modelPrefix}_channel`,
    };
  }

  public async createChannel(channelType: number, modelPrefix: string, data: { [x: string]: any }): Promise<OneapiChannel> {
    const channelData = this.data2channel(channelType, modelPrefix, data);

    const {
      data: { success, message },
    } = await this.request<{
      success: boolean;
      message: string;
    }>({
      method: 'POST',
      url: '/api/channel',
      data: channelData,
    });

    if (!success) {
      throw new Error(message);
    }

    const channels = await this.listChannels();
    const channel = channels.find((channel) => channel.name === channelData.name);
    if (!channel) {
      throw new Error('Failed to create channel');
    }
    return channel;
  }

  public async updateChannel(channelType: number, modelPrefix: string, data: { [x: string]: any }) {
    const channelData = this.data2channel(channelType, modelPrefix, data);

    const {
      data: { success, message },
    } = await this.request<{
      success: boolean;
      message: string;
    }>({
      method: 'PUT',
      url: '/api/channel',
      data: channelData,
    });

    if (!success) {
      throw new Error(message);
    }

    const channels = await this.listChannels();
    const channel = channels.find((channel) => channel.name === channelData.name);
    if (!channel) {
      throw new Error('Failed to update channel');
    }
    return channel;
  }

  public async deleteChannel(channelId: number) {
    const { data } = await this.request<{
      success: boolean;
      message: string;
    }>({
      method: 'DELETE',
      url: `/api/channel/${channelId}`,
    });

    if (!data.success) {
      console.error(data.message);
      return false;
    }

    return true;
  }

  public async testChannel(channelId: number, modelId: string) {
    const { data } = await this.request<{
      success: boolean;
      message: string;
      time: number;
      model: string;
    }>({
      method: 'GET',
      url: `/api/channel/test/${channelId}?model=${modelId}`,
    });

    if (!data.success) {
      throw new Error(data.message);
    }

    return data;
  }
}

export class OneApiClient extends OneApiBaseClient {
  baseURL: string;
  userToken: string;

  constructor(baseURL: string, userToken: string) {
    super(baseURL, userToken);
  }

  private async listTokens() {
    const {
      data: { success, message, data },
    } = await this.request<{
      success: boolean;
      message: string;
      data: OneAPIToken[];
    }>({
      method: 'GET',
      url: '/api/token',
      params: {
        p: 0,
        order: '',
      },
    });
    if (!success) {
      throw new Error(message);
    }
    return data;
  }

  public async getApiKey() {
    const tokens = await this.listTokens();
    if (tokens.length === 0) {
      throw new Error('Unexpected error: no api key found');
    }
    return tokens[0].key;
  }

  public async updateTokenModelScope(modelsToAdd: string[]) {
    const tokens = await this.listTokens();
    if (tokens.length === 0) {
      throw new Error('Unexpected error: no token found');
    }
    const token = tokens[0];
    const originalModels = (token.models || '').split(',');
    const models = Array.from(new Set([...originalModels, ...modelsToAdd]))
      .filter(Boolean)
      .join(',');
    const { data } = await this.request<{
      success: boolean;
      message: string;
    }>({
      method: 'PUT',
      url: `/api/token`,
      data: {
        ...token,
        models,
      },
    });
    const { success, message } = data;
    if (!success) {
      throw new Error(message);
    }
  }
}

export const generateOneApiTokenByUsernamePassword = async (baseURL: string, username: string, password: string) => {
  // 1. Do login
  const loginResponse = await axios.post(
    `/api/user/login`,
    {
      username,
      password,
    },
    {
      baseURL,
    },
  );
  const setCookieHeader = loginResponse.headers['set-cookie'];
  if (!setCookieHeader) {
    throw new Error(`Failed to login to ONEAPI: ${JSON.stringify(loginResponse.data)}`);
  }
  const cookies = setCookieHeader.map((cookie) => cookie.split(';')[0]).join('; ');

  const { data } = await axios.get<{
    success: boolean;
    message: string;
    data: string;
  }>('/api/user/token', {
    baseURL,
    headers: {
      Cookie: cookies,
    },
  });
  const { success, message, data: token } = data;
  if (!success) {
    throw new Error(message);
  }
  return token;
};
