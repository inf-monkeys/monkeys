import { ConsumerDetails } from '../account/consumer-details';
import { RechargeDetails } from '../account/recharge-details';
import { TeamProperty } from '../account/team-property';

export const TeamCredit = () => {
  return (
    <div className="= gap-global grid grid-cols-1 items-start justify-center md:grid-cols-2">
      <div className="gap-global flex flex-col">
        <TeamProperty />
        <RechargeDetails />
        <ConsumerDetails />
      </div>
    </div>
  );
};
