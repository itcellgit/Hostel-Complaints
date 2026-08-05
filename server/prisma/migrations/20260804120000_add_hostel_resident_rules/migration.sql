CREATE TABLE "HostelResidentRule" (
  "id" TEXT NOT NULL,
  "hostelId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "kind" TEXT NOT NULL DEFAULT 'DO',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "HostelResidentRule_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "HostelResidentRule"
ADD CONSTRAINT "HostelResidentRule_hostelId_fkey"
FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "HostelResidentRule_hostelId_idx" ON "HostelResidentRule"("hostelId");
