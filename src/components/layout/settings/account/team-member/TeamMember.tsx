import React from 'react';

import { useTeamUsers } from '@/apis/authz/team';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';

interface ITeamMemberProps extends React.ComponentPropsWithoutRef<'div'> {}

export const TeamMember: React.FC<ITeamMemberProps> = () => {
  const { team } = useVinesTeam();
  const { data } = useTeamUsers(team?._id ?? null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>团队成员</CardTitle>
      </CardHeader>
      <CardContent></CardContent>
    </Card>
  );
};
