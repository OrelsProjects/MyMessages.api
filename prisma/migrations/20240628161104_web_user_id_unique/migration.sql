/*
  Warnings:

  - A unique constraint covering the columns `[web_user_id]` on the table `app_users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "app_users_web_user_id_key" ON "app_users"("web_user_id");
