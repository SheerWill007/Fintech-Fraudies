const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'PURCHASE';
  status: 'PENDING' | 'APPROVED' | 'FLAGGED';
  riskScore: number | null;
  riskFactors: string[];
  ipAddress: string | null;
  deviceId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalVolume: number;
  transactionCount: number;
  flaggedCount: number;
  approvedCount: number;
  pendingCount: number;
  approvalRate: number;
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
      // ignore
    }
    throw new Error(typeof message === 'string' ? message : 'Login failed');
  }

  const data = await response.json();
  localStorage.setItem('token', data.access_token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  return data;
}

export async function register(email: string, password: string) {
  if (typeof window === 'undefined') {
    throw new Error('register can only be called on client side');
  }
  
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    let message = 'Registration failed';
    try {
      const error = await response.json();
      const m = error.message;
      message = Array.isArray(m) ? m.join(', ') : (m ?? message);
    } catch {
      // ignore
    }
    throw new Error(typeof message === 'string' ? message : 'Registration failed');
  }

  const data = await response.json();
  localStorage.setItem('token', data.access_token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  return data;
}

export async function fetchTransactions(): Promise<Transaction[]> {
  if (typeof window === 'undefined') {
    return [];
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

export async function fetchFlaggedTransactions(): Promise<Transaction[]> {
  if (typeof window === 'undefined') {
    return [];
  }
  
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/transactions/flagged`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch flagged transactions');
  }

  return response.json();
}

export async function createTransaction(transactionData: {
  amount: number;
  type: string;
  ipAddress?: string;
  deviceId?: string;
}): Promise<Transaction> {
  if (typeof window === 'undefined') {
    throw new Error('createTransaction can only be called on client side');
  }

  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transactionData),
  });

  if (!response.ok) {
    let message = 'Failed to create transaction';
    try {
      const error = await response.json();
      const m = error.message;
      message = Array.isArray(m) ? m.join(', ') : (m ?? message);
    } catch {
      // ignore
    }
    throw new Error(typeof message === 'string' ? message : 'Failed to create transaction');
  }

  return response.json();
}

export async function getStats(): Promise<DashboardStats> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
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
