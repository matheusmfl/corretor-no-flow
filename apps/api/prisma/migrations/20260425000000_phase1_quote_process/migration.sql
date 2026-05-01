-- Migration: phase1_quote_process
-- Reestrutura o schema de cotações para suportar múltiplas seguradoras por processo.
-- Parte de cima: a primeira migration já criou AccountType, TeamSize, InsuranceProduct,
-- QuoteStatus(antigo), companies, users, refresh_tokens, password_reset_tokens, company_onboarding_surveys.

-- 1. Remove a tabela de cotações flat da v1 (estrutura incompatível)
DROP TABLE IF EXISTS "quotes" CASCADE;
DROP TYPE IF EXISTS "QuoteStatus";

-- 2. Novos enums
CREATE TYPE "Insurer" AS ENUM ('BRADESCO', 'PORTO_SEGURO', 'TOKIO_MARINE', 'SULAMERICA', 'SUHAI', 'ALIRO', 'ALLIANZ', 'YELLOW');
CREATE TYPE "QuoteProcessStatus" AS ENUM ('DRAFT', 'PROCESSING', 'PENDING_REVIEW', 'READY', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "QuoteStatus" AS ENUM ('PENDING', 'PROCESSING', 'PENDING_REVIEW', 'READY', 'FAILED');
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'CANCELED', 'EXPIRED');

-- 3. Colunas novas na companies
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "zipCode" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "street" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "neighborhood" TEXT;
ALTER TABLE "companies" ALTER COLUMN "primaryColor" SET DEFAULT '#3E1010';

-- 4. Tabela de processo de cotação (agrupa múltiplas seguradoras)
CREATE TABLE "quote_processes" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "product" "InsuranceProduct" NOT NULL,
    "status" "QuoteProcessStatus" NOT NULL DEFAULT 'DRAFT',
    "clientName" TEXT,
    "clientPhone" TEXT,
    "publicToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_processes_pkey" PRIMARY KEY ("id")
);

-- 5. Nova tabela de cotação (uma por seguradora, vinculada ao processo)
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "insurer" "Insurer" NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'PENDING',
    "name" TEXT,
    "nameSlug" TEXT,
    "originalFileKey" TEXT,
    "rawText" TEXT,
    "extractedData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- 6. Schema de comparação por ramo (seed-only)
CREATE TABLE "comparison_schemas" (
    "id" TEXT NOT NULL,
    "product" "InsuranceProduct" NOT NULL,
    "fields" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comparison_schemas_pkey" PRIMARY KEY ("id")
);

-- 7. Planos e assinaturas
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "quotesPerMonth" INTEGER NOT NULL,
    "products" JSONB NOT NULL,
    "insurers" JSONB NOT NULL,
    "features" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "quotesUsedThisMonth" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- 8. Indexes
CREATE UNIQUE INDEX "quote_processes_publicToken_key" ON "quote_processes"("publicToken");
CREATE INDEX "quote_processes_companyId_createdAt_idx" ON "quote_processes"("companyId", "createdAt");
CREATE UNIQUE INDEX "quotes_processId_nameSlug_key" ON "quotes"("processId", "nameSlug");
CREATE INDEX "quotes_processId_idx" ON "quotes"("processId");
CREATE UNIQUE INDEX "comparison_schemas_product_key" ON "comparison_schemas"("product");
CREATE UNIQUE INDEX "plans_slug_key" ON "plans"("slug");
CREATE UNIQUE INDEX "subscriptions_companyId_key" ON "subscriptions"("companyId");

-- 9. Foreign keys
ALTER TABLE "quote_processes" ADD CONSTRAINT "quote_processes_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "quotes" ADD CONSTRAINT "quotes_processId_fkey"
    FOREIGN KEY ("processId") REFERENCES "quote_processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey"
    FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
