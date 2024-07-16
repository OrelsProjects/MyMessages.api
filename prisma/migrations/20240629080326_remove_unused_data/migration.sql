/*
  Warnings:

  - You are about to drop the column `old_message_id` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `old_folder_id` on the `messages_in_folders` table. All the data in the column will be lost.
  - You are about to drop the column `old_message_id` on the `messages_in_folders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "messages" DROP COLUMN "old_message_id";

-- AlterTable
ALTER TABLE "messages_in_folders" DROP COLUMN "old_folder_id",
DROP COLUMN "old_message_id";
