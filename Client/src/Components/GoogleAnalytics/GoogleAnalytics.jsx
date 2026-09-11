import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import cmLogoImg from "../../Assets/chinimandi.png";
import beLogoImg from "../../Assets/bioenergytimes.png";
import ebsLogoImg from "../../Assets/eBuySugarlogo.png";
import seicLogoImg from "../../Assets/SEIC_logo.png";
import agriInsiteLogoImg from "../../Assets/agriInsitelogo.png";
import jkIndiaLogoImg from "../../Assets/jkIndia.png";
import cmSquareLogoImg from "../../Assets/Chinimandi Square.png";
import beSquareLogoImg from "../../Assets/Bio energy times Square.png";
import ebsSquareLogoImg from "../../Assets/eBUY Sugar Square.png";
import seicSquareLogoImg from "../../Assets/SEIC Square.png";
import agriInsiteSquareLogoImg from "../../Assets/Agrinsite Square.png";
import ClosingStock from "../ClosingStock/ClosingStock";
import {
    AreaChart, Area,
    BarChart, Bar,
    ComposedChart, Line,
    PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid,
    Tooltip, Legend,
    ResponsiveContainer,
} from "recharts";

const API = process.env.REACT_APP_API;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n, type = "num") => {
    if (n === undefined || n === null || n === "") return "—";
    const v = parseFloat(n);
    if (isNaN(v)) return "—";
    if (type === "pct") return (v * 100).toFixed(1) + "%";
    if (type === "dur") {
        const m = Math.floor(v / 60);
        const s = Math.round(v % 60);
        return `${m}m ${s}s`;
    }
    return Math.round(v).toLocaleString("en-IN");
};

const fmtDate = (d) => {
    if (!d || d.length !== 8) return d;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const m = parseInt(d.slice(4, 6), 10) - 1;
    return `${months[m]} ${d.slice(6, 8)}`;
};

const shortLabel = (s = "", maxLen = 18) =>
    s.length > maxLen ? s.slice(0, maxLen - 1) + "…" : s;

// ─── Design tokens ───────────────────────────────────────────────────────────

const CM_ACC = "#16a34a";   // ChiniMandi green
const BE_ACC = "#0b6e6e";   // BioEnergy teal
const AI_ACC = "#15803d";   // AgriInsite green
const EBS_ACC = "#b45309";   // eBuySugar amber
const GOLD = "#c9a24b";
const EMERALD = "#013720";
const PIE_COLS = ["#013720", "#c9a24b", "#0b6e6e", "#8ad7ba", "#d8b86a", "#34b083"];
const EBS_COLS = ["#b45309", "#d97706", "#f59e0b", "#fbbf24", "#92400e", "#78350f"];
const SEIC_ACC = "#7c3aed";
const CLOSING_ACC = "#0369a1";
const CATEGORY_COLORS = {
    Title: "#7c3aed",
    Exclusive: "#0b6e6e",
    Platinum: "#475569",
    Gold: "#b45309",
    Silver: "#64748b",
};

const NAV_IDS = ["ebuysugar", "chinimandi", "bioenergy", "agriinsights", "seic", "closing-analytics", "etrack-info"];

const GA4_RANGES = [
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "week", label: "7 Days" },
    { id: "month", label: "30 Days" },
    { id: "year", label: "Year" },
    { id: "custom", label: "Custom" },
];

const EBS_RANGES = [
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "1_month", label: "1 Month" },
    { id: "3_month", label: "3 Months" },
    { id: "yearly", label: "Yearly" },
    { id: "custom", label: "Custom" },
];

// ─── Global styles (SEIC design system) ──────────────────────────────────────

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Signika:wght@300..700&display=swap');
:root {
  --emerald-950:#00140b;--emerald-900:#042a1c;--emerald-800:#013720;
  --emerald-700:#0a4a33;--emerald-600:#0e5e40;--emerald-500:#0f7a52;
  --emerald-400:#008357;--emerald-300:#34b083;--emerald-200:#8ad7ba;
  --emerald-100:#d3eee1;--emerald-50:#eef8f2;
  --gold-600:#b58c34;--gold-500:#c9a24b;--gold-400:#d8b86a;
  --gold-300:#e7d49c;--gold-200:#f1e6c4;--gold-100:#faf4e2;
  --ivory-50:#fcfaf4;--ivory-100:#f7f1e4;--ivory-200:#efe6d2;
  --ink-950:#0a1310;--ink-900:#0f1a16;--ink-800:#1b2723;
  --ink-700:#2c3a35;--ink-600:#45544e;--ink-500:#647069;
  --ink-400:#8b958f;--ink-300:#b3bbb6;--ink-200:#d6dbd7;--ink-100:#e9ece9;
  --white:#ffffff;
  --surface-page:var(--ivory-50);--surface-card:var(--white);
  --surface-sunken:var(--ivory-100);
  --text-strong:var(--ink-950);--text-body:var(--ink-800);
  --text-muted:var(--ink-500);--text-subtle:var(--ink-400);
  --border-subtle:var(--ink-100);--border-default:var(--ink-200);
  --shadow-sm:0 1px 3px rgba(15,26,22,.08),0 1px 2px rgba(15,26,22,.04);
  --shadow-md:0 4px 12px rgba(15,26,22,.08),0 2px 4px rgba(15,26,22,.05);
  --font-display:'Signika',system-ui,sans-serif;
  --font-sans:'Signika',system-ui,-apple-system,sans-serif;
}
*,*::before,*::after{box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{margin:0;font-family:var(--font-sans);background:var(--surface-page);
  color:var(--text-body);-webkit-font-smoothing:antialiased;}
a{text-decoration:none;color:inherit;}
::-webkit-scrollbar{width:8px;}
::-webkit-scrollbar-thumb{background:var(--ink-200);border-radius:8px;border:2px solid var(--surface-page);}
@keyframes ga-spin{to{transform:rotate(360deg)}}
@keyframes ga-pulse{0%,100%{opacity:1}50%{opacity:.4}}
.recharts-wrapper,.recharts-surface,.recharts-layer{cursor:pointer !important;}
`;

// ─── Skeleton loader ──────────────────────────────────────────────────────────

const skeletonStyle = {
    background: "linear-gradient(90deg,#e9ece9 25%,#d6dbd7 50%,#e9ece9 75%)",
    backgroundSize: "200% 100%",
    animation: "ga-pulse 1.4s ease infinite",
    borderRadius: 8,
};
const Skeleton = ({ h = 20, w = "100%", mb = 0 }) => (
    <div style={{ ...skeletonStyle, height: h, width: w, marginBottom: mb }} />
);

// ─── Tooltip ─────────────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label, labelFmt }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: "var(--surface-card)", border: "1px solid var(--border-subtle)",
            borderRadius: 10, padding: "10px 14px", fontSize: 12,
            boxShadow: "var(--shadow-md)", fontFamily: "var(--font-sans)",
        }}>
            {label && (
                <div style={{ fontWeight: 700, color: "var(--text-strong)", marginBottom: 6 }}>
                    {labelFmt ? labelFmt(label) : label}
                </div>
            )}
            {payload.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                    <span style={{ color: "var(--text-muted)" }}>{p.name}:</span>
                    <span style={{ fontWeight: 700, color: "var(--text-strong)" }}>{fmt(p.value)}</span>
                </div>
            ))}
        </div>
    );
};

// ─── KPI Card ────────────────────────────────────────────────────────────────

const KPICard = ({ label, value, accent, sub }) => (
    <div style={{
        background: "var(--surface-card)", border: "1px solid var(--border-subtle)",
        borderLeft: `3px solid ${accent}`, borderRadius: 12,
        padding: "10px 12px", display: "flex", flexDirection: "column", gap: 3,
        boxShadow: "var(--shadow-sm)",
    }}>
        <div style={{
            fontSize: ".64rem", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: ".09em", color: "var(--text-muted)"
        }}>
            {label}
        </div>
        <div style={{
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.28rem",
            letterSpacing: "-.02em", color: "var(--text-strong)", fontVariantNumeric: "tabular-nums",
            lineHeight: 1.1
        }}>
            {value}
        </div>
        {sub && (
            <div style={{ fontSize: ".64rem", color: "var(--text-subtle)", marginTop: 1 }}>{sub}</div>
        )}
    </div>
);

// ─── Section Card wrapper ─────────────────────────────────────────────────────

const Card = ({ children, accent, style: extra = {} }) => (
    <div style={{
        background: "var(--surface-card)", border: "1px solid var(--border-subtle)",
        borderTop: `3px solid ${accent}`, borderRadius: 16,
        boxShadow: "var(--shadow-sm)", padding: "14px 16px",
        display: "flex", flexDirection: "column", gap: 12,
        ...extra,
    }}>
        {children}
    </div>
);

// ─── Chart header ─────────────────────────────────────────────────────────────

const ChartHeader = ({ title, sub }) => (
    <div style={{ marginBottom: 4 }}>
        <div style={{
            fontSize: ".72rem", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: ".09em", color: "var(--text-muted)"
        }}>{title}</div>
        {sub && <div style={{ fontSize: ".68rem", color: "var(--text-subtle)", marginTop: 2 }}>{sub}</div>}
    </div>
);

// ─── Category Badge ───────────────────────────────────────────────────────────

const CategoryBadge = ({ name }) => {
    const color = CATEGORY_COLORS[name] || "#64748b";
    return (
        <span style={{
            display: "inline-block", padding: "2px 9px", borderRadius: 99,
            fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: ".06em", background: color + "1a",
            color, border: `1px solid ${color}44`,
        }}>{name}</span>
    );
};

// ─── 30-day Area Trend ────────────────────────────────────────────────────────

const TrendChart = ({ data = [], accent }) => {
    const uid = accent.replace("#", "u");
    return (
        <div>
            <ChartHeader title="30-Day Traffic Trend" sub="Active users & sessions — last 30 days" />
            <ResponsiveContainer width="100%" height={165}>
                <AreaChart data={data} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`grad-u-${uid}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={accent} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={accent} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id={`grad-s-${uid}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={GOLD} stopOpacity={0.15} />
                            <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={fmtDate}
                        tick={{ fontSize: 10, fill: "var(--text-subtle)" }}
                        axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tickFormatter={(v) => fmt(v)}
                        tick={{ fontSize: 10, fill: "var(--text-subtle)" }}
                        axisLine={false} tickLine={false} width={44} />
                    <Tooltip content={<ChartTooltip labelFmt={fmtDate} />} />
                    <Legend iconType="circle" iconSize={7}
                        formatter={(v) => v === "activeUsers" ? "Active Users" : "Sessions"}
                        wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="activeUsers" name="activeUsers"
                        stroke={accent} strokeWidth={2.2}
                        fill={`url(#grad-u-${uid})`} dot={false} activeDot={{ r: 4 }} />
                    <Area type="monotone" dataKey="sessions" name="sessions"
                        stroke={GOLD} strokeWidth={1.8} strokeDasharray="5 3"
                        fill={`url(#grad-s-${uid})`} dot={false} activeDot={{ r: 4 }} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

// ─── Device Donut ─────────────────────────────────────────────────────────────

const DeviceDonut = ({ data = [] }) => {
    const total = data.reduce((s, r) => s + (r.activeUsers || 0), 0);
    return (
        <div>
            <ChartHeader title="Device Breakdown" sub="Users by device category" />
            {data.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 0", fontSize: 13 }}>
                    No device data
                </div>
            ) : (
                <>
                    <ResponsiveContainer width="100%" height={145}>
                        <PieChart>
                            <Pie data={data} cx="50%" cy="50%" innerRadius={38} outerRadius={58}
                                paddingAngle={3} dataKey="activeUsers" nameKey="deviceCategory">
                                {data.map((_, i) => (
                                    <Cell key={i} fill={PIE_COLS[i % PIE_COLS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const d = payload[0];
                                return (
                                    <div style={{
                                        background: "var(--surface-card)", border: "1px solid var(--border-subtle)",
                                        borderRadius: 8, padding: "8px 12px", fontSize: 12, boxShadow: "var(--shadow-md)"
                                    }}>
                                        <div style={{ fontWeight: 700 }}>{d.name}</div>
                                        <div style={{ color: "var(--text-muted)" }}>
                                            {fmt(d.value)} users · {total ? ((d.value / total) * 100).toFixed(1) + "%" : "—"}
                                        </div>
                                    </div>
                                );
                            }} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", justifyContent: "center", marginTop: 4 }}>
                        {data.map((d, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
                                <span style={{ width: 8, height: 8, borderRadius: "50%", background: PIE_COLS[i % PIE_COLS.length] }} />
                                <span style={{ color: "var(--text-muted)", textTransform: "capitalize" }}>{d.deviceCategory}</span>
                                <span style={{ fontWeight: 700, color: "var(--text-strong)" }}>{fmt(d.activeUsers)}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

// ─── Channel Bar Chart ────────────────────────────────────────────────────────

const ChannelChart = ({ data = [], accent }) => (
    <div>
        <ChartHeader title="Traffic Channels" sub="Users by acquisition channel" />
        {data.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 0", fontSize: 13 }}>
                No channel data
            </div>
        ) : (
            <ResponsiveContainer width="100%" height={158}>
                <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 32 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                    <XAxis dataKey="sessionDefaultChannelGroup"
                        tickFormatter={(v) => shortLabel(v, 14)}
                        tick={{ fontSize: 10, fill: "var(--text-subtle)" }}
                        angle={-25} textAnchor="end" height={40}
                        axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => fmt(v)}
                        tick={{ fontSize: 10, fill: "var(--text-subtle)" }}
                        axisLine={false} tickLine={false} width={40} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="activeUsers" name="Active Users" radius={[4, 4, 0, 0]} maxBarSize={48}>
                        {data.map((_, i) => <Cell key={i} fill={PIE_COLS[i % PIE_COLS.length]} />)}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        )}
    </div>
);

// ─── Newsroom Breakdown Bar Chart ────────────────────────────────────────────

const BreakdownBarChart = ({ data = [], accent, title, subtitle }) => (
    <div>
        <ChartHeader title={title} sub={subtitle} />
        {data.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 0", fontSize: 13 }}>
                No data available
            </div>
        ) : (
            <ResponsiveContainer width="100%" height={178}>
                <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 46 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                    <XAxis dataKey="name"
                        tickFormatter={(v) => shortLabel(v, 16)}
                        tick={{ fontSize: 10, fill: "var(--text-subtle)" }}
                        angle={-30} textAnchor="end" height={54}
                        axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => fmt(v)}
                        tick={{ fontSize: 10, fill: "var(--text-subtle)" }}
                        axisLine={false} tickLine={false} width={36} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="total" name="Articles" radius={[4, 4, 0, 0]} maxBarSize={40} fill={accent} />
                </BarChart>
            </ResponsiveContainer>
        )}
    </div>
);

// ─── Content Strategy Bar Chart ──────────────────────────────────────────────

const ContentStrategyChart = ({ data = [] }) => (
    <div>
        <ChartHeader title="Content Strategy" sub="Articles by news type" />
        {data.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 0", fontSize: 13 }}>
                No data available
            </div>
        ) : (
            <ResponsiveContainer width="100%" height={178}>
                <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 46 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                    <XAxis dataKey="name"
                        tickFormatter={(v) => shortLabel(v, 16)}
                        tick={{ fontSize: 10, fill: "var(--text-subtle)" }}
                        angle={-30} textAnchor="end" height={54}
                        axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => fmt(v)}
                        tick={{ fontSize: 10, fill: "var(--text-subtle)" }}
                        axisLine={false} tickLine={false} width={36} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" name="Articles" radius={[4, 4, 0, 0]} maxBarSize={40}>
                        {data.map((_, i) => <Cell key={i} fill={PIE_COLS[i % PIE_COLS.length]} />)}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        )}
    </div>
);

// ─── Newsroom Strategy Insights Section ──────────────────────────────────────

function NewsroomInsights({ data, accent, breakdownLabel }) {
    if (!data) return null;

    const { total_published_posts = 0, languages = {}, newsTypes = {}, error } = data;

    const langData = Object.entries(languages)
        .map(([name, val]) => ({ name, total: typeof val === "object" ? (val.total || 0) : val }))
        .filter((d) => d.total > 0)
        .sort((a, b) => b.total - a.total);

    const typeData = Object.entries(newsTypes)
        .map(([name, count]) => ({ name, count: Number(count) || 0 }))
        .filter((d) => d.count > 0)
        .sort((a, b) => b.count - a.count);

    return (
        <div>
            {/* Sub-section divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0 10px" }}>
                <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
                <div style={{
                    display: "flex", alignItems: "center", gap: 7,
                    fontSize: ".7rem", fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: ".12em", color: "var(--text-muted)", whiteSpace: "nowrap",
                }}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <rect x="0.5" y="0.5" width="4.5" height="4.5" rx="1.2" fill={accent} opacity="0.85" />
                        <rect x="8" y="0.5" width="4.5" height="4.5" rx="1.2" fill={accent} opacity="0.5" />
                        <rect x="0.5" y="8" width="4.5" height="4.5" rx="1.2" fill={accent} opacity="0.5" />
                        <rect x="8" y="8" width="4.5" height="4.5" rx="1.2" fill={accent} opacity="0.25" />
                    </svg>
                    Newsroom Strategy Insights
                </div>
                <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
            </div>

            {error ? (
                <div style={{
                    background: "#fff8f0", border: "1px solid #f5c46a", borderRadius: 10,
                    padding: "10px 14px", fontSize: 12, color: "#7a4a00",
                }}>
                    ⚠ Newsroom API error: {error}
                </div>
            ) : (
                <>
                    {/* Total Published highlight bar */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: 16, marginBottom: 10,
                        background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)",
                        borderLeft: `3px solid ${accent}`, borderRadius: 10, padding: "8px 14px",
                        flexWrap: "wrap",
                    }}>
                        <div>
                            <div style={{
                                fontSize: ".66rem", fontWeight: 700, textTransform: "uppercase",
                                letterSpacing: ".09em", color: "var(--text-muted)",
                            }}>Total Published</div>
                            <div style={{
                                fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.55rem",
                                color: accent, letterSpacing: "-.02em", lineHeight: 1.1,
                                fontVariantNumeric: "tabular-nums",
                            }}>
                                {fmt(total_published_posts)}
                            </div>
                            <div style={{ fontSize: ".68rem", color: "var(--text-subtle)", marginTop: 2 }}>
                                posts in selected period
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                            {typeData.slice(0, 4).map((t, i) => (
                                <div key={i} style={{ textAlign: "center" }}>
                                    <div style={{
                                        fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem",
                                        color: PIE_COLS[i % PIE_COLS.length], lineHeight: 1,
                                    }}>{t.count}</div>
                                    <div style={{ fontSize: ".65rem", color: "var(--text-muted)", marginTop: 3 }}>{t.name}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Language/Category + Content Strategy charts */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div style={{
                            background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)",
                            borderRadius: 10, padding: 12,
                        }}>
                            <BreakdownBarChart
                                data={langData}
                                accent={accent}
                                title={breakdownLabel}
                                subtitle="Articles per category in selected period"
                            />
                        </div>
                        <div style={{
                            background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)",
                            borderRadius: 10, padding: 12,
                        }}>
                            <ContentStrategyChart data={typeData} />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// ─── eBuySugar helpers ───────────────────────────────────────────────────────

const fmtMonth = (ym) => {
    if (!ym || ym.length < 7) return ym;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[parseInt(ym.slice(5, 7), 10) - 1]} '${ym.slice(2, 4)}`;
};

const fmtCr = (v) => {
    const n = parseFloat(v) || 0;
    const cr = n / 10000000;
    if (cr >= 1000) return (cr / 1000).toFixed(1) + "K Cr";
    return cr.toFixed(2) + " Cr";
};

const fmtINR = (n) => {
    const v = parseFloat(n) || 0;
    if (v >= 10000000) return "₹" + (v / 10000000).toFixed(2) + " Cr";
    if (v >= 100000) return "₹" + (v / 100000).toFixed(2) + " L";
    if (v >= 1000) return "₹" + (v / 1000).toFixed(1) + "K";
    return "₹" + v.toLocaleString("en-IN");
};

const parseEBS = (info = []) => {
    const m = {};
    info.forEach((item) => { m[item.id] = item; });
    return {
        availableSugar: m[1]?.count,
        activeSellerCount: m[2]?.count,
        availableQty: m[3]?.count,
        filteredSaleVolumeRs: m[4]?.count,
        filteredSaleVolumeQtl: m[5]?.count,
        totalSaleVolumeRs: m[6]?.count,
        totalSaleVolumeQtl: m[7]?.count,
        filteredRegUsers: m[8]?.count,
        totalUsers: m[9]?.count,
        monthlyTrades: Array.isArray(m[10]?.count) ? m[10].count : [],
        filteredTradesCount: m[11]?.count,
        filteredActiveUsers: m[12]?.count,
        monthlyActiveUsers: Array.isArray(m[13]?.count) ? m[13].count : [],
    };
};

// ─── eBuySugar: Monthly Trade Activity (Composed) ────────────────────────────

const EBSTradeChart = ({ data = [] }) => (
    <div>
        <ChartHeader title="Monthly Trade Activity" sub="Trades count & quantity sold per month" />
        {data.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 0", fontSize: 13 }}>No data</div>
        ) : (
            <ResponsiveContainer width="100%" height={175}>
                <ComposedChart data={data} margin={{ top: 4, right: 46, left: 0, bottom: 32 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-subtle)" }}
                        angle={-30} textAnchor="end" height={50} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" tickFormatter={(v) => fmt(v)}
                        tick={{ fontSize: 10, fill: "var(--text-subtle)" }}
                        axisLine={false} tickLine={false} width={40} allowDecimals={false} />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => fmt(v)}
                        tick={{ fontSize: 10, fill: "var(--text-subtle)" }}
                        axisLine={false} tickLine={false} width={50} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
                    <Bar yAxisId="left" dataKey="trades" name="Trades" fill={EBS_ACC}
                        radius={[4, 4, 0, 0]} maxBarSize={36} />
                    <Line yAxisId="right" type="monotone" dataKey="qty" name="Qty (Qtl)"
                        stroke={GOLD} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </ComposedChart>
            </ResponsiveContainer>
        )}
    </div>
);

// ─── eBuySugar: Monthly Sale Value (Area) ────────────────────────────────────

const EBSSaleValueChart = ({ data = [] }) => {
    const uid = "ebs-sale";
    return (
        <div>
            <ChartHeader title="Monthly Sale Value" sub="Trade value in Crores (₹)" />
            {data.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 0", fontSize: 13 }}>No data</div>
            ) : (
                <ResponsiveContainer width="100%" height={162}>
                    <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 32 }}>
                        <defs>
                            <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={EBS_ACC} stopOpacity={0.25} />
                                <stop offset="95%" stopColor={EBS_ACC} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-subtle)" }}
                            angle={-30} textAnchor="end" height={50} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={(v) => v.toFixed(0) + " Cr"}
                            tick={{ fontSize: 10, fill: "var(--text-subtle)" }}
                            axisLine={false} tickLine={false} width={60} />
                        <Tooltip content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            return (
                                <div style={{
                                    background: "var(--surface-card)", border: "1px solid var(--border-subtle)",
                                    borderRadius: 10, padding: "10px 14px", fontSize: 12, boxShadow: "var(--shadow-md)"
                                }}>
                                    <div style={{ fontWeight: 700, color: "var(--text-strong)", marginBottom: 4 }}>{label}</div>
                                    <div style={{ color: "var(--text-muted)" }}>
                                        Sale Value: <strong style={{ color: "var(--text-strong)" }}>₹{payload[0]?.value?.toFixed(2)} Cr</strong>
                                    </div>
                                </div>
                            );
                        }} />
                        <Area type="monotone" dataKey="saleValue" name="Sale Value (Cr)"
                            stroke={EBS_ACC} strokeWidth={2.5} fill={`url(#${uid})`} dot={false} activeDot={{ r: 4 }} />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

// ─── eBuySugar: Monthly Active Users (Bar) ───────────────────────────────────

const EBSActiveUsersChart = ({ data = [] }) => (
    <div>
        <ChartHeader title="Monthly Active Users" sub="Platform users active each month" />
        {data.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 0", fontSize: 13 }}>No data</div>
        ) : (
            <ResponsiveContainer width="100%" height={175}>
                <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 32 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-subtle)" }}
                        angle={-30} textAnchor="end" height={40} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => fmt(v)}
                        tick={{ fontSize: 10, fill: "var(--text-subtle)" }}
                        axisLine={false} tickLine={false} width={44} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="activeUsers" name="Active Users" radius={[4, 4, 0, 0]} maxBarSize={28}>
                        {data.map((_, i) => <Cell key={i} fill={EBS_COLS[i % EBS_COLS.length]} />)}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        )}
    </div>
);

