const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : (typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api'));
const FINNHUB_BASE = 'https://finnhub.io/api/v1';
const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY || 'demo';

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
  const isDemoKey = (FINNHUB_API_KEY || '').trim().toLowerCase() === 'demo';
  if (isDemoKey) {
    return null;
  }

  const url = `${FINNHUB_BASE}${path}${path.includes('?') ? '&' : '?'}token=${FINNHUB_API_KEY}`;
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

function normalizeYahooSymbol(symbol, instrumentType) {
  const normalized = (symbol || "").trim().toUpperCase();
  if (!normalized) return "";
  if (instrumentType === "forex" || /^[A-Z]{6}$/.test(normalized)) {
    return `${normalized}=X`;
  }
  if (/USD$/i.test(normalized) && /^[A-Z]{4,}USD$/i.test(normalized)) {
    return `${normalized.slice(0, -3)}-USD`;
  }
  return normalized;
}

async function requestYahooQuote(symbol, instrumentType) {
  const yahooSymbol = normalizeYahooSymbol(symbol, instrumentType);
  if (!yahooSymbol) return null;
  try {
    const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(yahooSymbol)}`);
    if (!response.ok) return null;
    const data = await response.json();
    const quote = data?.quoteResponse?.result?.[0];
    if (!quote) return null;
    return {
      price: typeof quote.regularMarketPrice === 'number' ? quote.regularMarketPrice : null,
      change: typeof quote.regularMarketChange === 'number' ? quote.regularMarketChange : null,
      changePercent: typeof quote.regularMarketChangePercent === 'number' ? quote.regularMarketChangePercent : null,
      volume: typeof quote.regularMarketVolume === 'number' ? quote.regularMarketVolume : null,
      averageVolume: typeof quote.averageDailyVolume3Month === 'number' ? quote.averageDailyVolume3Month : null,
      vwap: typeof quote.vwap === 'number' ? quote.vwap : null,
      logo: '',
      exchange: quote.fullExchangeName || quote.exchange || '',
      currency: quote.currency || '',
      name: quote.longName || quote.shortName || symbol,
    };
  } catch {
    return null;
  }
}

async function requestYahooChart(symbol, interval, range) {
  const yahooSymbol = normalizeYahooSymbol(symbol);
  if (!yahooSymbol) return null;
  try {
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=${encodeURIComponent(interval)}&range=${encodeURIComponent(range)}`);
    if (!response.ok) return null;
    const data = await response.json();
    const result = data?.chart?.result?.[0];
    const timestamps = result?.timestamp;
    const quote = result?.indicators?.quote?.[0];
    if (!timestamps || !quote) return null;
    return timestamps.map((time, index) => ({
      time: Math.floor(Number(time)),
      open: Number(quote.open?.[index] ?? 0),
      high: Number(quote.high?.[index] ?? 0),
      low: Number(quote.low?.[index] ?? 0),
      close: Number(quote.close?.[index] ?? 0),
      volume: Number(quote.volume?.[index] ?? 0),
    })).filter((item) => item.open && item.high && item.low && item.close);
  } catch {
    return null;
  }
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
    return {
      price: typeof quote?.lastPrice === 'string' ? Number(quote.lastPrice) : null,
      change: typeof quote?.priceChange === 'string' ? Number(quote.priceChange) : null,
      changePercent: typeof quote?.priceChangePercent === 'string' ? Number(quote.priceChangePercent) : null,
      volume: typeof quote?.volume === 'string' ? Number(quote.volume) : null,
      averageVolume: null,
      vwap: typeof quote?.weightedAvgPrice === 'string' ? Number(quote.weightedAvgPrice) : null,
      logo: '',
      exchange: 'Binance Futures',
      currency: 'USDT',
      name: normalizedSymbol,
    };
  }

  const preferYahoo = preferredSource !== 'finnhub';
  const [yahooQuote, finnhubQuote, profile] = await Promise.all([
    preferYahoo ? requestYahooQuote(normalizedSymbol, preferredSource === 'forex' ? 'forex' : undefined) : null,
    requestFinnhub(`/quote?symbol=${encodeURIComponent(normalizedSymbol)}`),
    requestFinnhub(`/stock/profile2?symbol=${encodeURIComponent(normalizedSymbol)}`),
  ]);

  const quote = yahooQuote || finnhubQuote || null;
  const preMarketPrice = finnhubQuote?.preMarketPrice ?? finnhubQuote?.preMarket ?? finnhubQuote?.preMarketStart ?? quote?.preMarketPrice ?? null;
  const preMarketChange = finnhubQuote?.preMarketChange ?? quote?.preMarketChange ?? null;
  const preMarketChangePercent = finnhubQuote?.preMarketChangePercent ?? finnhubQuote?.preMarketPercentChange ?? quote?.preMarketChangePercent ?? null;

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

  const yahooRange = ({
    '1m': '1d',
    '5m': '5d',
    '15m': '5d',
    '1h': '5d',
    '4h': '1mo',
    '1d': '6mo',
    '1w': '1y',
    '1M': '2y',
  }[timeframe] || '5d');
  const yahooInterval = ({
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '1h': '60m',
    '4h': '90m',
    '1d': '1d',
    '1w': '1wk',
    '1M': '1mo',
  }[timeframe] || '60m');

  const yahooCandles = await requestYahooChart(normalizedSymbol, yahooInterval, yahooRange);
  if (Array.isArray(yahooCandles) && yahooCandles.length > 0) {
    return yahooCandles.slice(-lookback);
  }

  if (!useBinance) {
    const resolution = mapTimeframeToFinnhubResolution(timeframe);
    const candleData = await requestFinnhub(`/stock/candle?symbol=${encodeURIComponent(normalizedSymbol)}&resolution=${resolution}&from=${from}&to=${now}`);
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

export async function fetchTrades(profileId) {
  const query = profileId ? `?profileId=${encodeURIComponent(profileId)}` : '';
  const token = getToken();
  const localTrades = readLocalTrades();
  if (!token) {
    return profileId ? localTrades.filter((trade) => trade.profileId === profileId) : localTrades;
  }

  try {
    const response = await request(`/trades${query}`);
    const normalized = normalizeTradeCollection(response);
    if (normalized.length > 0) {
      return normalized;
    }
    return localTrades;
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
    return request('/profiles', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
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
    return request(`/profiles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(profile),
    });
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
    return request(`/profiles/${id}`, {
      method: 'DELETE',
    });
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

  return request('/trades', {
    method: 'POST',
    body: JSON.stringify(trade),
  });
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

  return request(`/trades/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(trade),
  });
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

  return request(`/trades/${id}/close`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
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

  return request(`/trades/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchLatestNews() {
  const token = getToken();
  const shouldUseLocalFallback = !token && import.meta.env.DEV;
  if (shouldUseLocalFallback) {
    return [
      { title: 'Yahoo Finance latest news unavailable offline', url: 'https://finance.yahoo.com/topic/latest-news/' },
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

  return request(`/trades/${id}/duplicate`, {
    method: 'POST',
  });
}
