import React, { useState, useEffect, useMemo, memo } from "react";
import axios from "axios";
import CustomerLimit from "../Master/AccountInformation/CustomerLimit/CustomerLimit";
import LiveAllTendersForDailyBasis from "../BusinessRelated/TenderPurchase/LiveeTenders/LiveAllTendersForDailyBasis";
import OurPartySelection from "./OurPartySelection/OurPartySelection";
import eBuySugarLogo from "../../Assets/eBuySugarlogo.jpg";

// Memoized panels — prevent re-render when parent activeTab state changes
const CustomerLimitPanel = memo(() => <CustomerLimit />);
const LiveTendersPanel = memo(() => <LiveAllTendersForDailyBasis />);
const OurPartySelectionPanel = memo(() => <OurPartySelection />);

const API_URL = process.env.REACT_APP_API;

const TABS = [
  {
    id: "customer-limit",
    label: "eBuy Customer Limit",
    icon: (
      <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: "pending-do",
    label: "Pending Delivery Orders",
    icon: (
      <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414A1 1 0 0121 11.414V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1" />
      </svg>
    ),
  },
  {
    id: "live-tenders",
    label: "Daily Sauda Report",
    icon: (
      <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    id: "our-party-selection",
    label: "Our Party Selection",
    icon: (
      <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

// ─── Pending DO Table ────────────────────────────────────────────────────────

const FMT_DATE = (d) => {
  if (!d || d === "-") return "-";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
    const [dd, mm, yyyy] = d.split("/");
    return `${dd}-${mm}-${yyyy}`;
  }
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return `${String(dt.getDate()).padStart(2, "0")}-${String(dt.getMonth() + 1).padStart(2, "0")}-${dt.getFullYear()}`;
  } catch { return d; }
};

const FMT_NUM = (v, dec = 2) => {
  if (v == null || v === "") return "-";
  const n = Number(v);
  return isNaN(n) ? v : n.toFixed(dec);
};

const COLS = [
  { key: "Tender_No", label: "Tender No", align: "left" },
  { key: "Party", label: "Party Name", align: "left" },
  { key: "doname", label: "DO Name", align: "left" },
  { key: "Grade", label: "Grade", align: "left" },
  { key: "season", label: "Season", align: "left" },
  { key: "MillRate", label: "Mill Rate", align: "right" },
  { key: "Sale_Rate", label: "Sale Rate", align: "right" },
  { key: "Buyer_Quantal", label: "Buyer Quintal", align: "right" },
  { key: "DESPATCH", label: "Dispatched", align: "right" },
  { key: "BALANCE", label: "Balance", align: "right" },
  { key: "Lifting_Date", label: "Lifting Date", align: "left" },
  { key: "Party_Bill_Rate", label: "Party Bill Rate", align: "right" },
  { key: "Approved", label: "Status", align: "left" },
  { key: "pending_do_no", label: "DO No", align: "right" },
  { key: "pending_doid", label: "DO ID", align: "right" },
  { key: "pendingDoid", label: "Pending DO ID", align: "right" },
];

const PendingDOTab = memo(function PendingDOTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortCol, setSortCol] = useState("Tender_No");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const companyCode = sessionStorage.getItem("Company_Code");
        const res = await axios.get(`${API_URL}/getdata-Pending_DO`, {
          params: { company_code: companyCode },
        });
        const raw = res.data.all_data || [];
        const seen = new Set();
        const unique = raw.filter((r) => {
          // tenderdetailid is the primary key of the detail row
          const key = r.tenderdetailid != null
            ? String(r.tenderdetailid)
            : `${r.Tender_No}_${r.doname}_${r.Lifting_Date}_${r.Buyer_Quantal}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setData(unique);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };

    loadData();

    // Re-fetch whenever backend broadcasts refresh_delivery_orders
    let ws;
    let reconnectTimer;
    const connect = () => {
      ws = new WebSocket(process.env.REACT_APP_API_WEBSOCKET);
      ws.onmessage = (event) => {
        if (String(event.data).includes("refresh_delivery_orders")) {
          loadData();
        }
      };
      ws.onclose = () => {
        reconnectTimer = setTimeout(connect, 3000);
      };
    };
    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, []);

  const counts = useMemo(() => ({
    total: data.length,
    approved: data.filter((r) => r.Approved === "Y").length,
    pending: data.filter((r) => r.Approved !== "Y").length,
  }), [data]);

  const filtered = useMemo(() => {
    let list = data;
    if (statusFilter !== "all")
      list = list.filter((r) => statusFilter === "Y" ? r.Approved === "Y" : r.Approved !== "Y");
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      list = list.filter((r) =>
        [r.Tender_No, r.Party, r.doname, r.Grade, r.season, r.millshortname]
          .some((v) => String(v || "").toLowerCase().includes(s))
      );
    }
    return [...list].sort((a, b) => {
      const va = a[sortCol] ?? "", vb = b[sortCol] ?? "";
      const na = Number(va), nb = Number(vb);
      const cmp = (!isNaN(na) && !isNaN(nb)) ? na - nb : String(va).localeCompare(String(vb));
      return sortAsc ? cmp : -cmp;
    });
  }, [data, search, statusFilter, sortCol, sortAsc]);

  const toggleSort = (key) => {
    if (sortCol === key) setSortAsc((p) => !p);
    else { setSortCol(key); setSortAsc(true); }
  };

  const cellVal = (col, row) => {
    const bal = Number(row.BALANCE || 0);
    switch (col.key) {
      case "Tender_No": return <span style={{ fontWeight: 600, color: "#1d4ed8" }}>#{row.Tender_No}</span>;
      case "Party": return <span style={{ fontWeight: 500, color: "#1e293b" }}>{row.Party || "-"}</span>;
      case "doname": return <span style={{ color: "#475569" }}>{row.doname || "-"}</span>;
      case "Grade": return <span style={{ color: "#374151" }}>{row.Grade || "-"}</span>;
      case "season": return <span style={{ color: "#64748b" }}>{row.season || "-"}</span>;
      case "MillRate": return <span style={{ color: "#4338ca", fontWeight: 500 }}>{FMT_NUM(row.MillRate)}</span>;
      case "Sale_Rate": return <span style={{ color: "#15803d", fontWeight: 600 }}>{FMT_NUM(row.Sale_Rate)}</span>;
      case "Buyer_Quantal": return <span style={{ color: "#374151" }}>{FMT_NUM(row.Lifting_Quintal, 3)}</span>;
      case "DESPATCH": return <span style={{ color: "#64748b" }}>{FMT_NUM(row.DESPATCH, 3)}</span>;
      case "BALANCE": return <span style={{ fontWeight: 600, color: bal >= 0 ? "#15803d" : "#dc2626" }}>{FMT_NUM(row.BALANCE, 3)}</span>;
      case "Lifting_Date": return <span style={{ color: "#374151" }}>{FMT_DATE(row.Lifting_Date)}</span>;
      case "Party_Bill_Rate": return <span style={{ color: "#374151" }}>{FMT_NUM(row.Party_Bill_Rate)}</span>;
      case "Approved":
        return row.Approved === "Y" ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 50, fontSize: 10, fontWeight: 600, background: "#f0fdf4", color: "#15803d" }}>
            ✓ Approved
          </span>
        ) : (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 50, fontSize: 10, fontWeight: 600, background: "#fff7ed", color: "#c2410c" }}>
            ⏱ Pending
          </span>
        );
      case "pending_do_no":
        return row.pending_do_no != null ? (
          <span style={{ fontWeight: 600, color: "#1d4ed8" }}>#{row.pending_do_no}</span>
        ) : <span style={{ color: "#cbd5e1" }}>—</span>;
      case "pending_doid":
        return row.pending_doid != null ? (
          <span style={{ color: "#64748b" }}>{row.pending_doid}</span>
        ) : <span style={{ color: "#cbd5e1" }}>—</span>;
      case "pendingDoid":
        return row.pendingDoid != null ? (
          <span style={{ fontWeight: 600, color: "#7c3aed" }}>{row.pendingDoid}</span>
        ) : <span style={{ color: "#cbd5e1" }}>—</span>;
      default: return "-";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: "12px 16px", background: "linear-gradient(to bottom, #f8fafc, #f1f5f9)", borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>
        {[
          { label: "All", val: "all", count: counts.total, bg: "linear-gradient(135deg,#eff6ff,#dbeafe)", color: "#1d4ed8", border: "#bfdbfe", shadow: "rgba(37,99,235,0.15)" },
          { label: "⏱ Pending", val: "N", count: counts.pending, bg: "linear-gradient(135deg,#fff7ed,#fed7aa)", color: "#c2410c", border: "#fed7aa", shadow: "rgba(194,65,12,0.15)" },
          { label: "✓ Approved", val: "Y", count: counts.approved, bg: "linear-gradient(135deg,#f0fdf4,#bbf7d0)", color: "#15803d", border: "#bbf7d0", shadow: "rgba(21,128,61,0.15)" },
        ].map(({ label, val, count, bg, color, border, shadow }) => {
          const active = statusFilter === val;
          return (
            <button key={val} onClick={() => setStatusFilter(val)}
              style={{
                padding: "6px 14px", borderRadius: 50, fontSize: 11, fontWeight: active ? 700 : 500, cursor: "pointer",
                border: `1.5px solid ${active ? border : "#e2e8f0"}`,
                background: active ? bg : "white",
                color: active ? color : "#64748b",
                boxShadow: active ? `0 3px 10px ${shadow}` : "0 1px 3px rgba(0,0,0,0.05)",
                transform: active ? "translateY(-1px)" : "none",
                transition: "all 0.18s ease",
                display: "inline-flex", alignItems: "center", gap: 5,
              }}
              onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = bg; e.currentTarget.style.color = color; e.currentTarget.style.border = `1.5px solid ${border}`; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 3px 10px ${shadow}`; } }}
              onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.border = "1.5px solid #e2e8f0"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)"; } }}
            >
              {label}
              <span style={{ background: active ? color : "#e2e8f0", color: active ? "white" : "#475569", borderRadius: 50, padding: "0 6px", fontSize: 10, fontWeight: 700, minWidth: 20, textAlign: "center" }}>{count}</span>
            </button>
          );
        })}
        <div style={{ flex: 1, position: "relative", minWidth: 240 }}>
          <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, pointerEvents: "none" }} fill="none" stroke="#94a3b8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tender, party, grade…"
            style={{ width: "100%", padding: "8px 32px 8px 32px", fontSize: 12.5, border: "1.5px solid #e2e8f0", borderRadius: 10, background: "white", color: "#1e293b", outline: "none", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", transition: "border-color 0.15s, box-shadow 0.15s", fontFamily: "inherit" }}
            onFocus={(e) => { e.target.style.borderColor = "#2563eb"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)"; }}
            onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"; }}
          />
          {search && (
            <button onClick={() => setSearch("")}
              style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 16, lineHeight: 1, padding: "0 2px" }}>×</button>
          )}
        </div>
        <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap", background: "white", padding: "4px 10px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
          {filtered.length} / {data.length} rows
        </span>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", gap: 10, color: "#64748b", fontSize: 13 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid #dbeafe", borderTopColor: "#2563eb", animation: "hubSpin 0.8s linear infinite" }} />
            Loading…
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 1000, fontFamily: "inherit" }}>
            <thead>
              <tr>
                {COLS.map((col) => (
                  <th key={col.key} onClick={() => toggleSort(col.key)}
                    style={{
                      position: "sticky", top: 0, zIndex: 5, padding: "10px 12px", fontWeight: 700, fontSize: 11, letterSpacing: "0.03em",
                      color: sortCol === col.key ? "#1d4ed8" : "#64748b",
                      background: sortCol === col.key ? "linear-gradient(to bottom, #eff6ff, #dbeafe)" : "linear-gradient(to bottom, #f8fafc, #f1f5f9)",
                      borderBottom: `2px solid ${sortCol === col.key ? "#2563eb" : "#e2e8f0"}`,
                      borderRight: "1px solid #e2e8f0",
                      whiteSpace: "nowrap", cursor: "pointer", userSelect: "none", textAlign: col.align,
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { if (sortCol !== col.key) { e.currentTarget.style.background = "linear-gradient(to bottom, #eff6ff, #e0f2fe)"; e.currentTarget.style.color = "#1d4ed8"; } }}
                    onMouseLeave={(e) => { if (sortCol !== col.key) { e.currentTarget.style.background = "linear-gradient(to bottom, #f8fafc, #f1f5f9)"; e.currentTarget.style.color = "#64748b"; } }}
                  >
                    {col.label}
                    <span style={{ marginLeft: 4, fontSize: 9, opacity: sortCol === col.key ? 1 : 0.35 }}>
                      {sortCol === col.key ? (sortAsc ? "▲" : "▼") : "⇅"}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={COLS.length} style={{ textAlign: "center", padding: "70px 0", color: "#94a3b8", fontSize: 13 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                      <svg style={{ width: 36, height: 36, opacity: 0.35 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>No records found{search ? " — clear the search to see all" : ""}</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((row, idx) => (
                <tr key={`${row.tenderdetailid ?? ''}_${row.doid ?? ''}_${row.Tender_No ?? ''}_${idx}`}
                  style={{ borderBottom: "1px solid #f1f5f9", background: idx % 2 === 0 ? "white" : "#fafcff", cursor: "default", transition: "background 0.12s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.boxShadow = "inset 3px 0 0 #2563eb"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 0 ? "white" : "#fafcff"; e.currentTarget.style.boxShadow = "none"; }}>
                  {COLS.map((col) => (
                    <td key={col.key} style={{ padding: "9px 12px", whiteSpace: "nowrap", textAlign: col.align, borderRight: "1px solid #f1f5f9" }}>
                      {cellVal(col, row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
});

// ─── Hub ─────────────────────────────────────────────────────────────────────

export default function EBuySugarHub() {
  const [activeTab, setActiveTab] = useState("customer-limit");
  const [mountedTabs, setMountedTabs] = useState(() => new Set(["customer-limit"]));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isStandalone = new URLSearchParams(window.location.search).get("standalone") === "1";
  const SIDEBAR_WIDTH = sidebarCollapsed ? 64 : 236;

  const handleTabClick = (tabId) => {
    setMountedTabs((prev) => new Set([...prev, tabId]));
    setActiveTab(tabId);
    // Collapse the sidebar down to an icon rail after picking a section, so
    // the selected page (e.g. eBuy Customer Limit) gets the full width
    // instead of sharing it with a wide sidebar.
    setSidebarCollapsed(true);
  };

  return (
    <div style={{ display: "flex",marginTop:"-80px", height: isStandalone ? "95vh" : "calc(100vh - 60px)", overflow: "hidden", background: "#f1f5f9", fontFamily: "'Signika', sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Signika:wght@300;400;500;600;700&display=swap');
        @keyframes hubPulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
        @keyframes hubSpin   { to { transform: rotate(360deg) } }
        @keyframes hubGlow   { 0%,100%{box-shadow:0 0 6px #818cf8,0 0 14px rgba(129,140,248,0.4)} 50%{box-shadow:0 0 10px #a5b4fc,0 0 24px rgba(165,180,252,0.6)} }
        @keyframes hubLiveDot{ 0%,100%{box-shadow:0 0 4px #34d399} 50%{box-shadow:0 0 10px #34d399,0 0 20px rgba(52,211,153,0.5)} }
      `}</style>

      {/* ── Sidebar ── */}
      <aside style={{
        width: SIDEBAR_WIDTH, flexShrink: 0,
        transition: "width 0.22s ease",
        background: "linear-gradient(160deg, #1e1b4b 0%, #312e81 45%, #1e1b4b 100%)",
        borderRight: "1px solid rgba(255,255,255,0.04)",
        display: "flex", flexDirection: "column",
        boxShadow: "4px 0 28px rgba(0,0,0,0.35)",
        position: "relative", overflow: "hidden",
      }}>
        {/* subtle grain overlay */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")", pointerEvents: "none", zIndex: 0 }} />

        {/* Logo header */}
        <div style={{ padding: sidebarCollapsed ? "18px 10px" : "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: sidebarCollapsed ? "center" : "space-between", gap: 12, position: "relative", zIndex: 1 }}>
          {!sidebarCollapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, overflow: "hidden" }}>
              <img src={eBuySugarLogo} alt="eBuySugar" style={{ width: 42, height: 42, borderRadius: 12, objectFit: "contain", flexShrink: 0, border: "2px solid rgba(129,140,248,0.45)", background: "white", boxShadow: "0 4px 14px rgba(0,0,0,0.35), 0 0 0 4px rgba(129,140,248,0.1)" }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: "0.01em", lineHeight: 1.2, whiteSpace: "nowrap" }}>eBuySugar</div>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            title={sidebarCollapsed ? "Expand menu" : "Collapse menu"}
            style={{
              flexShrink: 0, width: 30, height: 30, borderRadius: 9, border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)", color: "#c7d2fe", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.14)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
          >
            <svg style={{ width: 16, height: 16, transform: sidebarCollapsed ? "rotate(180deg)" : "none", transition: "transform 0.22s" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Section label */}
        {!sidebarCollapsed && (
          <div style={{ padding: "14px 18px 6px", fontSize: 9.5, fontWeight: 700, color: "rgba(148,163,184,0.5)", letterSpacing: "0.12em", textTransform: "uppercase", position: "relative", zIndex: 1, whiteSpace: "nowrap" }}>
            Menu
          </div>
        )}

        {/* Tabs */}
        <nav style={{ flex: 1, padding: "4px 10px 10px", display: "flex", flexDirection: "column", gap: 5, position: "relative", zIndex: 1 }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => handleTabClick(tab.id)}
                title={sidebarCollapsed ? tab.label : undefined}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  justifyContent: sidebarCollapsed ? "center" : "flex-start",
                  padding: sidebarCollapsed ? "12px 0" : "12px 14px", borderRadius: 12, border: "none",
                  cursor: "pointer", textAlign: "left", width: "100%",
                  background: isActive
                    ? "linear-gradient(135deg, rgba(99,102,241,0.85) 0%, rgba(139,92,246,0.65) 100%)"
                    : "transparent",
                  color: isActive ? "#fff" : "rgba(148,163,184,0.85)",
                  fontWeight: isActive ? 700 : 400,
                  fontSize: 12.5,
                  transition: "all 0.2s ease",
                  borderLeft: isActive ? "3px solid #a5b4fc" : "3px solid transparent",
                  boxShadow: isActive ? "0 4px 22px rgba(99,102,241,0.38), inset 0 1px 0 rgba(255,255,255,0.14)" : "none",
                  fontFamily: "inherit",
                  letterSpacing: "0.01em",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                    e.currentTarget.style.color = "#e2e8f0";
                    e.currentTarget.style.borderLeft = "3px solid rgba(165,180,252,0.5)";
                    e.currentTarget.style.transform = sidebarCollapsed ? "none" : "translateX(4px)";
                    e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.18)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "rgba(148,163,184,0.85)";
                    e.currentTarget.style.borderLeft = "3px solid transparent";
                    e.currentTarget.style.transform = "translateX(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              >
                <span style={{ flexShrink: 0, opacity: isActive ? 1 : 0.55, filter: isActive ? "drop-shadow(0 0 5px rgba(165,180,252,0.7))" : "none", transition: "filter 0.2s" }}>
                  {tab.icon}
                </span>
                {!sidebarCollapsed && (
                  <>
                    <span style={{ lineHeight: 1.3, flex: 1, whiteSpace: "nowrap" }}>{tab.label}</span>
                    {isActive && (
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#a5b4fc", flexShrink: 0, animation: "hubGlow 2s ease-in-out infinite" }} />
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

    
      </aside>

      {/* Content */}
      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Content header */}
        <div style={{ padding: "13px 22px", background: "white", borderBottom: "1px solid #e2e8f0", flexShrink: 0, display: "flex", alignItems: "center", gap: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <span style={{ color: "#2563eb" }}>{TABS.find((t) => t.id === activeTab)?.icon}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", fontFamily: "inherit" }}>
            {TABS.find((t) => t.id === activeTab)?.label}
          </span>
        </div>

        {/* Tab panels — lazy mounted on first visit, then kept alive via display:none.
            Memoized panels skip re-render when only activeTab changes in parent. */}
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          {mountedTabs.has("customer-limit") && (
            <div style={{ position: "absolute", inset: 0, overflow: "auto", display: activeTab === "customer-limit" ? "block" : "none" }}>
              <CustomerLimitPanel />
            </div>
          )}

          {mountedTabs.has("pending-do") && (
            <div style={{ position: "absolute", inset: 0, overflow: "hidden", display: activeTab === "pending-do" ? "flex" : "none", flexDirection: "column" }}>
              <PendingDOTab />
            </div>
          )}

          {mountedTabs.has("live-tenders") && (
            <div style={{ position: "absolute", inset: 0, overflow: "auto", display: activeTab === "live-tenders" ? "block" : "none" }}>
              <LiveTendersPanel />
            </div>
          )}

          {mountedTabs.has("our-party-selection") && (
            <div style={{ position: "absolute", inset: 0, overflow: "auto", display: activeTab === "our-party-selection" ? "block" : "none" }}>
              <OurPartySelectionPanel />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
