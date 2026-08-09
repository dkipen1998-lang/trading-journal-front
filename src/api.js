const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'https://trading-journal-backend-eili.onrender.com/api');
const FINNHUB_BASE = 'https://finnhub.io/api/v1';
const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY || 'demo';

if (!import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
  console.warn('[api] VITE_API_URL is not defined; using fallback backend URL.');
}

function getToken() {
  return localStorage.getItem('tj_token') || '';
}

function setToken(token) {
  localStorage.setItem('tj_token', token);
}

function hasToken() {
  return Boolean(getToken());
}

function readUser() {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(window.localStorage.getItem('tj_user') || 'null');
  } catch {
    return null;
  }
}

export function getUser() {
  return readUser();
}

export function setUser(user) {
  if (typeof window === 'undefined') return;
  if (!user) {
    window.localStorage.removeItem('tj_user');
    return;
  }
  window.localStorage.setItem('tj_user', JSON.stringify(user));
}

export function clearToken() {
  localStorage.removeItem('tj_token');
  localStorage.removeItem('tj_user');
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('tj_token');
  window.localStorage.removeItem('tj_user');
}

const LOCAL_TRADES_KEY = 'tj-trades';
const LOCAL_PROFILES_KEY = 'tj-profiles';
const LOCAL_TRADES_HASH_KEY = 'tj-trades-hash';
const LOCAL_PROFILES_HASH_KEY = 'tj-profiles-hash';
const LOCAL_TRADES_LAST_SYNC_KEY = 'tj-trades-last-sync';

function normalizeLocalCollection(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value);
  return [];
}

function collectionToHash(items) {
  if (!Array.isArray(items)) return {};
  return items.reduce((acc, item) => {
    if (item && typeof item === 'object' && item.id) {
      acc[item.id] = item;
    }
    return acc;
  }, {});
}

function migrateCollectionToHash(raw, hashKey) {
  if (!raw) return null;
  try {
    const items = JSON.parse(raw);
    if (!Array.isArray(items)) return null;
    const hash = collectionToHash(items);
    window.localStorage.setItem(hashKey, JSON.stringify(hash));
    return items;
  } catch {
    return null;
  }
}

export function readLocalProfiles() {
  if (typeof window === 'undefined') return [];
  try {
    const hashRaw = window.localStorage.getItem(LOCAL_PROFILES_HASH_KEY);
    if (hashRaw) {
      return normalizeLocalCollection(JSON.parse(hashRaw));
    }
    const raw = window.localStorage.getItem(LOCAL_PROFILES_KEY);
    const arrayData = normalizeLocalCollection(JSON.parse(raw || '[]'));
    if (raw) {
      migrateCollectionToHash(raw, LOCAL_PROFILES_HASH_KEY);
    }
    return arrayData;
  } catch {
    return [];
  }
}

function writeLocalProfiles(profiles) {
  if (typeof window === 'undefined') return;
  const hash = collectionToHash(profiles);
  window.localStorage.setItem(LOCAL_PROFILES_HASH_KEY, JSON.stringify(hash));
  window.localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(profiles));
}

export function readLocalTrades() {
  if (typeof window === 'undefined') return [];
  try {
    const hashRaw = window.localStorage.getItem(LOCAL_TRADES_HASH_KEY);
    if (hashRaw) {
      return normalizeLocalCollection(JSON.parse(hashRaw));
    }
    const raw = window.localStorage.getItem(LOCAL_TRADES_KEY);
    const arrayData = normalizeLocalCollection(JSON.parse(raw || '[]'));
    if (raw) {
      migrateCollectionToHash(raw, LOCAL_TRADES_HASH_KEY);
    }
    return arrayData;
  } catch {
    return [];
  }
}

function writeLocalTrades(trades) {
  if (typeof window === 'undefined') return;
  const hash = collectionToHash(trades);
  window.localStorage.setItem(LOCAL_TRADES_HASH_KEY, JSON.stringify(hash));
  window.localStorage.setItem(LOCAL_TRADES_KEY, JSON.stringify(trades));
}

export function persistLocalProfiles(profiles) {
  writeLocalProfiles(profiles);
}

