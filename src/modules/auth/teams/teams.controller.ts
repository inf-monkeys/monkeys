import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { DEFAULT_TEAM_DESCRIPTION, DEFAULT_TEAM_PHOTO, TeamsService } from './teams.service';

@Controller('/teams')
export class TeamsController {
  constructor(private readonly service: TeamsService) {}

  @Get()
  @UseGuards(CompatibleAuthGuard)
  async getUserTeams(@Req() request: IRequest) {
    const { userId } = request;

    let teams = await this.service.getUserTeams(userId);
    if (!teams.length) {
      // 如果当前用户没有团队，说明是新用户，需要创建一个默认团队
      const defaultTeamName = `默认团队`;
      await this.service.createTeam(userId, defaultTeamName, DEFAULT_TEAM_DESCRIPTION, DEFAULT_TEAM_PHOTO, true);
      teams = await this.service.getUserTeams(userId);
    }
    return new SuccessResponse({
      data: teams.map((t) => ({
        ...t,
        id: String(t.id),
      })),
    });
  }
}
