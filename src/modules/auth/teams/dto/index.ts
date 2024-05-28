import * as Joiful from 'joiful';
import { TeamInviteLinkOutdateType } from '@/database/entities/identity/team-invites';

export class InviteUser2TeamDto {
  @Joiful.string()
  inviterUserId: string;

  @Joiful.string()
  targetUserId?: string;

  @Joiful.number()
  outdateType: TeamInviteLinkOutdateType;
}
