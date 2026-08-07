import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import { createChart } from "lightweight-charts";
import {
  Plus, Search, SlidersHorizontal, Settings, X, Edit2, Trash2, Copy, Camera,
  ChevronRight, Home, BookOpen, BarChart2, Download, Eye,
  ArrowUpRight, ArrowDownRight
} from "lucide-react";

const StatsCharts = lazy(() => import("../StatsCharts"));

const FALLBACK_LABELS = {
  newTrade: "New trade",
  editTrade: "Edit trade",
  basicInfo: "Basic info",
  ticker: "Ticker",
  type: "Type",
  date: "Date",
  timeIn: "Time in",
  entry: "Entry",
  additional: "Additional",
  entryPrice: "Entry price",
  stopLoss: "Stop loss",
  takeProfit: "Take profit",
  riskDollar: "Risk ($)",
  positionNotional: "Position notional",
  positionSize: "Position size",
  positionSizing: "Position sizing",
  risk: "Risk",
  riskPerShare: "Risk per share",
  share: "share",
  shares: "shares",
  enterEntryStopRisk: "Enter entry, stop, and risk to calculate position size.",
  addNewSetup: "Add new setup…",
  tags: "Tags",
  addNewTag: "Add new tag…",
  notes: "Notes",
  tradeThesisContextPlan: "Trade thesis, context, plan…",
  entryScreenshot: "Entry screenshot",
  attachScreenshot: "Attach screenshot",
  replaceImage: "Replace image",
  saveTrade: "Save trade",
  saveChanges: "Save changes",
  saveLabel: "Save",
  cancelLabel: "Cancel",
  editLabel: "Edit",
  deleteLabel: "Delete",
  addLabel: "Add",
  buy: "Buy",
  sell: "Sell",
  long: "Long",
  short: "Short",
  all: "All",
  open: "Open",
  closed: "Closed",
  profitable: "Profitable",
  losing: "Losing",
  status: "Status",
  direction: "Direction",
  result: "Result",
  setup: "Setup",
  tag: "Tag",
  clearAll: "Clear all",
  apply: "Apply",
  closeTrade: "Close trade",
  exitPriceLabel: "Exit price",
  exitReasonLabel: "Exit reason",
  exitDateLabel: "Exit date",
  exitReasonPlaceholder: "TP hit, SL hit…",
  timeOut: "Time out",
  rMultipleLabel: "R-multiple",
  commentAfterTrade: "Comment after trade",
  exitScreenshotLabel: "Exit screenshot",
  save: "Save",
  searchPlaceholder: "Search trades",
  loadingStats: "Loading stats…",
  inLabel: "In",
  exitLabel: "Exit",
  pnlLabel: "P&L",
  tagsLabel: "Tags",
  notesLabel: "Notes",
  postTradeCommentLabel: "Post-trade comment",
  entryDateLabel: "Entry date",
  entryPriceLabel: "Entry price",
  stopLossLabel: "Stop loss",
  takeProfitLabel: "Take profit",
  positionSizeLabel: "Position size",
  riskDollarLabel: "Risk $",
  riskPercentLabel: "Risk %",
  export: "Export",
  newestFirst: "Newest first",
  oldestFirst: "Oldest first",
  noTrades: "No trades",
  journal: "Journal",
  dashboardSubtitle: "Your trading desk at a glance",
  recentTrades: "Recent trades",
  viewAll: "View all",
  todayPnL: "Today P&L",
  winRate: "Win rate",
  profitFactor: "Profit factor",
  openTrades: "Open trades",
  totalIncome: "Total income",
  allTime: "All time",
  last7Days: "Last 7 days",
  last30Days: "Last 30 days",
  last90Days: "Last 90 days",
  thisMonth: "This month",
  closedTrades: "closed trades",
  statisticsTitle: "Statistics",
  closedLabel: "Closed",
  openLabel: "Open",
  currentDeposit: "Current deposit",
  loading: "Loading…",
  saving: "Saving...",
  watchlistTitle: "Watchlist",
  watchlistIntro: "Track favorite tickers in one place.",
  watchlistAddTickerPlaceholder: "Add ticker (AAPL)",
  watchlistCommentPlaceholder: "Ticker comment",
  watchlistEmpty: "No tickers added yet.",
  watchlistRemove: "Remove",
  watchlistAddButton: "Add ticker",
  premarketLabel: "Premarket",
};

const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 5);
const fmt2 = (n) => {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return (Math.round((Number(n) + Number.EPSILON) * 100) / 100).toLocaleString();
};
const cls = (...a) => a.filter(Boolean).join(" ");
const formatStockPrice = (value, currency = "USD") => {
  if (value == null || Number.isNaN(Number(value))) return "—";
  const normalizedCurrency = typeof currency === "string" ? currency.trim().toUpperCase() : "";
  const numericValue = Number(value);
  if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(numericValue);
  }
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: normalizedCurrency, maximumFractionDigits: 2 }).format(numericValue);
  } catch {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(numericValue);
  }
};
const normalizeTicker = (value) => (value || "").trim().toUpperCase();
function inferInstrumentType(ticker, priceValue) {
  const normalized = normalizeTicker(ticker || "");
  if (!normalized) return "stock";
  if (/[A-Z]{2,5}/.test(normalized)) return "stock";
  if (normalized.includes("USD") || normalized.includes("USDT") || normalized.includes("BTC") || normalized.includes("ETH")) return "crypto";
  return priceValue != null && Number(priceValue) > 0 ? "stock" : "stock";
}
function inferScreenerSector(symbol) {
  const normalized = normalizeTicker(symbol || "");
  if (!normalized) return "Custom";
  return normalized.includes("BTC") || normalized.includes("ETH") || normalized.includes("SOL") ? "Crypto" : "Custom";
}
function inferScreenerInstrumentType(symbol) {
  const normalized = normalizeTicker(symbol || "");
  if (!normalized) return "stock";
  return normalized.includes("BTC") || normalized.includes("ETH") || normalized.includes("SOL") ? "crypto" : "stock";
}
function resolveTradeMetrics(trade, snapshot) {
  if (!trade || trade.status !== "open") return { pnl: trade?.pnl ?? null, pnlPercent: trade?.pnlPercent ?? null, rMultiple: trade?.rMultiple ?? null };
  const currentPrice = snapshot?.price ?? trade?.currentPrice ?? null;
  if (currentPrice == null || trade.entryPrice == null || trade.positionSize == null || trade.positionSize === "") return { pnl: trade?.pnl ?? null, pnlPercent: trade?.pnlPercent ?? null, rMultiple: trade?.rMultiple ?? null };
  const entryPrice = Number(trade.entryPrice);
  const size = Number(trade.positionSize);
  const pnl = (currentPrice - entryPrice) * size;
  const pnlPercent = entryPrice ? (pnl / (entryPrice * size)) * 100 : null;
  const rMultiple = trade.riskDollar && Number(trade.riskDollar) ? pnl / Number(trade.riskDollar) : null;
  return { pnl: +pnl.toFixed(2), pnlPercent: pnlPercent != null ? +pnlPercent.toFixed(2) : null, rMultiple: rMultiple != null ? +rMultiple.toFixed(2) : null };
}
function calcPnl(trade) {
  if (!trade || trade.entryPrice == null || trade.exitPrice == null) return { pnl: null, pnlPct: null, r: null };
  const entry = Number(trade.entryPrice);
  const exit = Number(trade.exitPrice);
  const size = Number(trade.positionSize || 1);
  const pnl = (exit - entry) * size;
  const pnlPct = entry ? ((exit - entry) / entry) * 100 : null;
  const riskDollar = Number(trade.riskDollar || 0);
  const r = riskDollar ? pnl / riskDollar : null;
  return { pnl: +pnl.toFixed(2), pnlPct: pnlPct != null ? +pnlPct.toFixed(2) : null, r: r != null ? +r.toFixed(2) : null };
}

