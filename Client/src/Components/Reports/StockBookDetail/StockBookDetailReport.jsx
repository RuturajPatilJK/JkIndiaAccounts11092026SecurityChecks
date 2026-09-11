// import React, { useEffect, useState, useCallback } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { jsPDF } from "jspdf";
// import "jspdf-autotable";
// import * as XLSX from "xlsx";
// import PdfPreview from "../../../Common/PDFPreview";
// import { RingLoader } from "react-spinners";
// import BackButton from "../../../Common/Buttons/BackButton";
// import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";

// const API_URL = process.env.REACT_APP_API;

// /* ─── icons (inline SVG to avoid extra deps) ─── */
// const IconPDF = () => (
//   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//     <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
//     <polyline points="14 2 14 8 20 8" />
//     <line x1="16" y1="13" x2="8" y2="13" />
//     <line x1="16" y1="17" x2="8" y2="17" />
//     <polyline points="10 9 9 9 8 9" />
//   </svg>
// );

// const IconXLS = () => (
//   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//     <rect x="2" y="2" width="20" height="20" rx="2" />
//     <line x1="2" y1="8" x2="22" y2="8" />
//     <line x1="2" y1="14" x2="22" y2="14" />
//     <line x1="8" y1="8" x2="8" y2="22" />
//     <line x1="14" y1="8" x2="14" y2="22" />
//   </svg>
// );

// const SortIcon = ({ direction }) => (
//   <span style={{ display: "inline-flex", flexDirection: "column", marginLeft: 4, lineHeight: 1 }}>
//     <span style={{ opacity: direction === "asc" ? 1 : 0.3, fontSize: 9 }}>▲</span>
//     <span style={{ opacity: direction === "desc" ? 1 : 0.3, fontSize: 9 }}>▼</span>
//   </span>
// );

// /* ─── column config ─── */
// const COLUMNS = [
//   { key: "doc_date",       label: "Date",          align: "center", type: "date" },
//   { key: "opqntl",        label: "Opening Qty",   align: "right",  type: "number" },
//   { key: "inwqntl",       label: "Inward Qty",    align: "right",  type: "number" },
//   { key: "outqntl",       label: "Outward Qty",   align: "right",  type: "number" },
//   { key: "bal",           label: "Balance",       align: "right",  type: "number" },
//   { key: "Marka",         label: "Marka",         align: "center", type: "string" },
//   { key: "Tran_Type",     label: "Trans Type",    align: "center", type: "string" },
//   { key: "DoNO",          label: "DO No",         align: "center", type: "string" },
//   { key: "doc_no",        label: "Doc No",        align: "center", type: "string" },
//   { key: "partyShortname",label: "Party Name",    align: "left",   type: "string" },
//   { key: "MillShortName", label: "Mill Name",     align: "left",   type: "string" },
// ];

// /* ─── helpers ─── */
// const formatDate = (d) => {
//   if (!d) return "";
//   const dt = new Date(d);
//   return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
// };

// const fnum = (v, decimals = 2) => (parseFloat(v) || 0).toFixed(decimals);

// const groupBy = (arr, key) =>
//   arr.reduce((acc, item) => {
//     (acc[item[key]] = acc[item[key]] || []).push(item);
//     return acc;
//   }, {});

// const calcTotals = (rows) =>
//   rows.reduce(
//     (acc, r) => {
//       acc.totalInward  += parseFloat(r.inwqntl) || 0;
//       acc.totalOutward += parseFloat(r.outqntl) || 0;
//       return acc;
//     },
//     { totalInward: 0, totalOutward: 0 }
//   );

// /* ─── compare fn for sorting ─── */
// const compareValues = (a, b, col, dir) => {
//   let va = a[col], vb = b[col];
//   if (col === "doc_date") { va = new Date(va); vb = new Date(vb); }
//   else if (["opqntl","inwqntl","outqntl","bal"].includes(col)) { va = parseFloat(va)||0; vb = parseFloat(vb)||0; }
//   else { va = (va||"").toString().toLowerCase(); vb = (vb||"").toString().toLowerCase(); }
//   return dir === "asc" ? (va > vb ? 1 : va < vb ? -1 : 0) : (va < vb ? 1 : va > vb ? -1 : 0);
// };

