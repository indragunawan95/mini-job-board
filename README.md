# Mini Job Board

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

### Setup Supabase Credential in .env file
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
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
    title VARCHAR(255),          -- Corrected type
    company_name VARCHAR(255),   -- Corrected type
    description TEXT,            -- This was already correct
    location_country VARCHAR(255), -- Corrected type
    location_state VARCHAR(255),   -- Corrected type
    location_city VARCHAR(255),    -- Corrected type
    job_type public.job_type,    -- This was already correct
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