export function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button className={cls("tj-navitem", active && "active")} onClick={onClick}>
      <Icon size={18} strokeWidth={active ? 2.2 : 1.6} />
      <span>{label}</span>
    </button>
  );
}

export const TickerTape = React.memo(function TickerTape({ stats }) {
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
});

const PnlText = React.memo(function PnlText({ value, size = 14 }) {
  if (value == null) return <span className="tj-mono" style={{ color: "var(--text-faint)", fontSize: size }}>—</span>;
  const positive = value >= 0;
  return (
    <span className="tj-mono" style={{ color: positive ? "var(--profit)" : "var(--loss)", fontWeight: 600, fontSize: size }}>
      {positive ? "+" : ""}{fmt2(value)}
    </span>
  );
});

const SideBadge = React.memo(function SideBadge({ side }) {
  const isLong = side === "long";
  return (
    <span className="tj-badge" style={{ background: isLong ? "rgba(94,200,216,0.12)" : "rgba(201,123,224,0.12)", color: isLong ? "var(--long)" : "var(--short)" }}>
      {isLong ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
      {isLong ? "LONG" : "SHORT"}
    </span>
  );
});

const StatusBadge = React.memo(function StatusBadge({ status }) {
  const open = status === "open";
  return (
    <span className="tj-badge" style={{ background: open ? "rgba(232,163,61,0.12)" : "rgba(138,147,161,0.12)", color: open ? "var(--accent)" : "var(--text-dim)" }}>
      {open ? "OPEN" : "CLOSED"}
    </span>
  );
});

const SearchBar = React.memo(function SearchBar({ search, setSearch, onOpenFilter, filtersActive, t }) {
  const searchPlaceholder = t?.searchPlaceholder || "Search trades";
  return (
    <div style={{ display: "flex", gap: 8, padding: "12px 16px" }}>
      <div style={{ flex: 1, position: "relative" }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: 12, color: "var(--text-faint)" }} />
        <input className="tj-input" style={{ paddingLeft: 34 }} placeholder={searchPlaceholder} value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>
      <button className="tj-btn-ghost" style={{ padding: "0 14px", position: "relative" }} onClick={onOpenFilter}>
        <SlidersHorizontal size={16} />
        {filtersActive && <span style={{ position: "absolute", top: -3, right: -3, width: 8, height: 8, borderRadius: 999, background: "var(--accent)" }} />}
      </button>
    </div>
  );
});

const EmptyState = React.memo(function EmptyState({ text }) {
  return (
    <div className="tj-card" style={{ padding: 24, textAlign: "center", color: "var(--text-dim)", fontSize: 13 }}>
      {text}
    </div>
  );
});

