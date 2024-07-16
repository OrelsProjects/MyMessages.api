/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `app_users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "app_users_id_key" ON "app_users"("id");
