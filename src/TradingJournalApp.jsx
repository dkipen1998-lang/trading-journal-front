import React, { useState, useEffect, useMemo, useRef } from "react";
import { loginWithTelegram, fetchTrades, createTrade, updateTrade, closeTrade, deleteTrade, duplicateTrade } from "./api";
import {
  Plus, Search, SlidersHorizontal, X, Edit2, Trash2, Copy, Camera,
  ChevronRight, Home, BookOpen, BarChart2, Download, Eye,
  ArrowUpRight, ArrowDownRight, Trophy, Skull, Flame
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, LineChart, Line, Cell
} from "recharts";
import * as XLSX from "xlsx";

const STORAGE = typeof window !== "undefined" && window.storage
  ? window.storage
  : {
      get: async (key) => {
        const raw = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
        return raw == null ? null : { value: raw };
      },
      set: async (key, value) => {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, value);
        }
        return true;
      },
    };

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

.tj-root {
  --bg: #0B0D10;
  --surface: #14181D;
  --surface-2: #1B2129;
  --surface-3: #232B34;
  --border: #262E38;
  --text: #ECEEF1;
  --text-dim: #8A93A1;
  --text-faint: #5B6472;
  --accent: #E8A33D;
  --accent-dim: #4A3A22;
  --profit: #3DDC97;
  --profit-dim: #16382C;
  --loss: #F0556B;
  --loss-dim: #3A1D24;
  --long: #5EC8D8;
  --short: #C97BE0;
  font-family: 'Inter', sans-serif;
  color: var(--text);
  background: var(--bg);
}
.tj-display { font-family: 'Space Grotesk', sans-serif; }
.tj-mono { font-family: 'IBM Plex Mono', monospace; }

.tj-phone {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  background: var(--bg);
  min-height: 100vh;
  position: relative;
  border-left: 1px solid var(--border);
  border-right: 1px solid var(--border);
  overflow-x: hidden;
  padding-bottom: 92px;
  box-sizing: border-box;
}

.tj-ticker-wrap {
  overflow: hidden;
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
  padding: 7px 0;
}
.tj-ticker-track {
  display: inline-flex;
  animation: tj-scroll 22s linear infinite;
}
.tj-ticker-item { padding: 0 18px; font-size: 12px; }
@keyframes tj-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.tj-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
}
.tj-input {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text);
  padding: 10px 12px;
  font-size: 14px;
  width: 100%;
  outline: none;
}
.tj-input-compact {
  padding: 8px 10px;
  font-size: 13px;
  border-radius: 9px;
}
.tj-input:focus { border-color: var(--accent); }
.tj-input::placeholder { color: var(--text-faint); }
.tj-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-dim);
  margin-bottom: 6px;
  display: block;
}
.tj-btn-primary {
  background: var(--accent);
  color: #1A1305;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  padding: 12px 16px;
  border: none;
}
.tj-btn-primary:active { transform: scale(0.98); }
.tj-btn-ghost {
  background: var(--surface-2);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 12px;
  font-weight: 500;
  font-size: 14px;
  padding: 12px 16px;
}
.tj-fab {
  position: fixed;
  bottom: 84px;
  right: calc(50% - 210px + 18px);
  background: var(--accent);
  color: #1A1305;
  border-radius: 999px;
  width: 56px; height: 56px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 24px rgba(232,163,61,0.35);
  z-index: 40;
}
@media (max-width: 460px) { .tj-fab { right: 18px; } }

.tj-navbar {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  margin-top: auto;
  background: rgba(11, 13, 16, 0.55);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-top: 1px solid rgba(255,255,255,0.08);
  display: flex;
  padding: 10px 0 calc(10px + env(safe-area-inset-bottom));
  z-index: 30;
}
.tj-navitem {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
  color: var(--text-faint); font-size: 10.5px;
}
.tj-navitem.active { color: var(--accent); }

.tj-badge {
  font-size: 10.5px; font-weight: 600; padding: 3px 8px; border-radius: 999px;
  display: inline-flex; align-items: center; gap: 3px;
}
.tj-sheet-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  z-index: 50; display: flex; align-items: flex-end; justify-content: center;
}
.tj-sheet {
  background: var(--bg);
  width: 100%; max-width: 420px;
  border-radius: 20px 20px 0 0;
  max-height: 92vh;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-bottom: none;
}
.tj-scroll-hide::-webkit-scrollbar { display: none; }
.tj-chip {
  font-size: 12.5px; padding: 6px 12px; border-radius: 999px;
  border: 1px solid var(--border); background: var(--surface-2); color: var(--text-dim);
}
.tj-chip.on { background: var(--accent-dim); border-color: var(--accent); color: var(--accent); }
.tj-toast {
  position: fixed; top: 14px; left: 50%; transform: translateX(-50%);
  background: var(--surface-3); border: 1px solid var(--border);
  padding: 10px 16px; border-radius: 10px; font-size: 13px; z-index: 100;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}
`;

const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 5);
const fmt2 = (n) => (Math.round((n + Number.EPSILON) * 100) / 100).toLocaleString();
const cls = (...a) => a.filter(Boolean).join(" ");

function calcPnl(t) {
  if (t.exitPrice == null || t.exitPrice === "" || !t.entryPrice || !t.positionSize) return { pnl: null, pnlPct: null, r: null };
  const dir = t.side === "long" ? 1 : -1;
  const pnl = (Number(t.exitPrice) - Number(t.entryPrice)) * Number(t.positionSize) * dir;
  const cost = Number(t.entryPrice) * Number(t.positionSize);
  const pnlPct = cost ? (pnl / cost) * 100 : 0;
  let r = null;
  if (t.stopLoss && Number(t.entryPrice) !== Number(t.stopLoss)) {
    const riskPerUnit = Math.abs(Number(t.entryPrice) - Number(t.stopLoss));
    r = riskPerUnit ? ((Number(t.exitPrice) - Number(t.entryPrice)) * dir) / riskPerUnit : null;
  }
  return { pnl, pnlPct, r };
}

function seedTrades() {
  const setups = ["Pumpt", "Visual","News"];
  const tfs = ["5m", "15m", "1H", "4H"];
  const out = [];
  let day = new Date();
  day.setDate(day.getDate() - 30);
  const tickers = ["AAPL", "TSLA", "NVDA", "EURUSD", "BTCUSD", "SPY"];
  for (let i = 0; i < 14; i++) {
    day = new Date(day.getTime() + 1000 * 60 * 60 * 24 * (1 + Math.random() * 1.5));
    const side = Math.random() > 0.5 ? "long" : "short";
    const entry = +(50 + Math.random() * 200).toFixed(2);
    const dir = side === "long" ? 1 : -1;
    const stop = +(entry - dir * (entry * 0.01)).toFixed(2);
    const take = +(entry + dir * (entry * 0.025)).toFixed(2);
    const size = Math.round(10 + Math.random() * 90);
    const closed = i < 11;
    const win = Math.random() > 0.42;
    const exit = closed ? +(entry + dir * (win ? entry * (0.008 + Math.random() * 0.02) : -entry * (0.005 + Math.random() * 0.012))).toFixed(2) : null;
    const t = {
      id: uid(),
      ticker: tickers[Math.floor(Math.random() * tickers.length)],
      side,
      entryDate: day.toISOString().slice(0, 10),
      entryTime: `${String(9 + Math.floor(Math.random() * 6)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
      entryPrice: entry,
      stopLoss: stop,
      takeProfit: take,
      positionSize: size,
      riskDollar: +(Math.abs(entry - stop) * size).toFixed(2),
      riskPercent: 1,
      timeframe: tfs[Math.floor(Math.random() * tfs.length)],
      setup: setups[Math.floor(Math.random() * setups.length)],
      tags: [["Momentum"], ["News"], ["Fakeout"], []][Math.floor(Math.random() * 4)],
      notes: "Demo trade generated for preview purposes.",
      entryScreenshot: null,
      exitScreenshot: null,
      status: closed ? "closed" : "open",
      exitPrice: exit,
      exitDate: closed ? day.toISOString().slice(0, 10) : null,
      exitTime: closed ? nowTime() : null,
      exitReason: closed ? (win ? "Take profit hit" : "Stop loss hit") : null,
      postComment: "",
      createdAt: Date.now() - (14 - i) * 1000 * 60 * 60,
    };
    if (closed) {
      const { pnl, pnlPct, r } = calcPnl(t);
      t.pnl = +pnl.toFixed(2);
      t.pnlPercent = +pnlPct.toFixed(2);
      t.rMultiple = r != null ? +r.toFixed(2) : null;
    } else {
      t.pnl = null; t.pnlPercent = null; t.rMultiple = null;
    }
    out.push(t);
  }
  return out.sort((a, b) => b.createdAt - a.createdAt);
}

