// import { useState, useEffect, useMemo, useRef } from "react";
// import {
//   MagnifyingGlassIcon,
//   ArrowPathIcon,
//   ChevronLeftIcon,
//   ChevronRightIcon,
//   ChevronDoubleLeftIcon,
//   ChevronDoubleRightIcon,
//   ChevronUpIcon,
//   ChevronDownIcon,
//   ArrowDownTrayIcon,
//   PrinterIcon,
// } from "@heroicons/react/20/solid";
// import * as XLSX from "xlsx";

// const API_BASE = process.env.REACT_APP_API;
// const PAGE_SIZE = 1500;

// const NUM_COLS = new Set(["Mill_Code", "Quantal", "Mill_Rate", "soldqty", "selfbalance", "AccountBalance"]);

// const fmt = (n) => (n == null ? "—" : Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 }));

// const fmtDate = (d) => {
//   if (!d) return "—";
//   return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
// };

// function BalBadge({ amount, label }) {
//   if (amount == null || amount === 0) return <span className="text-slate-300">—</span>;
//   const isDr = label === "Dr";
//   return (
//     <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ring-1 ring-inset ${isDr ? "bg-red-50 text-red-700 ring-red-600/10" : "bg-emerald-50 text-emerald-700 ring-emerald-600/10"}`}>
//       {fmt(Math.abs(amount))} {label}
//     </span>
//   );
// }

// function LoadingSkeleton() {
//   return (
//     <>
//       {[...Array(12)].map((_, idx) => (
//         <tr key={idx} className="border-b border-slate-50">
//           <td className="px-3 py-3"><div className="h-3 bg-slate-100 rounded w-6 mx-auto animate-pulse"></div></td>
//           {[...Array(9)].map((_, i) => (
//             <td key={i} className="px-3 py-3">
//               <div className="h-3 bg-slate-100 rounded animate-pulse w-full"></div>
//             </td>
//           ))}
//         </tr>
//       ))}
//     </>
//   );
// }

// const COLS = [
//   { key: "Tender_No", label: "Tender #", align: "left", width: "80px" },
//   { key: "Tender_Date", label: "Date", align: "left", width: "100px", render: v => fmtDate(v) },
//   { key: "Mill_Rate", label: "Mill Rate", align: "right", width: "90px", render: v => v != null ? `₹${fmt(v)}` : "—", cls: "font-mono font-bold text-slate-900" },
//   { key: "Quantal", label: "Quantal", align: "right", width: "100px", cls: "font-mono font-bold text-slate-900" },
//   { key: "soldqty", label: "Sold Quantity", align: "right", width: "90px", cls: "font-mono text-amber-600 font-medium" },
//   { key: "selfbalance", label: "Stock Balance", align: "right", width: "100px", cls: "font-mono text-emerald-600 font-bold" },
//   { key: "millshortname", label: "Mill Name", align: "left", width: "220px", cls: "whitespace-normal break-words leading-normal text-slate-900 font-medium" },
//   { key: "tenderdoshortname", label: "DO", align: "left", width: "220px", cls: "whitespace-normal break-words leading-normal text-slate-900 font-medium" },
//   { key: "PaymentToShortName", label: "Payment To", align: "left", width: "200px", cls: "whitespace-normal break-words leading-normal" },
//   { key: "Grade", label: "Grade", align: "left", width: "200px", cls: "whitespace-normal break-words leading-normal" },
//   { key: "AccountBalance", label: "Ledger Balance", align: "right", width: "150px", render: (v, r) => <BalBadge amount={v} label={r.AccountBalanceLabel} /> },
// ];

// function getRawValue(col, row) {
//   const v = row[col.key];
//   if (col.key === "Tender_Date") return fmtDate(v);
//   if (col.key === "Mill_Rate") return v != null ? Number(v) : null;
//   if (col.key === "AccountBalance") {
//     const abs = v != null ? Math.abs(Number(v)) : null;
//     const label = row.AccountBalanceLabel || "";
//     return abs != null ? `${fmt(abs)} ${label}` : "—";
//   }
//   if (NUM_COLS.has(col.key)) return v != null ? Number(v) : null;
//   return v ?? "—";
// }