// /* ─── styles ─── */
// const S = {
//   page:    { padding: "24px 28px", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", background: "#f0f4f8", minHeight: "100vh" },
//   topBar:  { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
//   btnRow:  { display: "flex", gap: 10 },
//   btn:     (color) => ({
//     display: "inline-flex", alignItems: "center", gap: 8,
//     padding: "9px 18px", borderRadius: 8, border: "none", cursor: "pointer",
//     fontWeight: 600, fontSize: 13, letterSpacing: 0.3,
//     background: color, color: "#fff",
//     boxShadow: `0 2px 6px ${color}55`,
//     transition: "transform .15s, box-shadow .15s",
//   }),
//   card:    { background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,.08)", marginBottom: 28, overflow: "hidden" },
//   groupHd: { padding: "12px 18px", background: "linear-gradient(135deg,#1a56db,#2563eb)", color: "#fff", fontWeight: 700, fontSize: 14, letterSpacing: .5 },
//   table:   { width: "100%", borderCollapse: "collapse", fontSize: 13 },
//   th:      (align) => ({
//     padding: "9px 12px", textAlign: align, background: "#f8fafc",
//     borderBottom: "2px solid #e2e8f0", color: "#475569", fontWeight: 700, fontSize: 12,
//     cursor: "pointer", whiteSpace: "nowrap", userSelect: "none",
//   }),
//   tdBase:  (align, even) => ({
//     padding: "8px 12px", textAlign: align, color: "#1e293b",
//     borderBottom: "1px solid #f1f5f9", background: even ? "#f8fafc" : "#fff",
//     whiteSpace: "nowrap",
//   }),
//   tfootTd: (align) => ({
//     padding: "10px 12px", textAlign: align, fontWeight: 700,
//     background: "#dbeafe", color: "#1d4ed8", borderTop: "2px solid #bfdbfe",
//     fontSize: 13,
//   }),
//   title:   { textAlign: "center", fontSize: 22, fontWeight: 700, color: "#1e293b", margin: "0 0 4px" },
//   subTitle:{ textAlign: "center", fontSize: 13, color: "#64748b", marginBottom: 20 },
// };

// /* ══════════════════════════════════════════════════════════ */
// const StockReportDetail = () => {
//   const location    = useLocation();
//   const navigate    = useNavigate();
//   const companyCode = sessionStorage.getItem("Company_Code");
//     const yearcode = sessionStorage.getItem("Year_Code");
//   const companyName = sessionStorage.getItem("Company_Name");

//   const searchParams = new URLSearchParams(location.search);
//   const itemCode  = searchParams.get("itemCode");
//   const toDate    = searchParams.get("toDate");
//   const fromDate  = searchParams.get("fromDate");

//   const [rawGrouped, setRawGrouped]   = useState({});   // original data
//   const [sortState,  setSortState]    = useState({});   // { groupKey: { col, dir } }
//   const [loading,    setLoading]      = useState(true);
//   const [pdfPreview, setPdfPreview]   = useState(null);
//   const [showPreview,setShowPreview]  = useState(false);

//   /* sorted view */
//   const getSorted = useCallback((group) => {
//     const rows = [...(rawGrouped[group] || [])];
//     const ss   = sortState[group];
//     if (!ss) return rows;
//     return rows.sort((a, b) => compareValues(a, b, ss.col, ss.dir));
//   }, [rawGrouped, sortState]);

//   const handleSort = (group, colKey) => {
//     setSortState((prev) => {
//       const cur = prev[group];
//       const dir = cur?.col === colKey && cur.dir === "asc" ? "desc" : "asc";
//       return { ...prev, [group]: { col: colKey, dir } };
//     });
//   };

//   /* fetch */
//   useEffect(() => {
//     const fetch_ = async () => {
//       try {
//         const res    = await fetch(`${API_URL}/stock-book-detail?doc_date=${toDate}&from_date=${fromDate}&company_code=${companyCode}&Item_Code=${itemCode}&Year_Code=${yearcode}`);
//         const result = await res.json();
//         setRawGrouped(groupBy(result.data || [], "System_Name_E"));
//       } catch (e) {
//         console.error(e);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetch_();
//   }, [toDate, itemCode]);

//   /* ── PDF ── */
//   const generatePDF = () => {
//     const doc        = new jsPDF("landscape", "mm", "a4");
//     const pageHeight = doc.internal.pageSize.height;
//     const margin     = 10;
//     let   currentY   = 30;

//     // Header
//     doc.setFontSize(14);
//     doc.setFont(undefined, "bold");
//     doc.text(companyName || "Company", 148, 10, { align: "center" });
//     doc.setFontSize(11);
//     doc.setFont(undefined, "normal");
//     doc.text("Stock Book Detail Report", 148, 18, { align: "center" });
//     doc.setFontSize(9);
//     doc.text(`From Date: ${formatDate(fromDate)}   |   To Date: ${formatDate(toDate)}`, 148, 25, { align: "center" });

