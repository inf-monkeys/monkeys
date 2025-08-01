import React from 'react';

import { useTranslation } from 'react-i18next';

import { useSystemConfig } from '@/apis/common';
import { Team } from '@/components/layout/settings/account/team';
import { User } from '@/components/layout/settings/account/user';

interface IAccountProps extends React.ComponentPropsWithoutRef<'div'> {}

export const Account: React.FC<IAccountProps> = () => {
  const { t } = useTranslation();

  const { data: oem } = useSystemConfig();

  const teamAsUser = oem?.theme.teamAsUser || false;

  const hasPayment = (oem?.module || []).includes('payment');

  return (
    <div className="grid grid-cols-[1fr_2fr] items-start justify-center gap-global">
      <div className="grid items-start gap-global">
        <User />
        {!teamAsUser && <Team />}
        {/* <TeamMember /> */}
      </div>

      {/* <div className="grid items-start gap-global">
        <div className="grid grid-cols-2 items-start gap-global">
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
