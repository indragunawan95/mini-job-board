# Mini Job Board

## Setup Instructions

### Install dependency

```
npm install
```

### Setup Supabase Credentials in .env File

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Setup Supabase Database

```
CREATE TYPE public.job_type AS ENUM (
  'Full-Time',
  'Part-Time',
  'Contract'
);

CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  location_country VARCHAR(255) NOT NULL,
  location_state VARCHAR(255) NOT NULL,
  location_city VARCHAR(255) NOT NULL,
  job_type public.job_type NOT NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### Setup Full Text Search for feature Search in Description

```
-- 1. Add a tsvector column for EACH supported language
ALTER TABLE jobs ADD COLUMN tsvector_en tsvector;
ALTER TABLE jobs ADD COLUMN tsvector_id tsvector;
-- Add more for other languages like 'tsvector_fr', 'tsvector_de', etc.

-- 2. Create ONE trigger function that populates ALL columns
CREATE OR REPLACE FUNCTION update_all_tsvectors()
RETURNS TRIGGER AS $$
BEGIN
  -- Always generate a vector for every supported language, regardless of the post's content
  new.tsvector_en := to_tsvector('english', new.description);
  new.tsvector_id := to_tsvector('indonesian', new.description);
  -- Add more lines here for other languages
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- 3. Create the trigger
CREATE TRIGGER jobs_tsvector_update
BEFORE INSERT OR UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION update_all_tsvectors();

-- 4. Create an index for EACH tsvector column for performance
CREATE INDEX idx_jobs_tsvector_en ON jobs USING GIN(tsvector_en);
CREATE INDEX idx_jobs_tsvector_id ON jobs USING GIN(tsvector_id);
```

### Setup Postgres RPC function to query Browse Job in supabase backend

```
CREATE OR REPLACE FUNCTION search_jobs(
    p_search_term TEXT,
    p_job_type TEXT,
    p_location_country TEXT,
    p_location_state TEXT,
    p_user_id UUID,
    p_page_size INT,
    p_page_number INT
)
RETURNS TABLE (
    -- These definitions now EXACTLY match your 'jobs' table schema
    id UUID,
    created_at TIMESTAMPTZ,
    user_id UUID,
    title VARCHAR(255),
    company_name VARCHAR(255),
    description TEXT,
    location_country VARCHAR(255),
    location_state VARCHAR(255),
    location_city VARCHAR(255),
    job_type public.job_type,
    total_rows BIGINT
)
AS $$
BEGIN
    RETURN QUERY
    WITH filtered_jobs AS (
        SELECT
            j.*,
            COUNT(*) OVER() AS total_rows
        FROM jobs j
        WHERE
            (
                p_search_term IS NULL OR p_search_term = '' OR
                j.tsvector_en @@ websearch_to_tsquery('english', p_search_term) OR
                j.tsvector_id @@ websearch_to_tsquery('indonesian', p_search_term)
            )
            AND (p_job_type IS NULL OR p_job_type = '' OR j.job_type = p_job_type::public.job_type)
            AND (p_location_country IS NULL OR p_location_country = '' OR j.location_country = p_location_country)
            AND (p_location_state IS NULL OR p_location_state = '' OR j.location_state = p_location_state)
            AND (p_user_id IS NULL OR j.user_id = p_user_id)
    )
    SELECT
        f.id,
        f.created_at,
        f.user_id,
        f.title,
        f.company_name,
        f.description,
        f.location_country,
        f.location_state,
        f.location_city,
        f.job_type,
        f.total_rows
    FROM filtered_jobs f
    ORDER BY f.created_at DESC
    LIMIT p_page_size
    OFFSET (p_page_number - 1) * p_page_size;
END;
$$ LANGUAGE plpgsql;
```

### Migrate existing data description to tsvector

```
UPDATE jobs
SET
    tsvector_en = to_tsvector('english', description),
    tsvector_id = to_tsvector('indonesian', description)
