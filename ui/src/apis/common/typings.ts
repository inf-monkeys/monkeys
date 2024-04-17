export type SystemModule = 'payment' | 'vines-ai';

export enum AuthMethod {
  password = 'password',
  phone = 'phone',
  oidc = 'oidc',
}

export interface ISystemConfig {
  theme: {
    name: string;
    favicon: {
      url: string;
      type: string;
    };
    colors: {
      primaryColor: string;
      secondaryBackgroundColor: string;
      backgroundColor: string;
    };
    logoUrl: string;
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
