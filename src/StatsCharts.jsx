import React from "react";
import { Trophy, Skull, Flame } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  LineChart,
  Line,
  Cell,
} from "recharts";

export default function StatsCharts({ stats, t }) {
  return (
    <>
      <div style={{ padding: "12px 16px 0" }}>
        <div className="tj-card" style={{ padding: 16 }}>
          <div className="tj-label">{t.equityCurve}</div>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={stats.equityCurve}>
              <defs>
                <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E8A33D" stopOpacity={0.34} />
                  <stop offset="100%" stopColor="#E8A33D" stopOpacity={0.02} />
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
        <StatTile label={t.avgWin} value={fmt2(stats.avgWin)} color="var(--profit)" />
        <StatTile label={t.avgLoss} value={fmt2(stats.avgLoss)} color="var(--loss)" />
        <StatTile label={t.longShort} value={`${stats.longCount} / ${stats.shortCount}`} />
        <StatTile label={t.avgR} value={`${fmt2(stats.avgR)}R`} />
      </div>

      <div style={{ padding: "12px 16px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="tj-card" style={{ padding: 14 }}>
          <div className="tj-label" style={{ display: "flex", alignItems: "center", gap: 5 }}><Trophy size={12} /> {t.bestTrade}</div>
          {stats.best ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{stats.best.ticker}</div>
              <PnlText value={stats.best.pnl} size={16} />
            </>
          ) : <div style={{ color: "var(--text-faint)", fontSize: 12 }}>—</div>}
        </div>
        <div className="tj-card" style={{ padding: 14 }}>
          <div className="tj-label" style={{ display: "flex", alignItems: "center", gap: 5 }}><Skull size={12} /> {t.worstTrade}</div>
          {stats.worst ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{stats.worst.ticker}</div>
              <PnlText value={stats.worst.pnl} size={16} />
            </>
          ) : <div style={{ color: "var(--text-faint)", fontSize: 12 }}>—</div>}
        </div>
        <div className="tj-card" style={{ padding: 14 }}>
          <div className="tj-label" style={{ display: "flex", alignItems: "center", gap: 5 }}><Flame size={12} /> {t.winStreak}</div>
          <div className="tj-mono" style={{ fontSize: 18, fontWeight: 600, color: "var(--profit)" }}>{stats.maxWinStreak}</div>
        </div>
        <div className="tj-card" style={{ padding: 14 }}>
          <div className="tj-label" style={{ display: "flex", alignItems: "center", gap: 5 }}><Flame size={12} /> {t.lossStreak}</div>
          <div className="tj-mono" style={{ fontSize: 18, fontWeight: 600, color: "var(--loss)" }}>{stats.maxLossStreak}</div>
        </div>
      </div>

      <div style={{ padding: "12px 16px 0" }}>
        <div className="tj-card" style={{ padding: 16 }}>
          <div className="tj-label">{t.pnlByDay}</div>
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
          <div className="tj-label">{t.cumulativePnlByDay}</div>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={stats.byDayEquity}>
              <CartesianGrid stroke="#262E38" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#5B6472", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: "#1B2129", border: "1px solid #262E38", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#8A93A1" }} />
              <Line type="monotone" dataKey="equity" stroke="#5EC8D8" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
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

function PnlText({ value, size = 14 }) {
  if (value == null) return <span className="tj-mono" style={{ color: "var(--text-faint)", fontSize: size }}>—</span>;
  const positive = value >= 0;
  return (
    <span className="tj-mono" style={{ color: positive ? "var(--profit)" : "var(--loss)", fontWeight: 600, fontSize: size }}>
      {positive ? "+" : ""}{fmt2(value)}
    </span>
  );
}

function fmt2(n) {
  return (Math.round((n + Number.EPSILON) * 100) / 100).toLocaleString();
}

