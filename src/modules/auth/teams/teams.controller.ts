import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { SuccessResponse } from '@/common/response';
import { IRequest } from '@/common/typings/request';
import { CustomTheme, TeamInitStatusEnum } from '@/database/entities/identity/team';
import { InviteUser2TeamDto } from '@/modules/auth/teams/dto';
import { Body, Controller, Delete, Get, Param, Post, Put, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { omit } from 'lodash';
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
      data: teams
        .sort((a, b) => Number(b.createdTimestamp) - Number(a.createdTimestamp))
        .sort((a, b) => {
          if (a.ownerUserId === userId) return -1;
          if (b.ownerUserId === userId) return 1;
          return 0;
        })
        .map((t) => ({
          ...t,
          id: String(t.id),
        })),
    });
  }

  @Post('/')
  @ApiOperation({
    description: '创建团队',
    summary: '创建团队',
  })
  public async createTeam(
    @Req() req: IRequest,
    @Body('')
    body: {
      name: string;
      description?: string;
      iconUrl?: string;
      darkmodeIconUrl?: string;
    },
  ) {
    const { userId } = req;
    const { name, description, iconUrl, darkmodeIconUrl } = body;
    const team = await this.service.createTeam(userId, name, description, iconUrl, false, 'self', undefined, darkmodeIconUrl);
    return new SuccessResponse({
      data: team,
    });
  }

  @Delete('/:id')
  @ApiOperation({
    description: '删除团队',
    summary: '删除团队',
  })
  public async deleteTeam(@Req() req: IRequest, @Param('id') teamId: string) {
    const { userId } = req;
    const data = await this.service.deleteTeam(teamId, userId);
    return new SuccessResponse({ data });
  }

  @Post('/:id/init')
  @ApiOperation({
    description: '初始化团队',
    summary: '初始化团队',
  })
  public async initTeam(@Req() req: IRequest, @Param('id') teamId: string, @Body() body: { deleteAllAssets?: boolean }) {
    const { userId } = req;
    const data = await this.service.initTeam(teamId, userId, body.deleteAllAssets);
    return new SuccessResponse({ data });
  }

  @Put('/')
  @ApiOperation({
    description: '更新团队信息',
    summary: '更新团队信息',
  })
  public async updateTeam(
    @Req() req: IRequest,
    @Body()
    body: {
      name?: string;
      description?: string;
      iconUrl?: string;
      customTheme: CustomTheme;
      darkmodeIconUrl?: string;
    },
  ) {
    const { teamId } = req;
    const data = await this.service.updateTeam(teamId, body);
    return new SuccessResponse({ data });
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
      data: {
        totalCount: data.length,
        list: data,
      },
    });
  }

  @Post('/:teamId/join-requests')
  @ApiOperation({
    description: '申请加入团队',
    summary: '申请加入团队',
  })
  public async makeJoinRequest(@Req() req: IRequest, @Param('teamId') teamId: string) {
    const { userId } = req;
    const data = await this.service.makeJoinTeamRequest(teamId, userId);
    return new SuccessResponse({
      data,
    });
  }

  @Get('/:teamId/join-requests')
  @ApiOperation({
    description: '获取团队加入请求列表',
    summary: '获取团队加入请求列表',
  })
  public async listJoinRequests(@Req() req: IRequest, @Param('teamId') teamId: string) {
    const data = await this.service.listJoinRequests(teamId);
    return new SuccessResponse({
      data,
    });
  }

  @Post('/:id/members/remove')
  @ApiOperation({
    description: '移除团队成员',
    summary: '移除团队成员',
  })
  public async removeTeamMember(@Req() req: IRequest, @Param('id') teamId: string, @Body('userId') removeUserId: string) {
    const { userId } = req;
    const data = await this.service.removeTeamMember(teamId, userId, removeUserId);
    return new SuccessResponse({
      data,
    });
  }

  @Get('/invites/:id')
  @ApiOperation({
    description: '获取团队邀请详情',
    summary: '获取团队邀请详情',
  })
  async getTeamInvite(@Req() req: IRequest, @Param('id') inviteId: string) {
    const { userId } = req;

    const invite = await this.service.getTeamInviteById(inviteId);

    const teams = await this.service.getUserTeams(userId);
    if (teams.some((t) => t.id === invite.teamId)) {
      const team = await this.service.getTeamBriefById(invite.teamId);

      return new SuccessResponse({
        code: 200,
        message: '您已加入该团队，无需重复加入',
        data: {
          alreadyJoined: true,
          teamId: invite.teamId,
          team: team,
        },
      });
    }

    const team = await this.service.getTeamBriefById(invite.teamId);
    return new SuccessResponse({
      code: 200,
      data: {
        invite: omit(invite, ['remark']),
        team,
      },
    });
  }

  @Post('/invites/:id/accept')
  @ApiOperation({
    description: '接受团队邀请',
    summary: '接受团队邀请',
  })
  async acceptTeamInvite(@Req() req: IRequest, @Param('id') inviteId: string) {
    const { userId } = req;
    const res = await this.service.acceptTeamInvite(userId, inviteId);
    return new SuccessResponse({
      data: res,
    });
  }

  @Post('/invites/:teamId')
  @ApiOperation({
    description: '创建团队邀请链接',
    summary: '创建团队邀请链接',
  })
  public async inviteUser2Team(@Req() req: IRequest, @Param('teamId') teamId: string, @Body() body: InviteUser2TeamDto) {
    const { inviterUserId, targetUserId, outdateType } = body;
    const {
      headers: { referer },
    } = req;
    const WEB_CLIENT_ENDPOINT = referer?.split('/')?.slice(0, 3)?.join('/') ?? '';

    const inviteId = await this.service.createTeamInviteId(teamId, inviterUserId, outdateType, targetUserId);
    const inviteLink = `${WEB_CLIENT_ENDPOINT}/${inviteId}/join-team`;

    return new SuccessResponse({
      data: inviteLink,
    });
  }

  @Get('/invites/manage/:teamId')
  @ApiOperation({
    description: '获取团队邀请链接列表',
    summary: '获取团队邀请链接列表',
  })
  public async manageInvites(@Req() req: IRequest, @Param('teamId') teamId: string) {
    const { userId } = req;
    const teams = await this.service.getUserTeams(userId);
    if (!teams.some((t) => t.id === teamId)) {
      throw new Error('你不在这个团队中，无法查看数据');
    }
    const res = await this.service.getTeamInvites(teamId);
    return new SuccessResponse({
      data: res,
    });
  }

  @Post('/invites/manage/:teamId/remark/:inviteId')
  @ApiOperation({
    description: '更新团队邀请链接备注',
    summary: '更新团队邀请链接备注',
  })
  public async updateTeamInviteRemark(@Param('inviteId') inviteId: string, @Body('remark') remark: string) {
    const res = await this.service.updateTeamInviteRemark(inviteId, remark);
    return new SuccessResponse({
      data: res,
    });
  }

  @Post('/invites/manage/:teamId/toggle/:inviteId')
  @ApiOperation({
    description: '切换团队邀请链接状态',
    summary: '切换团队邀请链接状态',
  })
  public async toggleForeverTeamInviteLinkStatus(@Param('inviteId') inviteId: string) {
    const res = await this.service.toggleForeverTeamInviteLinkStatus(inviteId);
    return new SuccessResponse({
      data: res,
    });
  }

  @Post('/invites/manage/:teamId/delete/:inviteId')
  @ApiOperation({
    description: '删除团队邀请链接',
    summary: '删除团队邀请链接',
  })
  public async deleteTeamInvite(@Param('inviteId') inviteId: string) {
    const res = await this.service.deleteTeamInvite(inviteId);
    return new SuccessResponse({
      data: res,
    });
  }

  @Get('/:teamId/init-status')
  @ApiOperation({
    description: '获取团队初始化状态，如果状态为 PENDING 或 FAILED 则通过 SSE 实时推送',
    summary: '获取团队初始化状态',
  })
  public async getTeamInitStatus(@Req() req: IRequest, @Param('teamId') teamId: string, @Res() res: Response) {
    const { userId } = req;
    const status = await this.service.getTeamInitStatus(teamId, userId);

    console.log('status', status);

    // 如果状态为 null 或者 SUCCESS，直接返回结果
    if (!status || status === TeamInitStatusEnum.SUCCESS) {
      console.log('return status', status);

      return res.json(
        new SuccessResponse({
          data: status,
        }),
      );
    }

    // 如果状态为 PENDING 或 FAILED，进入 SSE 流式流程
    if (status === TeamInitStatusEnum.PENDING || status === TeamInitStatusEnum.FAILED) {
      console.log('enter SSE stream');

      // 设置 SSE 响应头
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

      let isConnected = true;

      // 发送初始连接事件和当前状态
      res.write(`event: connected\n`);
      res.write(
        `data: ${JSON.stringify({
          type: 'connected',
          teamId,
          timestamp: new Date().toISOString(),
        })}\n\n`,
      );

      // 发送当前状态
      res.write(`event: status_update\n`);
      res.write(
        `data: ${JSON.stringify({
          type: 'status_update',
          teamId,
          status,
          timestamp: new Date().toISOString(),
        })}\n\n`,
      );

      // 处理客户端断开连接
      req.on('close', () => {
        isConnected = false;
      });

      // 订阅团队状态变化
      const unsubscribe = await this.service.subscribeToTeamStatus(teamId, userId, (newStatus) => {
        if (isConnected) {
          res.write(`event: status_update\n`);
          res.write(
            `data: ${JSON.stringify({
              type: 'status_update',
              teamId,
              status: newStatus,
              timestamp: new Date().toISOString(),
            })}\n\n`,
          );

          // 如果状态变为 SUCCESS 或 null，结束流
          if (!newStatus || newStatus === TeamInitStatusEnum.SUCCESS) {
            res.write(`event: complete\n`);
            res.write(
              `data: ${JSON.stringify({
                type: 'complete',
                teamId,
                status: newStatus,
                timestamp: new Date().toISOString(),
              })}\n\n`,
            );
            res.end();
            unsubscribe();
          }
        }
      });

      // 监听连接关闭
      req.on('close', () => {
        unsubscribe();
      });

      // 发送心跳
      const heartbeat = setInterval(() => {
        if (isConnected) {
          res.write(`event: heartbeat\n`);
          res.write(
            `data: ${JSON.stringify({
              type: 'heartbeat',
              timestamp: new Date().toISOString(),
            })}\n\n`,
          );
        } else {
          clearInterval(heartbeat);
        }
      }, 30000);

      // 清理心跳定时器
      req.on('close', () => {
        clearInterval(heartbeat);
      });
    }
  }
}
