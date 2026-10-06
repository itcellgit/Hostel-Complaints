-- AlterEnum
ALTER TYPE "ComplaintStatus" ADD VALUE 'ASSIGNED_TO_MAINTAINER';
ALTER TYPE "ComplaintStatus" ADD VALUE 'MAINTAINER_COMPLETED';

-- AlterTable
ALTER TABLE "Complaint" ADD COLUMN     "maintainerCompletedAt" TIMESTAMP(3),
ADD COLUMN     "maintainerProofPath" TEXT,
ADD COLUMN     "maintainerUserId" TEXT,
ADD COLUMN     "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Existing rows: treat the last update as when they entered their current status.
UPDATE "Complaint" SET "statusChangedAt" = "updatedAt";

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_maintainerUserId_fkey" FOREIGN KEY ("maintainerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
