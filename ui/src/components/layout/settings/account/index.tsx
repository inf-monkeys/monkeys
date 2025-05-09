import React from 'react';

import { useTranslation } from 'react-i18next';

import { useSystemConfig } from '@/apis/common';
import { Team } from '@/components/layout/settings/account/team';
import { User } from '@/components/layout/settings/account/user';

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
        {/* <TeamMember /> */}
      </div>

      {/* <div className="grid items-start gap-4">
        <div className="grid grid-cols-2 items-start gap-4">
          <TeamPrimaryColor />
          <TeamLogo />
        </div>
        {hasPayment ? (
          <>
            <TeamProperty />
            <RechargeDetails />
            <ConsumerDetails />
          </>
        ) : (
          <Card className="vines-center py-16">
            <h1 className="font-bold">{t('settings.account.payment-disabled-alert')}</h1>
          </Card>
        )} */}

      {/*<ConsumptionTrendChart />*/}
      {/*<WorkflowUsage />*/}
      {/*<WorkflowComponentUsage />*/}
      {/* </div> */}
    </div>
  );
};
