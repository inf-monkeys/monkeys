import { Team } from '../account/team';
import { TeamMember } from '../account/team-member';
import { TeamLogo } from '../theme/team-logo';
import { TeamNeocardColor } from '../theme/team-neocard-color';
import { TeamPrimaryColor } from '../theme/team-primary-color';

export const TeamSettings = () => {
  return (
    <div className="grid grid-cols-1 items-start justify-center gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div className="grid items-start gap-4">
        {/* <User /> */}
        <Team />
        <TeamMember />
      </div>
      <div className="grid items-start gap-4">
        <div className="grid items-start gap-4">
          <TeamPrimaryColor />
          <TeamNeocardColor />
          <TeamLogo />
        </div>
      </div>
    </div>
  );
};
