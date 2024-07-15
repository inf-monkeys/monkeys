import { MigrationInterface, QueryRunner } from 'typeorm';
import { config } from '@/common/config';
import { generateDbId } from '@/common/utils';

const appId = config.server.appId;

export class MigartionAddDefaultGroupForAllBuiltInPages1720748707927 implements MigrationInterface {
  TEAMS_TABLE_NAME = `${appId}_teams`;
  GROUP_TABLE_NAME = `${appId}_workflow_page_group`;
  PAGE_TABLE_NAME = `${appId}_workflow_pages`;

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 获取所有 isDelete 为 false 的 team
    const teamIds = (await queryRunner.query(`SELECT DISTINCT id FROM ${this.TEAMS_TABLE_NAME}`)).map((it: { id: string }) => it.id);

    const needToCreateGroupTeamIds: string[] = [];
    // 检查 GROUP_TABLE_NAME 表中是否存在 teamId 为上面的 id 且 is_builtin 为 true 的数据
    for (const teamId of teamIds) {
      const result = await queryRunner.query(
        `
        SELECT EXISTS (
          SELECT 1
          FROM ${this.GROUP_TABLE_NAME}
          WHERE team_id = $1 AND is_builtin = true
        ) AS exists
      `,
        [teamId],
      );

      if (result[0].exists) {
        console.log(`[Y] Team ID ${teamId} has is_builtin = true in ${this.GROUP_TABLE_NAME}`);
      } else {
        console.log(`[F] Team ID ${teamId} does not have is_builtin = true in ${this.GROUP_TABLE_NAME}`);
        needToCreateGroupTeamIds.push(teamId);
      }
    }

    if (needToCreateGroupTeamIds.length) {
      // 获取 PAGE_TABLE_NAME 表中所有团队的 is_builtin 为 true 的数据
      const builtinPages = await queryRunner.query(`SELECT id, team_id FROM ${this.PAGE_TABLE_NAME} WHERE pinned = true`);
      // 转换为：{ teamId: [pageId1, pageId2, ...] }
      const builtinPagesMap: Record<string, string[]> = {};

      for (const { team_id: pageTeamId, id: pageId } of builtinPages) {
        if (needToCreateGroupTeamIds.includes(pageTeamId)) {
          if (!builtinPagesMap[pageTeamId]) {
            builtinPagesMap[pageTeamId] = [];
          }
          builtinPagesMap[pageTeamId].push(pageId);
        }
      }
      console.log(`[D] Found ${builtinPages.length} builtin pages for ${needToCreateGroupTeamIds.length} teams`, builtinPagesMap);

      for (const [targetTeamId, pageIds] of Object.entries(builtinPagesMap)) {
        // 创建新的 group
        const newGroupId = generateDbId();
        const createdTimestamp = Date.now();
        const updatedTimestamp = Date.now();

        await queryRunner.query(
          `
          INSERT INTO ${this.GROUP_TABLE_NAME} (
            id, team_id, display_name, is_builtin, page_ids, created_timestamp, updated_timestamp, is_deleted
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8
          )
        `,
          [newGroupId, targetTeamId, '默认分组', true, JSON.stringify(pageIds), createdTimestamp, updatedTimestamp, false],
        );

        console.log(`Inserted new group with ID ${newGroupId} for team ID ${targetTeamId}`);
      }
    }

    // const groupTable = await queryRunner.getTable(this.GROUP_TABLE_NAME);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
