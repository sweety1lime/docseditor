-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Organization" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "fullName" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "inn" TEXT NOT NULL,
    "ogrn" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "directorName" TEXT NOT NULL,
    "dpoName" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purpose" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "purpose" TEXT NOT NULL,
    "subjectCategory" TEXT NOT NULL,
    "dataComposition" TEXT NOT NULL,
    "processingMethod" TEXT NOT NULL,
    "retentionPeriod" TEXT NOT NULL,
    "destructionProcedure" TEXT NOT NULL,
    "actionsList" TEXT NOT NULL,
    "legalBasis" TEXT NOT NULL,

    CONSTRAINT "Purpose_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PdItem" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "subjectCategory" TEXT NOT NULL,
    "dataCategories" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "processingMethod" TEXT NOT NULL,
    "retentionPeriod" TEXT NOT NULL,

    CONSTRAINT "PdItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HarmCategory" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "answers" TEXT NOT NULL,

    CONSTRAINT "HarmCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ispdn" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "volume" TEXT NOT NULL,
    "subjectCategory" TEXT NOT NULL,
    "dataComposition" TEXT NOT NULL,
    "threatType" TEXT NOT NULL,
    "protectionLevel" TEXT NOT NULL,
    "location" TEXT NOT NULL,

    CONSTRAINT "Ispdn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Purpose_organizationId_order_idx" ON "Purpose"("organizationId", "order");

-- CreateIndex
CREATE INDEX "PdItem_organizationId_order_idx" ON "PdItem"("organizationId", "order");

-- CreateIndex
CREATE INDEX "HarmCategory_organizationId_order_idx" ON "HarmCategory"("organizationId", "order");

-- CreateIndex
CREATE INDEX "Ispdn_organizationId_order_idx" ON "Ispdn"("organizationId", "order");

-- AddForeignKey
ALTER TABLE "Purpose" ADD CONSTRAINT "Purpose_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PdItem" ADD CONSTRAINT "PdItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HarmCategory" ADD CONSTRAINT "HarmCategory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ispdn" ADD CONSTRAINT "Ispdn_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