// export default function SelfStockReport() {
//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [search, setSearch] = useState("");
//   const [sort, setSort] = useState({ key: "millshortname", dir: "asc" });
//   const [page, setPage] = useState(1);
//   const printRef = useRef(null);

//   const companyCode = sessionStorage.getItem("Company_Code");

//   useEffect(() => { fetchData(); }, []);

//   async function fetchData() {
//     setLoading(true);
//     try {
//       const res = await fetch(`${API_BASE}/tender-balance-report?Company_Code=${companyCode}`);
//       const data = await res.json();
//       setRows(data || []);
//     } catch (e) { console.error(e); }
//     finally { setLoading(false); }
//   }

//   const sortedData = useMemo(() => {
//     let filtered = rows;
//     if (search) {
//       const q = search.toLowerCase();
//       filtered = rows.filter(r => Object.values(r).some(v => String(v ?? "").toLowerCase().includes(q)));
//     }
//     return [...filtered].sort((a, b) => {
//       const av = a[sort.key] ?? 0;
//       const bv = b[sort.key] ?? 0;
//       let cmp = NUM_COLS.has(sort.key) ? Number(av) - Number(bv) : String(av).localeCompare(String(bv));
//       return sort.dir === "asc" ? cmp : -cmp;
//     });
//   }, [rows, search, sort]);

//   const paged = sortedData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
//   const totalPages = Math.ceil(sortedData.length / PAGE_SIZE);

//   // Totals for UI and Exports
//   const totalQuantal = useMemo(() => sortedData.reduce((sum, r) => sum + (Number(r.Quantal) || 0), 0), [sortedData]);
//   const totalSold = useMemo(() => sortedData.reduce((sum, r) => sum + (Number(r.soldqty) || 0), 0), [sortedData]);
//   const totalStockBal = useMemo(() => sortedData.reduce((sum, r) => sum + (Number(r.selfbalance) || 0), 0), [sortedData]);

//   const handleSort = (key) => {
//     setSort(prev => ({ key, dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc" }));
//   };

//   function handleExportXLSX() {
//     const headers = ["#", ...COLS.map(c => c.label)];
//     const dataRows = sortedData.map((row, i) => [
//       i + 1,
//       ...COLS.map(col => getRawValue(col, row)),
//     ]);

//     const totalRow = [
//       "TOTAL",
//       ...COLS.map(col => {
//         if (col.key === "Quantal") return Number(totalQuantal.toFixed(2));
//         if (col.key === "soldqty") return totalSold;
//         if (col.key === "selfbalance") return totalStockBal;
//         return "";
//       }),
//     ];

//     const wb = XLSX.utils.book_new();
//     const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows, totalRow]);
//     ws["!cols"] = [
//       { wch: 5 }, { wch: 10 }, { wch: 14 }, { wch: 30 }, { wch: 28 }, 
//       { wch: 28 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 18 },
//     ];

//     XLSX.utils.book_append_sheet(wb, ws, "Self Stock Report");
//     XLSX.writeFile(wb, `SelfStockReport_${new Date().toISOString().slice(0, 10)}.xlsx`);
//   }

