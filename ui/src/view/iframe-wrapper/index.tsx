import { Page404 } from '@/components/layout/workspace/404';

interface IIframeWrapperProps {
  iframeUrl?: string;
}

export const IframeWrapper = ({ iframeUrl }: IIframeWrapperProps) => {
  console.log('iframeUrl', iframeUrl);
  return iframeUrl ? <iframe src={iframeUrl} className="size-full" /> : <Page404 />;
};
