// NightSafe API Configuration
export const API_BASE_URL = "http://localhost:8080/api";

export const ENDPOINTS = {
    AUTH: {
        REGISTER: `${API_BASE_URL}/auth/register`,
        LOGIN: `${API_BASE_URL}/auth/login`,
    },
    CONTACTS: (username) => `${API_BASE_URL}/contacts/${username}`,
    CONTACTS_BY_USER_ID: (userId) => `${API_BASE_URL}/contacts/user/${userId}`,
    CONTACT_BY_ID: (id) => `${API_BASE_URL}/contacts/${id}`,
    TRACKING: {
        SYNC: (username) => `${API_BASE_URL}/tracking/sync?username=${username}`,
        HISTORY: (username) => `${API_BASE_URL}/tracking/history/${username}`,
    }
};
