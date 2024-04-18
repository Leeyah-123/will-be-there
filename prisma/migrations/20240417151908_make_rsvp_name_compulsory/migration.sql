/*
  Warnings:

  - Made the column `name` on table `Rsvp` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Rsvp" ALTER COLUMN "name" SET NOT NULL;
