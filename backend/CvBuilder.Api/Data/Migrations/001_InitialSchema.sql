-- CV Builder — Initial Schema
-- Supabase SQL Editor veya psql ile çalıştırın
-- Bu script idempotent'tir (birden fazla kez çalıştırılabilir)

-- Enum türleri (PostgreSQL)
DO $$ BEGIN
  CREATE TYPE plan_type AS ENUM ('Free', 'Paid');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('Pending', 'Success', 'Failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_plan_type AS ENUM ('OneTime', 'Monthly');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users tablosu
CREATE TABLE IF NOT EXISTS "Users" (
    "Id"                  uuid          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "Email"               varchar(255)  NOT NULL,
    "FullName"            varchar(255)  NOT NULL DEFAULT '',
    "Plan"                varchar(20)   NOT NULL DEFAULT 'Free',
    "CreatedAt"           timestamptz   NOT NULL DEFAULT now(),
    "AiRequestsToday"     integer       NOT NULL DEFAULT 0,
    "AiRequestsResetAt"   timestamptz   NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_Email" ON "Users" ("Email");

-- CVs tablosu
CREATE TABLE IF NOT EXISTS "CVs" (
    "Id"          uuid          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "UserId"      uuid          NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
    "Title"       varchar(255)  NOT NULL DEFAULT 'Yeni CV',
    "Template"    varchar(50)   NOT NULL DEFAULT 'modern',
    "Language"    varchar(10)   NOT NULL DEFAULT 'tr',
    "IsPublic"    boolean       NOT NULL DEFAULT false,
    "AtsScore"    integer       NOT NULL DEFAULT 0,
    "CreatedAt"   timestamptz   NOT NULL DEFAULT now(),
    "UpdatedAt"   timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "IX_CVs_UserId" ON "CVs" ("UserId");

-- CVData (sections) tablosu
CREATE TABLE IF NOT EXISTS "CVData" (
    "Id"          uuid          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "CvId"        uuid          NOT NULL REFERENCES "CVs"("Id") ON DELETE CASCADE,
    "SectionType" varchar(50)   NOT NULL,
    "Content"     jsonb         NOT NULL DEFAULT '{}',
    "SortOrder"   integer       NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS "IX_CVData_CvId" ON "CVData" ("CvId");

-- Payments tablosu
CREATE TABLE IF NOT EXISTS "Payments" (
    "Id"            uuid            NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "UserId"        uuid            NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
    "IyzicoToken"   varchar(255),
    "Amount"        decimal(10,2)   NOT NULL,
    "Currency"      varchar(3)      NOT NULL DEFAULT 'TRY',
    "Status"        varchar(20)     NOT NULL DEFAULT 'Pending',
    "PlanType"      varchar(20)     NOT NULL,
    "CreatedAt"     timestamptz     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "IX_Payments_IyzicoToken"
    ON "Payments" ("IyzicoToken")
    WHERE "IyzicoToken" IS NOT NULL;
