'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Job } from '@/types/job'
import { toast } from 'react-toastify'
import { User } from '@supabase/supabase-js'
import { Country } from 'country-state-city'
import DOMPurify from 'dompurify';

// Helper to get country name from ISO code
const getCountryName = (isoCode: string) => {
    const country = Country.getCountryByCode(isoCode);
    return country ? country.name : isoCode;
};

export default function ViewDetailJobPage() {
    const params = useParams();
    const router = useRouter();
    const jobId = params.id as string;

    const [job, setJob] = useState<Job | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isOwner = user && job && user.id === job.user_id;

    const fetchJobDetails = useCallback(async () => {
        setIsLoading(true);
        const supabase = createClient();

        // Fetch current user in parallel
        const userPromise = supabase.auth.getUser();

        // Fetch job data
        const jobPromise = supabase
            .from('jobs')
            .select('*')
            .eq('id', jobId)
            .single();

        const [{ data: { user } }, { data: jobData, error: jobError }] = await Promise.all([userPromise, jobPromise]);

        setUser(user);

        if (jobError) {
            setError("Job not found or there was an error loading it.");
            console.error(jobError);
            setJob(null);
        } else {
            setJob(jobData);
            setError(null);
        }

        setIsLoading(false);
    }, [jobId]);

    useEffect(() => {
        if (jobId) {
            fetchJobDetails();
        }
    }, [jobId, fetchJobDetails]);

    const handleDelete = async () => {
        if (!job || !isOwner) return;

        if (!window.confirm("Are you sure you want to permanently delete this job post? This action cannot be undone.")) {
            return;
        }

        const supabase = createClient();
        const { error: deleteError } = await supabase.from('jobs').delete().eq('id', job.id);

        if (deleteError) {
            toast.error(`Failed to delete job: ${deleteError.message}`);
        } else {
            toast.success("Job successfully deleted.");
            router.push('/jobs'); // Redirect to the browse page
        }
    };


    if (isLoading) {
        return <JobDetailSkeleton />;
    }

    if (error) {
        return (
            <div className="container mx-auto p-8 text-center">
                <div role="alert" className="alert alert-error">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2 2m2-2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{error}</span>
                </div>
                <Link href="/jobs" className="btn btn-primary mt-6">Back to All Jobs</Link>
            </div>
        );
    }

    if (!job) {
        // This can happen if the job is null but there's no error, e.g. .single() returns no data.
        return notFound();
    }

    return (
        <div className="bg-base-100 min-h-screen">
            <div className="container mx-auto p-4 md:p-8">
                {/* --- Main Content Grid --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Job Description */}
                    <div className="lg:col-span-2 bg-base-200 p-6 rounded-box">
                        <div className="mb-4">
                            <h1 className="text-3xl md:text-4xl font-bold text-primary">{job.title}</h1>
                            <p className="text-xl text-base-content opacity-80">{job.company_name}</p>
                        </div>
                        <div className="divider"></div>
                        <h2 className="text-2xl font-semibold mb-4">Job Description</h2>
                        <div
                            className="prose max-w-none text-base-content opacity-90"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(job.description) }}
                        />
                    </div>

                    {/* Right Column: Summary & Actions */}
                    <div className="lg:col-span-1">
                        <div className="card bg-base-200 shadow-lg">
                            <div className="card-body">
                                <h2 className="card-title">Job Overview</h2>
                                <ul className="space-y-3 mt-4">
                                    <li className="flex items-center gap-3">
                                        <span className="text-xl">📍</span>
                                        <div>
                                            <p className="font-semibold">Location</p>
                                            <p className="text-sm opacity-80">{job.location_city}, {job.location_state}, {getCountryName(job.location_country)}</p>
                                        </div>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="text-xl">💼</span>
                                        <div>
                                            <p className="font-semibold">Job Type</p>
                                            <div className="badge badge-neutral">{job.job_type}</div>
                                        </div>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="text-xl">📅</span>
                                        <div>
                                            <p className="font-semibold">Date Posted</p>
                                            <p className="text-sm opacity-80">{new Date(job.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </li>
                                </ul>

                                {isOwner && (
                                    <>
                                        <div className="divider mt-6">Actions</div>
                                        <div className="card-actions justify-stretch flex-col gap-2">
                                            <Link href={`/jobs/${job.id}/edit`} className="btn btn-secondary w-full">Edit Job</Link>
                                            <button onClick={handleDelete} className="btn btn-error btn-outline w-full">Delete Job</button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}


// A skeleton component for a better loading experience
function JobDetailSkeleton() {
    return (
        <div className="container mx-auto p-4 md:p-8 animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column Skeleton */}
                <div className="lg:col-span-2 bg-base-200 p-6 rounded-box">
                    <div className="skeleton h-10 w-3/4 mb-4"></div>
                    <div className="skeleton h-6 w-1/2 mb-6"></div>
                    <div className="divider"></div>
                    <div className="skeleton h-8 w-1/3 mb-4"></div>
                    <div className="space-y-3">
                        <div className="skeleton h-4 w-full"></div>
                        <div className="skeleton h-4 w-full"></div>
                        <div className="skeleton h-4 w-5/6"></div>
                        <div className="skeleton h-4 w-3/4"></div>
                    </div>
                </div>

                {/* Right Column Skeleton */}
                <div className="lg:col-span-1">
                    <div className="card bg-base-200 shadow-lg">
                        <div className="card-body">
                            <div className="skeleton h-8 w-1/2 mb-6"></div>
                            <div className="space-y-4">
                                <div className="flex gap-4 items-center">
                                    <div className="skeleton w-10 h-10 rounded-full shrink-0"></div>
                                    <div className="flex flex-col gap-2 w-full">
                                        <div className="skeleton h-4 w-1/3"></div>
                                        <div className="skeleton h-4 w-2/3"></div>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <div className="skeleton w-10 h-10 rounded-full shrink-0"></div>
                                    <div className="flex flex-col gap-2 w-full">
                                        <div className="skeleton h-4 w-1/3"></div>
                                        <div className="skeleton h-4 w-1/2"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}