// ─── eBuySugar Main Section ───────────────────────────────────────────────────

function EBuySugarSection({ ebsRange, onEbsApply, ebsData, ebsLoading, ebsError }) {
    const ebsLogo = (
        <img src={ebsLogoImg} alt="eBuySugar"
            style={{
                height: 44, width: "auto", maxWidth: 150, borderRadius: 8,
                objectFit: "contain", flexShrink: 0, display: "block"
            }} />
    );

    const parsed = ebsData ? parseEBS(ebsData.info || []) : null;

    const tradeData = parsed
        ? [...parsed.monthlyTrades].reverse().map((m) => ({
            name: m.month_year,
            trades: parseInt(m.total_trades) || 0,
            qty: parseInt(m.total_qty_sold) || 0,
            saleValue: parseFloat(m.total_sale_value) / 10000000,
        }))
        : [];

    const usersData = parsed
        ? [...parsed.monthlyActiveUsers].reverse().map((m) => ({
            name: fmtMonth(m.month),
            activeUsers: parseInt(m.total_active_users) || 0,
        }))
        : [];

    return (
        <section id="ebuysugar" style={{ scrollMarginTop: 88, marginBottom: 20 }}>
            {/* Section head */}
            <SectionHead
                title="eBuySugar"
                subtitle="Online sugar trading platform · www.ebuysugar.com"
                url="https://www.ebuysugar.com"
                logoEl={ebsLogo}
            />

            {/* Filter toggle + live badge */}
            <SectionFilter
                ranges={EBS_RANGES} range={ebsRange} accent={EBS_ACC}
                loading={ebsLoading} onApply={onEbsApply}
                badgeLabel="Live · eBuySugar Platform" badgeColor={EBS_ACC}
            />

            {ebsError && (
                <div style={{
                    background: "#fff8f0", border: "1px solid #f5c46a", borderRadius: 12,
                    padding: "14px 18px", display: "flex", alignItems: "center", gap: 10,
                    fontSize: 13, color: "#7a4a00", marginBottom: 16
                }}>
                    <span style={{ fontSize: 18 }}>⚠</span>
                    <span><strong>eBuySugar Error:</strong> {ebsError}</span>
                </div>
            )}

            {(ebsLoading || parsed) && (
                <Card accent={EBS_ACC}>

                    {ebsLoading ? (
                        <>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <div key={n} style={{ background: "var(--surface-sunken)", borderRadius: 10, padding: "10px 12px" }}>
                                        <Skeleton h={9} w="60%" mb={6} /><Skeleton h={22} w="80%" />
                                    </div>
                                ))}
                            </div>
                            <Skeleton h={175} /><Skeleton h={162} />
                        </>
                    ) : parsed && (
                        <>
                            {/* ── 5 KPI Cards ── */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
                                <KPICard
                                    label="Sell Volume (Quintals)"
                                    value={fmt(parsed.filteredSaleVolumeQtl)}
                                    accent={EBS_ACC}
                                    sub="Total quintals sold in period"
                                />
                                <KPICard
                                    label="Sale Amount (incl. GST)"
                                    value={parsed.filteredSaleVolumeRs || "—"}
                                    accent={EBS_ACC}
                                    sub="Total sale value with GST"
                                />
                                <KPICard
                                    label="No. of Trades"
                                    value={fmt(parsed.filteredTradesCount)}
                                    accent={EBS_ACC}
                                    sub="Total trades in selected period"
                                />
                                <KPICard
                                    label="New Registered Users"
                                    value={fmt(parsed.filteredRegUsers)}
                                    accent={EBS_ACC}
                                    sub="New sign-ups in selected period"
                                />
                                <KPICard
                                    label="Daily Active Users"
                                    value={fmt(parsed.filteredActiveUsers)}
                                    accent={EBS_ACC}
                                    sub="Active users on the platform"
                                />
                            </div>

                            {/* ── Trade Activity + Active Users side by side ── */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                <div style={{
                                    background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)",
                                    borderRadius: 10, padding: 12
                                }}>
                                    <EBSTradeChart data={tradeData} />
                                </div>
                                <div style={{
                                    background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)",
                                    borderRadius: 10, padding: 12
                                }}>
                                    <EBSActiveUsersChart data={usersData} />
                                </div>
                            </div>

                            {/* ── Sale Value full-width ── */}
                            <div style={{
                                background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)",
                                borderRadius: 10, padding: 12
                            }}>
                                <EBSSaleValueChart data={tradeData} />
                            </div>
                        </>
                    )}
                </Card>
            )}
        </section>
    );
}

