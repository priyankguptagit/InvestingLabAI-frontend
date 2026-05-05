import axiosInstance from '@/lib/axios';
import { API_ENDPOINTS } from '@/lib/constants';
import { PlanName, Duration } from '@/config/pricing.config';

export interface VerifyOrderData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  planName: PlanName;
  duration: Duration;
  isTrial?: boolean;
  referralCode?: string;
}

export const referralApi = {
  validateCode: async (code: string) => {
    const response = await axiosInstance.post(API_ENDPOINTS.REFERRAL.VALIDATE, { code });
    return response.data;
  },
  generateCode: async (discountPercent: number) => {
    const response = await axiosInstance.post(API_ENDPOINTS.REFERRAL.GENERATE, { discountPercent });
    return response.data;
  },
  getMyCodes: async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.REFERRAL.MY_CODES);
    return response.data;
  },
  getAllCodes: async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.REFERRAL.ALL_CODES);
    return response.data;
  },
  getHistory: async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.REFERRAL.HISTORY);
    return response.data;
  },
  getAllHistory: async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.REFERRAL.ALL_HISTORY);
    return response.data;
  },
  getEmployeePerformance: async (employeeId: string) => {
    const response = await axiosInstance.get(API_ENDPOINTS.REFERRAL.EMPLOYEE_PERFORMANCE(employeeId));
    return response.data;
  },
  toggleStatus: async (codeId: string) => {
    const response = await axiosInstance.patch(API_ENDPOINTS.REFERRAL.TOGGLE_STATUS(codeId));
    return response.data;
  }
};

export const paymentApi = {
  /** Create a one-time Razorpay order for a plan + duration */
  createOrder: async (planName: PlanName, duration: Duration, referralCode?: string) => {
    const response = await axiosInstance.post(API_ENDPOINTS.PAYMENT.CREATE_ORDER, { planName, duration, referralCode });
    return response.data;
  },

  /** Activate 7-day free trial (no payment — direct server activation) */
  trial: async (planName: PlanName) => {
    const response = await axiosInstance.post(API_ENDPOINTS.PAYMENT.TRIAL, { planName });
    return response.data;
  },

  /** Verify a one-time order payment after Razorpay checkout */
  verify: async (data: VerifyOrderData) => {
    const response = await axiosInstance.post(API_ENDPOINTS.PAYMENT.VERIFY, data);
    return response.data;
  },

  /** Admin: full payment ledger (paginated) */
  getHistory: async (page = 1, limit = 20) => {
    const response = await axiosInstance.get(API_ENDPOINTS.PAYMENT.HISTORY, { params: { page, limit } });
    return response.data;
  },

  /** Admin: payment history for a specific user */
  getUserHistory: async (userId: string) => {
    const response = await axiosInstance.get(API_ENDPOINTS.PAYMENT.USER_HISTORY(userId));
    return response.data;
  },

  /** User: own payment history (for invoice download) */
  getMyHistory: async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.PAYMENT.MY_HISTORY);
    return response.data;
  },
};