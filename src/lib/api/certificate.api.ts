import axiosInstance from '../axios';

export interface Certificate {
  _id: string;
  user: string;
  organization?: string;
  certificateNumber: string;
  certificateUrl: string;
  startDate: string;
  endDate: string;
  issuedAt: string;
  planName: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface CertificatesResponse {
  success: boolean;
  data: Certificate[];
}

export const certificateApi = {
  // Get all certificates for the current user
  getMyCertificates: async () => {
    const response = await axiosInstance.get<CertificatesResponse>('/api/certificates/my');
    return response.data;
  },

  validateCertificate: async (certificateCode: string, userName: string) => {
    const response = await axiosInstance.post('/api/certificates/validate', { certificateCode, userName });
    return response.data;
  },
};