const DEFAULT_SETUPS = ["Pumpt", "Visual", "News"];
const DEFAULT_TAGS = ["Pumpt", "Visual", "News", "Fakeout", "Momentum"];

export default function TradingJournalApp() {
  const [trades, setTrades] = useState([]);
  const [tags, setTags] = useState(DEFAULT_TAGS);
  const [setups, setSetups] = useState(DEFAULT_SETUPS);
  const [watchlist, setWatchlist] = useState([]);
  const [watchlistInput, setWatchlistInput] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [toast, setToast] = useState(null);
  const [newOpen, setNewOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [closeId, setCloseId] = useState(null);
  const [editTrade, setEditTrade] = useState(null);
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ status: "all", side: "all", result: "all", setup: "all", tag: "all" });

  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const telegramApp = typeof window !== "undefined" ? window.Telegram?.WebApp : null;
        const initData = telegramApp?.initData || params.get("tgWebAppData") || params.get("initData") || "";

        if (initData) {
          await loginWithTelegram(initData);
        }

        if (telegramApp) {
          telegramApp.ready();
          telegramApp.expand();
        }

        const remoteTrades = await fetchTrades();
        const items = remoteTrades?.items || remoteTrades || [];
        if (Array.isArray(items) && items.length) {
          setTrades(items);
        } else {
          const t = await STORAGE.get("tj-trades");
          const g = await STORAGE.get("tj-tags");
          const s = await STORAGE.get("tj-setups");
          const w = await STORAGE.get("tj-watchlist");
          setTrades(t ? JSON.parse(t.value) : seedTrades());
          setTags(g ? JSON.parse(g.value) : DEFAULT_TAGS);
          setSetups(s ? JSON.parse(s.value) : DEFAULT_SETUPS);
          setWatchlist(w ? JSON.parse(w.value) : []);
        }
      } catch (e) {
        const t = await STORAGE.get("tj-trades");
        const g = await STORAGE.get("tj-tags");
        const s = await STORAGE.get("tj-setups");
        const w = await STORAGE.get("tj-watchlist");
        setTrades(t ? JSON.parse(t.value) : seedTrades());
        setTags(g ? JSON.parse(g.value) : DEFAULT_TAGS);
        setSetups(s ? JSON.parse(s.value) : DEFAULT_SETUPS);
        setWatchlist(w ? JSON.parse(w.value) : []);
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    STORAGE.set("tj-trades", JSON.stringify(trades)).catch(() => {});
  }, [trades, loaded]);
  useEffect(() => {
    if (!loaded) return;
    STORAGE.set("tj-tags", JSON.stringify(tags)).catch(() => {});
  }, [tags, loaded]);
  useEffect(() => {
    if (!loaded) return;
    STORAGE.set("tj-setups", JSON.stringify(setups)).catch(() => {});
  }, [setups, loaded]);
  useEffect(() => {
    if (!loaded) return;
    STORAGE.set("tj-watchlist", JSON.stringify(watchlist)).catch(() => {});
  }, [watchlist, loaded]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }

  function addTicker() {
    const value = watchlistInput.trim().toUpperCase();
    if (!value) return;
    setWatchlist((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setWatchlistInput("");
  }

  function removeTicker(symbol) {
    setWatchlist((prev) => prev.filter((item) => item !== symbol));
  }

  async function addTrade(t) {
    try {
      const created = await createTrade({
        ticker: t.ticker,
        side: t.side,
        entryDate: t.entryDate,
        entryTime: t.entryTime,
        entryPrice: Number(t.entryPrice),
        stopLoss: t.stopLoss ? Number(t.stopLoss) : undefined,
        takeProfit: t.takeProfit ? Number(t.takeProfit) : undefined,
        positionSize: t.positionSize ? Number(t.positionSize) : undefined,
        riskDollar: t.riskDollar ? Number(t.riskDollar) : undefined,
        riskPercent: t.riskPercent ? Number(t.riskPercent) : undefined,
        timeframe: t.timeframe,
        setup: t.setup,
        notes: t.notes,
        tags: t.tags || [],
      });
      setTrades((prev) => [created, ...prev]);
      setNewOpen(false);
      showToast("Trade added");
    } catch (err) {
      setTrades((prev) => [{ ...t, id: uid(), status: "open", createdAt: Date.now(), pnl: null, pnlPercent: null, rMultiple: null }, ...prev]);
      setNewOpen(false);
      showToast(err.message || "Failed to add trade");
    }
  }
  async function updateTradeById(id, patch) {
    try {
      const updated = await updateTrade(id, patch);
      setTrades((prev) => prev.map((trade) => (trade.id === id ? updated : trade)));
      showToast("Trade updated");
    } catch (err) {
      setTrades((prev) => prev.map((trade) => (trade.id === id ? { ...trade, ...patch } : trade)));
      showToast(err.message || "Failed to update trade");
    }
  }
  async function deleteTradeById(id) {
    try {
      await deleteTrade(id);
      setTrades((prev) => prev.filter((trade) => trade.id !== id));
      setDetailId(null);
      showToast("Trade deleted");
    } catch (err) {
      setTrades((prev) => prev.filter((trade) => trade.id !== id));
      setDetailId(null);
      showToast(err.message || "Failed to delete trade");
    }
  }
  async function duplicateTradeById(trade) {
    try {
      const created = await duplicateTrade(trade.id);
      setTrades((prev) => [created, ...prev]);
      showToast("Trade duplicated");
    } catch (err) {
      const copy = { ...trade, id: uid(), status: "open", createdAt: Date.now(), exitPrice: null, exitDate: null, exitTime: null, exitReason: null, pnl: null, pnlPercent: null, rMultiple: null, postComment: "" };
      setTrades((prev) => [copy, ...prev]);
      showToast(err.message || "Failed to duplicate trade");
    }
  }
  async function closeTradeById(id, data) {
    try {
      const trade = trades.find((item) => item.id === id);
      const merged = { ...trade, ...data };
      const { pnl, pnlPct, r } = calcPnl(merged);
      const payload = {
        ...data,
        pnl: data.pnl !== "" && data.pnl != null ? Number(data.pnl) : (pnl != null ? +pnl.toFixed(2) : null),
        pnlPercent: data.pnlPercent !== "" && data.pnlPercent != null ? Number(data.pnlPercent) : (pnlPct != null ? +pnlPct.toFixed(2) : null),
        rMultiple: data.rMultiple !== "" && data.rMultiple != null ? Number(data.rMultiple) : (r != null ? +r.toFixed(2) : null),
      };
      const updated = await closeTrade(id, payload);
      setTrades((prev) => prev.map((item) => (item.id === id ? updated : item)));
      setCloseId(null);
      setDetailId(null);
      showToast("Trade closed");
    } catch (err) {
      const trade = trades.find((item) => item.id === id);
      const merged = { ...trade, ...data };
      const { pnl, pnlPct, r } = calcPnl(merged);
      updateTradeById(id, {
        ...data,
        status: "closed",
        pnl: data.pnl !== "" && data.pnl != null ? Number(data.pnl) : (pnl != null ? +pnl.toFixed(2) : null),
        pnlPercent: data.pnlPercent !== "" && data.pnlPercent != null ? Number(data.pnlPercent) : (pnlPct != null ? +pnlPct.toFixed(2) : null),
        rMultiple: data.rMultiple !== "" && data.rMultiple != null ? Number(data.rMultiple) : (r != null ? +r.toFixed(2) : null),
      });
      setCloseId(null);
      setDetailId(null);
      showToast(err.message || "Failed to close trade");
    }
  }

  const filtered = useMemo(() => {
    let out = trades;
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter((trade) =>
        trade.ticker.toLowerCase().includes(q) ||
        (trade.notes || "").toLowerCase().includes(q) ||
        (trade.tags || []).some((tag) => tag.toLowerCase().includes(q))
      );
    }
    if (filters.status !== "all") out = out.filter((trade) => trade.status === filters.status);
    if (filters.side !== "all") out = out.filter((trade) => trade.side === filters.side);
    if (filters.result !== "all") out = out.filter((trade) => trade.status === "closed" && (filters.result === "profit" ? trade.pnl > 0 : trade.pnl <= 0));
    if (filters.setup !== "all") out = out.filter((trade) => trade.setup === filters.setup);
    if (filters.tag !== "all") out = out.filter((trade) => (trade.tags || []).includes(filters.tag));
    return out;
  }, [trades, search, filters]);

  const stats = useMemo(() => computeStats(trades), [trades]);
  const detailTrade = trades.find((trade) => trade.id === detailId) || null;
  const closingTrade = trades.find((trade) => trade.id === closeId) || null;

  if (!loaded) {
    return (
      <div className="tj-root" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{STYLE}</style>
        <div className="tj-mono" style={{ color: "var(--text-dim)", fontSize: 13 }}>loading journal…</div>
      </div>
    );
  }

  return (
    <div className="tj-root">
      <style>{STYLE}</style>
      <div className="tj-phone tj-scroll-hide">
        <TickerTape stats={stats} />

        {tab === "dashboard" && (
          <Dashboard
            stats={stats}
            trades={trades}
            search={search}
            setSearch={setSearch}
            onOpenFilter={() => setFilterOpen(true)}
            onOpenDetail={setDetailId}
            filtersActive={Object.values(filters).some((value) => value !== "all")}
            filtered={filtered}
            goJournal={() => setTab("journal")}
          />
        )}
        {tab === "journal" && (
          <Journal
            trades={filtered}
            search={search}
            setSearch={setSearch}
            onOpenFilter={() => setFilterOpen(true)}
            onOpenDetail={setDetailId}
            filtersActive={Object.values(filters).some((value) => value !== "all")}
            onExport={(type) => exportTrades(trades, type, showToast)}
          />
        )}
        {tab === "stats" && <StatsScreen stats={stats} trades={trades} />}
        {tab === "watchlist" && (
          <div style={{ padding: 18 }}>
            <div className="tj-display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Watchlist</div>
            <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginBottom: 12 }}>Track your favorite tickers in one place.</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input className="tj-input tj-input-compact" placeholder="Add ticker (AAPL)" value={watchlistInput} onChange={(event) => setWatchlistInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTicker(); } }} />
              <button className="tj-btn-primary" onClick={addTicker}>Add</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {watchlist.length === 0 ? (
                <div className="tj-card" style={{ padding: 16, color: "var(--text-dim)", fontSize: 13 }}>No tickers yet.</div>
              ) : watchlist.map((symbol) => (
                <div key={symbol} className="tj-card" style={{ padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div className="tj-display" style={{ fontSize: 16, fontWeight: 700 }}>{symbol}</div>
                  <button className="tj-btn-ghost" style={{ padding: "6px 10px", fontSize: 12 }} onClick={() => removeTicker(symbol)}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button className="tj-fab" onClick={() => setNewOpen(true)} aria-label="New trade">
          <Plus size={26} strokeWidth={2.4} />
        </button>

        <nav className="tj-navbar">
          <NavItem icon={Home} label="Dashboard" active={tab === "dashboard"} onClick={() => setTab("dashboard")} />
          <NavItem icon={BookOpen} label="Journal" active={tab === "journal"} onClick={() => setTab("journal")} />
          <NavItem icon={Eye} label="Watchlist" active={tab === "watchlist"} onClick={() => setTab("watchlist")} />
          <NavItem icon={BarChart2} label="Stats" active={tab === "stats"} onClick={() => setTab("stats")} />
        </nav>
      </div>

      {newOpen && (
        <TradeForm
          mode="new"
          setups={setups}
          setSetups={setSetups}
          tags={tags}
          setTags={setTags}
          onClose={() => setNewOpen(false)}
          onSubmit={addTrade}
        />
      )}

      {editTrade && (
        <TradeForm
          mode="edit"
          initial={editTrade}
          setups={setups}
          setSetups={setSetups}
          tags={tags}
          setTags={setTags}
          onClose={() => setEditTrade(null)}
          onSubmit={(data) => {
            updateTradeById(editTrade.id, data);
            setEditTrade(null);
          }}
        />
      )}

      {detailTrade && (
        <TradeDetail
          trade={detailTrade}
          onClose={() => setDetailId(null)}
          onEdit={() => {
            setEditTrade(detailTrade);
            setDetailId(null);
          }}
          onDelete={() => deleteTradeById(detailTrade.id)}
          onDuplicate={() => {
            duplicateTradeById(detailTrade);
            setDetailId(null);
          }}
          onCloseTrade={() => {
            setCloseId(detailTrade.id);
            setDetailId(null);
          }}
        />
      )}

      {closingTrade && (
        <CloseTradeForm
          trade={closingTrade}
          onClose={() => setCloseId(null)}
          onSubmit={(data) => closeTradeById(closingTrade.id, data)}
        />
      )}

      {filterOpen && (
        <FilterSheet
          filters={filters}
          setFilters={setFilters}
          setups={setups}
          tags={tags}
          onClose={() => setFilterOpen(false)}
        />
      )}

      {toast && <div className="tj-toast">{toast}</div>}
    </div>
  );
}

function getTodayKey(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function computeStats(trades) {
  const closed = trades.filter((trade) => trade.status === "closed" && trade.pnl != null);
  const open = trades.filter((trade) => trade.status === "open");
  const totalPnl = closed.reduce((sum, trade) => sum + trade.pnl, 0);
  const todayKey = getTodayKey();
  const todayPnl = closed.reduce((sum, trade) => (trade.exitDate === todayKey ? sum + trade.pnl : sum), 0);
  const totalPnlPct = closed.reduce((sum, trade) => sum + (trade.pnlPercent || 0), 0);
  const wins = closed.filter((trade) => trade.pnl > 0);
  const losses = closed.filter((trade) => trade.pnl <= 0);
  const winRate = closed.length ? (wins.length / closed.length) * 100 : 0;
  const avgWin = wins.length ? wins.reduce((sum, trade) => sum + trade.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length ? losses.reduce((sum, trade) => sum + trade.pnl, 0) / losses.length : 0;
  const grossWin = wins.reduce((sum, trade) => sum + trade.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((sum, trade) => sum + trade.pnl, 0));
  const profitFactor = grossLoss ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0;
  const expectancy = closed.length ? totalPnl / closed.length : 0;
  const rTrades = closed.filter((trade) => trade.rMultiple != null);
  const avgR = rTrades.length ? rTrades.reduce((sum, trade) => sum + trade.rMultiple, 0) / rTrades.length : 0;
  const best = closed.length ? closed.reduce((a, b) => (b.pnl > a.pnl ? b : a)) : null;
  const worst = closed.length ? closed.reduce((a, b) => (b.pnl < a.pnl ? b : a)) : null;

  const chrono = [...closed].sort((a, b) => new Date(a.exitDate) - new Date(b.exitDate));
  let curStreak = 0, maxWinStreak = 0, maxLossStreak = 0, curType = null;
  chrono.forEach((trade) => {
    const isWin = trade.pnl > 0;
    if (curType === isWin) curStreak++; else { curStreak = 1; curType = isWin; }
    if (isWin) maxWinStreak = Math.max(maxWinStreak, curStreak);
    else maxLossStreak = Math.max(maxLossStreak, curStreak);
  });

  let equity = 0;
  const equityCurve = chrono.map((trade) => { equity += trade.pnl; return { date: trade.exitDate, equity: +equity.toFixed(2) }; });

  const byDayMap = {};
  chrono.forEach((trade) => { byDayMap[trade.exitDate] = (byDayMap[trade.exitDate] || 0) + trade.pnl; });
  const byDay = Object.entries(byDayMap).map(([date, pnl]) => ({ date, pnl: +pnl.toFixed(2) }));

  const byMonthMap = {};
  chrono.forEach((trade) => {
    const month = (trade.exitDate || "").slice(0, 7);
    if (!byMonthMap[month]) byMonthMap[month] = { pnl: 0, wins: 0, total: 0 };
    byMonthMap[month].pnl += trade.pnl;
    byMonthMap[month].total += 1;
    if (trade.pnl > 0) byMonthMap[month].wins += 1;
  });
  const byMonth = Object.entries(byMonthMap).map(([month, value]) => ({ month, pnl: +value.pnl.toFixed(2), winRate: value.total ? +((value.wins / value.total) * 100).toFixed(1) : 0 }));

  return {
    totalPnl, todayPnl, totalPnlPct, winRate, tradeCount: trades.length, closedCount: closed.length,
    openCount: open.length, longCount: trades.filter((trade) => trade.side === "long").length,
    shortCount: trades.filter((trade) => trade.side === "short").length,
    avgWin, avgLoss, profitFactor, expectancy, avgR, best, worst, maxWinStreak, maxLossStreak,
    equityCurve, byDay, byMonth,
  };
}

function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button className={cls("tj-navitem", active && "active")} onClick={onClick}>
      <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
      <span>{label}</span>
    </button>
  );
}

function TickerTape({ stats }) {
  const items = [
    { label: "TODAY", value: `${stats.todayPnl >= 0 ? "+" : ""}${fmt2(stats.todayPnl)}`, color: stats.todayPnl >= 0 ? "var(--profit)" : "var(--loss)" },
    { label: "WIN RATE", value: `${fmt2(stats.winRate)}%`, color: "var(--text)" },
    { label: "OPEN", value: `${stats.openCount}`, color: "var(--long)" },
    { label: "TRADES", value: `${stats.tradeCount}`, color: "var(--text)" },
    { label: "PF", value: stats.profitFactor === Infinity ? "∞" : fmt2(stats.profitFactor), color: "var(--text)" },
    { label: "AVG R", value: `${fmt2(stats.avgR)}R`, color: "var(--text)" },
  ];
  const doubled = [...items, ...items];
  return (
    <div className="tj-ticker-wrap">
      <div className="tj-ticker-track">
        {doubled.map((item, index) => (
          <span key={index} className="tj-ticker-item tj-mono">
            <span style={{ color: "var(--text-faint)" }}>{item.label}</span>{" "}
            <span style={{ color: item.color, fontWeight: 600 }}>{item.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function SearchBar({ search, setSearch, onOpenFilter, filtersActive }) {
  return (
    <div style={{ display: "flex", gap: 8, padding: "12px 16px" }}>
      <div style={{ flex: 1, position: "relative" }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: 12, color: "var(--text-faint)" }} />
        <input className="tj-input" style={{ paddingLeft: 34 }} placeholder="Search ticker, notes, tags…" value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>
      <button className="tj-btn-ghost" style={{ padding: "0 14px", position: "relative" }} onClick={onOpenFilter}>
        <SlidersHorizontal size={16} />
        {filtersActive && <span style={{ position: "absolute", top: -3, right: -3, width: 8, height: 8, borderRadius: 999, background: "var(--accent)" }} />}
      </button>
    </div>
  );
}

function PnlText({ value, size = 14 }) {
  if (value == null) return <span className="tj-mono" style={{ color: "var(--text-faint)", fontSize: size }}>—</span>;
  const positive = value >= 0;
  return (
    <span className="tj-mono" style={{ color: positive ? "var(--profit)" : "var(--loss)", fontWeight: 600, fontSize: size }}>
      {positive ? "+" : ""}{fmt2(value)}
    </span>
  );
}

function SideBadge({ side }) {
  const isLong = side === "long";
  return (
    <span className="tj-badge" style={{ background: isLong ? "rgba(94,200,216,0.12)" : "rgba(201,123,224,0.12)", color: isLong ? "var(--long)" : "var(--short)" }}>
      {isLong ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
      {isLong ? "LONG" : "SHORT"}
    </span>
  );
}

function StatusBadge({ status }) {
  const open = status === "open";
  return (
    <span className="tj-badge" style={{ background: open ? "rgba(232,163,61,0.12)" : "rgba(138,147,161,0.12)", color: open ? "var(--accent)" : "var(--text-dim)" }}>
      {open ? "OPEN" : "CLOSED"}
    </span>
  );
}

function TradeRow({ trade, onClick }) {
  return (
    <button onClick={onClick} className="tj-card" style={{ display: "flex", width: "100%", textAlign: "left", padding: 13, marginBottom: 10, alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
          <span className="tj-display" style={{ fontWeight: 700, fontSize: 15 }}>{trade.ticker}</span>
          <SideBadge side={trade.side} />
          <StatusBadge status={trade.status} />
        </div>
        <div style={{ fontSize: 11.5, color: "var(--text-faint)", display: "flex", gap: 10 }}>
          <span>{trade.entryDate}</span>
          {trade.setup && <span>· {trade.setup}</span>}
          {trade.timeframe && <span>· {trade.timeframe}</span>}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <PnlText value={trade.pnl} size={15} />
        {trade.rMultiple != null && <div className="tj-mono" style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>{trade.rMultiple >= 0 ? "+" : ""}{fmt2(trade.rMultiple)}R</div>}
      </div>
      <ChevronRight size={16} color="var(--text-faint)" />
    </button>
  );
}

function Dashboard({ stats, search, setSearch, onOpenFilter, onOpenDetail, filtersActive, filtered, goJournal }) {
  const recent = filtered.slice(0, 6);
  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding: "18px 16px 4px" }}>
        <div className="tj-display" style={{ fontSize: 22, fontWeight: 700 }}>Journal</div>
        <div style={{ fontSize: 12.5, color: "var(--text-dim)" }}>Your trading desk at a glance</div>
      </div>

      <div style={{ padding: "14px 16px 4px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="tj-card" style={{ padding: 14 }}>
          <div className="tj-label" style={{ marginBottom: 8 }}>Today P&L</div>
          <PnlText value={stats.todayPnl} size={20} />
        </div>
        <div className="tj-card" style={{ padding: 14 }}>
          <div className="tj-label" style={{ marginBottom: 8 }}>Win Rate</div>
          <div className="tj-mono" style={{ fontSize: 20, fontWeight: 600 }}>{fmt2(stats.winRate)}%</div>
        </div>
        <div className="tj-card" style={{ padding: 14 }}>
          <div className="tj-label" style={{ marginBottom: 8 }}>Profit Factor</div>
          <div className="tj-mono" style={{ fontSize: 20, fontWeight: 600 }}>{stats.profitFactor === Infinity ? "∞" : fmt2(stats.profitFactor)}</div>
        </div>
        <div className="tj-card" style={{ padding: 14 }}>
          <div className="tj-label" style={{ marginBottom: 8 }}>Open Trades</div>
          <div className="tj-mono" style={{ fontSize: 20, fontWeight: 600, color: "var(--accent)" }}>{stats.openCount}</div>
        </div>
      </div>

      <SearchBar search={search} setSearch={setSearch} onOpenFilter={onOpenFilter} filtersActive={filtersActive} />

      <div style={{ padding: "0 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-dim)" }}>Recent trades</div>
          <button onClick={goJournal} style={{ fontSize: 12, color: "var(--accent)" }}>View all</button>
        </div>
        {recent.length === 0 && <EmptyState text="No trades match. Try clearing filters or add your first trade." />}
        {recent.map((trade) => <TradeRow key={trade.id} trade={trade} onClick={() => onOpenDetail(trade.id)} />)}
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="tj-card" style={{ padding: 24, textAlign: "center", color: "var(--text-dim)", fontSize: 13 }}>
      {text}
    </div>
  );
}

function Journal({ trades, search, setSearch, onOpenFilter, onOpenDetail, filtersActive, onExport }) {
  const [exportOpen, setExportOpen] = useState(false);
  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding: "18px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="tj-display" style={{ fontSize: 20, fontWeight: 700 }}>All trades</div>
        <button className="tj-btn-ghost" style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 6, fontSize: 12.5 }} onClick={() => setExportOpen((value) => !value)}>
          <Download size={14} /> Export
        </button>
      </div>
      {exportOpen && (
        <div style={{ padding: "8px 16px 0", display: "flex", gap: 8 }}>
          {['csv', 'xlsx', 'pdf'].map((format) => (
            <button key={format} className="tj-chip" onClick={() => { onExport(format); setExportOpen(false); }}>{format.toUpperCase()}</button>
          ))}
        </div>
      )}
      <SearchBar search={search} setSearch={setSearch} onOpenFilter={onOpenFilter} filtersActive={filtersActive} />
      <div style={{ padding: "0 16px" }}>
        {trades.length === 0 && <EmptyState text="No trades match your search or filters." />}
        {trades.map((trade) => <TradeRow key={trade.id} trade={trade} onClick={() => onOpenDetail(trade.id)} />)}
      </div>
    </div>
  );
}

function StatsScreen({ stats, trades }) {
  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding: "18px 16px 4px" }}>
        <div className="tj-display" style={{ fontSize: 20, fontWeight: 700 }}>Statistics</div>
        <div style={{ fontSize: 12.5, color: "var(--text-dim)" }}>{stats.closedCount} closed · {stats.openCount} open</div>
      </div>

      <div style={{ padding: "14px 16px 0" }}>
        <div className="tj-card" style={{ padding: 16 }}>
          <div className="tj-label">Equity curve</div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={stats.equityCurve}>
              <defs>
                <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E8A33D" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#E8A33D" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Tooltip contentStyle={{ background: "#1B2129", border: "1px solid #262E38", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#8A93A1" }} />
              <Area type="monotone" dataKey="equity" stroke="#E8A33D" fill="url(#eq)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ padding: "12px 16px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <StatTile label="Total P&L %" value={`${fmt2(stats.totalPnlPct)}%`} />
        <StatTile label="Expectancy" value={fmt2(stats.expectancy)} />
        <StatTile label="Avg win" value={fmt2(stats.avgWin)} color="var(--profit)" />
        <StatTile label="Avg loss" value={fmt2(stats.avgLoss)} color="var(--loss)" />
        <StatTile label="Long / Short" value={`${stats.longCount} / ${stats.shortCount}`} />
        <StatTile label="Avg R" value={`${fmt2(stats.avgR)}R`} />
      </div>

      <div style={{ padding: "12px 16px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="tj-card" style={{ padding: 14 }}>
          <div className="tj-label" style={{ display: "flex", alignItems: "center", gap: 5 }}><Trophy size={12} /> Best trade</div>
          {stats.best ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{stats.best.ticker}</div>
              <PnlText value={stats.best.pnl} size={16} />
            </>
          ) : <div style={{ color: "var(--text-faint)", fontSize: 12 }}>—</div>}
        </div>
        <div className="tj-card" style={{ padding: 14 }}>
          <div className="tj-label" style={{ display: "flex", alignItems: "center", gap: 5 }}><Skull size={12} /> Worst trade</div>
          {stats.worst ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{stats.worst.ticker}</div>
              <PnlText value={stats.worst.pnl} size={16} />
            </>
          ) : <div style={{ color: "var(--text-faint)", fontSize: 12 }}>—</div>}
        </div>
        <div className="tj-card" style={{ padding: 14 }}>
          <div className="tj-label" style={{ display: "flex", alignItems: "center", gap: 5 }}><Flame size={12} /> Win streak</div>
          <div className="tj-mono" style={{ fontSize: 18, fontWeight: 600, color: "var(--profit)" }}>{stats.maxWinStreak}</div>
        </div>
        <div className="tj-card" style={{ padding: 14 }}>
          <div className="tj-label" style={{ display: "flex", alignItems: "center", gap: 5 }}><Flame size={12} /> Loss streak</div>
          <div className="tj-mono" style={{ fontSize: 18, fontWeight: 600, color: "var(--loss)" }}>{stats.maxLossStreak}</div>
        </div>
      </div>

      <div style={{ padding: "12px 16px 0" }}>
        <div className="tj-card" style={{ padding: 16 }}>
          <div className="tj-label">P&L by day</div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={stats.byDay}>
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Tooltip contentStyle={{ background: "#1B2129", border: "1px solid #262E38", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#8A93A1" }} />
              <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                {stats.byDay.map((day, index) => <Cell key={index} fill={day.pnl >= 0 ? "#3DDC97" : "#F0556B"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ padding: "12px 16px 0" }}>
        <div className="tj-card" style={{ padding: 16 }}>
          <div className="tj-label">Win rate by month</div>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={stats.byMonth}>
              <CartesianGrid stroke="#262E38" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#5B6472", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "#1B2129", border: "1px solid #262E38", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#8A93A1" }} />
              <Line type="monotone" dataKey="winRate" stroke="#5EC8D8" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, color }) {
  return (
    <div className="tj-card" style={{ padding: 14 }}>
      <div className="tj-label" style={{ marginBottom: 6 }}>{label}</div>
      <div className="tj-mono" style={{ fontSize: 16, fontWeight: 600, color: color || "var(--text)" }}>{value}</div>
    </div>
  );
}

function Field({ label, value }) {
  if (value == null || value === "") return null;
  return (
    <div>
      <div className="tj-label" style={{ marginBottom: 3 }}>{label}</div>
      <div className="tj-mono" style={{ fontSize: 13.5 }}>{value}</div>
    </div>
  );
}

function TradeDetail({ trade, onClose, onEdit, onDelete, onDuplicate, onCloseTrade }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [fullImg, setFullImg] = useState(null);
  return (
    <div className="tj-sheet-backdrop" onClick={onClose}>
      <div className="tj-sheet tj-scroll-hide" onClick={(event) => event.stopPropagation()}>
        <SheetHeader title={`${trade.ticker}`} onClose={onClose} />
        <div style={{ padding: "0 18px 24px" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <SideBadge side={trade.side} />
            <StatusBadge status={trade.status} />
            {trade.setup && <span className="tj-badge" style={{ background: "var(--surface-2)", color: "var(--text-dim)" }}>{trade.setup}</span>}
          </div>

          <div className="tj-card" style={{ padding: 16, marginBottom: 16, textAlign: "center" }}>
            <div className="tj-label">P&L</div>
            <PnlText value={trade.pnl} size={28} />
            {trade.pnlPercent != null && <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>{trade.pnlPercent >= 0 ? "+" : ""}{fmt2(trade.pnlPercent)}% {trade.rMultiple != null && `· ${trade.rMultiple >= 0 ? "+" : ""}${fmt2(trade.rMultiple)}R`}</div>}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
            <Field label="Entry date" value={`${trade.entryDate} ${trade.entryTime || ""}`} />
            <Field label="Timeframe" value={trade.timeframe} />
            <Field label="Entry price" value={trade.entryPrice} />
            <Field label="Exit price" value={trade.exitPrice} />
            <Field label="Stop loss" value={trade.stopLoss} />
            <Field label="Take profit" value={trade.takeProfit} />
            <Field label="Position size" value={trade.positionSize} />
            <Field label="Risk $" value={trade.riskDollar} />
            <Field label="Risk %" value={trade.riskPercent} />
            <Field label="Exit reason" value={trade.exitReason} />
          </div>

          {trade.tags && trade.tags.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div className="tj-label" style={{ marginBottom: 6 }}>Tags</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {trade.tags.map((tag) => <span key={tag} className="tj-chip">{tag}</span>)}
              </div>
            </div>
          )}

          {trade.notes && (
            <div style={{ marginBottom: 16 }}>
              <div className="tj-label" style={{ marginBottom: 6 }}>Notes</div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text)" }}>{trade.notes}</div>
            </div>
          )}
          {trade.postComment && (
            <div style={{ marginBottom: 16 }}>
              <div className="tj-label" style={{ marginBottom: 6 }}>Post-trade comment</div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text)" }}>{trade.postComment}</div>
            </div>
          )}

          {(trade.entryScreenshot || trade.exitScreenshot) && (
            <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
              {trade.entryScreenshot && (
                <img src={trade.entryScreenshot} alt="entry" onClick={() => setFullImg(trade.entryScreenshot)} style={{ width: "50%", borderRadius: 10, border: "1px solid var(--border)", cursor: "pointer" }} />
              )}
              {trade.exitScreenshot && (
                <img src={trade.exitScreenshot} alt="exit" onClick={() => setFullImg(trade.exitScreenshot)} style={{ width: "50%", borderRadius: 10, border: "1px solid var(--border)", cursor: "pointer" }} />
              )}
            </div>
          )}

          {trade.status === "open" && (
            <button className="tj-btn-primary" style={{ width: "100%", marginBottom: 10 }} onClick={onCloseTrade}>Close trade</button>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="tj-btn-ghost" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }} onClick={onEdit}><Edit2 size={14} /> Edit</button>
            <button className="tj-btn-ghost" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }} onClick={onDuplicate}><Copy size={14} /> Duplicate</button>
            <button className="tj-btn-ghost" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "var(--loss)" }} onClick={() => setConfirmDelete(true)}><Trash2 size={14} /> Delete</button>
          </div>

          {confirmDelete && (
            <div className="tj-card" style={{ padding: 14, marginTop: 12 }}>
              <div style={{ fontSize: 13, marginBottom: 10 }}>Delete this trade permanently?</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="tj-btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmDelete(false)}>Cancel</button>
                <button className="tj-btn-primary" style={{ flex: 1, background: "var(--loss)", color: "#fff" }} onClick={onDelete}>Delete</button>
              </div>
            </div>
          )}
        </div>
      </div>
      {fullImg && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={(event) => { event.stopPropagation(); setFullImg(null); }}>
          <img src={fullImg} alt="full" style={{ maxWidth: "94%", maxHeight: "94%", borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
}

function SheetHeader({ title, onClose }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 8px", position: "sticky", top: 0, background: "var(--bg)", zIndex: 5 }}>
      <div className="tj-display" style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
      <button onClick={onClose} style={{ color: "var(--text-dim)" }}><X size={20} /></button>
    </div>
  );
}

function TradeForm({ mode, initial, setups, setSetups, tags, setTags, onClose, onSubmit }) {
  const [form, setForm] = useState(() => initial || {
    ticker: "", side: "long", entryDate: todayISO(), entryTime: nowTime(),
    entryPrice: "", stopLoss: "", takeProfit: "", positionSize: "",
    riskDollar: "", riskPercent: "", timeframe: "15m", setup: setups[0] || "",
    tags: [], notes: "", entryScreenshot: null,
  });
  const [newSetup, setNewSetup] = useState("");
  const [newTag, setNewTag] = useState("");
  const [editingSetup, setEditingSetup] = useState(null);
  const [editingSetupValue, setEditingSetupValue] = useState("");
  const fileRef = useRef();

  function setValue(key, value) { setForm((prev) => ({ ...prev, [key]: value })); }
  function toggleTag(tag) { setForm((prev) => ({ ...prev, tags: prev.tags.includes(tag) ? prev.tags.filter((item) => item !== tag) : [...prev.tags, tag] })); }

  function autoRiskAndSize() {
    const entryPrice = Number(form.entryPrice);
    const stopLoss = Number(form.stopLoss);
    const positionSize = Number(form.positionSize);
    const riskDollar = Number(form.riskDollar);
    const riskPercent = Number(form.riskPercent);
    const riskPerShare = Math.abs(entryPrice - stopLoss);

    if (!Number.isFinite(entryPrice) || !Number.isFinite(stopLoss) || !Number.isFinite(riskPerShare) || riskPerShare <= 0) {
      return;
    }

    if (Number.isFinite(positionSize) && positionSize > 0 && (!Number.isFinite(riskDollar) || riskDollar <= 0)) {
      setValue("riskDollar", +(riskPerShare * positionSize).toFixed(2));
      return;
    }

    if (Number.isFinite(riskDollar) && riskDollar > 0) {
      setValue("positionSize", +(riskDollar / riskPerShare).toFixed(2));
      return;
    }

    if (Number.isFinite(riskPercent) && riskPercent > 0) {
      const riskCapital = 10000 * (riskPercent / 100);
      setValue("positionSize", +(riskCapital / riskPerShare).toFixed(2));
    }
  }

  const computedRisk = (() => {
    const entryPrice = Number(form.entryPrice);
    const stopLoss = Number(form.stopLoss);
    const riskDollar = Number(form.riskDollar);
    const positionSize = Number(form.positionSize);
    const riskPerShare = Math.abs(entryPrice - stopLoss);
    if (!Number.isFinite(entryPrice) || !Number.isFinite(stopLoss) || !Number.isFinite(riskPerShare) || riskPerShare <= 0) {
      return null;
    }
    if (Number.isFinite(riskDollar) && riskDollar > 0) {
      return {
        riskDollar: +riskDollar.toFixed(2),
        shares: +(riskDollar / riskPerShare).toFixed(2),
      };
    }
    if (Number.isFinite(positionSize) && positionSize > 0) {
      return {
        riskDollar: +(riskPerShare * positionSize).toFixed(2),
        shares: +positionSize.toFixed(2),
      };
    }
    return null;
  })();

  function addSetup() {
    const value = newSetup.trim();
    if (!value) return;
    const normalized = value.replace(/\s+/g, " ");
    const exists = setups.some((setup) => setup.toLowerCase() === normalized.toLowerCase());
    if (exists) {
      setValue("setup", normalized);
      setNewSetup("");
      return;
    }
    setSetups((prev) => [...prev, normalized]);
    setValue("setup", normalized);
    setNewSetup("");
  }

  function saveSetupEdit() {
    const value = editingSetupValue.trim().replace(/\s+/g, " ");
    if (!value || !editingSetup) return;
    const exists = setups.some((setup) => setup.toLowerCase() === value.toLowerCase() && setup !== editingSetup);
    if (exists) return;
    setSetups((prev) => prev.map((setup) => (setup === editingSetup ? value : setup)));
    if (form.setup === editingSetup) {
      setValue("setup", value);
    }
    setEditingSetup(null);
    setEditingSetupValue("");
  }

  function deleteSetup(setupToDelete) {
    if (!setupToDelete) return;
    setSetups((prev) => prev.filter((setup) => setup !== setupToDelete));
    if (form.setup === setupToDelete) {
      const nextSetup = setups.find((setup) => setup !== setupToDelete) || "";
      setValue("setup", nextSetup);
    }
  }

  function addTag() {
    const value = newTag.trim();
    if (!value) return;
    const normalized = value.replace(/\s+/g, " ");
    if (!tags.includes(normalized)) {
      setTags((prev) => [...prev, normalized]);
    }
    toggleTag(normalized);
    setNewTag("");
  }

  function onImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setValue("entryScreenshot", reader.result);
    reader.readAsDataURL(file);
  }

  function submit() {
    if (!form.ticker || !form.entryPrice) return;
    onSubmit({ ...form, ticker: form.ticker.toUpperCase() });
  }

  return (
    <div className="tj-sheet-backdrop" onClick={onClose}>
      <div className="tj-sheet tj-scroll-hide" onClick={(event) => event.stopPropagation()}>
        <SheetHeader title={mode === "new" ? "New trade" : "Edit trade"} onClose={onClose} />
        <div style={{ padding: "0 18px 100px" }}>
          <SectionLabel text="Basic info" />
          <Row2>
            <div>
              <label className="tj-label">Ticker</label>
              <input className="tj-input tj-input-compact" placeholder="AAPL" value={form.ticker} onChange={(event) => setValue("ticker", event.target.value.toUpperCase())} />
            </div>
            <div>
              <label className="tj-label">Type</label>
              <div style={{ display: "flex", gap: 6 }}>
                <button className={cls("tj-chip", form.side === "long" && "on")} style={{ flex: 1 }} onClick={() => setValue("side", "long")}>Long</button>
                <button className={cls("tj-chip", form.side === "short" && "on")} style={{ flex: 1 }} onClick={() => setValue("side", "short")}>Short</button>
              </div>
            </div>
          </Row2>
          <Row2>
            <div>
              <label className="tj-label">Date</label>
              <input type="date" className="tj-input tj-input-compact" value={form.entryDate} onChange={(event) => setValue("entryDate", event.target.value)} />
            </div>
            <div>
              <label className="tj-label">Time in</label>
              <input type="time" className="tj-input tj-input-compact" value={form.entryTime} onChange={(event) => setValue("entryTime", event.target.value)} />
            </div>
          </Row2>

          <SectionLabel text="Entry" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <NumField label="Entry price" value={form.entryPrice} onChange={(value) => setValue("entryPrice", value)} onBlur={autoRiskAndSize} />
            <NumField label="Stop loss" value={form.stopLoss} onChange={(value) => setValue("stopLoss", value)} onBlur={autoRiskAndSize} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <NumField label="Take profit" value={form.takeProfit} onChange={(value) => setValue("takeProfit", value)} />
            <NumField label="Risk ($)" value={form.riskDollar} onChange={(value) => setValue("riskDollar", value)} onBlur={autoRiskAndSize} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            <NumField label="Risk (%)" value={form.riskPercent} onChange={(value) => setValue("riskPercent", value)} onBlur={autoRiskAndSize} />
            <NumField label="Shares" value={form.positionSize} onChange={(value) => setValue("positionSize", value)} onBlur={autoRiskAndSize} />
          </div>
          <div className="tj-card" style={{ padding: 10, marginBottom: 12, borderColor: "var(--accent-dim)" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-dim)", marginBottom: 6 }}>Position sizing</div>
            {computedRisk ? (
              <div style={{ fontSize: 13, color: "var(--text)" }}>
                Risk: <span className="tj-mono" style={{ color: "var(--accent)" }}>${computedRisk.riskDollar}</span> · Shares: <span className="tj-mono" style={{ color: "var(--accent)" }}>{computedRisk.shares}</span>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: "var(--text-dim)" }}>Enter entry, stop loss, and risk to calculate shares.</div>
            )}
          </div>
          <SectionLabel text="Additional" />
          <div style={{ marginBottom: 14 }}>
            <label className="tj-label">Setup</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {setups.map((setup) => (
                <div key={setup} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button className={cls("tj-chip", form.setup === setup && "on")} onClick={() => setValue("setup", setup)}>{setup}</button>
                  <button className="tj-btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => { setEditingSetup(setup); setEditingSetupValue(setup); }}>Edit</button>
                  <button className="tj-btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--loss)" }} onClick={() => deleteSetup(setup)}>Delete</button>
                </div>
              ))}
            </div>
            {editingSetup && (
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <input className="tj-input tj-input-compact" value={editingSetupValue} onChange={(event) => setEditingSetupValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); saveSetupEdit(); } }} />
                <button className="tj-btn-ghost" onClick={saveSetupEdit}>Save</button>
                <button className="tj-btn-ghost" onClick={() => { setEditingSetup(null); setEditingSetupValue(""); }}>Cancel</button>
              </div>
            )}
            <div style={{ display: "flex", gap: 6 }}>
              <input className="tj-input tj-input-compact" placeholder="Add new setup…" value={newSetup} onChange={(event) => setNewSetup(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addSetup(); } }} />
              <button className="tj-btn-ghost" onClick={addSetup}>Add</button>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="tj-label">Tags</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {tags.map((tag) => (
                <button key={tag} className={cls("tj-chip", form.tags.includes(tag) && "on")} onClick={() => toggleTag(tag)}>{tag}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <input className="tj-input tj-input-compact" placeholder="Add new tag…" value={newTag} onChange={(event) => setNewTag(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag(); } }} />
              <button className="tj-btn-ghost" onClick={addTag}>Add</button>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="tj-label">Notes</label>
            <textarea className="tj-input tj-input-compact" rows={3} placeholder="Trade thesis, context, plan…" value={form.notes} onChange={(event) => setValue("notes", event.target.value)} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="tj-label">Entry screenshot</label>
            <input type="file" accept="image/*" ref={fileRef} onChange={onImage} style={{ display: "none" }} />
            {form.entryScreenshot ? (
              <div style={{ position: "relative" }}>
                <img src={form.entryScreenshot} alt="entry" style={{ width: "100%", borderRadius: 10, border: "1px solid var(--border)" }} />
                <button className="tj-btn-ghost" style={{ marginTop: 8, width: "100%" }} onClick={() => fileRef.current.click()}>Replace image</button>
              </div>
            ) : (
              <button className="tj-btn-ghost" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }} onClick={() => fileRef.current.click()}>
                <Camera size={15} /> Attach screenshot
              </button>
            )}
          </div>

          <button className="tj-btn-primary" style={{ width: "100%" }} onClick={submit} disabled={!form.ticker || !form.entryPrice}>
            {mode === "new" ? "Save trade" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ text }) {
  return <div style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "18px 0 10px" }}>{text}</div>;
}
function Row2({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>{children}</div>;
}
function NumField({ label, value, onChange, onBlur }) {
  return (
    <div>
      <label className="tj-label">{label}</label>
      <input className="tj-input tj-input-compact tj-mono" type="number" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} onBlur={onBlur} placeholder="0.00" />
    </div>
  );
}

