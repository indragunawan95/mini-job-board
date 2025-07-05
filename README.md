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