//     Object.keys(rawGrouped).forEach((group) => {
//       const rows = getSorted(group);
//       if (currentY + 20 > pageHeight - margin) { doc.addPage(); currentY = margin; }

//       doc.setFontSize(11);
//       doc.setFont(undefined, "bold");
//       doc.setTextColor(30, 86, 219);
//       doc.text(`Item: ${group.toUpperCase()}`, 10, currentY);
//       doc.setTextColor(40);
//       currentY += 8;

//       const { totalInward, totalOutward } = calcTotals(rows);
//       const tableData = rows.map((r) => [
//         formatDate(r.doc_date), fnum(r.opqntl), fnum(r.inwqntl), fnum(r.outqntl),
//         fnum(r.bal), r.Marka, r.Tran_Type, r.DoNO, r.doc_no, r.partyShortname, r.MillShortName,
//       ]);
//       tableData.push(["Total", "", totalInward.toFixed(2), totalOutward.toFixed(2), "", "", "", "", "", "", ""]);

//       doc.autoTable({
//         startY: currentY,
//         head:   [COLUMNS.map((c) => c.label)],
//         body:   tableData,
//         styles: { fontSize: 7.5, cellPadding: 2.5 },
//         headStyles: { fillColor: [30, 86, 219], textColor: 255, fontStyle: "bold" },
//         alternateRowStyles: { fillColor: [248, 250, 252] },
//         columnStyles: {
//           0: { halign: "center" }, 1: { halign: "right" }, 2: { halign: "right" },
//           3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "center" },
//           6: { halign: "center" }, 7: { halign: "center" }, 8: { halign: "center" },
//         },
//         didParseCell: (data) => {
//           if (data.row.index === tableData.length - 1) {
//             data.cell.styles.fontStyle  = "bold";
//             data.cell.styles.fillColor  = [219, 234, 254];
//             data.cell.styles.textColor  = [29, 78, 216];
//           }
//         },
//         didDrawPage: (data) => { currentY = data.cursor.y; },
//       });
//       currentY = doc.lastAutoTable.finalY + 12;
//     });

//     const blob = doc.output("blob");
//     setPdfPreview(URL.createObjectURL(blob));
//     setShowPreview(true);
//   };

//   /* ── XLSX export ── */
//   const exportXLSX = () => {
//     const wb = XLSX.utils.book_new();

//     Object.keys(rawGrouped).forEach((group) => {
//       const rows = getSorted(group);
//       const { totalInward, totalOutward } = calcTotals(rows);

//       // Company / report header rows
//       const header = [
//         [companyName || ""],
//         ["Stock Book Detail Report"],
//         [`From Date: ${formatDate(fromDate)}   |   To Date: ${formatDate(toDate)}`],
//         [],
//         [`Item: ${group.toUpperCase()}`],
//         [],
//         COLUMNS.map((c) => c.label),
//       ];

//       const dataRows = rows.map((r) => [
//         formatDate(r.doc_date),
//         parseFloat(fnum(r.opqntl)),
//         parseFloat(fnum(r.inwqntl)),
//         parseFloat(fnum(r.outqntl)),
//         parseFloat(fnum(r.bal)),
//         r.Marka        || "",
//         r.Tran_Type    || "",
//         r.DoNO         || "",
//         r.doc_no       || "",
//         r.partyShortname  || "",
//         r.MillShortName   || "",
//       ]);

//       const totalRow = ["Total", "", parseFloat(totalInward.toFixed(2)), parseFloat(totalOutward.toFixed(2)), "", "", "", "", "", "", ""];
//       const sheetData = [...header, ...dataRows, totalRow];

//       const ws = XLSX.utils.aoa_to_sheet(sheetData);

//       /* column widths */
//       ws["!cols"] = [
//         { wch: 14 }, { wch: 13 }, { wch: 13 }, { wch: 14 }, { wch: 12 },
//         { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 20 },
//       ];

//       /* safe sheet name (max 31 chars) */
//       const sheetName = group.length > 28 ? group.substring(0, 28) + "..." : group;
//       XLSX.utils.book_append_sheet(wb, ws, sheetName);
//     });

