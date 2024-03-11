import { config } from '@/common/config';
import { IRequest } from '@/common/typings/request';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class MilvusGatewayService {
  private baseURL: string;
  private serviceToken: string;
  private enabled: boolean;

  constructor(private readonly httpService: HttpService) {
    this.enabled = config.vector.enabled;
    this.baseURL = config.vector.baseUrl;
  }

  public async authorizeCollection(name: string, teamId: string) {
    if (!this.baseURL) {
      throw Error(`未配置向量服务，请联系服务管理员`);
    }
    try {
      const resp$ = this.httpService.request({
        method: 'POST',
        url: `/api/vector/collections/${name}/authorize`,
        headers: {
          authorization: `System ${this.serviceToken}`,
          'x-monkeys-appid': config.server.appId,
        },
        data: {
          team_id: teamId,
        },
        baseURL: this.baseURL,
      });
      const resp = await lastValueFrom(resp$);
      console.log('授权向量数据库访问结果：', resp.data);
    } catch (e) {
      if (e.response) {
        // backend error
        throw Error('授权向量数据库失败：' + e.response.data.message || e.response.data.error);
      } else {
        // vector-search 后端挂了或者不可用
        console.log('milvus error', e);
        throw Error('授权向量数据库失败：' + e.message);
      }
    }
  }

  public async copyCollectionWithOutData(name: string, teamId: string, userId: string) {
    if (!this.baseURL) {
      throw Error(`未配置 MILVUS_SERVICE_URL，请联系服务管理员`);
    }

    try {
      const resp$ = this.httpService.request({
        method: 'POST',
        url: `/api/vector/collections/${name}/copy`,
        headers: {
          authorization: `System ${this.serviceToken}`,
          'x-monkeys-appid': config.vector.baseUrl,
        },
        data: {
          include_data: false,
          team_id: teamId,
          user_id: userId,
        },
        baseURL: this.baseURL,
      });
      const resp = await lastValueFrom(resp$);
      console.log('复制向量数据库成功：', resp.data);
      const newCollectionName = resp.data.name;
      return newCollectionName;
    } catch (e) {
      if (e.response) {
        // backend error
        throw Error('复制向量数据库失败：' + e.response.data.message || e.response.data.error);
      } else {
        // vector-search 后端挂了或者不可用
        console.log('milvus error', e);
        throw Error('复制向量数据库失败：' + e.message);
      }
    }
  }

  public async requestAsAdmin(request: AxiosRequestConfig) {
    if (!this.baseURL) {
      throw Error(`未配置 MILVUS_SERVICE_URL，请联系服务管理员`);
    }
    const headers = {
      'x-monkeys-appid': config.server.appId,
    };
    Object.assign(headers, request.headers || {});
    try {
      const resp$ = this.httpService.request({
        method: request.method,
        url: request.url,
        headers,
        data: request.data,
        baseURL: this.baseURL,
      });
      const resp = await lastValueFrom(resp$);
      return resp.data;
    } catch (e) {
      if (e.response) {
        // backend error
        throw Error('请求向量数据库服务失败: ' + e.response.data.message || e.response.data.error);
      } else {
        // vector-search 后端挂了或者不可用
        console.log('milvus error', e);
        throw Error('请求向量数据库服务失败: ' + e.message);
      }
    }
  }

  public async requestAsNormalUser(teamId: string, userId: string, request: AxiosRequestConfig) {
    if (!this.baseURL) {
      throw Error(`未配置 MILVUS_SERVICE_URL，请联系服务管理员`);
    }
    const headers = {
      'x-monkeys-appid': config.server.appId,
      'x-monkeys-teamid': teamId,
      'x-monkeys-userid': userId,
    };
    Object.assign(headers, request.headers || {});
    try {
      const resp$ = this.httpService.request({
        method: request.method,
        url: request.url,
        headers,
        data: request.data,
        baseURL: this.baseURL,
      });
      const resp = await lastValueFrom(resp$);
      return resp.data;
    } catch (e) {
      if (e.response) {
        // backend error
        throw Error('请求向量数据库服务失败: ' + e.response.data.message || e.response.data.error);
      } else {
        // vector-search 后端挂了或者不可用
        console.log('milvus error', e);
        throw Error('请求向量数据库服务失败: ' + e.message);
      }
    }
  }

  public async forward(request: IRequest) {
    if (!this.baseURL) {
      throw Error(`未配置 MILVUS_SERVICE_URL，请联系服务管理员`);
    }
    try {
      const resp$ = this.httpService.request({
        method: request.method,
        url: request.url,
        headers: {
          Authorization: request.headers['authentication'],
          'x-monkeys-teamid': request.headers['team'],
          'x-monkeys-appid': config.server.appId,
        },
        data: request.body,
        baseURL: this.baseURL,
      });
      const resp = await lastValueFrom(resp$);
      return resp.data;
    } catch (e) {
      if (e.response) {
        // backend error
        throw Error('请求向量数据库服务失败: ' + e.response.data.message || e.response.data.error);
      } else {
        // vector-search 后端挂了或者不可用
        console.log('milvus error', e);
        throw Error('请求向量数据库服务失败: ' + e.message);
      }
    }
  }
}
