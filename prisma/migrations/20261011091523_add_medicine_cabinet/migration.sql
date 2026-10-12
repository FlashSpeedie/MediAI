-- CreateEnum
CREATE TYPE "VerificationState" AS ENUM ('NEEDS_REVIEW', 'USER_CONFIRMED', 'UNABLE_TO_MATCH');

-- CreateTable
CREATE TABLE "MedicineCabinet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productName" TEXT NOT NULL,
    "brandName" TEXT,
    "genericName" TEXT,
    "strength" TEXT,
    "dosageForm" TEXT,
    "ndc" TEXT,
    "manufacturer" TEXT,
    "expirationDate" TIMESTAMP(3),
    "notes" TEXT,
    "verificationState" "VerificationState" NOT NULL DEFAULT 'NEEDS_REVIEW',
    "sourceIdentifiers" JSONB,

    CONSTRAINT "MedicineCabinet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MedicineCabinet_userId_idx" ON "MedicineCabinet"("userId");

-- CreateIndex
CREATE INDEX "MedicineCabinet_userId_productName_idx" ON "MedicineCabinet"("userId", "productName");

-- AddForeignKey
ALTER TABLE "MedicineCabinet" ADD CONSTRAINT "MedicineCabinet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
