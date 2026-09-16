-- CreateEnum
CREATE TYPE "course_generation_status" AS ENUM ('GENERATING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "cursos" ADD COLUMN     "generation_status" "course_generation_status";

-- CreateTable
CREATE TABLE "course_generation_jobs" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "course_generation_status" NOT NULL DEFAULT 'GENERATING',
    "source_file_name" TEXT NOT NULL,
    "source_text" TEXT NOT NULL,
    "layout" TEXT,
    "mode" TEXT NOT NULL,
    "error" TEXT,
    "model" TEXT,
    "prompt_tokens" INTEGER,
    "completion_tokens" INTEGER,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "notified_at" TIMESTAMP(3),

    CONSTRAINT "course_generation_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_generation_jobs_user_id_status_idx" ON "course_generation_jobs"("user_id", "status");

-- CreateIndex
CREATE INDEX "course_generation_jobs_course_id_idx" ON "course_generation_jobs"("course_id");

-- AddForeignKey
ALTER TABLE "course_generation_jobs" ADD CONSTRAINT "course_generation_jobs_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "cursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_generation_jobs" ADD CONSTRAINT "course_generation_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