function CloseTradeForm({ trade, onClose, onSubmit }) {
  const [form, setForm] = useState({
    exitPrice: "", exitDate: todayISO(), exitTime: nowTime(),
    exitReason: "", pnl: "", pnlPercent: "", rMultiple: "",
    exitScreenshot: null, postComment: "",
  });
  const fileRef = useRef();
  function setValue(key, value) { setForm((prev) => ({ ...prev, [key]: value })); }

  useEffect(() => {
    if (!form.exitPrice) return;
    const { pnl, pnlPct, r } = calcPnl({ ...trade, exitPrice: form.exitPrice });
    setForm((prev) => ({ ...prev, pnl: pnl != null ? +pnl.toFixed(2) : "", pnlPercent: pnlPct != null ? +pnlPct.toFixed(2) : "", rMultiple: r != null ? +r.toFixed(2) : "" }));
  }, [form.exitPrice]);

  function onImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setValue("exitScreenshot", reader.result);
    reader.readAsDataURL(file);
  }

  return (
    <div className="tj-sheet-backdrop" onClick={onClose}>
      <div className="tj-sheet tj-scroll-hide" onClick={(event) => event.stopPropagation()}>
        <SheetHeader title={`Close ${trade.ticker}`} onClose={onClose} />
        <div style={{ padding: "0 18px 40px" }}>
          <Row2>
            <NumField label="Exit price" value={form.exitPrice} onChange={(value) => setValue("exitPrice", value)} />
            <div>
              <label className="tj-label">Exit reason</label>
              <input className="tj-input" placeholder="TP hit, SL hit…" value={form.exitReason} onChange={(event) => setValue("exitReason", event.target.value)} />
            </div>
          </Row2>
          <Row2>
            <div>
              <label className="tj-label">Close date</label>
              <input type="date" className="tj-input" value={form.exitDate} onChange={(event) => setValue("exitDate", event.target.value)} />
            </div>
            <div>
              <label className="tj-label">Close time</label>
              <input type="time" className="tj-input" value={form.exitTime} onChange={(event) => setValue("exitTime", event.target.value)} />
            </div>
          </Row2>
          <Row2>
            <NumField label="PnL ($)" value={form.pnl} onChange={(value) => setValue("pnl", value)} />
            <NumField label="PnL (%)" value={form.pnlPercent} onChange={(value) => setValue("pnlPercent", value)} />
          </Row2>
          <div style={{ marginBottom: 14, width: "calc(50% - 5px)" }}>
            <NumField label="R-multiple" value={form.rMultiple} onChange={(value) => setValue("rMultiple", value)} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="tj-label">Comment after trade</label>
            <textarea className="tj-input" rows={3} placeholder="What went well, what to improve…" value={form.postComment} onChange={(event) => setValue("postComment", event.target.value)} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="tj-label">Exit screenshot</label>
            <input type="file" accept="image/*" ref={fileRef} onChange={onImage} style={{ display: "none" }} />
            {form.exitScreenshot ? (
              <img src={form.exitScreenshot} alt="exit" style={{ width: "100%", borderRadius: 10, border: "1px solid var(--border)" }} />
            ) : (
              <button className="tj-btn-ghost" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }} onClick={() => fileRef.current.click()}>
                <Camera size={15} /> Attach screenshot
              </button>
            )}
          </div>

          <button className="tj-btn-primary" style={{ width: "100%" }} onClick={() => onSubmit(form)} disabled={!form.exitPrice}>Close trade</button>
        </div>
      </div>
    </div>
  );
}

