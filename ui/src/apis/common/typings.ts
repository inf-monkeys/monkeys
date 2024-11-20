export type SystemModule = 'payment' | 'vines-ai';

export enum AuthMethod {
  password = 'password',
  phone = 'phone',
  oidc = 'oidc',
  oauth = 'oauth',
}

export interface ISystemConfig {
  theme: {
    name: string;
    favicon: {
      dark: string;
      light: string;
    };
    logo: {
      dark: string;
      light: string;
    };
    colors: {
      primaryColor: string;
    };
  };
  auth: {
    enabled: AuthMethod[];
    oidc?: {
      buttonText?: string;
      autoSignin?: boolean;
    };
  };
  pages: {
    allowPageKeys: string[] | '*';
  };
  endpoints: {
    clientUrl: string;
    [name: string]: string;
  };
  module: SystemModule[] | '*';
}
