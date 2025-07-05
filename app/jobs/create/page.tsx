'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from "@/lib/supabase/client";
import { toast } from 'react-toastify';
import JobForm from '@/components/job-form';
import { JobFormData } from '@/types/job';

export default function CreateJobPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreateJob = async (formData: JobFormData) => {
        setIsSubmitting(true);
        const supabase = createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            toast.error("You must be logged in to create a job.");
            setIsSubmitting(false);
            return;
        }

        const payload = {
            title: formData.title,
            company_name: formData.companyName,
            description: formData.description,
            location_country: formData.locationCountry,
            location_state: formData.locationState,
            location_city: formData.locationCity,
            job_type: formData.jobType,
            user_id: user.id
        };

        const { error } = await supabase.from('jobs').insert(payload);

        if (error) {
            toast.error(`Failed to create job: ${error.message}`);
        } else {
            toast.success("Job created successfully!");
            router.push('/jobs');
        }

        setIsSubmitting(false);
    };

    return (
        <div>
            <JobForm
                onSubmit={handleCreateJob}
                isSubmitting={isSubmitting}
                submitButtonText="Create Job"
            />
        </div>
    );
}