-- Migration: add_tracking_tables
-- Adiciona rastreamento de sessões e eventos no link público do segurado.
-- Cascade delete garante limpeza automática quando o processo é deletado.

CREATE TYPE "QuoteEventType" AS ENUM (
  'PAGE_OPEN', 'PAGE_CLOSE', 'HEARTBEAT',
  'INSURER_VIEW', 'PAYMENT_VIEW', 'WHATSAPP_CLICK', 'PDF_DOWNLOAD'
);

CREATE TABLE "quote_sessions" (
    "id"          TEXT NOT NULL,
    "processId"   TEXT NOT NULL,
    "sessionId"   TEXT NOT NULL,
    "userId"      TEXT,
    "isOwner"     BOOLEAN NOT NULL DEFAULT false,
    "ipHash"      TEXT,
    "userAgent"   TEXT,
    "referrer"    TEXT,
    "startedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt"     TIMESTAMP(3),

    CONSTRAINT "quote_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "quote_events" (
    "id"        TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type"      "QuoteEventType" NOT NULL,
    "payload"   JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quote_events_pkey" PRIMARY KEY ("id")
);

-- Unique e indexes
CREATE UNIQUE INDEX "quote_sessions_sessionId_key"           ON "quote_sessions"("sessionId");
CREATE INDEX "quote_sessions_processId_startedAt_idx"        ON "quote_sessions"("processId", "startedAt");
CREATE INDEX "quote_sessions_processId_isOwner_startedAt_idx" ON "quote_sessions"("processId", "isOwner", "startedAt");
CREATE INDEX "quote_events_sessionId_type_idx"               ON "quote_events"("sessionId", "type");
CREATE INDEX "quote_events_type_createdAt_idx"               ON "quote_events"("type", "createdAt");

-- Foreign keys com Cascade delete
ALTER TABLE "quote_sessions" ADD CONSTRAINT "quote_sessions_processId_fkey"
    FOREIGN KEY ("processId") REFERENCES "quote_processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "quote_sessions" ADD CONSTRAINT "quote_sessions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "quote_events" ADD CONSTRAINT "quote_events_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "quote_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
