import { ApiKeyEntity } from '@/database/entities/apikey/apikey';
import { BaseEntity } from '@/database/entities/base/base';
import { DesignAssociationEntity } from '@/database/entities/design/design-association';
import { DesignMetadataEntity } from '@/database/entities/design/design-metatdata';
import { DesignProjectEntity } from '@/database/entities/design/design-project';
import { EvaluationTaskEntity } from '@/database/entities/evaluation/evaluation-task.entity';
import { TeamEntity } from '@/database/entities/identity/team';
import { InstalledAppEntity } from '@/database/entities/marketplace/installed-app.entity';
import { MarketplaceAppEntity } from '@/database/entities/marketplace/marketplace-app.entity';
import { WorkflowObservabilityEntity } from '@/database/entities/observability/workflow-observability';
import { WorkflowMetadataEntity } from '@/database/entities/workflow/workflow-metadata';
import { TeamRepository } from '@/database/repositories/team.repository';
import { Injectable, Logger } from '@nestjs/common';
import { EntityManager, EntityTarget, FindOptionsWhere, In } from 'typeorm';
import { TeamsService } from '../auth/teams/teams.service';

const assetEntities = [ApiKeyEntity, WorkflowMetadataEntity, WorkflowObservabilityEntity, DesignProjectEntity, DesignMetadataEntity, DesignAssociationEntity, InstalledAppEntity, EvaluationTaskEntity];

@Injectable()
export class TenantManageService {
  private readonly logger = new Logger(TenantManageService.name);

  constructor(
    private readonly teamRepository: TeamRepository,
    private readonly teamsService: TeamsService,
    private readonly entityManager: EntityManager,
  ) {}

  async _delete(entity: EntityTarget<BaseEntity>, where: FindOptionsWhere<BaseEntity & { teamId?: string }>, transactionalEntityManager?: EntityManager, soft = true) {
    if (soft) {
      return transactionalEntityManager
        ? await transactionalEntityManager.update(entity, where, {
            isDeleted: true,
          })
        : this.entityManager.transaction(async (entityManager) => {
            return await entityManager.update(entity, where, {
              isDeleted: true,
            });
          });
    } else {
      return transactionalEntityManager
        ? await transactionalEntityManager.delete(entity, where)
        : this.entityManager.transaction(async (entityManager) => {
            return await entityManager.delete(entity, where);
          });
    }
  }

  async deleteAllTeamsExceptDefault(soft = true) {
    this.logger.log('Starting to delete all teams except default');
    return this.entityManager.transaction(async (transactionalEntityManager) => {
      // 先获取所有要删除的团队ID
      const teamsToDelete = await transactionalEntityManager.find(TeamEntity, {
        where: {
          isBuiltIn: false,
        },
        select: ['id'],
      });

      this.logger.log(`Found ${teamsToDelete.length} teams to delete`);

      const teamIds = teamsToDelete.map((team) => team.id);

      if (teamIds.length === 0) {
        return;
      }

      await transactionalEntityManager.update(
        MarketplaceAppEntity,
        {
          authorTeamId: In(teamIds),
        },
        {
          authorTeamId: 'system',
        },
      );

      for (const entity of assetEntities) {
        this.logger.debug(`Deleting ${entity.name} for teams ${teamIds.join(', ')}`);
        await this._delete(
          entity,
          {
            teamId: In(teamIds),
          },
          transactionalEntityManager,
          soft,
        );
      }

      await this._delete(
        TeamEntity,
        {
          id: In(teamIds),
        },
        transactionalEntityManager,
        soft,
      );

      this.logger.log('All teams deleted');
    });
  }

  async initAllTeams() {
    this.logger.log('Starting to init all teams');
    const teams = await this.teamRepository.getAllTeams();
    this.logger.log(`Found ${teams.length} teams to init`);
    for (const team of teams) {
      this.logger.debug(`Init team ${team.id}`);
      await this.teamsService.initTeam(team.id, team.ownerUserId);
    }
    this.logger.log('All teams initialized');
  }
}
