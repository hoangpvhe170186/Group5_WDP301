// Utility functions for authentication

/**
 * Get the current logged-in user ID from localStorage
 * @returns string | null - User ID if logged in, null otherwise
 */
export const getCurrentUserId = (): string | null => {
  return localStorage.getItem("user_id");
};

/**
 * Get the current logged-in user role from localStorage
 * @returns string | null - User role if logged in, null otherwise
 */
export const getCurrentUserRole = (): string | null => {
  return localStorage.getItem("user_role");
};

/**
 * Get the current auth token from localStorage
 * @returns string | null - Auth token if logged in, null otherwise
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem("auth_token");
};

/**
 * Check if user is currently logged in
 * @returns boolean - true if logged in, false otherwise
 */
export const isLoggedIn = (): boolean => {
  const token = getAuthToken();
  const userId = getCurrentUserId();
  return !!(token && userId);
};

/**
 * Clear all authentication data from localStorage
 */
export const clearAuthData = (): void => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("user_id");
  localStorage.removeItem("user_role");
  sessionStorage.removeItem("auth_email");
};
