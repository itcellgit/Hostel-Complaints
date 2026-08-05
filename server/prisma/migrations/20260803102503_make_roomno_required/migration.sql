/*
  Warnings:

  - Made the column `roomNo` on table `Student` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "roomNo" SET NOT NULL;
