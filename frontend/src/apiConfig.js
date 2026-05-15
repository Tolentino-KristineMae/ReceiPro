const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const normalizePath = (path) => path.startsWith('/') ? path : `/${path}`;

export const getApiUrl = (path) => `${API_BASE_URL}${normalizePath(path)}`;
export const getStorageUrl = (path) => `${API_BASE_URL}${normalizePath(path)}`;

export const apiFetch = (path, init) => fetch(getApiUrl(path), init);

export default API_BASE_URL;
