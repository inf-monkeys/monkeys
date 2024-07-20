import React from 'react';

import { useTranslation } from 'react-i18next';

import { useCredentials, useCredentialTypes } from '@/apis/credential';
import { IVinesCredentialType } from '@/apis/credential/typings.ts';
import { ExternalAccountManage } from '@/components/layout/ugc-pages/action-tools/external-account/manage';
import { CreateExternalAccount } from '@/components/layout/ugc-pages/action-tools/external-account/manage/create.tsx';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card.tsx';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { VinesLoading } from '@/components/ui/loading';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';

interface IAccountTypesProps {}

export const AccountTypes: React.FC<IAccountTypesProps> = () => {
  const { t } = useTranslation();

  const { data: credentials } = useCredentials();
  const { data } = useCredentialTypes();

  const [active, setActive] = React.useState<IVinesCredentialType | null>(null);

  return (
    <>
      <ScrollArea className="h-96">
        {!credentials || !data ? (
          <div className="vines-center h-96">
            <VinesLoading />
          </div>
        ) : (
          <div className="grid w-full grid-cols-3 gap-4">
            {data?.map((it, i) => {
              const length = credentials?.filter((c) => c.type === it.name)?.length ?? 0;
              return (
                <Card
                  className="flex size-full cursor-pointer items-center gap-4 p-4 hover:bg-gray-2 dark:hover:bg-gray-3"
                  key={i}
                  onClick={() => setActive(it)}
                >
                  <div className="size-12">
                    <VinesIcon className="size-full" size="lg" src={it.iconUrl} />
                  </div>
                  <div className="leading-5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="line-clamp-1 font-bold">{it.displayName}</div>
                      </TooltipTrigger>
                      <TooltipContent>{it.displayName}</TooltipContent>
                    </Tooltip>
                    <div className="mt-1 line-clamp-1 text-xs opacity-50">
                      {length
                        ? t('ugc-page.action-tools.ugc-view.subtitle.external-account.list.count.total', {
                            count: length,
                          })
                        : t('ugc-page.action-tools.ugc-view.subtitle.external-account.list.count.none')}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>
      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-w-[46rem]">
          {active && <ExternalAccountManage detail={active} />}
          <DialogFooter>
            <CreateExternalAccount detail={active}>
              <Button variant="outline">
                {t('ugc-page.action-tools.ugc-view.subtitle.external-account.list.create')}
              </Button>
            </CreateExternalAccount>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
