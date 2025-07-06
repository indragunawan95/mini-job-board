// Represents the data structure used within our form (camelCase)
export type JobFormData = {
  id?: string; // Optional, will exist for updates
  title: string;
  companyName: string;
  description: string;
  locationCountry: string;
  locationState: string;
  locationCity: string;
  jobType: string;
};

// Represents the data structure in your Supabase table (snake_case)
export type Job = {
  id: string;
  user_id: string;
  created_at: string;
  title: string;
  company_name: string;
  description: string;
  location_country: string;
  location_state: string;
  location_city: string;
  job_type: string;
};