//   function handlePrint() {
//     const printContent = `
//     <!DOCTYPE html>
//     <html>
//     <head>
//       <title>Self Stock Report - ${new Date().toLocaleDateString()}</title>
//       <style>
//         @page { size: A3 landscape; margin: 15mm; }
//         * { box-sizing: border-box; margin: 0; padding: 0; }
//         body { font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; color: #000; padding: 20px; line-height: 1.4; }
//         .header-container { border-bottom: 4px solid #000; margin-bottom: 20px; padding-bottom: 10px; }
//         h2 { font-size: 32px; text-transform: uppercase; font-weight: 900; }
//         table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 2px solid #000; }
//         thead th { background-color: #dddfe2; color: #111; padding: 12px 8px; text-align: left; font-size: 13px; text-transform: uppercase; border: 1px solid #000; }
//         tbody td { padding: 10px 8px; border: 1px solid #000; vertical-align: middle; word-wrap: break-word; font-size: 12px; }
//         tbody tr:nth-child(even) { background-color: #f2f2f2; }
//         .right { text-align: right; }
//         .bold { font-weight: 700; }
//         .qty-font { font-size: 15px; font-weight: 800; }
//         tfoot td { background-color: #eee; color: #000; font-weight: 900; padding: 12px 10px; border-top: 3px solid #000; font-size: 15px; }
//       </style>
//     </head>
//     <body>
//       <div class="header-container">
//         <h2>Self Stock Report</h2>
//         <div class="meta"><strong>Date:</strong> ${new Date().toLocaleDateString("en-IN", { day: '2-digit', month: 'long', year: 'numeric' })}</div>
//       </div>
//       <table>
//         <thead>
//           <tr>
//             <th style="width: 40px;">#</th><th style="width: 90px;">Tender No</th><th style="width: 100px;">Date</th>
//             <th class="right" style="width: 100px;">Mill Rate</th><th class="right" style="width: 110px;">Quantal</th>
//             <th class="right" style="width: 110px;">Sold Qty</th><th class="right" style="width: 110px;">Stock Balance</th>
//             <th style="width: 180px;">Mill</th><th style="width: 180px;">Payment To</th>
//             <th style="width: 70px; text-align: center;">Grade</th><th class="right" style="width: 150px;">Ledger Bal</th>
//           </tr>
//         </thead>
//         <tbody>
//           ${sortedData.map((row, i) => `
//             <tr>
//               <td style="text-align: center;">${i + 1}</td>
//               <td class="bold">${row.Tender_No ?? "—"}</td>
//               <td class="bold">${fmtDate(row.Tender_Date)}</td>
//               <td class="right">${fmt(row.Mill_Rate)}</td>
//               <td class="right qty-font">${fmt(row.Quantal)}</td>
//               <td class="right qty-font">${fmt(row.soldqty)}</td>
//               <td class="right qty-font">${fmt(row.selfbalance)}</td>
//               <td class="bold">${row.millshortname ?? "—"}</td>
//               <td class="bold">${row.PaymentToShortName ?? "—"}</td>
//               <td class="bold" style="text-align: center;">${row.Grade ?? "—"}</td>
//               <td class="right bold">${(row.AccountBalance == null || row.AccountBalance === 0) ? "—" : `${fmt(Math.abs(row.AccountBalance))} ${row.AccountBalanceLabel}`}</td>
//             </tr>`).join("")}
//         </tbody>
//         <tfoot>
//           <tr>
//             <td colspan="4" style="text-align: right;">Grand Totals:</td>
//             <td class="right">${fmt(totalQuantal)}</td>
//             <td class="right">${fmt(totalSold)}</td>
//             <td class="right">${fmt(totalStockBal)}</td>
//             <td colspan="4"></td>
//           </tr>
//         </tfoot>
//       </table>
//     </body>
//     </html>`;
//     const win = window.open("", "_blank");
//     win.document.write(printContent);
//     win.document.close();
//     setTimeout(() => win.print(), 700);
//   }

//   return (
//     <div className="flex flex-col h-full bg-white animate-in fade-in duration-300">
//       <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 gap-4">
//         <div className="relative w-full max-w-sm">
//           <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
//           <input
//             value={search}
//             onChange={e => { setSearch(e.target.value); setPage(1); }}
//             placeholder="Search stocks..."
//             className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
//           />
//         </div>
//         <div className="flex items-center gap-4">
//           <div className="flex flex-col items-end">
//             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Quantal</span>
//             <span className="text-base font-mono font-bold text-blue-600 leading-none">{fmt(totalQuantal)}</span>
//           </div>
//           <button onClick={handleExportXLSX} disabled={loading || rows.length === 0} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
//             <ArrowDownTrayIcon className="w-4 h-4" /> Export XLSX
//           </button>
//           <button onClick={handlePrint} disabled={loading || rows.length === 0} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
//             <PrinterIcon className="w-4 h-4" /> Print
//           </button>
//         </div>
//       </div>

