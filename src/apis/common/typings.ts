export type LoginMethods = 'sms' | 'password';
export type OemModule = 'payment' | 'vines-ai';

export interface IOemConfig {
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
  identity: {
    loginMethods: LoginMethods[];
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