function FilterSheet({ filters, setFilters, setups, tags, onClose }) {
  const [local, setLocal] = useState(filters);

  useEffect(() => {
    setLocal((prev) => ({
      ...prev,
      tag: prev.tag && tags.includes(prev.tag) ? prev.tag : "all",
    }));
  }, [tags]);

  function group(label, key, options) {
    return (
      <div style={{ marginBottom: 18 }}>
        <div className="tj-label" style={{ marginBottom: 8 }}>{label}</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {options.map((option) => (
            <button key={option.value} className={cls("tj-chip", local[key] === option.value && "on")} onClick={() => setLocal((prev) => ({ ...prev, [key]: option.value }))}>{option.label}</button>
          ))}
        </div>
      </div>
    );
  }

  const tagOptions = [{ value: "all", label: "All" }, ...tags.map((tag) => ({ value: tag, label: tag }))];

  return (
    <div className="tj-sheet-backdrop" onClick={onClose}>
      <div className="tj-sheet tj-scroll-hide" onClick={(event) => event.stopPropagation()}>
        <SheetHeader title="Filters" onClose={onClose} />
        <div style={{ padding: "0 18px 30px" }}>
          {group("Status", "status", [{ value: "all", label: "All" }, { value: "open", label: "Open" }, { value: "closed", label: "Closed" }])}
          {group("Direction", "side", [{ value: "all", label: "All" }, { value: "long", label: "Long" }, { value: "short", label: "Short" }])}
          {group("Result", "result", [{ value: "all", label: "All" }, { value: "profit", label: "Profitable" }, { value: "loss", label: "Losing" }])}
          {group("Setup", "setup", [{ value: "all", label: "All" }, ...setups.map((setup) => ({ value: setup, label: setup }))])}
          {group("Tag", "tag", tagOptions)}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="tj-btn-ghost" style={{ flex: 1 }} onClick={() => { const cleared = { status: "all", side: "all", result: "all", setup: "all", tag: "all" }; setLocal(cleared); setFilters(cleared); }}>Clear all</button>
            <button className="tj-btn-primary" style={{ flex: 1 }} onClick={() => { setFilters(local); onClose(); }}>Apply</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function exportTrades(trades, type, showToast) {
  const rows = trades.map((trade) => ({
    Ticker: trade.ticker, Side: trade.side, Status: trade.status,
    EntryDate: trade.entryDate, EntryTime: trade.entryTime, EntryPrice: trade.entryPrice,
    StopLoss: trade.stopLoss, TakeProfit: trade.takeProfit, PositionSize: trade.positionSize,
    RiskDollar: trade.riskDollar, RiskPercent: trade.riskPercent, Timeframe: trade.timeframe,
    Setup: trade.setup, Tags: (trade.tags || []).join("|"), ExitDate: trade.exitDate, ExitTime: trade.exitTime,
    ExitPrice: trade.exitPrice, ExitReason: trade.exitReason, PnL: trade.pnl, PnLPercent: trade.pnlPercent,
    RMultiple: trade.rMultiple, Notes: trade.notes, PostComment: trade.postComment,
  }));

  if (type === "csv") {
    const ws = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    downloadBlob(csv, "trading-journal.csv", "text/csv");
    showToast("CSV exported");
  } else if (type === "xlsx") {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Trades");
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    downloadBlob(out, "trading-journal.xlsx", "application/octet-stream", true);
    showToast("Excel exported");
  } else {
    showToast("PDF export coming soon — use CSV/Excel for now");
  }
}

function downloadBlob(data, filename, mime, isArray) {
  const blob = isArray ? new Blob([data], { type: mime }) : new Blob([data], { type: mime + ";charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
