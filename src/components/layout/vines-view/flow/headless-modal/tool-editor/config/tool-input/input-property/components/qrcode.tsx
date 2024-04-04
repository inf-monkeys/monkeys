import React, { useEffect, useState } from 'react';

import { GeneQRCodeResult, generateQrcode, QRCodeStatus } from '@/apis/tools';
import { cn } from '@/utils';

import { IVinesInputPropertyProps } from '..';

interface IQrcodeInputProps {}

export const QRCodeInput: React.FC<IVinesInputPropertyProps & IQrcodeInputProps> = ({
  toolName,
  def,
  context,
  onChange,
}) => {
  const [qrcodeResult, setQRCodeResult] = useState<GeneQRCodeResult | undefined>(undefined);
  const generateQRCode = async () => {
    const geneEndpoint = def.typeOptions?.endpoints?.gene || {};
    const { method, url } = geneEndpoint;
    const res = await generateQrcode(toolName, url, method, {
      ...(context || {}),
      ...(def.typeOptions?.extraData || {}),
    });
    setQRCodeResult(res);
    if (res?.status === QRCodeStatus.LOGGED_IN) {
      onChange(res.sessionId);
    }
  };

  useEffect(() => {
    generateQRCode();
  }, []);

  return (
    <div className={cn('relative', { 'pointer-events-none': false })}>
      {qrcodeResult?.status === QRCodeStatus.LOGGED_IN && (
        <>已登录用户「{qrcodeResult?.userinfo?.displayName}」，可直接创建。</>
      )}
      {qrcodeResult?.status !== QRCodeStatus.LOGGED_IN && (
        <>
          {qrcodeResult?.qrcode?.type === 'iframe' && (
            <iframe
              width={`${qrcodeResult.qrcode.width}px`}
              height={`${qrcodeResult.qrcode.height}px`}
              src={`${qrcodeResult.qrcode.src}`}
            ></iframe>
          )}
          {qrcodeResult?.qrcode?.type === 'image' && (
            <img
              width={`${qrcodeResult.qrcode.width}px`}
              height={`${qrcodeResult.qrcode.height}px`}
              src={`${qrcodeResult.qrcode.src}`}
            ></img>
          )}
        </>
      )}
    </div>
  );
};
