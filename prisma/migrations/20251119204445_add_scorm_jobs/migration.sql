-- CreateTable
CREATE TABLE "scorm_jobs" (
    "id" TEXT NOT NULL,
    "curso_id" TEXT NOT NULL,
    "curso_titulo" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "progress" TEXT,
    "error" TEXT,
    "zip_data" BYTEA,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "scorm_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scorm_jobs_status_idx" ON "scorm_jobs"("status");

-- CreateIndex
CREATE INDEX "scorm_jobs_created_at_idx" ON "scorm_jobs"("created_at");

-- CreateIndex
CREATE INDEX "scorm_jobs_curso_id_idx" ON "scorm_jobs"("curso_id");