export function persistLocalTrades(trades) {
  writeLocalTrades(trades);
}

export function readLocalTradesLastSync() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(LOCAL_TRADES_LAST_SYNC_KEY);
  } catch {
    return null;
  }
}

export function writeLocalTradesLastSync(value) {
  if (typeof window === 'undefined') return;
  try {
    if (value == null) {
      window.localStorage.removeItem(LOCAL_TRADES_LAST_SYNC_KEY);
    } else {
      window.localStorage.setItem(LOCAL_TRADES_LAST_SYNC_KEY, String(value));
    }
  } catch {
    // ignore write failures
  }
}

function upsertLocalTrade(trade) {
  if (!trade || typeof trade !== 'object') return null;
  const normalizedTrade = { ...trade, id: trade.id || generateId() };
  const trades = readLocalTrades();
  const existingIndex = trades.findIndex((item) => item.id === normalizedTrade.id);
  const nextTrades = existingIndex >= 0
    ? trades.map((item) => (item.id === normalizedTrade.id ? { ...item, ...normalizedTrade } : item))
    : [normalizedTrade, ...trades];
  writeLocalTrades(nextTrades);
  return normalizedTrade;
}

function removeLocalTrade(id) {
  if (!id) return null;
  const trades = readLocalTrades();
  const nextTrades = trades.filter((item) => item.id !== id);
  writeLocalTrades(nextTrades);
  return nextTrades;
}

function upsertLocalProfile(profile) {
  if (!profile || typeof profile !== 'object') return null;
  const normalizedProfile = { ...profile, id: profile.id || generateId() };
  const profiles = readLocalProfiles();
  const existingIndex = profiles.findIndex((item) => item.id === normalizedProfile.id);
  const nextProfiles = existingIndex >= 0
    ? profiles.map((item) => (item.id === normalizedProfile.id ? { ...item, ...normalizedProfile } : item))
    : [normalizedProfile, ...profiles];
  writeLocalProfiles(nextProfiles);
  return normalizedProfile;
}

function removeLocalProfile(id) {
  if (!id) return null;
  const profiles = readLocalProfiles();
  const nextProfiles = profiles.filter((item) => item.id !== id);
  writeLocalProfiles(nextProfiles);
  return nextProfiles;
}

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getFallbackUser() {
  if (typeof window === 'undefined') return null;

  try {
    const webAppUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (webAppUser) {
      return {
        id: webAppUser.id,
        username: webAppUser.username,
        firstName: webAppUser.first_name || webAppUser.firstName,
        photoUrl: webAppUser.photo_url || webAppUser.photoUrl,
      };
    }

    const storedUser = JSON.parse(window.localStorage.getItem('tj_user') || 'null');
    if (storedUser) {
      return storedUser;
    }
  } catch {
    // ignore and fall back to null
  }

  return null;
}

async function request(path, options = {}) {
  const token = getToken();
  const isAuthLoginRequest = path === '/auth/telegram' || path === '/auth/login';
  const shouldUseLocalFallback = !token && import.meta.env.DEV && path !== '/news/latest' && !isAuthLoginRequest;

  if (typeof window !== 'undefined' && (path === '/auth/telegram' || path === '/auth/login')) {
    console.info('[auth] sending request', { path, body: options.body });
  }

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

  const url = `${API_BASE}${path}`;
  if (typeof window !== 'undefined' && isAuthLoginRequest) {
    console.info('[auth] sending request', { path, url, body: options.body });
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const text = await response.text();
  if (typeof window !== 'undefined' && (path === '/auth/telegram' || path === '/auth/login')) {
    console.info('[auth] response', { path, status: response.status, body: text });
  }
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    if ((response.status === 401 || response.status === 403) && !token) {
      return null;
    }
    const errorMessage = data?.message || data?.error || 'Request failed';
    if (typeof window !== 'undefined' && (path === '/auth/telegram' || path === '/auth/login')) {
      console.error('[auth] request failed', { path, status: response.status, errorMessage, body: text });
    }
    throw new Error(errorMessage);
  }

  return data;
}

