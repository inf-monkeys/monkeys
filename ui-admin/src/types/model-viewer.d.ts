// Type declarations for model-viewer web component
declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': ModelViewerJSX & React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
  }
}

interface ModelViewerJSX {
  src?: string;
  alt?: string;
  poster?: string;
  loading?: 'auto' | 'lazy' | 'eager';
  reveal?: 'auto' | 'interaction' | 'manual';
  'auto-rotate'?: boolean;
  'camera-controls'?: boolean;
  'disable-zoom'?: boolean;
  'disable-pan'?: boolean;
  'interaction-prompt'?: 'auto' | 'none';
  'interaction-prompt-threshold'?: number;
  'camera-orbit'?: string;
  'field-of-view'?: string;
  'min-camera-orbit'?: string;
  'max-camera-orbit'?: string;
  'min-field-of-view'?: string;
  'max-field-of-view'?: string;
  ar?: boolean;
  'ar-modes'?: string;
  'ar-scale'?: 'auto' | 'fixed';
  'ar-placement'?: 'floor' | 'wall';
  'ios-src'?: string;
  'xr-environment'?: boolean;
  environment?: string;
  'environment-image'?: string;
  skybox?: string;
  'skybox-image'?: string;
  exposure?: number;
  'shadow-intensity'?: number;
  'shadow-softness'?: number;
  style?: React.CSSProperties;
  class?: string;
  className?: string;
}
