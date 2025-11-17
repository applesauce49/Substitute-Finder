const API_BASE = process.env.REACT_APP_API_URL;

export const URLS = {
    apiBase: API_BASE,
    apiURL: `${API_BASE}/graphql`,
    googleAuth: `${API_BASE}/auth/google`,
    googleCallback: `${API_BASE}/auth/google/callback`,
    jobs: `${API_BASE}/jobs`,
    jobsReport: `${API_BASE}/jobs/report`,
}