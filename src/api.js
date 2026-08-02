const API_BASE = import.meta.env.VITE_API_URL || 'https://trading-journal-backend-eili.onrender.com/api';

function getToken() {
  return localStorage.getItem('tj_token') || '';
}

function setToken(token) {
  localStorage.setItem('tj_token', token);
}

function clearToken() {
  localStorage.removeItem('tj_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Request failed');
  }

  return data;
}

export async function loginWithTelegram(initData) {
  const result = await request('/auth/telegram', {
    method: 'POST',
    body: JSON.stringify({ initData }),
  });

  const token = result?.token || result?.access_token || '';
  if (token) setToken(token);
  return result;
}

export async function fetchTrades() {
  return request('/trades');
}

export async function createTrade(trade) {
  return request('/trades', {
    method: 'POST',
    body: JSON.stringify(trade),
  });
}

export async function updateTrade(id, trade) {
  return request(`/trades/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(trade),
  });
}

export async function closeTrade(id, payload) {
  return request(`/trades/${id}/close`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteTrade(id) {
  return request(`/trades/${id}`, {
    method: 'DELETE',
  });
}

export async function duplicateTrade(id) {
  return request(`/trades/${id}/duplicate`, {
    method: 'POST',
  });
}
