/*
  Warnings:

  - Made the column `locationReleaseDate` on table `events` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "events" ALTER COLUMN "locationReleaseDate" SET NOT NULL;
