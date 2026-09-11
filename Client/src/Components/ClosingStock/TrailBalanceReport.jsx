import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

const apikey = process.env.REACT_APP_API;

const fmt = (n) => {
  const num = parseFloat(n);
  if (!Number.isFinite(num)) return "0.00";
  return Math.abs(num).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const handleAcCodeClick = (acCode, acName) => {
  const today = new Date();
  const toDateStr = today.toISOString().split('T')[0];
  const from = new Date(today);
  from.setDate(from.getDate() - 30);
  const fromDateStr = from.toISOString().split('T')[0];
  const url = `/ledger-report?fromDate=${encodeURIComponent(fromDateStr)}&toDate=${encodeURIComponent(toDateStr)}&acCode=${encodeURIComponent(acCode)}&acname=${encodeURIComponent(acName || '')}&Trans_Type=All`;
  window.open(url, '_blank');
};


const styles = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');

  .tb-root {
    font-family: 'DM Sans', sans-serif;
    background: #f4f6f9;
    min-height: 100vh;
    padding: 24px;
    color: #1a1f2e;
  }

  .tb-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1.5px solid #e2e6ed;
  }

  .tb-title { font-size: 20px; font-weight: 600; color: #1a1f2e; margin: 0 0 2px; }
  .tb-subtitle { font-size: 12px; color: #6b7280; font-family: 'IBM Plex Mono', monospace; margin: 0; }

  .tb-actions { display: flex; gap: 8px; }

  .tb-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 6px; font-size: 13px; font-weight: 500;
    cursor: pointer; border: 1.5px solid; transition: all 0.15s;
    font-family: 'DM Sans', sans-serif;
  }
  .tb-btn.print-btn { background: #fff; border-color: #3b82f6; color: #3b82f6; }
  .tb-btn.print-btn:hover { background: #eff6ff; }
  .tb-btn.excel-btn { background: #fff; border-color: #16a34a; color: #16a34a; }
  .tb-btn.excel-btn:hover { background: #f0fdf4; }

  /* ── SEARCH BAR ── */
  .tb-search-wrap {
    display: flex;
    justify-content: center;
    margin-bottom: 16px;
  }
  .tb-search-box {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    max-width: 520px;
    background: #fff;
    border: 1.5px solid #d1d5db;
    border-radius: 8px;
    padding: 8px 14px;
    transition: border-color 0.15s;
  }
  .tb-search-box:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
  }
  .tb-search-icon { color: #9ca3af; flex-shrink: 0; }
  .tb-search-input {
    border: none; outline: none; flex: 1;
    font-size: 14px; font-family: 'DM Sans', sans-serif;
    color: #1a1f2e; background: transparent;
  }
  .tb-search-input::placeholder { color: #9ca3af; }
  .tb-search-count {
    font-size: 11px; font-family: 'IBM Plex Mono', monospace;
    color: #6b7280; white-space: nowrap;
    background: #f4f6f9; border: 1px solid #e2e6ed;
    border-radius: 4px; padding: 2px 7px;
  }
  .tb-search-clear {
    background: none; border: none; cursor: pointer;
    color: #9ca3af; font-size: 16px; line-height: 1;
    padding: 0; display: flex; align-items: center;
  }
  .tb-search-clear:hover { color: #6b7280; }

  .tb-summary {
    display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;
  }
  .tb-summary-card {
    border-radius: 10px; padding: 14px 20px;
    display: flex; align-items: center; justify-content: space-between;
    background: #fff; border: 1.5px solid;
  }
  .tb-summary-card.cr { border-color: #bbf7d0; }
  .tb-summary-card.dr { border-color: #bfdbfe; }
  .tb-summary-label { font-size: 11px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; }
  .tb-summary-card.cr .tb-summary-label { color: #15803d; }
  .tb-summary-card.dr .tb-summary-label { color: #1d4ed8; }
  .tb-summary-value { font-family: 'IBM Plex Mono', monospace; font-size: 20px; font-weight: 600; }
  .tb-summary-card.cr .tb-summary-value { color: #15803d; }
  .tb-summary-card.dr .tb-summary-value { color: #1d4ed8; }

  .tb-grid {
    display: grid; grid-template-columns: 1fr 2px 1fr;
    background: #fff; border: 1.5px solid #e2e6ed; border-radius: 10px; overflow: hidden;
  }
  .tb-divider { background: #e2e6ed; }

  .tb-col-head {
    padding: 10px 16px; font-size: 11px; font-weight: 600; letter-spacing: 0.8px;
    text-transform: uppercase; display: flex; justify-content: space-between; align-items: center;
    border-bottom: 1.5px solid;
  }
  .tb-col-head.cr { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
  .tb-col-head.dr { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }

  .tb-col { overflow: hidden; }

  .tb-group-head {
    display: flex; justify-content: space-between; align-items: center;
    padding: 9px 16px; border-top: 1px solid #e2e6ed; border-bottom: 1px solid #e2e6ed;
    cursor: pointer; transition: background 0.1s;
  }
  .tb-group-head.cr { background: #f0fdf4; border-left: 3px solid #16a34a; }
  .tb-group-head.dr { background: #eff6ff; border-left: 3px solid #3b82f6; }
  .tb-group-name { font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
  .tb-group-name.cr { color: #15803d; }
  .tb-group-name.dr { color: #1d4ed8; }
  .tb-group-chevron { font-size: 9px; color: #9ca3af; transition: transform 0.2s; display: inline-block; }
  .tb-group-chevron.open { transform: rotate(90deg); }
  .tb-group-total { font-family: 'IBM Plex Mono', monospace; font-size: 13px; font-weight: 600; }

  .tb-gst-block { border-bottom: 1px solid #f1f3f6; }
  .tb-gst-head {
    display: flex; align-items: center; flex-wrap: wrap; gap: 6px;
    padding: 6px 16px 6px 28px; background: #f8fafc; border-bottom: 1px solid #f1f3f6;
  }
  .tb-gst-badge {
    font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 3px;
    background: #e2e8f0; color: #475569; border: 1px solid #cbd5e1;
  }
  .tb-gst-number { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #475569; }
  
  .tb-rec {
    display: flex; justify-content: space-between; align-items: center;
    padding: 6px 16px 6px 36px; border-bottom: 1px solid #f8fafc;
  }
  .tb-rec.no-gst-indent { padding-left: 28px; }
  .tb-rec-name { font-size: 12px; color: #000000; }
  .tb-rec-bal { font-family: 'IBM Plex Mono', monospace; font-size: 12px; font-weight: 500; }
  .tb-rec-bal.cr { color: #15803d; }
  .tb-rec-bal.dr { color: #1d4ed8; }
  .tb-rec:hover { background: #eff6ff; }

  .tb-gst-total {
    display: flex; justify-content: space-between; align-items: center;
    padding: 5px 16px 5px 36px; background: #f1f5f9; border-top: 1px dashed #cbd5e1;
  }
  .tb-gst-total-label { font-size: 10px; font-weight: 600; color: #64748b; }
  .tb-gst-total-val { font-family: 'IBM Plex Mono', monospace; font-size: 12px; font-weight: 700; }

  /* highlight matched text */
  .tb-highlight { background: #fef08a; border-radius: 2px; padding: 0 1px; }

  .tb-no-results {
    padding: 32px 16px; text-align: center; color: #9ca3af; font-size: 13px;
  }

  .tb-loading {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 300px; gap: 12px; color: #6b7280;
  }
  .tb-spinner {
    width: 26px; height: 26px; border: 2px solid #e2e6ed; border-top-color: #3b82f6;
    border-radius: 50%; animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── PRINT-ONLY LAYOUT ── */
  .tb-print-only { display: none; }

 @media print {
    @page { size: A4 Portrait; margin: 1mm; }
    
    /* Hide specific web elements */
    .tb-search-wrap, .tb-btn, .tb-header { display: none !important; }

    /* Force background colors */
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

    /* Layout adjustments for paper */
    .tb-root { padding: 0 !important; background: #fff !important; }
    
    .tb-print-header {
      display: block !important;
      text-align: center;
      margin-bottom: 5px;
      border-bottom: 2px solid #333;
      padding-bottom: 5px;
    }
    .tbp-title { font-size: 28px; font-weight: 700; margin: 0; }
    .tbp-meta { font-size: 14px; margin: 1px 0; color: #555; }

    .tb-summary { margin-bottom: 5px; border: 1px solid #eee; border-radius: 8px; }
    .tb-summary-card { border: none !important; padding: 10px 20px; }
    
    .tb-grid { border: 1px solid #000 !important; border-radius: 0; }
    .tb-divider { width: 1px !important; background: #000 !important; }

    /* Prevent group titles from being cut off at page breaks */
    .tb-group-head, .tb-gst-block, .tb-summary-card { break-inside: avoid; }


    .tb-rec-name, .tbp-rec span:first-child {
      white-space: normal !important; /* Allow wrapping */
      overflow: visible !important;
      text-overflow: clip !important;
      display: block; /* Helps with wrapping */
      text-align: left !important;
    }

    .tbp-rec {
      display: flex !important;
      justify-content: space-between;
      align-items: flex-start !important; /* Align to top if text wraps */
      padding: 4px 0;
      border-bottom: 0.5px solid #eee;
    }

    .tbp-gst-head {
      text-align: left !important;
      font-weight: bold;
      padding-left: 15px;
      margin-top: 4px;
    }
  }
`;

// ── Highlight matching text ──
const Highlight = ({ text, query }) => {
  if (!query || !text) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="tb-highlight">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
};

// ── Filter groups by search query ──
const filterGroups = (groups, query) => {
  if (!query) return groups;
  const q = query.toLowerCase();
  const result = {};
  Object.entries(groups).forEach(([gName, g]) => {
    const groupMatches = gName.toLowerCase().includes(q);

    const matchedNoGst = g.noGstRecords.filter(
      (rec) =>
        rec.Ac_Name_E?.toLowerCase().includes(q) ||
        rec.city_name_e?.toLowerCase().includes(q)
    );

    const matchedGst = {};
    Object.entries(g.gst).forEach(([gstNo, gstEntry]) => {
      const gstMatches = gstNo.toLowerCase().includes(q);
      const matchedRecs = gstEntry.records.filter(
        (rec) =>
          gstMatches ||
          rec.Ac_Name_E?.toLowerCase().includes(q) ||
          rec.city_name_e?.toLowerCase().includes(q)
      );
      if (matchedRecs.length > 0) {
        matchedGst[gstNo] = {
          ...gstEntry,
          records: matchedRecs,
          total: matchedRecs.reduce((s, r) => s + (parseFloat(r.balance) || 0), 0),
        };
      }
    });

    if (groupMatches) {
      result[gName] = g;
    } else if (matchedNoGst.length > 0 || Object.keys(matchedGst).length > 0) {
      result[gName] = {
        ...g,
        noGstRecords: matchedNoGst,
        gst: matchedGst,
        total:
          matchedNoGst.reduce((s, r) => s + (parseFloat(r.balance) || 0), 0) +
          Object.values(matchedGst).reduce((s, g2) => s + g2.total, 0),
      };
    }
  });
  return result;
};

const countResults = (groups) =>
  Object.values(groups).reduce(
    (total, g) =>
      total +
      g.noGstRecords.length +
      Object.values(g.gst).reduce((s, gst) => s + gst.records.length, 0),
    0
  );

const prepareSide = (data) => {
  const groups = {};
  data?.forEach((item) => {
    const gName = item.group_Name_E || "General";
    if (!groups[gName]) groups[gName] = { name: gName, total: 0, gst: {}, noGstRecords: [] };
    const gstNo = item.Gst_No?.trim() || "";
    const bal = parseFloat(item.balance) || 0;

    if (!gstNo) {
      groups[gName].noGstRecords.push(item);
    } else {
      if (!groups[gName].gst[gstNo])
        groups[gName].gst[gstNo] = { gstNo, companyName: item.Ac_Name_E, total: 0, records: [] };
      groups[gName].gst[gstNo].records.push(item);
      groups[gName].gst[gstNo].total += bal;
    }
    groups[gName].total += bal;
  });
  return groups;
};

// ── ColSection: all groups collapsed by default ──
const ColSection = ({ groups, side, searchQuery, openGroups, onAcClick }) => {
  // collapsed = true by default (hidden); toggled by user click
  const [collapsed, setCollapsed] = useState({});
  const toggle = (key) => setCollapsed((p) => ({ ...p, [key]: !p[key] }));

  // When searching: force open. Otherwise: open only if explicitly toggled open (default = collapsed)
  const isOpen = (name) => {
    if (searchQuery) return true;
    // collapsed[name] === true  → user toggled open
    // collapsed[name] === undefined or false → still collapsed (default)
    return collapsed[name] === true;
  };

  // Expose open state upward for print
  useEffect(() => {
    if (openGroups) {
      const openSet = {};
      Object.keys(groups).forEach((name) => {
        openSet[name] = isOpen(name);
      });
      openGroups.current = openSet;
    }
  });

  if (Object.keys(groups).length === 0) {
    return <div className="tb-no-results">No results found</div>;
  }




  return (
    <div className="tb-col">
      {Object.values(groups).map((g) => {
        const open = isOpen(g.name);
        return (
          <div key={g.name}>
            <div className={`tb-group-head ${side}`} onClick={() => !searchQuery && toggle(g.name)}>
              <div className={`tb-group-name ${side}`}>
                <span className={`tb-group-chevron ${open ? "open" : ""}`}>▶</span>
                <Highlight text={g.name} query={searchQuery} />
              </div>
              <div className={`tb-group-total ${side}`}>{fmt(g.total)}</div>
            </div>
            {open && (
              <>
                {g.noGstRecords.map((rec, i) => (
                  // <div className="tb-rec no-gst-indent" key={i}>
                  <div className="tb-rec no-gst-indent" key={i}
                    onClick={() => onAcClick?.(rec.Ac_Code, rec.Ac_Name_E)}
                    style={{ cursor: 'pointer' }}>
                    <span className="tb-rec-name">
                      <span style={{ color: '#64748b', marginRight: '8px', textDecoration: 'underline', }}>{rec.Ac_Code}</span>
                      <Highlight text={rec.Ac_Name_E} query={searchQuery} />
                      {" - "}
                      <Highlight text={rec.city_name_e} query={searchQuery} />
                    </span>
                    <span className={`tb-rec-bal ${side}`}>{fmt(rec.balance)}</span>
                  </div>
                ))}
                {Object.values(g.gst).map((gst) => (
                  <div className="tb-gst-block" key={gst.gstNo}>
                    <div className="tb-gst-head">
                      <span className="tb-gst-badge">GST</span>
                      <span className="tb-gst-number">
                        <Highlight text={gst.gstNo} query={searchQuery} />
                      </span>
                    </div>
                    {gst.records.map((rec, ri) => (
                      // <div className="tb-rec" key={ri}>
                      <div className="tb-rec" key={ri}
                        onClick={() => onAcClick?.(rec.Ac_Code, rec.Ac_Name_E)}
                        style={{ cursor: 'pointer' }}>
                        <span className="tb-rec-name">
                          <span style={{ color: '#1e40af', fontWeight: 'bold', marginRight: '4px', fontSize: '14px', textDecoration: 'underline' }}>
                            {rec.Ac_Code}
                          </span>
                          {" - "}
                          <Highlight text={rec.Ac_Name_E} query={searchQuery} />
                          {" - "}
                          <Highlight text={rec.city_name_e} query={searchQuery} />
                        </span>
                        <span className={`tb-rec-bal ${side}`}>{fmt(rec.balance)}</span>
                      </div>
                    ))}
                    {gst.records.length > 1 && (
                      <div className="tb-gst-total">
                        <span className="tb-gst-total-label">Subtotal</span>
                        <span className={`tb-rec-bal ${side}`}>{fmt(gst.total)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── PrintColumn: only renders groups that are currently open ──
const PrintColumn = ({ groups, side, openGroupNames }) => (
  <div>
    <div className="tbp-col-head">
      <span>{side === "cr" ? "Credit Side" : "Debit Side"}</span>
      <span>Balance</span>
    </div>
    {Object.values(groups).map((g) => {
      const isOpen = openGroupNames ? openGroupNames[g.name] : true;
      return (
        <div key={g.name}>
          <div className="tbp-group">
            <span>{g.name}</span>
            <span>{fmt(g.total)}</span>
          </div>
          {isOpen && (
            <>
              {g.noGstRecords.map((rec, i) => (
                <div className="tbp-rec" key={i} style={{ paddingLeft: '8px' }}>
                  <span>{rec.Ac_Code}</span>
                  <span>{rec.Ac_Name_E}</span>
                  <span>{fmt(rec.balance)}</span>
                </div>
              ))}
              {Object.values(g.gst).map((gst) => (
                <div key={gst.gstNo}>

                  <div className="tbp-gst-head">GST: {gst.gstNo}</div>
                  {gst.records.map((rec, ri) => (
                    <div className="tbp-rec" key={ri}>
                      <span>{rec.Ac_Code}</span>
                      <span>{rec.Ac_Name_E}</span>
                      <span>{fmt(rec.balance)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
      );
    })}
  </div>
);

export default function TrialBalanceReport({ toDate }) {
  const companyCode = sessionStorage.getItem("Company_Code");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Refs to track which groups are open in each column for print
  const crOpenGroups = React.useRef({});
  const drOpenGroups = React.useRef({});

  useEffect(() => {
    if (!toDate || !companyCode) return;
    setLoading(true);
    axios.get(`${apikey}/AgingAnalysisBalanceReportNew`, {
      params: { toDT: toDate, Company_Code: companyCode },
    })
      .then((res) => { if (res.data.status === "success") setReportData(res.data); })
      .finally(() => setLoading(false));
  }, [toDate, companyCode]);

  const { crGroups, drGroups, totals } = useMemo(() => {
    if (!reportData) return { crGroups: {}, drGroups: {}, totals: { cr: 0, dr: 0 } };
    const cr = prepareSide(reportData.negative_balances);
    const dr = prepareSide(reportData.positive_balances);
    const sumCr = reportData.negative_balances?.reduce((s, i) => s + Math.abs(parseFloat(i.balance || 0)), 0) || 0;
    const sumDr = reportData.positive_balances?.reduce((s, i) => s + parseFloat(i.balance || 0), 0) || 0;
    return { crGroups: cr, drGroups: dr, totals: { cr: sumCr, dr: sumDr } };
  }, [reportData]);

  const filteredCr = useMemo(() => filterGroups(crGroups, searchQuery), [crGroups, searchQuery]);
  const filteredDr = useMemo(() => filterGroups(drGroups, searchQuery), [drGroups, searchQuery]);
  const totalResultCount = useMemo(
    () => countResults(filteredCr) + countResults(filteredDr),
    [filteredCr, filteredDr]
  );

  const exportToExcel = () => {
    const buildRows = (groups) => {
      const rows = [];
      Object.values(groups).forEach((g) => {
        // Group Header Row
        rows.push({
          rowType: "GROUP",
          groupName: g.name,
          acCode: "",
          accountName: "",
          gstNo: "",
          city: "",
          balance: "",
          groupTotal: parseFloat(Math.abs(g.total).toFixed(2)),
        });

        // Individual Records (No GST)
        g.noGstRecords.forEach((rec) => {
          rows.push({
            rowType: "",
            groupName: g.name,
            acCode: rec.Ac_Code || "",
            accountName: rec.Ac_Name_E,
            gstNo: "",
            city: rec.city_name_e || "",
            balance: parseFloat(Math.abs(parseFloat(rec.balance)).toFixed(2)),
            groupTotal: "",
          });
        });

        // Individual Records (With GST)
        Object.values(g.gst).forEach((gst) => {
          gst.records.forEach((rec) => {
            rows.push({
              rowType: "",
              groupName: g.name,
              acCode: rec.Ac_Code || "",
              accountName: rec.Ac_Name_E,
              gstNo: gst.gstNo,
              city: rec.city_name_e || "",
              balance: parseFloat(Math.abs(parseFloat(rec.balance)).toFixed(2)),
              groupTotal: "",
            });
          });
        });
      });
      return rows;
    };

    const crRows = buildRows(crGroups);
    const drRows = buildRows(drGroups);

    // Updated Header with "Code" columns
    const header = [
      "CR Type", "CR Group", "CR Code", "CR Account Name", "CR GST No", "CR City", "CR Balance", "CR Group Total",
      "",
      "DR Type", "DR Group", "DR Code", "DR Account Name", "DR GST No", "DR City", "DR Balance", "DR Group Total",
    ];

    const maxLen = Math.max(crRows.length, drRows.length);
    const combined = [header];

    for (let i = 0; i < maxLen; i++) {
      const cr = crRows[i] || {};
      const dr = drRows[i] || {};
      combined.push([
        cr.rowType || "", cr.groupName || "", cr.acCode || "", cr.accountName || "", cr.gstNo || "", cr.city || "",
        cr.balance !== "" ? cr.balance : "", cr.groupTotal !== "" ? cr.groupTotal : "",
        "",
        dr.rowType || "", dr.groupName || "", dr.acCode || "", dr.accountName || "", dr.gstNo || "", dr.city || "",
        dr.balance !== "" ? dr.balance : "", dr.groupTotal !== "" ? dr.groupTotal : "",
      ]);
    }

    const wb = XLSX.utils.book_new();

    // 1. Combined Sheet
    const wsCombined = XLSX.utils.aoa_to_sheet(combined);
    // Adjusted column widths (added width for the Code column)
    wsCombined["!cols"] = [
      { wch: 10 }, { wch: 22 }, { wch: 12 }, { wch: 34 }, { wch: 20 }, { wch: 16 }, { wch: 14 }, { wch: 14 },
      { wch: 2 },
      { wch: 10 }, { wch: 22 }, { wch: 12 }, { wch: 34 }, { wch: 20 }, { wch: 16 }, { wch: 14 }, { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, wsCombined, "Trial Balance");

    // 2. Separate Credit (CR) Sheet
    const crHeader = ["Type", "Group", "Code", "Account Name", "GST No", "City", "Balance", "Group Total"];
    const crAoa = [crHeader, ...crRows.map((r) => [r.rowType, r.groupName, r.acCode, r.accountName, r.gstNo, r.city, r.balance !== "" ? r.balance : "", r.groupTotal !== "" ? r.groupTotal : ""])];
    const wsCR = XLSX.utils.aoa_to_sheet(crAoa);
    wsCR["!cols"] = [{ wch: 10 }, { wch: 22 }, { wch: 12 }, { wch: 34 }, { wch: 20 }, { wch: 16 }, { wch: 14 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, wsCR, "Credit (CR)");

    // 3. Separate Debit (DR) Sheet
    const drHeader = ["Type", "Group", "Code", "Account Name", "GST No", "City", "Balance", "Group Total"];
    const drAoa = [drHeader, ...drRows.map((r) => [r.rowType, r.groupName, r.acCode, r.accountName, r.gstNo, r.city, r.balance !== "" ? r.balance : "", r.groupTotal !== "" ? r.groupTotal : ""])];
    const wsDR = XLSX.utils.aoa_to_sheet(drAoa);
    wsDR["!cols"] = [{ wch: 10 }, { wch: 22 }, { wch: 12 }, { wch: 34 }, { wch: 20 }, { wch: 16 }, { wch: 14 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, wsDR, "Debit (DR)");

    XLSX.writeFile(wb, `TrialBalance_${toDate || "report"}.xlsx`);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="tb-root">
        {reportData && (
          <div className="tb-print-only">
            <div className="tbp-header">
              <h3>Trial Balance Report - {toDate}</h3>
              <div>CR: {fmt(totals.cr)} | DR: {fmt(totals.dr)}</div>
            </div>
            <table className="tbp-table">
              <tbody>
                <tr>
                  <td>
                    <PrintColumn
                      groups={crGroups}
                      side="cr"
                      openGroupNames={crOpenGroups.current}
                    />
                  </td>
                  <td>
                    <PrintColumn
                      groups={drGroups}
                      side="dr"
                      openGroupNames={drOpenGroups.current}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="tb-header">
          <div>
            <p className="tb-title">Trial Balance Report</p>
          </div>


          {/* ── SEARCH BAR ── */}
          <div className="tb-search-wrap">
            <div className="tb-search-box">
              <svg className="tb-search-icon" width="15" height="15" viewBox="0 0 16 16" fill="none">
                <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                className="tb-search-input"
                type="text"
                placeholder="Search by name, group, or GST number…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "800px" }}
              />
              {searchQuery && (
                <>
                  <span className="tb-search-count">{totalResultCount} result{totalResultCount !== 1 ? "s" : ""}</span>
                  <button className="tb-search-clear" onClick={() => setSearchQuery("")}>✕</button>
                </>
              )}
            </div>
          </div>
          <div className="tb-actions">
            <button className="tb-btn print-btn" onClick={() => window.print()}>Print</button>
            {/* <button className="tb-btn" onClick={() => window.print()}>Print Report</button> */}
            <button className="tb-btn excel-btn" onClick={exportToExcel}>Export Excel</button>
          </div>
        </div>

        {loading ? (
          <div className="tb-loading"><div className="tb-spinner" /></div>
        ) : reportData && (
          <>


            <span className="tb-summary-label">Trial Balance Report</span>

            <div className="tb-summary">
              <div className="tb-summary-card cr">
                <span className="tb-summary-label">Total Credit</span>
                <span className="tb-summary-value">₹ {fmt(totals.cr)}</span>
              </div>
              <div className="tb-summary-card dr">
                <span className="tb-summary-label">Total Debit</span>
                <span className="tb-summary-value">₹ {fmt(totals.dr)}</span>
              </div>
            </div>

            <div className="tb-grid">
              <div>
                <div className="tb-col-head cr"><span>Credit Side</span><span>Balance</span></div>
                <ColSection
                  groups={filteredCr}
                  side="cr"
                  searchQuery={searchQuery}
                  openGroups={crOpenGroups}
                  onAcClick={handleAcCodeClick}
                />
              </div>
              <div className="tb-divider" />
              <div>
                <div className="tb-col-head dr"><span>Debit Side</span><span>Balance</span></div>
                <ColSection
                  groups={filteredDr}
                  side="dr"
                  searchQuery={searchQuery}
                  openGroups={drOpenGroups}
                  onAcClick={handleAcCodeClick}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}