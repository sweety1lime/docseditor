-- CreateTable
CREATE TABLE "CustomTemplate" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileBytes" BYTEA NOT NULL,
    "fields" JSONB NOT NULL,
    "values" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomTemplate_organizationId_idx" ON "CustomTemplate"("organizationId");

-- AddForeignKey
ALTER TABLE "CustomTemplate" ADD CONSTRAINT "CustomTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
