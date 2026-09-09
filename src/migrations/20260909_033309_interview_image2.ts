import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "interviews" ADD COLUMN "image2_id" integer;
  ALTER TABLE "interviews" ADD COLUMN "image2_src" varchar;
  ALTER TABLE "_interviews_v" ADD COLUMN "version_image2_id" integer;
  ALTER TABLE "_interviews_v" ADD COLUMN "version_image2_src" varchar;
  ALTER TABLE "interviews" ADD CONSTRAINT "interviews_image2_id_media_id_fk" FOREIGN KEY ("image2_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_interviews_v" ADD CONSTRAINT "_interviews_v_version_image2_id_media_id_fk" FOREIGN KEY ("version_image2_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "interviews_image2_idx" ON "interviews" USING btree ("image2_id");
  CREATE INDEX "_interviews_v_version_version_image2_idx" ON "_interviews_v" USING btree ("version_image2_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "interviews" DROP CONSTRAINT "interviews_image2_id_media_id_fk";
  
  ALTER TABLE "_interviews_v" DROP CONSTRAINT "_interviews_v_version_image2_id_media_id_fk";
  
  DROP INDEX "interviews_image2_idx";
  DROP INDEX "_interviews_v_version_version_image2_idx";
  ALTER TABLE "interviews" DROP COLUMN "image2_id";
  ALTER TABLE "interviews" DROP COLUMN "image2_src";
  ALTER TABLE "_interviews_v" DROP COLUMN "version_image2_id";
  ALTER TABLE "_interviews_v" DROP COLUMN "version_image2_src";`)
}
