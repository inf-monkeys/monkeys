import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

/**
 * 修复根视图的 path 字段
 * 根视图（parentId 为 null）的 path 应该是 /<viewId>/ 而不是 /
 */
export class FixRootViewPaths1766700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 查询所有 parentId 为 null 且 path 为 '/' 的根视图
    const rootViews = await queryRunner.query(
      `SELECT id FROM ${appId}_data_views WHERE parent_id IS NULL AND path = '/' AND is_deleted = false`
    );

    console.log(`[Migration] Found ${rootViews.length} root views with incorrect path`);

    // 为每个根视图更新 path 为 /<id>/
    for (const view of rootViews) {
      const newPath = `/${view.id}/`;
      console.log(`[Migration] Updating view ${view.id}: path '/' -> '${newPath}'`);

      await queryRunner.query(
        `UPDATE ${appId}_data_views SET path = $1, updated_timestamp = $2 WHERE id = $3`,
        [newPath, Date.now(), view.id]
      );
    }

    console.log('[Migration] Root view paths fixed successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 回滚：将所有 parentId 为 null 的视图的 path 改回 '/'
    await queryRunner.query(
      `UPDATE ${appId}_data_views SET path = '/', updated_timestamp = $1 WHERE parent_id IS NULL AND is_deleted = false`,
      [Date.now()]
    );

    console.log('[Migration] Root view paths reverted to /');
  }
}
