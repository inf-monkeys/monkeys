import { Team } from '../account/team';
import { TeamMember } from '../account/team-member';
import { TeamCustomConfig } from '../theme/team-custom-config';
import { TeamLogo } from '../theme/team-logo';
import { TeamNeocardColor } from '../theme/team-neocard-color';
import { TeamPrimaryColor } from '../theme/team-primary-color';

export const TeamSettings = () => {
  return (
    <div className="grid grid-cols-1 items-start justify-center gap-global lg:grid-cols-2 xl:grid-cols-3">
      <div className="grid items-start gap-global">
        {/* <User /> */}
        <Team />
        <TeamMember />
        <TeamLogo />
        <TeamCustomConfig />
      </div>
      <div className="grid items-start gap-global">
        <div className="grid items-start gap-global">
          <TeamPrimaryColor />
          <TeamNeocardColor />
        </div>
      </div>
    </div>
  );
};
