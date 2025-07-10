import { ConsumerDetails } from '../account/consumer-details';
import { RechargeDetails } from '../account/recharge-details';
import { TeamProperty } from '../account/team-property';

export const TeamCredit = () => {
  return (
    <div className="= grid grid-cols-1 items-start justify-center gap-global md:grid-cols-2">
      <div className="flex flex-col gap-global">
        <TeamProperty />
        <RechargeDetails />
        <ConsumerDetails />
      </div>
    </div>
  );
};