//     /* summary sheet */
//     const summaryRows = [
//       [companyName || ""],
//       ["Stock Book Detail Report — Summary"],
//       [`From Date: ${formatDate(fromDate)}   |   To Date: ${formatDate(toDate)}`],
//       [],
//       ["Item Name", "Total Inward", "Total Outward"],
//     ];
//     Object.keys(rawGrouped).forEach((group) => {
//       const { totalInward, totalOutward } = calcTotals(rawGrouped[group]);
//       summaryRows.push([group, parseFloat(totalInward.toFixed(2)), parseFloat(totalOutward.toFixed(2))]);
//     });
//     const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
//     wsSummary["!cols"] = [{ wch: 35 }, { wch: 16 }, { wch: 16 }];
//     XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

//     XLSX.writeFile(wb, `StockBookDetailReport_${formatDate(fromDate).replace(/\//g,"-")}_${formatDate(toDate).replace(/\//g,"-")}.xlsx`);
//   };

//   /* ─── render ─── */
//   if (loading) return (
//     <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
//       <RingLoader color="#2563eb" />
//     </div>
//   );

//   return (
//     <div style={S.page}>

//       {/* top bar */}
//       <div style={S.topBar}>
//         <BackButton onClick={() => navigate("/stock-book")} />
//         <div style={S.btnRow}>
//           {showPreview && pdfPreview && (
//             <PdfPreview pdfData={pdfPreview} apiData={rawGrouped} label="Stock Book Detail Report" />
//           )}
//           <button
//             style={S.btn("#e53e3e")}
//             onClick={generatePDF}
//             onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px #e53e3e55"; }}
//             onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = `0 2px 6px #e53e3e55`; }}
//           >
//             <IconPDF /> PDF Preview
//           </button>
//           <button
//             style={S.btn("#16a34a")}
//             onClick={exportXLSX}
//             onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px #16a34a55"; }}
//             onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = `0 2px 6px #16a34a55`; }}
//           >
//             <IconXLS /> Export to Excel
//           </button>
//         </div>
//       </div>

//       {/* report heading */}
//       <h2 style={S.title}>{companyName}</h2>
//       <p style={S.subTitle}>
//         <strong>Stock Book Detail Report</strong>&nbsp;&nbsp;|&nbsp;&nbsp;
//         From:&nbsp;<strong>{formatDate(fromDate)}</strong>&nbsp;&nbsp;To:&nbsp;<strong>{formatDate(toDate)}</strong>
//       </p>

//       {/* tables per group */}
//       {Object.keys(rawGrouped).map((group) => {
//         const rows = getSorted(group);
//         const { totalInward, totalOutward } = calcTotals(rows);
//         const ss = sortState[group] || {};

