-- AlterEnum
ALTER TYPE "ComplaintActivityAction" ADD VALUE 'ETA_UPDATE';

-- AlterTable
ALTER TABLE "Complaint" ADD COLUMN     "estimatedCompletionAt" TIMESTAMP(3);
