/*
  Warnings:

  - You are about to drop the `appUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `deletedCalls` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `messageInFolder` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `messagesSent` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "deletedCalls" DROP CONSTRAINT "deletedCalls_user_id_fkey";

-- DropForeignKey
ALTER TABLE "folders" DROP CONSTRAINT "folders_user_id_fkey";

-- DropForeignKey
ALTER TABLE "messageInFolder" DROP CONSTRAINT "messageInFolder_folder_id_fkey";

-- DropForeignKey
ALTER TABLE "messageInFolder" DROP CONSTRAINT "messageInFolder_message_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_user_id_fkey";

-- DropForeignKey
ALTER TABLE "messagesSent" DROP CONSTRAINT "messagesSent_phone_call_id_fkey";

-- DropForeignKey
ALTER TABLE "settings" DROP CONSTRAINT "settings_user_id_fkey";

-- DropTable
DROP TABLE "appUser";

-- DropTable
DROP TABLE "deletedCalls";

-- DropTable
DROP TABLE "messageInFolder";

-- DropTable
DROP TABLE "messagesSent";

-- CreateTable
CREATE TABLE "app_user" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_user_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "deleted_calls" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "number" TEXT NOT NULL,

    CONSTRAINT "deleted_calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages_in_folders" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "folder_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id_message" TEXT,
    "user_id_folder" TEXT,
    "old_folder_id" TEXT,
    "old_message_id" TEXT,

    CONSTRAINT "messages_in_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messsages_sent" (
    "id" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "message_id" TEXT NOT NULL,
    "phone_call_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messsages_sent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "messages_in_folders_message_id_folder_id_key" ON "messages_in_folders"("message_id", "folder_id");

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deleted_calls" ADD CONSTRAINT "deleted_calls_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages_in_folders" ADD CONSTRAINT "messages_in_folders_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages_in_folders" ADD CONSTRAINT "messages_in_folders_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messsages_sent" ADD CONSTRAINT "messsages_sent_phone_call_id_fkey" FOREIGN KEY ("phone_call_id") REFERENCES "phone_calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
