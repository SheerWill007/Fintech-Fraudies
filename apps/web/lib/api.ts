const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export async function fetchTransactions() {
  if (typeof window === 'undefined') {
    throw new Error('fetchTransactions can only be called on client side');
  }
  
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/transactions`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch transactions');
  }

  return response.json();
}

export async function login(email: string, password: string) {
  if (typeof window === 'undefined') {
    throw new Error('login can only be called on client side');
  }
  
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    let message = 'Login failed';
    try {
      const error = await response.json();
      const m = error.message;
      message = Array.isArray(m) ? m.join(', ') : (m ?? message);
    } catch {
      /* ignore non-JSON body */
    }
    throw new Error(typeof message === 'string' ? message : 'Login failed');
  }

  const data = await response.json();
  localStorage.setItem('token', data.access_token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  return data;
}

export async function getStats() {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(`${API_URL}/transactions/stats`, { headers });
  if (!response.ok) {
    throw new Error('Failed to fetch stats');
  }
  return response.json();
}