//         return (
//           <div key={group} style={S.card}>
//             <div style={S.groupHd}>{group.toUpperCase()}</div>
//             <div style={{ overflowX: "auto" }}>
//               <table style={S.table}>
//                 <thead>
//                   <tr>
//                     {COLUMNS.map((col) => (
//                       <th
//                         key={col.key}
//                         style={S.th(col.align)}
//                         onClick={() => handleSort(group, col.key)}
//                         title={`Sort by ${col.label}`}
//                       >
//                         {col.label}
//                         <SortIcon direction={ss.col === col.key ? ss.dir : null} />
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {rows.map((row, i) => (
//                     <tr
//                       key={i}
//                       onMouseEnter={(e) => { e.currentTarget.querySelectorAll("td").forEach((td) => { td.style.background = "#eff6ff"; }); }}
//                       onMouseLeave={(e) => {
//                         e.currentTarget.querySelectorAll("td").forEach((td) => {
//                           td.style.background = i % 2 === 0 ? "#f8fafc" : "#fff";
//                         });
//                       }}
//                     >
//                       <td style={S.tdBase("center", i % 2 === 0)}>{formatDate(row.doc_date)}</td>
//                       <td style={S.tdBase("right",  i % 2 === 0)}>{fnum(row.opqntl)}</td>
//                       <td style={{ ...S.tdBase("right", i % 2 === 0), color: "#16a34a", fontWeight: 500 }}>{formatReadableAmount(fnum(row.inwqntl))}</td>
//                       <td style={{ ...S.tdBase("right", i % 2 === 0), color: "#dc2626", fontWeight: 500 }}>{formatReadableAmount(fnum(row.outqntl))}</td>
//                       <td style={{ ...S.tdBase("right", i % 2 === 0), fontWeight: 600 }}>{formatReadableAmount(fnum(row.bal))}</td>
//                       <td style={S.tdBase("center", i % 2 === 0)}>{row.Marka}</td>
//                       <td style={S.tdBase("center", i % 2 === 0)}>
//                         <span style={{
//                           background: "#e0f2fe", color: "#0369a1", padding: "2px 8px",
//                           borderRadius: 20, fontSize: 11, fontWeight: 600,
//                         }}>{row.Tran_Type}</span>
//                       </td>
//                       <td style={S.tdBase("center", i % 2 === 0)}>{row.DoNO}</td>
//                       <td style={S.tdBase("center", i % 2 === 0)}>{row.doc_no}</td>
//                       <td style={S.tdBase("left",   i % 2 === 0)}>{row.partyShortname}</td>
//                       <td style={S.tdBase("left",   i % 2 === 0)}>{row.MillShortName}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//                 <tfoot>
//                   <tr>
//                     <td style={S.tfootTd("center")}>Total</td>
//                     <td style={S.tfootTd("right")}></td>
//                     <td style={{ ...S.tfootTd("right"), color: "#16a34a" }}>{formatReadableAmount(totalInward.toFixed(2))}</td>
//                     <td style={{ ...S.tfootTd("right"), color: "#dc2626" }}>{formatReadableAmount(totalOutward.toFixed(2))}</td>
//                     {[...Array(7)].map((_, i) => <td key={i} style={S.tfootTd("right")}></td>)}
//                   </tr>
//                 </tfoot>
//               </table>
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// };

// export default StockReportDetail;





















import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { ScaleLoader } from "react-spinners";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import { FormaDateBalanceSheet } from '../../../Common/FormatFunctions/FormatDate';
import { ConvertNumberToWord } from '../../../Common/FormatFunctions/ConvertNumberToWord';
import PdfPreview from "../../../Common/PDFPreview";
import BackButton from "../../../Common/Buttons/BackButton";
import CommonPrintView from '../../../Common/ReportCommon/CommonPrintView';
import { generateReportPDF } from '../../../Common/ReportCommon/CommonPDFGenerator';
import HeaderJK from '../../../Assets/HeaderJK.png';
import FooterJK from '../../../Assets/FooterJK.png';

import '../../../Common/Fonts/Signika-Bold-normal';
import '../../../Common/Fonts/Signika-Regular-normal';

import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Typography, TableFooter, TableSortLabel,
} from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';

const API_URL = process.env.REACT_APP_API;

// ─── Column definitions ────────────────────────────────────────────────────────

const SCREEN_COLUMNS = [
  { label: 'Date', key: 'doc_date', width: '8%', center: true },
  { label: 'Opening Qty', key: 'opqntl', width: '8%', numeric: true },
  { label: 'Inward Qty', key: 'inwqntl', width: '8%', numeric: true },
  { label: 'Outward Qty', key: 'outqntl', width: '8%', numeric: true },
  { label: 'Balance', key: 'bal', width: '8%', numeric: true },
  { label: 'Marka', key: 'Marka', width: '8%', center: true },
  { label: 'Trans Type', key: 'Tran_Type', width: '8%', center: true },
  { label: 'DO No', key: 'DoNO', width: '8%', center: true },
  { label: 'Doc No', key: 'doc_no', width: '8%', center: true },
  { label: 'Party Name', key: 'partyShortname', width: '12%' },
  { label: 'Mill Name', key: 'MillShortName', width: '10%' },
];

const PRINT_COLUMNS = [
  { label: 'Date', key: 'doc_date', printWidth: '16mm', center: true },
  { label: 'Opening Qty', key: 'opqntl', printWidth: '18mm', numeric: true },
  { label: 'Inward Qty', key: 'inwqntl', printWidth: '18mm', numeric: true },
  { label: 'Outward Qty', key: 'outqntl', printWidth: '18mm', numeric: true },
  { label: 'Balance', key: 'bal', printWidth: '16mm', numeric: true },
  { label: 'Marka', key: 'Marka', printWidth: '16mm', center: true },
  { label: 'Trans Type', key: 'Tran_Type', printWidth: '18mm', center: true },
  { label: 'DO No', key: 'DoNO', printWidth: '16mm', center: true },
  { label: 'Doc No', key: 'doc_no', printWidth: '16mm', center: true },
  { label: 'Party Name', key: 'partyShortname', printWidth: '28mm' },
  { label: 'Mill Name', key: 'MillShortName', printWidth: '22mm' },
];

const PRINT_NUMERIC_COLS = PRINT_COLUMNS
  .map((c, i) => (c.numeric ? i : null))
  .filter(i => i !== null);

const PRINT_CENTER_COLS = PRINT_COLUMNS
  .map((c, i) => (c.center ? i : null))
  .filter(i => i !== null);

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return [
    String(d.getDate()).padStart(2, '0'),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getFullYear()),
  ].join('/');
};

const num = (v) => parseFloat(v) || 0;

