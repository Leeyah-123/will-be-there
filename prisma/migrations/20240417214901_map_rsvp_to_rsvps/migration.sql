/*
  Warnings:

  - You are about to drop the `Rsvp` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Rsvp" DROP CONSTRAINT "Rsvp_event_id_fkey";

-- DropTable
DROP TABLE "Rsvp";

-- CreateTable
CREATE TABLE "rsvps" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "congratulatory_message" TEXT,
    "items" TEXT[],
    "uploads" TEXT[],
    "guests" TEXT[],
    "attending" BOOLEAN NOT NULL,

    CONSTRAINT "rsvps_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