WHERE
    -- This WHERE clause is a safety measure. It ensures we only update rows
    -- that haven't been processed yet. This makes the script "idempotent".
    tsvector_en IS NULL OR tsvector_id IS NULL;
```

### Run the application

```
npm run dev
```

## Technical Approach

The Mini Job Board was designed as a production-grade MVP following modern full-stack architecture patterns. The implementation focuses on maintainability, type safety, and clear separation of concerns while maintaining developer ergonomics.

### Key Technical Decisions

1. **Full-Stack Type Safety**
   - TypeScript interfaces shared between frontend and database schema
   - Database type generation via Supabase CLI
   - Strict ESLint/TypeScript compiler rules

2. **Hybrid Rendering Strategy**
   - React Server Components for initial page loads
   - Client-side hydration for interactive elements
   - Static site generation for job listings

3. **Search Architecture Tradeoffs**
   - PostgreSQL full-text search over dedicated search engines (ES/Meilisearch)
   - Multilingual support via parallel TSVECTOR columns
   - Trigger-based index maintenance for simplicity

4. **Authentication Pattern**
   - Cookie-based sessions with middleware encryption
   - Server-side auth validation for protected routes

### Architecture Breakdown

#### Directory Structure

**Core Directories**

```
app/              # Application routes and page components (Next.js app router)
components/       # Reusable UI components organized by feature
lib/              # Shared utilities and service integrations
types/            # TypeScript type definitions and interfaces
```

**Feature Areas**

- **Authentication**: All user management flows (login, signup, password reset)
- **Job Management**: Job posting creation, browsing, and editing functionality
- **Data Layer**: Supabase database integration and API handlers

**Support Structure**

- `public/`: Static assets (images, icons)
- `hooks/`: Custom React hooks for shared logic
- Configuration files: Environment variables and project settings

#### Frontend Layer Architecture

```
Next.js App Router
├─ React Server Components
│  ├─ Page Layouts
│  │  ├─ Authentication Flows
│  │  └─ Job Management
└─ Client Components
   ├─ Debounced Search
   ├─ Location Filtering
   └─ Form Handling
```

**Key Components:**

- Core Framework: Next.js 14, React 18, TypeScript 5
- State Management: URL parameters for filter management
- UI System: Tailwind CSS with Daisy UI
- Form System: React Hook Form

#### Backend Services Architecture

```
Supabase Platform
├─ PostgreSQL Database
│  ├─ Row-Level Security Policies
│  └─ PostgreSQL Functions
│     ├─ Search Jobs Procedure
│     └─ TSVECTOR Update Triggers
└─ Authentication Service
   ├─ Email/Password Auth
   └─ Magic Links
```

- **Database Schema**: Structured with job_type enum for position categories
- **Search Features**:
  - Multi-language support via TSVECTOR
  - Combined search filters
  - Database-side pagination
- **Security**: Row-level security policies for data isolation

### Cross-Cutting Concerns

1. **Performance**:
   - Debounced search inputs (300ms)
   - Database-side pagination
   - Lazy-loaded rich text editor

2. **Security**:

- Environment variable encryption
- Password hashing via Supabase Auth

3. **Maintainability**:
   - Atomic component design
   - Dedicated hooks directory
   - Shared TypeScript definitions
   - ESLint/Prettier unified config

## What would you improve if given more time?

| Area       | Current Implementation | Proposed Improvement         | Benefit                    |
| ---------- | ---------------------- | ---------------------------- | -------------------------- |
| Search     | PostgreSQL TSVECTOR    | Dedicated search engine      | Better language support    |
| Testing    | Manual verification    | Jest/Cypress test suite      | Regression prevention      |
| Security   | Basic RLS policies     | Fine-grained access controls | Better tenant isolation    |
| Analytics  | None                   | Basic event tracking         | Usage insights             |
| CI/CD      | Manual deployment      | CI/CD pipeline               | Automated deployments      |
| Job Skills | None                   | NLP-based skill extraction   | Better search capabilities |
