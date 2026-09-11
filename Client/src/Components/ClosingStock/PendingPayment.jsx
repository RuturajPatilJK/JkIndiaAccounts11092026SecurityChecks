import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";

const API_BASE = process.env.REACT_APP_API;

const fmt = (n) =>
  n == null || n === "" || isNaN(Number(n))
    ? "0"
    : Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const sameDay = (a, b) =>
  a && b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/* ─── Global CSS ─── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');

  .ppr * { box-sizing: border-box; }
  .ppr {
    font-family: 'DM Sans', sans-serif !important;
    background: #f1f5f9;
    min-height: 100vh;
    color: #0f172a;
    text-align: left;
  }

  @keyframes ppr-up   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ppr-left { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
  @keyframes ppr-spin { to{transform:rotate(360deg)} }

  .ppr-up   { animation: ppr-up   .42s cubic-bezier(.22,.68,0,1.2) both; }
  .ppr-left { animation: ppr-left .3s ease both; }
  .ppr-spin { animation: ppr-spin .75s linear infinite; }

  /* ── Header ── */
  .ppr-header {
    position: sticky; top: 0; z-index: 100;
    background: #0d1117;
    border-bottom: 1px solid #1a2236;
    padding: 13px 22px;
    display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;
  }
  .ppr-h-title { font-size:14px; font-weight:700; color:#f1f5f9; letter-spacing:-.02em; }
  .ppr-h-sub   { font-size:10px; color:#7dd3fc; font-weight:500; margin-top:2px; letter-spacing:.06em; text-transform:uppercase; }

  .ppr-search-wrap { position:relative; }
  .ppr-search-ico  { position:absolute; left:9px; top:50%; transform:translateY(-50%); width:13px; height:13px; color:#4b6080; pointer-events:none; }
  .ppr-search {
    background:#161e2e; border:1px solid #1e2d45; color:#e2e8f0;
    padding:6px 10px 6px 28px; border-radius:8px; font-size:12px;
    font-family:'DM Sans',sans-serif; width:230px; outline:none; transition:border .18s,box-shadow .18s;
  }
  .ppr-search:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.2); }

  .ppr-btn {
    display:inline-flex; align-items:center; gap:5px;
    padding:6px 13px; border-radius:8px; font-size:11px; font-weight:600;
    cursor:pointer; border:none; transition:all .14s; letter-spacing:.03em; font-family:'DM Sans',sans-serif;
    color:#fff;
  }
  .ppr-btn:hover { filter:brightness(1.12); transform:translateY(-1px); }
  .ppr-g  { background:#059669; }
  .ppr-b  { background:#2563eb; }

  /* ── Checkbox styles ── */
  .ppr-cb { width:15px; height:15px; cursor:pointer; accent-color:#2563eb; flex-shrink:0; }
  .ppr-cb-cell { width:36px; vertical-align:middle; text-align:center; }

  /* ── Sections ── */
  .ppr-sections { display:flex; flex-direction:column; gap:14px; padding:8px 20px 24px; }
  .ppr-section  { background:#fff; border:1px solid #e2e8f0; border-radius:13px; overflow:hidden; }

  .ppr-sec-hd {
    display:flex; justify-content:space-between; align-items:center;
    padding:11px 16px; cursor:pointer; user-select:none;
    background:#f8fafc; border-bottom:1px solid #e2e8f0;
  }
  .ppr-sec-bar  { width:5px; border-radius:4px; flex-shrink:0; align-self:stretch; min-height:34px; }
  .ppr-sec-left { display:flex; align-items:center; gap:10px; }
  .ppr-sec-name { font-size:11px; font-weight:700; color:#0f172a; text-transform:uppercase; letter-spacing:.05em; }
  .ppr-sec-date { font-size:10px; color:#7f90a8; margin-top:1px; }
  .ppr-pill     { font-size:10px; font-weight:700; background:#e8edf5; color:#4b6080; padding:2px 9px; border-radius:20px; }
  .ppr-chv      { width:15px; height:15px; color:#94a3b8; transition:transform .24s; }
  .ppr-chv.open { transform:rotate(180deg); }

  /* ── Sortable column headers ── */
  .ppr-tbl th.sortable {
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
    transition: background .12s, color .12s;
  }
  .ppr-tbl th.sortable:hover { background: #e8edf5; color: #1e293b; }
  .ppr-tbl th.sort-active { color: #2563eb !important; background: #eff6ff !important; }
  .sort-arrow { display:inline-block; margin-left:4px; font-size:10px; opacity:.7; }

  /* ── Table ── */
  .ppr-scroll { overflow-x:auto; }
  .ppr-tbl { width:100%; border-collapse:collapse; font-size:12px; min-width:820px; }
  .ppr-tbl thead tr { background:#f4f7fc; border-bottom:1px solid #dde3ef; }
  .ppr-tbl th {
    padding:10px 11px; text-align:left; font-size:10px; font-weight:700;
    color:#5a6e88; text-transform:uppercase; letter-spacing:.07em; white-space:nowrap;
  }
  .ppr-tbl th:nth-child(7), .ppr-tbl th:nth-child(8),
  .ppr-tbl th:nth-child(9), .ppr-tbl th:nth-child(10) { text-align:right; }

  .ppr-tbl tbody tr { border-bottom:1px solid #f0f3f9; transition:background .12s; }
  .ppr-tbl tbody tr.ppr-row-selected { background:#eff6ff; }
  .ppr-tbl td { padding:10px 11px; vertical-align:middle; }

  .td-sn   { color:#b0bec5; font-size:10px; width:28px; }
  .td-date { font-weight:700; color:#1d4ed8; white-space:nowrap; font-size:13px; }
  .td-mill { font-weight:600; color:#0f172a; font-size:13px; }
  .td-do   { font-weight:600; color:#1e293b; font-size:13px; }
  .td-ship { font-weight:600; color:#1e293b; font-size:13px; }
  .td-num, .td-rate, .td-amt, .td-ledger { text-align:right; }
  .td-num  { font-family:'JetBrains Mono',monospace; font-size:13px; font-weight:600; color:#334155; }
  .td-rate { font-family:'JetBrains Mono',monospace; font-size:13px; color:#64748b; }
  .td-amt  { font-family:'JetBrains Mono',monospace; font-size:13px; font-weight:700; color:#0f172a; }

  .ppr-badge { display:inline-flex; align-items:center; padding:2px 8px; border-radius:6px; font-size:10px; font-weight:700; }
  .ppr-dr    { background:#fef2f2; color:#b91c1c; border:1px solid #fecaca; }
  .ppr-cr    { background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; }

  /* ── Section tfoot ── */
  .ppr-tbl tfoot tr { background:#ffffff; border-top:2px solid #e2e8f0; }
  .ppr-tbl tfoot td { padding:12px 11px; font-size:13px; font-weight:700; color:#0f172a; text-align:right; }
  .ppr-tbl tfoot td:first-child { text-align:left; }
  .ppr-tbl tfoot .total-val { font-family:'JetBrains Mono',monospace; font-size:14px; color:#000; }
  .ppr-tbl tfoot tr.ppr-sel-foot { background:#eff6ff; border-top:1px dashed #93c5fd; }
  .ppr-tbl tfoot tr.ppr-sel-foot td { color:#1e40af; font-size:13px; }
  .ppr-tbl tfoot tr.ppr-sel-foot .total-val { color:#1e40af; font-size:14px; font-family:'JetBrains Mono',monospace; }

  /* ══ Global Selected Summary Panel ══ */
  .ppr-global-sel {
    margin: 0 20px 14px;
    background: #fff;
    border: 2px solid #3b82f6;
    border-radius: 13px;
    overflow: hidden;
    animation: ppr-up .35s cubic-bezier(.22,.68,0,1.2) both;
  }
  .ppr-global-sel-hd {
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
    padding: 12px 18px;
    display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;
  }
  .ppr-global-sel-title {
    font-size: 12px; font-weight: 700; color: #fff;
    text-transform: uppercase; letter-spacing: .07em; display: flex; align-items: center; gap: 8px;
  }
  .ppr-global-sel-cnt {
    background: rgba(255,255,255,.18); color: #fff; font-size: 11px; font-weight: 700;
    padding: 2px 9px; border-radius: 20px;
  }
  .ppr-global-sel-totals { display:flex; gap:24px; flex-wrap:wrap; align-items:center; }
  .ppr-global-sel-total { font-size:12px; color:#93c5fd; display:flex; align-items:center; gap:6px; }
  .ppr-global-sel-total strong { font-family:'JetBrains Mono',monospace; font-size:15px; color:#fff; }

  .ppr-global-sel-empty {
    padding: 20px 18px;
    color: #94a3b8;
    font-size: 12px;
    text-align: center;
  }

  .ppr-global-sel-scroll { overflow-x: auto; }
  .gsel-tbl { width:100%; border-collapse:collapse; font-size:12px; min-width:680px; }
  .gsel-tbl thead tr { background:#eff6ff; border-bottom:2px solid #bfdbfe; }
  .gsel-tbl th {
    padding:9px 12px; font-size:10px; font-weight:700; color:#1e40af;
    text-transform:uppercase; letter-spacing:.07em; white-space:nowrap; text-align:left;
  }
  .gsel-tbl th.r { text-align:right; }
  .gsel-tbl tbody tr { border-bottom:1px solid #e0eefe; }
  .gsel-tbl tbody tr:nth-child(even) { background:#f8fbff; }
  .gsel-tbl td { padding:9px 12px; vertical-align:middle; color:#1e293b; font-size:12px; }
  .gsel-tbl td.r { text-align:right; font-family:'JetBrains Mono',monospace; font-weight:600; color:#334155; }
  .gsel-tbl td.amt { text-align:right; font-family:'JetBrains Mono',monospace; font-weight:700; color:#0f172a; }
  .gsel-tbl tfoot tr { background:#dbeafe; border-top:2px solid #2563eb; }
  .gsel-tbl tfoot td {
    padding:11px 12px; font-weight:700; color:#1e3a8a; text-align:right; font-size:13px;
  }
  .gsel-tbl tfoot td:first-child { text-align:left; }
  .gsel-tbl tfoot .gsel-grand { font-family:'JetBrains Mono',monospace; font-size:15px; color:#1e3a8a; }

  .ppr-sec-tag {
    font-size:10px; font-weight:700; padding:2px 8px; border-radius:20px;
    white-space:nowrap; display:inline-block;
  }

  /* ── Per-section block inside selected panel ── */
  .gsel-sec-block { border-top: 1px solid #e2e8f0; }
  .gsel-sec-block:first-child { border-top: none; }
  .gsel-sec-subhd {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 16px; border-bottom: 1px solid #e2e8f0;
  }
  .gsel-sec-subhd-title {
    font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; flex: 1;
  }
  .gsel-sec-subhd-count {
    font-size: 10px; font-weight: 700; padding: 2px 9px; border-radius: 20px;
  }
  .gsel-grand-footer {
    display: flex; justify-content: space-between; align-items: center;
    padding: 12px 18px; background: #dbeafe; border-top: 2px solid #2563eb;
    font-size: 13px; font-weight: 700; color: #1e3a8a;
  }
  .gsel-grand-footer strong { font-size: 15px; }

  /* ── Print title block (only visible in print) ── */
  .ppr-print-title { display: none; }

  /* ══ PRINT ══ */
  @media print {
    * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
    body, html { background:#fff !important; margin:0 !important; padding:0 !important; }

    /* ── Selection print mode ── */
    .ppr-print-sel .ppr-header   { display:none !important; }
    .ppr-print-sel .ppr-sections { display:none !important; }

    .ppr-print-sel .ppr-global-sel {
      display: block !important;
      margin: 0 !important;
      border: 1px solid #2563eb !important;
      border-radius: 0 !important;
    }

    .ppr-print-title {
      display: block !important;
      padding: 10px 0 6px;
      border-bottom: 2px solid #1e40af;
      margin-bottom: 8px;
    }
    .ppr-print-title h1 {
      font-size: 16px; font-weight: 800; color: #0f172a;
      margin: 0 0 2px; font-family: 'DM Sans', sans-serif;
    }
    .ppr-print-title .ppr-pt-dates {
      font-size: 10px; color: #4b6080; font-family: 'DM Sans', sans-serif;
      display: flex; gap: 16px;
    }
    .ppr-print-title .ppr-pt-dates span {
      font-weight: 700; padding: 1px 7px; border-radius: 4px;
    }
    .ppr-print-title .ppr-pt-dates .pt-d0 { background:#fef2f2; color:#b91c1c; }
    .ppr-print-title .ppr-pt-dates .pt-d1 { background:#fff7ed; color:#c2410c; }
    .ppr-print-title .ppr-pt-dates .pt-d2 { background:#eff6ff; color:#1e40af; }

    .ppr-print-sel .ppr-global-sel-hd { background: #1e40af !important; padding: 10px 14px !important; }
    .ppr-print-sel .ppr-global-sel-title { color:#fff !important; font-size:11px !important; }
    .ppr-print-sel .ppr-global-sel-cnt { background:rgba(255,255,255,.25) !important; color:#fff !important; }
    .ppr-print-sel .ppr-global-sel-total { color:#bfdbfe !important; }
    .ppr-print-sel .ppr-global-sel-total strong { color:#fff !important; font-size:13px !important; }
    .ppr-print-sel .ppr-global-sel-scroll { overflow:visible !important; }

    .gsel-tbl { width:100% !important; border-collapse:collapse !important; border:1px solid #bfdbfe !important; }
    .gsel-tbl thead tr { background:#dbeafe !important; }
    .gsel-tbl th { color:#1e40af !important; padding:6px 9px !important; font-size:9px !important; border-bottom:1px solid #93c5fd !important; }
    .gsel-tbl th.r { text-align:right !important; }
    .gsel-tbl tbody tr { border-bottom:1px solid #e0eefe !important; }
    .gsel-tbl tbody tr:nth-child(even) { background:#f0f7ff !important; }
    .gsel-tbl td { padding:6px 9px !important; font-size:10px !important; vertical-align:middle !important; }
    .gsel-tbl td.r { text-align:right !important; font-family:'JetBrains Mono',monospace !important; font-weight:600 !important; }
    .gsel-tbl td.amt { text-align:right !important; font-family:'JetBrains Mono',monospace !important; font-weight:700 !important; }
    .gsel-tbl tfoot tr { background:#dbeafe !important; border-top:2px solid #1e40af !important; }
    .gsel-tbl tfoot td {
      color:#1e3a8a !important; font-size:11px !important; font-weight:800 !important;
      padding:8px 9px !important; text-align:right !important;
    }
    .gsel-tbl tfoot td:first-child { text-align:left !important; }
    .gsel-tbl tfoot .gsel-grand {
      font-family:'JetBrains Mono',monospace !important;
      font-size:13px !important; color:#1e3a8a !important; font-weight:800 !important;
    }

    /* ── Section blocks: flow continuously, never force a page break ── */
    .gsel-sec-block {
      page-break-before: auto !important;
      page-break-inside: avoid !important;
      border-top: 1px solid #d1d5db !important;
    }
    .gsel-sec-block:first-child { border-top: none !important; }
    .gsel-sec-subhd {
      padding: 7px 12px !important;
      border-bottom: 1px solid #d1d5db !important;
    }
    .gsel-sec-subhd-title { font-size: 10px !important; }
    .gsel-sec-subhd-count { font-size: 9px !important; }

    .gsel-grand-footer {
      background: #dbeafe !important;
      border-top: 2px solid #2563eb !important;
      padding: 8px 12px !important;
      font-size: 11px !important;
      color: #1e3a8a !important;
    }
    .gsel-grand-footer strong { font-size: 13px !important; }

    /* ── No-selection: print all sections (portrait A4) ── */
    .ppr-print-all .ppr-global-sel { display:none !important; }

    .ppr-print-all .ppr-header {
      display:flex !important; position:relative !important;
      background:#f8fafc !important; border-bottom:2px solid #1e40af !important;
      padding: 10px 16px !important;
    }
    .ppr-print-all .ppr-h-title { color:#0f172a !important; font-size:15px !important; }
    .ppr-print-all .ppr-h-sub   { color:#4b6080 !important; }
    .ppr-print-all .ppr-search-wrap,
    .ppr-print-all .ppr-btn { display:none !important; }

    .ppr-print-all .ppr-sections {
      display:flex !important; flex-direction:column !important;
      gap:16px !important; padding:10px 0 0 !important;
    }
    .ppr-print-all .ppr-section {
      display:block !important; border:1px solid #d1d5db !important;
      border-radius:0 !important; page-break-inside:auto;
    }
    .ppr-print-all .ppr-sec-hd {
      background:#f1f5f9 !important; border-bottom:1px solid #d1d5db !important;
      padding: 7px 12px !important;
    }
    .ppr-print-all .ppr-sec-name { font-size:10px !important; color:#0f172a !important; }
    .ppr-print-all .ppr-sec-date { font-size:9px !important; }
    .ppr-print-all .ppr-chv,
    .ppr-print-all .ppr-pill { display:none !important; }

    /* Force ALL sections open in print regardless of screen state */
    .ppr-print-all .ppr-scroll { overflow:visible !important; display:block !important; }

    .ppr-print-all .ppr-tbl { width:100% !important; border-collapse:collapse !important; border:1px solid #d1d5db !important; }
    .ppr-print-all .ppr-tbl th:first-child,
    .ppr-print-all .ppr-tbl td:first-child { display:none !important; }
    .ppr-print-all .ppr-tbl thead tr { background:#f1f5f9 !important; }
    .ppr-print-all .ppr-tbl th { padding:6px 9px !important; font-size:9px !important; color:#374151 !important; border-bottom:1px solid #d1d5db !important; }
    .ppr-print-all .ppr-tbl th:nth-child(7), .ppr-print-all .ppr-tbl th:nth-child(8),
    .ppr-print-all .ppr-tbl th:nth-child(9), .ppr-print-all .ppr-tbl th:nth-child(10) { text-align:right !important; }
    .ppr-print-all .ppr-tbl tbody tr { border-bottom:1px solid #e5e7eb !important; display:table-row !important; }
    .ppr-print-all .ppr-tbl td { padding:6px 9px !important; font-size:10px !important; }
    .ppr-print-all .ppr-tbl tfoot tr { background:#f1f5f9 !important; border-top:2px solid #374151 !important; }
    .ppr-print-all .ppr-tbl tfoot tr.ppr-sel-foot { display:none !important; }
    .ppr-print-all .ppr-tbl tfoot td {
      color:#0f172a !important; font-weight:800 !important; font-size:11px !important;
      padding:7px 9px !important; text-align:right !important;
    }
    .ppr-print-all .ppr-tbl tfoot td:first-child { text-align:left !important; }
    .ppr-print-all .ppr-tbl tfoot .total-val {
      font-family:'JetBrains Mono',monospace !important;
      font-size:12px !important; color:#0f172a !important; font-weight:800 !important;
    }

    /* Sort arrows hidden in print */
    .sort-arrow { display:none !important; }

    tr { page-break-inside:avoid; }
  }
`;

function useInjectCSS() {
  useEffect(() => {
    const id = "ppr-global-css";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = CSS;
    document.head.appendChild(el);
    return () => document.getElementById(id)?.remove();
  }, []);
}

/* ─── Icons ─── */
const IcoSearch = () => (
  <svg className="ppr-search-ico" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
  </svg>
);
const IcoDL = () => (
  <svg style={{ width: 13, height: 13 }} viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 2a.75.75 0 01.75.75v7.19l2.47-2.47a.75.75 0 111.06 1.06l-3.75 3.75a.75.75 0 01-1.06 0L5.72 8.53a.75.75 0 011.06-1.06l2.47 2.47V2.75A.75.75 0 0110 2zm-8.25 14.5a.75.75 0 01.75-.75h15a.75.75 0 010 1.5H2.5a.75.75 0 01-.75-.75z" />
  </svg>
);
const IcoPrint = () => (
  <svg style={{ width: 13, height: 13 }} viewBox="0 0 20 20" fill="currentColor">
    <path d="M5 4v3H4a2 2 0 00-2 2v5a2 2 0 002 2h1v2a1 1 0 001 1h8a1 1 0 001-1v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a1 1 0 00-1-1H6a1 1 0 00-1 1zm2 0h6v3H7V4zm-1 9H6v3h8v-3h-1a1 1 0 01-1-1v-1H8v1a1 1 0 01-1 1z" />
  </svg>
);

const ACCENTS = { day0: "#ef4444", day1: "#f97316", day2: "#2563eb" };
const SECTION_COLORS = { day0: "#fef2f2", day1: "#fff7ed", day2: "#eff6ff" };
const SECTION_TEXT = { day0: "#b91c1c", day1: "#c2410c", day2: "#1e40af" };

/* ─── Column definitions for sorting ─── */
const COLUMNS = [
  { key: "partypaymentdate", label: "Payment Date", type: "date", align: "left" },
  { key: "millshortname", label: "Mill Name", type: "string", align: "left" },
  { key: "doname", label: "DO Name", type: "string", align: "left" },
  { key: "shiptoname", label: "Ship To", type: "string", align: "left" },
  { key: "BALANCE", label: "Quintal", type: "number", align: "right" },
  { key: "Sale_Rate", label: "Sale Rate (₹)", type: "number", align: "right" },
  { key: "_amt", label: "Amount (₹)", type: "number", align: "right" },
  { key: "BuyerBalance", label: "Ledger Balance", type: "number", align: "right" },
];

/* Sort comparator */
function sortRows(data, sortKey, sortDir) {
  if (!sortKey) return data;
  return [...data].sort((a, b) => {
    let va = sortKey === "_amt"
      ? Math.abs(Number(a.BALANCE || 0) * Number(a.Sale_Rate || 0))
      : a[sortKey];
    let vb = sortKey === "_amt"
      ? Math.abs(Number(b.BALANCE || 0) * Number(b.Sale_Rate || 0))
      : b[sortKey];

    const col = COLUMNS.find(c => c.key === sortKey);
    if (col?.type === "date") {
      va = va ? new Date(va).getTime() : 0;
      vb = vb ? new Date(vb).getTime() : 0;
    } else if (col?.type === "number") {
      va = Number(va) || 0;
      vb = Number(vb) || 0;
    } else {
      va = String(va ?? "").toLowerCase();
      vb = String(vb ?? "").toLowerCase();
    }

    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });
}

/* Arrow indicator */
function SortArrow({ active, dir }) {
  if (!active) return <span className="sort-arrow" style={{ opacity: 0.3 }}>⇅</span>;
  return <span className="sort-arrow">{dir === "asc" ? "↑" : "↓"}</span>;
}

/* ─── Section component ─── */
function Section({ secKey, section, isOpen, onToggle, delay, selected, onToggleRow, onSelectAll }) {
  const accent = ACCENTS[secKey] || "#64748b";

  /* Per-section sort state */
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sortedData = useMemo(
    () => sortRows(section.data, sortKey, sortDir),
    [section.data, sortKey, sortDir]
  );

  const totalQtl = section.data.reduce((a, r) => a + Math.abs(Number(r.BALANCE || 0)), 0);
  const totalAmt = section.data.reduce((a, r) => a + Math.abs(Number(r.BALANCE || 0)) * Math.abs(Number(r.Sale_Rate || 0)), 0);

  /* selected still tracks original indices */
  const selectedRows = section.data.filter((_, i) => selected.has(i));
  const selQtl = selectedRows.reduce((a, r) => a + Math.abs(Number(r.BALANCE || 0)), 0);
  const selAmt = selectedRows.reduce((a, r) => a + Math.abs(Number(r.BALANCE || 0)) * Math.abs(Number(r.Sale_Rate || 0)), 0);
  const selCount = selectedRows.length;

  const allChecked = section.data.length > 0 && section.data.every((_, i) => selected.has(i));
  const someChecked = section.data.some((_, i) => selected.has(i)) && !allChecked;

  return (
    <div className="ppr-section ppr-up" style={{ animationDelay: `${delay}s` }}>
      <div className="ppr-sec-hd" onClick={onToggle}>
        <div className="ppr-sec-left">
          <div className="ppr-sec-bar" style={{ background: accent }} />
          <div>
            <div className="ppr-sec-name">{section.title}</div>
            <div className="ppr-sec-date">
              {section.date.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {selCount > 0 && (
            <span className="ppr-pill" style={{ background: "#dbeafe", color: "#1e40af" }}>
              {selCount} selected
            </span>
          )}
          <span className="ppr-pill">{section.data.length} records</span>
          <svg className={`ppr-chv${isOpen ? " open" : ""}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* Always render table but hide it — important for print (ppr-print-all forces display:block) */}
      <div className="ppr-scroll" style={!isOpen ? { display: "none" } : {}}>
        <table className="ppr-tbl">
          <thead>
            <tr>
              <th className="ppr-cb-cell" onClick={e => e.stopPropagation()}>
                <input
                  type="checkbox" className="ppr-cb"
                  checked={allChecked}
                  ref={el => { if (el) el.indeterminate = someChecked; }}
                  onChange={e => { e.stopPropagation(); onSelectAll(e.target.checked); }}
                  title="Select all"
                />
              </th>
              <th>#</th>
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  className={`sortable${sortKey === col.key ? " sort-active" : ""}`}
                  style={{ textAlign: col.align }}
                  onClick={e => { e.stopPropagation(); handleSort(col.key); }}
                >
                  {col.label}
                  <SortArrow active={sortKey === col.key} dir={sortDir} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr><td colSpan={10} style={{ textAlign: "center", color: "#94a3b8", padding: "24px" }}>No records found</td></tr>
            ) : (
              sortedData.map((row, i) => {
                /* Find original index for checkbox state */
                const origIdx = section.data.indexOf(row);
                const qty = Math.abs(Number(row.BALANCE || 0));
                const rate = Math.abs(Number(row.Sale_Rate || 0));
                const amt = qty * rate;
                const isDr = row.BuyerBalanceLabel === "Dr";
                const hasBal = row.BuyerBalance && row.BuyerBalance !== 0;
                const isSelected = selected.has(origIdx);
                return (
                  <tr key={i} className={isSelected ? "ppr-row-selected" : ""}>
                    <td className="ppr-cb-cell" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" className="ppr-cb" checked={isSelected} onChange={() => onToggleRow(origIdx)} />
                    </td>
                    <td className="td-sn">{i + 1}</td>
                    <td className="td-date">{fmtDate(row.partypaymentdate)}</td>
                    <td className="td-mill">{row.millshortname || "—"}</td>
                    <td className="td-do">{row.doname || "—"}</td>
                    <td className="td-ship">{row.shiptoname || "—"}</td>
                    <td className="td-num">{fmt(qty)}</td>
                    <td className="td-rate">{fmt(rate)}</td>
                    <td className="td-amt">₹ {fmt(amt)}</td>
                    <td className="td-ledger">
                      {hasBal ? (
                        <span className={`ppr-badge ${isDr ? "ppr-dr" : "ppr-cr"}`}>
                          {fmt(Math.abs(row.BuyerBalance))} {row.BuyerBalanceLabel}
                        </span>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          <hr/>
          <tfoot>
            {selCount > 0 && (
              <tr className="ppr-sel-foot">
                <td colSpan={6} style={{ textAlign: "left" }}>✓ Selected ({selCount}) — {section.title}</td>
                <td className="total-val">Qntl {fmt(selQtl)}</td>
                <td />
                <td className="total-val">₹ {fmt(selAmt)}</td>
                <td />
              </tr>
            )}
            <tr>
              <td colSpan={6}>Total — {section.title}</td>
              <td className="total-val">Qntl {fmt(totalQtl)}</td>
              <td />
              <td className="total-val">₹ {fmt(totalAmt)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/* ─── Per-section block inside the selected panel ─── */
function SelectedSectionBlock({ secKey, sectionTitle, rows, globalIndex }) {
  const accent = ACCENTS[secKey] || "#64748b";
  const secBg = SECTION_COLORS[secKey] || "#f8fafc";
  const secTxt = SECTION_TEXT[secKey] || "#4b6080";
  const secQtl = rows.reduce((a, r) => a + Math.abs(Number(r.BALANCE || 0)), 0);
  const secAmt = rows.reduce((a, r) => a + Math.abs(Number(r.BALANCE || 0)) * Math.abs(Number(r.Sale_Rate || 0)), 0);

  return (
    <div className="gsel-sec-block" style={{ pageBreakInside: "avoid" }}>
      {/* Section sub-header */}
      <div className="gsel-sec-subhd" style={{ borderLeft: `4px solid ${accent}`, background: secBg }}>
        <span className="gsel-sec-subhd-title" style={{ color: secTxt }}>{sectionTitle}</span>
        <span className="gsel-sec-subhd-count" style={{ background: accent, color: "#fff" }}>
          {rows.length} record{rows.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="ppr-global-sel-scroll">
        <table className="gsel-tbl">
          <thead>
            <tr>
              <th style={{ width: 30 }}>#</th>
              <th>Payment Date</th>
              <th>Mill Name</th>
              <th>DO Name</th>
              <th>Ship To</th>
              <th className="r">Quintal</th>
              <th className="r">Sale Rate (₹)</th>
              <th className="r">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const qty = Math.abs(Number(row.BALANCE || 0));
              const rate = Math.abs(Number(row.Sale_Rate || 0));
              const amt = qty * rate;
              return (
                <tr key={i}>
                  <td style={{ color: "#b0bec5", fontSize: 10 }}>{globalIndex + i + 1}</td>
                  <td style={{ fontWeight: 700, color: "#1d4ed8", fontSize: 13, whiteSpace: "nowrap" }}>{fmtDate(row.partypaymentdate)}</td>
                  <td style={{ fontWeight: 600, color: "#0f172a" }}>{row.millshortname || "—"}</td>
                  <td style={{ color: "#1e293b" }}>{row.doname || "—"}</td>
                  <td style={{ color: "#1e293b" }}>{row.shiptoname || "—"}</td>
                  <td className="r">{fmt(qty)}</td>
                  <td className="r" style={{ color: "#64748b" }}>{fmt(rate)}</td>
                  <td className="amt">₹ {fmt(amt)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5}>Subtotal — {sectionTitle}</td>
              <td className="gsel-grand r">Qntl&nbsp;{fmt(secQtl)}</td>
              <td />
              <td className="gsel-grand r">₹&nbsp;{fmt(secAmt)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/* ─── Global Selected Summary Panel ─── */
function GlobalSelectedPanel({ allSelectedRows, d0, d1, d2 }) {
  const grandQtl = allSelectedRows.reduce((a, r) => a + Math.abs(Number(r.BALANCE || 0)), 0);
  const grandAmt = allSelectedRows.reduce((a, r) => a + Math.abs(Number(r.BALANCE || 0)) * Math.abs(Number(r.Sale_Rate || 0)), 0);

  const fmtD = (d) => d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const d2Label = d2.toLocaleDateString("en-IN", { weekday: "long" });

  /* Group rows by section, preserving order day0 → day1 → day2 */
  const groups = useMemo(() => {
    const map = {};
    allSelectedRows.forEach(r => {
      if (!map[r._secKey]) map[r._secKey] = { title: r._sectionTitle, rows: [] };
      map[r._secKey].rows.push(r);
    });
    return ["day0", "day1", "day2"].filter(k => map[k]).map(k => ({ secKey: k, ...map[k] }));
  }, [allSelectedRows]);

  /* Running counter so row numbers are globally sequential across sections */
  let runningIdx = 0;

  return (
    <div className="ppr-global-sel">
      {/* Print-only title block */}
      <div className="ppr-print-title">
        <h1>Pending Payment List</h1>
        <div className="ppr-pt-dates">
          <span className="pt-d0">Today / Overdue — {fmtD(d0)}</span>
          <span className="pt-d1">Tomorrow — {fmtD(d1)}</span>
          <span className="pt-d2">{d2Label} — {fmtD(d2)}</span>
        </div>
      </div>

      {/* Blue header with grand totals */}
      <div className="ppr-global-sel-hd">
        <div className="ppr-global-sel-title">
          ✓ Selected Records
          <span className="ppr-global-sel-cnt">{allSelectedRows.length} rows</span>
        </div>
        {allSelectedRows.length > 0 && (
          <div className="ppr-global-sel-totals">
            <div className="ppr-global-sel-total">
              Total Quintal: <strong>{fmt(grandQtl)}</strong>
            </div>
            <div className="ppr-global-sel-total">
              Total Amount: <strong>₹ {fmt(grandAmt)}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Body: empty state or per-section blocks */}
      {allSelectedRows.length === 0 ? (
        <div className="ppr-global-sel-empty">
          No rows selected yet. Check rows in any section above to see a summary here.
        </div>
      ) : (
        <>
          {groups.map(({ secKey, title, rows }) => {
            const startIdx = runningIdx;
            runningIdx += rows.length;
            return (
              <SelectedSectionBlock
                key={secKey}
                secKey={secKey}
                sectionTitle={title}
                rows={rows}
                globalIndex={startIdx}
              />
            );
          })}

          {/* Grand total footer across all sections */}
          <div className="gsel-grand-footer">
            <span>Grand Total — {allSelectedRows.length} selected records</span>
            <span style={{ display: "flex", gap: 32 }}>
              <span>Qntl <strong style={{ fontFamily: "'JetBrains Mono',monospace" }}>{fmt(grandQtl)}</strong></span>
              <span>₹ <strong style={{ fontFamily: "'JetBrains Mono',monospace" }}>{fmt(grandAmt)}</strong></span>
            </span>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Main Component ─── */
export default function PendingPaymentReport() {
  useInjectCSS();
  const [rows, setRows] = useState([]);
  const [loading, setLoad] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState({ day0: true, day1: true, day2: true });
  const [selected, setSelected] = useState({ day0: new Set(), day1: new Set(), day2: new Set() });

  const companyCode = sessionStorage.getItem("Company_Code");
  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoad(true);
    try {
      const res = await fetch(`${API_BASE}/pendingpayment?company_code=${companyCode}`);
      const data = await res.json();
      setRows(data || []);
    } catch (e) { console.error(e); }
    finally { setLoad(false); }
  }

  const [d0, d1, d2] = useMemo(() => {
    return [0, 1, 2].map((n) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + n);
      return d;
    });
  }, []);

  const sections = useMemo(() => {
    const grps = {
      day0: { title: "Today / Overdue", date: d0, data: [] },
      day1: { title: "Tomorrow", date: d1, data: [] },
      day2: { title: d2.toLocaleDateString("en-IN", { weekday: "long" }), date: d2, data: [] },
    };
    const term = search.toLowerCase();
    rows.forEach((row) => {
      const pDate = row.partypaymentdate ? new Date(row.partypaymentdate) : null;
      if (pDate) pDate.setHours(0, 0, 0, 0);
      if (term && !Object.values(row).some(v => String(v ?? "").toLowerCase().includes(term))) return;
      if (!pDate || pDate <= d0) grps.day0.data.push(row);
      else if (sameDay(pDate, d1)) grps.day1.data.push(row);
      else if (sameDay(pDate, d2)) grps.day2.data.push(row);
    });
    return grps;
  }, [rows, search, d0, d1, d2]);

  function toggleRow(secKey, idx) {
    setSelected(prev => {
      const next = new Set(prev[secKey]);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return { ...prev, [secKey]: next };
    });
  }

  function selectAll(secKey, check) {
    setSelected(prev => {
      const s = sections[secKey];
      const next = check ? new Set(s.data.map((_, i) => i)) : new Set();
      return { ...prev, [secKey]: next };
    });
  }

  const allSelectedRows = useMemo(() => {
    return Object.entries(sections).flatMap(([key, s]) =>
      s.data
        .filter((_, i) => selected[key].has(i))
        .map(r => ({ ...r, _secKey: key, _sectionTitle: s.title }))
    );
  }, [sections, selected]);

  const totalSelectedCount = allSelectedRows.length;

  function handleExportXLSX() {
    const aoa = [["#", "Section", "Pay Date", "Mill Name", "DO Name", "Ship To", "Qty", "Rate", "Amount", "Ledger", "Type"]];
    const source = totalSelectedCount > 0
      ? allSelectedRows
      : Object.entries(sections).flatMap(([key, s]) =>
        s.data.map(r => ({ ...r, _secKey: key, _sectionTitle: s.title }))
      );
    source.forEach((r, i) => {
      aoa.push([
        i + 1, r._sectionTitle, r.partypaymentdate, r.millshortname, r.doname,
        r.shiptoname, Math.abs(r.BALANCE), r.Sale_Rate,
        Math.abs(r.BALANCE * r.Sale_Rate), r.BuyerBalance, r.BuyerBalanceLabel,
      ]);
    });
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payments");
    XLSX.writeFile(wb, "Pending_Payments.xlsx");
  }

  function handlePrint() {
    /* Determine source: selected rows grouped by section, or all sections */
    const groups = ["day0", "day1", "day2"]
      .map(key => {
        const s = sections[key];
        const rows = totalSelectedCount > 0
          ? s.data.filter((_, i) => selected[key].has(i))
          : s.data;
        return rows.length > 0 ? { key, title: s.title, date: s.date, rows } : null;
      })
      .filter(Boolean);

    if (groups.length === 0) return;

    const grandQtl = groups.reduce((a, g) =>
      a + g.rows.reduce((b, r) => b + Math.abs(Number(r.BALANCE || 0)), 0), 0);
    const grandAmt = groups.reduce((a, g) =>
      a + g.rows.reduce((b, r) => b + Math.abs(Number(r.BALANCE || 0)) * Math.abs(Number(r.Sale_Rate || 0)), 0), 0);

    const ACCENT = { day0: "#ef4444", day1: "#f97316", day2: "#2563eb" };
    const BG = { day0: "#fef2f2", day1: "#fff7ed", day2: "#eff6ff" };
    const TXT = { day0: "#b91c1c", day1: "#c2410c", day2: "#1e40af" };

    const fmtD = d => new Date(d).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "short", year: "numeric" });

    /* Build section HTML blocks */
    let globalIdx = 1;
    const sectionsHTML = groups.map(({ key, title, date, rows }) => {
      const secQtl = rows.reduce((a, r) => a + Math.abs(Number(r.BALANCE || 0)), 0);
      const secAmt = rows.reduce((a, r) => a + Math.abs(Number(r.BALANCE || 0)) * Math.abs(Number(r.Sale_Rate || 0)), 0);
      const accent = ACCENT[key];
      const bg = BG[key];
      const txt = TXT[key];

      const rowsHTML = rows.map(r => {
        const qty = Math.abs(Number(r.BALANCE || 0));
        const rate = Math.abs(Number(r.Sale_Rate || 0));
        const amt = qty * rate;
        const hasBal = r.BuyerBalance && r.BuyerBalance !== 0;
        const isDr = r.BuyerBalanceLabel === "Dr";
        const ledger = hasBal
          ? `<span style="background:${isDr ? "#fef2f2" : "#f0fdf4"};color:${isDr ? "#b91c1c" : "#15803d"};border:1px solid ${isDr ? "#fecaca" : "#bbf7d0"};padding:2px 7px;border-radius:5px;font-size:9px;font-weight:700">${fmt(Math.abs(r.BuyerBalance))} ${r.BuyerBalanceLabel}</span>`
          : "—";
        return `<tr style="border-bottom:1px solid #f0f3f9">
          <td style="padding:5px 7px;font-size:9px;color:#b0bec5;text-align:center">${globalIdx++}</td>
          <td style="padding:5px 7px;font-size:9px;font-weight:700;color:#1d4ed8;white-space:nowrap">${fmtDate(r.partypaymentdate)}</td>
          <td style="padding:5px 7px;font-size:9px;font-weight:600;color:#0f172a">${r.millshortname || "—"}</td>
          <td style="padding:5px 7px;font-size:9px;color:#1e293b">${r.doname || "—"}</td>
          <td style="padding:5px 7px;font-size:9px;color:#1e293b">${r.shiptoname || "—"}</td>
          <td style="padding:5px 7px;font-size:9px;text-align:right;font-family:monospace;font-weight:600">${fmt(qty)}</td>
          <td style="padding:5px 7px;font-size:9px;text-align:right;font-family:monospace;color:#64748b">${fmt(rate)}</td>
          <td style="padding:5px 7px;font-size:9px;text-align:right;font-family:monospace;font-weight:700">₹ ${fmt(amt)}</td>
          <td style="padding:5px 7px;font-size:9px;text-align:center">${ledger}</td>
        </tr>`;
      }).join("");

      return `
        <div style="margin-bottom:18px;border:1px solid #e2e8f0;border-radius:0;overflow:hidden;page-break-inside:avoid">
          <!-- Section header -->
          <div style="background:${bg};border-left:5px solid ${accent};border-bottom:1px solid #e2e8f0;padding:8px 12px;display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-size:11px;font-weight:700;color:${txt};text-transform:uppercase;letter-spacing:.05em">${title}</div>
              <div style="font-size:9px;color:#7f90a8;margin-top:2px">${fmtD(date)}</div>
            </div>
            <div style="font-size:9px;font-weight:700;background:${accent};color:#fff;padding:2px 10px;border-radius:20px">${rows.length} records</div>
          </div>
          <!-- Table -->
          <table style="width:100%;border-collapse:collapse;font-family:'DM Sans',sans-serif">
            <thead>
              <tr style="background:#f4f7fc;border-bottom:1px solid #dde3ef">
                <th style="padding:6px 7px;font-size:8px;font-weight:700;color:#5a6e88;text-transform:uppercase;letter-spacing:.06em;text-align:center;width:26px">#</th>
                <th style="padding:6px 7px;font-size:8px;font-weight:700;color:#5a6e88;text-transform:uppercase;letter-spacing:.06em">Pay Date</th>
                <th style="padding:6px 7px;font-size:8px;font-weight:700;color:#5a6e88;text-transform:uppercase;letter-spacing:.06em">Mill Name</th>
                <th style="padding:6px 7px;font-size:8px;font-weight:700;color:#5a6e88;text-transform:uppercase;letter-spacing:.06em">DO Name</th>
                <th style="padding:6px 7px;font-size:8px;font-weight:700;color:#5a6e88;text-transform:uppercase;letter-spacing:.06em">Ship To</th>
                <th style="padding:6px 7px;font-size:8px;font-weight:700;color:#5a6e88;text-transform:uppercase;letter-spacing:.06em;text-align:right">Quintal</th>
                <th style="padding:6px 7px;font-size:8px;font-weight:700;color:#5a6e88;text-transform:uppercase;letter-spacing:.06em;text-align:right">Rate (₹)</th>
                <th style="padding:6px 7px;font-size:8px;font-weight:700;color:#5a6e88;text-transform:uppercase;letter-spacing:.06em;text-align:right">Amount (₹)</th>
                <th style="padding:6px 7px;font-size:8px;font-weight:700;color:#5a6e88;text-transform:uppercase;letter-spacing:.06em;text-align:center">Ledger</th>
              </tr>
            </thead>
            <tbody>${rowsHTML}</tbody>
            <tfoot>
              <tr style="background:#f8fafc;border-top:2px solid #e2e8f0">
                <td colspan="5" style="padding:7px 7px;font-size:10px;font-weight:700;color:#0f172a">Subtotal — ${title}</td>
                <td style="padding:7px 7px;font-size:10px;font-weight:700;color:#0f172a;text-align:right;font-family:monospace">${fmt(secQtl)}</td>
                <td></td>
                <td style="padding:7px 7px;font-size:10px;font-weight:700;color:#0f172a;text-align:right;font-family:monospace">₹ ${fmt(secAmt)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>`;
    }).join("");

    /* Build full print HTML */
    const printHTML = `
      <html>
      <head>
        <title>Pending Payment Report</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&display=swap');
          @page { size: A4 portrait; margin: 12mm 10mm; }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body { font-family: 'DM Sans', sans-serif; background: #fff; color: #0f172a; margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        <!-- Document title -->
        <div style="border-bottom:2px solid #1e40af;padding-bottom:8px;margin-bottom:14px">
          <div style="font-size:16px;font-weight:700;color:#0f172a">Pending Payment Report</div>
          <div style="font-size:9px;color:#64748b;margin-top:3px">
            Printed on ${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
            &nbsp;·&nbsp; ${totalSelectedCount > 0 ? `${totalSelectedCount} selected records` : "All records"}
          </div>
        </div>

        <!-- Section blocks -->
        ${sectionsHTML}

        <!-- Grand total -->
        <div style="background:#1e40af;color:#fff;padding:10px 14px;border-radius:0;margin-top:4px;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:11px;font-weight:700">Grand Total — ${groups.reduce((a, g) => a + g.rows.length, 0)} records</span>
          <span style="display:flex;gap:32px">
            <span style="font-size:10px;color:#bfdbfe">Total Quintal: <strong style="font-family:monospace;font-size:13px;color:#fff">${fmt(grandQtl)}</strong></span>
            <span style="font-size:10px;color:#bfdbfe">Total Amount: <strong style="font-family:monospace;font-size:13px;color:#fff">₹ ${fmt(grandAmt)}</strong></span>
          </span>
        </div>
      </body>
      </html>`;

    /* Open a new window, write content, print, close */
    const win = window.open("", "_blank", "width=900,height=700");
    win.document.write(printHTML);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 600);
  }

  return (
    <div className="ppr">
      {/* ── Sticky header ── */}
      <div className="ppr-header">
        <div>
          <div className="ppr-h-title">Pending Payment</div>
          {totalSelectedCount > 0 && (
            <div className="ppr-h-sub">
              {totalSelectedCount} row{totalSelectedCount > 1 ? "s" : ""} selected across all sections
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div className="ppr-search-wrap">
            <IcoSearch />
            <input
              className="ppr-search"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="ppr-btn ppr-g" onClick={handleExportXLSX}>
            <IcoDL /> {totalSelectedCount > 0 ? `Excel (${totalSelectedCount})` : "Excel"}
          </button>
          <button className="ppr-btn ppr-b" onClick={handlePrint}>
            <IcoPrint /> {totalSelectedCount > 0 ? `Print (${totalSelectedCount})` : "Print"}
          </button>
        </div>
      </div>

      {/* ── Selected summary panel — ALWAYS visible ── */}


      {/* ── Section tables ── */}
      <div className="ppr-sections">
        {Object.entries(sections).map(([key, section], idx) => (
          <Section
            key={key}
            secKey={key}
            section={section}
            isOpen={open[key]}
            onToggle={() => setOpen(p => ({ ...p, [key]: !p[key] }))}
            delay={idx * 0.1 + 0.1}
            selected={selected[key]}
            onToggleRow={(i) => toggleRow(key, i)}
            onSelectAll={(check) => selectAll(key, check)}
          />
        ))}
      </div>


      <div style={{ padding: "8px 20px 0" }}>
        <GlobalSelectedPanel allSelectedRows={allSelectedRows} d0={d0} d1={d1} d2={d2} />
      </div>

    </div>
  );
}