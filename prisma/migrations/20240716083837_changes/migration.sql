/*
  Warnings:

  - Made the column `start_date` on table `phone_calls` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "phone_calls" ALTER COLUMN "start_date" SET NOT NULL;
