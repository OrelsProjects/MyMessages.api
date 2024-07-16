-- AddForeignKey
ALTER TABLE "phone_calls" ADD CONSTRAINT "phone_calls_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
