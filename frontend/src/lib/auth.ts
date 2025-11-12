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
  try {
    // Clear known auth/user-related keys
    const keysToRemove = [
      // Auth tokens and user
      "auth_token",
      "token",
      "user",
      "user_id",
      "user_role",
      "fullName",
      "username",
      "seller_id",
      "customer_id",
      "userId",
      // App-specific persisted data that may include user info
      "orderFormData",
      "lastViewedJobId",
      "he_chat_guest_id",
    ];

    keysToRemove.forEach((k) => localStorage.removeItem(k));

    // Session storage keys used around auth/flow
    const sessionKeysToRemove = [
      "auth_token",
      "auth_email",
      "locked_user_info",
    ];
    sessionKeysToRemove.forEach((k) => sessionStorage.removeItem(k));

    // As a safety net, clear storages to avoid any leftover data
    localStorage.clear?.();
    sessionStorage.clear?.();
  } catch (err) {
    // No-op: storage may be unavailable in some environments
  }
};
