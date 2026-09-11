

import React, { useState, useEffect, useMemo, useRef } from "react";
import { MagnifyingGlassIcon, CalendarDaysIcon, ChevronRightIcon, InboxIcon } from "@heroicons/react/20/solid";
import * as XLSX from "xlsx";

const API_BASE = process.env.REACT_APP_API;
const fmt = (n) => (n == null ? "0" : Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 }));
const fmtPL = (n) => {
    if (n == null) return "—";
    const abs = Math.abs(Number(n)).toLocaleString("en-IN", { maximumFractionDigits: 2 });
    return n >= 0 ? `+₹${abs}` : `-₹${abs}`;
};

const COLS = [
    { key: "Tender_No", label: "Tender No", align: "center" },
    { key: "buyerName", label: "Buyer Name", align: "left", cls: "font-medium text-blue-700" },
    { key: "Grade", label: "Grade", align: "left" },
    { key: "season", label: "Season", align: "center" },
    { key: "Mill_Rate", label: "Mill Rate", align: "right", render: v => `₹${fmt(v)}`, cls: "font-mono text-amber-700" },
    { key: "Sale_Rate", label: "Sale Rate", align: "right", render: v => `₹${fmt(v)}`, cls: "font-mono text-emerald-700 font-medium" },
    { key: "Qntl", label: "Quintal (Qntl)", align: "right", cls: "font-mono font-medium text-slate-800" },
    { key: "__pl", label: "Profit / Loss", align: "right", isPL: true },
];

// ── Compute P&L for a single row
function rowPL(row) {
    return (Number(row.Sale_Rate || 0) - Number(row.Mill_Rate || 0)) * Number(row.Qntl || 0);
}


