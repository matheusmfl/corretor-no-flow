-- AlterTable
ALTER TABLE "quote_processes" ADD COLUMN "publicQuoteIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
