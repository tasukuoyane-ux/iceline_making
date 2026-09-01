import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "interviews" ADD COLUMN "intro" varchar;
  ALTER TABLE "interviews" ADD COLUMN "hobby" varchar;
  ALTER TABLE "interviews" ADD COLUMN "video_id" integer;
  ALTER TABLE "interviews" ADD COLUMN "video_src" varchar;
  ALTER TABLE "_interviews_v" ADD COLUMN "version_intro" varchar;
  ALTER TABLE "_interviews_v" ADD COLUMN "version_hobby" varchar;
  ALTER TABLE "_interviews_v" ADD COLUMN "version_video_id" integer;
  ALTER TABLE "_interviews_v" ADD COLUMN "version_video_src" varchar;
  ALTER TABLE "interviews" ADD CONSTRAINT "interviews_video_id_media_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_interviews_v" ADD CONSTRAINT "_interviews_v_version_video_id_media_id_fk" FOREIGN KEY ("version_video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "interviews_video_idx" ON "interviews" USING btree ("video_id");
  CREATE INDEX "_interviews_v_version_version_video_idx" ON "_interviews_v" USING btree ("version_video_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "interviews" DROP CONSTRAINT "interviews_video_id_media_id_fk";
  
  ALTER TABLE "_interviews_v" DROP CONSTRAINT "_interviews_v_version_video_id_media_id_fk";
  
  DROP INDEX "interviews_video_idx";
  DROP INDEX "_interviews_v_version_version_video_idx";
  ALTER TABLE "interviews" DROP COLUMN "intro";
  ALTER TABLE "interviews" DROP COLUMN "hobby";
  ALTER TABLE "interviews" DROP COLUMN "video_id";
  ALTER TABLE "interviews" DROP COLUMN "video_src";
  ALTER TABLE "_interviews_v" DROP COLUMN "version_intro";
  ALTER TABLE "_interviews_v" DROP COLUMN "version_hobby";
  ALTER TABLE "_interviews_v" DROP COLUMN "version_video_id";
  ALTER TABLE "_interviews_v" DROP COLUMN "version_video_src";`)
}
