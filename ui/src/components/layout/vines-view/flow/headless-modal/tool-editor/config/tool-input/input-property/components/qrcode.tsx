import React, { useEffect, useState } from 'react';

import { callToolsApi, GeneQRCodeResult, QRCodeStatus, QRCodeStatusResult, QRCodeUserInfo } from '@/apis/tools';
import { Loading } from '@/components/ui/loading';
import { cn } from '@/utils';

import { IVinesInputPropertyProps } from '..';

interface IQrcodeInputProps {
  toolName: string;
  def: any;
  context: any;
  onChange: (sessionId: string) => void;
}

export const QRCodeInput: React.FC<IVinesInputPropertyProps & IQrcodeInputProps> = ({
  toolName,
  def,
  context,
  onChange,
}) => {
  const [qrcodeStatus, setQRCodeStatus] = useState<QRCodeStatus | undefined>(undefined);
  const [userInfo, setUserInfo] = useState<QRCodeUserInfo | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [pollingForStatus, setPollingForStatus] = useState(false);
  const [geneQrcodeResult, setGeneQRCodeResult] = useState<GeneQRCodeResult | undefined>(undefined);
  const generateQRCode = async () => {
    setLoading(true);
    const geneEndpoint = def.typeOptions?.endpoints?.gene || {};
    const { method, url } = geneEndpoint;
    const res = await callToolsApi<GeneQRCodeResult>(toolName, url, method, {
      ...(context || {}),
      ...(def.typeOptions?.extraData || {}),
    });
    setGeneQRCodeResult(res);
    setQRCodeStatus(res?.status);
    if (res?.status === QRCodeStatus.LOGGED_IN) {
      onChange(res.sessionId);
      setUserInfo(res.userinfo);
    } else {
      await fetchQrCodeStatus(res!.sessionId!);
    }
    setLoading(false);
  };

  // 模拟API调用
  const fetchQrCodeStatus = async (sessionId: string) => {
    try {
      setPollingForStatus(true);
      const checkEndpoint = def.typeOptions?.endpoints?.check || {};
      const { method, url } = checkEndpoint;
      const data = { sessionId };
      const res = await callToolsApi<QRCodeStatusResult>(toolName, url, method, data);
      setQRCodeStatus(res?.status);
      if (res?.status === QRCodeStatus.LOGGED_IN) {
        setUserInfo(res.userinfo);
        setPollingForStatus(false);
        onChange(res.sessionId);
      } else {
        setTimeout(() => {
          fetchQrCodeStatus(sessionId);
        }, 1000);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => void generateQRCode(), []);

  return (
    <div className={cn('relative', { 'pointer-events-none': false })}>
      {loading && (
        <div
          style={{
            marginTop: 20,
          }}
        >
          <Loading motionKey="vines-qrcode-loading" />
        </div>
      )}

      {!loading && qrcodeStatus === QRCodeStatus.LOGGED_IN && <>已登录用户「{userInfo?.displayName}」，可直接创建。</>}
      {!loading && qrcodeStatus !== QRCodeStatus.LOGGED_IN && (
        <>
          {geneQrcodeResult?.qrcode?.type === 'iframe' && (
            <iframe
              width={`${geneQrcodeResult.qrcode.width}px`}
              height={`${geneQrcodeResult.qrcode.height}px`}
              src={`${geneQrcodeResult.qrcode.src}`}
            />
          )}
          {geneQrcodeResult?.qrcode?.type === 'image' && (
            <img
              width={`${geneQrcodeResult.qrcode.width}px`}
              height={`${geneQrcodeResult.qrcode.height}px`}
              src={`${geneQrcodeResult.qrcode.src}`}
              alt="qrcode"
            />
          )}
          {pollingForStatus && <>查询最新扫描状态中 ...</>}
        </>
      )}
    </div>
  );
};
