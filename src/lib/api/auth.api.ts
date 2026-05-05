import axiosInstance from '../axios';
import { API_ENDPOINTS } from '../constants';

const AUTH_SESSION_KEY = 'praedico_auth_session_type';

export interface RegisterData {
  email: string;
  name: string;
  organizationId?: string;
  departmentId?: string;
}

export interface VerifyData {
  token: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}
export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}


export const authApi = {
  register: async (data: RegisterData) => {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.REGISTER, data);
    return response.data;
  },

  verify: async (data: VerifyData) => {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.VERIFY, data);
    return response.data;
  },


  // NEW: Change Password (for logged-in users)
  changePassword: async (data: ChangePasswordData) => {
    const response = await axiosInstance.put('/api/users/reset-password', data);
    return response.data;
  },

  login: async (data: LoginData) => {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.LOGIN, data);

    // Store only non-sensitive UI metadata — accessToken stays in HttpOnly cookie only
    localStorage.setItem(AUTH_SESSION_KEY, 'user');
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    // Signal session timeout hook to start monitoring
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('login_success'));

      // Feed session expiry immediately so countdown starts without waiting
      if (response.data.sessionExpiresAt) {
        import('@/lib/sessionManager').then(({ sessionManager }) => {
          sessionManager.updateExpiry(response.data.sessionExpiresAt);
        });
      }
    }

    return response.data;
  },

  logout: async () => {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.LOGOUT);
    // Backend clears the HttpOnly cookie — we just clear UI metadata
    localStorage.removeItem('user');
    localStorage.removeItem(AUTH_SESSION_KEY);
    return response.data;
  },

  forgotPassword: async (data: ForgotPasswordData) => {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, data);
    return response.data;
  },

  resetPassword: async (data: ResetPasswordData) => {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, data);
    return response.data;
  },

  getMe: async () => {
    // This uses the configured axios instance (which points to /api via proxy)
    const response = await axiosInstance.get('/api/users/me');
    return response.data;
  },

  refreshToken: async () => {
    // The backend responds with a new accessToken HttpOnly cookie
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN);
    return response.data;
  },
};
