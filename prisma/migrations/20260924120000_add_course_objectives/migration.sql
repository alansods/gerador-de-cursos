-- AlterTable
ALTER TABLE "cursos" ADD COLUMN     "objectives" TEXT[] DEFAULT ARRAY[]::TEXT[];
