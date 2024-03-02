import React from 'react';

import { ConsumerDetails } from '@/components/layout/settings/account/consumer-details';
import { ConsumptionTrendChart } from '@/components/layout/settings/account/consumption-trend-chart/ConsumptionTrendChart.tsx';
import { RechargeDetails } from '@/components/layout/settings/account/recharge-details';
import { Team } from '@/components/layout/settings/account/team';
import { TeamMember } from '@/components/layout/settings/account/team-member';
import { TeamProperty } from '@/components/layout/settings/account/team-property';
import { User } from '@/components/layout/settings/account/user';
import { WorkflowComponentUsage } from '@/components/layout/settings/account/workflow-component-usage/WorkflowComponentUsage.tsx';
import { WorkflowUsage } from '@/components/layout/settings/account/workflow-usage';

interface IAccountProps extends React.ComponentPropsWithoutRef<'div'> {}

export const Account: React.FC<IAccountProps> = () => {
  return (
    <div className="grid grid-cols-[1fr_2fr] items-start justify-center gap-4">
      <div className="grid items-start gap-4">
        <User />
        <Team />
        <TeamMember />
      </div>
      <div className="grid items-start gap-6">
        <TeamProperty />
        <RechargeDetails />
        <ConsumerDetails />
        <ConsumptionTrendChart />
        <WorkflowUsage />
        <WorkflowComponentUsage />
      </div>
    </div>
  );
};
