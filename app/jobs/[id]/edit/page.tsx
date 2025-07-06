'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-toastify';
import JobForm from '@/components/job-form';
import { Job, JobFormData } from '@/types/job';

// Helper to convert DB data (snake_case) to form data (camelCase)
const transformToFormData = (job: Job): JobFormData => ({
  id: job.id,
  title: job.title,
  companyName: job.company_name,
  description: job.description,
  locationCountry: job.location_country,
  locationState: job.location_state,
  locationCity: job.location_city,
  jobType: job.job_type,
});

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [jobData, setJobData] = useState<JobFormData | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) return;

      const supabase = createClient();
      const { data, error } = await supabase.from('jobs').select('*').eq('id', jobId).single();

      if (error) {
        toast.error('Failed to fetch job data.');
        setIsLoading(false);
        router.push('/dashboard');
      } else if (data) {
        setJobData(transformToFormData(data));
        setIsLoading(false);
      }
    };

    fetchJob();
  }, [jobId, router]);

  const handleUpdateJob = async (formData: JobFormData) => {
    setIsSubmitting(true);
    const supabase = createClient();

    const payload = {
      title: formData.title,
      company_name: formData.companyName,
      description: formData.description,
      location_country: formData.locationCountry,
      location_state: formData.locationState,
      location_city: formData.locationCity,
      job_type: formData.jobType,
    };

    const { error } = await supabase.from('jobs').update(payload).eq('id', formData.id!);

    if (error) {
      toast.error(`Failed to update job: ${error.message}`);
    } else {
      toast.success('Job updated successfully!');
      router.push(`/jobs/${formData.id}`);
    }

    setIsSubmitting(false);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!jobData) {
    return <div>Job not found.</div>;
  }

  return (
    <div>
      <JobForm
        initialData={jobData}
        onSubmit={handleUpdateJob}
        isSubmitting={isSubmitting}
        submitButtonText="Update Job"
      />
    </div>
  );
}
