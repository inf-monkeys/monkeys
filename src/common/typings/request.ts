import * as express from 'express';

export enum AuthenticationType {
  APIKEY = 'APIKEY',
  TOKEN = 'TOKEN',
}

export interface IRequest extends express.Request {
  requestId: string;
  fullUrl: string;
  authenticationType: AuthenticationType;
  userId: string;
  teamId: string;
  user: any;

  skipUnauthorized: boolean;
}

export interface ToolsReqContext {
  appId: string;
  userId: string;
  teamId: string;
  workflowInstanceId: string;
}

export interface IToolsRequest extends express.Request {
  context: ToolsReqContext;
}
