-- AlterTable
ALTER TABLE "Complaint" ADD COLUMN     "attachmentPath" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordResetRequestedAt" TIMESTAMP(3);
