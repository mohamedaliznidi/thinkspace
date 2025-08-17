-- CreateEnum
CREATE TYPE "ReviewType" AS ENUM ('SCHEDULED', 'AD_HOC', 'MILESTONE', 'CRISIS');

-- CreateEnum
CREATE TYPE "ResponsibilityLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ReviewFrequency" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'BIANNUALLY', 'ANNUALLY', 'CUSTOM');

-- AlterTable
ALTER TABLE "areas" ADD COLUMN     "criteria" JSONB,
ADD COLUMN     "healthScore" DOUBLE PRECISION DEFAULT 0.0,
ADD COLUMN     "lastReviewedAt" TIMESTAMP(3),
ADD COLUMN     "nextReviewDate" TIMESTAMP(3),
ADD COLUMN     "responsibilityLevel" "ResponsibilityLevel" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "reviewFrequency" "ReviewFrequency" NOT NULL DEFAULT 'MONTHLY',
ADD COLUMN     "reviewTemplate" JSONB,
ADD COLUMN     "standards" JSONB,
ADD COLUMN     "timeInvestment" JSONB;

-- CreateTable
CREATE TABLE "sub_interests" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "level" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "observations" TEXT,
    "tags" TEXT[],
    "metadata" JSONB,
    "areaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sub_interests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "area_reviews" (
    "id" TEXT NOT NULL,
    "reviewDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewType" "ReviewType" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "findings" JSONB,
    "improvements" JSONB,
    "healthScore" DOUBLE PRECISION,
    "criteriaScores" JSONB,
    "templateId" TEXT,
    "template" JSONB,
    "areaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "area_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SubInterestNotes" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SubInterestNotes_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SubInterestProjects" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SubInterestProjects_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_RelatedSubInterests" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RelatedSubInterests_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SubInterestResources" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SubInterestResources_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "sub_interests_areaId_idx" ON "sub_interests"("areaId");

-- CreateIndex
CREATE INDEX "sub_interests_userId_idx" ON "sub_interests"("userId");

-- CreateIndex
CREATE INDEX "sub_interests_parentId_idx" ON "sub_interests"("parentId");

-- CreateIndex
CREATE INDEX "sub_interests_level_idx" ON "sub_interests"("level");

-- CreateIndex
CREATE INDEX "area_reviews_areaId_reviewDate_idx" ON "area_reviews"("areaId", "reviewDate");

-- CreateIndex
CREATE INDEX "area_reviews_userId_reviewDate_idx" ON "area_reviews"("userId", "reviewDate");

-- CreateIndex
CREATE INDEX "area_reviews_reviewType_idx" ON "area_reviews"("reviewType");

-- CreateIndex
CREATE INDEX "_SubInterestNotes_B_index" ON "_SubInterestNotes"("B");

-- CreateIndex
CREATE INDEX "_SubInterestProjects_B_index" ON "_SubInterestProjects"("B");

-- CreateIndex
CREATE INDEX "_RelatedSubInterests_B_index" ON "_RelatedSubInterests"("B");

-- CreateIndex
CREATE INDEX "_SubInterestResources_B_index" ON "_SubInterestResources"("B");

-- CreateIndex
CREATE INDEX "areas_nextReviewDate_idx" ON "areas"("nextReviewDate");

-- CreateIndex
CREATE INDEX "areas_healthScore_idx" ON "areas"("healthScore");

-- AddForeignKey
ALTER TABLE "sub_interests" ADD CONSTRAINT "sub_interests_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "sub_interests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_interests" ADD CONSTRAINT "sub_interests_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_interests" ADD CONSTRAINT "sub_interests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "area_reviews" ADD CONSTRAINT "area_reviews_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "area_reviews" ADD CONSTRAINT "area_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SubInterestNotes" ADD CONSTRAINT "_SubInterestNotes_A_fkey" FOREIGN KEY ("A") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SubInterestNotes" ADD CONSTRAINT "_SubInterestNotes_B_fkey" FOREIGN KEY ("B") REFERENCES "sub_interests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SubInterestProjects" ADD CONSTRAINT "_SubInterestProjects_A_fkey" FOREIGN KEY ("A") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SubInterestProjects" ADD CONSTRAINT "_SubInterestProjects_B_fkey" FOREIGN KEY ("B") REFERENCES "sub_interests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RelatedSubInterests" ADD CONSTRAINT "_RelatedSubInterests_A_fkey" FOREIGN KEY ("A") REFERENCES "sub_interests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RelatedSubInterests" ADD CONSTRAINT "_RelatedSubInterests_B_fkey" FOREIGN KEY ("B") REFERENCES "sub_interests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SubInterestResources" ADD CONSTRAINT "_SubInterestResources_A_fkey" FOREIGN KEY ("A") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SubInterestResources" ADD CONSTRAINT "_SubInterestResources_B_fkey" FOREIGN KEY ("B") REFERENCES "sub_interests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
