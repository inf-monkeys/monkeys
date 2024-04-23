import { config } from '@/common/config';
import { MigrationInterface, QueryRunner } from 'typeorm';

const appId = config.server.appId;
export class Migartion1713876453533 implements MigrationInterface {
  name = 'Migartion1713876453533';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "${appId}_workflow_pages" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1713876453723', "updated_timestamp" bigint NOT NULL DEFAULT '1713876453723', "is_deleted" boolean NOT NULL DEFAULT false, "display_name" character varying NOT NULL, "type" character varying NOT NULL, "workflow_id" character varying NOT NULL, "is_builtin" boolean NOT NULL, "team_id" character varying NOT NULL, "permissions" text NOT NULL, "sort_index" integer NOT NULL, "custom_options" text, "pinned" boolean DEFAULT false, CONSTRAINT "PK_239dc0a221acc598e08d09092b8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_workflow_triggers" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1713876453723', "updated_timestamp" bigint NOT NULL DEFAULT '1713876453723', "is_deleted" boolean NOT NULL DEFAULT false, "workflow_id" character varying NOT NULL, "workflow_version" integer NOT NULL, "type" character varying NOT NULL, "enabled" boolean NOT NULL, "cron" character varying, "next_trigger_time" bigint, "last_trigger_time" bigint, "webhook_path" character varying, "workflow_config" text, "extra_data" text, CONSTRAINT "PK_33a5f10c24106f9dcd8b7196312" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_workflow_templates" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1713876453723', "updated_timestamp" bigint NOT NULL DEFAULT '1713876453723', "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying NOT NULL, "desc" character varying NOT NULL, "logo" character varying NOT NULL, "team_id" character varying NOT NULL, "workflow_id" character varying NOT NULL, "workflow_version" integer NOT NULL, "creator_user_id" character varying NOT NULL, "fetch_count" integer NOT NULL, "assets_policy" text NOT NULL, CONSTRAINT "PK_70ffc7b788eddcc5eb0db903624" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_tools" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1713876453723', "updated_timestamp" bigint NOT NULL DEFAULT '1713876453723', "is_deleted" boolean NOT NULL DEFAULT false, "creator_user_id" character varying, "teamId" character varying, "public" boolean, "type" character varying NOT NULL DEFAULT 'SIMPLE', "namespace" character varying NOT NULL, "name" character varying NOT NULL, "credentials" text, "display_name" character varying NOT NULL, "description" character varying, "categories" text, "icon" character varying, "input" text, "output" text, "rules" text, "extra" text, CONSTRAINT "PK_e213798a14800aaf91f37a0de77" PRIMARY KEY ("id")); COMMENT ON COLUMN "${appId}_tools"."input" IS '表单配置'; COMMENT ON COLUMN "${appId}_tools"."output" IS '输出数据'`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_workflow_execution" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1713876453723', "updated_timestamp" bigint NOT NULL DEFAULT '1713876453723', "is_deleted" boolean NOT NULL DEFAULT false, "workflow_id" character varying NOT NULL, "workflow_version" integer NOT NULL, "workflow_instance_id" character varying NOT NULL, "user_id" character varying NOT NULL, "trigger_type" character varying NOT NULL, "chat_session_id" character varying, CONSTRAINT "PK_b9fdfc862479507543c11667091" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_workflow_chat_sessions" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1713876453723', "updated_timestamp" bigint NOT NULL DEFAULT '1713876453723', "is_deleted" boolean NOT NULL DEFAULT false, "display_name" character varying NOT NULL, "team_id" character varying NOT NULL, "creator_user_id" character varying NOT NULL, "workflow_id" character varying NOT NULL, "messages" text, CONSTRAINT "PK_ab35cf24a668c2fe63c83b168c9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_tools_credentials" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1713876453723', "updated_timestamp" bigint NOT NULL DEFAULT '1713876453723', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying NOT NULL, "display_name" character varying NOT NULL, "creator_user_id" character varying NOT NULL, "type" character varying NOT NULL, CONSTRAINT "PK_fee9c836a2c2fd99d83a89fb5d0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_workflow_metadatas" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1713876453723', "updated_timestamp" bigint NOT NULL DEFAULT '1713876453723', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying NOT NULL, "creator_user_id" character varying NOT NULL, "icon_url" character varying, "display_name" character varying NOT NULL, "description" character varying, "is_preset" boolean NOT NULL DEFAULT false, "is_published" boolean NOT NULL DEFAULT false, "publish_config" text, "workflow_id" character varying NOT NULL, "version" integer NOT NULL, "activated" boolean NOT NULL DEFAULT true, "validated" boolean NOT NULL DEFAULT true, "tasks" text, "variables" text, "output" text, "fork_from_id" character varying, "validation_issues" text, "md5" character varying, "hidden" boolean DEFAULT false, "rate_limiter" text, "expose_openai_compatible_interface" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_a8d67dfa3e181ca4e859ef18bc2" PRIMARY KEY ("id")); COMMENT ON COLUMN "${appId}_workflow_metadatas"."is_published" IS '此资产是否被发布'; COMMENT ON COLUMN "${appId}_workflow_metadatas"."tasks" IS 'conductor workflow json 定义'; COMMENT ON COLUMN "${appId}_workflow_metadatas"."variables" IS 'workflow 变量'; COMMENT ON COLUMN "${appId}_workflow_metadatas"."output" IS 'workflow output 配置'; COMMENT ON COLUMN "${appId}_workflow_metadatas"."fork_from_id" IS 'fork from'; COMMENT ON COLUMN "${appId}_workflow_metadatas"."validation_issues" IS '工作流校验错误/警告'`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_tools_credential_types" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1713876453723', "updated_timestamp" bigint NOT NULL DEFAULT '1713876453723', "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying NOT NULL, "namespace" character varying NOT NULL, "display_name" character varying NOT NULL, "type" character varying NOT NULL, "description" character varying, "icon_url" character varying, "properties" text NOT NULL, CONSTRAINT "PK_5ae8a3bbdce0947d5d9b0201fab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_tools_server" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1713876453723', "updated_timestamp" bigint NOT NULL DEFAULT '1713876453723', "is_deleted" boolean NOT NULL DEFAULT false, "display_name" character varying NOT NULL, "base_url" character varying NOT NULL, "manifest_url" character varying NOT NULL DEFAULT 'v1', "schema_version" character varying NOT NULL DEFAULT 'v1', "namespace" character varying NOT NULL, "auth" text NOT NULL, "api" text NOT NULL, "trigger_endpoints" text, "credential_endpoints" text, "rate_limiter" text, "health_check" character varying, "health_check_status" character varying, CONSTRAINT "UQ_139794920cee1798dd4b5ecb81c" UNIQUE ("namespace"), CONSTRAINT "PK_51d7dccfdba4e668311e68b1fca" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_system_configurations" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1713876453723', "updated_timestamp" bigint NOT NULL DEFAULT '1713876453723', "is_deleted" boolean NOT NULL DEFAULT false, "key" character varying NOT NULL, "value" character varying NOT NULL, CONSTRAINT "PK_5ad0c8d1c3a6ea761ec68559a56" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_team_members" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1713876453723', "updated_timestamp" bigint NOT NULL DEFAULT '1713876453723', "is_deleted" boolean NOT NULL DEFAULT false, "user_id" character varying NOT NULL, "team_id" character varying NOT NULL, CONSTRAINT "PK_d41e0a8f2c15afc2a6085bece88" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_tools_trigger_types" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1713876453723', "updated_timestamp" bigint NOT NULL DEFAULT '1713876453723', "is_deleted" boolean NOT NULL DEFAULT false, "type" character varying NOT NULL, "namespace" character varying NOT NULL, "display_name" character varying NOT NULL, "description" character varying, "icon" character varying, "properties" text, "workflow_inputs" text, CONSTRAINT "PK_888417569353b5515d39e247b49" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_1190c3ca75b80cbf995fd56663" ON "${appId}_tools_trigger_types" ("type") `);
    await queryRunner.query(
      `CREATE TABLE "${appId}_users" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1713876453723', "updated_timestamp" bigint NOT NULL DEFAULT '1713876453723', "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying, "photo" character varying NOT NULL, "nickname" character varying, "phone" character varying, "email" character varying, "password" character varying, "last_login_at" bigint, "logins_count" integer, "verified" boolean, "is_blocked" boolean, "external_id" character varying, "last_auth_method" character varying, CONSTRAINT "PK_ac683083b8ba6f47b2faf146fd9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_a5a4b20f862c733d9621703e2e" ON "${appId}_users" ("external_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_d13eb0899090f4bbc4b624c5a7" ON "${appId}_users" ("email") `);
    await queryRunner.query(`CREATE INDEX "IDX_f250bb56e1dde492ad5f592c21" ON "${appId}_users" ("phone") `);
    await queryRunner.query(
      `CREATE TABLE "${appId}_teams" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1713876453723', "updated_timestamp" bigint NOT NULL DEFAULT '1713876453723', "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying NOT NULL, "description" character varying, "icon_url" character varying, "logo_url" character varying, "owner_user_id" character varying NOT NULL, "is_builtin" boolean NOT NULL DEFAULT false, "is_public" boolean NOT NULL DEFAULT false, "workflow_task_name_prefix" character varying, "custom_theme" text, "enable_join_request" boolean DEFAULT false, CONSTRAINT "PK_f449534e335113d26f4b2fd8b27" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_team_join_requests" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1713876453723', "updated_timestamp" bigint NOT NULL DEFAULT '1713876453723', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying NOT NULL, "user_id" character varying NOT NULL, "status" character varying NOT NULL, CONSTRAINT "PK_3631a8b158b46ca0a1230718397" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_themes" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1713876453723', "updated_timestamp" bigint NOT NULL DEFAULT '1713876453723', "is_deleted" boolean NOT NULL DEFAULT false, "teamId" character varying, "name" character varying NOT NULL, "primaryColor" character varying, "backgroundColor" character varying, "secondaryBackgroundColor" character varying, "isPublic" boolean, CONSTRAINT "PK_3106b85af40f8e49dd52d1c018c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_asset_tags" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1713876453723', "updated_timestamp" bigint NOT NULL DEFAULT '1713876453723', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying NOT NULL, "name" character varying NOT NULL, "color" character varying, "_pinyin" character varying NOT NULL, CONSTRAINT "PK_11a55640e37c0ef0eb94be24bab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_asset_filters" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1713876453723', "updated_timestamp" bigint NOT NULL DEFAULT '1713876453723', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying NOT NULL, "name" character varying NOT NULL, "creator_user_id" character varying, "asset_type" character varying, "rules" text, CONSTRAINT "PK_9757b8a6cbc83538d879f58113c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_asset_tag_relations" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1713876453723', "updated_timestamp" bigint NOT NULL DEFAULT '1713876453723', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying NOT NULL, "tag_id" character varying NOT NULL, "asset_type" character varying NOT NULL, "asset_id" character varying NOT NULL, CONSTRAINT "PK_7038f93022253c7b6f10f50b19f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_apikey" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1713876453723', "updated_timestamp" bigint NOT NULL DEFAULT '1713876453723', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying NOT NULL, "creator_user_id" character varying NOT NULL, "api_key" character varying NOT NULL, "status" character varying NOT NULL, "desc" character varying, "applicationId" character varying, "isPrivate" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_4fe276ddb19ebe8153176df7a46" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_assets_authorization" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1713876453723', "updated_timestamp" bigint NOT NULL DEFAULT '1713876453723', "is_deleted" boolean NOT NULL DEFAULT false, "asset_type" character varying NOT NULL, "asset_id" character varying NOT NULL, "target_type" character varying NOT NULL, "target_id" character varying NOT NULL, CONSTRAINT "PK_1cb236059c3244b53115884c968" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_knowledge_bases_sql" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1713876453723', "updated_timestamp" bigint NOT NULL DEFAULT '1713876453723', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying NOT NULL, "creator_user_id" character varying NOT NULL, "icon_url" character varying, "display_name" character varying NOT NULL, "description" character varying, "is_preset" boolean NOT NULL DEFAULT false, "is_published" boolean NOT NULL DEFAULT false, "publish_config" text, "uuid" character varying NOT NULL, CONSTRAINT "PK_96e2bf4ad5de682c56e5591a5d1" PRIMARY KEY ("id")); COMMENT ON COLUMN "${appId}_knowledge_bases_sql"."is_published" IS '此资产是否被发布'`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_media_files" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1713876453723', "updated_timestamp" bigint NOT NULL DEFAULT '1713876453723', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying NOT NULL, "creator_user_id" character varying NOT NULL, "icon_url" character varying, "display_name" character varying NOT NULL, "description" character varying, "is_preset" boolean NOT NULL DEFAULT false, "is_published" boolean NOT NULL DEFAULT false, "publish_config" text, "type" character varying NOT NULL, "url" character varying NOT NULL, "source" character varying NOT NULL, "size" integer NOT NULL, "params" text, "md5" character varying, CONSTRAINT "PK_554c1b0a6ffc050e11ec31648aa" PRIMARY KEY ("id")); COMMENT ON COLUMN "${appId}_media_files"."is_published" IS '此资产是否被发布'`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_knowledge_bases" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1713876453723', "updated_timestamp" bigint NOT NULL DEFAULT '1713876453723', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying NOT NULL, "creator_user_id" character varying NOT NULL, "icon_url" character varying, "display_name" character varying NOT NULL, "description" character varying, "is_preset" boolean NOT NULL DEFAULT false, "is_published" boolean NOT NULL DEFAULT false, "publish_config" text, "uuid" character varying NOT NULL, "embedding_model" character varying NOT NULL, "dimension" integer NOT NULL, CONSTRAINT "PK_cbfcb40027c9df680db1113afbe" PRIMARY KEY ("id")); COMMENT ON COLUMN "${appId}_knowledge_bases"."is_published" IS '此资产是否被发布'`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_canvas_applications" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1713876453723', "updated_timestamp" bigint NOT NULL DEFAULT '1713876453723', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying NOT NULL, "creator_user_id" character varying NOT NULL, "icon_url" character varying, "display_name" character varying NOT NULL, "description" character varying, "is_preset" boolean NOT NULL DEFAULT false, "is_published" boolean NOT NULL DEFAULT false, "publish_config" text, "app_name" character varying NOT NULL, CONSTRAINT "PK_ee840b4e240c3baf7da059bdec3" PRIMARY KEY ("id")); COMMENT ON COLUMN "${appId}_canvas_applications"."is_published" IS '此资产是否被发布'`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_sd_models" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1713876453723', "updated_timestamp" bigint NOT NULL DEFAULT '1713876453723', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying NOT NULL, "creator_user_id" character varying NOT NULL, "icon_url" character varying, "display_name" character varying NOT NULL, "description" character varying, "is_preset" boolean NOT NULL DEFAULT false, "is_published" boolean NOT NULL DEFAULT false, "publish_config" text, "status" character varying NOT NULL, "progress" integer, "md5" character varying NOT NULL, "model_id" character varying NOT NULL, "keywords" character varying NOT NULL, "images" text NOT NULL, "params" text NOT NULL, "type" character varying, "base_model" character varying NOT NULL, "model_format" character varying, "disable_text_to_image" boolean, "disable_image_to_image" boolean, "disable_fine_tune" boolean, "output_models" text, "output_samples" text, "output_logs" text, "output_xyz_test" text, "version" character varying, "civitai_url" character varying, "tags" text, CONSTRAINT "PK_68e134b04d59f230922d398ad5d" PRIMARY KEY ("id")); COMMENT ON COLUMN "${appId}_sd_models"."is_published" IS '此资产是否被发布'`,
    );
    await queryRunner.query(
      `CREATE TABLE "${appId}_llm_models" ("id" character varying(128) NOT NULL, "created_timestamp" bigint NOT NULL DEFAULT '1713876453723', "updated_timestamp" bigint NOT NULL DEFAULT '1713876453723', "is_deleted" boolean NOT NULL DEFAULT false, "team_id" character varying NOT NULL, "creator_user_id" character varying NOT NULL, "icon_url" character varying, "display_name" character varying NOT NULL, "description" character varying, "is_preset" boolean NOT NULL DEFAULT false, "is_published" boolean NOT NULL DEFAULT false, "publish_config" text, "base_model" character varying NOT NULL, "lora_model" character varying, "llm_type" character varying NOT NULL, "quantization" character varying, "prompt_template" character varying, "gpu_memory_limit" integer, "context_max_length" integer, "stop" character varying, CONSTRAINT "PK_99a581b12da07c5afb76e9e8d74" PRIMARY KEY ("id")); COMMENT ON COLUMN "${appId}_llm_models"."is_published" IS '此资产是否被发布'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "${appId}_llm_models"`);
    await queryRunner.query(`DROP TABLE "${appId}_sd_models"`);
    await queryRunner.query(`DROP TABLE "${appId}_canvas_applications"`);
    await queryRunner.query(`DROP TABLE "${appId}_knowledge_bases"`);
    await queryRunner.query(`DROP TABLE "${appId}_media_files"`);
    await queryRunner.query(`DROP TABLE "${appId}_knowledge_bases_sql"`);
    await queryRunner.query(`DROP TABLE "${appId}_assets_authorization"`);
    await queryRunner.query(`DROP TABLE "${appId}_apikey"`);
    await queryRunner.query(`DROP TABLE "${appId}_asset_tag_relations"`);
    await queryRunner.query(`DROP TABLE "${appId}_asset_filters"`);
    await queryRunner.query(`DROP TABLE "${appId}_asset_tags"`);
    await queryRunner.query(`DROP TABLE "${appId}_themes"`);
    await queryRunner.query(`DROP TABLE "${appId}_team_join_requests"`);
    await queryRunner.query(`DROP TABLE "${appId}_teams"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f250bb56e1dde492ad5f592c21"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d13eb0899090f4bbc4b624c5a7"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a5a4b20f862c733d9621703e2e"`);
    await queryRunner.query(`DROP TABLE "${appId}_users"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1190c3ca75b80cbf995fd56663"`);
    await queryRunner.query(`DROP TABLE "${appId}_tools_trigger_types"`);
    await queryRunner.query(`DROP TABLE "${appId}_team_members"`);
    await queryRunner.query(`DROP TABLE "${appId}_system_configurations"`);
    await queryRunner.query(`DROP TABLE "${appId}_tools_server"`);
    await queryRunner.query(`DROP TABLE "${appId}_tools_credential_types"`);
    await queryRunner.query(`DROP TABLE "${appId}_workflow_metadatas"`);
    await queryRunner.query(`DROP TABLE "${appId}_tools_credentials"`);
    await queryRunner.query(`DROP TABLE "${appId}_workflow_chat_sessions"`);
    await queryRunner.query(`DROP TABLE "${appId}_workflow_execution"`);
    await queryRunner.query(`DROP TABLE "${appId}_tools"`);
    await queryRunner.query(`DROP TABLE "${appId}_workflow_templates"`);
    await queryRunner.query(`DROP TABLE "${appId}_workflow_triggers"`);
    await queryRunner.query(`DROP TABLE "${appId}_workflow_pages"`);
  }
}
