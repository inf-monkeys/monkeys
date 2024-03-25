export type CanvasApplicationName = 'monkeys-canvas';

export interface CanvasApplication {
  // 应用名称
  appName: CanvasApplicationName;

  // 显示名称
  displayName: string;

  logoUrl: string;

  // 应用地址
  endpoint: string;
}

export const APPLICATIONS: CanvasApplication[] = [
  {
    appName: 'monkeys-canvas',
    displayName: '画板',
    logoUrl: '',
    endpoint: 'https://vines-canvas.infmonkeys.com',
  },
];
