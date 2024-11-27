import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;
export class Migartion1714373691606 implements MigrationInterface {
  name = 'Migartion1714373691606';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "${appId}_workflow_triggers" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1714373691844', "updated_timestamp" bigint NOT NULL DEFAULT '1714373691844', "is_deleted" boolean NOT NULL DEFAULT false, "workflow_id" character varying NOT NULL, "workflow_version" integer NOT NULL, "type" character varying NOT NULL, "enabled" boolean NOT NULL, "cron" character varying, "next_trigger_time" bigint, "last_trigger_time" bigint, "webhook_path" character varying, "workflow_config" text, "extra_data" text, CONSTRAINT "pk_${appId}_workflow_triggers" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_workflow_execution" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1714373691844', "updated_timestamp" bigint NOT NULL DEFAULT '1714373691844', "is_deleted" boolean NOT NULL DEFAULT false, "workflow_id" character varying NOT NULL, "workflow_version" integer NOT NULL, "workflow_instance_id" character varying NOT NULL, "user_id" character varying NOT NULL, "trigger_type" character varying NOT NULL, "chat_session_id" character varying, "group" character varying, CONSTRAINT "pk_${appId}_workflow_execution" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_workflow_metadatas" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1714373691844', "updated_timestamp" bigint NOT NULL DEFAULT '1714373691844', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying, "creator_user_id" character varying, "icon_url" character varying, "display_name" character varying NOT NULL, "description" character varying, "is_preset" boolean NOT NULL DEFAULT false, "is_published" boolean NOT NULL DEFAULT false, "publish_config" text, "workflow_id" character varying NOT NULL, "version" integer NOT NULL, "activated" boolean NOT NULL DEFAULT true, "validated" boolean NOT NULL DEFAULT true, "tasks" text, "variables" text, "output" text, "fork_from_id" character varying, "validation_issues" text, "md5" character varying, "hidden" boolean DEFAULT false, "rate_limiter" text, "expose_openai_compatible_interface" boolean NOT NULL DEFAULT false, "not_authorized" boolean DEFAULT false, "shortcuts_flow" text DEFAULT NULL, CONSTRAINT "pk_${appId}_workflow_metadatas" PRIMARY KEY ("id")); COMMENT ON COLUMN "${appId}_workflow_metadatas"."is_published" IS '此资产是否被发布'; COMMENT ON COLUMN "${appId}_workflow_metadatas"."tasks" IS 'conductor workflow json 定义'; COMMENT ON COLUMN "${appId}_workflow_metadatas"."variables" IS 'workflow 变量'; COMMENT ON COLUMN "${appId}_workflow_metadatas"."output" IS 'workflow output 配置'; COMMENT ON COLUMN "${appId}_workflow_metadatas"."fork_from_id" IS 'fork from'; COMMENT ON COLUMN "${appId}_workflow_metadatas"."validation_issues" IS '工作流校验错误/警告'`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_workflow_chat_sessions" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1714373691844', "updated_timestamp" bigint NOT NULL DEFAULT '1714373691844', "is_deleted" boolean NOT NULL DEFAULT false, "display_name" character varying NOT NULL, "team_id" character varying NOT NULL, "creator_user_id" character varying NOT NULL, "workflow_id" character varying NOT NULL, "messages" text, CONSTRAINT "pk_${appId}_workflow_chat_sessions" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_tools" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1714373691844', "updated_timestamp" bigint NOT NULL DEFAULT '1714373691844', "is_deleted" boolean NOT NULL DEFAULT false, "creator_user_id" character varying, "teamId" character varying, "public" boolean, "type" character varying NOT NULL DEFAULT 'SIMPLE', "namespace" character varying NOT NULL, "name" character varying NOT NULL, "credentials" text, "display_name" character varying NOT NULL, "description" character varying, "categories" text, "icon" character varying, "input" text, "output" text, "rules" text, "extra" text, CONSTRAINT "pk_${appId}_tools" PRIMARY KEY ("id")); COMMENT ON COLUMN "${appId}_tools"."input" IS '表单配置'; COMMENT ON COLUMN "${appId}_tools"."output" IS '输出数据'`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_workflow_pages" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1714373691844', "updated_timestamp" bigint NOT NULL DEFAULT '1714373691844', "is_deleted" boolean NOT NULL DEFAULT false, "display_name" character varying NOT NULL, "type" character varying NOT NULL, "workflow_id" character varying NOT NULL, "is_builtin" boolean NOT NULL, "team_id" character varying NOT NULL, "permissions" text NOT NULL, "sort_index" integer NOT NULL, "custom_options" text, "pinned" boolean DEFAULT false, CONSTRAINT "pk_${appId}_workflow_pages" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_workflow_templates" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1714373691844', "updated_timestamp" bigint NOT NULL DEFAULT '1714373691844', "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying NOT NULL, "desc" character varying NOT NULL, "logo" character varying NOT NULL, "team_id" character varying NOT NULL, "workflow_id" character varying NOT NULL, "workflow_version" integer NOT NULL, "creator_user_id" character varying NOT NULL, "fetch_count" integer NOT NULL, "assets_policy" text NOT NULL, CONSTRAINT "pk_${appId}_workflow_templates" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_tools_trigger_types" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1714373691844', "updated_timestamp" bigint NOT NULL DEFAULT '1714373691844', "is_deleted" boolean NOT NULL DEFAULT false, "type" character varying NOT NULL, "namespace" character varying NOT NULL, "display_name" character varying NOT NULL, "description" character varying, "icon" character varying, "properties" text, "workflow_inputs" text, CONSTRAINT "pk_${appId}_tools_trigger_types" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_${appId}_tools_trigger_types_type" ON "${appId}_tools_trigger_types" ("type") `);
    await queryRunner.query(
      `CREATE TABLE "${appId}_tools_server" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1714373691844', "updated_timestamp" bigint NOT NULL DEFAULT '1714373691844', "is_deleted" boolean NOT NULL DEFAULT false, "display_name" character varying NOT NULL, "base_url" character varying NOT NULL, "manifest_url" character varying NOT NULL DEFAULT 'v1', "schema_version" character varying NOT NULL DEFAULT 'v1', "namespace" character varying NOT NULL, "auth" text NOT NULL, "api" text NOT NULL, "trigger_endpoints" text, "credential_endpoints" text, "rate_limiter" text, "health_check" character varying, "health_check_status" character varying, CONSTRAINT "uq_${appId}_tools_server" UNIQUE ("namespace"), CONSTRAINT "pk_${appId}_tools_server" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_tools_credential_types" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1714373691844', "updated_timestamp" bigint NOT NULL DEFAULT '1714373691844', "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying NOT NULL, "namespace" character varying NOT NULL, "display_name" character varying NOT NULL, "type" character varying NOT NULL, "description" character varying, "icon_url" character varying, "properties" text NOT NULL, CONSTRAINT "pk_${appId}_tools_credential_types" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_tools_credentials" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1714373691844', "updated_timestamp" bigint NOT NULL DEFAULT '1714373691844', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying NOT NULL, "display_name" character varying NOT NULL, "creator_user_id" character varying NOT NULL, "type" character varying NOT NULL, CONSTRAINT "pk_${appId}_tools_credentials" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_system_configurations" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1714373691844', "updated_timestamp" bigint NOT NULL DEFAULT '1714373691844', "is_deleted" boolean NOT NULL DEFAULT false, "key" character varying NOT NULL, "value" character varying NOT NULL, CONSTRAINT "pk_${appId}_system_configurations" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_users" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1714373691844', "updated_timestamp" bigint NOT NULL DEFAULT '1714373691844', "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying, "photo" character varying NOT NULL, "nickname" character varying, "phone" character varying, "email" character varying, "password" character varying, "last_login_at" bigint, "logins_count" integer, "verified" boolean, "is_blocked" boolean, "external_id" character varying, "last_auth_method" character varying, CONSTRAINT "pk_${appId}_users" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_${appId}_users_external_id" ON "${appId}_users" ("external_id") `);
    await queryRunner.query(`CREATE INDEX "idx_${appId}_users_email" ON "${appId}_users" ("email") `);
    await queryRunner.query(`CREATE INDEX "idx_${appId}_users_phone" ON "${appId}_users" ("phone") `);
    await queryRunner.query(
      `CREATE TABLE "${appId}_team_members" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1714373691844', "updated_timestamp" bigint NOT NULL DEFAULT '1714373691844', "is_deleted" boolean NOT NULL DEFAULT false, "user_id" character varying NOT NULL, "team_id" character varying NOT NULL, CONSTRAINT "pk_${appId}_team_members" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_teams" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1714373691844', "updated_timestamp" bigint NOT NULL DEFAULT '1714373691844', "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying NOT NULL, "description" character varying, "icon_url" character varying, "logo_url" character varying, "owner_user_id" character varying NOT NULL, "is_builtin" boolean NOT NULL DEFAULT false, "is_public" boolean NOT NULL DEFAULT false, "workflow_task_name_prefix" character varying, "custom_theme" text, "enable_join_request" boolean DEFAULT false, CONSTRAINT "pk_${appId}_teams" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_team_join_requests" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1714373691844', "updated_timestamp" bigint NOT NULL DEFAULT '1714373691844', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying NOT NULL, "user_id" character varying NOT NULL, "status" character varying NOT NULL, CONSTRAINT "pk_${appId}_team_join_requests" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_themes" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1714373691844', "updated_timestamp" bigint NOT NULL DEFAULT '1714373691844', "is_deleted" boolean NOT NULL DEFAULT false, "teamId" character varying, "name" character varying NOT NULL, "primaryColor" character varying, "backgroundColor" character varying, "secondaryBackgroundColor" character varying, "isPublic" boolean, CONSTRAINT "pk_${appId}_themes" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_asset_tags" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1714373691844', "updated_timestamp" bigint NOT NULL DEFAULT '1714373691844', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying NOT NULL, "name" character varying NOT NULL, "color" character varying, "_pinyin" character varying NOT NULL, CONSTRAINT "pk_${appId}_asset_tags" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_asset_marketplace_tags" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1714373691844', "updated_timestamp" bigint NOT NULL DEFAULT '1714373691844', "is_deleted" boolean NOT NULL DEFAULT false, "asset_type" character varying NOT NULL, "name" character varying NOT NULL, "color" character varying, "_pinyin" character varying NOT NULL, CONSTRAINT "pk_${appId}_asset_marketplace_tags" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_asset_marketplace_tag_relations" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1714373691844', "updated_timestamp" bigint NOT NULL DEFAULT '1714373691844', "is_deleted" boolean NOT NULL DEFAULT false, "tag_id" character varying NOT NULL, "asset_type" character varying NOT NULL, "asset_id" character varying NOT NULL, CONSTRAINT "pk_${appId}_asset_marketplace_tag_relations" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_asset_filters" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1714373691844', "updated_timestamp" bigint NOT NULL DEFAULT '1714373691844', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying NOT NULL, "name" character varying NOT NULL, "creator_user_id" character varying, "asset_type" character varying, "rules" text, CONSTRAINT "pk_${appId}_asset_filters" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_asset_tag_relations" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1714373691844', "updated_timestamp" bigint NOT NULL DEFAULT '1714373691844', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying NOT NULL, "tag_id" character varying NOT NULL, "asset_type" character varying NOT NULL, "asset_id" character varying NOT NULL, CONSTRAINT "pk_${appId}_asset_tag_relations" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_assets_authorization" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1714373691844', "updated_timestamp" bigint NOT NULL DEFAULT '1714373691844', "is_deleted" boolean NOT NULL DEFAULT false, "asset_type" character varying NOT NULL, "asset_id" character varying NOT NULL, "target_type" character varying NOT NULL, "target_id" character varying NOT NULL, CONSTRAINT "pk_${appId}_assets_authorization" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_apikey" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1714373691844', "updated_timestamp" bigint NOT NULL DEFAULT '1714373691844', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying NOT NULL, "creator_user_id" character varying NOT NULL, "api_key" character varying NOT NULL, "status" character varying NOT NULL, "desc" character varying, "applicationId" character varying, "isPrivate" boolean NOT NULL DEFAULT false, CONSTRAINT "pk_${appId}_apikey" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_media_files" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1714373691844', "updated_timestamp" bigint NOT NULL DEFAULT '1714373691844', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying, "creator_user_id" character varying, "icon_url" character varying, "display_name" character varying NOT NULL, "description" character varying, "is_preset" boolean NOT NULL DEFAULT false, "is_published" boolean NOT NULL DEFAULT false, "publish_config" text, "type" character varying NOT NULL, "url" character varying NOT NULL, "source" character varying NOT NULL, "size" integer NOT NULL, "params" text, "md5" character varying, CONSTRAINT "pk_${appId}_media_files" PRIMARY KEY ("id")); COMMENT ON COLUMN "${appId}_media_files"."is_published" IS '此资产是否被发布'`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_knowledge_bases" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1714373691844', "updated_timestamp" bigint NOT NULL DEFAULT '1714373691844', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying, "creator_user_id" character varying, "icon_url" character varying, "display_name" character varying NOT NULL, "description" character varying, "is_preset" boolean NOT NULL DEFAULT false, "is_published" boolean NOT NULL DEFAULT false, "publish_config" text, "uuid" character varying NOT NULL, "embedding_model" character varying NOT NULL, "dimension" integer NOT NULL, "retrieval_settings" text, CONSTRAINT "pk_${appId}_knowledge_bases" PRIMARY KEY ("id")); COMMENT ON COLUMN "${appId}_knowledge_bases"."is_published" IS '此资产是否被发布'`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_knowledge_bases_sql" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1714373691844', "updated_timestamp" bigint NOT NULL DEFAULT '1714373691844', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying, "creator_user_id" character varying, "icon_url" character varying, "display_name" character varying NOT NULL, "description" character varying, "is_preset" boolean NOT NULL DEFAULT false, "is_published" boolean NOT NULL DEFAULT false, "publish_config" text, "uuid" character varying NOT NULL, CONSTRAINT "pk_${appId}_knowledge_bases_sql" PRIMARY KEY ("id")); COMMENT ON COLUMN "${appId}_knowledge_bases_sql"."is_published" IS '此资产是否被发布'`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_canvas_applications" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1714373691844', "updated_timestamp" bigint NOT NULL DEFAULT '1714373691844', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying, "creator_user_id" character varying, "icon_url" character varying, "display_name" character varying NOT NULL, "description" character varying, "is_preset" boolean NOT NULL DEFAULT false, "is_published" boolean NOT NULL DEFAULT false, "publish_config" text, "app_name" character varying NOT NULL, CONSTRAINT "pk_${appId}_canvas_applications" PRIMARY KEY ("id")); COMMENT ON COLUMN "${appId}_canvas_applications"."is_published" IS '此资产是否被发布'`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_sd_models" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1714373691844', "updated_timestamp" bigint NOT NULL DEFAULT '1714373691844', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying, "creator_user_id" character varying, "icon_url" character varying, "display_name" character varying NOT NULL, "description" character varying, "is_preset" boolean NOT NULL DEFAULT false, "is_published" boolean NOT NULL DEFAULT false, "publish_config" text, "status" character varying NOT NULL, "progress" integer, "md5" character varying NOT NULL, "model_id" character varying NOT NULL, "keywords" character varying NOT NULL, "images" text NOT NULL, "params" text NOT NULL, "type" character varying, "base_model" character varying NOT NULL, "model_format" character varying, "disable_text_to_image" boolean, "disable_image_to_image" boolean, "disable_fine_tune" boolean, "output_models" text, "output_samples" text, "output_logs" text, "output_xyz_test" text, "version" character varying, "civitai_url" character varying, "tags" text, CONSTRAINT "pk_${appId}_sd_models" PRIMARY KEY ("id")); COMMENT ON COLUMN "${appId}_sd_models"."is_published" IS '此资产是否被发布'`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_llm_models" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1714373691844', "updated_timestamp" bigint NOT NULL DEFAULT '1714373691844', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying, "creator_user_id" character varying, "icon_url" character varying, "display_name" character varying NOT NULL, "description" character varying, "is_preset" boolean NOT NULL DEFAULT false, "is_published" boolean NOT NULL DEFAULT false, "publish_config" text, "base_model" character varying NOT NULL, "lora_model" character varying, "llm_type" character varying NOT NULL, "quantization" character varying, "prompt_template" character varying, "gpu_memory_limit" integer, "context_max_length" integer, "stop" character varying, CONSTRAINT "pk_${appId}_llm_models" PRIMARY KEY ("id")); COMMENT ON COLUMN "${appId}_llm_models"."is_published" IS '此资产是否被发布'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "${appId}_llm_models"`);
    await queryRunner.query(`DROP TABLE "${appId}_sd_models"`);
    await queryRunner.query(`DROP TABLE "${appId}_canvas_applications"`);
    await queryRunner.query(`DROP TABLE "${appId}_knowledge_bases_sql"`);
    await queryRunner.query(`DROP TABLE "${appId}_knowledge_bases"`);
    await queryRunner.query(`DROP TABLE "${appId}_media_files"`);
    await queryRunner.query(`DROP TABLE "${appId}_apikey"`);
    await queryRunner.query(`DROP TABLE "${appId}_assets_authorization"`);
    await queryRunner.query(`DROP TABLE "${appId}_asset_tag_relations"`);
    await queryRunner.query(`DROP TABLE "${appId}_asset_filters"`);
    await queryRunner.query(`DROP TABLE "${appId}_asset_marketplace_tag_relations"`);
    await queryRunner.query(`DROP TABLE "${appId}_asset_marketplace_tags"`);
    await queryRunner.query(`DROP TABLE "${appId}_asset_tags"`);
    await queryRunner.query(`DROP TABLE "${appId}_themes"`);
    await queryRunner.query(`DROP TABLE "${appId}_team_join_requests"`);
    await queryRunner.query(`DROP TABLE "${appId}_teams"`);
    await queryRunner.query(`DROP TABLE "${appId}_team_members"`);
    await queryRunner.query(`DROP INDEX "public"."idx_${appId}_tools_trigger_types_type"`);
    await queryRunner.query(`DROP INDEX "public"."idx_${appId}_users_external_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_${appId}_users_phone"`);
    await queryRunner.query(`DROP TABLE "${appId}_users"`);
    await queryRunner.query(`DROP TABLE "${appId}_system_configurations"`);
    await queryRunner.query(`DROP TABLE "${appId}_tools_credentials"`);
    await queryRunner.query(`DROP TABLE "${appId}_tools_credential_types"`);
    await queryRunner.query(`DROP TABLE "${appId}_tools_server"`);
    await queryRunner.query(`DROP INDEX "public"."idx_${appId}_users_email"`);
    await queryRunner.query(`DROP TABLE "${appId}_tools_trigger_types"`);
    await queryRunner.query(`DROP TABLE "${appId}_workflow_templates"`);
    await queryRunner.query(`DROP TABLE "${appId}_workflow_pages"`);
    await queryRunner.query(`DROP TABLE "${appId}_tools"`);
    await queryRunner.query(`DROP TABLE "${appId}_workflow_chat_sessions"`);
    await queryRunner.query(`DROP TABLE "${appId}_workflow_metadatas"`);
    await queryRunner.query(`DROP TABLE "${appId}_workflow_execution"`);
    await queryRunner.query(`DROP TABLE "${appId}_workflow_triggers"`);
  }
}
