-- AlterTable
ALTER TABLE "cursos" ADD COLUMN     "tutor_token" TEXT;

-- CreateTable
CREATE TABLE "tutor_usage" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tutor_usage_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "cursos_tutor_token_key" ON "cursos"("tutor_token");

-- CreateIndex
CREATE INDEX "tutor_usage_expires_at_idx" ON "tutor_usage"("expires_at");
