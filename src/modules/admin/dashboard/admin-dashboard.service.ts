import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserEntity } from '@/database/entities/identity/user';
import { TeamEntity } from '@/database/entities/identity/team';
import { ToolsEntity } from '@/database/entities/tools/tools.entity';
import { WorkflowMetadataEntity } from '@/database/entities/workflow/workflow-metadata';
import { AdminDashboardStatsDto } from './dto/admin-dashboard.dto';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly dataSource: DataSource) {}

  async getStats(): Promise<AdminDashboardStatsDto> {
    const userRepo = this.dataSource.getRepository(UserEntity);
    const teamRepo = this.dataSource.getRepository(TeamEntity);
    const toolRepo = this.dataSource.getRepository(ToolsEntity);
    const workflowRepo = this.dataSource.getRepository(WorkflowMetadataEntity);

    const [users, teams, tools] = await Promise.all([
      userRepo.count({ where: { isDeleted: false } }),
      teamRepo.count({ where: { isDeleted: false } }),
      toolRepo.count({ where: { isDeleted: false } }),
    ]);

    const raw = await workflowRepo
      .createQueryBuilder('w')
      .select('COUNT(DISTINCT w.workflowId)', 'count')
      .where('w.isDeleted = :isDeleted', { isDeleted: false })
      .getRawOne<{ count: string }>();

    const workflows = Number(raw?.count || 0);

    return { users, teams, tools, workflows };
  }
}

