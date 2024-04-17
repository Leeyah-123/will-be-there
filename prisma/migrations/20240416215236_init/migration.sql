-- CreateEnum
CREATE TYPE "EventVisibility" AS ENUM ('Public', 'private');

-- CreateTable
CREATE TABLE "events" (
    "id" VARCHAR NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR NOT NULL,
    "description" VARCHAR NOT NULL,
    "datetime" TIMESTAMP(3) NOT NULL,
    "type" VARCHAR NOT NULL,
    "items" VARCHAR[],
    "visibility" "EventVisibility" NOT NULL,
    "location" VARCHAR NOT NULL,
    "image" VARCHAR,
    "max_guests" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rsvp" (
    "id" VARCHAR NOT NULL,
    "user_id" TEXT,
    "name" VARCHAR,
    "email" VARCHAR NOT NULL,
    "event_id" VARCHAR NOT NULL,
    "congratulatory_message" TEXT,
    "items" VARCHAR[],
    "uploads" VARCHAR[],
    "guests" VARCHAR[],
    "attending" BOOLEAN NOT NULL,

    CONSTRAINT "Rsvp_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Rsvp" ADD CONSTRAINT "Rsvp_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
