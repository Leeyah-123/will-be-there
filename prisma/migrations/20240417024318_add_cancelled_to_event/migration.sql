/*
  Warnings:

  - You are about to drop the column `max_guests` on the `events` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "events" DROP COLUMN "max_guests",
ADD COLUMN     "cancelled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "max_guest_per_attendee" INTEGER;