//       <div className="overflow-x-auto overflow-y-auto no-scrollbar mb-[30px]">
//         <table className="w-full text-[12.5px] border-separate border-spacing-0 table-auto" style={{ minWidth: 1100 }}>
//           <thead className="sticky top-0 z-10 bg-slate-50">
//             <tr>
//               <th className="px-4 py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 w-12">#</th>
//               {COLS.map(col => (
//                 <th key={col.key} style={{ width: col.width }} onClick={() => handleSort(col.key)} className={`px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors ${col.align === "right" ? "text-right" : "text-left"}`}>
//                   <div className={`flex items-center gap-1.5 ${col.align === "right" ? "justify-end" : ""}`}>
//                     {col.label}
//                     <span className="flex flex-col -space-y-1">
//                       <ChevronUpIcon className={`w-3 h-3 ${sort.key === col.key && sort.dir === "asc" ? "text-blue-600" : "text-slate-300"}`} />
//                       <ChevronDownIcon className={`w-3 h-3 ${sort.key === col.key && sort.dir === "desc" ? "text-blue-600" : "text-slate-300"}`} />
//                     </span>
//                   </div>
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-100">
//             {loading ? <LoadingSkeleton /> : paged.length === 0 ? (
//               <tr><td colSpan={12} className="py-20 text-center text-slate-400 italic">No records found...</td></tr>
//             ) : (
//               paged.map((row, i) => (
//                 <tr key={i} className="hover:bg-blue-50/40 transition-colors group">
//                   <td className="px-4 py-2.5 text-center text-slate-300 font-mono text-[11px] border-r border-slate-50">{(page - 1) * PAGE_SIZE + i + 1}</td>
//                   {COLS.map(col => (
//                     <td key={col.key} className={`px-4 py-2.5 ${col.align === "right" ? "text-right" : "text-left"} ${col.cls || "text-slate-600"}`}>
//                       {col.render ? col.render(row[col.key], row) : (row[col.key] ?? "—")}
//                     </td>
//                   ))}
//                 </tr>
//               ))
//             )}
//           </tbody>

//           {/* Table Footer Totals */}
//           {!loading && paged.length > 0 && (
//             <tfoot className="sticky bottom-0 z-10 bg-slate-100 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
//               <tr className="divide-x divide-slate-200">
//                 <td colSpan={4} className="px-4 py-3 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Grand Totals</td>
//                 <td className="px-4 py-3 text-right font-mono font-black text-blue-700 text-sm">{fmt(totalQuantal)}</td>
//                 <td className="px-4 py-3 text-right font-mono font-black text-amber-700 text-sm">{fmt(totalSold)}</td>
//                 <td className="px-4 py-3 text-right font-mono font-black text-emerald-700 text-sm">{fmt(totalStockBal)}</td>
//                 <td colSpan={5} className="bg-slate-50"></td>
//               </tr>
//             </tfoot>
//           )}
//         </table>
//       </div>
//     </div>
//   );
// }

























import { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import {
    MagnifyingGlassIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    ArrowDownTrayIcon,
    PrinterIcon,
} from "@heroicons/react/20/solid";
import * as XLSX from "xlsx";
import { generateReportPDF } from '../../Common/ReportCommon/CommonPDFGenerator';
import HeaderJK from "../../Assets/HeaderJK.png"; 
import FooterJK from "../../Assets/FooterJK.png"; 

const API_BASE = process.env.REACT_APP_API;
const PAGE_SIZE = 1500;

const NUM_COLS = new Set(["Mill_Code", "Quantal", "Mill_Rate", "soldqty", "selfbalance", "AccountBalance"]);

// Formatting Helpers
const formatReadableAmount = (n) => (n == null ? "0.00" : Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const fmt = (n) => (n == null ? "—" : Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 }));
const fmtDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

