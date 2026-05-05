import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from './constants';
import { sessionManager } from './sessionManager';

const AUTH_SESSION_KEY = 'praedico_auth_session_type';
const COMPANY_SESSION_KEY = 'praedico_company_member';

const isCompanySession = () => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(COMPANY_SESSION_KEY);
};

const getSessionType = (): 'user' | 'organization' | 'coordinator' => {
  const stored = localStorage.getItem(AUTH_SESSION_KEY);

  if (stored === 'organization' || stored === 'coordinator' || stored === 'user') {
    return stored;
  }
  if (localStorage.getItem('coordinator')) return 'coordinator';
  if (localStorage.getItem('organization')) return 'organization';
  return 'user';
};

const getRefreshEndpoint = () => {
  if (isCompanySession()) return API_ENDPOINTS.COMPANY.REFRESH_TOKEN;
  const sessionType = getSessionType();
  if (sessionType === 'organization') return API_ENDPOINTS.ORGANIZATION.REFRESH_TOKEN;
  if (sessionType === 'coordinator') return API_ENDPOINTS.COORDINATOR.REFRESH_TOKEN;
  return API_ENDPOINTS.AUTH.REFRESH_TOKEN;
};

/**
 * Clears all non-sensitive auth metadata from localStorage.
 * accessToken is intentionally NOT stored in localStorage —
 * it lives exclusively in an HttpOnly cookie (immune to XSS).
 */
const clearStoredAuth = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('organization');
  localStorage.removeItem('admin');
  localStorage.removeItem('coordinator');
  localStorage.removeItem(AUTH_SESSION_KEY);
};

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // withCredentials: true sends the HttpOnly accessToken cookie
  // automatically on every request — no localStorage needed.
  withCredentials: true,
});

// ── Request Interceptor ─────────────────────────────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    // NOTE: accessToken is sent automatically via the HttpOnly cookie.
    // We do NOT read it from localStorage (that would be an XSS attack surface).
    // The backend's authorize() guard reads from req.cookies.accessToken first.

    // For admin routes, add the secret header
    if (config.url?.includes('/admin')) {
      const adminKey = process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY;
      if (adminKey) {
        config.headers['X-Uplink-Security'] = adminKey;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ────────────────────────────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => {
    // Feed server-provided session expiry to the SessionManager
    const expiresAt = response.headers['x-session-expires-at'];
    if (expiresAt) {
      sessionManager.updateExpiry(expiresAt);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if this is a session-specific expiry (not just an expired JWT)
    const errorCode = error.response?.data?.code;
    if (
      errorCode === 'SESSION_IDLE_EXPIRED' ||
      errorCode === 'SESSION_HARD_CAP' ||
      errorCode === 'SESSION_INVALID'
    ) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('session:expired'));
      }
      return Promise.reject(error);
    }

    // 401 handling: attempt a token refresh using the HttpOnly refreshToken cookie
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // The refresh endpoint reads the refreshToken HttpOnly cookie and
        // responds with a new accessToken HttpOnly cookie — no localStorage involved.
        await axios.post(
          `${API_BASE_URL}${getRefreshEndpoint()}`,
          {},
          { withCredentials: true }
        );

        // Retry the original request — the browser will now send the new cookie
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh token itself expired — clear UI state and prompt re-login
        clearStoredAuth();
        if (typeof window !== 'undefined') {
          // Company sessions should redirect to the staff portal, not the user login modal
          if (isCompanySession()) {
            localStorage.removeItem('praedico_company_member');
            window.location.href = '/admin/staff-access-portal';
          } else {
            window.dispatchEvent(new Event('open-login-modal'));
          }
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
