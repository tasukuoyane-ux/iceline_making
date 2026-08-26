import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "news_blocks_recruit_link" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"job" varchar,
  	"label" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_news_v_blocks_recruit_link" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"job" varchar,
  	"label" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "news_blocks_recruit_link" ADD CONSTRAINT "news_blocks_recruit_link_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."news"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v_blocks_recruit_link" ADD CONSTRAINT "_news_v_blocks_recruit_link_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_news_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "news_blocks_recruit_link_order_idx" ON "news_blocks_recruit_link" USING btree ("_order");
  CREATE INDEX "news_blocks_recruit_link_parent_id_idx" ON "news_blocks_recruit_link" USING btree ("_parent_id");
  CREATE INDEX "news_blocks_recruit_link_path_idx" ON "news_blocks_recruit_link" USING btree ("_path");
  CREATE INDEX "_news_v_blocks_recruit_link_order_idx" ON "_news_v_blocks_recruit_link" USING btree ("_order");
  CREATE INDEX "_news_v_blocks_recruit_link_parent_id_idx" ON "_news_v_blocks_recruit_link" USING btree ("_parent_id");
  CREATE INDEX "_news_v_blocks_recruit_link_path_idx" ON "_news_v_blocks_recruit_link" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "news_blocks_recruit_link" CASCADE;
  DROP TABLE "_news_v_blocks_recruit_link" CASCADE;`)
}