// UI Components
function BalBadge({ amount, label }) {
    if (amount == null || amount === 0) return <span className="text-slate-300">—</span>;
    const isDr = label === "Dr";
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ring-1 ring-inset ${isDr ? "bg-red-50 text-red-700 ring-red-600/10" : "bg-emerald-50 text-emerald-700 ring-emerald-600/10"}`}>
            {fmt(Math.abs(amount))} {label}
        </span>
    );
}

function LoadingSkeleton() {
    return (
        <>
            {[...Array(12)].map((_, idx) => (
                <tr key={idx} className="border-b border-slate-50">
                    <td className="px-3 py-3"><div className="h-3 bg-slate-100 rounded w-6 mx-auto animate-pulse"></div></td>
                    {[...Array(11)].map((_, i) => (
                        <td key={i} className="px-3 py-3">
                            <div className="h-3 bg-slate-100 rounded animate-pulse w-full"></div>
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

// Column Configuration for Table UI
const COLS = [
    { key: "Tender_No", label: "Tender #", align: "left", width: "80px" },
    { key: "Tender_Date", label: "Date", align: "left", width: "100px", render: v => fmtDate(v) },
    { key: "Mill_Rate", label: "Mill Rate", align: "right", width: "90px", render: v => v != null ? `₹${fmt(v)}` : "—", cls: "font-mono font-bold text-slate-900" },
    { key: "Quantal", label: "Quantal", align: "right", width: "100px", cls: "font-mono font-bold text-slate-900" },
    { key: "soldqty", label: "Sold Quantity", align: "right", width: "90px", cls: "font-mono text-amber-600 font-medium" },
    { key: "selfbalance", label: "Stock Balance", align: "right", width: "100px", cls: "font-mono text-emerald-600 font-bold" },
    { key: "millshortname", label: "Mill Name", align: "left", width: "220px", cls: "whitespace-normal break-words leading-normal text-slate-900 font-medium" },
    { key: "tenderdoshortname", label: "DO", align: "left", width: "220px", cls: "whitespace-normal break-words leading-normal text-slate-900 font-medium" },
    { key: "PaymentToShortName", label: "Payment To", align: "left", width: "200px", cls: "whitespace-normal break-words leading-normal" },
    { key: "Grade", label: "Grade", align: "left", width: "100px", cls: "whitespace-normal break-words leading-normal" },
    { key: "AccountBalance", label: "Ledger Balance", align: "right", width: "150px", render: (v, r) => <BalBadge amount={v} label={r.AccountBalanceLabel} /> },
];

// PDF Printing Configuration
const PRINT_COLUMNS = [
    { key: "Tender_No", label: "Tender No", numeric: false },
    { key: "Tender_Date", label: "Date", numeric: false },
    { key: "millshortname", label: "Mill Name", numeric: false },
    { key: "Grade", label: "Grade", numeric: false },
    { key: "Mill_Rate", label: "Rate", numeric: true },
    { key: "Quantal", label: "Quantal", numeric: true, isTotal: true },
    { key: "soldqty", label: "Sold", numeric: true, isTotal: true },
    { key: "selfbalance", label: "Balance", numeric: true, isTotal: true },
    { key: "tenderdoshortname", label: "DO", numeric: false },
    { key: "PaymentToShortName", label: "Payment To", numeric: false },
];

const SelfStockReport = forwardRef(({ toDate }, ref) => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState({ key: "millshortname", dir: "asc" });
    const [page, setPage] = useState(1);
    const [isPrinting, setIsPrinting] = useState(false);

    const companyCode = sessionStorage.getItem("Company_Code");

    useEffect(() => { fetchData(); }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/tender-balance-report?Company_Code=${companyCode}`);
            const data = await res.json();
            setRows(data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    const sortedData = useMemo(() => {
        let filtered = rows;
        if (search) {
            const q = search.toLowerCase();
            filtered = rows.filter(r => Object.values(r).some(v => String(v ?? "").toLowerCase().includes(q)));
        }
        return [...filtered].sort((a, b) => {
            const av = a[sort.key] ?? 0;
            const bv = b[sort.key] ?? 0;
            let cmp = NUM_COLS.has(sort.key) ? Number(av) - Number(bv) : String(av).localeCompare(String(bv));
            return sort.dir === "asc" ? cmp : -cmp;
        });
    }, [rows, search, sort]);

    const paged = sortedData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const grandTotals = useMemo(() => ({
        Quantal: sortedData.reduce((sum, r) => sum + (Number(r.Quantal) || 0), 0),
        soldqty: sortedData.reduce((sum, r) => sum + (Number(r.soldqty) || 0), 0),
        selfbalance: sortedData.reduce((sum, r) => sum + (Number(r.selfbalance) || 0), 0),
    }), [sortedData]);

    // Handle XLSX Export
    function handleExportXLSX() {
        const headers = ["#", ...COLS.map(c => c.label)];
        const dataRows = sortedData.map((row, i) => [
            i + 1,
            ...COLS.map(col => {
                const v = row[col.key];
                if (col.key === "Tender_Date") return fmtDate(v);
                if (col.key === "AccountBalance") {
                    const abs = v != null ? Math.abs(Number(v)) : null;
                    const label = row.AccountBalanceLabel || "";
                    return abs != null ? `${fmt(abs)} ${label}` : "—";
                }
                if (NUM_COLS.has(col.key)) return v != null ? Number(v) : null;
                return v ?? "—";
            }),
        ]);

        const totalRow = [
            "TOTAL",
            ...COLS.map(col => {
                if (col.key === "Quantal") return Number(grandTotals.Quantal.toFixed(2));
                if (col.key === "soldqty") return Number(grandTotals.soldqty.toFixed(2));
                if (col.key === "selfbalance") return Number(grandTotals.selfbalance.toFixed(2));
                return "";
            }),
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows, totalRow]);
        ws["!cols"] = [{ wch: 5 }, { wch: 10 }, { wch: 14 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 30 }, { wch: 30 }, { wch: 25 }, { wch: 12 }, { wch: 15 }];

        XLSX.utils.book_append_sheet(wb, ws, "Self Stock Report");
        XLSX.writeFile(wb, `SelfStockReport_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }

    // Handle PDF Generation
    const handleGeneratePDF = () => {
        if (sortedData.length === 0) return;
        setIsPrinting(true);

        const pdfRows = sortedData.map(row => 
            PRINT_COLUMNS.map(col => {
                if (col.key === "Tender_Date") return fmtDate(row[col.key]);
                return col.numeric ? formatReadableAmount(row[col.key] || 0) : (row[col.key] || '');
            })
        );

        const footerRow = PRINT_COLUMNS.map(col => {
            if (col.isTotal) {
                return { 
                    content: formatReadableAmount(grandTotals[col.key] || 0), 
                    styles: { halign: 'right', fontStyle: 'bold', fillColor: [255, 249, 196] } 
                };
            }
            return col.key === 'Tender_No' ? { content: 'GRAND TOTAL', styles: { fontStyle: 'bold', fillColor: [255, 249, 196] } } : '';
        });

        generateReportPDF({
            title: 'Self Stock Balance Report',
            subtitle: `As On Date: ${fmtDate(toDate)}`,
            columns: PRINT_COLUMNS.map(c => c.label),
            rows: pdfRows, 
            footerRow, 
            headerImgSrc: HeaderJK, 
            footerImgSrc: FooterJK,
            numericCols: PRINT_COLUMNS.map((c, i) => c.numeric ? i : null).filter(i => i !== null),
            orientation: 'landscape',
            onComplete: (url) => { 
                setIsPrinting(false); 
                window.open(url, '_blank');
            },
        });
    };

    useImperativeHandle(ref, () => ({
        handleGeneratePDF
    }));

    const handleSort = (key) => {
        setSort(prev => ({ key, dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc" }));
    };

    return (
        <div className="flex flex-col h-full bg-white animate-in fade-in duration-300">
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 gap-4">
                <div className="relative w-full max-sm:max-w-xs max-w-sm">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search stocks..."
                        className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end mr-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Stock Balance</span>
                        <span className="text-base font-mono font-bold text-emerald-600 leading-none">{fmt(grandTotals.selfbalance)}</span>
                    </div>
                    
                    <button 
                        onClick={handleExportXLSX} 
                        disabled={loading || rows.length === 0} 
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                    >
                        <ArrowDownTrayIcon className="w-4 h-4" /> Export XLSX
                    </button>

                    <button 
                        onClick={handleGeneratePDF} 
                        disabled={loading || rows.length === 0 || isPrinting} 
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    >
                        <PrinterIcon className={`w-4 h-4 ${isPrinting ? 'animate-spin' : ''}`} /> 
                        {isPrinting ? 'Generating...' : 'Print PDF'}
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto overflow-y-auto no-scrollbar mb-[30px]">
                <table className="w-full text-[12.5px] border-separate border-spacing-0 table-auto" style={{ minWidth: 1100 }}>
                    <thead className="sticky top-0 z-10 bg-slate-50">
                        <tr>
                            <th className="px-4 py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 w-12">#</th>
                            {COLS.map(col => (
                                <th key={col.key} style={{ width: col.width }} onClick={() => handleSort(col.key)} className={`px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors ${col.align === "right" ? "text-right" : "text-left"}`}>
                                    <div className={`flex items-center gap-1.5 ${col.align === "right" ? "justify-end" : ""}`}>
                                        {col.label}
                                        <span className="flex flex-col -space-y-1">
                                            <ChevronUpIcon className={`w-3 h-3 ${sort.key === col.key && sort.dir === "asc" ? "text-blue-600" : "text-slate-300"}`} />
                                            <ChevronDownIcon className={`w-3 h-3 ${sort.key === col.key && sort.dir === "desc" ? "text-blue-600" : "text-slate-300"}`} />
                                        </span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <LoadingSkeleton /> : sortedData.length === 0 ? (
                            <tr><td colSpan={12} className="py-20 text-center text-slate-400 italic">No records found...</td></tr>
                        ) : (
                            paged.map((row, i) => (
                                <tr key={i} className="hover:bg-blue-50/40 transition-colors group">
                                    <td className="px-4 py-2.5 text-center text-slate-300 font-mono text-[11px] border-r border-slate-50">{(page - 1) * PAGE_SIZE + i + 1}</td>
                                    {COLS.map(col => (
                                        <td key={col.key} className={`px-4 py-2.5 ${col.align === "right" ? "text-right" : "text-left"} ${col.cls || "text-slate-600"}`}>
                                            {col.render ? col.render(row[col.key], row) : (row[col.key] ?? "—")}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>

                    {!loading && sortedData.length > 0 && (
                        <tfoot className="sticky bottom-0 z-10 bg-slate-100 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                            <tr className="divide-x divide-slate-200">
                                <td colSpan={4} className="px-4 py-3 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Grand Totals</td>
                                <td className="px-4 py-3 text-right font-mono font-black text-blue-700 text-sm">{fmt(grandTotals.Quantal)}</td>
                                <td className="px-4 py-3 text-right font-mono font-black text-amber-700 text-sm">{fmt(grandTotals.soldqty)}</td>
                                <td className="px-4 py-3 text-right font-mono font-black text-emerald-700 text-sm">{fmt(grandTotals.selfbalance)}</td>
                                <td colSpan={5} className="bg-slate-50"></td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
});

export default SelfStockReport;