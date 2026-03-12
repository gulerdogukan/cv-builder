-- Phase 4: AI rate limiting alanları
-- Supabase SQL Editor'da veya dotnet migrations ile çalıştırın

ALTER TABLE "Users"
  ADD COLUMN IF NOT EXISTS "AiRequestsToday" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "AiRequestsResetAt" timestamp with time zone NOT NULL DEFAULT now();
