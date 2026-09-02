-- DropForeignKey
ALTER TABLE "Complaint" DROP CONSTRAINT "Complaint_studentId_fkey";

-- AlterTable
ALTER TABLE "Complaint" ADD COLUMN     "roomNo" TEXT,
ALTER COLUMN "studentId" DROP NOT NULL,
ALTER COLUMN "complainerRelation" DROP NOT NULL,
ALTER COLUMN "complainerRelation" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