const TradeRow = React.memo(function TradeRow({ trade, onClick, t }) {
  const entryStamp = trade.entryDate ? `${trade.entryDate}${trade.entryTime ? ` ${trade.entryTime}` : ""}` : "—";
  const exitStamp = trade.status === "closed" && trade.exitDate ? `${trade.exitDate}${trade.exitTime ? ` ${trade.exitTime}` : ""}` : null;
  return (
    <button onClick={onClick} className="tj-card" style={{ display: "flex", width: "100%", textAlign: "left", padding: 13, marginBottom: 10, alignItems: "center", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {trade.logo ? (
          <img src={trade.logo} alt={trade.ticker} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", background: "var(--surface-2)" }} />
        ) : (
          <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-2)", fontSize: 11, fontWeight: 700, color: "var(--text-dim)" }}>
            {String(trade.ticker || "?").slice(0, 2)}
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5, flexWrap: "wrap" }}>
          <span className="tj-display" style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>{trade.ticker}</span>
          <SideBadge side={trade.side} />
          <StatusBadge status={trade.status} />
        </div>
        <div style={{ fontSize: 11.5, color: "var(--text-faint)", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span>{t.inLabel} {entryStamp}</span>
          {exitStamp && <span>{t.exitLabel} {exitStamp}</span>}
          {trade.exchange ? <span>· {trade.exchange}</span> : null}
          {trade.setup && <span>· {trade.setup}</span>}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <PnlText value={trade.pnl} size={15} />
        {trade.rMultiple != null && <div className="tj-mono" style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>{trade.rMultiple >= 0 ? "+" : ""}{fmt2(trade.rMultiple)}R</div>}
      </div>
      <ChevronRight size={16} color="var(--text-faint)" />
    </button>
  );
});

export function DashboardScreen({ stats, search, setSearch, onOpenFilter, onOpenDetail, filtersActive, filtered, goJournal, incomePeriod, setIncomePeriod, periodPnlStats, t, defaultRiskPerTrade, setDefaultRiskPerTrade }) {
  const recent = useMemo(() => filtered.slice(0, 6), [filtered]);
  const labels = t || FALLBACK_LABELS;
  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding: "18px 16px 4px" }}>
        <div className="tj-display" style={{ fontSize: 22, fontWeight: 700 }}>{labels.journal}</div>
        <div style={{ fontSize: 12.5, color: "var(--text-dim)" }}>{labels.dashboardSubtitle}</div>
      </div>
      <div style={{ padding: "14px 16px 4px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="tj-card" style={{ padding: 14, position: "relative" }}>
          <div className="stat-icon"><BarChart2 size={18} strokeWidth={1.6} /></div>
          <div className="tj-label" style={{ marginBottom: 8 }}>{labels.todayPnL}</div>
          <PnlText value={stats.todayPnl} size={20} />
        </div>
        <div className="tj-card" style={{ padding: 14, position: "relative" }}>
          <div className="stat-icon"><Eye size={18} strokeWidth={1.6} /></div>
          <div className="tj-label" style={{ marginBottom: 8 }}>{labels.winRate}</div>
          <div className="tj-mono" style={{ fontSize: 20, fontWeight: 600 }}>{fmt2(periodPnlStats.winRate)}%</div>
        </div>
        <div className="tj-card" style={{ padding: 14, position: "relative" }}>
          <div className="stat-icon"><BarChart2 size={18} strokeWidth={1.6} /></div>
          <div className="tj-label" style={{ marginBottom: 8 }}>{labels.profitFactor}</div>
          <div className="tj-mono" style={{ fontSize: 20, fontWeight: 600 }}>{periodPnlStats.profitFactor === Infinity ? "∞" : fmt2(periodPnlStats.profitFactor)}</div>
        </div>
        <div className="tj-card" style={{ padding: 14, position: "relative" }}>
          <div className="stat-icon"><ArrowUpRight size={18} strokeWidth={1.6} /></div>
          <div className="tj-label" style={{ marginBottom: 8 }}>{labels.openTrades}</div>
          <div className="tj-mono" style={{ fontSize: 20, fontWeight: 600, color: "var(--accent)" }}>{stats.openCount}</div>
        </div>
      </div>
      <div style={{ padding: "8px 16px 0" }}>
        <div className="tj-card" style={{ padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div className="tj-label" style={{ marginBottom: 0 }}>{labels.totalIncome}</div>
            <select className="tj-input tj-input-compact" style={{ width: "auto", minWidth: 120, padding: "7px 10px" }} value={incomePeriod} onChange={(event) => setIncomePeriod(event.target.value)}>
              <option value="all">{labels.allTime}</option>
              <option value="7d">{labels.last7Days}</option>
              <option value="30d">{labels.last30Days}</option>
              <option value="90d">{labels.last90Days}</option>
              <option value="month">{labels.thisMonth}</option>
            </select>
          </div>
          <div className="tj-mono" style={{ fontSize: 22, fontWeight: 700, color: periodPnlStats.totalIncome >= 0 ? "var(--profit)" : "var(--loss)" }}>
            {periodPnlStats.totalIncome >= 0 ? "+" : ""}{fmt2(periodPnlStats.totalIncome)} R
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-dim)" }}>
            {periodPnlStats.tradeCount} {labels.closedTrades} · {periodPnlStats.label}
          </div>
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: 12, color: "var(--text-dim)" }}>
            <span>{labels.defaultRiskHint || "Default risk is used for new trades"}</span>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span>{labels.defaultRiskLabel || "Default risk"}</span>
              <input className="tj-input tj-input-compact" style={{ width: 84, minHeight: 30, padding: "6px 8px", fontSize: 12 }} type="text" inputMode="decimal" pattern="[0-9.]*" value={defaultRiskPerTrade ?? ""} onChange={(event) => setDefaultRiskPerTrade(event.target.value)} placeholder="0" />
            </label>
          </div>
        </div>
      </div>
      <SearchBar search={search} setSearch={setSearch} onOpenFilter={onOpenFilter} filtersActive={filtersActive} t={t} />
      <div style={{ padding: "0 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-dim)" }}>{labels.recentTrades}</div>
          <button onClick={goJournal} className="tj-chip" style={{ fontSize: 12, padding: "6px 10px", borderRadius: 8 }}>{labels.viewAll}</button>
        </div>
        {recent.length === 0 && <EmptyState text={labels.noTrades} />}
        {recent.map((trade) => <TradeRow key={trade.id} trade={trade} onClick={() => onOpenDetail(trade.id)} t={labels} />)}
      </div>
    </div>
  );
}

export function JournalScreen({ trades, search, setSearch, onOpenFilter, onOpenDetail, filtersActive, onExport, t }) {
  const [exportOpen, setExportOpen] = useState(false);
  const [sortNewest, setSortNewest] = useState(true);
  const labels = t || FALLBACK_LABELS;
  const sortedTrades = useMemo(() => {
    return [...trades].sort((a, b) => {
      const dateA = a.entryDate ? new Date(`${a.entryDate}T${a.entryTime || "00:00"}:00`).getTime() : 0;
      const dateB = b.entryDate ? new Date(`${b.entryDate}T${b.entryTime || "00:00"}:00`).getTime() : 0;
      return sortNewest ? dateB - dateA : dateA - dateB;
    });
  }, [trades, sortNewest]);
  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding: "18px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div className="tj-display" style={{ fontSize: 20, fontWeight: 700 }}>{labels.allTrades || labels.journal}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="tj-btn-ghost" style={{ padding: "8px 10px", fontSize: 12.5 }} onClick={() => setSortNewest((value) => !value)}>
            {sortNewest ? labels.newestFirst : labels.oldestFirst}
          </button>
          <button className="tj-btn-ghost" style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 6, fontSize: 12.5 }} onClick={() => setExportOpen((value) => !value)}>
            <Download size={14} /> {labels.export}
          </button>
        </div>
      </div>
      {exportOpen && (
        <div style={{ padding: "8px 16px 0", display: "flex", gap: 8 }}>
          {["csv", "xlsx", "pdf"].map((format) => (
            <button key={format} className="tj-chip" onClick={() => { onExport(format); setExportOpen(false); }}>{format.toUpperCase()}</button>
          ))}
        </div>
      )}
      <SearchBar search={search} setSearch={setSearch} onOpenFilter={onOpenFilter} filtersActive={filtersActive} t={t} />
      <div style={{ padding: "0 16px" }}>
        {sortedTrades.length === 0 && <EmptyState text={labels.noTrades} />}
        {sortedTrades.map((trade) => <TradeRow key={trade.id} trade={trade} onClick={() => onOpenDetail(trade.id)} t={labels} />)}
      </div>
    </div>
  );
}

