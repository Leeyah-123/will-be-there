/*
  Warnings:

  - You are about to drop the column `guestCount` on the `events` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "events" DROP COLUMN "guestCount",
ADD COLUMN     "guest_count" INTEGER NOT NULL DEFAULT 0;
