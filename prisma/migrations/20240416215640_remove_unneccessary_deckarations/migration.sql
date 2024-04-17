/*
  Warnings:

  - The primary key for the `Rsvp` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `events` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Rsvp" DROP CONSTRAINT "Rsvp_event_id_fkey";

-- AlterTable
ALTER TABLE "Rsvp" DROP CONSTRAINT "Rsvp_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "name" SET DATA TYPE TEXT,
ALTER COLUMN "email" SET DATA TYPE TEXT,
ALTER COLUMN "event_id" SET DATA TYPE TEXT,
ALTER COLUMN "items" SET DATA TYPE TEXT[],
ALTER COLUMN "uploads" SET DATA TYPE TEXT[],
ALTER COLUMN "guests" SET DATA TYPE TEXT[],
ADD CONSTRAINT "Rsvp_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "events" DROP CONSTRAINT "events_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "name" SET DATA TYPE TEXT,
ALTER COLUMN "description" SET DATA TYPE TEXT,
ALTER COLUMN "type" SET DATA TYPE TEXT,
ALTER COLUMN "items" SET DATA TYPE TEXT[],
ALTER COLUMN "location" SET DATA TYPE TEXT,
ALTER COLUMN "image" SET DATA TYPE TEXT,
ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "Rsvp" ADD CONSTRAINT "Rsvp_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
