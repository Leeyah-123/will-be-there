/*
  Warnings:

  - You are about to drop the column `max_guest_per_attendee` on the `events` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "events" DROP COLUMN "max_guest_per_attendee",
ADD COLUMN     "max_guests" INTEGER,
ADD COLUMN     "max_guests_per_attendee" INTEGER;
