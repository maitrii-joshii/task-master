/*
  Warnings:

  - The values [ADMIN] on the enum `ProjectMemberRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProjectMemberRole_new" AS ENUM ('OWNER', 'MEMBER');
ALTER TABLE "public"."ProjectMember" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "ProjectMember" ALTER COLUMN "role" TYPE "ProjectMemberRole_new" USING ("role"::text::"ProjectMemberRole_new");
ALTER TYPE "ProjectMemberRole" RENAME TO "ProjectMemberRole_old";
ALTER TYPE "ProjectMemberRole_new" RENAME TO "ProjectMemberRole";
DROP TYPE "public"."ProjectMemberRole_old";
ALTER TABLE "ProjectMember" ALTER COLUMN "role" SET DEFAULT 'MEMBER';
COMMIT;
