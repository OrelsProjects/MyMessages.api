-- CreateTable
CREATE TABLE "ongoing_calls" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ongoing_calls_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ongoing_calls" ADD CONSTRAINT "ongoing_calls_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
