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

function readLocalProfiles() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem('tj-profiles') || '[]');
  } catch {
    return [];
  }
}

function writeLocalProfiles(profiles) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('tj-profiles', JSON.stringify(profiles));
}

function readLocalTrades() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem('tj-trades') || '[]');
  } catch {
    return [];
  }
}

function writeLocalTrades(trades) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('tj-trades', JSON.stringify(trades));
}

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function request(path, options = {}) {
  const token = getToken();
  const shouldUseLocalFallback = !token && import.meta.env.DEV;

  if (shouldUseLocalFallback) {
    if (options.method && options.method !== 'GET') {
      throw new Error('Offline mode: login required for this action');
    }
    return null;
  }

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
    if ((response.status === 401 || response.status === 403) && !token) {
      return null;
    }
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

export async function fetchTrades(profileId) {
  const query = profileId ? `?profileId=${encodeURIComponent(profileId)}` : '';
  const token = getToken();
  const shouldUseLocalFallback = !token && import.meta.env.DEV;
  if (shouldUseLocalFallback) {
    const trades = readLocalTrades();
    return profileId ? trades.filter((trade) => trade.profileId === profileId) : trades;
  }
  return request(`/trades${query}`);
}

export async function fetchProfiles() {
  return readLocalProfiles();
}

export async function createProfile(profile) {
  const profiles = readLocalProfiles();
  const createdProfile = {
    id: generateId(),
    name: profile.name,
    defaultRiskPerTrade: profile.defaultRiskPerTrade ?? null,
    accountSize: profile.accountSize ?? null,
    settings: profile.settings ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const nextProfiles = [...profiles, createdProfile];
  writeLocalProfiles(nextProfiles);
  return createdProfile;
}

export async function updateProfile(id, profile) {
  const profiles = readLocalProfiles();
  const nextProfiles = profiles.map((item) =>
    item.id === id ? { ...item, ...profile, updatedAt: new Date().toISOString() } : item,
  );
  writeLocalProfiles(nextProfiles);
  return nextProfiles.find((item) => item.id === id);
}

export async function deleteProfile(id) {
  const profiles = readLocalProfiles();
  const nextProfiles = profiles.filter((item) => item.id !== id);
  writeLocalProfiles(nextProfiles);
  return { deleted: true };
}

export async function createTrade(trade) {
  const token = getToken();
  const shouldUseLocalFallback = !token && import.meta.env.DEV;
  if (shouldUseLocalFallback) {
    const trades = readLocalTrades();
    const createdTrade = {
      id: generateId(),
      ...trade,
      status: 'open',
      createdAt: new Date().toISOString(),
      pnl: null,
      pnlPercent: null,
      rMultiple: null,
      tags: trade.tags || [],
    };
    const nextTrades = [createdTrade, ...trades];
    writeLocalTrades(nextTrades);
    return createdTrade;
  }

  return request('/trades', {
    method: 'POST',
    body: JSON.stringify(trade),
  });
}

export async function updateTrade(id, trade) {
  const token = getToken();
  const shouldUseLocalFallback = !token && import.meta.env.DEV;
  if (shouldUseLocalFallback) {
    const trades = readLocalTrades();
    const nextTrades = trades.map((item) => (item.id === id ? { ...item, ...trade } : item));
    writeLocalTrades(nextTrades);
    return nextTrades.find((item) => item.id === id);
  }

  return request(`/trades/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(trade),
  });
}

export async function closeTrade(id, payload) {
  const token = getToken();
  const shouldUseLocalFallback = !token && import.meta.env.DEV;
  if (shouldUseLocalFallback) {
    const trades = readLocalTrades();
    const nextTrades = trades.map((item) => (item.id === id ? { ...item, ...payload, status: 'closed' } : item));
    writeLocalTrades(nextTrades);
    return nextTrades.find((item) => item.id === id);
  }

  return request(`/trades/${id}/close`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteTrade(id) {
  const token = getToken();
  const shouldUseLocalFallback = !token && import.meta.env.DEV;
  if (shouldUseLocalFallback) {
    const trades = readLocalTrades();
    const nextTrades = trades.filter((item) => item.id !== id);
    writeLocalTrades(nextTrades);
    return { deleted: true };
  }

  return request(`/trades/${id}`, {
    method: 'DELETE',
  });
}

export async function duplicateTrade(id) {
  const token = getToken();
  const shouldUseLocalFallback = !token && import.meta.env.DEV;
  if (shouldUseLocalFallback) {
    const trades = readLocalTrades();
    const source = trades.find((item) => item.id === id);
    if (!source) {
      throw new Error('Trade not found');
    }
    const clone = {
      ...source,
      id: generateId(),
      status: 'open',
      createdAt: new Date().toISOString(),
      exitDate: null,
      exitTime: null,
      exitPrice: null,
      exitReason: null,
      pnl: null,
      pnlPercent: null,
      rMultiple: null,
    };
    const nextTrades = [clone, ...trades];
    writeLocalTrades(nextTrades);
    return clone;
  }

  return request(`/trades/${id}/duplicate`, {
    method: 'POST',
  });
}