async function requestFinnhub(path) {
  const url = `/api/market${path}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    return response.json();
  } catch {
    return null;
  }
}

export async function fetchChatReply(message) {
  if (!message || typeof message !== 'string') {
    throw new Error('Message is required');
  }

  return request('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

const BINANCE_SPOT_BASE = 'https://api.binance.com';
const BINANCE_FUTURES_BASE = 'https://fapi.binance.com';

async function requestBinance(path, { futures = false } = {}) {
  try {
    const base = futures ? BINANCE_FUTURES_BASE : BINANCE_SPOT_BASE;
    const response = await fetch(`${base}${path}`);
    if (!response.ok) {
      return null;
    }
    return response.json();
  } catch {
    return null;
  }
}

const BINANCE_CRYPTO_EXCLUDE_BASES = new Set([
  'BUSD', 'USDC', 'USDS', 'TUSD', 'DAI', 'UST', 'EUR', 'GBP', 'TRY', 'AUD', 'RUB', 'JPY', 'CHF', 'SGD', 'CNH', 'HUSD', 'PAX', 'USDP', 'USDK', 'VAI', 'LUSD', 'USDX', 'FEI', 'EURS', 'GUSD'
]);

function isBinanceCryptoPair(symbol) {
  if (typeof symbol !== 'string') return false;
  const value = symbol.trim().toUpperCase();
  if (!value.endsWith('USDT')) return false;
  const base = value.slice(0, -4);
  if (!base || BINANCE_CRYPTO_EXCLUDE_BASES.has(base)) return false;
  if (/(?:UP|DOWN|BULL|BEAR|3L|3S|5L|5S|10L|10S)$/i.test(base)) return false;
  return true;
}

export async function fetchTopBinanceVolumeSymbols(limit = 100) {
  const tickers = await requestBinance('/fapi/v1/ticker/24hr', { futures: true });
  if (!Array.isArray(tickers)) return [];

  const symbols = tickers
    .filter((item) => item && typeof item.symbol === 'string' && isBinanceCryptoPair(item.symbol))
    .map((item) => ({
      symbol: item.symbol,
      quoteVolume: Number(item.quoteVolume ?? item.volume ?? 0) || 0,
    }))
    .sort((a, b) => b.quoteVolume - a.quoteVolume)
    .slice(0, Math.max(0, Math.min(limit, 200)))
    .map((item) => item.symbol);

  return Array.from(new Set(symbols));
}

export async function fetchStockSnapshot(symbol, options = {}) {
  const preferredSource = options && options.source ? String(options.source) : null;
  const normalizedSymbol = (symbol || '').trim().toUpperCase();
  if (!normalizedSymbol || !/^[A-Z0-9.\-]+$/.test(normalizedSymbol)) {
    return null;
  }

  const isCrypto = isCryptoSymbol(normalizedSymbol);

  // Cryptocurrencies and USDT futures pairs should always use Binance futures.
  if (isCrypto || preferredSource === 'binance') {
    const pair = normalizedSymbol.replace(/USD$/i, 'USDT');
    const quote = await requestBinance(`/fapi/v1/ticker/24hr?symbol=${encodeURIComponent(pair)}`, { futures: true });
    let logo = '';
    if (preferredSource === 'binance') {
      const fallbackProfile = await requestFinnhub(`/profile?symbol=${encodeURIComponent(normalizedSymbol)}`);
      logo = fallbackProfile?.logo || '';
    }
    return {
      price: typeof quote?.lastPrice === 'string' ? Number(quote.lastPrice) : null,
      change: typeof quote?.priceChange === 'string' ? Number(quote.priceChange) : null,
      changePercent: typeof quote?.priceChangePercent === 'string' ? Number(quote.priceChangePercent) : null,
      volume: typeof quote?.volume === 'string' ? Number(quote.volume) : null,
      averageVolume: null,
      vwap: typeof quote?.weightedAvgPrice === 'string' ? Number(quote.weightedAvgPrice) : null,
      logo,
      exchange: 'Binance Futures',
      currency: 'USDT',
      name: normalizedSymbol,
    };
  }

  const finnhubQuote = await requestFinnhub(`/quote?symbol=${encodeURIComponent(normalizedSymbol)}`);
  const profile = await requestFinnhub(`/profile?symbol=${encodeURIComponent(normalizedSymbol)}`);
  const quote = finnhubQuote || null;
  const preMarketPrice = finnhubQuote?.preMarketPrice ?? finnhubQuote?.preMarket ?? finnhubQuote?.preMarketStart ?? quote?.preMarketPrice ?? null;
  const preMarketChange = finnhubQuote?.preMarketChange ?? quote?.preMarketChange ?? null;
  const preMarketChangePercent = finnhubQuote?.preMarketChangePercent ?? quote?.preMarketPercentChange ?? null;

  return {
    price: quote?.price ?? (typeof finnhubQuote?.c === 'number' ? finnhubQuote.c : quote?.c ?? null),
    change: quote?.change ?? (typeof finnhubQuote?.d === 'number' ? finnhubQuote.d : quote?.d ?? null),
    changePercent: quote?.changePercent ?? (typeof finnhubQuote?.dp === 'number' ? finnhubQuote.dp : quote?.dp ?? null),
    volume: quote?.volume ?? (typeof finnhubQuote?.v === 'number' ? finnhubQuote.v : null),
    averageVolume: quote?.averageVolume ?? (typeof finnhubQuote?.avgVolume === 'number' ? finnhubQuote.avgVolume : typeof finnhubQuote?.avgVolume3M === 'number' ? finnhubQuote.avgVolume3M : null),
    vwap: quote?.vwap ?? (typeof finnhubQuote?.vw === 'number' ? finnhubQuote.vw : null),
    preMarketPrice: preMarketPrice != null ? Number(preMarketPrice) : null,
    preMarketChange: preMarketChange != null ? Number(preMarketChange) : null,
    preMarketChangePercent: preMarketChangePercent != null ? Number(preMarketChangePercent) : null,
    logo: profile?.logo || '',
    exchange: profile?.exchange || quote?.exchange || '',
    currency: profile?.currency || quote?.currency || '',
    name: profile?.name || quote?.name || normalizedSymbol,
  };
}

function mapTimeframeToFinnhubResolution(timeframe) {
  switch (timeframe) {
    case '1m': return '1';
    case '5m': return '5';
    case '15m': return '15';
    case '1h': return '60';
    case '4h': return '240';
    case '1d': return 'D';
    case '1w': return 'W';
    case '1M': return 'M';
    default: return '60';
  }
}

function mapTimeframeToBinanceInterval(timeframe) {
  switch (timeframe) {
    case '1m': return '1m';
    case '5m': return '5m';
    case '15m': return '15m';
    case '1h': return '1h';
    case '4h': return '4h';
    case '1d': return '1d';
    case '1w': return '1w';
    case '1M': return '1M';
    default: return '1h';
  }
}

function isForexPair(symbol) {
  const normalized = (symbol || '').trim().toUpperCase();
  if (!normalized.endsWith('USD')) return false;
  const base = normalized.slice(0, -3);
  return /^(EUR|GBP|JPY|AUD|CAD|CHF|NZD|CNY|SEK|NOK|MXN|ZAR|TRY|INR|KRW)$/i.test(base);
}

function isCryptoSymbol(symbol) {
  const normalized = (symbol || '').trim().toUpperCase();
  if (!normalized) return false;
  if (normalized.endsWith('USDT')) {
    return true;
  }
  if (normalized.endsWith('USD') && !isForexPair(normalized)) {
    return true;
  }
  return /^(BTC|ETH|BNB|SOL|XRP|ADA|DOGE|TRX|AVAX|LINK|DOT|LTC|NEAR|TON|SHIB|BCH|MATIC|UNI|ATOM|ICP|APT|SUI|XMR|FIL|ARB|OP|WIF|PEPE)/i.test(normalized);
}

export async function fetchHistoricalCandles(symbol, timeframe = '1h', limit = 80, options = {}) {
  const normalizedSymbol = (symbol || '').trim().toUpperCase();
  if (!normalizedSymbol) return null;

  const source = options.source ? String(options.source).toLowerCase() : null;
  const useBinance = source === 'binance' || isCryptoSymbol(normalizedSymbol);
  const now = Math.floor(Date.now() / 1000);
  const lookback = Math.min(Math.max(limit, 20), 500);
  const from = now - lookback * ({
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '1h': 3600,
    '4h': 14400,
    '1d': 86400,
    '1w': 604800,
    '1M': 2678400,
  }[timeframe] || 3600);

  if (useBinance) {
    const pair = normalizedSymbol.replace(/USD$/i, 'USDT');
    const interval = mapTimeframeToBinanceInterval(timeframe);
    const candles = await requestBinance(`/fapi/v1/klines?symbol=${encodeURIComponent(pair)}&interval=${interval}&limit=${lookback}`, { futures: true });
    if (Array.isArray(candles) && candles.length > 0) {
      return candles.map((item) => ({
        time: Math.floor(Number(item[0]) / 1000),
        open: item[1],
        high: item[2],
        low: item[3],
        close: item[4],
        volume: item[5],
      }));
    }
  }

  if (!useBinance) {
    const resolution = mapTimeframeToFinnhubResolution(timeframe);
    const candleData = await requestFinnhub(`/candles?symbol=${encodeURIComponent(normalizedSymbol)}&resolution=${resolution}&from=${from}&to=${now}`);
    if (candleData && candleData.s === 'ok' && Array.isArray(candleData.t)) {
      return candleData.t.map((timestamp, index) => ({
        time: Math.floor(Number(timestamp)),
        open: candleData.o[index],
        high: candleData.h[index],
        low: candleData.l[index],
        close: candleData.c[index],
        volume: candleData.v[index],
      }));
    }
  }

  return null;
}

export async function loginWithTelegram(initData) {
  try {
    if (!initData) {
      const storedToken = getToken();
      const storedUser = getUser();
      if (storedToken || storedUser) {
        return { token: storedToken, user: storedUser, fallback: true };
      }
      const fallbackUser = getFallbackUser();
      if (fallbackUser) {
        setUser(fallbackUser);
        return { user: fallbackUser, fallback: true };
      }
      return { fallback: true };
    }

    const result = await request('/auth/telegram', {
      method: 'POST',
      body: JSON.stringify({ initData }),
    });

    const token = result?.token || result?.access_token || '';
    const user = result?.user || getFallbackUser();
    if (token) {
      setToken(token);
    }
    if (user) {
      setUser(user);
    }
    return result || { user };
  } catch (error) {
    const storedToken = getToken();
    const fallbackUser = getFallbackUser();
    if (typeof window !== 'undefined') {
      console.error('[auth] loginWithTelegram threw', error);
    }
    if (storedToken || fallbackUser) {
      if (fallbackUser) {
        setUser(fallbackUser);
      }
      return {
        user: fallbackUser || getUser(),
        fallback: true,
        error: error?.message || 'Login failed',
      };
    }

    throw error;
  }
}

function normalizeTradeCollection(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.items)) return payload.items;
  return [];
}

export async function fetchTrades(profileId, options = {}) {
  const queryParts = [];
  if (profileId) {
    queryParts.push(`profileId=${encodeURIComponent(profileId)}`);
  }
  if (options.updatedSince) {
    queryParts.push(`updatedSince=${encodeURIComponent(options.updatedSince)}`);
  }
  if (options.dateFrom) {
    queryParts.push(`dateFrom=${encodeURIComponent(options.dateFrom)}`);
  }
  if (options.dateTo) {
    queryParts.push(`dateTo=${encodeURIComponent(options.dateTo)}`);
  }
  if (options.page != null) {
    queryParts.push(`page=${encodeURIComponent(options.page)}`);
  }
  if (options.limit != null) {
    queryParts.push(`limit=${encodeURIComponent(options.limit)}`);
  }
  const query = queryParts.length ? `?${queryParts.join('&')}` : '';
  const token = getToken();
  const localTrades = readLocalTrades();
  if (!token) {
    return profileId ? localTrades.filter((trade) => trade.profileId === profileId) : localTrades;
  }

  try {
    const response = await request(`/trades${query}`);
    const normalized = normalizeTradeCollection(response);
    return normalized;
  } catch {
    return localTrades;
  }
}

export async function fetchProfiles() {
  if (!hasToken()) {
    return readLocalProfiles();
  }

  try {
    const response = await request('/profiles');
    return Array.isArray(response) ? response : readLocalProfiles();
  } catch {
    return readLocalProfiles();
  }
}

export async function createProfile(profile) {
  if (hasToken()) {
    const created = await request('/profiles', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
    if (created && typeof created === 'object') {
      upsertLocalProfile(created);
    }
    return created;
  }

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
  if (hasToken()) {
    const updated = await request(`/profiles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(profile),
    });
    if (updated && typeof updated === 'object') {
      upsertLocalProfile({ ...updated, id: updated.id || id });
    }
    return updated;
  }

  const profiles = readLocalProfiles();
  const nextProfiles = profiles.map((item) =>
    item.id === id ? { ...item, ...profile, updatedAt: new Date().toISOString() } : item,
  );
  writeLocalProfiles(nextProfiles);
  return nextProfiles.find((item) => item.id === id);
}