function MiniPriceChart({ row }) {
  const containerRef = useRef(null);
  const [timeframe, setTimeframe] = useState("1h");
  const [lastVolume, setLastVolume] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth || 260,
      height: 200,
      layout: {
        background: { color: "transparent" },
        textColor: "#ECEEF1",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      timeScale: { timeVisible: true, secondsVisible: false },
      rightPriceScale: { borderVisible: false, visible: true },
      leftPriceScale: { visible: true, borderVisible: false, scaleMargins: { top: 0.82, bottom: 0 } },
      crosshair: { mode: 1 },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });

    const series = chart.addCandlestickSeries({
      upColor: "#3DDC97",
      downColor: "#F0556B",
      borderVisible: false,
      wickUpColor: "#3DDC97",
      wickDownColor: "#F0556B",
      priceScaleId: "right",
    });

    const volumeSeries = chart.addHistogramSeries({
      color: "rgba(94, 200, 216, 0.45)",
      priceScaleId: "left",
      priceFormat: { type: "volume" },
      scaleMargins: { top: 0.82, bottom: 0 },
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const basePrice = Number(row?.price ?? 100);
    const drift = Number(row?.changePercent ?? 0) / 100;
    const seed = (row?.symbol || "AAPL").split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    const timeframes = {
      "1m": 60_000,
      "5m": 300_000,
      "15m": 900_000,
      "1h": 3_600_000,
      "4h": 14_400_000,
      "1d": 86_400_000,
      "1w": 604_800_000,
      "1M": 2_629_746_000,
    };
    const interval = timeframes[timeframe] || timeframes["1h"];
    const points = Array.from({ length: 42 }, (_, index) => {
      const time = Math.floor((Date.now() - (41 - index) * interval) / 1000);
      const trend = (index / 41 - 0.5) * 0.08 + drift * 0.04;
      const wave = Math.sin((index + seed) / 3.2) * 0.012;
      const open = basePrice * (1 + trend + wave);
      const close = open * (1 + Math.sin((index + seed) / 5.4) * 0.014 + drift * 0.01);
      const high = Math.max(open, close) * (1 + Math.abs(Math.cos((index + seed) / 4.6)) * 0.008 + 0.004);
      const low = Math.min(open, close) * (1 - Math.abs(Math.sin((index + seed) / 4.2)) * 0.008 - 0.004);
      const volume = Math.round((900000 + (index % 7) * 180000 + Math.abs(Math.sin((index + seed) / 3)) * 650000) * (1 + Math.max(0, drift) * 1.2));
      return { time, open, high, low, close, volume };
    });

    const volumeData = points.map((point) => ({ time: point.time, value: point.volume, color: point.close >= point.open ? "rgba(61, 220, 151, 0.6)" : "rgba(240, 85, 107, 0.6)" }));
    series.setData(points);
    volumeSeries.setData(volumeData);
    chart.timeScale().fitContent();
    setLastVolume(points[points.length - 1]?.volume ?? null);

    return () => chart.remove();
  }, [row?.symbol, row?.price, row?.changePercent, timeframe]);

  return (
    <div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        {Object.keys({ "1m": 1, "5m": 1, "15m": 1, "1h": 1, "4h": 1, "1d": 1, "1w": 1, "1M": 1 }).map((value) => (
          <button
            key={value}
            className={cls("tj-chip", timeframe === value && "on")}
            style={{ fontSize: 11, padding: "4px 8px" }}
            onClick={() => setTimeframe(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <div ref={containerRef} style={{ width: "100%", height: 190, minWidth: 150 }} />
      {lastVolume != null && <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 5 }}>Vol: {Math.round(lastVolume / 1000)}k</div>}
    </div>
  );
}

export function ScreenerPanel({ rows, loading, filters, setFilters, savedFilters, onSaveFilter, onApplyFilter, onRemoveFilter, onAddAlert, onRemoveAlert, alerts, filterName, setFilterName, activeFilterId, t }) {
  const labels = t || FALLBACK_LABELS;
  const sectorOptions = ["all", "Technology", "Financial", "Energy", "Consumer", "ETF", "FX", "Crypto", "Automotive", "Custom"];
  const instrumentOptions = ["all", "stock", "etf", "forex", "crypto"];

  return (
    <div style={{ padding: "24px 16px 100px" }}>
      <div className="tj-card" style={{ padding: 16, marginBottom: 12 }}>
        <div className="tj-display" style={{ fontSize: 20, fontWeight: 700, color: "var(--text)" }}>{labels.screenerTitle || "Market Screener"}</div>
        <div style={{ marginTop: 6, fontSize: 13, color: "var(--text-dim)" }}>{labels.screenerSubtitle || "Explore instruments with a lightweight chart view."}</div>
      </div>

      <div className="tj-card" style={{ padding: 14, marginBottom: 12 }}>
        <div style={{ display: "grid", gap: 8 }}>
          <input
            className="tj-input tj-input-compact"
            placeholder={labels.screenerSearchPlaceholder || "Search symbol or sector"}
            value={filters?.query || ""}
            onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <select className="tj-input tj-input-compact" value={filters?.sector || "all"} onChange={(event) => setFilters((prev) => ({ ...prev, sector: event.target.value }))}>
              {sectorOptions.map((option) => <option key={option} value={option}>{option === "all" ? labels.screenerAllSectors || "All sectors" : option}</option>)}
            </select>
            <select className="tj-input tj-input-compact" value={filters?.instrument || "all"} onChange={(event) => setFilters((prev) => ({ ...prev, instrument: event.target.value }))}>
              {instrumentOptions.map((option) => <option key={option} value={option}>{option === "all" ? labels.screenerAllInstruments || "All instruments" : option}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <input className="tj-input tj-input-compact" placeholder={labels.screenerMinChange || "Min % change"} value={filters?.minChange || ""} onChange={(event) => setFilters((prev) => ({ ...prev, minChange: event.target.value }))} />
            <input className="tj-input tj-input-compact" placeholder={labels.screenerMinVolume || "Min volume"} value={filters?.minVolume || ""} onChange={(event) => setFilters((prev) => ({ ...prev, minVolume: event.target.value }))} />
            <input className="tj-input tj-input-compact" placeholder={labels.screenerMinPrice || "Min price"} value={filters?.minPrice || ""} onChange={(event) => setFilters((prev) => ({ ...prev, minPrice: event.target.value }))} />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <button className="tj-btn-ghost" style={{ padding: "8px 10px" }} onClick={() => setFilters((prev) => ({ ...prev, sortBy: prev.sortBy === "changePercent" ? "price" : "changePercent", sortDir: prev.sortDir === "desc" ? "asc" : "desc" }))}>
          {labels.screenerSortGrowth || "Sort"}
        </button>
        <input className="tj-input tj-input-compact" style={{ maxWidth: 170 }} placeholder={labels.screenerFilterName || "Filter name"} value={filterName || ""} onChange={(event) => setFilterName(event.target.value)} />
        <button className="tj-btn-primary" style={{ padding: "8px 12px" }} onClick={() => onSaveFilter && onSaveFilter()}>{labels.screenerSaveFilter || "Save"}</button>
      </div>

      {savedFilters?.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {savedFilters.map((filter) => (
            <div key={filter.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button className={cls("tj-chip", activeFilterId === filter.id && "on")} onClick={() => onApplyFilter(filter)}>{filter.name}</button>
              <button className="tj-btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => onRemoveFilter(filter.id)}>×</button>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="tj-card" style={{ padding: 20, textAlign: "center", color: "var(--text-dim)" }}>{labels.screenerLoading || "Loading screener…"}</div>
      ) : rows?.length === 0 ? (
        <div className="tj-card" style={{ padding: 20, textAlign: "center", color: "var(--text-dim)" }}>{labels.screenerAlertEmpty || "No instruments match the current filters."}</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {rows.map((row) => {
            const change = Number(row?.changePercent ?? row?.change ?? 0);
            const price = Number(row?.price ?? 0);
            return (
              <div key={row.symbol} className="tj-card" style={{ padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div>
                    <div className="tj-display" style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{row.symbol}</div>
                    <div style={{ fontSize: 12.5, color: "var(--text-dim)" }}>{row.name || row.symbol}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="tj-mono" style={{ fontSize: 14, fontWeight: 600 }}>{price ? `$${price.toFixed(2)}` : "—"}</div>
                    <div style={{ fontSize: 12, color: change >= 0 ? "var(--profit)" : "var(--loss)" }}>{change >= 0 ? "+" : ""}{change.toFixed(2)}%</div>
                  </div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <MiniPriceChart row={row} />
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  <button className="tj-btn-ghost" style={{ padding: "7px 10px", fontSize: 12 }} onClick={() => onAddAlert && onAddAlert({ symbol: row.symbol, targetPrice: price, condition: "above" })}>{labels.screenerAlert || "Alert"}</button>
                  <button className="tj-btn-ghost" style={{ padding: "7px 10px", fontSize: 12 }} onClick={() => onRemoveAlert && onRemoveAlert(row.symbol)}>{labels.watchlistRemove || "Remove"}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function StatsScreen({ stats, onOpenFilter, filtersActive, t }) {
  const labels = t || FALLBACK_LABELS;
  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding: "18px 16px 4px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div>
          <div className="tj-display" style={{ fontSize: 20, fontWeight: 700 }}>{labels.statisticsTitle}</div>
          <div style={{ fontSize: 12.5, color: "var(--text-dim)" }}>{stats.closedCount} {labels.closed} · {stats.openCount} {labels.open}</div>
          <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginTop: 6 }}>
            {labels.currentDeposit}: {stats.currentDeposit != null ? `$${fmt2(stats.currentDeposit)}` : "—"}
            {stats.monthPnl != null && (
              <span style={{ marginLeft: 6, color: stats.monthPnl >= 0 ? "var(--profit)" : "var(--loss)" }}>( {stats.monthPnl >= 0 ? "+" : ""}{fmt2(stats.monthPnl)}$ • this month )</span>
            )}
          </div>
        </div>
        <button className="tj-btn-ghost" style={{ padding: "8px 12px", position: "relative" }} onClick={onOpenFilter}>
          <SlidersHorizontal size={16} />
          {filtersActive && <span style={{ position: "absolute", top: -3, right: -3, width: 8, height: 8, borderRadius: 999, background: "var(--accent)" }} />}
        </button>
      </div>
      <Suspense fallback={<div className="tj-card" style={{ margin: "14px 16px 0", padding: 16, color: "var(--text-dim)" }}>{labels.loadingStats}</div>}>
        <StatsCharts stats={stats} t={t} />
      </Suspense>
    </div>
  );
}

export function TradeDetail({ trade, onClose, onEdit, onDelete, onDuplicate, onCloseTrade, t }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [fullImg, setFullImg] = useState(null);
  const labels = t || FALLBACK_LABELS;
  return (
    <div className="tj-sheet-backdrop" onClick={onClose}>
      <div className="tj-sheet tj-scroll-hide" onClick={(event) => event.stopPropagation()}>
        <SheetHeader title={`${trade.ticker}`} onClose={onClose} />
        <div style={{ padding: "0 18px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            {trade.logo ? (
              <img src={trade.logo} alt={trade.ticker} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", background: "var(--surface-2)" }} />
            ) : (
              <div style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-2)", fontSize: 12, fontWeight: 700, color: "var(--text-dim)" }}>
                {String(trade.ticker || "?").slice(0, 2)}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <SideBadge side={trade.side} />
              <StatusBadge status={trade.status} />
              {trade.setup && <span className="tj-badge" style={{ background: "var(--surface-2)", color: "var(--text-dim)" }}>{trade.setup}</span>}
            </div>
          </div>
          {trade.exchange ? <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginBottom: 12 }}>{trade.exchange}{trade.name ? ` • ${trade.name}` : ""}</div> : null}
          <div className="tj-card" style={{ padding: 16, marginBottom: 16, textAlign: "center" }}>
            <div className="tj-label">{labels.pnlLabel}</div>
            <PnlText value={trade.pnl} size={28} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
            <Field label={labels.entryDateLabel} value={trade.entryDate ? `${trade.entryDate} ${trade.entryTime || ""}`.trim() : "—"} />
            <Field label={labels.entryPriceLabel} value={trade.entryPrice} />
            <Field label={labels.exitDateLabel} value={trade.exitDate ? `${trade.exitDate} ${trade.exitTime || ""}`.trim() : "—"} />
            <Field label={labels.exitPriceLabel} value={trade.exitPrice} />
            <Field label={labels.stopLossLabel} value={trade.stopLoss} />
            <Field label={labels.takeProfitLabel} value={trade.takeProfit} />
            <Field label={labels.positionSizeLabel} value={trade.positionSize} />
            <Field label={labels.riskDollarLabel} value={trade.riskDollar} />
            <Field label={labels.riskPercentLabel} value={trade.riskPercent} />
            <Field label={labels.exitReasonLabel} value={trade.exitReason} />
          </div>
          {trade.tags && trade.tags.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div className="tj-label" style={{ marginBottom: 6 }}>{labels.tagsLabel}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{trade.tags.map((tag) => <span key={tag} className="tj-chip">{tag}</span>)}</div>
            </div>
          )}
          {trade.notes && (
            <div style={{ marginBottom: 16 }}>
              <div className="tj-label" style={{ marginBottom: 6 }}>{labels.notesLabel}</div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text)" }}>{trade.notes}</div>
            </div>
          )}
          {trade.postComment && (
            <div style={{ marginBottom: 16 }}>
              <div className="tj-label" style={{ marginBottom: 6 }}>{labels.postTradeCommentLabel}</div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text)" }}>{trade.postComment}</div>
            </div>
          )}
          {(trade.entryScreenshot || trade.exitScreenshot) && (
            <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
              {trade.entryScreenshot && <img src={trade.entryScreenshot} alt="entry" onClick={() => setFullImg(trade.entryScreenshot)} style={{ width: "50%", borderRadius: 10, border: "1px solid var(--border)", cursor: "pointer" }} />}
              {trade.exitScreenshot && <img src={trade.exitScreenshot} alt="exit" onClick={() => setFullImg(trade.exitScreenshot)} style={{ width: "50%", borderRadius: 10, border: "1px solid var(--border)", cursor: "pointer" }} />}
            </div>
          )}
          {trade.status === "open" && <button className="tj-btn-primary" style={{ width: "100%", marginBottom: 10 }} onClick={onCloseTrade}>{labels.closeTrade}</button>}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="tj-btn-ghost" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }} onClick={onEdit}><Edit2 size={14} /> {labels.editLabel}</button>
            <button className="tj-btn-ghost" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }} onClick={onDuplicate}><Copy size={14} /> {labels.duplicate || labels.editLabel}</button>
            <button className="tj-btn-ghost" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "var(--loss)" }} onClick={() => setConfirmDelete(true)}><Trash2 size={14} /> {labels.deleteLabel}</button>
          </div>
          {confirmDelete && (
            <div className="tj-card" style={{ padding: 14, marginTop: 12 }}>
              <div style={{ fontSize: 13, marginBottom: 10 }}>{labels.deleteLabel} this trade permanently?</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="tj-btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmDelete(false)}>{labels.cancelLabel}</button>
                <button className="tj-btn-primary" style={{ flex: 1, background: "var(--loss)", color: "#fff" }} onClick={onDelete}>{labels.deleteLabel}</button>
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

export function SheetHeader({ title, onClose }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 8px", background: "var(--bg)", zIndex: 5 }}>
      <div className="tj-display" style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
      <button onClick={onClose} style={{ color: "var(--text-dim)" }}><X size={20} /></button>
    </div>
  );
}

export function TradeForm({ mode, initial, setups, setSetups, tags, setTags, onClose, onSubmit, t, isSubmitting = false, defaultRiskPerTrade = "" }) {
  const [form, setForm] = useState(() => ({
    ...(initial || { ticker: "", side: "long", entryDate: todayISO(), entryTime: nowTime(), entryPrice: "", stopLoss: "", takeProfit: "", positionSize: "", riskDollar: "", riskPercent: "", setup: "", tags: [], notes: "", entryScreenshot: null }),
    riskDollar: initial?.riskDollar ?? defaultRiskPerTrade ?? "",
  }));
  const [newSetup, setNewSetup] = useState("");
  const [newTag, setNewTag] = useState("");
  const [editingSetup, setEditingSetup] = useState(null);
  const [editingSetupValue, setEditingSetupValue] = useState("");
  const [editingTag, setEditingTag] = useState(null);
  const [editingTagValue, setEditingTagValue] = useState("");
  const fileRef = useRef();
  const labels = t || FALLBACK_LABELS;

  function setValue(key, value) { setForm((prev) => ({ ...prev, [key]: value })); }
  function toggleTag(tag) { setForm((prev) => ({ ...prev, tags: prev.tags.includes(tag) ? prev.tags.filter((item) => item !== tag) : [...prev.tags, tag] })); }
  function getRiskPerShare(entryPrice, stopLoss, side) { if (!Number.isFinite(entryPrice) || !Number.isFinite(stopLoss)) return null; return side === "short" ? Math.abs(stopLoss - entryPrice) : Math.abs(entryPrice - stopLoss); }
  useEffect(() => {
    const entryPrice = Number(form.entryPrice);
    const stopLoss = Number(form.stopLoss);
    const riskDollar = Number(form.riskDollar);
    if (!Number.isFinite(entryPrice) || entryPrice <= 0 || !Number.isFinite(stopLoss) || stopLoss <= 0 || !Number.isFinite(riskDollar) || riskDollar <= 0) return;
    const riskPerShare = getRiskPerShare(entryPrice, stopLoss, form.side);
    if (!Number.isFinite(riskPerShare) || riskPerShare <= 0) return;
    const positionSize = Math.max(1, Math.round(riskDollar / riskPerShare));
    if (String(form.positionSize) !== String(positionSize)) setValue("positionSize", positionSize);
  }, [form.entryPrice, form.stopLoss, form.riskDollar, form.side]);
  const computedRisk = (() => {
    const entryPrice = Number(form.entryPrice);
    const stopLoss = Number(form.stopLoss);
    const riskDollar = Number(form.riskDollar);
    const positionSize = Number(form.positionSize);
    if (!Number.isFinite(entryPrice) || entryPrice <= 0 || !Number.isFinite(stopLoss) || stopLoss <= 0 || !Number.isFinite(riskDollar) || riskDollar <= 0) return null;
    const riskPerShare = getRiskPerShare(entryPrice, stopLoss, form.side);
    if (!Number.isFinite(riskPerShare) || riskPerShare <= 0) return null;
    const normalizedPositionSize = Math.max(1, Math.round(riskDollar / riskPerShare));
    const effectivePositionSize = Number.isFinite(positionSize) && positionSize > 0 ? positionSize : normalizedPositionSize;
    const notional = effectivePositionSize * entryPrice;
    return { riskDollar: +riskDollar.toFixed(2), riskPerShare: +riskPerShare.toFixed(2), positionSize: normalizedPositionSize, notional: +notional.toFixed(2), direction: form.side === "long" ? "Buy" : "Sell" };
  })();
  function addSetup() { const value = newSetup.trim(); if (!value) return; const normalized = value.replace(/\s+/g, " "); const exists = setups.some((setup) => setup.toLowerCase() === normalized.toLowerCase()); if (exists) { setValue("setup", normalized); setNewSetup(""); return; } setSetups((prev) => [...prev, normalized]); setValue("setup", normalized); setNewSetup(""); }
  function saveSetupEdit() { const value = editingSetupValue.trim().replace(/\s+/g, " "); if (!value || !editingSetup) return; const exists = setups.some((setup) => setup.toLowerCase() === value.toLowerCase() && setup !== editingSetup); if (exists) return; setSetups((prev) => prev.map((setup) => (setup === editingSetup ? value : setup))); if (form.setup === editingSetup) setValue("setup", value); setEditingSetup(null); setEditingSetupValue(""); }
  function deleteSetup(setupToDelete) { if (!setupToDelete) return; const shouldRemoveCurrent = form.setup === setupToDelete; setSetups((prev) => prev.filter((setup) => setup !== setupToDelete)); if (shouldRemoveCurrent) setValue("setup", ""); }
  function saveTagEdit() { const value = editingTagValue.trim().replace(/\s+/g, " "); if (!value || !editingTag) return; const exists = tags.some((tag) => tag.toLowerCase() === value.toLowerCase() && tag !== editingTag); if (exists) return; setTags((prev) => prev.map((tag) => (tag === editingTag ? value : tag))); if (form.tags.includes(editingTag)) setForm((prev) => ({ ...prev, tags: prev.tags.map((tag) => (tag === editingTag ? value : tag)) })); setEditingTag(null); setEditingTagValue(""); }
  function deleteTag(tagToDelete) { if (!tagToDelete) return; setTags((prev) => prev.filter((tag) => tag !== tagToDelete)); setForm((prev) => ({ ...prev, tags: prev.tags.filter((tag) => tag !== tagToDelete) })); }
  function addTag() { const value = newTag.trim(); if (!value) return; const normalized = value.replace(/\s+/g, " "); if (!tags.includes(normalized)) setTags((prev) => [...prev, normalized]); toggleTag(normalized); setNewTag(""); }
  function onImage(event) { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setValue("entryScreenshot", reader.result); reader.readAsDataURL(file); }
  function submit() { if (!form.ticker || !form.entryPrice) return; const payload = { ...form, ticker: form.ticker.toUpperCase(), instrumentType: inferInstrumentType(form.ticker, form.entryPrice) }; if ((payload.riskDollar === "" || payload.riskDollar == null) && defaultRiskPerTrade !== "") payload.riskDollar = defaultRiskPerTrade; onSubmit(payload); }
  return (
    <div className="tj-sheet-backdrop" onClick={onClose}>
      <div className="tj-sheet tj-scroll-hide" onClick={(event) => event.stopPropagation()}>
        <SheetHeader title={mode === "new" ? labels.newTrade : labels.editTrade} onClose={onClose} />
        <div style={{ padding: "0 18px 100px" }}>
          <SectionLabel text={labels.basicInfo} />
          <Row2>
            <div><label className="tj-label">{labels.ticker}</label><input className="tj-input tj-input-compact" placeholder="AAPL" value={form.ticker} onChange={(event) => setValue("ticker", event.target.value.toUpperCase())} /></div>
            <div><label className="tj-label">{labels.type}</label><div style={{ display: "flex", gap: 6 }}><button className={cls("tj-chip", form.side === "long" && "on")} style={{ flex: 1 }} onClick={() => setValue("side", "long")}>{labels.long}</button><button className={cls("tj-chip", form.side === "short" && "on")} style={{ flex: 1 }} onClick={() => setValue("side", "short")}>{labels.short}</button></div></div>
          </Row2>
          <Row2>
            <div><label className="tj-label">{labels.date}</label><input type="date" className="tj-input tj-input-compact" value={form.entryDate} onChange={(event) => setValue("entryDate", event.target.value)} /></div>
            <div><label className="tj-label">{labels.timeIn}</label><input type="time" className="tj-input tj-input-compact" value={form.entryTime} onChange={(event) => setValue("entryTime", event.target.value)} /></div>
          </Row2>
          <SectionLabel text={labels.entry} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <NumField label={labels.entryPrice} value={form.entryPrice} onChange={(value) => setValue("entryPrice", value)} />
            <NumField label={labels.stopLoss} value={form.stopLoss} onChange={(value) => setValue("stopLoss", value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <NumField label={labels.takeProfit} value={form.takeProfit} onChange={(value) => setValue("takeProfit", value)} />
            <NumField label={labels.riskDollar} value={form.riskDollar} onChange={(value) => setValue("riskDollar", value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <div><label className="tj-label">{labels.positionNotional}</label><div className="tj-input tj-input-compact tj-mono" style={{ display: "flex", alignItems: "center", minHeight: 34, color: "var(--text-dim)" }}>{computedRisk ? `$${computedRisk.notional}` : "—"}</div></div>
            <NumField label={labels.positionSize} value={form.positionSize} onChange={(value) => setValue("positionSize", value)} />
          </div>
          <div className="tj-card" style={{ padding: 10, marginBottom: 12, borderColor: "var(--accent-dim)" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-dim)", marginBottom: 6 }}>{labels.positionSizing}</div>
            {computedRisk ? <div style={{ display: "grid", gap: 4, fontSize: 13, color: "var(--text)" }}><div>{labels.risk}: <span className="tj-mono" style={{ color: "var(--accent)" }}>${computedRisk.riskDollar}</span></div><div>{labels.riskPerShare}: <span className="tj-mono" style={{ color: "var(--text-dim)" }}>${computedRisk.riskPerShare}</span></div><div>{computedRisk.direction === "Buy" ? labels.buy : labels.sell}: <span className="tj-mono" style={{ color: "var(--profit)" }}>{computedRisk.positionSize} {computedRisk.positionSize === 1 ? labels.share : labels.shares}</span></div></div> : <div style={{ fontSize: 13, color: "var(--text-dim)" }}>{labels.enterEntryStopRisk}</div>}
          </div>
          <SectionLabel text={labels.additional} />
          <div style={{ marginBottom: 14 }}>
            <label className="tj-label">{labels.setup}</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>{setups.map((setup) => (<div key={setup} style={{ display: "flex", alignItems: "center", gap: 6 }}><button className={cls("tj-chip", form.setup === setup && "on")} onClick={() => setValue("setup", setup)}>{setup}</button><button className="tj-btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => { setEditingSetup(setup); setEditingSetupValue(setup); }}>{labels.editLabel}</button><button className="tj-btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--loss)" }} onClick={() => deleteSetup(setup)}>{labels.deleteLabel}</button></div>))}</div>
            {editingSetup && <div style={{ display: "flex", gap: 6, marginBottom: 8 }}><input className="tj-input tj-input-compact" value={editingSetupValue} onChange={(event) => setEditingSetupValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); saveSetupEdit(); } }} /><button className="tj-btn-ghost" onClick={saveSetupEdit}>{labels.saveLabel}</button><button className="tj-btn-ghost" onClick={() => { setEditingSetup(null); setEditingSetupValue(""); }}>{labels.cancelLabel}</button></div>}
            <div style={{ display: "flex", gap: 6 }}><input className="tj-input tj-input-compact" placeholder={labels.addNewSetup} value={newSetup} onChange={(event) => setNewSetup(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addSetup(); } }} /><button className="tj-btn-ghost" onClick={addSetup}>{labels.addLabel}</button></div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="tj-label">{labels.tags}</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>{tags.map((tag) => (<div key={tag} style={{ display: "flex", alignItems: "center", gap: 6 }}><button className={cls("tj-chip", form.tags.includes(tag) && "on")} onClick={() => toggleTag(tag)}>{tag}</button><button className="tj-btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => { setEditingTag(tag); setEditingTagValue(tag); }}>{labels.editLabel}</button><button className="tj-btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "var(--loss)" }} onClick={() => deleteTag(tag)}>{labels.deleteLabel}</button></div>))}</div>
            {editingTag && <div style={{ display: "flex", gap: 6, marginBottom: 8 }}><input className="tj-input tj-input-compact" value={editingTagValue} onChange={(event) => setEditingTagValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); saveTagEdit(); } }} /><button className="tj-btn-ghost" onClick={saveTagEdit}>{labels.saveLabel}</button><button className="tj-btn-ghost" onClick={() => { setEditingTag(null); setEditingTagValue(""); }}>{labels.cancelLabel}</button></div>}
            <div style={{ display: "flex", gap: 6 }}><input className="tj-input tj-input-compact" placeholder={labels.addNewTag} value={newTag} onChange={(event) => setNewTag(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTag(); } }} /><button className="tj-btn-ghost" onClick={addTag}>{labels.addLabel}</button></div>
          </div>
          <div style={{ marginBottom: 14 }}><label className="tj-label">{labels.notes}</label><textarea className="tj-input tj-input-compact" rows={3} placeholder={labels.tradeThesisContextPlan} value={form.notes} onChange={(event) => setValue("notes", event.target.value)} /></div>
          <div style={{ marginBottom: 20 }}><label className="tj-label">{labels.entryScreenshot}</label><input type="file" accept="image/*" ref={fileRef} onChange={onImage} style={{ display: "none" }} />{form.entryScreenshot ? <div style={{ position: "relative" }}><img src={form.entryScreenshot} alt="entry" style={{ width: "100%", borderRadius: 10, border: "1px solid var(--border)" }} /><button className="tj-btn-ghost" style={{ marginTop: 8, width: "100%" }} onClick={() => fileRef.current.click()}>{labels.replaceImage}</button></div> : <button className="tj-btn-ghost" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }} onClick={() => fileRef.current.click()}><Camera size={15} /> {labels.attachScreenshot}</button>}</div>
          <button className="tj-btn-primary" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={submit} disabled={!form.ticker || !form.entryPrice || isSubmitting}>{isSubmitting ? <><span style={{ width: 12, height: 12, border: "2px solid rgba(0,0,0,0.25)", borderTopColor: "currentColor", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} /><span>{labels.saving}</span></> : mode === "new" ? labels.saveTrade : labels.saveChanges}</button>
        </div>
      </div>
    </div>
  );
}

export function SectionLabel({ text }) { return <div style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "18px 0 10px" }}>{text}</div>; }
export function Row2({ children }) { return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>{children}</div>; }
export function NumField({ label, value, onChange, onBlur }) { return <div><label className="tj-label">{label}</label><input className="tj-input tj-input-compact tj-mono" type="number" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} onBlur={onBlur} placeholder="0.00" style={{ minHeight: 30, padding: "6px 8px", fontSize: 12.5 }} /></div>; }

