-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('SOLO', 'FAMILY');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountType" "AccountType" NOT NULL DEFAULT 'SOLO',
ADD COLUMN     "activityLevel" TEXT,
ADD COLUMN     "age" INTEGER,
ADD COLUMN     "alcoholUse" TEXT,
ADD COLUMN     "bloodPressure" TEXT,
ADD COLUMN     "bloodType" TEXT,
ADD COLUMN     "chronicConditions" TEXT[],
ADD COLUMN     "currentMedications" TEXT[],
ADD COLUMN     "dietType" TEXT,
ADD COLUMN     "familyGroupId" TEXT,
ADD COLUMN     "familyRole" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "heartRateBpm" INTEGER,
ADD COLUMN     "heightCm" DOUBLE PRECISION,
ADD COLUMN     "knownAllergies" TEXT[],
ADD COLUMN     "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "smokingStatus" TEXT,
ADD COLUMN     "weightKg" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "FamilyGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "adminId" TEXT NOT NULL,

    CONSTRAINT "FamilyGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthSummary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "summary" TEXT NOT NULL,
    "sessionCount" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FamilyGroup_code_key" ON "FamilyGroup"("code");

-- CreateIndex
CREATE INDEX "HealthSummary_userId_idx" ON "HealthSummary"("userId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_familyGroupId_fkey" FOREIGN KEY ("familyGroupId") REFERENCES "FamilyGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthSummary" ADD CONSTRAINT "HealthSummary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
