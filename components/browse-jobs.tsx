'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useLocationSelector } from '@/hooks/useLocationSelector'
import { useDebounce } from '@/hooks/useDebounce'
import { Job } from '@/types/job'
import { toast } from 'react-toastify'
import { User } from '@supabase/supabase-js'

const PAGE_SIZE = 10; // Number of jobs per page

interface Filters {
    description: string;
    jobType: string;
    locationCountry: string;
    locationState: string;
}

interface BrowseJobsProps {
    mode: 'public' | 'dashboard';
}

export default function BrowseJobs({ mode }: BrowseJobsProps) {
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);

    const [filters, setFilters] = useState<Filters>({
        description: '',
        jobType: '',
        locationCountry: '',
        locationState: '',
    });

    const debouncedDescription = useDebounce(filters.description, 500); // 500ms delay

    const { countries, states } = useLocationSelector(filters.locationCountry);

    // Fetch the current user session
    useEffect(() => {
        const getSession = async () => {
            const supabase = createClient();
            const { data } = await supabase.auth.getUser();
            setUser(data.user);
        };
        getSession();
    }, []);

    const fetchJobs = useCallback(async () => {
        // For dashboard mode, if the user isn't loaded yet, don't fetch.
        if (mode === 'dashboard' && !user) {
            setIsLoading(false);
            setJobs([]);
            return;
        }

        setIsLoading(true);
        const supabase = createClient();

        // Prepare the parameters for our RPC call
        const params = {
            p_search_term: debouncedDescription,
            p_job_type: filters.jobType,
            p_location_country: filters.locationCountry,
            p_location_state: filters.locationState,
            p_user_id: mode === 'dashboard' ? user?.id : null, // Pass user_id only in dashboard mode
            p_page_size: PAGE_SIZE,
            p_page_number: currentPage
        };

        // Call the RPC function
        const { data, error } = await supabase.rpc('search_jobs', params);

        if (error) {
            console.error("RPC Error:", error);
            toast.error("Could not fetch jobs: " + error.message);
            setJobs([]);
            setTotalCount(0);
        } else {
            setJobs(data as Job[]);
            // The total count is now returned with every row.
            // We just need to grab it from the first row if it exists.
            setTotalCount(data && data.length > 0 ? data[0].total_rows : 0);
        }

        setIsLoading(false);
    }, [currentPage, debouncedDescription, filters.jobType, filters.locationCountry, filters.locationState, mode, user]);
    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    // Reset page to 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedDescription, filters.jobType, filters.locationCountry, filters.locationState])

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleDelete = async (jobId: string) => {
        if (!window.confirm("Are you sure you want to delete this job post?")) {
            return;
        }

        const supabase = createClient();
        const { error } = await supabase.from('jobs').delete().eq('id', jobId);

        if (error) {
            toast.error("Failed to delete job: " + error.message);
        } else {
            toast.success("Job deleted successfully.");
            // Refetch jobs to update the list
            fetchJobs();
        }
    };

    const handleClick = (id: string) => {
        router.push(`/jobs/${id}`)
    }

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">{ mode === 'dashboard' ? "User's Jobs Posting" : "Browse Jobs"}</h1>
                <Link href={"/jobs/create"} className="btn btn-primary">
                    Post a Job
                </Link>
            </div>

            {/* --- Filters Section --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 mb-6 bg-base-200 rounded-lg">
                <input
                    type="text"
                    name="description"
                    placeholder="Search skill in description..."
                    className="input input-bordered w-full"
                    value={filters.description}
                    onChange={handleFilterChange}
                />
                <select name="jobType" className="select select-bordered" value={filters.jobType} onChange={handleFilterChange}>
                    <option value="">All Job Types</option>
                    <option>Full-Time</option>
                    <option>Part-Time</option>
                    <option>Contract</option>
                </select>
                <select name="locationCountry" className="select select-bordered" value={filters.locationCountry} onChange={handleFilterChange}>
                    <option value="">All Countries</option>
                    {countries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
                </select>
                <select name="locationState" className="select select-bordered" value={filters.locationState} onChange={handleFilterChange} disabled={!filters.locationCountry}>
                    <option value="">All States</option>
                    {states.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                </select>
            </div>

            {/* --- Jobs Table --- */}
            <div className="overflow-x-auto">
                <table className="table w-full">
                    <thead>
                        <tr>
                            <th>Title / Company</th>
                            <th>Location</th>
                            <th>Type</th>
                            {
                                mode === "dashboard" && (
                                    <th>Actions</th>
                                )
                            }
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            // Skeleton loading state
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>
                                    <td colSpan={4}>
                                        <div className="skeleton h-8 w-full"></div>
                                    </td>
                                </tr>
                            ))
                        ) : jobs.length > 0 ? (
                            jobs.map(job => (
                                <tr key={job.id} >
                                    <td className="hover:bg-primary-50 hover:cursor-pointer hover:opacity-90" onClick={() => handleClick(job.id)}>
                                        <div className="font-bold">{job.title}</div>
                                        <div className="text-sm opacity-70">{job.company_name}</div>
                                    </td>
                                    <td>{job.location_city}, {job.location_state}</td>
                                    <td><span className="badge badge-ghost badge-sm">{job.job_type}</span></td>
                                    {mode === "dashboard" && user && user.id === job.user_id && (
                                        <td>
                                            <div className="flex gap-2">
                                                <Link href={`/jobs/${job.id}/edit`} className="btn btn-ghost btn-xs">Edit</Link>
                                                <button onClick={() => handleDelete(job.id)} className="btn btn-error btn-xs">Delete</button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="text-center p-8">No jobs found matching your criteria.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- Pagination Controls --- */}
            {!isLoading && totalPages > 1 && (
                <div className="flex justify-center mt-6">
                    <div className="btn-group">
                        <button
                            className="btn"
                            onClick={() => setCurrentPage(p => p - 1)}
                            disabled={currentPage === 1}
                        >
                            «
                        </button>
                        <button className="btn">Page {currentPage} of {totalPages}</button>
                        <button
                            className="btn"
                            onClick={() => setCurrentPage(p => p + 1)}
                            disabled={currentPage === totalPages}
                        >
                            »
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}