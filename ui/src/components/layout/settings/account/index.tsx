import React from 'react';

import { useTranslation } from 'react-i18next';

import { useSystemConfig } from '@/apis/common';
import { ConsumerDetails } from '@/components/layout/settings/account/consumer-details';
import { RechargeDetails } from '@/components/layout/settings/account/recharge-details';
import { Team } from '@/components/layout/settings/account/team';
import { TeamMember } from '@/components/layout/settings/account/team-member';
import { TeamProperty } from '@/components/layout/settings/account/team-property';
import { User } from '@/components/layout/settings/account/user';
import { Card } from '@/components/ui/card.tsx';

interface IAccountProps extends React.ComponentPropsWithoutRef<'div'> {}

export const Account: React.FC<IAccountProps> = () => {
  const { t } = useTranslation();

  const { data: oem } = useSystemConfig();

  const hasPayment = (oem?.module || []).includes('payment');

  return (
    <div className="grid grid-cols-[1fr_2fr] items-start justify-center gap-4">
      <div className="grid items-start gap-4">
        <User />
        <Team />
        <TeamMember />
      </div>

      {hasPayment ? (
        <div className="grid items-start gap-6">
          <TeamProperty />
          <RechargeDetails />
          <ConsumerDetails />
          {/*<ConsumptionTrendChart />*/}
          {/*<WorkflowUsage />*/}
          {/*<WorkflowComponentUsage />*/}
        </div>
      ) : (
        <Card className="vines-center size-full">
          <h1 className="font-bold">{t('settings.account.payment-disabled-alert')}</h1>
        </Card>
      )}
    </div>
  );
};
