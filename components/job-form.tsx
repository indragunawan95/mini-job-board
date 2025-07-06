'use client';

import React, { useState, useEffect } from 'react';
import { JobFormData } from '@/types/job';
import { useLocationSelector } from '@/hooks/useLocationSelector';
import RichTextEditor from '@/components/rich-text-editor';

// --- Component Props ---
interface JobFormProps {
  initialData?: JobFormData;
  onSubmit: (data: JobFormData) => Promise<void>;
  isSubmitting: boolean;
  submitButtonText?: string;
}

const defaultFormData: JobFormData = {
  title: '',
  companyName: '',
  description: '',
  locationCountry: '',
  locationState: '',
  locationCity: '',
  jobType: '',
};

// --- The Form Component ---
export default function JobForm({
  initialData = defaultFormData,
  onSubmit,
  isSubmitting,
  submitButtonText = 'Submit',
}: JobFormProps) {
  const [formData, setFormData] = useState<JobFormData>(initialData);

  // Sync state with prop changes (important for edit forms)
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const { countries, states, cities } = useLocationSelector(
    formData.locationCountry,
    formData.locationState,
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDescriptionChange = (richText: string) => {
    setFormData((prev) => ({ ...prev, description: richText }));
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      locationCountry: e.target.value,
      locationState: '', // Reset state
      locationCity: '', // Reset city
    }));
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      locationState: e.target.value,
      locationCity: '', // Reset city
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="card bg-base-100 shadow-xl p-6 rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* --- Page Details Section --- */}
        <div>
          <h2 className="text-2xl font-semibold mb-2">Job Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                <span className="label-text">Title</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                className="input input-bordered w-full"
                placeholder="Job Title"
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text">Company Name</span>
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                className="input input-bordered w-full"
                placeholder="Company Name"
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          <div>
            <label className="label">
              <span className="label-text">Description</span>
            </label>
            <RichTextEditor value={formData.description} onChange={handleDescriptionChange} />
          </div>
        </div>

        {/* --- Location Section --- */}
        <div>
          <h2 className="text-2xl font-semibold mb-2">Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">
                <span className="label-text">Country</span>
              </label>
              <select
                name="locationCountry"
                value={formData.locationCountry}
                onChange={handleCountryChange}
                className="select select-bordered w-full"
                required
              >
                <option value="">Select Country</option>
                {countries.map((country) => (
                  <option key={country.isoCode} value={country.isoCode}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">
                <span className="label-text">State / Province</span>
              </label>
              <select
                name="locationState"
                value={formData.locationState}
                onChange={handleStateChange}
                disabled={!formData.locationCountry}
                className="select select-bordered w-full"
                required
              >
                <option value="">Select State</option>
                {states.map((state) => (
                  <option key={state.isoCode} value={state.isoCode}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">
                <span className="label-text">City</span>
              </label>
              <select
                name="locationCity"
                value={formData.locationCity}
                onChange={handleInputChange}
                disabled={!formData.locationState}
                className="select select-bordered w-full"
                required
              >
                <option value="">Select City</option>
                {cities.map((city) => (
                  <option key={city.name} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* --- Job Type Section --- */}
        <div>
          <h2 className="text-2xl font-semibold mb-2">Job Type</h2>
          <select
            name="jobType"
            className="select select-bordered w-full"
            value={formData.jobType}
            onChange={handleInputChange}
            required
          >
            <option value="" disabled>
              Pick a job type
            </option>
            <option>Full-Time</option>
            <option>Part-Time</option>
            <option>Contract</option>
          </select>
        </div>

        {/* --- Submit Button --- */}
        <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : submitButtonText}
        </button>
      </form>
    </div>
  );
}