const groupBy = (arr, key) =>
  arr.reduce((acc, item) => {
    const groupKey = item[key] || "Other";
    (acc[groupKey] = acc[groupKey] || []).push(item);
    return acc;
  }, {});

// ─── Component ─────────────────────────────────────────────────────────────────

const StockReportDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const companyCode = sessionStorage.getItem('Company_Code');
  const Year_Code = sessionStorage.getItem('Year_Code');
  const companyName = sessionStorage.getItem('Company_Name');
  const companyGST = sessionStorage.getItem('Company_GSTNO');

  const searchParams = new URLSearchParams(location.search);
  const itemCode = searchParams.get('itemCode');
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');

  const [rawGrouped, setRawGrouped] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfPreview, setPdfPreview] = useState(null);
  const [sortConfig, setSortConfig] = useState({ group: null, key: null, direction: 'asc' });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(
          `${API_URL}/stock-book-detail?doc_date=${toDate}&from_date=${fromDate}&company_code=${companyCode}&Item_Code=${itemCode}&Year_Code=${Year_Code}`
        );
        const json = await res.json();
        setRawGrouped(groupBy(json.data || [], "System_Name_E"));
      } catch (err) {
        console.error(err);
        setError('Error fetching stock detail report');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [fromDate, toDate, companyCode, Year_Code, itemCode]);

  // ── Sorting ────────────────────────────────────────────────────────────────
  const requestSort = (group, key) =>
    setSortConfig(prev => ({
      group,
      key,
      direction: prev.group === group && prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));

  const getSortedData = useCallback((group) => {
    const rows = [...(rawGrouped[group] || [])];
    if (sortConfig.group === group && sortConfig.key) {
      rows.sort((a, b) => {
        let va = a[sortConfig.key];
        let vb = b[sortConfig.key];
        
        if (sortConfig.key === 'doc_date') {
          va = new Date(va);
          vb = new Date(vb);
        } else if (['opqntl', 'inwqntl', 'outqntl', 'bal'].includes(sortConfig.key)) {
          va = num(va);
          vb = num(vb);
        } else {
          va = String(va || '').toLowerCase();
          vb = String(vb || '').toLowerCase();
        }
        
        const compare = va > vb ? 1 : va < vb ? -1 : 0;
        return sortConfig.direction === 'asc' ? compare : -compare;
      });
    }
    return rows;
  }, [rawGrouped, sortConfig]);

  // ── Grand Totals (all items combined) ──
  const grandTotals = useMemo(() => {
    const allData = Object.values(rawGrouped).flat();
    return allData.reduce((acc, item) => {
      acc.inwqntl += num(item.inwqntl);
      acc.outqntl += num(item.outqntl);
      return acc;
    }, { inwqntl: 0, outqntl: 0 });
  }, [rawGrouped]);

  // ── Row renderers ─────────────────────────────────────────────────────────
  const renderScreenRow = (item) => [
    formatDate(item.doc_date),
    formatReadableAmount(num(item.opqntl).toFixed(2)),
    formatReadableAmount(num(item.inwqntl).toFixed(2)),
    formatReadableAmount(num(item.outqntl).toFixed(2)),
    formatReadableAmount(num(item.bal).toFixed(2)),
    item.Marka || '',
    item.Tran_Type || '',
    item.DoNO || '',
    item.doc_no || '',
    item.partyShortname || '',
    item.MillShortName || '',
  ];

  const renderPrintRow = (item) => [
    formatDate(item.doc_date),
    formatReadableAmount(num(item.opqntl).toFixed(2)),
    formatReadableAmount(num(item.inwqntl).toFixed(2)),
    formatReadableAmount(num(item.outqntl).toFixed(2)),
    formatReadableAmount(num(item.bal).toFixed(2)),
    item.Marka || '',
    item.Tran_Type || '',
    item.DoNO || '',
    item.doc_no || '',
    item.partyShortname || '',
    item.MillShortName || '',
  ];

  const reportSubtitle = `${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`;

  // ── Excel Export ──
  const handleExportToExcel = () => {
    const headers = SCREEN_COLUMNS.map(c => c.label);

    const companyNameRow = [companyName?.toUpperCase()];
    const gstRow = [`GST No: ${companyGST}`];
    const periodRow = [`Period: ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`];
    const emptyRow = [];

    const tableData = [];
    Object.keys(rawGrouped).forEach((group) => {
      const rows = getSortedData(group);
      rows.forEach((item) => {
        const row = [
          formatDate(item.doc_date),
          num(item.opqntl),
          num(item.inwqntl),
          num(item.outqntl),
          num(item.bal),
          item.Marka || '',
          item.Tran_Type || '',
          item.DoNO || '',
          item.doc_no || '',
          item.partyShortname || '',
          item.MillShortName || '',
        ];
        tableData.push(row);
      });
    });

    const totalRow = [
      'GRAND TOTAL', '',
      grandTotals.inwqntl,
      grandTotals.outqntl,
      '', '', '', '', '', '', ''
    ];

    const worksheetData = [companyNameRow, gstRow, periodRow, emptyRow, headers, ...tableData, totalRow];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
    ];

    ws['!cols'] = SCREEN_COLUMNS.map(c => ({ wch: c.numeric ? 16 : 22 }));

    const range = XLSX.utils.decode_range(ws['!ref']);
    const headerRowIndex = 4;

    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[addr]) continue;
        if (!ws[addr].s) ws[addr].s = {};

        const colDef = SCREEN_COLUMNS[C];
        if (!colDef) continue;

        if (R >= headerRowIndex && colDef.numeric) {
          ws[addr].s.alignment = { horizontal: 'right' };
        } else if (colDef.center) {
          ws[addr].s.alignment = { horizontal: 'center' };
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, 'StockDetailReport');
    XLSX.writeFile(wb, `StockDetail_${fromDate}_to_${toDate}.xlsx`);
  };

  // ── PDF (via generateReportPDF) ──
  const handleGeneratePDF = () => {
    // Flatten all data with item name
    const flattenedData = [];
    Object.keys(rawGrouped).forEach((group) => {
      const rows = getSortedData(group);
      rows.forEach((row) => {
        flattenedData.push({
          ...row,
          item_name: group,
        });
      });
    });

    const printFooterValues = [
      'GRAND TOTAL', '',
      formatReadableAmount(grandTotals.inwqntl.toFixed(2)),
      formatReadableAmount(grandTotals.outqntl.toFixed(2)),
      '', '', '', '', '', '', ''
    ];

    generateReportPDF({
      title: 'Stock Book Detail Report',
      subtitle: reportSubtitle,
      columns: PRINT_COLUMNS.map(c => c.label),
      columnWidths: [16, 18, 18, 18, 16, 16, 18, 16, 16, 28, 22],
      rows: flattenedData.map(renderPrintRow),
      footerRow: printFooterValues,
      numericCols: PRINT_NUMERIC_COLS,
      centerCols: PRINT_CENTER_COLS,
      headerImgSrc: HeaderJK,
      footerImgSrc: FooterJK,
      onComplete: (url) => setPdfPreview(url),
    });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ marginTop: '-40px', padding: '20px' }}>

      {/* Print view (hidden on screen, shown @media print) */}
      <CommonPrintView
        title="Stock Book Detail Report"
        subtitle={reportSubtitle}
        companyName={companyName}
        companyGST={companyGST}
        columns={PRINT_COLUMNS}
        rows={Object.values(rawGrouped).flat()}
        rowRenderer={renderPrintRow}
        footerValues={['GRAND TOTAL', '', grandTotals.inwqntl.toFixed(2), grandTotals.outqntl.toFixed(2), '', '', '', '', '', '', '']}
        amountInWords={ConvertNumberToWord(grandTotals.inwqntl)}
        headerImg={HeaderJK}
        footerImg={FooterJK}
      />

      {/* Screen header */}
      <Typography variant="h5" align="center" style={{ fontWeight: 'bold', marginTop: '-50px' }}>
        {companyName}
      </Typography>
      <Typography variant="subtitle1" align="center">GSTN: {companyGST}</Typography>
      <Typography variant="h6" align="center">Stock Book Detail Report</Typography>
      <Typography variant="subtitle2" align="center" color="textSecondary">
        {reportSubtitle}
      </Typography>

      {/* Action buttons */}
      <div className="my-2 no-print d-flex justify-content-end gap-1 align-items-center">
        <BackButton onClick={() => navigate('/stock-book')} />
        <button className="btn btn-danger" onClick={handleGeneratePDF}>
          Print
        </button>
        <button className="btn btn-success" onClick={handleExportToExcel}>
          Export Excel
        </button>
      </div>

      {pdfPreview && <PdfPreview pdfData={pdfPreview} label="StockBookItemwise" />}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Screen table - Grouped by Item */}
      {Object.keys(rawGrouped).map((group) => {
        const rows = getSortedData(group);
        const groupTotals = rows.reduce((acc, item) => {
          acc.inwqntl += num(item.inwqntl);
          acc.outqntl += num(item.outqntl);
          return acc;
        }, { inwqntl: 0, outqntl: 0 });

        return (
          <div key={group} style={{ marginBottom: '15px'}}>
            {/* Item Header */}
            <Typography 
              variant="h6" 
              style={{ 
                backgroundColor: '#ffffff', 
                color: '#070aaa', 
                padding: '10px 10px', 
                borderRadius: '5px 5px 0 0',
                marginBottom: 0,
                fontWeight: 'bold',
              }}
            >
             {group.toUpperCase()}
            </Typography>

            <TableContainer component={Paper} style={{ maxHeight: '500px', position: 'relative', borderRadius: '0 0 5px 5px' }}>
              <Table size="small" style={{ borderCollapse: 'separate' }}>
                <TableHead>
                  <TableRow>
                    {SCREEN_COLUMNS.map((col) => (
                      <TableCell 
                        key={col.key}
                        align={col.center ? 'center' : col.numeric ? 'right' : 'left'}
                        style={{ 
                          fontWeight: 'bold', 
                          backgroundColor: '#494cf1', 
                          color: '#fff', 
                          whiteSpace: 'nowrap',
                          position: 'sticky', 
                          top: 0, 
                          zIndex: 4,
                          borderRight: '1px solid #7779e8'
                        }}
                      >
                        <TableSortLabel 
                          active={sortConfig.group === group && sortConfig.key === col.key} 
                          direction={sortConfig.group === group && sortConfig.key === col.key ? sortConfig.direction : 'asc'} 
                          onClick={() => requestSort(group, col.key)} 
                          sx={{ '&.MuiTableSortLabel-root': { color: '#fff' }, '&.MuiTableSortLabel-root:hover': { color: '#cce0ff' }, '&.Mui-active': { color: '#fff' }, '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}>
                          {col.label}
                        </TableSortLabel>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {rows.map((item, index) => (
                    <TableRow key={index} hover style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f5f8ff' }}>
                      {renderScreenRow(item).map((cell, ci) => (
                        <TableCell
                          key={ci}
                          align={
                            SCREEN_COLUMNS[ci]?.numeric ? 'right' 
                            : SCREEN_COLUMNS[ci]?.center ? 'center' 
                            : 'left'
                          }
                          style={{ 
                            fontSize: '0.78rem', 
                            whiteSpace: ci === 0 ? 'nowrap' : 'normal',
                            color: ci === 2 ? '#16a34a' : ci === 3 ? '#dc2626' : 'inherit',
                            fontWeight: ci === 4 ? 'bold' : 'normal'
                          }}
                        >
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>

                <TableFooter style={{ position: 'sticky', bottom: 0, zIndex: 2 }}>
                  <TableRow style={{ backgroundColor: '#ffffcc' }}>
                    <TableCell style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>GROUP TOTAL</TableCell>
                    <TableCell style={{ fontWeight: 'bold', fontSize: '0.78rem' }} />
                    <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem', color: '#16a34a' }}>
                      {formatReadableAmount(groupTotals.inwqntl.toFixed(2))}
                    </TableCell>
                    <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem', color: '#dc2626' }}>
                      {formatReadableAmount(groupTotals.outqntl.toFixed(2))}
                    </TableCell>
                    {[...Array(7)].map((_, i) => (
                      <TableCell key={i} style={{ fontWeight: 'bold', fontSize: '0.78rem' }} />
                    ))}
                  </TableRow>
                </TableFooter>
              </Table>
            </TableContainer>
          </div>
        );
      })}

      {/* Grand Total Footer */}
      {Object.keys(rawGrouped).length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableFooter>
                <TableRow style={{ backgroundColor: '#ffffcc' }}>
                  <TableCell style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>GRAND TOTAL</TableCell>
               
                  <TableCell align="left" style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#16a34a' }}>
                   Total Inward Qntl : {formatReadableAmount(grandTotals.inwqntl.toFixed(2))}
                  </TableCell>
                  <TableCell align="left" style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#dc2626' }}>
                    Total Outward Qntl : {formatReadableAmount(grandTotals.outqntl.toFixed(2))}
                  </TableCell>
                  {[...Array(7)].map((_, i) => (
                    <TableCell key={i} style={{ fontWeight: 'bold', fontSize: '0.85rem' }} />
                  ))}
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        </div>
      )}

      {loading && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)', zIndex: 9999,
        }}>
          <ScaleLoader color="#36d7b7" height={35} width={4} radius={2} margin={2} />
        </div>
      )}
    </div>
  );
};

export default StockReportDetail;
