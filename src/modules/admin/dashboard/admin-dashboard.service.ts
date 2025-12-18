import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserEntity } from '@/database/entities/identity/user';
import { TeamEntity } from '@/database/entities/identity/team';
import { ToolsEntity } from '@/database/entities/tools/tools.entity';
import { WorkflowMetadataEntity } from '@/database/entities/workflow/workflow-metadata';
import {
  AdminDashboardMetricDto,
  AdminDashboardStatsDto,
  AdminDashboardTrend,
} from './dto/admin-dashboard.dto';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly dataSource: DataSource) {}

  async getStats(): Promise<AdminDashboardStatsDto> {
    const userRepo = this.dataSource.getRepository(UserEntity);
    const teamRepo = this.dataSource.getRepository(TeamEntity);
    const toolRepo = this.dataSource.getRepository(ToolsEntity);
    const workflowRepo = this.dataSource.getRepository(WorkflowMetadataEntity);

    const now = new Date();
    const { start: monthStart, end: nextMonthStart } = getMonthRange(now);
    const { start: prevMonthStart, end: prevMonthEnd } = getPreviousMonthRange(now);

    const [
      usersTotal,
      teamsTotal,
      toolsTotal,
      usersMonthNew,
      teamsMonthNew,
      toolsMonthNew,
      usersPrevMonthNew,
      teamsPrevMonthNew,
      toolsPrevMonthNew,
    ] = await Promise.all([
      userRepo.count({ where: { isDeleted: false } }),
      teamRepo.count({ where: { isDeleted: false } }),
      toolRepo.count({ where: { isDeleted: false } }),
      countByCreatedRange(userRepo, monthStart, nextMonthStart),
      countByCreatedRange(teamRepo, monthStart, nextMonthStart),
      countByCreatedRange(toolRepo, monthStart, nextMonthStart),
      countByCreatedRange(userRepo, prevMonthStart, prevMonthEnd),
      countByCreatedRange(teamRepo, prevMonthStart, prevMonthEnd),
      countByCreatedRange(toolRepo, prevMonthStart, prevMonthEnd),
    ]);

    const workflowsTotalRaw = await workflowRepo
      .createQueryBuilder('w')
      .select('COUNT(DISTINCT w.workflowId)', 'count')
      .where('w.isDeleted = :isDeleted', { isDeleted: false })
      .getRawOne<{ count: string }>();
    const workflowsTotal = Number(workflowsTotalRaw?.count || 0);

    // 工作流新增口径：version=1 视为新工作流创建
    const [workflowsMonthNewRaw, workflowsPrevMonthNewRaw] = await Promise.all([
      workflowRepo
        .createQueryBuilder('w')
        .select('COUNT(DISTINCT w.workflowId)', 'count')
        .where('w.isDeleted = :isDeleted', { isDeleted: false })
        .andWhere('w.version = :version', { version: 1 })
        .andWhere('w.createdTimestamp >= :start AND w.createdTimestamp < :end', {
          start: monthStart,
          end: nextMonthStart,
        })
        .getRawOne<{ count: string }>(),
      workflowRepo
        .createQueryBuilder('w')
        .select('COUNT(DISTINCT w.workflowId)', 'count')
        .where('w.isDeleted = :isDeleted', { isDeleted: false })
        .andWhere('w.version = :version', { version: 1 })
        .andWhere('w.createdTimestamp >= :start AND w.createdTimestamp < :end', {
          start: prevMonthStart,
          end: prevMonthEnd,
        })
        .getRawOne<{ count: string }>(),
    ]);
    const workflowsMonthNew = Number(workflowsMonthNewRaw?.count || 0);
    const workflowsPrevMonthNew = Number(workflowsPrevMonthNewRaw?.count || 0);

    return {
      users: buildMetric(usersTotal, usersMonthNew, usersPrevMonthNew),
      teams: buildMetric(teamsTotal, teamsMonthNew, teamsPrevMonthNew),
      tools: buildMetric(toolsTotal, toolsMonthNew, toolsPrevMonthNew),
      workflows: buildMetric(workflowsTotal, workflowsMonthNew, workflowsPrevMonthNew),
    };
  }
}

function getMonthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1, 0, 0, 0, 0);
  return { start, end };
}

function getPreviousMonthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth() - 1, 1, 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  return { start, end };
}

async function countByCreatedRange(
  repo: { createQueryBuilder: (alias: string) => any },
  start: Date,
  end: Date,
): Promise<number> {
  const qb = repo
    .createQueryBuilder('e')
    .where('e.isDeleted = :isDeleted', { isDeleted: false })
    .andWhere('e.createdTimestamp >= :start AND e.createdTimestamp < :end', {
      start,
      end,
    });
  return qb.getCount();
}

function buildMetric(total: number, monthNew: number, prevMonthNew: number): AdminDashboardMetricDto {
  const changePct = prevMonthNew === 0 ? null : ((monthNew - prevMonthNew) / prevMonthNew) * 100;
  const trend: AdminDashboardTrend =
    monthNew === prevMonthNew ? 'flat' : monthNew > prevMonthNew ? 'up' : 'down';
  return {
    total,
    monthNew,
    prevMonthNew,
    changePct: changePct === null ? null : round1(changePct),
    trend,
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
