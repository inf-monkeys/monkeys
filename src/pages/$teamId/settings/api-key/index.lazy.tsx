import React, { useRef, useState } from 'react';

import { useClipboard } from '@mantine/hooks';
import { Key, Plus, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { useApiKeyList, useRevokeApiKey } from '@/apis/settings/apikey.ts';
import { ApiKeyStatus } from '@/apis/settings/typings.ts';
import { SettingsWrapper } from '@/components/layout/main/settings/wrapper.tsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { ApiKeySettingsCreateApiKeyDialog } from '@/pages/$teamId/settings/api-key/create-api-key-dialog.lazy.tsx';
import { SettingsTeamHeader } from '@/pages/$teamId/settings/team-header.lazy.tsx';
import { useTimeDiff } from '@/utils';

export const ApiKeySettings: React.FC = () => {
  const { formatTimeDiffPrevious } = useTimeDiff();
  const { copy: clipboardCopy } = useClipboard();
  const copyTextRef = useRef<string>('');
  const { data: apiKeyList, mutate } = useApiKeyList();

  const copy = (text: string) => {
    void clipboardCopy(text);
    copyTextRef.current = text;
  };

  const [createOpen, setCreateOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revokeId, setRevokeId] = useState('');

  const { trigger } = useRevokeApiKey(revokeId);

  const handleRevoke = (id: string) => {
    setRevokeOpen(true);
    setRevokeId(id);
  };

  const handleRevokeCancel = () => {
    setRevokeOpen(false);
    setRevokeId('');
  };

  const handleRevokeConfirm = async () => {
    setRevokeOpen(false);
    setRevokeId('');
    toast.promise(
      trigger().then(() => {
        mutate();
      }),
      {
        success: '操作成功',
        loading: '操作中......',
        error: '操作失败',
      },
    );
  };

  return (
    <>
      <SettingsWrapper>
        <SettingsTeamHeader
          readonly
          buttons={
            <>
              <Button size="large" variant="solid" icon={<Plus />} onClick={() => setCreateOpen(true)}>
                创建 API 密钥
              </Button>
            </>
          }
        >
          <>
            {apiKeyList && apiKeyList.length > 0 ? (
              apiKeyList.map((apiKey, index) => (
                <div key={index} className="justify-between">
                  <div className="flex items-center">
                    <div className="mr-1 flex-shrink-0">
                      {apiKey.status === ApiKeyStatus.Revoked ? <XCircle /> : <Key />}
                    </div>
                    <div className="flex flex-col text-sm">
                      <div className="font-bold">{apiKey.desc ?? '未提供描述'}</div>
                      <div className="flex flex-wrap">
                        {apiKey.status === ApiKeyStatus.Revoked && <div>已废弃，</div>}
                        <div>{apiKey.apiKey}</div>
                        <div>，创建于 {formatTimeDiffPrevious(apiKey.createdTimestamp)}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="!text-text1"
                        onClick={() => {
                          copy(apiKey.apiKey);
                          toast.success('已复制到剪贴板');
                        }}
                      >
                        复制
                      </Button>
                      {apiKey.status === ApiKeyStatus.Valid && (
                        <Button theme="danger" onClick={() => handleRevoke(apiKey._id)}>
                          废弃
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center">暂无数据</div>
            )}
          </>
        </SettingsTeamHeader>
      </SettingsWrapper>
      <Dialog open={revokeOpen} onClose={handleRevokeCancel}>
        <DialogContent>
          <DialogTitle>废弃前确认</DialogTitle>
          确认废弃该 API 密钥？正在使用该密钥的应用将无法访问 API。
          <DialogFooter>
            <Button onClick={handleRevokeCancel}>取消</Button>
            <Button variant="solid" onClick={handleRevokeConfirm}>
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ApiKeySettingsCreateApiKeyDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
};
