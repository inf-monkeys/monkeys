import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;

/**
 * 重新计算所有视图的 path 字段
 * 修复历史数据中 path 不正确的问题
 */
export class RecalculateAllViewPaths1766800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('[Migration] Starting to recalculate all view paths...');

    // 查询所有视图，按 level 排序（从根视图开始处理）
    const views = await queryRunner.query(
      `SELECT id, parent_id, path, level FROM ${appId}_data_views WHERE is_deleted = false ORDER BY level ASC, id ASC`
    );

    console.log(`[Migration] Found ${views.length} views to process`);

    // 创建一个 Map 来存储已处理视图的 path
    const processedPaths = new Map<string, string>();

    for (const view of views) {
      let newPath: string;

      if (view.parent_id === null) {
        // 根视图：path = /<id>/
        newPath = `/${view.id}/`;
      } else {
        // 子视图：path = <parent_path><id>/
        const parentPath = processedPaths.get(view.parent_id);

        if (!parentPath) {
          // 如果父视图还没处理，从数据库查询（理论上不应该发生，因为按 level 排序了）
          const parentResult = await queryRunner.query(
            `SELECT path FROM ${appId}_data_views WHERE id = $1 AND is_deleted = false`,
            [view.parent_id]
          );

          if (parentResult.length === 0) {
            console.log(`[Migration] Warning: Parent view ${view.parent_id} not found for view ${view.id}`);
            continue;
          }

          newPath = `${parentResult[0].path}${view.id}/`;
        } else {
          newPath = `${parentPath}${view.id}/`;
        }
      }

      // 存储到 Map 中
      processedPaths.set(view.id, newPath);

      // 如果 path 需要更新，则更新
      if (view.path !== newPath) {
        console.log(`[Migration] Updating view ${view.id}: '${view.path}' -> '${newPath}'`);

        await queryRunner.query(
          `UPDATE ${appId}_data_views SET path = $1, updated_timestamp = $2 WHERE id = $3`,
          [newPath, Date.now(), view.id]
        );
      }
    }

    console.log('[Migration] All view paths recalculated successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('[Migration] Rollback: This migration cannot be safely rolled back automatically');
    console.log('[Migration] Please restore from backup if needed');
  }
}
