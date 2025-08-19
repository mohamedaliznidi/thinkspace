-- CreateEnum
CREATE TYPE "LinkType" AS ENUM ('RELATED', 'DEPENDS_ON', 'BLOCKS', 'REFERENCES', 'CONTAINS', 'PART_OF', 'SIMILAR_TO', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SummaryType" AS ENUM ('GENERAL', 'TECHNICAL', 'EXECUTIVE', 'BRIEF', 'DETAILED', 'LAYMAN');

-- CreateEnum
CREATE TYPE "SummaryLength" AS ENUM ('SHORT', 'MEDIUM', 'LONG', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ReferenceType" AS ENUM ('MANUAL', 'AI_SUGGESTED', 'AUTO_GENERATED', 'CITATION', 'MENTION', 'RELATED');

-- AlterTable
ALTER TABLE "connections" ADD COLUMN     "bidirectional" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "linkType" TEXT,
ADD COLUMN     "sourceId" TEXT,
ADD COLUMN     "sourceType" TEXT,
ADD COLUMN     "targetId" TEXT,
ADD COLUMN     "targetType" TEXT;

-- AlterTable
ALTER TABLE "resources" ADD COLUMN     "contentHash" TEXT,
ADD COLUMN     "contentLanguage" TEXT,
ADD COLUMN     "duplicateOf" TEXT,
ADD COLUMN     "extractedTopics" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "folderId" TEXT,
ADD COLUMN     "readingTime" INTEGER,
ADD COLUMN     "wordCount" INTEGER;

-- CreateTable
CREATE TABLE "resource_folders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT DEFAULT '#6366f1',
    "parentId" TEXT,
    "path" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_summaries" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "SummaryType" NOT NULL DEFAULT 'GENERAL',
    "length" "SummaryLength" NOT NULL DEFAULT 'MEDIUM',
    "qualityScore" DOUBLE PRECISION,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "feedback" TEXT,
    "model" TEXT,
    "prompt" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resourceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_references" (
    "id" TEXT NOT NULL,
    "context" TEXT,
    "snippet" TEXT,
    "referenceType" "ReferenceType" NOT NULL DEFAULT 'MANUAL',
    "resourceId" TEXT NOT NULL,
    "referencedResourceId" TEXT,
    "projectId" TEXT,
    "areaId" TEXT,
    "noteId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_collections" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT DEFAULT '#10b981',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CollectionResources" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CollectionResources_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "resource_folders_userId_parentId_idx" ON "resource_folders"("userId", "parentId");

-- CreateIndex
CREATE INDEX "resource_folders_path_idx" ON "resource_folders"("path");

-- CreateIndex
CREATE UNIQUE INDEX "resource_folders_userId_name_parentId_key" ON "resource_folders"("userId", "name", "parentId");

-- CreateIndex
CREATE INDEX "resource_summaries_resourceId_idx" ON "resource_summaries"("resourceId");

-- CreateIndex
CREATE INDEX "resource_summaries_qualityScore_idx" ON "resource_summaries"("qualityScore");

-- CreateIndex
CREATE INDEX "resource_references_resourceId_idx" ON "resource_references"("resourceId");

-- CreateIndex
CREATE INDEX "resource_references_referencedResourceId_idx" ON "resource_references"("referencedResourceId");

-- CreateIndex
CREATE INDEX "resource_references_projectId_idx" ON "resource_references"("projectId");

-- CreateIndex
CREATE INDEX "resource_references_areaId_idx" ON "resource_references"("areaId");

-- CreateIndex
CREATE INDEX "resource_references_noteId_idx" ON "resource_references"("noteId");

-- CreateIndex
CREATE INDEX "resource_collections_userId_idx" ON "resource_collections"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "resource_collections_userId_name_key" ON "resource_collections"("userId", "name");

-- CreateIndex
CREATE INDEX "_CollectionResources_B_index" ON "_CollectionResources"("B");

-- CreateIndex
CREATE INDEX "connections_sourceType_sourceId_idx" ON "connections"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "connections_targetType_targetId_idx" ON "connections"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "connections_linkType_idx" ON "connections"("linkType");

-- CreateIndex
CREATE INDEX "resources_folderId_idx" ON "resources"("folderId");

-- CreateIndex
CREATE INDEX "resources_contentHash_idx" ON "resources"("contentHash");

-- CreateIndex
CREATE INDEX "resources_duplicateOf_idx" ON "resources"("duplicateOf");

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "resource_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_duplicateOf_fkey" FOREIGN KEY ("duplicateOf") REFERENCES "resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_folders" ADD CONSTRAINT "resource_folders_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "resource_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_folders" ADD CONSTRAINT "resource_folders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_summaries" ADD CONSTRAINT "resource_summaries_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_summaries" ADD CONSTRAINT "resource_summaries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_references" ADD CONSTRAINT "resource_references_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_references" ADD CONSTRAINT "resource_references_referencedResourceId_fkey" FOREIGN KEY ("referencedResourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_references" ADD CONSTRAINT "resource_references_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_references" ADD CONSTRAINT "resource_references_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_references" ADD CONSTRAINT "resource_references_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_references" ADD CONSTRAINT "resource_references_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_collections" ADD CONSTRAINT "resource_collections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CollectionResources" ADD CONSTRAINT "_CollectionResources_A_fkey" FOREIGN KEY ("A") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CollectionResources" ADD CONSTRAINT "_CollectionResources_B_fkey" FOREIGN KEY ("B") REFERENCES "resource_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
