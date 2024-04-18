/*
  Warnings:

  - The values [private] on the enum `EventVisibility` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EventVisibility_new" AS ENUM ('Public', 'Private');
ALTER TABLE "events" ALTER COLUMN "visibility" TYPE "EventVisibility_new" USING ("visibility"::text::"EventVisibility_new");
ALTER TYPE "EventVisibility" RENAME TO "EventVisibility_old";
ALTER TYPE "EventVisibility_new" RENAME TO "EventVisibility";
DROP TYPE "EventVisibility_old";
COMMIT;
