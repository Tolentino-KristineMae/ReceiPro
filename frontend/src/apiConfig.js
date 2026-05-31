const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const normalizePath = (path) => path.startsWith('/') ? path : `/${path}`;

export const getApiUrl = (path) => `${API_BASE_URL}${normalizePath(path)}`;
export const getStorageUrl = (path) => `${API_BASE_URL}${normalizePath(path)}`;

export const apiFetch = async (path, init) => {
	const res = await fetch(getApiUrl(path), init);
	if (res.status === 409) {
		// Try to parse response JSON for details
		let body = null;
		try { body = await res.json(); } catch (e) { /* ignore */ }
		const msg = body && body.message ? body.message : (body && body.error ? body.error : 'Conflict');
		const detail = body && body.claimed_batch_id ? ` (claimed by batch ${body.claimed_batch_id})` : '';
		// Show a friendly alert to the user instead of failing silently
		if (typeof window !== 'undefined' && window.alert) {
			window.alert(`${msg}${detail}`);
		}
		// Reject so callers can handle it if needed
		throw Object.assign(new Error(msg), { status: 409, body });
	}

	return res;
};

export default API_BASE_URL;