function triggerPrint(groupedData, grandQty, grandPL, totalRec, selectedDate) {
    const win = window.open("", "_blank", "width=1100,height=800");
    if (!win) { alert("Please allow pop-ups for this page to use Print."); return; }

    // Build rows HTML for a grade table
    function buildTableRows(items) {
        return items.map((row, i) => {
            const pl = rowPL(row);
            const plTxt = fmtPL(pl);
            const plClr = pl > 0 ? "#047857" : pl < 0 ? "#dc2626" : "#94a3b8";
            return `
            <tr style="border-bottom:1px solid #f1f5f9">
              <td style="padding:7px 10px;font-size:11px;color:#94a3b8;text-align:center">${i + 1}</td>
              <td style="padding:7px 10px;font-size:12px;color:#475569">${row.Tender_No ?? "—"}</td>
              <td style="padding:7px 10px;font-size:12px;color:#1d4ed8;font-weight:500">${row.buyerName ?? "—"}</td>
              <td style="padding:7px 10px;font-size:12px;color:#475569">${row.Grade ?? "—"}</td>
              <td style="padding:7px 10px;font-size:12px;color:#475569;text-align:center">${row.season ?? "—"}</td>
              <td style="padding:7px 10px;font-size:12px;color:#b45309;text-align:right;font-family:monospace">₹${fmt(row.Mill_Rate)}</td>
              <td style="padding:7px 10px;font-size:12px;color:#047857;font-weight:500;text-align:right;font-family:monospace">₹${fmt(row.Sale_Rate)}</td>
              <td style="padding:7px 10px;font-size:12px;color:#1e293b;text-align:right;font-family:monospace">${fmt(row.Qntl)}</td>
              <td style="padding:7px 10px;font-size:12px;color:${plClr};font-weight:500;text-align:right;font-family:monospace">${plTxt}</td>
            </tr>`;
        }).join("");
    }

    // Build each mill block
    function buildMillBlock(mill) {
        const gradeBlocks = Object.values(mill.grades).map(grade => {
            const plClr = grade.subPL >= 0 ? "#047857" : "#dc2626";
            return `
            <div style="margin:0 16px 16px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
              <div style="background:#eff6ff;padding:8px 14px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #bfdbfe">
                <span style="font-size:11px;font-weight:600;color:#1e40af;text-transform:uppercase;letter-spacing:.05em">
                  Grade: <strong style="color:#1e3a8a">${grade.name}</strong>
                </span>
                <div style="display:flex;gap:12px">
                  <span style="font-size:11px;font-weight:600;background:#dbeafe;color:#1e40af;padding:2px 10px;border-radius:6px">${fmt(grade.subQty)} Qntl</span>
                  <span style="font-size:11px;font-weight:600;background:${grade.subPL >= 0 ? "#d1fae5" : "#fee2e2"};color:${plClr};padding:2px 10px;border-radius:6px">${fmtPL(grade.subPL)}</span>
                </div>
              </div>
              <table style="width:100%;border-collapse:collapse;table-layout:fixed">
                <colgroup>
                  <col style="width:36px"><col style="width:9%"><col style="width:18%"><col style="width:8%">
                  <col style="width:9%"><col style="width:10%"><col style="width:10%"><col style="width:9%"><col style="width:13%">
                </colgroup>
                <thead>
                  <tr style="background:#f8fafc;border-bottom:1px solid #e2e8f0">
                    <th style="padding:7px 10px;font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase;text-align:center">#</th>
                    <th style="padding:7px 10px;font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase;text-align:left">Tender</th>
                    <th style="padding:7px 10px;font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase;text-align:left">Buyer Name</th>
                    <th style="padding:7px 10px;font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase;text-align:left">Grade</th>
                    <th style="padding:7px 10px;font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase;text-align:center">Season</th>
                    <th style="padding:7px 10px;font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase;text-align:right">Mill Rate</th>
                    <th style="padding:7px 10px;font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase;text-align:right">Sale Rate</th>
                    <th style="padding:7px 10px;font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase;text-align:right">Quintal (Qntl)</th>
                    <th style="padding:7px 10px;font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase;text-align:right">Profit / Loss</th>
                  </tr>
                </thead>
                <tbody>${buildTableRows(grade.items)}</tbody>
              </table>
            </div>`;
        }).join("");

        const millPlClr = mill.totalPL >= 0 ? "#34d399" : "#f87171";
        return `
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:16px;page-break-inside:avoid">
          <div style="background:#0c447c;padding:10px 16px;display:flex;justify-content:space-between;align-items:center">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:13px;font-weight:600;color:#e0f2fe">${mill.name}</span>
              <span style="font-size:10px;background:rgba(255,255,255,.15);color:#93c5fd;padding:2px 8px;border-radius:5px">${mill.code}</span>
            </div>
            <div style="display:flex;gap:20px">
              <div style="text-align:right">
                <div style="font-size:9px;color:#93c5fd;text-transform:uppercase;letter-spacing:.06em">Total Qntl</div>
                <div style="font-size:13px;font-family:monospace;font-weight:600;color:#bfdbfe">${fmt(mill.totalQty)} Qntl</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:9px;color:#93c5fd;text-transform:uppercase;letter-spacing:.06em">P&L</div>
                <div style="font-size:13px;font-family:monospace;font-weight:600;color:${millPlClr}">${fmtPL(mill.totalPL)}</div>
              </div>
            </div>
          </div>
          <div style="padding-top:14px">${gradeBlocks}</div>
        </div>`;
    }

    const grandPlClr = grandPL >= 0 ? "#34d399" : "#f87171";
    const allMillsHTML = groupedData.map(buildMillBlock).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Daily Sauda Report — ${selectedDate}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;background:#f1f5f9;padding:20px;color:#1e293b}
    @page{margin:12mm 10mm;size:A4 landscape}
    @media print{
      body{background:#fff;padding:0}
      .no-print{display:none!important}
      div{page-break-inside:auto}
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:right;margin-bottom:16px">
    <button onclick="window.print()" style="background:#0c447c;color:#fff;border:none;padding:8px 20px;border-radius:8px;font-size:13px;cursor:pointer;font-weight:600">
      Print / Save as PDF
    </button>
  </div>

  <!-- Summary banner -->
  <div style="background:#0c447c;border-radius:12px;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
    <div>
      <div style="font-size:10px;color:#93c5fd;text-transform:uppercase;letter-spacing:.08em">Daily Sauda Report</div>
      <div style="font-size:14px;font-weight:600;color:#e0f2fe;margin-top:2px">${selectedDate} &nbsp;·&nbsp; ${groupedData.length} Mills &nbsp;·&nbsp; ${totalRec} Records</div>
    </div>
    <div style="display:flex;gap:28px">
      <div style="text-align:right">
        <div style="font-size:9px;color:#93c5fd;text-transform:uppercase;letter-spacing:.06em">Grand Total Qntl</div>
        <div style="font-size:20px;font-family:monospace;font-weight:700;color:#bfdbfe">${fmt(grandQty)} <span style="font-size:12px">Qntl</span></div>
      </div>
      <div style="text-align:right">
        <div style="font-size:9px;color:#93c5fd;text-transform:uppercase;letter-spacing:.06em">Grand P&L</div>
        <div style="font-size:20px;font-family:monospace;font-weight:700;color:${grandPlClr}">${fmtPL(grandPL)}</div>
      </div>
    </div>
  </div>

  <!-- Mill blocks -->
  ${allMillsHTML}
</body>
</html>`;

    win.document.write(html);
    win.document.close();
    // Small delay so fonts/layout settle before print dialog opens
    setTimeout(() => win.print(), 600);
}


export default function DailySaudaReport() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedDate, setSelectedDate] = useState(() => new Date().toLocaleDateString("en-CA"));
    const [expandedMills, setExpandedMills] = useState(new Set());
    const printRef = useRef(null);

    const companyCode = sessionStorage.getItem("Company_Code");
    const yearCode = sessionStorage.getItem("Year_Code");

    useEffect(() => { if (selectedDate && companyCode) fetchData(); }, [selectedDate, companyCode]);

    async function fetchData() {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/getallsauda?Company_Code=${companyCode}&Year_Code=${yearCode}&Selected_Date=${selectedDate}`);
            const data = await res.json();
            const all = data.get_live_tenders || [];
            setRows(all);
            setExpandedMills(new Set(all.map(r => r.Mill_Full_Name)));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    // ── Grouped data
    const groupedData = useMemo(() => {
        const q = search.toLowerCase();
        const filtered = q ? rows.filter(r => Object.values(r).some(v => String(v ?? "").toLowerCase().includes(q))) : rows;
        const groups = {};
        filtered.forEach(row => {
            const mill = row.Mill_Full_Name || "Unknown Mill";
            const code = row.Mill_Code || "N/A";
            const grade = row.Grade || "No Grade";
            if (!groups[mill]) groups[mill] = { name: mill, code, grades: {}, totalQty: 0, totalPL: 0 };
            if (!groups[mill].grades[grade]) groups[mill].grades[grade] = { name: grade, items: [], subQty: 0, subPL: 0 };
            const pl = rowPL(row);
            groups[mill].grades[grade].items.push(row);
            groups[mill].grades[grade].subQty += Number(row.Qntl || 0);
            groups[mill].grades[grade].subPL += pl;
            groups[mill].totalQty += Number(row.Qntl || 0);
            groups[mill].totalPL += pl;
        });
        return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
    }, [rows, search]);

    // ── Grand totals
    const grandQty = groupedData.reduce((s, m) => s + m.totalQty, 0);
    const grandPL = groupedData.reduce((s, m) => s + m.totalPL, 0);
    const totalRec = groupedData.reduce((s, m) =>
        s + Object.values(m.grades).reduce((a, g) => a + g.items.length, 0), 0);

    function toggleMill(name) {
        const next = new Set(expandedMills);
        next.has(name) ? next.delete(name) : next.add(name);
        setExpandedMills(next);
    }

    // ── Excel export
    function handleExportExcel() {
        const wb = XLSX.utils.book_new();
        const sheetData = [];

        // Title row
        sheetData.push([`Daily Sauda Report — ${selectedDate}`]);
        sheetData.push([`Grand Total Qty: ${fmt(grandQty)} Qt`, "", `Grand P&L: ${fmtPL(grandPL)}`]);
        sheetData.push([]);

        groupedData.forEach(mill => {
            sheetData.push([`Mill: ${mill.name}`, `Code: ${mill.code}`, "", "", "", "", `Total Qty: ${fmt(mill.totalQty)}`, `Total P&L: ${fmtPL(mill.totalPL)}`]);
            Object.values(mill.grades).forEach(grade => {
                sheetData.push([`  Grade: ${grade.name}`, "", "", "", "", "", `Grade Qty: ${fmt(grade.subQty)}`, `Grade P&L: ${fmtPL(grade.subPL)}`]);
                sheetData.push(["  #", "Tender No", "Buyer Name", "Season", "Mill Rate (₹)", "Sale Rate (₹)", "Qty (Qt)", "Profit / Loss (₹)"]);
                grade.items.forEach((row, i) => {
                    const pl = rowPL(row);
                    sheetData.push([
                        i + 1,
                        row.Tender_No ?? "—",
                        row.buyerName ?? "—",
                        row.season ?? "—",
                        Number(row.Mill_Rate || 0),
                        Number(row.Sale_Rate || 0),
                        Number(row.Qntl || 0),
                        pl,
                    ]);
                });
                sheetData.push([]);
            });
            sheetData.push([]);
        });

        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        ws["!cols"] = [10, 16, 22, 10, 14, 14, 12, 18].map(w => ({ wch: w }));
        XLSX.utils.book_append_sheet(wb, ws, "Sauda Report");
        XLSX.writeFile(wb, `Sauda_Report_${selectedDate}.xlsx`);
    }

    // ── Print
    function handlePrint() {
        triggerPrint(groupedData, grandQty, grandPL, totalRec, selectedDate);
    }

    // ── P&L cell style
    function plClass(val) {
        if (val > 0) return "font-mono text-emerald-700 font-medium";
        if (val < 0) return "font-mono text-red-600 font-medium";
        return "font-mono text-slate-400";
    }

    return (
        <>
            {/* ── PRINT STYLES (injected into <head> via style tag) ── */}
            <style>{`
                @media print {
                    body * { visibility: hidden !important; }
                    #sauda-print-area, #sauda-print-area * { visibility: visible !important; }
                    #sauda-print-area { position: absolute; top: 0; left: 0; width: 100%; }
                    .no-print { display: none !important; }
                    table { border-collapse: collapse; width: 100%; font-size: 10px; }
                    th, td { border: 0.5px solid #cbd5e1; padding: 4px 6px; }
                    thead th { background: #1e3a5f !important; color: white !important; -webkit-print-color-adjust: exact; }
                    .mill-print-header { background: #1e3a5f !important; color: white !important; padding: 6px 10px; font-weight: 600; -webkit-print-color-adjust: exact; }
                    .grade-print-header { background: #dbeafe !important; padding: 4px 10px; font-size: 10px; -webkit-print-color-adjust: exact; }
                    .profit { color: #047857 !important; }
                    .loss   { color: #dc2626 !important; }
                    @page { margin: 12mm 10mm; size: A4 landscape; }
                }
            `}</style>

            <div id="sauda-print-area" className="flex flex-col min-h-screen bg-slate-100 antialiased">
                {/* ── TOP BAR ── */}
                <div className="no-print bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between gap-6 sticky top-0 z-50">

                    {/* 1. LEFT SIDE: Title & Date Picker */}
                    <div className="flex items-center gap-4 shrink-0">
                        <div>
                            <p className="text-[15px] font-medium text-slate-900 leading-tight">Daily Sauda Report</p>
                        </div>
                        <div className="w-px h-7 bg-slate-200" />
                        <label className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 cursor-pointer">
                            <CalendarDaysIcon className="w-[14px] h-[14px] text-blue-700 shrink-0" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                className="text-[12px] font-medium text-slate-700 bg-transparent outline-none cursor-pointer"
                            />
                        </label>
                    </div>

                    {/* 2. CENTER: Large Search Bar */}
                    <div className="flex-1 max-w-xl">
                        <label className="flex items-center gap-3 border border-slate-300 rounded-xl px-4 py-2 bg-slate-50 shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 focus-within:bg-white">
                            <MagnifyingGlassIcon className="w-5 h-5 text-slate-400" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search sauda…"
                                className="text-sm bg-transparent outline-none w-full text-slate-700 placeholder:text-slate-400"
                            />
                        </label>
                    </div>

                    {/* 3. RIGHT SIDE: Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Export Excel */}
                        <button onClick={handleExportExcel}
                            className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium border border-emerald-300 text-emerald-700 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors whitespace-nowrap">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                            Export
                        </button>

                        {/* Print */}
                        <button onClick={handlePrint}
                            className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium border border-slate-300 text-slate-700 rounded-lg bg-white hover:bg-slate-50 transition-colors whitespace-nowrap">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" /></svg>
                            Print
                        </button>
                    </div>
                </div>


                {/* ── GRAND SUMMARY BANNER (visible always, print-friendly) ── */}
                <div className="mx-4 mt-4 mb-2 bg-[#0C447C] text-white rounded-xl px-5 py-3 flex items-center justify-between flex-wrap gap-3">
                    <div>


                    </div>
                    <div className="flex gap-6">
                        <div className="text-right">
                            <p className="text-[10px] text-blue-300 uppercase tracking-widest">Total Qntl</p>
                            <p className="font-mono text-[18px] font-medium text-blue-100">{fmt(grandQty)} <span className="text-[11px]">Qntl</span></p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-blue-300 uppercase tracking-widest">Total Daily Profit &amp; Loss</p>
                            <p className={`font-mono text-[18px] font-medium ${grandPL >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                                {fmtPL(grandPL)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── CONTENT ── */}
                <div className="flex-1 overflow-auto p-4 flex flex-col gap-3 "  style={{marginBottom:"50px" }}>
                    {loading ? (
                        <div className="flex justify-center items-center h-48 text-slate-400 text-sm animate-pulse">
                            Processing sauda…
                        </div>
                    ) : groupedData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-2 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm bg-white">
                            <InboxIcon className="w-8 h-8 opacity-25" />
                            No records found for this date.
                        </div>
                    ) : groupedData.map(mill => (
                        <div key={mill.name} className="bg-white rounded-xl border border-slate-200 overflow-hidden">

                            {/* Mill header */}
                            <div
                                onClick={() => toggleMill(mill.name)}
                                className="mill-print-header flex items-center justify-between px-4 py-2.5 bg-[#0C447C] cursor-pointer hover:bg-[#185FA5] transition-colors no-print"
                            >
                                <div className="flex items-center gap-2">
                                    <ChevronRightIcon className={`w-[14px] h-[14px] text-blue-300 shrink-0 transition-transform duration-200 ${expandedMills.has(mill.name) ? "rotate-90" : ""}`} />
                                    <span className="text-[13px] font-medium text-blue-50">{mill.name}</span>
                                    <span className="text-[10px] bg-white/10 text-blue-300 px-2 py-0.5 rounded-md ml-1">
                                        {mill.code}
                                    </span>
                                </div>
                                <div className="flex items-center gap-5">
                                    <div className="text-right">
                                        <p className="text-[9px] text-blue-400 uppercase tracking-wide">Total Qntl</p>
                                        <p className="font-mono text-[13px] font-medium text-blue-200">{fmt(mill.totalQty)} Qntl</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] text-blue-400 uppercase tracking-wide">Profit &amp; Loss</p>
                                        <p className={`font-mono text-[13px] font-medium ${mill.totalPL >= 0 ? "text-emerald-300" : "text-red-400"}`}>
                                            {fmtPL(mill.totalPL)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Grade sections */}
                            {expandedMills.has(mill.name) && Object.values(mill.grades).map(grade => (
                                <div key={grade.name} className="border-t border-slate-100">

                                    {/* Grade sub-header */}
                                    <div className="grade-print-header flex items-center justify-between px-4 py-2 bg-blue-50 border-b border-blue-100">
                                        <span className="text-[10px] font-medium text-blue-600 uppercase tracking-wide">
                                            Grade &nbsp;<strong className="text-blue-900">{grade.name}</strong>
                                        </span>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                                                {fmt(grade.subQty)} Qntl
                                            </span>
                                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${grade.subPL >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                                                {fmtPL(grade.subPL)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse" style={{ tableLayout: "fixed"}}>
                                            <colgroup>
                                                <col style={{ width: 32 }} />
                                                <col style={{ width: "9%" }} />
                                                <col style={{ width: "18%" }} />
                                                <col style={{ width: "9%" }} />
                                                <col style={{ width: "9%" }} />
                                                <col style={{ width: "10%" }} />
                                                <col style={{ width: "10%" }} />
                                                <col style={{ width: "9%" }} />
                                                <col style={{ width: "13%" }} />
                                            </colgroup>
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-100">
                                                    <th className="px-3 py-2 text-[10px] font-medium text-slate-400 uppercase text-center">#</th>
                                                    {COLS.map(col => (
                                                        <th key={col.key}
                                                            className={`px-3 py-2 text-[10px] font-medium text-slate-400 uppercase tracking-wide text-${col.align} ${col.isPL ? "text-right" : ""}`}>
                                                            {col.label}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {grade.items.map((row, idx) => {
                                                    const pl = rowPL(row);
                                                    return (
                                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-3 py-2 text-[10px] text-slate-300 text-center">{idx + 1}</td>
                                                            {COLS.map(col => {
                                                                if (col.isPL) {
                                                                    return (
                                                                        <td key="__pl" className={`px-3 py-2 text-[12px] text-right ${plClass(pl)}`}>
                                                                            {fmtPL(pl)}
                                                                        </td>
                                                                    );
                                                                }
                                                                return (
                                                                    <td key={col.key} className={`px-3 py-2 text-[12px] text-${col.align} ${col.cls || "text-slate-600"}`}>
                                                                        <span className="block truncate">
                                                                            {col.render ? col.render(row[col.key]) : (row[col.key] ?? "—")}
                                                                        </span>
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}