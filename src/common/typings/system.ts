import { AuthMethod } from '../config';
export type OemModule = 'payment' | 'vines-ai';

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
    oidc: {
      buttonText: string;
    };
  };
  pages: {
    allowPageKeys: string[] | '*';
  };
  endpoints: {
    clientUrl: string;
    [name: string]: string;
  };
  module: OemModule[] | '*';
}
