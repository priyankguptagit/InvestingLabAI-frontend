import axios from 'axios';
import axiosInstance from '../axios';

import { BACKEND_URL } from '@/lib/constants';

export const careerApi = {
  submitApplication: async (formData: FormData) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/careers/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || new Error('Failed to submit application');
    }
  },

  getAllApplications: async () => {
    try {
      const response = await axiosInstance.get('/api/careers');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || new Error('Failed to fetch applications');
    }
  },

  updateApplicationStatus: async (id: string, status: string) => {
    try {
      const response = await axiosInstance.put(`/api/careers/${id}/status`, { status });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || new Error('Failed to update application status');
    }
  },

  /**
   * Triggers a real file download via the backend proxy.
   * The backend fetches the PDF from Cloudinary and streams it back with
   * Content-Disposition: attachment so the browser saves the file.
   */
  downloadResume: (id: string, candidateName: string) => {
    // Build the URL with credentials baked in via the axiosInstance base URL
    const baseURL = (axiosInstance.defaults.baseURL || '').replace(/\/$/, '');
    const url = `${baseURL}/api/careers/${id}/download-resume`;

    // Trigger download via a temporary anchor — credentials (cookies) are
    // included because the endpoint is on the same origin as the API.
    const a = document.createElement('a');
    a.href = url;
    a.download = `${candidateName.replace(/\s+/g, '_')}_Resume.pdf`;
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },
};
