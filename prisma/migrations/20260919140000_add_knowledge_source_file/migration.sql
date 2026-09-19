-- AlterTable
ALTER TABLE "knowledge_sources" ADD COLUMN     "content_type" TEXT,
ADD COLUMN     "file_pathname" TEXT,
ADD COLUMN     "file_size" INTEGER;
