import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

const API_BASE = process.env.REACT_APP_API;

const FIELD_MAP = {
  purchase: {
    grade: "Grade",
    qty: "PurcQntl",
    altQty: "Quantal",
    rate: "Purc_Rate",
    millRate: "Mill_Rate",
    partyRate: "Party_Bill_Rate"
  },
  sale: {
    grade: "System_Name_E",
    qty: "Sold",
    lot: "LotSize",
    rate: "Sale_Rate",
    millRate: "Mill_Rate",
    partyRate: "Party_Bill_Rate"
  }
};

const fmt = (n) => {
  const num = parseFloat(n);
  if (isNaN(num)) return "0.00";
  return num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// --- Grouping logic using the FIELD_MAP ---
const groupData = (rows, type) => {
  const fields = FIELD_MAP[type];
  const mills = new Map();

  rows.forEach((r) => {
    const code = r.Mill_Code ?? "?";
    if (!mills.has(code)) {
      mills.set(code, {
        code,
        name: String(r.Short_Name || code), // ✅ always a string
        rows: [],
        totalQty: 0,
        totalLot: 0,
        totalSold: 0
      });
    }
    const m = mills.get(code);
    m.rows.push(r);

    if (type === "purchase") {
      m.totalQty += Number(r[fields.qty] ?? r[fields.altQty] ?? 0);
    } else {
      m.totalLot += Number(r[fields.lot] ?? 0);
      m.totalSold += Number(r[fields.qty] ?? 0);
    }
  });

  return Array.from(mills.values()).sort((a, b) =>
    String(a.name).localeCompare(String(b.name)) // ✅ double safety
  );
};

// --- Styles ---
const TH_STYLE = {
  padding: "8px 10px",
  fontSize: "13px",
  color: "#475569",
  textAlign: "left",
  borderBottom: "2px solid #cbd5e1",
  fontWeight: "800",
  textTransform: "uppercase",
  backgroundColor: "#f8fafc"
};

const TD_STYLE = {
  padding: "8px 10px",
  fontSize: "14px",
  borderBottom: "1px solid #e2e8f0",
  fontWeight: "600",
  color: "#1e293b"
};

// --- MillCard updated to use the dynamic fields ---
const MillCard = ({ mill, type }) => {
  const f = FIELD_MAP[type]; // Get the correct field names

  return (
    <div style={{
      background: "#fff",
      marginBottom: "8px",
      border: "2px solid #cbd5e1",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      borderRadius: "4px"
    }}>
      <div style={{
        background: type === "purchase" ? "#dbeafe" : "#dcfce7",
        padding: "10px 15px",
        display: "flex",
        justifyContent: "space-between",
        borderBottom: "2px solid #cbd5e1"
      }}>
        <span style={{ fontWeight: "900", fontSize: "16px", color: "#0f172a" }}>
          {mill.name} - (Tender No - {mill.rows[0]?.Tender_No || "—"})
        </span>
        <span style={{ fontSize: "14px", fontWeight: "900", color: "#1e293b" }}>
          {type === "purchase"
            ? `Total: ${fmt(mill.totalQty)} Qntl`
            : `Sold: ${fmt(mill.totalSold)} Qntl`}
        </span>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ ...TH_STYLE, textAlign: "left" }}>Grade</th>
            <th style={{ ...TH_STYLE, textAlign: "left" }}>Mill Name</th>
            <th style={{ ...TH_STYLE, textAlign: "left" }}>Season</th>
            <th style={{ ...TH_STYLE, textAlign: "right" }}>Mill Rate</th>
            <th style={{ ...TH_STYLE, textAlign: "right" }}>Purc Rate</th>
            {type === "sale" && (
              <th style={{ ...TH_STYLE, textAlign: "right" }}>Sale Rate</th>
            )}
            {type === "purchase" ? (
              <th style={{ ...TH_STYLE, textAlign: "right" }}>Quantity</th>
            ) : (
              <>
                <th style={{ ...TH_STYLE, textAlign: "right" }}>Lot</th>
                <th style={{ ...TH_STYLE, textAlign: "right" }}>Sold</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {mill.rows.map((r, i) => (
            <tr key={i}>
              {/* Uses f.grade to handle "Grade" vs "System_Name_E" */}
              <td style={{ ...TD_STYLE, textAlign: "left", fontFamily: "monospace" }}>{r[f.grade] || "—"}</td>
              <td style={{ ...TD_STYLE, textAlign: "left", fontFamily: "monospace" }}>{r.do || "—"}</td>
              <td style={{ ...TD_STYLE, textAlign: "left", fontFamily: "monospace" }}>{r.season || "—"}</td>
              <td style={{ ...TD_STYLE, textAlign: "right", fontFamily: "monospace" }}>{fmt(r[f.millRate])}</td>
              <td style={{ ...TD_STYLE, textAlign: "right", fontFamily: "monospace" }}>{fmt(r[f.partyRate])}</td>
              {type === "sale" && (
                <td style={{ ...TD_STYLE, textAlign: "right", fontFamily: "monospace" }}>{fmt(r.Sale_Rate)}</td>
              )}
              {type === "purchase" ? (
                <td style={{ ...TD_STYLE, textAlign: "right", color: "#2563eb" }}>
                  {fmt(r[f.qty] || r[f.altQty])}
                </td>
              ) : (
                <>
                  <td style={{ ...TD_STYLE, textAlign: "right", color: "#64748b" }}>{fmt(r[f.lot])}</td>
                  <td style={{ ...TD_STYLE, textAlign: "right", color: "#059669" }}>{fmt(r[f.qty])}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function EnhancedReport({ toDate }) {
  const [data, setData] = useState({ pRows: [], sRows: [] });
  const [loading, setLoading] = useState(false);
  const companyCode = sessionStorage.getItem("Company_Code");
  const Company_Name = sessionStorage.getItem("Company_Name") || "Company";

  useEffect(() => {
    if (!toDate || !companyCode) return;
    setLoading(true);
    Promise.all([
      axios.get(`${API_BASE}/dailypurchase-report`, { params: { Company_Code: companyCode, Selected_Date: toDate } }),
      axios.get(`${API_BASE}/getallsauda`, { params: { Company_Code: companyCode, Selected_Date: toDate } }),
    ]).then(([p, s]) => {
      setData({ pRows: p.data.get_allTenders || [], sRows: s.data.get_live_tenders || [] });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [toDate, companyCode]);

  const pMills = useMemo(() => groupData(data.pRows, "purchase"), [data.pRows]);
  const sMills = useMemo(() => groupData(data.sRows, "sale"), [data.sRows]);

  const grandPurch = pMills.reduce((acc, m) => acc + m.totalQty, 0);
  const grandSold = sMills.reduce((acc, m) => acc + m.totalSold, 0);
  const grandLot = sMills.reduce((acc, m) => acc + m.totalLot, 0);

  const handleExportXLSX = () => {
    const wb = XLSX.utils.book_new();
    const pf = FIELD_MAP.purchase;
    const sf = FIELD_MAP.sale;

    const pSheetData = [
      ["PURCHASE REPORT"], [`Date: ${toDate} | Company: ${Company_Name}`], [],
      ["Mill Name", "Grade", "DO No", "Season", "Mill Rate", "Purchase Rate", "Quantity (Qntl)"]
    ];
    pMills.forEach(m => {
      m.rows.forEach(r => pSheetData.push([m.name, r[pf.grade] || "—", r.do || "—", r.season || "—", parseFloat(r[pf.millRate]) || 0, parseFloat(r[pf.partyRate]) || 0, parseFloat(r[pf.qty] || r[pf.altQty]) || 0]));
      pSheetData.push([`TOTAL FOR ${m.name}`, "", "", "", "", "", parseFloat(m.totalQty)], []);
    });
    pSheetData.push(["GRAND TOTAL PURCHASE", "", "", "", "", "", parseFloat(grandPurch)]);

    const sSheetData = [
      ["SALE REPORT"], [`Date: ${toDate} | Company: ${Company_Name}`], [],
      ["Mill Name", "Grade", "DO No", "Season", "Mill Rate", "Purchase Rate", "Lot (Qntl)", "Sold (Qntl)"]
    ];
    sMills.forEach(m => {
      m.rows.forEach(r => sSheetData.push([m.name, r[sf.grade] || "—", r.do || "—", r.season || "—", parseFloat(r[sf.millRate]) || 0, parseFloat(r[sf.partyRate]) || 0, parseFloat(r[sf.lot]) || 0, parseFloat(r[sf.qty]) || 0]));
      sSheetData.push([`TOTAL FOR ${m.name}`, "", "", "", "", "", parseFloat(m.totalLot), parseFloat(m.totalSold)], []);
    });
    sSheetData.push(["GRAND TOTAL SALE", "", "", "", "", "", parseFloat(grandLot), parseFloat(grandSold)]);

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(pSheetData), "Daily Purchase");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sSheetData), "Daily Sale");
    XLSX.writeFile(wb, `DailyReport_${toDate}.xlsx`);
  };

  const handlePrint = () => {
    const generateMillSection = (mill, type) => {
      const f = FIELD_MAP[type];
      const rows = mill.rows.map(row => `
        <tr>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">${row[f.grade] || "—"}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">${row.do || "—"}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">${row.season || "—"}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">${fmt(row[f.millRate])}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">${fmt(row[f.partyRate])}</td>
          ${type === "purchase"
          ? `<td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;">${fmt(row[f.qty] || row[f.altQty])}</td>`
          : `<td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">${fmt(row[f.lot])}</td>
             <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;">${fmt(row[f.qty])}</td>`
        }
        </tr>
      `).join("");

      return `
        <div style="margin-bottom:20px;border:1px solid #cbd5e1;border-radius:6px;break-inside:avoid;">
          <div style="background:${type === "purchase" ? "#dbeafe" : "#dcfce7"};padding:8px 12px;display:flex;justify-content:space-between;border-bottom:2px solid #cbd5e1;">
            <strong style="font-size:14px;">${mill.name}</strong>
            <span>${type === "purchase" ? `Total: ${fmt(mill.totalQty)} Qntl` : `Sold: ${fmt(mill.totalSold)} Qntl`}</span>
          </div>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:6px 8px;text-align:left;font-size:11px;">Grade</th>
                <th style="padding:6px 8px;text-align:left;font-size:11px;">DO No</th>
                <th style="padding:6px 8px;text-align:left;font-size:11px;">Season</th>
                <th style="padding:6px 8px;text-align:right;font-size:11px;">Mill Rate</th>
                <th style="padding:6px 8px;text-align:right;font-size:11px;">Purc Rate</th>
                ${type === "purchase"
          ? '<th style="padding:6px 8px;text-align:right;font-size:11px;">Qty (Qntl)</th>'
          : '<th style="padding:6px 8px;text-align:right;font-size:11px;">Lot (Qntl)</th><th style="padding:6px 8px;text-align:right;font-size:11px;">Sold (Qntl)</th>'
        }
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    };

    const purchaseSections = pMills.map(m => generateMillSection(m, "purchase")).join("");
    const saleSections = sMills.map(m => generateMillSection(m, "sale")).join("");

    const win = window.open("", "_blank", "width=1200,height=800");
    win.document.write(`
      <html>
        <head>
          <title>Daily Report - ${toDate}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; background: #fff; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { font-size: 18px; margin-bottom: 4px; }
            .header h3 { font-size: 14px; font-weight: normal; color: #555; }
            .section-title { font-size: 16px; font-weight: bold; margin: 20px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #333; }
            .totals { display: flex; gap: 20px; justify-content: center; margin: 15px 0; }
            .total-box { padding: 8px 20px; border-radius: 8px; text-align: center; }
            .total-box.purchase { background: #dbeafe; }
            .total-box.sale { background: #dcfce7; }
            .total-box .label { font-size: 11px; font-weight: bold; text-transform: uppercase; }
            .total-box .value { font-size: 18px; font-weight: bold; }
            @media print { body { padding: 10px; } .no-print { display: none; } .total-box { border: 1px solid #ccc; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${Company_Name}</h1>
            <h3>Daily Purchase & Sale Report</h3>
            <h3>Date: ${toDate}</h3>
          </div>
          <div class="totals">
            <div class="total-box purchase"><div class="label">TOTAL PURCHASE</div><div class="value">${fmt(grandPurch)} Qntl</div></div>
            <div class="total-box sale"><div class="label">TOTAL SALE</div><div class="value">${fmt(grandSold)} Qntl</div></div>
          </div>
          <div class="section-title">📥 PURCHASE DETAILS</div>
          ${purchaseSections || "<p>No purchase data available.</p>"}
          <div class="section-title" style="margin-top:30px;">📤 SALE DETAILS</div>
          ${saleSections || "<p>No sale data available.</p>"}
          <div style="text-align:center; margin-top:30px; font-size:10px; color:#999;">Generated on ${new Date().toLocaleString()}</div>
        </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  if (loading) return <div style={{ padding: "40px", fontSize: "20px", fontWeight: "bold" }}>Loading Report Data...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#cbd5e1" }}>
      <div style={{ background: "#fff", padding: "10px 16px", display: "flex", justifyContent: "flex-end", gap: "10px", borderBottom: "1px solid #cbd5e1", flexShrink: 0 }}>
        <button onClick={handleExportXLSX} disabled={loading || (pMills.length === 0 && sMills.length === 0)} style={{ padding: "8px 18px", borderRadius: "6px", border: "none", background: "#22c55e", color: "#fff", fontWeight: "700", fontSize: "13px", cursor: "pointer", opacity: (loading || (pMills.length === 0 && sMills.length === 0)) ? 0.5 : 1 }}>⬇ Export XLSX</button>
        <button onClick={handlePrint} disabled={loading || (pMills.length === 0 && sMills.length === 0)} style={{ padding: "8px 18px", borderRadius: "6px", border: "none", background: "#64748b", color: "#fff", fontWeight: "700", fontSize: "13px", cursor: "pointer", opacity: (loading || (pMills.length === 0 && sMills.length === 0)) ? 0.5 : 1 }}>🖨 Print</button>
      </div>

      <div style={{ display: "flex", flex: 1, gap: "5px", overflow: "hidden", padding: "5px" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#f1f5f9", borderRadius: "8px" }}>
          <div style={{ background: "#1e3a8a", color: "#fff", padding: "15px", borderRadius: "8px 8px 0 0" }}>
            <div style={{ fontSize: "14px", fontWeight: "700", opacity: 0.9 }}>TOTAL DAILY PURCHASE</div>
            <div style={{ fontSize: "24px", fontWeight: "900" }}>{fmt(grandPurch)} <span style={{ fontSize: "14px" }}>Qntl</span></div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
            {pMills.length === 0 ? <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>No purchase data available</div> : pMills.map(m => <MillCard key={m.code} mill={m} type="purchase" />)}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#f1f5f9", borderRadius: "8px" }}>
          <div style={{ background: "#065f46", color: "#fff", padding: "15px", borderRadius: "8px 8px 0 0" }}>
            <div style={{ fontSize: "14px", fontWeight: "700", opacity: 0.9 }}>TOTAL DAILY SALE</div>
            <div style={{ fontSize: "24px", fontWeight: "900" }}>Sold: {fmt(grandSold)} <span style={{ fontSize: "14px" }}>Qntl</span></div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
            {sMills.length === 0 ? <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>No sale data available</div> : sMills.map(m => <MillCard key={m.code} mill={m} type="sale" />)}
          </div>
        </div>
      </div>
    </div>
  );
}