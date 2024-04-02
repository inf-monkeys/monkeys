import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DEFAULT_TEAM_DESCRIPTION, DEFAULT_TEAM_PHOTO, TeamsService } from './teams.service';

@Controller('/teams')
@ApiTags('Auth/Teams')
@UseGuards(CompatibleAuthGuard)
export class TeamsController {
  constructor(private readonly service: TeamsService) {}

  @Get()
  @ApiOperation({
    description: '获取用户团队列表',
    summary: '获取用户团队列表',
  })
  async getUserTeams(@Req() req: IRequest) {
    const { userId } = req;

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

  @Get('/:teamId/members')
  @ApiOperation({
    description: '获取团队成员列表',
    summary: '获取团队成员列表',
  })
  public async getTeamMembers(@Req() req: IRequest) {
    const { teamId } = req;
    const data = await this.service.getTeamMembers(teamId);
    return new SuccessResponse({
      data,
    });
  }
}