export function CloseTradeForm({ trade, onClose, onSubmit, t }) {
  const [form, setForm] = useState({ exitPrice: "", exitDate: todayISO(), exitTime: nowTime(), exitReason: "", pnl: "", pnlPercent: "", rMultiple: "", exitScreenshot: null, postComment: "" });
  const fileRef = useRef();
  const labels = t || FALLBACK_LABELS;
  function setValue(key, value) { setForm((prev) => ({ ...prev, [key]: value })); }
  useEffect(() => { if (!form.exitPrice) return; const { pnl, pnlPct, r } = calcPnl({ ...trade, exitPrice: form.exitPrice }); setForm((prev) => ({ ...prev, pnl: pnl != null ? +pnl.toFixed(2) : "", pnlPercent: pnlPct != null ? +pnlPct.toFixed(2) : "", rMultiple: r != null ? +r.toFixed(2) : "" })); }, [form.exitPrice]);
  function onImage(event) { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setValue("exitScreenshot", reader.result); reader.readAsDataURL(file); }
  return (
    <div className="tj-sheet-backdrop" onClick={onClose}>
      <div className="tj-sheet tj-scroll-hide" onClick={(event) => event.stopPropagation()}>
        <SheetHeader title={`${labels.closeTrade} ${trade.ticker}`} onClose={onClose} />
        <div style={{ padding: "0 18px 40px" }}>
          <Row2>
            <NumField label={labels.exitPriceLabel} value={form.exitPrice} onChange={(value) => setValue("exitPrice", value)} />
            <div><label className="tj-label">{labels.exitReasonLabel}</label><input className="tj-input tj-input-compact" placeholder={labels.exitReasonPlaceholder} value={form.exitReason} onChange={(event) => setValue("exitReason", event.target.value)} /></div>
          </Row2>
          <Row2>
            <div><label className="tj-label">{labels.exitDateLabel}</label><input type="date" className="tj-input tj-input-compact" value={form.exitDate} onChange={(event) => setValue("exitDate", event.target.value)} /></div>
            <div><label className="tj-label">{labels.timeIn}</label><input type="time" className="tj-input tj-input-compact" value={form.exitTime} onChange={(event) => setValue("exitTime", event.target.value)} /></div>
          </Row2>
          <Row2><NumField label="PnL ($)" value={form.pnl} onChange={(value) => setValue("pnl", value)} /></Row2>
          <div style={{ marginBottom: 14, width: "calc(50% - 5px)" }}><NumField label={labels.rMultipleLabel} value={form.rMultiple} onChange={(value) => setValue("rMultiple", value)} /></div>
          <div style={{ marginBottom: 14 }}><label className="tj-label">{labels.commentAfterTrade}</label><textarea className="tj-input" rows={3} placeholder={labels.commentAfterTrade} value={form.postComment} onChange={(event) => setValue("postComment", event.target.value)} /></div>
          <div style={{ marginBottom: 20 }}><label className="tj-label">{labels.exitScreenshotLabel}</label><input type="file" accept="image/*" ref={fileRef} onChange={onImage} style={{ display: "none" }} />{form.exitScreenshot ? <img src={form.exitScreenshot} alt="exit" style={{ width: "100%", borderRadius: 10, border: "1px solid var(--border)" }} /> : <button className="tj-btn-ghost" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }} onClick={() => fileRef.current.click()}><Camera size={15} /> {labels.attachScreenshot}</button>}</div>
          <button className="tj-btn-primary" style={{ width: "100%" }} onClick={() => onSubmit({ ...form, exitScreenshot: form.exitScreenshot || null })} disabled={!form.exitPrice}>{labels.closeTrade}</button>
        </div>
      </div>
    </div>
  );
}

