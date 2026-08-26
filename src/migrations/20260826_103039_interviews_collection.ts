import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_interviews_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__interviews_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "interviews_blocks_paragraph" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "interviews_blocks_h2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "interviews_blocks_h3" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "interviews_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"src" varchar,
  	"href" varchar,
  	"alt" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "interviews_blocks_video" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"src" varchar,
  	"caption" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "interviews_blocks_recruit_link" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"job" varchar,
  	"label" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "interviews" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"slug" varchar,
  	"category" varchar DEFAULT '社員インタビュー',
  	"order" numeric DEFAULT 0,
  	"role" varchar,
  	"years" varchar,
  	"lead" varchar,
  	"subtitle" varchar,
  	"image_id" integer,
  	"image_src" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_interviews_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_interviews_v_blocks_paragraph" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_interviews_v_blocks_h2" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_interviews_v_blocks_h3" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_interviews_v_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"src" varchar,
  	"href" varchar,
  	"alt" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_interviews_v_blocks_video" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"src" varchar,
  	"caption" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_interviews_v_blocks_recruit_link" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"job" varchar,
  	"label" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_interviews_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_slug" varchar,
  	"version_category" varchar DEFAULT '社員インタビュー',
  	"version_order" numeric DEFAULT 0,
  	"version_role" varchar,
  	"version_years" varchar,
  	"version_lead" varchar,
  	"version_subtitle" varchar,
  	"version_image_id" integer,
  	"version_image_src" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__interviews_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "interviews_id" integer;
  ALTER TABLE "interviews_blocks_paragraph" ADD CONSTRAINT "interviews_blocks_paragraph_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."interviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "interviews_blocks_h2" ADD CONSTRAINT "interviews_blocks_h2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."interviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "interviews_blocks_h3" ADD CONSTRAINT "interviews_blocks_h3_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."interviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "interviews_blocks_image" ADD CONSTRAINT "interviews_blocks_image_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "interviews_blocks_image" ADD CONSTRAINT "interviews_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."interviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "interviews_blocks_video" ADD CONSTRAINT "interviews_blocks_video_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."interviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "interviews_blocks_recruit_link" ADD CONSTRAINT "interviews_blocks_recruit_link_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."interviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "interviews" ADD CONSTRAINT "interviews_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_interviews_v_blocks_paragraph" ADD CONSTRAINT "_interviews_v_blocks_paragraph_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_interviews_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_interviews_v_blocks_h2" ADD CONSTRAINT "_interviews_v_blocks_h2_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_interviews_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_interviews_v_blocks_h3" ADD CONSTRAINT "_interviews_v_blocks_h3_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_interviews_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_interviews_v_blocks_image" ADD CONSTRAINT "_interviews_v_blocks_image_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_interviews_v_blocks_image" ADD CONSTRAINT "_interviews_v_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_interviews_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_interviews_v_blocks_video" ADD CONSTRAINT "_interviews_v_blocks_video_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_interviews_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_interviews_v_blocks_recruit_link" ADD CONSTRAINT "_interviews_v_blocks_recruit_link_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_interviews_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_interviews_v" ADD CONSTRAINT "_interviews_v_parent_id_interviews_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."interviews"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_interviews_v" ADD CONSTRAINT "_interviews_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "interviews_blocks_paragraph_order_idx" ON "interviews_blocks_paragraph" USING btree ("_order");
  CREATE INDEX "interviews_blocks_paragraph_parent_id_idx" ON "interviews_blocks_paragraph" USING btree ("_parent_id");
  CREATE INDEX "interviews_blocks_paragraph_path_idx" ON "interviews_blocks_paragraph" USING btree ("_path");
  CREATE INDEX "interviews_blocks_h2_order_idx" ON "interviews_blocks_h2" USING btree ("_order");
  CREATE INDEX "interviews_blocks_h2_parent_id_idx" ON "interviews_blocks_h2" USING btree ("_parent_id");
  CREATE INDEX "interviews_blocks_h2_path_idx" ON "interviews_blocks_h2" USING btree ("_path");
  CREATE INDEX "interviews_blocks_h3_order_idx" ON "interviews_blocks_h3" USING btree ("_order");
  CREATE INDEX "interviews_blocks_h3_parent_id_idx" ON "interviews_blocks_h3" USING btree ("_parent_id");
  CREATE INDEX "interviews_blocks_h3_path_idx" ON "interviews_blocks_h3" USING btree ("_path");
  CREATE INDEX "interviews_blocks_image_order_idx" ON "interviews_blocks_image" USING btree ("_order");
  CREATE INDEX "interviews_blocks_image_parent_id_idx" ON "interviews_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "interviews_blocks_image_path_idx" ON "interviews_blocks_image" USING btree ("_path");
  CREATE INDEX "interviews_blocks_image_media_idx" ON "interviews_blocks_image" USING btree ("media_id");
  CREATE INDEX "interviews_blocks_video_order_idx" ON "interviews_blocks_video" USING btree ("_order");
  CREATE INDEX "interviews_blocks_video_parent_id_idx" ON "interviews_blocks_video" USING btree ("_parent_id");
  CREATE INDEX "interviews_blocks_video_path_idx" ON "interviews_blocks_video" USING btree ("_path");
  CREATE INDEX "interviews_blocks_recruit_link_order_idx" ON "interviews_blocks_recruit_link" USING btree ("_order");
  CREATE INDEX "interviews_blocks_recruit_link_parent_id_idx" ON "interviews_blocks_recruit_link" USING btree ("_parent_id");
  CREATE INDEX "interviews_blocks_recruit_link_path_idx" ON "interviews_blocks_recruit_link" USING btree ("_path");
  CREATE UNIQUE INDEX "interviews_slug_idx" ON "interviews" USING btree ("slug");
  CREATE INDEX "interviews_image_idx" ON "interviews" USING btree ("image_id");
  CREATE INDEX "interviews_updated_at_idx" ON "interviews" USING btree ("updated_at");
  CREATE INDEX "interviews_created_at_idx" ON "interviews" USING btree ("created_at");
  CREATE INDEX "interviews__status_idx" ON "interviews" USING btree ("_status");
  CREATE INDEX "_interviews_v_blocks_paragraph_order_idx" ON "_interviews_v_blocks_paragraph" USING btree ("_order");
  CREATE INDEX "_interviews_v_blocks_paragraph_parent_id_idx" ON "_interviews_v_blocks_paragraph" USING btree ("_parent_id");
  CREATE INDEX "_interviews_v_blocks_paragraph_path_idx" ON "_interviews_v_blocks_paragraph" USING btree ("_path");
  CREATE INDEX "_interviews_v_blocks_h2_order_idx" ON "_interviews_v_blocks_h2" USING btree ("_order");
  CREATE INDEX "_interviews_v_blocks_h2_parent_id_idx" ON "_interviews_v_blocks_h2" USING btree ("_parent_id");
  CREATE INDEX "_interviews_v_blocks_h2_path_idx" ON "_interviews_v_blocks_h2" USING btree ("_path");
  CREATE INDEX "_interviews_v_blocks_h3_order_idx" ON "_interviews_v_blocks_h3" USING btree ("_order");
  CREATE INDEX "_interviews_v_blocks_h3_parent_id_idx" ON "_interviews_v_blocks_h3" USING btree ("_parent_id");
  CREATE INDEX "_interviews_v_blocks_h3_path_idx" ON "_interviews_v_blocks_h3" USING btree ("_path");
  CREATE INDEX "_interviews_v_blocks_image_order_idx" ON "_interviews_v_blocks_image" USING btree ("_order");
  CREATE INDEX "_interviews_v_blocks_image_parent_id_idx" ON "_interviews_v_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "_interviews_v_blocks_image_path_idx" ON "_interviews_v_blocks_image" USING btree ("_path");
  CREATE INDEX "_interviews_v_blocks_image_media_idx" ON "_interviews_v_blocks_image" USING btree ("media_id");
  CREATE INDEX "_interviews_v_blocks_video_order_idx" ON "_interviews_v_blocks_video" USING btree ("_order");
  CREATE INDEX "_interviews_v_blocks_video_parent_id_idx" ON "_interviews_v_blocks_video" USING btree ("_parent_id");
  CREATE INDEX "_interviews_v_blocks_video_path_idx" ON "_interviews_v_blocks_video" USING btree ("_path");
  CREATE INDEX "_interviews_v_blocks_recruit_link_order_idx" ON "_interviews_v_blocks_recruit_link" USING btree ("_order");
  CREATE INDEX "_interviews_v_blocks_recruit_link_parent_id_idx" ON "_interviews_v_blocks_recruit_link" USING btree ("_parent_id");
  CREATE INDEX "_interviews_v_blocks_recruit_link_path_idx" ON "_interviews_v_blocks_recruit_link" USING btree ("_path");
  CREATE INDEX "_interviews_v_parent_idx" ON "_interviews_v" USING btree ("parent_id");
  CREATE INDEX "_interviews_v_version_version_slug_idx" ON "_interviews_v" USING btree ("version_slug");
  CREATE INDEX "_interviews_v_version_version_image_idx" ON "_interviews_v" USING btree ("version_image_id");
  CREATE INDEX "_interviews_v_version_version_updated_at_idx" ON "_interviews_v" USING btree ("version_updated_at");
  CREATE INDEX "_interviews_v_version_version_created_at_idx" ON "_interviews_v" USING btree ("version_created_at");
  CREATE INDEX "_interviews_v_version_version__status_idx" ON "_interviews_v" USING btree ("version__status");
  CREATE INDEX "_interviews_v_created_at_idx" ON "_interviews_v" USING btree ("created_at");
  CREATE INDEX "_interviews_v_updated_at_idx" ON "_interviews_v" USING btree ("updated_at");
  CREATE INDEX "_interviews_v_latest_idx" ON "_interviews_v" USING btree ("latest");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_interviews_fk" FOREIGN KEY ("interviews_id") REFERENCES "public"."interviews"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_interviews_id_idx" ON "payload_locked_documents_rels" USING btree ("interviews_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "interviews_blocks_paragraph" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "interviews_blocks_h2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "interviews_blocks_h3" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "interviews_blocks_image" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "interviews_blocks_video" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "interviews_blocks_recruit_link" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "interviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_interviews_v_blocks_paragraph" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_interviews_v_blocks_h2" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_interviews_v_blocks_h3" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_interviews_v_blocks_image" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_interviews_v_blocks_video" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_interviews_v_blocks_recruit_link" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_interviews_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "interviews_blocks_paragraph" CASCADE;
  DROP TABLE "interviews_blocks_h2" CASCADE;
  DROP TABLE "interviews_blocks_h3" CASCADE;
  DROP TABLE "interviews_blocks_image" CASCADE;
  DROP TABLE "interviews_blocks_video" CASCADE;
  DROP TABLE "interviews_blocks_recruit_link" CASCADE;
  DROP TABLE "interviews" CASCADE;
  DROP TABLE "_interviews_v_blocks_paragraph" CASCADE;
  DROP TABLE "_interviews_v_blocks_h2" CASCADE;
  DROP TABLE "_interviews_v_blocks_h3" CASCADE;
  DROP TABLE "_interviews_v_blocks_image" CASCADE;
  DROP TABLE "_interviews_v_blocks_video" CASCADE;
  DROP TABLE "_interviews_v_blocks_recruit_link" CASCADE;
  DROP TABLE "_interviews_v" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_interviews_fk";
  
  DROP INDEX "payload_locked_documents_rels_interviews_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "interviews_id";
  DROP TYPE "public"."enum_interviews_status";
  DROP TYPE "public"."enum__interviews_v_version_status";`)
}