// ─── SEIC Conference Section ──────────────────────────────────────────────────

function SEICSection() {
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [statsData, setStatsData] = useState(null);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [top5View, setTop5View] = useState("chart");

    useEffect(() => {
        setEventsLoading(true);
        axios.get("https://events-api.chinimandi.com/event-masters/")
            .then((r) => {
                const data = Array.isArray(r.data) ? r.data : [];
                const sorted = [...data].sort((a, b) => b.EventMasterId - a.EventMasterId);
                setEvents(sorted);
                if (sorted.length > 0) setSelectedEventId(sorted[0].EventMasterId);
            })
            .catch((e) => setError(e?.response?.data?.error || e.message))
            .finally(() => setEventsLoading(false));
    }, []);

    useEffect(() => {
        if (!selectedEventId) return;
        setLoading(true);
        setError(null);
        axios.get(`https://events-api.chinimandi.com/sponsors/dashboard-stats?event_code=${selectedEventId}`)
            .then((r) => {
                const d = r.data;
                setStatsData(d.success ? (d.data || null) : null);
                if (!d.success) setError("API returned failure");
            })
            .catch((e) => setError(e?.response?.data?.error || e.message))
            .finally(() => setLoading(false));
    }, [selectedEventId]);

    const {
        stats = {}, sponsor_details = [], booth_assignments = [],
        passes_data = {}, amount_summary = {},
    } = statsData || {};

    const confirmedCount = sponsor_details.filter((s) => s.Approval_Received === "Y").length;
    const pendingCount = sponsor_details.filter((s) => s.Approval_Received !== "Y").length;
    const statusDonutData = [
        { name: "Confirmed", value: confirmedCount || 0.001 },
        { name: "Pending", value: pendingCount || 0.001 },
    ];

    const top5 = [...sponsor_details]
        .filter((s) => s.Sponsorship_Amount > 0)
        .sort((a, b) => b.Sponsorship_Amount - a.Sponsorship_Amount)
        .slice(0, 5);
    const top5ChartData = top5.map((s) => ({
        name: s.Sponsor_Name.length > 28 ? s.Sponsor_Name.slice(0, 26) + "…" : s.Sponsor_Name,
        fullName: s.Sponsor_Name,
        amount: s.Sponsorship_Amount,
    }));

    const selectedEvent = events.find((e) => e.EventMasterId === selectedEventId);

    const SEIC_KPI_CARDS = [
        {
            label: "Total Sponsors List", value: stats.total_sponsors ?? "—",
            grad: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
            icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 18c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="white" strokeWidth="1.7" strokeLinecap="round" /><circle cx="11" cy="7" r="4" stroke="white" strokeWidth="1.7" /></svg>,
        },
        {
            label: "Award Records", value: stats.award_records ?? "—",
            grad: "linear-gradient(135deg,#f59e0b,#d97706)",
            icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 2l2.09 6.26L19 9.27l-4.5 4.38 1.06 6.19L11 16.77l-5.56 2.93 1.06-6.19L2 9.27l5.91-.91z" stroke="white" strokeWidth="1.7" strokeLinejoin="round" /></svg>,
        },
        {
            label: "Ministerial Speakers", value: stats.ministerial_speakers ?? "—",
            grad: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
            icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="8" width="16" height="11" rx="2" stroke="white" strokeWidth="1.7" /><path d="M8 8V6a3 3 0 016 0v2" stroke="white" strokeWidth="1.7" strokeLinecap="round" /><circle cx="11" cy="13" r="2" fill="white" /></svg>,
        },
        {
            label: "Curated Speakers", value: stats.curated_speakers ?? "—",
            grad: "linear-gradient(135deg,#10b981,#059669)",
            icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M9 11l2 2 4-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 6h14M4 10h7M4 14h5" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity=".6" /></svg>,
        },
        {
            label: "Speaker Tracker", value: stats.speaker_tracker ?? "—",
            grad: "linear-gradient(135deg,#ef4444,#dc2626)",
            icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="8" stroke="white" strokeWidth="1.7" /><circle cx="11" cy="11" r="3" fill="white" opacity=".9" /><path d="M11 4v14M4 11h14" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity=".4" /></svg>,
        },
        {
            label: "Booths Assigned", value: stats.booths_assigned ?? "—",
            grad: "linear-gradient(135deg,#6366f1,#4f46e5)",
            icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="9" width="16" height="10" rx="1.5" stroke="white" strokeWidth="1.7" /><path d="M3 9l8-6 8 6" stroke="white" strokeWidth="1.7" strokeLinejoin="round" /><rect x="8" y="13" width="6" height="6" rx="1" stroke="white" strokeWidth="1.5" /></svg>,
        },
        {
            label: "Total Passes", value: fmt(stats.total_passes),
            grad: "linear-gradient(135deg,#ec4899,#db2777)",
            icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="7" width="18" height="8" rx="2" stroke="white" strokeWidth="1.7" /><path d="M14 7v8" stroke="white" strokeWidth="1.5" strokeDasharray="2 2" /><path d="M6 11h4M6 13h2" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>,
        },
        {
            label: "SND Passes", value: fmt(stats.sugar_networking_passes),
            grad: "linear-gradient(135deg,#14b8a6,#0d9488)",
            icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="7" cy="9" r="3" stroke="white" strokeWidth="1.7" /><circle cx="15" cy="9" r="3" stroke="white" strokeWidth="1.7" /><path d="M1 19c0-2.761 2.686-5 6-5M15 14c3.314 0 6 2.239 6 5" stroke="white" strokeWidth="1.7" strokeLinecap="round" /></svg>,
        },
    ];

    const seicLogoEl = (
        <div style={{
            background: "linear-gradient(135deg,#96c23d,#6fa832)",
            borderRadius: 10, padding: "4px 10px",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, height: 52,
        }}>
            <img src={seicLogoImg} alt="SEIC Conference"
                style={{ height: 42, width: "auto", maxWidth: 160, objectFit: "contain", display: "block" }} />
        </div>
    );

    return (
        <section id="seic" style={{ scrollMarginTop: 88, marginBottom: 20 }}>
            <SectionHead
                title="SEIC Conference"
                subtitle={selectedEvent ? `${selectedEvent.EventMaster_Name} · Sugar & Ethanol Industry Conference` : "Sugar & Ethanol Industry Conference"}
                logoEl={seicLogoEl}
                url="https://seic.events/"
            />

            {/* Event selector */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: ".7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-muted)" }}>Event:</span>
                <select value={selectedEventId || ""} onChange={(e) => setSelectedEventId(Number(e.target.value))}
                    disabled={eventsLoading || loading}
                    style={{ padding: "6px 12px", borderRadius: 8, minWidth: 280, border: `1px solid ${SEIC_ACC}55`, fontSize: ".82rem", fontFamily: "var(--font-sans)", fontWeight: 600, color: "var(--text-body)", background: "var(--surface-card)", cursor: "pointer", outline: "none" }}>
                    {events.map((ev) => {
                        const fmtD = (s) => { if (!s) return ""; const p = s.split("-"); return p.length === 3 ? `${p[2]}-${p[1]}-${p[0].slice(-2)}` : s; };
                        return (
                            <option key={ev.EventMasterId} value={ev.EventMasterId}>
                                {ev.EventMaster_Name}  ({fmtD(ev.Start_Date)}  →  {fmtD(ev.End_Date)})
                            </option>
                        );
                    })}
                </select>
                {(eventsLoading || loading) && (
                    <svg style={{ animation: "ga-spin .8s linear infinite", flexShrink: 0 }} width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="5" stroke="var(--border-default)" strokeWidth="2" />
                        <path d="M7 2 A5 5 0 0 1 12 7" stroke={SEIC_ACC} strokeWidth="2" strokeLinecap="round" />
                    </svg>
                )}
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: ".72rem", color: SEIC_ACC, fontWeight: 700 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: SEIC_ACC, boxShadow: `0 0 0 3px ${SEIC_ACC}33` }} />
                    Live · SEIC Events
                </div>
            </div>

            {error && <ErrorCard message={error} />}

            {loading && (
                <Card accent={SEIC_ACC}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 8 }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <Skeleton key={n} h={78} />)}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.2fr 0.9fr 1fr", gap: 10 }}>
                        <Skeleton h={180} /><Skeleton h={180} /><Skeleton h={180} /><Skeleton h={180} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 10 }}>
                        <Skeleton h={240} /><Skeleton h={240} />
                    </div>
                    <Skeleton h={200} />
                </Card>
            )}

            {!loading && statsData && (
                <Card accent={SEIC_ACC}>
                    {/* ── Row 1: Gradient KPI cards (8 cols) ── */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 8 }}>
                        {SEIC_KPI_CARDS.map((c, i) => (
                            <div key={i} style={{ borderRadius: 10, padding: "8px 10px 7px", background: c.grad, position: "relative", overflow: "hidden" }}>
                                <div style={{ position: "absolute", right: -8, top: -8, width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,.1)" }} />
                                <div style={{ opacity: .85, marginBottom: 4, transform: "scale(.82)", transformOrigin: "left top" }}>{c.icon}</div>
                                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.12rem", color: "white", letterSpacing: "-.02em", lineHeight: 1.1 }}>{c.value}</div>
                                <div style={{ fontSize: ".54rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "rgba(255,255,255,.8)", marginTop: 2, lineHeight: 1.3 }}>{c.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* ── Row 2: Passes | Status Donut | Amount Summary ── */}
                    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 10 }}>

                        {/* Passes Breakdown */}
                        <div style={{ background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: "10px 12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                                <span style={{ fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--text-muted)" }}>Total Passes</span>
                                <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.55rem", color: "var(--text-strong)", letterSpacing: "-.02em" }}>
                                    {fmt(stats.total_passes)}
                                </span>
                            </div>
                            {(() => {
                                const bd = passes_data.breakdown || {};
                                return [
                                    { label: "SPONSOR PASSES", total: bd.sponsor_grand_total || 0, color: "#3b82f6", sub: [{ label: "Passes With Stay (Double Occupancy)", val: bd.sponsor_total_elite || 0 }, { label: "Passes Without Stay", val: bd.sponsor_total_corporate || 0 }, { label: "Passes With Stay (Single Occupancy)", val: bd.sponsor_total_visitor || 0 }] },
                                    { label: "NON-SPONSOR PASSES", total: bd.non_sponsor_grand_total || 0, color: "#8b5cf6", sub: [{ label: "Passes With Stay (Double Occupancy)", val: bd.non_sponsor_total_elite || 0 }, { label: "Passes Without Stay", val: bd.non_sponsor_total_corporate || 0 }, { label: "Passes With Stay (Single Occupancy)", val: bd.non_sponsor_total_visitor || 0 }] },
                                ].map((pr, ri) => (
                                    <div key={ri} style={{ marginBottom: ri === 0 ? 10 : 0 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                                <span style={{ width: 8, height: 8, borderRadius: 2, background: pr.color, flexShrink: 0 }} />
                                                <span style={{ fontSize: ".6rem", fontWeight: 800, color: pr.color, letterSpacing: ".07em" }}>{pr.label}</span>
                                            </div>
                                            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: ".95rem", color: pr.color }}>{pr.total}</span>
                                        </div>
                                        <div style={{ display: "flex", height: 5, borderRadius: 99, overflow: "hidden", background: "var(--border-subtle)", marginBottom: 4 }}>
                                            {pr.sub.map((s, si) => {
                                                const w = pr.total > 0 ? Math.round((s.val / pr.total) * 100) : 0;
                                                return w > 0 ? <div key={si} style={{ width: `${w}%`, background: si === 0 ? pr.color : si === 1 ? pr.color + "aa" : pr.color + "66", height: "100%" }} /> : null;
                                            })}
                                        </div>
                                        {pr.sub.map((s, si) => {
                                            const pct = pr.total > 0 ? Math.round((s.val / pr.total) * 100) : 0;
                                            return (
                                                <div key={si} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                                                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: si === 0 ? pr.color : si === 1 ? pr.color + "cc" : pr.color + "88", flexShrink: 0 }} />
                                                    <span style={{ fontSize: ".61rem", color: "var(--text-muted)", flex: 1 }}>{s.label}</span>
                                                    <span style={{ fontSize: ".61rem", color: "var(--text-subtle)", width: 26, textAlign: "right" }}>{pct}%</span>
                                                    <span style={{ fontSize: ".61rem", fontWeight: 700, color: "var(--text-strong)", width: 22, textAlign: "right" }}>{s.val}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ));
                            })()}
                        </div>

                        {/* Sponsorship Status Donut */}
                        <div style={{ background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: "10px 12px" }}>
                            <div style={{ fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--text-muted)", marginBottom: 4 }}>Sponsorship Status</div>
                            <ResponsiveContainer width="100%" height={100}>
                                <PieChart>
                                    <Pie data={statusDonutData} cx="50%" cy="50%" innerRadius={32} outerRadius={50} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                                        <Cell fill="#22c55e" />
                                        <Cell fill="#f59e0b" />
                                    </Pie>
                                    <Tooltip content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null;
                                        return (
                                            <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "6px 10px", fontSize: 11, boxShadow: "var(--shadow-md)" }}>
                                                <div style={{ fontWeight: 700 }}>{payload[0].name}</div>
                                                <div style={{ color: "var(--text-muted)" }}>{Math.round(payload[0].value)} sponsors</div>
                                            </div>
                                        );
                                    }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ display: "flex", justifyContent: "center", gap: 14 }}>
                                {[{ label: "Confirmed", count: confirmedCount, color: "#22c55e" }, { label: "Pending", count: pendingCount, color: "#f59e0b" }].map((d, i) => (
                                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
                                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color }} />
                                        <span style={{ color: "var(--text-muted)" }}>{d.label}</span>
                                        <span style={{ fontWeight: 800, color: "var(--text-strong)" }}>{d.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Amount Summary */}
                        <div style={{ background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: "10px 12px" }}>
                            <div style={{ fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--text-muted)", marginBottom: 8 }}>Amount Summary</div>
                            {[
                                { label: "Sponsorship Amount", value: amount_summary.sponsor_amount || 0, color: "#3b82f6" },
                                { label: "Delegates Amount", value: amount_summary.delegate_amount || 0, color: "#8b5cf6" },
                                { label: "SND Amount", value: amount_summary.snd_amount || 0, color: "#ec4899" },
                            ].map((row, i) => {
                                const pct = amount_summary.grand_total > 0 ? Math.round((row.value / amount_summary.grand_total) * 100) : 0;
                                return (
                                    <div key={i} style={{ marginBottom: 10 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                                            <span style={{ fontSize: ".63rem", color: "var(--text-body)", fontWeight: 600 }}>{row.label}</span>
                                            <span style={{ fontSize: ".63rem", fontWeight: 700, color: row.color, fontVariantNumeric: "tabular-nums" }}>{fmtINR(row.value)}</span>
                                        </div>
                                        <div style={{ height: 5, borderRadius: 99, background: "var(--border-subtle)", overflow: "hidden" }}>
                                            <div style={{ height: "100%", width: `${Math.max(pct, row.value > 0 ? 3 : 0)}%`, background: row.color, borderRadius: 99 }} />
                                        </div>
                                        <div style={{ fontSize: ".56rem", color: "var(--text-subtle)", marginTop: 1 }}>{pct}%</div>
                                    </div>
                                );
                            })}
                            <div style={{ background: "#0f172a", borderRadius: 8, padding: "7px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                                <span style={{ fontSize: ".6rem", fontWeight: 700, color: "rgba(255,255,255,.65)", textTransform: "uppercase", letterSpacing: ".06em" }}>Total Amount</span>
                                <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: ".88rem", color: "white" }}>{fmtINR(amount_summary.grand_total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Row 3: Top 5 Sponsors (full width, horizontal bar chart) ── */}
                    <div style={{ background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 9l2.5-3.5 2 2.5 2.5-4 2.5 3.5" stroke={SEIC_ACC} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            <span style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--text-strong)" }}>Top 5 Sponsors</span>
                            <span style={{ fontSize: ".64rem", color: "var(--text-muted)", marginLeft: 2 }}>by sponsorship amount</span>
                            <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                                {["chart", "list"].map((v) => (
                                    <button key={v} onClick={() => setTop5View(v)} style={{
                                        padding: "3px 10px", borderRadius: 6, fontSize: ".66rem", fontWeight: 600,
                                        cursor: "pointer", border: "1px solid var(--border-default)", fontFamily: "var(--font-sans)",
                                        background: top5View === v ? SEIC_ACC : "transparent",
                                        color: top5View === v ? "white" : "var(--text-muted)",
                                    }}>{v === "chart" ? "Chart" : "List"}</button>
                                ))}
                            </div>
                        </div>

                        {/* Top Sponsor highlight chip */}
                        {top5.length > 0 && (
                            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "6px 12px", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5l1.4 4.1H12l-3.5 2.5 1.3 4.1-3.3-2.4-3.3 2.4 1.3-4.1L1 5.6h4.1z" stroke="#b45309" strokeWidth="1.3" strokeLinejoin="round" /></svg>
                                <span style={{ fontSize: ".62rem", fontWeight: 700, color: "#92400e" }}>Top Sponsor</span>
                                <span style={{ fontSize: ".76rem", fontWeight: 800, color: "#78350f" }}>{top5[0]?.Sponsor_Name}</span>
                                <span style={{ marginLeft: "auto", fontSize: ".72rem", fontWeight: 800, color: "#b45309", fontVariantNumeric: "tabular-nums" }}>{fmtINR(top5[0]?.Sponsorship_Amount)}</span>
                                <CategoryBadge name={top5[0]?.category_name} />
                            </div>
                        )}

                        {top5View === "chart" ? (
                            /* Horizontal bar chart — names readable, no angled text */
                            <ResponsiveContainer width="100%" height={top5.length * 36 + 16}>
                                <BarChart data={[...top5ChartData].reverse()} layout="vertical"
                                    margin={{ top: 4, right: 90, left: 4, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                                    <XAxis type="number" tickFormatter={(v) => fmtINR(v).replace("₹", "₹")}
                                        tick={{ fontSize: 9, fill: "var(--text-subtle)" }}
                                        axisLine={false} tickLine={false} />
                                    <YAxis type="category" dataKey="name" width={200}
                                        tick={{ fontSize: 10, fill: "var(--text-body)", fontWeight: 600 }}
                                        axisLine={false} tickLine={false} />
                                    <Tooltip content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null;
                                        return (
                                            <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: 8, padding: "8px 12px", fontSize: 11, boxShadow: "var(--shadow-md)" }}>
                                                <div style={{ fontWeight: 700, color: "var(--text-strong)", marginBottom: 2 }}>{payload[0].payload.fullName}</div>
                                                <div style={{ color: "var(--text-muted)" }}>Amount: <strong style={{ color: SEIC_ACC }}>{fmtINR(payload[0].value)}</strong></div>
                                            </div>
                                        );
                                    }} />
                                    <Bar dataKey="amount" radius={[0, 5, 5, 0]} maxBarSize={28}
                                        label={{ position: "right", formatter: (v) => fmtINR(v), fontSize: 10, fill: "var(--text-strong)", fontWeight: 700 }}>
                                        {[...top5ChartData].reverse().map((_, i) => <Cell key={i} fill={`hsl(${245 + (4 - i) * 20},68%,${54 + (4 - i) * 6}%)`} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            /* List view */
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {top5.map((s, i) => {
                                    const pct = Math.round((s.Sponsorship_Amount / top5[0].Sponsorship_Amount) * 100);
                                    return (
                                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <span style={{ fontSize: ".72rem", fontWeight: 800, color: "var(--text-subtle)", width: 16, textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                                                    <span style={{ fontSize: ".74rem", fontWeight: 700, color: "var(--text-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, paddingRight: 8 }}>{s.Sponsor_Name}</span>
                                                    <span style={{ fontSize: ".74rem", fontWeight: 800, color: SEIC_ACC, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{fmtINR(s.Sponsorship_Amount)}</span>
                                                </div>
                                                <div style={{ height: 5, borderRadius: 99, background: "var(--border-subtle)" }}>
                                                    <div style={{ height: "100%", width: `${pct}%`, background: `hsl(${245 + i * 20},68%,${54 + i * 6}%)`, borderRadius: 99 }} />
                                                </div>
                                            </div>
                                            <div style={{ flexShrink: 0 }}><CategoryBadge name={s.category_name} /></div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── All Sponsors Table ── */}
                    <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                            <div>
                                <div style={{ fontSize: ".72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".09em", color: "var(--text-muted)" }}>All Sponsors</div>
                                <div style={{ fontSize: ".68rem", color: "var(--text-subtle)", marginTop: 1 }}>{sponsor_details.length} sponsors registered</div>
                            </div>
                            <button
                                onClick={() => {
                                    const rows = sponsor_details.map((s, i) => ({
                                        "#": i + 1,
                                        "Sponsor Name": s.Sponsor_Name,
                                        "Category": s.category_name,
                                        "Contact Person": s.Contact_Person || "",
                                        "Contact Phone": s.Contact_Phone || "",
                                        "Contact Email": s.Contact_Email || "",
                                        "Assigned To": s.User_Name || "",
                                        "Sponsorship Amount": s.Sponsorship_Amount || 0,
                                        "Advance Paid": s.Sponsorship_Amount_Advance || 0,
                                        "Pending Amount": s.Pending_Amount || 0,
                                        "Proposal Sent": s.Proposal_Sent || "",
                                        "Approval Received": s.Approval_Received || "",
                                    }));
                                    const ws = XLSX.utils.json_to_sheet(rows);
                                    // Column widths
                                    ws["!cols"] = [
                                        { wch: 4 }, { wch: 36 }, { wch: 12 }, { wch: 28 },
                                        { wch: 14 }, { wch: 26 }, { wch: 16 },
                                        { wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 18 },
                                    ];
                                    const wb = XLSX.utils.book_new();
                                    XLSX.utils.book_append_sheet(wb, ws, "Sponsors");
                                    const fileName = `${selectedEvent?.EventMaster_Name || "SEIC"}_Sponsors.xlsx`;
                                    XLSX.writeFile(wb, fileName);
                                }}
                                style={{
                                    display: "inline-flex", alignItems: "center", gap: 6,
                                    padding: "6px 14px", borderRadius: 8, cursor: "pointer",
                                    background: "#16a34a", color: "white", border: "none",
                                    fontSize: ".72rem", fontWeight: 700, fontFamily: "var(--font-sans)",
                                    boxShadow: "0 1px 4px rgba(22,163,74,.3)",
                                }}>
                                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                                    <path d="M6.5 1v7.5M3.5 6l3 3 3-3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M1.5 10v1a1 1 0 001 1h8a1 1 0 001-1v-1" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                                </svg>
                                Export to Excel
                            </button>
                        </div>
                        <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid var(--border-subtle)" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".72rem", fontFamily: "var(--font-sans)" }}>
                                <thead>
                                    <tr style={{ background: "var(--surface-sunken)", borderBottom: "2px solid var(--border-subtle)" }}>
                                        <th style={{ textAlign: "left", padding: "7px 10px", fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-muted)", whiteSpace: "nowrap" }}>#</th>
                                        <th style={{ textAlign: "left", padding: "7px 10px", fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-muted)", whiteSpace: "nowrap" }}>Sponsor Name</th>
                                        <th style={{ textAlign: "left", padding: "7px 10px", fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-muted)", whiteSpace: "nowrap" }}>Category</th>
                                        <th style={{ textAlign: "left", padding: "7px 10px", fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-muted)", whiteSpace: "nowrap" }}>Contact Person</th>
                                        <th style={{ textAlign: "right", padding: "7px 10px", fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-muted)", whiteSpace: "nowrap" }}>Amount</th>
                                        <th style={{ textAlign: "right", padding: "7px 10px", fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-muted)", whiteSpace: "nowrap" }}>Advance</th>
                                        <th style={{ textAlign: "right", padding: "7px 10px", fontSize: ".6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-muted)", whiteSpace: "nowrap" }}>Pending</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sponsor_details.map((s, i) => (
                                        <tr key={i} style={{ borderBottom: "1px solid var(--border-subtle)", background: i % 2 === 0 ? "transparent" : "var(--surface-sunken)" }}>
                                            <td style={{ padding: "6px 10px", color: "var(--text-subtle)", fontWeight: 700, textAlign: "left" }}>{i + 1}</td>
                                            <td style={{ padding: "6px 10px", fontWeight: 700, color: "var(--text-strong)", textAlign: "left", minWidth: 200 }}>{s.Sponsor_Name}</td>
                                            <td style={{ padding: "6px 10px", textAlign: "left" }}><CategoryBadge name={s.category_name} /></td>
                                            <td style={{ padding: "6px 10px", color: "var(--text-body)", textAlign: "left", minWidth: 140, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.Contact_Person || "—"}</td>
                                            <td style={{ padding: "6px 10px", fontWeight: 700, color: "var(--text-strong)", textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{s.Sponsorship_Amount > 0 ? fmtINR(s.Sponsorship_Amount) : "—"}</td>
                                            <td style={{ padding: "6px 10px", color: CM_ACC, fontWeight: 600, textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{s.Sponsorship_Amount_Advance > 0 ? fmtINR(s.Sponsorship_Amount_Advance) : "—"}</td>
                                            <td style={{ padding: "6px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", color: s.Pending_Amount > 0 ? "#dc2626" : "var(--text-subtle)", fontWeight: s.Pending_Amount > 0 ? 700 : 400 }}>{s.Pending_Amount > 0 ? fmtINR(s.Pending_Amount) : "Nil"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr style={{ background: "linear-gradient(90deg,var(--surface-sunken),var(--ivory-100))", borderTop: "2px solid var(--border-subtle)" }}>
                                        <td colSpan={4} style={{ padding: "8px 10px", fontWeight: 700, fontSize: ".68rem", color: "var(--text-muted)", textAlign: "left" }}>
                                            Total · {sponsor_details.length} sponsors
                                        </td>
                                        <td style={{ padding: "8px 10px", fontWeight: 800, color: "var(--text-strong)", textAlign: "right", fontFamily: "var(--font-display)", fontVariantNumeric: "tabular-nums" }}>{fmtINR(amount_summary.sponsor_amount || 0)}</td>
                                        <td style={{ padding: "8px 10px", fontWeight: 700, color: CM_ACC, textAlign: "right", fontFamily: "var(--font-display)", fontVariantNumeric: "tabular-nums" }}>{fmtINR(sponsor_details.reduce((s, r) => s + (r.Sponsorship_Amount_Advance || 0), 0))}</td>
                                        <td style={{ padding: "8px 10px", fontWeight: 700, color: "#dc2626", textAlign: "right", fontFamily: "var(--font-display)", fontVariantNumeric: "tabular-nums" }}>{fmtINR(sponsor_details.reduce((s, r) => s + (r.Pending_Amount || 0), 0))}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </Card>
            )}
        </section>
    );
}

// ─── eTrack Info (JK HRMS) Section ─────────────────────────────────────────────

const ETRACK_ACC = "#4338ca";
const ETRACK_COMPANIES = [
    { id: 9, name: "JK India eAgriTech Ltd" },
    { id: 11, name: "JK Wealth Pvt Ltd" },
    { id: 13, name: "XYZ Company" },
    { id: 14, name: "Agrahyah Technologies Pvt Ltd" },
    { id: 15, name: "JK Villa" },
    { id: 16, name: "RNS Facilities Services" },
    { id: 17, name: "LATA DIXIT TECH PVT LTD" },
];

function ETrackSection() {
    const [companyId, setCompanyId] = useState(16);
    const [filterDate, setFilterDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [employeeSearch, setEmployeeSearch] = useState("");

    useEffect(() => {
        setLoading(true);
        setError(null);
        axios.get(`${API}/etrack-dashboard`, { params: { companyId, filterDate } })
            .then((r) => setData(r.data))
            .catch((e) => setError(e?.response?.data?.error || e.message))
            .finally(() => setLoading(false));
    }, [companyId, filterDate]);

    const counts = data?.counts || {};
    const totalEmployees = data?.totalEmployees || [];
    const presentEmployees = data?.presentEmployees || [];
    const absentEmployees = data?.absentEmployees || [];

    const filteredTotalEmployees = employeeSearch.trim()
        ? totalEmployees.filter((e) => {
            const s = employeeSearch.trim().toLowerCase();
            return [e.EmpName, e.EmployeeNo, e.Department, e.Designation]
                .some((v) => String(v || "").toLowerCase().includes(s));
        })
        : totalEmployees;

    const presenceDonutData = [
        { name: "Present", value: counts.PresentCount || 0.001 },
        { name: "Absent", value: counts.AbsentCount || 0.001 },
    ];

    const departmentChartData = (() => {
        const byDept = {};
        totalEmployees.forEach((e) => {
            const dept = e.Department || "Other";
            byDept[dept] = byDept[dept] || { department: dept, total: 0, present: 0 };
            byDept[dept].total += 1;
        });
        presentEmployees.forEach((e) => {
            const dept = e.Department || "Other";
            if (byDept[dept]) byDept[dept].present += 1;
        });
        return Object.values(byDept)
            .map((d) => ({ ...d, absent: Math.max(d.total - d.present, 0) }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 8);
    })();

    const selectedCompanyName = ETRACK_COMPANIES.find((c) => c.id === companyId)?.name || "";
    const filterDateLabel = new Date(`${filterDate}T00:00:00`).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
    });
    const isToday = filterDate === new Date().toISOString().slice(0, 10);

    return (
        <section id="etrack-info" style={{ scrollMarginTop: 88, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
                <SectionHead
                    title="eTrack Info"
                    subtitle={`Employee attendance · ${selectedCompanyName} · ${filterDateLabel}`}
                    logoEl={
                        <div style={{
                            width: 52, height: 52, borderRadius: 10, flexShrink: 0,
                            background: `linear-gradient(135deg, ${ETRACK_ACC}, #312e81)`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m5-4a4 4 0 100-8 4 4 0 000 8zm6 0a4 4 0 100-8 4 4 0 000 8z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20v-2a4 4 0 014-4h0a4 4 0 014 4v2" />
                            </svg>
                        </div>
                    }
                />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => e.target.value && setFilterDate(e.target.value)}
                        style={{
                            padding: "7px 12px", borderRadius: 8,
                            border: `1px solid ${ETRACK_ACC}55`, fontSize: ".8rem",
                            fontFamily: "var(--font-sans)", fontWeight: 600,
                            color: "var(--text-body)", background: "var(--surface-card)",
                            cursor: "pointer", outline: "none",
                        }}
                    />
                    <select
                        value={companyId}
                        onChange={(e) => setCompanyId(Number(e.target.value))}
                        style={{
                            padding: "7px 12px", borderRadius: 8,
                            border: `1px solid ${ETRACK_ACC}55`, fontSize: ".8rem",
                            fontFamily: "var(--font-sans)", fontWeight: 600,
                            color: "var(--text-body)", background: "var(--surface-card)",
                            cursor: "pointer", outline: "none",
                        }}
                    >
                        {ETRACK_COMPANIES.map((c) => (
                            <option key={c.id} value={c.id}>{c.id} — {c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {error && <ErrorCard message={error} />}

            {!error && loading && <SectionSkeleton accent={ETRACK_ACC} />}

            {!error && !loading && (
                <Card accent={ETRACK_ACC}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
                        <KPICard label="Total Employees" value={fmt(counts.TotalEmployees)} accent={ETRACK_ACC} />
                        <KPICard label={isToday ? "Present Today" : "Present"} value={fmt(counts.PresentCount)} accent="#16a34a" />
                        <KPICard label={isToday ? "Absent Today" : "Absent"} value={fmt(counts.AbsentCount)} accent="#dc2626" />
                        <KPICard label="On Leave" value={fmt(counts.LeaveCount)} accent="#d97706" />
                        <KPICard label="Marked via Mobile" value={fmt(counts.MobileCount)} accent="#0b6e6e" />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        {/* Present employees — left */}
                        <div style={{
                            background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)",
                            borderRadius: 10, padding: 12,
                        }}>
                            <ChartHeader title="Present Employees" sub={`${presentEmployees.length} employee${presentEmployees.length !== 1 ? "s" : ""} · ${filterDateLabel}`} />
                            {presentEmployees.length === 0 ? (
                                <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px 0", fontSize: 13 }}>
                                    No one marked present
                                </div>
                            ) : (
                                <div style={{ overflowX: "auto", maxHeight: 420, overflowY: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                                        <thead style={{ position: "sticky", top: 0, background: "var(--surface-sunken)" }}>
                                            <tr style={{ borderBottom: "2px solid var(--border-subtle)" }}>
                                                <th style={{ padding: "6px 10px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Employee</th>
                                                <th style={{ padding: "6px 10px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Emp ID</th>
                                                <th style={{ padding: "6px 10px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Department</th>
                                                <th style={{ padding: "6px 10px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Designation</th>
                                                <th style={{ padding: "6px 10px", textAlign: "right", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Punch Time</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {presentEmployees.map((e, i) => (
                                                <tr key={i} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                                                    <td style={{ padding: "7px 10px", color: "var(--text-body)", textAlign: "left" }}>{e.EmpName}</td>
                                                    <td style={{ padding: "7px 10px", color: "var(--text-subtle)", textAlign: "left" }}>{e.EmployeeNo}</td>
                                                    <td style={{ padding: "7px 10px", color: "var(--text-subtle)", textAlign: "left" }}>{e.Department}</td>
                                                    <td style={{ padding: "7px 10px", color: "var(--text-subtle)", textAlign: "left" }}>{e.Designation}</td>
                                                    <td style={{ padding: "7px 10px", color: "#16a34a", fontWeight: 700, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{e.Time}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Absent employees — right */}
                        <div style={{
                            background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)",
                            borderRadius: 10, padding: 12,
                        }}>
                            <ChartHeader title="Absent Employees" sub={`${absentEmployees.length} employee${absentEmployees.length !== 1 ? "s" : ""} · ${filterDateLabel}`} />
                            {absentEmployees.length === 0 ? (
                                <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px 0", fontSize: 13 }}>
                                    Nobody is absent
                                </div>
                            ) : (
                                <div style={{ overflowX: "auto", maxHeight: 420, overflowY: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                                        <thead style={{ position: "sticky", top: 0, background: "var(--surface-sunken)" }}>
                                            <tr style={{ borderBottom: "2px solid var(--border-subtle)" }}>
                                                <th style={{ padding: "6px 10px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Employee</th>
                                                <th style={{ padding: "6px 10px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Emp ID</th>
                                                <th style={{ padding: "6px 10px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Department</th>
                                                <th style={{ padding: "6px 10px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Designation</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {absentEmployees.map((e, i) => (
                                                <tr key={i} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                                                    <td style={{ padding: "7px 10px", color: "var(--text-body)", textAlign: "left" }}>{e.EmpName}</td>
                                                    <td style={{ padding: "7px 10px", color: "var(--text-subtle)", textAlign: "left" }}>{e.EmployeeNo}</td>
                                                    <td style={{ padding: "7px 10px", color: "var(--text-subtle)", textAlign: "left" }}>{e.Department}</td>
                                                    <td style={{ padding: "7px 10px", color: "var(--text-subtle)", textAlign: "left" }}>{e.Designation}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Device Breakdown | Department-wise Attendance | All Employees — one row */}
                    <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1fr 1.3fr", gap: 10, alignItems: "start" }}>
                        <div style={{
                            background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)",
                            borderRadius: 10, padding: 12,
                        }}>
                            <DeviceDonut data={presenceDonutData.map((d) => ({ deviceCategory: d.name, activeUsers: d.value }))} />
                        </div>

                        <div style={{
                            background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)",
                            borderRadius: 10, padding: 12,
                        }}>
                            <ChartHeader title="Department-wise Attendance" sub={`Present vs Absent · ${filterDateLabel}`} />
                            {departmentChartData.length === 0 ? (
                                <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 0", fontSize: 13 }}>
                                    No department data
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={departmentChartData} margin={{ top: 4, right: 8, left: 0, bottom: 32 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                                        <XAxis dataKey="department" tickFormatter={(v) => shortLabel(v, 10)}
                                            tick={{ fontSize: 10, fill: "var(--text-subtle)" }}
                                            angle={-25} textAnchor="end" height={40}
                                            axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10, fill: "var(--text-subtle)" }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                                        <Tooltip content={<ChartTooltip />} />
                                        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
                                        <Bar dataKey="present" name="Present" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={22} />
                                        <Bar dataKey="absent" name="Absent" fill="#dc2626" radius={[4, 4, 0, 0]} maxBarSize={22} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* All employees — full company list */}
                        <div style={{
                            background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)",
                            borderRadius: 10, padding: 12,
                        }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
                            <ChartHeader title="All Employees" sub={`${filteredTotalEmployees.length} of ${totalEmployees.length} employee${totalEmployees.length !== 1 ? "s" : ""} · ${selectedCompanyName}`} />
                            <input
                                type="text"
                                value={employeeSearch}
                                onChange={(e) => setEmployeeSearch(e.target.value)}
                                placeholder="Search name, emp id, department…"
                                style={{
                                    padding: "6px 12px", borderRadius: 8,
                                    border: "1px solid var(--border-subtle)", fontSize: ".78rem",
                                    fontFamily: "var(--font-sans)", color: "var(--text-body)",
                                    background: "var(--surface-card)", outline: "none", minWidth: 220,
                                }}
                            />
                        </div>
                        {totalEmployees.length === 0 ? (
                            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px 0", fontSize: 13 }}>
                                No employees found
                            </div>
                        ) : (
                            <div style={{ overflowX: "auto", maxHeight: 480, overflowY: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                                    <thead style={{ position: "sticky", top: 0, background: "var(--surface-sunken)" }}>
                                        <tr style={{ borderBottom: "2px solid var(--border-subtle)" }}>
                                            <th style={{ padding: "6px 10px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Employee</th>
                                            <th style={{ padding: "6px 10px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Emp ID</th>
                                            <th style={{ padding: "6px 10px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Company</th>
                                            <th style={{ padding: "6px 10px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Department</th>
                                            <th style={{ padding: "6px 10px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Designation</th>
                                            {/* <th style={{ padding: "6px 10px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Work Location</th> */}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTotalEmployees.map((e, i) => (
                                            <tr key={e.EmployeeId ?? i} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                                                <td style={{ padding: "7px 10px", color: "var(--text-body)", textAlign: "left" }}>{e.EmpName}</td>
                                                <td style={{ padding: "7px 10px", color: "var(--text-subtle)", textAlign: "left" }}>{e.EmployeeNo}</td>
                                                <td style={{ padding: "7px 10px", color: "var(--text-subtle)", textAlign: "left" }}>{e.CompanyName}</td>
                                                <td style={{ padding: "7px 10px", color: "var(--text-subtle)", textAlign: "left" }}>{e.Department}</td>
                                                <td style={{ padding: "7px 10px", color: "var(--text-subtle)", textAlign: "left" }}>{e.Designation}</td>
                                                {/* <td style={{ padding: "7px 10px", color: "var(--text-subtle)", textAlign: "left" }}>{e.WorkLocation}</td> */}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        </div>
                    </div>
                </Card>
            )}
        </section>
    );
}

// ─── Country Horizontal Bar ───────────────────────────────────────────────────

const CountryChart = ({ data = [], accent }) => (
    <div>
        <ChartHeader title="Top Countries" sub="Active users by country" />
        {data.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 0", fontSize: 13 }}>
                No country data
            </div>
        ) : (
            <ResponsiveContainer width="100%" height={Math.max(data.length * 24 + 14, 125)}>
                <BarChart data={data} layout="vertical" margin={{ top: 4, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => fmt(v)}
                        tick={{ fontSize: 10, fill: "var(--text-subtle)" }}
                        axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="country"
                        tick={{ fontSize: 10, fill: "var(--text-subtle)" }}
                        width={90} axisLine={false} tickLine={false}
                        tickFormatter={(v) => shortLabel(v, 14)} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="activeUsers" name="Active Users" fill={accent}
                        radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
            </ResponsiveContainer>
        )}
    </div>
);

// ─── Top Pages Table ──────────────────────────────────────────────────────────

const PagesTable = ({ data = [], accent }) => (
    <div>
        <ChartHeader title="Top Pages" sub="Most viewed pages in the period" />
        {data.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px 0", fontSize: 13 }}>
                No page data
            </div>
        ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                {data.map((row, i) => {
                    const maxViews = data[0]?.screenPageViews || 1;
                    const pct = ((row.screenPageViews / maxViews) * 100).toFixed(0);
                    return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{
                                fontSize: 11, fontWeight: 700, color: "var(--text-subtle)",
                                width: 18, textAlign: "right", flexShrink: 0
                            }}>{i + 1}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontSize: 11, color: "var(--text-body)", whiteSpace: "nowrap",
                                    overflow: "hidden", textOverflow: "ellipsis", marginBottom: 3,
                                    textAlign: "left"
                                }}>
                                    {row.pageTitle || "—"}
                                </div>
                                <div style={{ height: 4, borderRadius: 99, background: "var(--border-subtle)", overflow: "hidden" }}>
                                    <div style={{
                                        height: "100%", width: `${pct}%`, background: accent,
                                        borderRadius: 99, transition: "width .4s ease"
                                    }} />
                                </div>
                            </div>
                            <span style={{
                                fontSize: 11, fontWeight: 700, color: "var(--text-strong)",
                                width: 44, textAlign: "right", flexShrink: 0, fontVariantNumeric: "tabular-nums"
                            }}>
                                {fmt(row.screenPageViews)}
                            </span>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
);

// ─── Error Banner ─────────────────────────────────────────────────────────────

const ErrorCard = ({ message }) => (
    <div style={{
        background: "#fff8f0", border: "1px solid #f5c46a", borderRadius: 12,
        padding: "14px 18px", display: "flex", alignItems: "center", gap: 10,
        fontSize: 13, color: "#7a4a00",
    }}>
        <span style={{ fontSize: 18 }}>⚠</span>
        <span><strong>Error:</strong> {message || "Could not load analytics data. Check service account permissions."}</span>
    </div>
);

// ─── Loading skeleton for a section ──────────────────────────────────────────

const SectionSkeleton = ({ accent }) => (
    <Card accent={accent}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8 }}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} style={{ background: "var(--surface-sunken)", borderRadius: 10, padding: "10px 12px" }}>
                    <Skeleton h={9} w="60%" mb={6} />
                    <Skeleton h={22} w="80%" />
                </div>
            ))}
        </div>
        <Skeleton h={165} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <Skeleton h={150} />
            <Skeleton h={150} />
            <Skeleton h={150} />
        </div>
        <Skeleton h={28} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <Skeleton h={150} />
            <Skeleton h={150} />
            <Skeleton h={150} />
        </div>
    </Card>
);

// ─── Full Site Analytics Section ──────────────────────────────────────────────

const AI_RANGES = [
    { key: "today", label: "Today" },
    { key: "yesterday", label: "Yesterday" },
    { key: "week", label: "Week" },
    { key: "year", label: "Year" },
    { key: "custom", label: "Custom" },
];
const AI_CAT_COLORS = ["#013720", "#c9a24b", "#0b6e6e", "#b45309", "#7c3aed", "#0ea5e9", "#dc2626", "#16a34a"];

// ─── ChiniMandi News Feed (English/Hindi) ────────────────────────────────────

const CM_NEWS_CATEGORIES = { en: 3, hi: 8 };
const BE_NEWS_CATEGORIES = { en: 30 };

const decodeHtml = (html) => {
    if (!html) return "";
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
};

const fmtNewsDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
};

function NewsFeed({ accent, baseUrl, categoriesByLang, defaultLang = "en", showLangToggle = true }) {
    const [lang, setLang] = useState(defaultLang);
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        const baseParams = {
            categories: categoriesByLang[lang],
            per_page: 50, // only show the first 50 articles
            page: 1,
            _embed: "wp:featuredmedia",
            _fields: "id,link,date,title,_links,_embedded",
        };

        axios.get(`${baseUrl}/wp-json/wp/v2/posts`, { params: baseParams })
            .then((res) => {
                if (!cancelled) setArticles(Array.isArray(res.data) ? res.data : []);
            })
            .catch((e) => {
                if (!cancelled) setError(e?.response?.data?.message || e.message);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [lang]);

    return (
        <div style={{
            background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)",
            borderRadius: 10, padding: 12,
        }}>
            <style>{`
                .news-title {
                    color: var(--text-strong);
                }
                .news-card:hover .news-title {
                    color: #2563eb;
                    text-decoration: underline;
                }
            `}</style>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                <ChartHeader title="Latest News" sub={`${articles.length} articles`} />
                {showLangToggle && (
                    <select
                        value={lang}
                        onChange={(e) => setLang(e.target.value)}
                        style={{
                            padding: "5px 10px", borderRadius: 8,
                            border: `1px solid ${accent}55`, fontSize: ".78rem",
                            fontFamily: "var(--font-sans)", fontWeight: 600,
                            color: "var(--text-body)", background: "var(--surface-card)",
                            cursor: "pointer", outline: "none",
                        }}
                    >
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                    </select>
                )}
            </div>

            {error ? (
                <div style={{
                    background: "#fff8f0", border: "1px solid #f5c46a", borderRadius: 10,
                    padding: "10px 14px", fontSize: 12, color: "#7a4a00",
                }}>
                    ⚠ News feed error: {error}
                </div>
            ) : loading ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                    {[1, 2, 3, 4].map((n) => (
                        <div key={n} style={{ display: "flex", gap: 8 }}>
                            <Skeleton h={52} w={52} />
                            <div style={{ flex: 1 }}>
                                <Skeleton h={10} w="90%" mb={4} />
                                <Skeleton h={10} w="70%" mb={4} />
                                <Skeleton h={8} w="50%" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : articles.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px 0", fontSize: 13 }}>
                    No articles found
                </div>
            ) : (
                <div style={{ maxHeight: 480, overflowY: "auto", paddingRight: 4, paddingTop: 2 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                        {articles.map((a) => {
                            const img = a._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
                            return (
                                <a
                                    key={a.id}
                                    href={a.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="news-card"
                                    style={{
                                        display: "flex", flexDirection: "row", alignItems: "flex-start", gap: 8,
                                        color: "var(--text-body)", textDecoration: "none",
                                        background: "var(--surface-card)",
                                        border: "1px solid var(--border-subtle)",
                                        borderRadius: 8, overflow: "hidden",
                                        padding: 6,
                                    }}
                                >
                                    <div style={{
                                        width: 52, height: 52, flexShrink: 0,
                                        background: "var(--ink-100)", borderRadius: 6,
                                        overflow: "hidden",
                                    }}>
                                        {img && (
                                            <img src={img} alt=""
                                                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} />
                                        )}
                                    </div>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <div className="news-title" style={{
                                            fontSize: ".68rem", fontWeight: 600,
                                            lineHeight: 1.6, textAlign: "left", paddingTop: 2,
                                            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                        }}>
                                            {decodeHtml(a.title?.rendered)}
                                        </div>
                                        <div style={{ fontSize: ".58rem", color: "var(--text-subtle)", marginTop: 3 }}>
                                            {fmtNewsDate(a.date)}
                                        </div>
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function SiteSection({ id, title, subtitle, logoEl, accent, siteData, loading, newsroomLabel,
    range, onApply, url, newsFeedConfig }) {
    if (loading) {
        return (
            <section id={id} style={{ scrollMarginTop: 88, marginBottom: 20 }}>
                <SectionHead title={title} subtitle={subtitle} logoEl={logoEl} url={url} />
                <SectionFilter ranges={GA4_RANGES} range={range} accent={accent} loading={loading} onApply={onApply} />
                <SectionSkeleton accent={accent} />
            </section>
        );
    }

    if (!siteData) return null;

    const { kpi = {}, trend = [], devices = [], countries = [], channels = [], pages = [], newsroom = {}, error } = siteData;

    const { total_published_posts = 0, languages = {}, newsTypes = {}, error: nrError } = newsroom || {};

    const langData = Object.entries(languages)
        .map(([name, val]) => ({ name, total: typeof val === "object" ? (val.total || 0) : val }))
        .filter((d) => d.total > 0).sort((a, b) => b.total - a.total);

    const typeData = Object.entries(newsTypes)
        .map(([name, count]) => ({ name, count: Number(count) || 0 }))
        .filter((d) => d.count > 0).sort((a, b) => b.count - a.count);

    const panelStyle = {
        background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)",
        borderRadius: 10, padding: 12,
    };

    return (
        <section id={id} style={{ scrollMarginTop: 88, marginBottom: 20 }}>
            <SectionHead title={title} subtitle={subtitle} logoEl={logoEl} url={url} />
            <SectionFilter ranges={GA4_RANGES} range={range} accent={accent} loading={loading} onApply={onApply} />

            {error && <ErrorCard message={error} />}

            {!error && (
                <Card accent={accent}>
                    {/* ── KPI Grid (3 cols) ── */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                        <KPICard label="Active Users" value={fmt(kpi.activeUsers)} accent={accent} />
                        <KPICard label="Page Views" value={fmt(kpi.screenPageViews)} accent={accent} />
                        <KPICard label="New Users" value={fmt(kpi.newUsers)} accent={accent} />
                    </div>

                    {/* ── 30-day trend ── */}
                    <TrendChart data={trend} accent={accent} />

                    {/* ── Newsroom compact summary bar ── */}
                    {newsroom && !nrError && total_published_posts > 0 && (
                        <div style={{
                            display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
                            background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)",
                            borderLeft: `3px solid ${accent}`, borderRadius: 10, padding: "7px 14px",
                        }}>
                            <svg width="12" height="12" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
                                <rect x="0.5" y="0.5" width="4.5" height="4.5" rx="1.2" fill={accent} opacity="0.85" />
                                <rect x="8" y="0.5" width="4.5" height="4.5" rx="1.2" fill={accent} opacity="0.5" />
                                <rect x="0.5" y="8" width="4.5" height="4.5" rx="1.2" fill={accent} opacity="0.5" />
                                <rect x="8" y="8" width="4.5" height="4.5" rx="1.2" fill={accent} opacity="0.25" />
                            </svg>
                            <span style={{
                                fontSize: ".64rem", fontWeight: 700, textTransform: "uppercase",
                                letterSpacing: ".1em", color: "var(--text-muted)"
                            }}>Newsroom</span>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                                <span style={{
                                    fontFamily: "var(--font-display)", fontWeight: 800,
                                    fontSize: "1.1rem", color: accent, fontVariantNumeric: "tabular-nums"
                                }}>
                                    {fmt(total_published_posts)}
                                </span>
                                <span style={{ fontSize: ".62rem", color: "var(--text-subtle)" }}>posts published</span>
                            </div>
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                {typeData.slice(0, 5).map((t, i) => (
                                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                        <span style={{
                                            fontFamily: "var(--font-display)", fontWeight: 700,
                                            fontSize: ".92rem", color: PIE_COLS[i % PIE_COLS.length]
                                        }}>{t.count}</span>
                                        <span style={{ fontSize: ".62rem", color: "var(--text-muted)" }}>{t.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {newsroom && nrError && (
                        <div style={{
                            background: "#fff8f0", border: "1px solid #f5c46a", borderRadius: 10,
                            padding: "8px 14px", fontSize: 12, color: "#7a4a00"
                        }}>
                            ⚠ Newsroom API error: {nrError}
                        </div>
                    )}

                    {/* ── Row 1: Language Breakdown | [Content Strategy if available] | Top Pages ── */}
                    <div style={{ display: "grid", gridTemplateColumns: typeData.length > 0 ? "1fr 1fr 1fr" : "1fr 1fr", gap: 10 }}>
                        <div style={panelStyle}>
                            <BreakdownBarChart
                                data={langData} accent={accent}
                                title={newsroomLabel || "Language Breakdown"}
                                subtitle="Articles per category"
                            />
                        </div>
                        {typeData.length > 0 && (
                            <div style={panelStyle}><ContentStrategyChart data={typeData} /></div>
                        )}
                        <div style={panelStyle}><PagesTable data={pages} accent={accent} /></div>
                    </div>

                    {/* ── Row 2 of 3: Device | Channel | Country ── */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                        <div style={panelStyle}><DeviceDonut data={devices} /></div>
                        <div style={panelStyle}><ChannelChart data={channels} accent={accent} /></div>
                        <div style={panelStyle}><CountryChart data={countries} accent={accent} /></div>
                    </div>

                    {/* ── News Feed ── */}
                    {newsFeedConfig && <NewsFeed accent={accent} {...newsFeedConfig} />}
                </Card>
            )}
        </section>
    );
}

// ─── AgriInsights: now rendered as SiteSection in the main component ──────────
// eslint-disable-next-line no-unused-vars
function _AgriInsightsSection({ ga4Data, ga4Loading, ga4Error, ga4Range, onGA4Apply }) {
    const [aiRange, setAiRange] = useState("today");
    const todayStr = new Date().toISOString().slice(0, 10);
    const [aiStart, setAiStart] = useState(todayStr);
    const [aiEnd, setAiEnd] = useState(todayStr);
    const [aiData, setAiData] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState(null);

    const doFetchAI = useCallback((r, s, e) => {
        setAiLoading(true);
        setAiError(null);
        const endpoint = r === "custom"
            ? `https://agriinsite.com/wp-json/newsroom-insights/v1/stats?range=custom&start=${s}&end=${e}`
            : `https://agriinsite.com/wp-json/newsroom-insights/v1/stats?range=${r}`;
        axios.get(endpoint)
            .then((res) => setAiData(res.data))
            .catch((err) => setAiError(err?.response?.data?.message || err.message))
            .finally(() => setAiLoading(false));
    }, []);

    useEffect(() => { doFetchAI("today", "", ""); }, [doFetchAI]);

    const catData = Object.entries((aiData || {}).languages || {})
        .map(([name, count]) => ({ name, count: Number(count) || 0 }))
        .filter((d) => d.count > 0)
        .sort((a, b) => b.count - a.count);
    const total = (aiData || {}).total || 0;
    const traffic = (aiData || {}).traffic || {};

    const AI_GREEN = "#16a34a";
    const panelStyle = {
        background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)",
        borderRadius: 10, padding: 12,
    };

    const { kpi = {}, trend = [], devices = [], countries = [], channels = [], pages = [], error: ga4Err } = ga4Data || {};

    return (
        <section id="agriinsights" style={{ scrollMarginTop: 88, marginBottom: 20 }}>
            <SectionHead
                title="AgriInsite"
                subtitle="Article publishing analytics · agriinsite.com"
                url="https://agriinsite.com"
                logoEl={
                    <img src={agriInsiteLogoImg} alt="AgriInsights"
                        style={{ height: 44, width: "auto", maxWidth: 200, borderRadius: 8, objectFit: "contain", flexShrink: 0, display: "block" }} />
                }
            />

            {/* ── GA4 Analytics Panel ── */}
            <SectionFilter
                ranges={GA4_RANGES} range={ga4Range} accent={AI_GREEN}
                loading={ga4Loading} onApply={onGA4Apply}
                badgeLabel="Live · Google Analytics" badgeColor={AI_GREEN}
            />

            {ga4Loading && <SectionSkeleton accent={AI_GREEN} />}

            {!ga4Loading && ga4Err && <ErrorCard message={ga4Err} />}

            {!ga4Loading && ga4Data && !ga4Err && (
                <Card accent={AI_GREEN} style={{ marginBottom: 12 }}>
                    {/* KPI Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                        <KPICard label="Active Users" value={fmt(kpi.activeUsers)} accent={AI_GREEN} />
                        <KPICard label="Page Views" value={fmt(kpi.screenPageViews)} accent={AI_GREEN} />
                        <KPICard label="New Users" value={fmt(kpi.newUsers)} accent={AI_GREEN} />
                    </div>

                    {/* 30-day trend */}
                    <TrendChart data={trend} accent={AI_GREEN} />

                    {/* Row: Device | Channel | Country */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                        <div style={panelStyle}><DeviceDonut data={devices} /></div>
                        <div style={panelStyle}><ChannelChart data={channels} accent={AI_GREEN} /></div>
                        <div style={panelStyle}><CountryChart data={countries} accent={AI_GREEN} /></div>
                    </div>

                    {/* Top Pages */}
                    {pages.length > 0 && (
                        <div style={panelStyle}><PagesTable data={pages} accent={AI_GREEN} /></div>
                    )}
                </Card>
            )}

            {/* ── WordPress Article Stats Panel ── */}
            <Card accent={AI_GREEN}>
                {/* Filter row */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--text-muted)", marginRight: 2 }}>Article Range:</span>

                    {AI_RANGES.map((r) => (
                        <button key={r.key}
                            onClick={() => { setAiRange(r.key); if (r.key !== "custom") doFetchAI(r.key, "", ""); }}
                            style={{
                                padding: "5px 13px", borderRadius: 99, fontSize: ".72rem", fontWeight: 700,
                                border: aiRange === r.key ? "none" : "1px solid var(--border-default)",
                                background: aiRange === r.key ? AI_GREEN : "transparent",
                                color: aiRange === r.key ? "#fff" : "var(--text-muted)",
                                cursor: "pointer", transition: "all .13s", fontFamily: "var(--font-sans)",
                            }}>
                            {r.label}
                        </button>
                    ))}

                    {aiRange === "custom" && (
                        <>
                            <input type="date" value={aiStart} onChange={(e) => setAiStart(e.target.value)}
                                style={{ padding: "4px 8px", borderRadius: 7, border: "1px solid var(--border-default)", fontSize: ".72rem", fontFamily: "var(--font-sans)", color: "var(--text-body)", background: "var(--surface-card)" }} />
                            <span style={{ fontSize: ".7rem", color: "var(--text-muted)" }}>→</span>
                            <input type="date" value={aiEnd} onChange={(e) => setAiEnd(e.target.value)}
                                style={{ padding: "4px 8px", borderRadius: 7, border: "1px solid var(--border-default)", fontSize: ".72rem", fontFamily: "var(--font-sans)", color: "var(--text-body)", background: "var(--surface-card)" }} />
                            <button onClick={() => doFetchAI("custom", aiStart, aiEnd)}
                                disabled={!aiStart || !aiEnd}
                                style={{ padding: "4px 13px", borderRadius: 99, fontSize: ".72rem", fontWeight: 700, border: "none", background: AI_GREEN, color: "#fff", cursor: "pointer", fontFamily: "var(--font-sans)", opacity: (!aiStart || !aiEnd) ? .5 : 1 }}>
                                Apply
                            </button>
                        </>
                    )}

                    {aiLoading && (
                        <svg style={{ animation: "ga-spin .8s linear infinite" }} width="15" height="15" viewBox="0 0 15 15" fill="none">
                            <path d="M7.5 2 A5.5 5.5 0 0 1 13 7.5" stroke={AI_GREEN} strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    )}
                </div>

                {aiError && (
                    <div style={{ background: "#fff8f0", border: "1px solid #f5c46a", borderRadius: 8, padding: "8px 14px", fontSize: ".72rem", color: "#7a4a00" }}>
                        ⚠ {aiError}
                    </div>
                )}

                {aiData && !aiError && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {/* KPI row — each stat in its own card */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                            <KPICard label="Total Articles" value={String(total)} accent={AI_GREEN} sub="Published in selected period" />
                            <KPICard label="Page Views" value={traffic.views > 0 ? fmt(traffic.views) : "—"} accent={AI_GREEN} sub="Article views" />
                            <KPICard label="Visitors" value={traffic.users > 0 ? fmt(traffic.users) : "—"} accent={AI_GREEN} sub="Unique visitors" />
                        </div>

                        {/* Category breakdown chart — next row */}
                        <div style={{ background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: 12 }}>
                            <ChartHeader title="Articles by Category" sub="Article count per language / category" />
                            {catData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={catData.length * 38 + 16}>
                                    <BarChart data={catData} layout="vertical"
                                        margin={{ top: 2, right: 56, left: 4, bottom: 2 }}>
                                        <XAxis type="number" allowDecimals={false}
                                            tick={{ fontSize: 10, fill: "var(--text-muted)", fontFamily: "var(--font-sans)" }}
                                            tickLine={false} axisLine={false} />
                                        <YAxis type="category" dataKey="name" width={190}
                                            tick={{ fontSize: 12, fill: "var(--text-body)", fontFamily: "var(--font-sans)", fontWeight: 600 }}
                                            tickLine={false} axisLine={false} />
                                        <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--surface-sunken)" }} />
                                        <Bar dataKey="count" name="Articles" radius={[0, 6, 6, 0]} maxBarSize={26}
                                            label={{ position: "right", formatter: (v) => v, fontSize: 11, fontWeight: 700, fill: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
                                            {catData.map((_, i) => (
                                                <Cell key={i} fill={AI_CAT_COLORS[i % AI_CAT_COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: ".78rem", padding: "20px 0" }}>No articles for this period.</div>
                            )}
                        </div>
                    </div>
                )}
            </Card>
        </section>
    );
}

// ─── Section heading helper ───────────────────────────────────────────────────

function SectionHead({ title, subtitle, logoEl, url }) {
    const displayUrl = url ? url.replace(/^https?:\/\/(www\.)?/, "") : null;
    return (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 6, flexWrap: "wrap" }}>
            {/* Logo — clickable */}
            {logoEl && (
                url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, lineHeight: 0 }}>
                        {logoEl}
                    </a>
                ) : <div style={{ flexShrink: 0 }}>{logoEl}</div>
            )}

            {/* Name → Title → Subtitle → Link — all left-aligned */}
            <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: ".68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--text-muted)", marginBottom: 3 }}>
                    {title}
                </div>
                <h2 style={{
                    margin: 0, fontFamily: "var(--font-display)", fontWeight: 800,
                    fontSize: "1.45rem", letterSpacing: "-.02em", color: "var(--text-strong)", lineHeight: 1.15,
                }}>
                    {title}
                </h2>
                {subtitle && (
                    <div style={{ fontSize: ".78rem", color: "var(--text-muted)", marginTop: 3 }}>{subtitle}</div>
                )}
                {url && (
                    <a href={url} target="_blank" rel="noopener noreferrer"
                        style={{
                            display: "inline-flex", alignItems: "center", gap: 3, marginTop: 4,
                            fontSize: ".72rem", color: "#2563eb", textDecoration: "underline",
                            textUnderlineOffset: "2px", fontWeight: 500,
                        }}>
                        {displayUrl}
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
                            <path d="M1.5 8.5L8.5 1.5M8.5 1.5H3.5M8.5 1.5V6.5"
                                stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </a>
                )}
            </div>
        </div>
    );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ activeNav }) {
    const navLink = (id, label, logoSrc, iconEl = null, pillBg = null) => {
        const active = activeNav === id;
        return (
            <a href={`#${id}`} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "7px 10px",
                borderRadius: 10, fontSize: ".82rem", transition: "all .15s",
                background: active ? "var(--emerald-700)" : "transparent",
                color: active ? "#fcfaf4" : "rgba(255,255,255,.68)",
                fontWeight: active ? 700 : 500,
                textDecoration: "none",
            }}>
                {/* Logo thumbnail or icon in white pill */}
                <span style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0, overflow: "hidden",
                    background: pillBg || (iconEl ? `${SEIC_ACC}cc` : "rgba(255,255,255,.93)"),
                    boxShadow: active ? "0 0 0 2px rgba(201,162,75,.6)" : "none",
                    transition: "box-shadow .15s",
                }}>
                    {iconEl || (
                        <img src={logoSrc} alt={label}
                            style={{ width: "100%", height: "100%", objectFit: "contain", padding: 3 }} />
                    )}
                </span>
                {label}
            </a>
        );
    };

    return (
        <aside style={{
            position: "fixed", top: 0, left: 0, bottom: 0, width: 252,
            background: "linear-gradient(180deg,var(--emerald-900) 0%,var(--emerald-950) 100%)",
            color: "#fcfaf4", padding: "20px 14px 16px",
            display: "flex", flexDirection: "column", gap: 3, zIndex: 40,
            boxShadow: "0 18px 48px rgba(0,20,11,.45)",
        }}>
            {/* Brand */}
            <div style={{
                padding: "4px 8px 16px", borderBottom: "1px solid rgba(255,255,255,.1)",
                marginBottom: 10,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <img src={jkIndiaLogoImg} alt="JK India"
                        style={{
                            height: 40, width: "auto", maxWidth: 44, objectFit: "contain",
                            borderRadius: 8, flexShrink: 0,
                            border: "2px solid rgba(201,162,75,.4)",
                            background: "rgba(255,255,255,.93)",
                            padding: 2,
                        }} />
                    <div>
                        <div style={{
                            fontFamily: "var(--font-display)", fontWeight: 700,
                            fontSize: "1rem", letterSpacing: "-.01em", lineHeight: 1.15,
                        }}>JK India eAgriTech Limited</div>
                    </div>
                </div>
            </div>

            <div style={{
                fontSize: ".6rem", fontWeight: 700, letterSpacing: ".18em",
                textTransform: "uppercase", color: "rgba(255,255,255,.32)", padding: "2px 10px 6px",
            }}>
                Trade Platform
            </div>

            {navLink("ebuysugar", "eBuySugar", ebsSquareLogoImg)}

            <div style={{ height: 1, background: "rgba(255,255,255,.08)", margin: "6px 0" }} />

            <div style={{
                fontSize: ".6rem", fontWeight: 700, letterSpacing: ".18em",
                textTransform: "uppercase", color: "rgba(255,255,255,.32)", padding: "2px 10px 6px",
            }}>
                News Analytics
            </div>

            {navLink("chinimandi", "ChiniMandi", cmSquareLogoImg)}
            {navLink("bioenergy", "BioEnergy Times", beSquareLogoImg)}
            {navLink("agriinsights", "AgriInsights", agriInsiteSquareLogoImg)}

            <div style={{ height: 1, background: "rgba(255,255,255,.08)", margin: "6px 0" }} />

            <div style={{
                fontSize: ".6rem", fontWeight: 700, letterSpacing: ".18em",
                textTransform: "uppercase", color: "rgba(255,255,255,.32)", padding: "2px 10px 6px",
            }}>
                Event Analytics
            </div>

            {navLink("seic", "SEIC Conference", seicSquareLogoImg)}

            <div style={{ height: 1, background: "rgba(255,255,255,.08)", margin: "6px 0" }} />

            <div style={{
                fontSize: ".6rem", fontWeight: 700, letterSpacing: ".18em",
                textTransform: "uppercase", color: "rgba(255,255,255,.32)", padding: "2px 10px 6px",
            }}>
                Closing Analytics
            </div>

            {navLink("closing-analytics", "Accounts Closing Analytics", jkIndiaLogoImg)}

            <div style={{ height: 1, background: "rgba(255,255,255,.08)", margin: "6px 0" }} />

            <div style={{
                fontSize: ".6rem", fontWeight: 700, letterSpacing: ".18em",
                textTransform: "uppercase", color: "rgba(255,255,255,.32)", padding: "2px 10px 6px",
            }}>
                eTrack Info
            </div>

            {navLink("etrack-info", "eTrack Info", null,
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fcfaf4" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m5-4a4 4 0 100-8 4 4 0 000 8zm6 0a4 4 0 100-8 4 4 0 000 8z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20v-2a4 4 0 014-4h0a4 4 0 014 4v2" />
                </svg>,
                `${CLOSING_ACC}cc`
            )}

            <div style={{
                marginTop: "auto", padding: "12px 10px 2px",
                borderTop: "1px solid rgba(255,255,255,.08)",
            }}>
            </div>
        </aside>
    );
}

// ─── Universal Filter Bar (global + per-section, includes custom date range) ──

function FilterBar({ ranges, range, accent = "var(--emerald-800)", loading, onApply, compact = false }) {
    const today = new Date().toISOString().slice(0, 10);
    const [start, setStart] = useState(today);
    const [end, setEnd] = useState(today);
    return (
        <div style={{ marginBottom: compact ? 0 : 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                {!compact && (
                    <span style={{
                        fontSize: ".7rem", fontWeight: 700, textTransform: "uppercase",
                        letterSpacing: ".08em", color: "var(--text-muted)", marginRight: 3
                    }}>Period:</span>
                )}
                {ranges.map((r) => (
                    <button key={r.id} disabled={loading}
                        onClick={() => { if (!loading) onApply(r.id); }}
                        style={{
                            padding: compact ? "5px 11px" : "6px 14px",
                            borderRadius: 99, fontSize: compact ? ".75rem" : ".8rem", fontWeight: 600,
                            cursor: loading ? "default" : "pointer", border: "1px solid",
                            transition: "all .14s", fontFamily: "var(--font-sans)",
                            background: range === r.id ? accent : "var(--white)",
                            borderColor: range === r.id ? accent : "var(--border-default)",
                            color: range === r.id ? "#fff" : "var(--text-body)",
                            opacity: loading ? .6 : 1,
                        }}>
                        {r.label}
                    </button>
                ))}
                {loading && (
                    <svg style={{ animation: "ga-spin .8s linear infinite", marginLeft: 4, flexShrink: 0 }}
                        width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="5" stroke="var(--border-default)" strokeWidth="2" />
                        <path d="M7 2 A5 5 0 0 1 12 7" stroke={accent} strokeWidth="2" strokeLinecap="round" />
                    </svg>
                )}
            </div>
            {range === "custom" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                    <input type="date" value={start} onChange={(e) => setStart(e.target.value)}
                        style={{
                            padding: "5px 10px", borderRadius: 7,
                            border: `1px solid ${accent}55`,
                            fontSize: ".78rem", fontFamily: "var(--font-sans)",
                            color: "var(--text-body)", outline: "none", background: "var(--white)"
                        }} />
                    <span style={{ fontSize: ".78rem", color: "var(--text-muted)" }}>to</span>
                    <input type="date" value={end} onChange={(e) => setEnd(e.target.value)}
                        style={{
                            padding: "5px 10px", borderRadius: 7,
                            border: `1px solid ${accent}55`,
                            fontSize: ".78rem", fontFamily: "var(--font-sans)",
                            color: "var(--text-body)", outline: "none", background: "var(--white)"
                        }} />
                    <button onClick={() => start && end && onApply("custom", start, end)}
                        disabled={!start || !end || loading}
                        style={{
                            padding: "5px 14px", borderRadius: 7, background: accent, color: "#fff",
                            border: "none", fontSize: ".78rem", fontWeight: 600,
                            cursor: (!start || !end || loading) ? "not-allowed" : "pointer",
                            fontFamily: "var(--font-sans)", opacity: (!start || !end || loading) ? .5 : 1
                        }}>
                        Apply
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Collapsible Section Filter (toggle button + expandable pills) ────────────

function SectionFilter({
    ranges, range, accent, loading, onApply,
    badgeLabel = "Live · Google Analytics",
    badgeColor = "#16a34a",
}) {
    const [open, setOpen] = useState(false);
    const activeLabel = ranges.find((r) => r.id === range)?.label || range;

    return (
        <div style={{ marginBottom: 8 }}>
            {/* Toggle row: button left, live badge right */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: open ? 8 : 0 }}>
                <button
                    onClick={() => setOpen((v) => !v)}
                    style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "5px 11px", borderRadius: 8,
                        border: `1px solid ${open ? accent : "var(--border-default)"}`,
                        background: open ? `${accent}12` : "var(--surface-card)",
                        color: open ? accent : "var(--text-muted)",
                        fontSize: ".72rem", fontWeight: 600, cursor: "pointer",
                        fontFamily: "var(--font-sans)", transition: "all .15s",
                    }}>
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                        <path d="M0.5 1.5h11M2.5 5h7M4.5 8.5h3" stroke="currentColor"
                            strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    Filter
                    <span style={{
                        background: accent, color: "#fff",
                        borderRadius: 5, padding: "1px 8px",
                        fontSize: ".64rem", fontWeight: 700, lineHeight: 1.7,
                    }}>{activeLabel}</span>
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none"
                        style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s", flexShrink: 0 }}>
                        <path d="M1.5 3l3 3 3-3" stroke="currentColor"
                            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                <div style={{
                    marginLeft: "auto", display: "flex", alignItems: "center", gap: 6,
                    fontSize: ".72rem", color: badgeColor, fontWeight: 700
                }}>
                    <span style={{
                        width: 7, height: 7, borderRadius: "50%", background: badgeColor,
                        boxShadow: `0 0 0 3px ${badgeColor}33`
                    }} />
                    {badgeLabel}
                </div>
            </div>

            {/* Expandable filter panel */}
            {open && (
                <div style={{
                    padding: "10px 14px",
                    background: "var(--surface-sunken)",
                    border: `1px solid ${accent}33`,
                    borderRadius: 10,
                }}>
                    <FilterBar
                        ranges={ranges} range={range} accent={accent} loading={loading}
                        onApply={(r, s, e) => {
                            onApply(r, s, e);
                            if (r !== "custom") setOpen(false);
                        }}
                        compact
                    />
                </div>
            )}
        </div>
    );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function GoogleAnalyticsDashboard() {
    const [activeNav, setActiveNav] = useState("ebuysugar");

    // ── Global GA4 range (header "apply all") ──────────────────────────────────
    const [globalRange, setGlobalRange] = useState("week");

    // ── ChiniMandi ─────────────────────────────────────────────────────────────
    const [cmRange, setCmRange] = useState("week");
    const [cmData, setCmData] = useState(null);
    const [cmLoading, setCmLoading] = useState(false);
    const [cmError, setCmError] = useState(null);

    // ── BioEnergy ──────────────────────────────────────────────────────────────
    const [beRange, setBeRange] = useState("week");
    const [beData, setBeData] = useState(null);
    const [beLoading, setBeLoading] = useState(false);
    const [beError, setBeError] = useState(null);

    // ── AgriInsite GA4 ─────────────────────────────────────────────────────────
    const [aiGA4Range, setAiGA4Range] = useState("week");
    const [aiGA4Data, setAiGA4Data] = useState(null);
    const [aiGA4Loading, setAiGA4Loading] = useState(false);
    const [aiGA4Error, setAiGA4Error] = useState(null);

    // ── AgriInsite WordPress article data ──────────────────────────────────────
    const [aiWpData, setAiWpData] = useState(null);
    const [aiWpLoading, setAiWpLoading] = useState(false);

    // ── eBuySugar ──────────────────────────────────────────────────────────────
    const [ebsRange, setEbsRange] = useState("today");
    const [ebsData, setEbsData] = useState(null);
    const [ebsLoading, setEbsLoading] = useState(false);
    const [ebsError, setEbsError] = useState(null);

    // Scroll-spy
    useEffect(() => {
        const onScroll = () => {
            const trigger = window.scrollY + window.innerHeight * 0.3;
            let active = "ebuysugar";
            NAV_IDS.forEach((id) => {
                const el = document.getElementById(id);
                if (el && el.getBoundingClientRect().top + window.scrollY <= trigger) active = id;
            });
            setActiveNav(active);
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // ── Per-site GA4 fetch ─────────────────────────────────────────────────────
    const fetchCM = useCallback(async (range, start, end) => {
        setCmLoading(true); setCmError(null);
        try {
            let url = `${API}/ga4-analytics?range=${range}&site=chinimandi`;
            if (range === "custom" && start && end) url += `&start=${start}&end=${end}`;
            const res = await axios.get(url);
            setCmData(res.data.chinimandi || null);
        } catch (e) { setCmError(e?.response?.data?.error || e.message); }
        finally { setCmLoading(false); }
    }, []);

    const fetchBE = useCallback(async (range, start, end) => {
        setBeLoading(true); setBeError(null);
        try {
            let url = `${API}/ga4-analytics?range=${range}&site=bioenergy`;
            if (range === "custom" && start && end) url += `&start=${start}&end=${end}`;
            const res = await axios.get(url);
            setBeData(res.data.bioenergy || null);
        } catch (e) { setBeError(e?.response?.data?.error || e.message); }
        finally { setBeLoading(false); }
    }, []);

    const fetchAIGA4 = useCallback(async (range, start, end) => {
        setAiGA4Loading(true); setAiGA4Error(null);
        try {
            let url = `${API}/ga4-analytics?range=${range}&site=agriinsite`;
            if (range === "custom" && start && end) url += `&start=${start}&end=${end}`;
            const res = await axios.get(url);
            setAiGA4Data(res.data.agriinsite || null);
        } catch (e) { setAiGA4Error(e?.response?.data?.error || e.message); }
        finally { setAiGA4Loading(false); }
    }, []);

    const fetchAIWp = useCallback(async (range, start, end) => {
        setAiWpLoading(true);
        try {
            const url = range === "custom" && start && end
                ? `https://agriinsite.com/wp-json/newsroom-insights/v1/stats?range=custom&start=${start}&end=${end}`
                : `https://agriinsite.com/wp-json/newsroom-insights/v1/stats?range=${range}`;
            const res = await axios.get(url);
            setAiWpData(res.data);
        } catch { /* silently skip — GA4 charts still show */ }
        finally { setAiWpLoading(false); }
    }, []);

    const fetchEBS = useCallback(async (filter, start, end) => {
        setEbsLoading(true); setEbsError(null);
        try {
            let url = `${API}/ebuysugar-dashboard?filter=${filter}`;
            if (filter === "custom" && start && end) url += `&start=${start}&end=${end}`;
            const res = await axios.get(url);
            setEbsData(res.data);
        } catch (e) { setEbsError(e?.response?.data?.error || e.message); }
        finally { setEbsLoading(false); }
    }, []);

    // Initial fetches
    useEffect(() => { fetchCM("week"); }, [fetchCM]);
    useEffect(() => { fetchBE("week"); }, [fetchBE]);
    useEffect(() => { fetchAIGA4("week"); }, [fetchAIGA4]);
    useEffect(() => { fetchAIWp("week"); }, [fetchAIWp]);
    useEffect(() => { fetchEBS("today"); }, [fetchEBS]);

    // ── Apply handlers ─────────────────────────────────────────────────────────
    const handleGlobalApply = (range, start, end) => {
        setGlobalRange(range); setCmRange(range); setBeRange(range); setAiGA4Range(range);
        if (range !== "custom") { fetchCM(range); fetchBE(range); fetchAIGA4(range); fetchAIWp(range); }
        else if (start && end) { fetchCM(range, start, end); fetchBE(range, start, end); fetchAIGA4(range, start, end); fetchAIWp(range, start, end); }
    };

    const handleCmApply = (range, start, end) => {
        setCmRange(range);
        if (range !== "custom") fetchCM(range);
        else if (start && end) fetchCM(range, start, end);
    };

    const handleBeApply = (range, start, end) => {
        setBeRange(range);
        if (range !== "custom") fetchBE(range);
        else if (start && end) fetchBE(range, start, end);
    };

    const handleAIGA4Apply = (range, start, end) => {
        setAiGA4Range(range);
        if (range !== "custom") { fetchAIGA4(range); fetchAIWp(range); }
        else if (start && end) { fetchAIGA4(range, start, end); fetchAIWp(range, start, end); }
    };

    const handleEbsApply = (filter, start, end) => {
        setEbsRange(filter);
        if (filter !== "custom") fetchEBS(filter);
        else if (start && end) fetchEBS(filter, start, end);
    };

    // ── ChiniMandi logo ──
    const cmLogo = (
        <img src={cmLogoImg} alt="ChiniMandi"
            style={{
                height: 44, width: "auto", maxWidth: 150, borderRadius: 8,
                objectFit: "contain", flexShrink: 0, display: "block"
            }} />
    );

    // ── BioEnergy logo ──
    const beLogo = (
        <img src={beLogoImg} alt="BioEnergy Times"
            style={{
                height: 44, width: "auto", maxWidth: 150, borderRadius: 8,
                objectFit: "contain", flexShrink: 0, display: "block"
            }} />
    );

    // ── AgriInsite logo ──
    const aiLogo = (
        <img src={agriInsiteLogoImg} alt="AgriInsite"
            style={{
                height: 44, width: "auto", maxWidth: 200, borderRadius: 8,
                objectFit: "contain", flexShrink: 0, display: "block"
            }} />
    );

    // ── Account Closing Analytics logo ──
    const closingLogo = (
        <img src={jkIndiaLogoImg} alt="Accounts Closing Analytics"
            style={{
                height: 44, width: "auto", maxWidth: 150, borderRadius: 8,
                objectFit: "contain", flexShrink: 0, display: "block",
                border: `2px solid ${CLOSING_ACC}66`, background: "rgba(255,255,255,.93)", padding: 3,
            }} />
    );

    // ── AgriInsite merged data (GA4 + WordPress newsroom) ──
    const aiMergedData = aiGA4Data ? {
        ...aiGA4Data,
        newsroom: aiWpData ? {
            total_published_posts: aiWpData.total || 0,
            languages: aiWpData.languages || {},
            newsTypes: {},
        } : null,
    } : null;

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: STYLES }} />
            <div style={{ minHeight: "100vh" }}>

                {/* Sidebar */}
                <Sidebar activeNav={activeNav} />

                {/* Main */}
                <main style={{ marginLeft: 252 }}>

                    {/* Header */}
                    <header style={{
                        position: "sticky", top: 0, zIndex: 30,
                        background: "rgba(252,250,244,.92)", backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        borderBottom: "1px solid var(--border-subtle)",
                        padding: "12px 24px",
                        display: "flex", alignItems: "center",
                        justifyContent: "space-between", gap: 16, flexWrap: "wrap",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <img src={jkIndiaLogoImg} alt="JK India"
                                style={{
                                    height: 38, width: "auto", maxWidth: 42, objectFit: "contain",
                                    borderRadius: 8, flexShrink: 0,
                                    border: "2px solid rgba(10,61,46,.18)",
                                    background: "rgba(255,255,255,.95)",
                                    padding: 2,
                                }} />
                            <div style={{ lineHeight: 1.2 }}>
                                <div style={{
                                    fontFamily: "var(--font-display)", fontWeight: 700,
                                    fontSize: ".78rem", color: "var(--text-muted)", letterSpacing: ".01em",
                                }}>JK India eAgriTech Limited</div>
                                <div style={{
                                    fontFamily: "var(--font-display)", fontWeight: 800,
                                    fontSize: "1.15rem", letterSpacing: "-.02em", color: "var(--text-strong)",
                                }}>Live Dashboard</div>
                            </div>
                        </div>

                        {/* Global GA4 filter — applies to ChiniMandi + BioEnergy simultaneously */}
                        <FilterBar
                            ranges={GA4_RANGES}
                            range={globalRange}
                            accent="var(--emerald-800)"
                            loading={cmLoading || beLoading}
                            onApply={handleGlobalApply}
                        />
                    </header>

                    {/* Content */}
                    <div style={{ padding: "20px 24px 56px" }}>

                        {/* eBuySugar — first */}
                        <EBuySugarSection
                            ebsRange={ebsRange}
                            onEbsApply={handleEbsApply}
                            ebsData={ebsData}
                            ebsLoading={ebsLoading}
                            ebsError={ebsError}
                        />

                        {/* ChiniMandi */}
                        <SiteSection
                            id="chinimandi"
                            title="ChiniMandi"
                            subtitle="Sugar industry news portal · www.chinimandi.com"
                            url="https://www.chinimandi.com"
                            logoEl={cmLogo}
                            accent={CM_ACC}
                            siteData={cmData}
                            loading={cmLoading}
                            newsroomLabel="Language Breakdown"
                            range={cmRange}
                            onApply={handleCmApply}
                            newsFeedConfig={{
                                baseUrl: "https://www.chinimandi.com",
                                categoriesByLang: CM_NEWS_CATEGORIES,
                                defaultLang: "hi",
                                showLangToggle: true,
                            }}
                        />

                        {/* BioEnergy Times */}
                        <SiteSection
                            id="bioenergy"
                            title="BioEnergy Times"
                            subtitle="Bioenergy industry news portal · www.bioenergytimes.com"
                            url="https://www.bioenergytimes.com"
                            logoEl={beLogo}
                            accent={BE_ACC}
                            siteData={beData}
                            loading={beLoading}
                            newsroomLabel="Category Breakdown"
                            range={beRange}
                            onApply={handleBeApply}
                            newsFeedConfig={{
                                baseUrl: "https://www.bioenergytimes.com",
                                categoriesByLang: BE_NEWS_CATEGORIES,
                                defaultLang: "en",
                                showLangToggle: false,
                            }}
                        />

                        {/* AgriInsite */}
                        <SiteSection
                            id="agriinsights"
                            title="AgriInsite"
                            subtitle="Agriculture news portal · agriinsite.com"
                            url="https://agriinsite.com"
                            logoEl={aiLogo}
                            accent={AI_ACC}
                            siteData={aiMergedData}
                            loading={aiGA4Loading}
                            newsroomLabel="Category Breakdown"
                            range={aiGA4Range}
                            onApply={handleAIGA4Apply}
                        />

                        {/* SEIC Conference */}
                        <SEICSection />

                        {/* Account Closing Analytics */}
                        <section id="closing-analytics" style={{ scrollMarginTop: 88, marginBottom: 20 }}>
                            <SectionHead
                                title="Accounts Closing Analytics"
                                subtitle="Accounts & stock closing reports · accounts.ebuysugar.com"
                                logoEl={closingLogo}
                                url="https://accounts.ebuysugar.com/"
                            />
                            {/* ClosingStock has a built-in marginTop:-80px for its standalone page;
                                cancel it out here so it doesn't overlap the section above */}
                            <div style={{ marginTop: 80 }}>
                                <ClosingStock />
                            </div>
                        </section>

                        {/* eTrack Info */}
                        <ETrackSection />

                    </div>
                </main>
            </div>
        </>
    );
}