export function FilterSheet({ filters, setFilters, setups, tags, onClose, t }) {
  const [local, setLocal] = useState(filters);
  const labels = t || FALLBACK_LABELS;
  useEffect(() => { setLocal((prev) => ({ ...prev, tag: prev.tag && tags.includes(prev.tag) ? prev.tag : "all" })); }, [tags]);
  function group(label, key, options) { return <div style={{ marginBottom: 18 }}><div className="tj-label" style={{ marginBottom: 8 }}>{label}</div><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{options.map((option) => <button key={option.value} className={cls("tj-chip", local[key] === option.value && "on")} onClick={() => setLocal((prev) => ({ ...prev, [key]: option.value }))}>{option.label}</button>)}</div></div>; }
  const tagOptions = [{ value: "all", label: labels.all }, ...tags.map((tag) => ({ value: tag, label: tag }))];
  return (
    <div className="tj-sheet-backdrop" onClick={onClose}>
      <div className="tj-sheet tj-scroll-hide" onClick={(event) => event.stopPropagation()}>
        <SheetHeader title="Filters" onClose={onClose} />
        <div style={{ padding: "0 18px 30px" }}>
          {group(labels.status, "status", [{ value: "all", label: labels.all }, { value: "open", label: labels.open }, { value: "closed", label: labels.closed }])}
          {group(labels.direction, "side", [{ value: "all", label: labels.all }, { value: "long", label: labels.long }, { value: "short", label: labels.short }])}
          {group(labels.result, "result", [{ value: "all", label: labels.all }, { value: "profit", label: labels.profitable }, { value: "loss", label: labels.losing }])}
          {group(labels.setup, "setup", [{ value: "all", label: labels.all }, ...setups.map((setup) => ({ value: setup, label: setup }))])}
          {group(labels.tag, "tag", tagOptions)}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="tj-btn-ghost" style={{ flex: 1 }} onClick={() => { const cleared = { status: "all", side: "all", result: "all", setup: "all", tag: "all" }; setLocal(cleared); setFilters(cleared); }}>{labels.clearAll}</button>
            <button className="tj-btn-primary" style={{ flex: 1 }} onClick={() => { setFilters(local); onClose(); }}>{labels.apply}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
