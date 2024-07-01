import React, { memo, useEffect, useState } from 'react';

import { ToolCredentialItem } from '@inf-monkeys/monkeys';
import { KeySquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ExternalAccountManage } from 'src/components/layout/ugc-pages/action-tools/external-account/manage';

import { useCredentials, useCredentialTypes } from '@/apis/credential';
import { IVinesCredentialType } from '@/apis/credential/typings.ts';
import { CreateExternalAccount } from '@/components/layout/ugc-pages/action-tools/external-account/manage/create.tsx';
import { InputPropertyWrapper } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/wrapper';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';

interface IVinesInputCredentialsProps {
  value: string;
  onChange: (type: string, id: string) => void;
  credentials: ToolCredentialItem[];
}

export const VinesInputCredentials: React.FC<IVinesInputCredentialsProps> = memo(({ credentials, value, onChange }) => {
  const { t } = useTranslation();

  const currentCredential = credentials?.[0];
  const credentialName = currentCredential.name;
  const credentialRequired = currentCredential.required;

  const { data: credentialList } = useCredentials(credentialName);
  const { data } = useCredentialTypes();

  const [active, setActive] = useState<IVinesCredentialType | null>(null);

  const handleValueChange = (value: string) => {
    if (!value || value === '_') return;
    if (value === 'manage') {
      setActive(data?.find((it) => it.name === credentialName) ?? null);
    } else {
      onChange(credentialName, value);
    }
  };

  useEffect(() => {
    if (credentialList?.length) {
      if (credentialList?.find(({ id }) => id === value)) {
        return;
      }
    }

    if (value) {
      onChange(credentialName, '');
    }
  }, [value, credentialList]);

  return (
    <>
      <InputPropertyWrapper
        nodeId={credentialName + '_credential'}
        def={{
          displayName: t('workspace.flow-view.headless-modal.tool-editor.input.credentials.label'),
          type: 'string',
          name: credentialName,
          required: credentialRequired,
        }}
      >
        <Select value={value} onValueChange={handleValueChange}>
          <SelectTrigger>
            <SelectValue
              placeholder={t('workspace.flow-view.headless-modal.tool-editor.input.credentials.placeholder')}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {credentialList?.map(({ displayName, id }, i) => (
                <SelectItem value={id ?? ''} key={i}>
                  {displayName}
                </SelectItem>
              ))}
              {!credentialList?.length && (
                <SelectItem value="_" disabled>
                  {t('workspace.flow-view.headless-modal.tool-editor.input.credentials.empty')}
                </SelectItem>
              )}
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectItem value="manage" className="cursor-pointer">
                <div className="flex items-center gap-2">
                  <KeySquare size={16} />
                  {t('workspace.flow-view.headless-modal.tool-editor.input.credentials.manage')}
                </div>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </InputPropertyWrapper>
      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-w-[46rem]">
          {active && <ExternalAccountManage detail={active} />}
          <DialogFooter>
            <CreateExternalAccount detail={active}>
              <Button variant="outline">
                {t('workspace.flow-view.headless-modal.tool-editor.input.credentials.create')}
              </Button>
            </CreateExternalAccount>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

VinesInputCredentials.displayName = 'VinesInputCredentials';
