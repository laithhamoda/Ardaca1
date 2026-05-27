const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ardaca_access_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...(options.headers ?? {}),
    },
    credentials: 'include',
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json();
}

export async function login(email: string, password: string) {
  const payload = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem('ardaca_access_token', payload.accessToken);
  localStorage.setItem('ardaca_refresh_token', payload.refreshToken);
  return payload;
}

export async function register(data: { email: string; fullName: string; organisationName: string; countryCode: string; password: string }) {
  const payload = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  localStorage.setItem('ardaca_access_token', payload.accessToken);
  localStorage.setItem('ardaca_refresh_token', payload.refreshToken);
  return payload;
}

export async function getDashboardData() {
  try {
    return await apiFetch('/projects');
  } catch (error) {
    return {
      activeProjects: 12,
      pendingApprovals: 8,
      documents: 42,
      teamMembers: 65,
      notifications: [
        { id: '1', title: 'New approval requested', message: 'Project A requires your review.', read: false },
        { id: '2', title: 'Document version uploaded', message: 'Sheet package 2.0 is ready.', read: false },
      ],
      insights: [
        { title: 'Cost variance', highlight: 'Low risk', summary: 'Your pipeline is tracking within expected margins for the next quarter.' },
        { title: 'Approval velocity', highlight: 'Strong', summary: 'Approval throughput is ahead of plan for your core projects.' },
      ],
    };
  }
}

export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('ardaca_access_token');
    localStorage.removeItem('ardaca_refresh_token');
    window.location.href = '/login';
  }
}
