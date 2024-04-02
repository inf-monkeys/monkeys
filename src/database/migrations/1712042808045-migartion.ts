import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';
const appId = config.server.appId;

export class Migartion1712042808045 implements MigrationInterface {
  name = 'Migartion1712042808045';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "${appId}_workflow_templates" ("id" character varying NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1712042808748', "updated_timestamp" bigint NOT NULL DEFAULT '1712042808748', "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying NOT NULL, "desc" character varying NOT NULL, "logo" character varying NOT NULL, "team_id" character varying NOT NULL, "workflow_id" character varying NOT NULL, "workflow_version" integer NOT NULL, "creator_user_id" character varying NOT NULL, "fetch_count" integer NOT NULL, "assets_policy" text NOT NULL, CONSTRAINT "PK_1149f44fe26677e4ebdeb19186d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_workflow_triggers" ("id" character varying NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1712042808748', "updated_timestamp" bigint NOT NULL DEFAULT '1712042808748', "is_deleted" boolean NOT NULL DEFAULT false, "workflow_id" character varying NOT NULL, "workflow_version" integer NOT NULL, "type" character varying NOT NULL, "enabled" boolean NOT NULL, "cron" character varying, "next_trigger_time" bigint, "last_trigger_time" bigint, "webhook_path" character varying, "workflow_config" text, CONSTRAINT "PK_717c843603f5c84221e03b8d40e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_workflow_pages" ("id" character varying NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1712042808748', "updated_timestamp" bigint NOT NULL DEFAULT '1712042808748', "is_deleted" boolean NOT NULL DEFAULT false, "display_name" character varying NOT NULL, "type" character varying NOT NULL, "workflow_id" character varying NOT NULL, "is_builtin" boolean NOT NULL, "team_id" character varying NOT NULL, "permissions" text NOT NULL, "sort_index" integer NOT NULL, "custom_options" text, "pinned" boolean DEFAULT false, CONSTRAINT "PK_ee0d18c0ba79ee99d47674ad9ff" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_workflow_metadatas" ("id" character varying NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1712042808748', "updated_timestamp" bigint NOT NULL DEFAULT '1712042808748', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying NOT NULL, "creator_user_id" character varying NOT NULL, "icon_url" character varying, "name" character varying NOT NULL, "description" character varying, "is_preset" boolean NOT NULL DEFAULT false, "is_published" boolean NOT NULL DEFAULT false, "publish_config" text, "workflow_id" character varying NOT NULL, "version" integer NOT NULL, "activated" boolean NOT NULL DEFAULT true, "validated" boolean NOT NULL DEFAULT true, "tasks" text, "variables" text, "output" text, "fork_from_id" character varying, "validation_issues" text, "md5" character varying, "hidden" boolean DEFAULT false, CONSTRAINT "PK_4bbe0e64bdfdcbe63f69196fc3d" PRIMARY KEY ("id")); COMMENT ON COLUMN "${appId}_workflow_metadatas"."is_published" IS '此资产是否被发布'; COMMENT ON COLUMN "${appId}_workflow_metadatas"."tasks" IS 'conductor workflow json 定义'; COMMENT ON COLUMN "${appId}_workflow_metadatas"."variables" IS 'workflow 变量'; COMMENT ON COLUMN "${appId}_workflow_metadatas"."output" IS 'workflow output 配置'; COMMENT ON COLUMN "${appId}_workflow_metadatas"."fork_from_id" IS 'fork from'; COMMENT ON COLUMN "${appId}_workflow_metadatas"."validation_issues" IS '工作流校验错误/警告'`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_workflow_chat_sessions" ("id" character varying NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1712042808748', "updated_timestamp" bigint NOT NULL DEFAULT '1712042808748', "is_deleted" boolean NOT NULL DEFAULT false, "display_name" character varying NOT NULL, "team_id" character varying NOT NULL, "creator_user_id" character varying NOT NULL, "workflow_id" character varying NOT NULL, CONSTRAINT "PK_1ebf5b251a9d2cf2f8ab3a425b2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_tools" ("id" character varying NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1712042808748', "updated_timestamp" bigint NOT NULL DEFAULT '1712042808748', "is_deleted" boolean NOT NULL DEFAULT false, "creator_user_id" character varying, "teamId" character varying, "public" boolean, "type" character varying NOT NULL DEFAULT 'SIMPLE', "namespace" character varying NOT NULL, "name" character varying NOT NULL, "credentials" text, "display_name" character varying NOT NULL, "description" character varying, "categories" text, "icon" character varying, "input" text, "output" text, "rules" text, "extra" text, CONSTRAINT "PK_c996fec128da39e37e498bc42dd" PRIMARY KEY ("id")); COMMENT ON COLUMN "${appId}_tools"."input" IS '表单配置'; COMMENT ON COLUMN "${appId}_tools"."output" IS '输出数据'`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_tools_server" ("id" character varying NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1712042808748', "updated_timestamp" bigint NOT NULL DEFAULT '1712042808748', "is_deleted" boolean NOT NULL DEFAULT false, "display_name" character varying NOT NULL, "base_url" character varying NOT NULL, "manifest_url" character varying NOT NULL DEFAULT 'v1', "schema_version" character varying NOT NULL DEFAULT 'v1', "namespace" character varying NOT NULL, "auth" text NOT NULL, "api" text NOT NULL, CONSTRAINT "UQ_2af7eb2b4264d7f7966d3f68dcf" UNIQUE ("namespace"), CONSTRAINT "PK_c5ed9d58e7f8ed0a62068bfee85" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_tools_credentials" ("id" character varying NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1712042808748', "updated_timestamp" bigint NOT NULL DEFAULT '1712042808748', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying NOT NULL, "display_name" character varying NOT NULL, "creator_user_id" character varying NOT NULL, "type" character varying NOT NULL, "data" text NOT NULL, CONSTRAINT "PK_366ae15878cb86a74cbb7fd3119" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_tools_credential_types" ("id" character varying NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1712042808748', "updated_timestamp" bigint NOT NULL DEFAULT '1712042808748', "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying NOT NULL, "namespace" character varying NOT NULL, "display_name" character varying NOT NULL, "type" character varying NOT NULL, "description" character varying, "icon" character varying, "properties" text NOT NULL, CONSTRAINT "PK_e165a9aa297c58e87ae8e3ce94c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_workflow_execution" ("id" character varying NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1712042808748', "updated_timestamp" bigint NOT NULL DEFAULT '1712042808748', "is_deleted" boolean NOT NULL DEFAULT false, "workflow_id" character varying NOT NULL, "workflow_version" integer NOT NULL, "workflow_instance_id" character varying NOT NULL, "user_id" character varying NOT NULL, "trigger_type" character varying NOT NULL, "chat_session_id" character varying, CONSTRAINT "PK_b9ee5afc39d253869e4afe6a9c0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_system_configurations" ("id" character varying NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1712042808748', "updated_timestamp" bigint NOT NULL DEFAULT '1712042808748', "is_deleted" boolean NOT NULL DEFAULT false, "key" character varying NOT NULL, "value" character varying NOT NULL, CONSTRAINT "PK_825b135468a74d934d825991253" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_user_team_relationships" ("id" character varying NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1712042808748', "updated_timestamp" bigint NOT NULL DEFAULT '1712042808748', "is_deleted" boolean NOT NULL DEFAULT false, "user_id" character varying NOT NULL, "team_id" character varying NOT NULL, CONSTRAINT "PK_3dc794d4c55ade1d79d958ab057" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_teams" ("id" character varying NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1712042808748', "updated_timestamp" bigint NOT NULL DEFAULT '1712042808748', "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying NOT NULL, "description" character varying, "icon_url" character varying, "logo_url" character varying, "owner_user_id" character varying NOT NULL, "is_builtin" boolean NOT NULL DEFAULT false, "is_public" boolean NOT NULL DEFAULT false, "workflow_task_name_prefix" character varying, "custom_theme" text, CONSTRAINT "PK_b86e657d897dc6756856a9d084b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_users" ("id" character varying NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1712042808748', "updated_timestamp" bigint NOT NULL DEFAULT '1712042808748', "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying, "photo" character varying NOT NULL, "nickname" character varying, "phone" character varying, "email" character varying, "password" character varying, "last_login_at" bigint, "logins_count" integer, "verified" boolean, "is_blocked" boolean, "external_id" character varying, "last_auth_method" character varying, CONSTRAINT "PK_bdd78ef04a4ddbdc0ec8d20c46e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_e7831ec9625bee9d555b5a75c8" ON "${appId}_users" ("external_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_1927ab12c4ad3d345b922de232" ON "${appId}_users" ("email") `);
    await queryRunner.query(`CREATE INDEX "IDX_be7443c72d752c340b1238d7d6" ON "${appId}_users" ("phone") `);
    await queryRunner.query(
      `CREATE TABLE "${appId}_themes" ("id" character varying NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1712042808748', "updated_timestamp" bigint NOT NULL DEFAULT '1712042808748', "is_deleted" boolean NOT NULL DEFAULT false, "teamId" character varying, "name" character varying NOT NULL, "primaryColor" character varying, "backgroundColor" character varying, "secondaryBackgroundColor" character varying, "isPublic" boolean, CONSTRAINT "PK_26cf029905b48f079d843ba09f3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_asset_tags" ("id" character varying NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1712042808748', "updated_timestamp" bigint NOT NULL DEFAULT '1712042808748', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_578fddc741ed6b48705fb799a75" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_asset_authorization" ("id" character varying NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1712042808748', "updated_timestamp" bigint NOT NULL DEFAULT '1712042808748', "is_deleted" boolean NOT NULL DEFAULT false, "asset_type" character varying NOT NULL, "asset_id" character varying NOT NULL, "target_type" character varying NOT NULL, "target_id" character varying NOT NULL, CONSTRAINT "PK_e179fa075a6d5a0fd2915e11a4d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_asset_filters" ("id" character varying NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1712042808748', "updated_timestamp" bigint NOT NULL DEFAULT '1712042808748', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying NOT NULL, "name" character varying NOT NULL, "creator_user_id" character varying, "asset_type" character varying, "rules" text, CONSTRAINT "PK_d00be88d13dbef304b16bbcdc4f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_apikey" ("id" character varying NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1712042808748', "updated_timestamp" bigint NOT NULL DEFAULT '1712042808748', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying NOT NULL, "creator_user_id" character varying NOT NULL, "api_key" character varying NOT NULL, "status" character varying NOT NULL, "desc" character varying, "applicationId" character varying, "isPrivate" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_a8463b4a9b7bece4796ba38b3b7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_media_files" ("id" character varying NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1712042808748', "updated_timestamp" bigint NOT NULL DEFAULT '1712042808748', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying NOT NULL, "creator_user_id" character varying NOT NULL, "icon_url" character varying, "name" character varying NOT NULL, "description" character varying, "is_preset" boolean NOT NULL DEFAULT false, "is_published" boolean NOT NULL DEFAULT false, "publish_config" text, "type" character varying NOT NULL, "url" character varying NOT NULL, "source" character varying NOT NULL, "size" integer NOT NULL, "params" text, "md5" character varying, CONSTRAINT "PK_730f62312a1871910ab3577ff01" PRIMARY KEY ("id")); COMMENT ON COLUMN "${appId}_media_files"."is_published" IS '此资产是否被发布'`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_canvas_applications" ("id" character varying NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1712042808748', "updated_timestamp" bigint NOT NULL DEFAULT '1712042808748', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying NOT NULL, "creator_user_id" character varying NOT NULL, "icon_url" character varying, "name" character varying NOT NULL, "description" character varying, "is_preset" boolean NOT NULL DEFAULT false, "is_published" boolean NOT NULL DEFAULT false, "publish_config" text, "app_name" character varying NOT NULL, CONSTRAINT "PK_5b0740cab966419a109d9e03835" PRIMARY KEY ("id")); COMMENT ON COLUMN "${appId}_canvas_applications"."is_published" IS '此资产是否被发布'`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_sd_models" ("id" character varying NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1712042808748', "updated_timestamp" bigint NOT NULL DEFAULT '1712042808748', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying NOT NULL, "creator_user_id" character varying NOT NULL, "icon_url" character varying, "name" character varying NOT NULL, "description" character varying, "is_preset" boolean NOT NULL DEFAULT false, "is_published" boolean NOT NULL DEFAULT false, "publish_config" text, "status" character varying NOT NULL, "progress" integer, "md5" character varying NOT NULL, "model_id" character varying NOT NULL, "keywords" character varying NOT NULL, "images" text NOT NULL, "params" text NOT NULL, "type" character varying, "base_model" character varying NOT NULL, "model_format" character varying, "disable_text_to_image" boolean, "disable_image_to_image" boolean, "disable_fine_tune" boolean, "output_models" text, "output_samples" text, "output_logs" text, "output_xyz_test" text, "version" character varying, "civitai_url" character varying, "tags" text, CONSTRAINT "PK_80356bab797c7c1175c1ad2e400" PRIMARY KEY ("id")); COMMENT ON COLUMN "${appId}_sd_models"."is_published" IS '此资产是否被发布'`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_text_collections" ("id" character varying NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1712042808748', "updated_timestamp" bigint NOT NULL DEFAULT '1712042808748', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying NOT NULL, "creator_user_id" character varying NOT NULL, "icon_url" character varying, "name" character varying NOT NULL, "description" character varying, "is_preset" boolean NOT NULL DEFAULT false, "is_published" boolean NOT NULL DEFAULT false, "publish_config" text, "display_name" character varying NOT NULL, "embedding_model" character varying NOT NULL, "index_type" character varying NOT NULL, "index_param" text NOT NULL, "dimension" integer NOT NULL, "metadata_fields" text NOT NULL, CONSTRAINT "PK_066111d8646e07c2274af86651b" PRIMARY KEY ("id")); COMMENT ON COLUMN "${appId}_text_collections"."is_published" IS '此资产是否被发布'`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_llm_models" ("id" character varying NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1712042808748', "updated_timestamp" bigint NOT NULL DEFAULT '1712042808748', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying NOT NULL, "creator_user_id" character varying NOT NULL, "icon_url" character varying, "name" character varying NOT NULL, "description" character varying, "is_preset" boolean NOT NULL DEFAULT false, "is_published" boolean NOT NULL DEFAULT false, "publish_config" text, "base_model" character varying NOT NULL, "lora_model" character varying, "llm_type" character varying NOT NULL, "quantization" character varying, "prompt_template" character varying, "gpu_memory_limit" integer, "context_max_length" integer, "stop" character varying, CONSTRAINT "PK_e435ffbff86774d355a35651c31" PRIMARY KEY ("id")); COMMENT ON COLUMN "${appId}_llm_models"."is_published" IS '此资产是否被发布'`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_table_collections" ("id" character varying NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1712042808748', "updated_timestamp" bigint NOT NULL DEFAULT '1712042808748', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying NOT NULL, "creator_user_id" character varying NOT NULL, "icon_url" character varying, "name" character varying NOT NULL, "description" character varying, "is_preset" boolean NOT NULL DEFAULT false, "is_published" boolean NOT NULL DEFAULT false, "publish_config" text, "type" character varying NOT NULL DEFAULT 'sqlite3', CONSTRAINT "PK_a8b481d57f3e3f4acc925a1cc02" PRIMARY KEY ("id")); COMMENT ON COLUMN "${appId}_table_collections"."is_published" IS '此资产是否被发布'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "${appId}_table_collections"`);
    await queryRunner.query(`DROP TABLE "${appId}_llm_models"`);
    await queryRunner.query(`DROP TABLE "${appId}_text_collections"`);
    await queryRunner.query(`DROP TABLE "${appId}_sd_models"`);
    await queryRunner.query(`DROP TABLE "${appId}_canvas_applications"`);
    await queryRunner.query(`DROP TABLE "${appId}_media_files"`);
    await queryRunner.query(`DROP TABLE "${appId}_apikey"`);
    await queryRunner.query(`DROP TABLE "${appId}_asset_filters"`);
    await queryRunner.query(`DROP TABLE "${appId}_asset_authorization"`);
    await queryRunner.query(`DROP TABLE "${appId}_asset_tags"`);
    await queryRunner.query(`DROP TABLE "${appId}_themes"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_be7443c72d752c340b1238d7d6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1927ab12c4ad3d345b922de232"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e7831ec9625bee9d555b5a75c8"`);
    await queryRunner.query(`DROP TABLE "${appId}_users"`);
    await queryRunner.query(`DROP TABLE "${appId}_teams"`);
    await queryRunner.query(`DROP TABLE "${appId}_user_team_relationships"`);
    await queryRunner.query(`DROP TABLE "${appId}_system_configurations"`);
    await queryRunner.query(`DROP TABLE "${appId}_workflow_execution"`);
    await queryRunner.query(`DROP TABLE "${appId}_tools_credential_types"`);
    await queryRunner.query(`DROP TABLE "${appId}_tools_credentials"`);
    await queryRunner.query(`DROP TABLE "${appId}_tools_server"`);
    await queryRunner.query(`DROP TABLE "${appId}_tools"`);
    await queryRunner.query(`DROP TABLE "${appId}_workflow_chat_sessions"`);
    await queryRunner.query(`DROP TABLE "${appId}_workflow_metadatas"`);
    await queryRunner.query(`DROP TABLE "${appId}_workflow_pages"`);
    await queryRunner.query(`DROP TABLE "${appId}_workflow_triggers"`);
    await queryRunner.query(`DROP TABLE "${appId}_workflow_templates"`);
  }
}
