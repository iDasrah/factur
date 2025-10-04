-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('QUOTE_CREATED', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'QUOTE_DECLINED', 'INVOICE_CREATED', 'INVOICE_SENT', 'INVOICE_PAID', 'INVOICE_CANCELLED', 'CUSTOMER_CREATED', 'CUSTOMER_DELETED', 'CUSTOMER_EDITED');

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "dueDate" SET DEFAULT now() + interval '30 days';

-- AlterTable
ALTER TABLE "Quote" ALTER COLUMN "expirationDate" SET DEFAULT now() + interval '30 days';

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quoteId" TEXT,
    "invoiceId" TEXT,
    "customerId" TEXT,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
