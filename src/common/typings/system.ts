import { AuthMethod } from '../config';
export type OemModule = 'payment' | 'vines-ai';

export interface ISystemConfig {
  theme: {
    title: string;
    favicon: {
      light: string;
      dark: string;
    };
    logo: {
      light: string;
      dark: string;
    };
    colors: {
      primaryColor: string;
    };
    toast: {
      position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
    };
  };
  auth: {
    enabled: AuthMethod[];
    oidc: {
      buttonText: string;
      autoSignin: boolean;
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