export async function deleteProfile(id) {
  if (hasToken()) {
    const deleted = await request(`/profiles/${id}`, {
      method: 'DELETE',
    });
    removeLocalProfile(id);
    return deleted ?? { deleted: true };
  }

  const profiles = readLocalProfiles();
  const nextProfiles = profiles.filter((item) => item.id !== id);
  writeLocalProfiles(nextProfiles);
  return { deleted: true };
}

export async function createTrade(trade) {
  const token = getToken();
  const shouldUseLocalFallback = !token;
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

  const created = await request('/trades', {
    method: 'POST',
    body: JSON.stringify(trade),
  });
  if (created && typeof created === 'object') {
    upsertLocalTrade(created);
  }
  return created;
}

export async function updateTrade(id, trade) {
  const token = getToken();
  const shouldUseLocalFallback = !token;
  if (shouldUseLocalFallback) {
    const trades = readLocalTrades();
    const nextTrades = trades.map((item) => (item.id === id ? { ...item, ...trade } : item));
    writeLocalTrades(nextTrades);
    return nextTrades.find((item) => item.id === id);
  }

  const updated = await request(`/trades/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(trade),
  });
  if (updated && typeof updated === 'object') {
    upsertLocalTrade({ ...updated, id: updated.id || id });
  }
  return updated;
}

export async function closeTrade(id, payload) {
  const token = getToken();
  const shouldUseLocalFallback = !token;
  if (shouldUseLocalFallback) {
    const trades = readLocalTrades();
    const nextTrades = trades.map((item) => (item.id === id ? { ...item, ...payload, status: 'closed' } : item));
    writeLocalTrades(nextTrades);
    return nextTrades.find((item) => item.id === id);
  }

  const updated = await request(`/trades/${id}/close`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  if (updated && typeof updated === 'object') {
    upsertLocalTrade({ ...updated, id: updated.id || id, status: 'closed' });
  }
  return updated;
}

export async function deleteTrade(id) {
  const token = getToken();
  const shouldUseLocalFallback = !token;
  if (shouldUseLocalFallback) {
    const trades = readLocalTrades();
    const nextTrades = trades.filter((item) => item.id !== id);
    writeLocalTrades(nextTrades);
    return { deleted: true };
  }

  const deleted = await request(`/trades/${id}`, {
    method: 'DELETE',
  });
  removeLocalTrade(id);
  return deleted ?? { deleted: true };
}

export async function fetchLatestNews() {
  const token = getToken();
  const shouldUseLocalFallback = !token && import.meta.env.DEV;
  if (shouldUseLocalFallback) {
    return [
      { title: 'Latest news unavailable offline', url: null },
    ];
  }
  return request('/news/latest');
}

export async function duplicateTrade(id) {
  const token = getToken();
  const shouldUseLocalFallback = !token;
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

  const duplicated = await request(`/trades/${id}/duplicate`, {
    method: 'POST',
  });
  if (duplicated && typeof duplicated === 'object') {
    upsertLocalTrade(duplicated);
  }
  return duplicated;
}
