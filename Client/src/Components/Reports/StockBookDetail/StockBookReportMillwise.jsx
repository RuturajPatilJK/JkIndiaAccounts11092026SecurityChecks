
// import React, { useEffect, useState, useRef, useCallback } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { jsPDF } from "jspdf";
// import "jspdf-autotable";
// import * as XLSX from "xlsx";
// import PdfPreview from "../../../Common/PDFPreview";
// import { RingLoader } from "react-spinners";
// import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
// import BackButton from "../../../Common/Buttons/BackButton";

// const API_URL = process.env.REACT_APP_API;

// /* ─── icons ─── */
// const IconPDF = () => (
//   <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//     <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
//     <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
//   </svg>
// );
// const IconXLS = () => (
//   <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//     <rect x="2" y="2" width="20" height="20" rx="2" />
//     <line x1="2" y1="8" x2="22" y2="8" /><line x1="2" y1="14" x2="22" y2="14" />
//     <line x1="8" y1="8" x2="8" y2="22" /><line x1="14" y1="8" x2="14" y2="22" />
//   </svg>
// );
// const IconPrint = () => (
//   <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//     <polyline points="6 9 6 2 18 2 18 9" />
//     <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
//     <rect x="6" y="14" width="12" height="8" />
//   </svg>
// );
// const SortIcon = ({ direction }) => (
//   <span style={{ display: "inline-flex", flexDirection: "column", marginLeft: 4, lineHeight: 1 }}>
//     <span style={{ opacity: direction === "asc" ? 1 : 0.3, fontSize: 8 }}>▲</span>
//     <span style={{ opacity: direction === "desc" ? 1 : 0.3, fontSize: 8 }}>▼</span>
//   </span>
// );

// /* ─── columns ─── */
// const COLUMNS = [
//   { key: "doc_date", subLabel: "Date", align: "center", type: "date" },
//   { key: "op_qty", subLabel: "Qty (Qtls)", align: "right", type: "number" },
//   { key: "op_value", subLabel: "Value (₹)", align: "right", type: "number" },
//   { key: "purc_qty", subLabel: "Qty (Qtls)", align: "right", type: "number" },
//   { key: "purc_value", subLabel: "Value (₹)", align: "right", type: "number" },
//   { key: "sale_qty", subLabel: "Qty (Qtls)", align: "right", type: "number" },
//   { key: "sale_val", subLabel: "Value (₹)", align: "right", type: "number" },
//   { key: "close_qty", subLabel: "Qty (Qtls)", align: "right", type: "number" },
//   { key: "close_val", subLabel: "Value (₹)", align: "right", type: "number" },
// ];

// /* soft pastel group span headers */
// const GROUP_HEADERS = [
//   { label: "Date", span: 1, bg: "#f1f5f9", color: "#64748b" },
//   { label: "Opening", span: 2, bg: "#eff6ff", color: "#3b82f6" },
//   { label: "Purchase", span: 2, bg: "#f0fdf4", color: "#22c55e" },
//   { label: "Sale", span: 2, bg: "#fff1f2", color: "#f43f5e" },
//   { label: "Closing", span: 2, bg: "#fffbeb", color: "#f59e0b" },
// ];

// /* ─── helpers ─── */
// const formatDate = (d) => {
//   if (!d) return "";
//   const dt = new Date(d);
//   return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
// };
// const fnum = (v) => (parseFloat(v) || 0).toFixed(2);

// const getKey = (obj, candidates) => {
//   for (const k of candidates) if (k in obj) return k;
//   return candidates[candidates.length - 1];
// };

// const groupBy = (arr, keys) => {
//   if (!arr || arr.length === 0) return {};
//   const pk = getKey(arr[0], keys);
//   const grouped = arr.reduce((acc, item) => {
//     const k = (item[pk] ?? "Unknown").toString();
//     (acc[k] = acc[k] || []).push(item);
//     return acc;
//   }, {});
//   const sorted = {};
//   Object.keys(grouped).sort((a, b) => a.localeCompare(b)).forEach((k) => { sorted[k] = grouped[k]; });
//   return sorted;
// };

// const calcTotals = (rows) =>
//   rows.reduce(
//     (acc, r) => {
//       acc.op_qty += parseFloat(r.op_qty) || 0;
//       acc.op_value += parseFloat(r.op_value) || 0;
//       acc.purc_qty += parseFloat(r.purc_qty) || 0;
//       acc.purc_value += parseFloat(r.purc_value) || 0;
//       acc.sale_qty += parseFloat(r.sale_qty) || 0;
//       acc.sale_val += parseFloat(r.sale_val) || 0;
//       acc.close_qty += parseFloat(r.close_qty) || 0;
//       acc.close_val += parseFloat(r.close_val) || 0;
//       return acc;
//     },
//     { op_qty: 0, op_value: 0, purc_qty: 0, purc_value: 0, sale_qty: 0, sale_val: 0, close_qty: 0, close_val: 0 }
//   );

// const compareRows = (a, b, col, dir) => {
//   let va, vb;
//   if (col === "doc_date") { va = new Date(a.doc_date); vb = new Date(b.doc_date); }
//   else { va = parseFloat(a[col]) || 0; vb = parseFloat(b[col]) || 0; }
//   return dir === "asc" ? (va > vb ? 1 : va < vb ? -1 : 0) : (va < vb ? 1 : va > vb ? -1 : 0);
// };

// /* ─── style helpers ─── */
// const btnStyle = (bg) => ({
//   display: "inline-flex", alignItems: "center", gap: 7,
//   padding: "9px 18px", borderRadius: 8, border: "none", cursor: "pointer",
//   fontWeight: 600, fontSize: 13, color: "#fff", background: bg,
//   boxShadow: `0 2px 8px ${bg}55`, transition: "transform .15s",
//   whiteSpace: "nowrap",
// });
// const thStyle = (align) => ({
//   padding: "7px 10px", textAlign: align, background: "#f8fafc", color: "#475569",
//   border: "1px solid #e2e8f0", fontWeight: 700, fontSize: 11,
//   whiteSpace: "nowrap", cursor: "pointer", userSelect: "none",
// });
// const tdStyle = (align, even) => ({
//   padding: "7px 10px", textAlign: align, color: "#1e293b",
//   borderBottom: "1px solid #f1f5f9", background: even ? "#f8fafc" : "#fff",
//   fontSize: 12, whiteSpace: "nowrap",
// });
// const tfStyle = (align, color = "#1d4ed8", bg = "#dbeafe") => ({
//   padding: "8px 10px", textAlign: align, fontWeight: 700,
//   background: bg, color, borderTop: "2px solid #bfdbfe", fontSize: 12,
// });

// /* ══════════════════════════════════════════════════════════ */
// const StockBookReportMillwise = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const companyCode = sessionStorage.getItem("Company_Code");
//   const Year_Code = sessionStorage.getItem("Year_Code");
//   const companyName = sessionStorage.getItem("Company_Name");

//   const searchParams = new URLSearchParams(location.search);
//   const itemCode = searchParams.get("itemCode");
//   const toDate = searchParams.get("toDate");
//   const fromDate = searchParams.get("fromDate");

//   const [rawGrouped, setRawGrouped] = useState({});
//   const [sortState, setSortState] = useState({});
//   const [loading, setLoading] = useState(true);
//   const [pdfPreview, setPdfPreview] = useState(null);
//   const [showPreview, setShowPreview] = useState(false);

//   const getSorted = useCallback((group) => {
//     const rows = [...(rawGrouped[group] || [])];
//     const ss = sortState[group];
//     if (!ss) return rows;
//     return rows.sort((a, b) => compareRows(a, b, ss.col, ss.dir));
//   }, [rawGrouped, sortState]);

//   const handleSort = (group, colKey) => {
//     setSortState((prev) => {
//       const cur = prev[group];
//       const dir = cur?.col === colKey && cur.dir === "asc" ? "desc" : "asc";
//       return { ...prev, [group]: { col: colKey, dir } };
//     });
//   };

//   /* ── fetch ── */
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const res = await fetch(`${API_URL}/report-stock-book-millwise?fromDate=${fromDate}&company_code=${companyCode}&Item_Code=${itemCode ?? ""}&ToDate=${toDate}&Year_Code=${Year_Code}`);
//         const result = await res.json();
//         const filtered = (result.data || []).filter((item) => {
//           const d = new Date(item.doc_date);
//           return d >= new Date(fromDate) && d <= new Date(toDate);
//         });
//         setRawGrouped(groupBy(filtered, ["mill_name", "Mill_Name", "millname", "MillShortName"]));
//       } catch (e) {
//         console.error(e);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, [fromDate, toDate, companyCode, Year_Code, itemCode]);

//   /* ── PRINT — built entirely from data, never from DOM innerHTML ── */
//   const handlePrint = () => {
//     const groupsHTML = Object.keys(rawGrouped).map((group) => {
//       const rows = getSorted(group);
//       const totals = calcTotals(rows);

//       const bodyRows = rows.map((row, i) => `
//         <tr style="background:${i % 2 === 0 ? "#f8fafc" : "#ffffff"}">
//           <td style="text-align:center;padding:5px 7px;border:1px solid #e2e8f0">${formatDate(row.doc_date)}</td>
//           <td style="text-align:right;padding:5px 7px;border:1px solid #e2e8f0">${formatReadableAmount(fnum(row.op_qty))}</td>
//           <td style="text-align:right;padding:5px 7px;border:1px solid #e2e8f0">${formatReadableAmount(fnum(row.op_value))}</td>
//           <td style="text-align:right;padding:5px 7px;border:1px solid #e2e8f0;color:#15803d">${formatReadableAmount(fnum(row.purc_qty))}</td>
//           <td style="text-align:right;padding:5px 7px;border:1px solid #e2e8f0;color:#15803d">${formatReadableAmount(fnum(row.purc_value))}</td>
//           <td style="text-align:right;padding:5px 7px;border:1px solid #e2e8f0;color:#dc2626">${formatReadableAmount(fnum(row.sale_qty))}</td>
//           <td style="text-align:right;padding:5px 7px;border:1px solid #e2e8f0;color:#dc2626">${formatReadableAmount(fnum(row.sale_val))}</td>
//           <td style="text-align:right;padding:5px 7px;border:1px solid #e2e8f0">${formatReadableAmount(fnum(row.close_qty))}</td>
//           <td style="text-align:right;padding:5px 7px;border:1px solid #e2e8f0">${formatReadableAmount(fnum(row.close_val))}</td>
//         </tr>`).join("");

//       return `
//         <div style="margin-bottom:24px">
//           <div style="padding:8px 14px;background:#f0f7ff;border-left:4px solid #3b82f6;color:#1e40af;font-weight:700;font-size:12px;margin-bottom:4px">
//             MILL: ${group.toUpperCase()}
//           </div>
//           <table style="width:100%;border-collapse:collapse;font-size:9.5px">
//             <thead>
//               <tr>
//                 <th rowspan="2" style="padding:5px 7px;background:#f1f5f9;color:#64748b;border:1px solid #e2e8f0;text-align:center;vertical-align:middle">Date</th>
//                 <th colspan="2" style="padding:5px 7px;background:#eff6ff;color:#3b82f6;border:1px solid #e2e8f0;text-align:center">Opening</th>
//                 <th colspan="2" style="padding:5px 7px;background:#f0fdf4;color:#22c55e;border:1px solid #e2e8f0;text-align:center">Purchase</th>
//                 <th colspan="2" style="padding:5px 7px;background:#fff1f2;color:#f43f5e;border:1px solid #e2e8f0;text-align:center">Sale</th>
//                 <th colspan="2" style="padding:5px 7px;background:#fffbeb;color:#f59e0b;border:1px solid #e2e8f0;text-align:center">Closing</th>
//               </tr>
//               <tr>
//                 <th style="padding:4px 7px;background:#f8fafc;border:1px solid #e2e8f0;text-align:right">Qty (Qtls)</th>
//                 <th style="padding:4px 7px;background:#f8fafc;border:1px solid #e2e8f0;text-align:right">Value (₹)</th>
//                 <th style="padding:4px 7px;background:#f8fafc;border:1px solid #e2e8f0;text-align:right">Qty (Qtls)</th>
//                 <th style="padding:4px 7px;background:#f8fafc;border:1px solid #e2e8f0;text-align:right">Value (₹)</th>
//                 <th style="padding:4px 7px;background:#f8fafc;border:1px solid #e2e8f0;text-align:right">Qty (Qtls)</th>
//                 <th style="padding:4px 7px;background:#f8fafc;border:1px solid #e2e8f0;text-align:right">Value (₹)</th>
//                 <th style="padding:4px 7px;background:#f8fafc;border:1px solid #e2e8f0;text-align:right">Qty (Qtls)</th>
//                 <th style="padding:4px 7px;background:#f8fafc;border:1px solid #e2e8f0;text-align:right">Value (₹)</th>
//               </tr>
//             </thead>
//             <tbody>${bodyRows}</tbody>
//             <tfoot>
//               <tr style="font-weight:700">
//                 <td style="text-align:center;padding:5px 7px;background:#dbeafe;color:#1d4ed8;border:1px solid #bfdbfe">Total</td>
//                 <td style="text-align:right;padding:5px 7px;background:#dbeafe;color:#1d4ed8;border:1px solid #bfdbfe">${formatReadableAmount(totals.op_qty.toFixed(2))}</td>
//                 <td style="text-align:right;padding:5px 7px;background:#dbeafe;color:#1d4ed8;border:1px solid #bfdbfe">${formatReadableAmount(totals.op_value.toFixed(2))}</td>
//                 <td style="text-align:right;padding:5px 7px;background:#dcfce7;color:#15803d;border:1px solid #bbf7d0">${formatReadableAmount(totals.purc_qty.toFixed(2))}</td>
//                 <td style="text-align:right;padding:5px 7px;background:#dcfce7;color:#15803d;border:1px solid #bbf7d0">${formatReadableAmount(totals.purc_value.toFixed(2))}</td>
//                 <td style="text-align:right;padding:5px 7px;background:#fee2e2;color:#b91c1c;border:1px solid #fecaca">${formatReadableAmount(totals.sale_qty.toFixed(2))}</td>
//                 <td style="text-align:right;padding:5px 7px;background:#fee2e2;color:#b91c1c;border:1px solid #fecaca">${formatReadableAmount(totals.sale_val.toFixed(2))}</td>
//                 <td style="text-align:right;padding:5px 7px;background:#dbeafe;color:#1d4ed8;border:1px solid #bfdbfe">${formatReadableAmount(totals.close_qty.toFixed(2))}</td>
//                 <td style="text-align:right;padding:5px 7px;background:#dbeafe;color:#1d4ed8;border:1px solid #bfdbfe">${formatReadableAmount(totals.close_val.toFixed(2))}</td>
//               </tr>
//             </tfoot>
//           </table>
//         </div>`;
//     }).join("");

//     const printWindow = window.open("", "_blank");
//     printWindow.document.write(`<!DOCTYPE html>
//       <html><head>
//         <title>Stock Book Report (Mill-wise) — ${companyName}</title>
//         <style>
//           * { box-sizing: border-box; margin: 0; padding: 0; }
//           body { font-family: Arial, sans-serif; padding: 16px; color: #1e293b; }
//           .report-title   { text-align: center; font-size: 17px; font-weight: 700; margin-bottom: 4px; }
//           .report-subtitle { text-align: center; font-size: 13px; color: #555; font-weight: 600; margin-bottom: 4px; }
//           .report-dates   { text-align: center; font-size: 11px; color: #64748b; margin-bottom: 18px; }
//           @media print {
//             body { padding: 8px; }
//             @page { margin: 10mm; size: landscape; }
//           }
//         </style>
//       </head>
//       <body>
//         <div class="report-title">${companyName || ""}</div>
//         <div class="report-subtitle">Stock Book Report (Mill-wise)</div>
//         <div class="report-dates">From: <strong>${formatDate(fromDate)}</strong> &nbsp;|&nbsp; To: <strong>${formatDate(toDate)}</strong></div>
//         ${groupsHTML}
//         <script>
//           window.onload = function () {
//             setTimeout(function () { window.print(); }, 300);
//           };
//         <\/script>
//       </body></html>`);
//     printWindow.document.close();
//   };

//   /* ── PDF ── */
//   const generatePDF = () => {
//     const doc = new jsPDF("landscape", "mm", "a4");
//     const pageHeight = doc.internal.pageSize.height;
//     const pageWidth = doc.internal.pageSize.width;
//     const margin = 10;
//     let currentY = 34;

//     doc.setFontSize(14); doc.setFont("helvetica", "bold");
//     doc.text(companyName || "Company", pageWidth / 2, 10, { align: "center" });
//     doc.setFontSize(11); doc.setFont("helvetica", "normal");
//     doc.text("Stock Book Report (Mill-wise)", pageWidth / 2, 18, { align: "center" });
//     doc.setFontSize(9);
//     doc.text(`From Date: ${formatDate(fromDate)}   |   To Date: ${formatDate(toDate)}`, pageWidth / 2, 26, { align: "center" });

//     Object.keys(rawGrouped).forEach((group) => {
//       const rows = getSorted(group);
//       if (currentY + 20 > pageHeight - margin) { doc.addPage(); currentY = margin; }

//       doc.setFontSize(11); doc.setFont("helvetica", "bold");
//       doc.setTextColor(30, 86, 219);
//       doc.text(`Mill: ${group.toUpperCase()}`, pageWidth / 2, currentY, { align: "center" });
//       doc.setTextColor(40);
//       currentY += 8;

//       const totals = calcTotals(rows);
//       const tableData = rows.map((r) => [
//         formatDate(r.doc_date),
//         formatReadableAmount(fnum(r.op_qty)),
//         formatReadableAmount(fnum(r.op_value)),
//         formatReadableAmount(fnum(r.purc_qty)),
//         formatReadableAmount(fnum(r.purc_value)),
//         formatReadableAmount(fnum(r.sale_qty)),
//         formatReadableAmount(fnum(r.sale_val)),
//         formatReadableAmount(fnum(r.close_qty)),
//         formatReadableAmount(fnum(r.close_val)),
//       ]);
//       tableData.push([
//         "Total",
//         formatReadableAmount(totals.op_qty.toFixed(2)),
//         formatReadableAmount(totals.op_value.toFixed(2)),
//         formatReadableAmount(totals.purc_qty.toFixed(2)),
//         formatReadableAmount(totals.purc_value.toFixed(2)),
//         formatReadableAmount(totals.sale_qty.toFixed(2)),
//         formatReadableAmount(totals.sale_val.toFixed(2)),
//         formatReadableAmount(totals.close_qty.toFixed(2)),
//         formatReadableAmount(totals.close_val.toFixed(2)),
//       ]);

//       doc.autoTable({
//         startY: currentY,
//         head: [[
//           { content: "Date", rowSpan: 2, styles: { valign: "middle", halign: "center", fillColor: [241, 245, 249], textColor: [100, 116, 139] } },
//           { content: "Opening", colSpan: 2, styles: { halign: "center", fillColor: [239, 246, 255], textColor: [59, 130, 246] } },
//           { content: "Purchase", colSpan: 2, styles: { halign: "center", fillColor: [240, 253, 244], textColor: [34, 197, 94] } },
//           { content: "Sale", colSpan: 2, styles: { halign: "center", fillColor: [255, 241, 242], textColor: [244, 63, 94] } },
//           { content: "Closing", colSpan: 2, styles: { halign: "center", fillColor: [255, 251, 235], textColor: [245, 158, 11] } },
//         ], [
//           "Qty (Qtls)", "Value (₹)", "Qty (Qtls)", "Value (₹)",
//           "Qty (Qtls)", "Value (₹)", "Qty (Qtls)", "Value (₹)",
//         ]],
//         body: tableData,
//         styles: { fontSize: 7.5, cellPadding: 2.5, halign: "right" },
//         headStyles: { fontStyle: "bold" },
//         columnStyles: { 0: { halign: "center" } },
//         alternateRowStyles: { fillColor: [248, 250, 252] },
//         didParseCell: (data) => {
//           if (data.section === "body" && data.row.index === tableData.length - 1) {
//             data.cell.styles.fontStyle = "bold";
//             data.cell.styles.fillColor = [219, 234, 254];
//             data.cell.styles.textColor = [29, 78, 216];
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

//   /* ── XLSX — single sheet, all mills stacked ── */
//   const exportToExcel = () => {
//     const wb = XLSX.utils.book_new();
//     const sheetRows = [];

//     // Report info header
//     sheetRows.push([companyName || ""]);
//     sheetRows.push(["Stock Book Report (Mill-wise)"]);
//     sheetRows.push([`From Date: ${formatDate(fromDate)}   |   To Date: ${formatDate(toDate)}`]);
//     sheetRows.push([]);

//     // Single column header row
//     sheetRows.push([
//       "Mill Name", "Date",
//       "Opening Qty (Qtls)", "Opening Value (₹)",
//       "Purchase Qty (Qtls)", "Purchase Value (₹)",
//       "Sale Qty (Qtls)", "Sale Value (₹)",
//       "Closing Qty (Qtls)", "Closing Value (₹)",
//     ]);

//     // All mills in one block
//     Object.keys(rawGrouped).forEach((group) => {
//       const rows = getSorted(group);
//       const totals = calcTotals(rows);

//       rows.forEach((r, i) => {
//         sheetRows.push([
//           i === 0 ? group : "",   // show mill name only on first row of that group
//           formatDate(r.doc_date),
//           parseFloat(fnum(r.op_qty)),
//           parseFloat(fnum(r.op_value)),
//           parseFloat(fnum(r.purc_qty)),
//           parseFloat(fnum(r.purc_value)),
//           parseFloat(fnum(r.sale_qty)),
//           parseFloat(fnum(r.sale_val)),
//           parseFloat(fnum(r.close_qty)),
//           parseFloat(fnum(r.close_val)),
//         ]);
//       });

//       // Sub-total row per mill
//       sheetRows.push([
//         `${group} — Total`, "",
//         parseFloat(totals.op_qty.toFixed(2)),
//         parseFloat(totals.op_value.toFixed(2)),
//         parseFloat(totals.purc_qty.toFixed(2)),
//         parseFloat(totals.purc_value.toFixed(2)),
//         parseFloat(totals.sale_qty.toFixed(2)),
//         parseFloat(totals.sale_val.toFixed(2)),
//         parseFloat(totals.close_qty.toFixed(2)),
//         parseFloat(totals.close_val.toFixed(2)),
//       ]);

//       sheetRows.push([]); // blank separator between mills
//     });

//     const ws = XLSX.utils.aoa_to_sheet(sheetRows);
//     ws["!cols"] = [
//       { wch: 28 }, { wch: 13 },
//       { wch: 18 }, { wch: 18 },
//       { wch: 18 }, { wch: 18 },
//       { wch: 16 }, { wch: 16 },
//       { wch: 18 }, { wch: 18 },
//     ];

//     XLSX.utils.book_append_sheet(wb, ws, "Stock Book Millwise");
//     XLSX.writeFile(wb, `Stock_Book_Millwise_${formatDate(fromDate).replace(/\//g, "-")}_${formatDate(toDate).replace(/\//g, "-")}.xlsx`);
//   };

//   /* ─── render ─── */
//   if (loading) return (
//     <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
//       <RingLoader color="#3b82f6" />
//     </div>
//   );

//   return (
//     <div style={{ padding: "24px 28px", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", background: "#f0f4f8", minHeight: "100vh" }}>

//       {/* top bar */}
//       <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
//         <BackButton onClick={() => navigate("/stock-book")} />
//         <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
//           {showPreview && pdfPreview && (
//             <PdfPreview pdfData={pdfPreview} apiData={rawGrouped} label="Stock Book Report (Mill-wise)" />
//           )}
//           {/* <button style={btnStyle("#e53e3e")} onClick={generatePDF}
//             onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
//             onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}>
//             <IconPDF /> PDF Preview
//           </button> */}
//           <button style={btnStyle("#7c3aed")} onClick={handlePrint}
//             onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
//             onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}>
//             <IconPrint /> Print
//           </button>
//           <button style={btnStyle("#16a34a")} onClick={exportToExcel}
//             onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
//             onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}>
//             <IconXLS /> Export to Excel
//           </button>
//         </div>
//       </div>

//       {/* heading */}
//       <h2 style={{ textAlign: "center", fontSize: 22, fontWeight: 700, color: "#1e293b", margin: "0 0 4px" }}>
//         {companyName}
//       </h2>
//       <p style={{ textAlign: "center", fontSize: 13, color: "#64748b", marginBottom: 20 }}>
//         <strong>Stock Book Report (Mill-wise)</strong>&nbsp;&nbsp;|&nbsp;&nbsp;
//         From:&nbsp;<strong>{formatDate(fromDate)}</strong>&nbsp;&nbsp;To:&nbsp;<strong>{formatDate(toDate)}</strong>
//       </p>

//       {/* groups */}
//       {Object.keys(rawGrouped).map((group) => {
//         const rows = getSorted(group);
//         const totals = calcTotals(rows);
//         const ss = sortState[group] || {};

//         return (
//           <div key={group} style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,.07)", marginBottom: 28, overflow: "hidden" }}>

//             {/* ── mill header — soft, left-aligned ── */}
//             <div style={{
//               padding: "11px 18px",
//               background: "#f0f7ff",
//               borderLeft: "4px solid #3b82f6",
//               borderBottom: "1px solid #dbeafe",
//               color: "#1e40af",
//               fontWeight: 700,
//               fontSize: 14,
//               letterSpacing: 0.2,
//               textAlign: "left",
//             }}>
//               MILL: {group.toUpperCase()}
//             </div>

//             <div style={{ overflowX: "auto" }}>
//               <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
//                 <thead>
//                   <tr>
//                     {GROUP_HEADERS.map((gh, i) => (
//                       <th key={i} colSpan={gh.span}
//                         style={{
//                           padding: "7px 10px", textAlign: "center",
//                           background: gh.bg, color: gh.color,
//                           border: "1px solid #e2e8f0", fontWeight: 700, fontSize: 11
//                         }}>
//                         {gh.label}
//                       </th>
//                     ))}
//                   </tr>
//                   <tr>
//                     {COLUMNS.map((col) => (
//                       <th key={col.key} style={thStyle(col.align)}
//                         onClick={() => handleSort(group, col.key)}
//                         title={`Sort by ${col.subLabel}`}>
//                         {col.subLabel}
//                         <SortIcon direction={ss.col === col.key ? ss.dir : null} />
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {rows.map((row, i) => (
//                     <tr key={i}
//                       onMouseEnter={(e) => e.currentTarget.querySelectorAll("td").forEach((td) => { td.style.background = "#eff6ff"; })}
//                       onMouseLeave={(e) => {
//                         const even = i % 2 === 0;
//                         e.currentTarget.querySelectorAll("td").forEach((td) => { td.style.background = even ? "#f8fafc" : "#fff"; });
//                       }}>
//                       <td style={tdStyle("center", i % 2 === 0)}>{formatDate(row.doc_date)}</td>
//                       <td style={tdStyle("right", i % 2 === 0)}>{formatReadableAmount(fnum(row.op_qty))}</td>
//                       <td style={tdStyle("right", i % 2 === 0)}>{formatReadableAmount(fnum(row.op_value))}</td>
//                       <td style={{ ...tdStyle("right", i % 2 === 0), color: "#15803d", fontWeight: 500 }}>{formatReadableAmount(fnum(row.purc_qty))}</td>
//                       <td style={{ ...tdStyle("right", i % 2 === 0), color: "#15803d", fontWeight: 500 }}>{formatReadableAmount(fnum(row.purc_value))}</td>
//                       <td style={{ ...tdStyle("right", i % 2 === 0), color: "#dc2626", fontWeight: 500 }}>{formatReadableAmount(fnum(row.sale_qty))}</td>
//                       <td style={{ ...tdStyle("right", i % 2 === 0), color: "#dc2626", fontWeight: 500 }}>{formatReadableAmount(fnum(row.sale_val))}</td>
//                       <td style={tdStyle("right", i % 2 === 0)}>{formatReadableAmount(fnum(row.close_qty))}</td>
//                       <td style={tdStyle("right", i % 2 === 0)}>{formatReadableAmount(fnum(row.close_val))}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//                 <tfoot>
//                   <tr>
//                     <td style={tfStyle("center")}>Total</td>
//                     <td style={tfStyle("right")}>{formatReadableAmount(totals.op_qty.toFixed(2))}</td>
//                     <td style={tfStyle("right")}>{formatReadableAmount(totals.op_value.toFixed(2))}</td>
//                     <td style={tfStyle("right", "#15803d", "#dcfce7")}>{formatReadableAmount(totals.purc_qty.toFixed(2))}</td>
//                     <td style={tfStyle("right", "#15803d", "#dcfce7")}>{formatReadableAmount(totals.purc_value.toFixed(2))}</td>
//                     <td style={tfStyle("right", "#b91c1c", "#fee2e2")}>{formatReadableAmount(totals.sale_qty.toFixed(2))}</td>
//                     <td style={tfStyle("right", "#b91c1c", "#fee2e2")}>{formatReadableAmount(totals.sale_val.toFixed(2))}</td>
//                     <td style={tfStyle("right")}>{formatReadableAmount(totals.close_qty.toFixed(2))}</td>
//                     <td style={tfStyle("right")}>{formatReadableAmount(totals.close_val.toFixed(2))}</td>
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

// export default StockBookReportMillwise;




































import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';
import { ScaleLoader } from 'react-spinners';
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
  { label: 'Item Name', key: 'item_name', width: '18%' },
  { label: 'Open Qty', key: 'op_qty', width: '8%', numeric: true },
  { label: 'Open Value', key: 'op_value', width: '9%', numeric: true },
  { label: 'Purchase Qty', key: 'purc_qty', width: '8%', numeric: true },
  { label: 'Purchase Value', key: 'purc_value', width: '9%', numeric: true },
  { label: 'Sale Qty', key: 'sale_qty', width: '8%', numeric: true },
  { label: 'Sale Value', key: 'sale_val', width: '9%', numeric: true },
  { label: 'Close Qty', key: 'close_qty', width: '8%', numeric: true },
  { label: 'Close Value', key: 'close_val', width: '9%', numeric: true },
  { label: 'Day Diff', key: 'day_diff', width: '6%', numeric: true },
];

const PRINT_COLUMNS = [
  { label: 'Mill Name', key: 'mill_name', printWidth: '30mm' },
  { label: 'Date', key: 'doc_date', printWidth: '18mm', center: true },
  { label: 'Open Qty', key: 'op_qty', printWidth: '18mm', numeric: true },
  { label: 'Open Value', key: 'op_value', printWidth: '20mm', numeric: true },
  { label: 'Purchase Qty', key: 'purc_qty', printWidth: '18mm', numeric: true },
  { label: 'Purchase Value', key: 'purc_value', printWidth: '20mm', numeric: true },
  { label: 'Sale Qty', key: 'sale_qty', printWidth: '18mm', numeric: true },
  { label: 'Sale Value', key: 'sale_val', printWidth: '20mm', numeric: true },
  { label: 'Close Qty', key: 'close_qty', printWidth: '18mm', numeric: true },
  { label: 'Close Value', key: 'close_val', printWidth: '20mm', numeric: true },
  { label: 'Day Diff', key: 'day_diff', printWidth: '16mm', numeric: true },
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

const getKey = (obj, candidates) => {
  for (const k of candidates) if (k in obj) return k;
  return candidates[candidates.length - 1];
};

const groupBy = (arr, keys) => {
  if (!arr || arr.length === 0) return {};
  const pk = getKey(arr[0], keys);
  const grouped = arr.reduce((acc, item) => {
    const k = (item[pk] ?? "Unknown").toString();
    (acc[k] = acc[k] || []).push(item);
    return acc;
  }, {});
  const sorted = {};
  Object.keys(grouped).sort((a, b) => a.localeCompare(b)).forEach((k) => { sorted[k] = grouped[k]; });
  return sorted;
};

// ─── Component ─────────────────────────────────────────────────────────────────

const StockBookReportMillwise = () => {
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
          `${API_URL}/report-stock-book-millwise?fromDate=${fromDate}&company_code=${companyCode}&Item_Code=${itemCode}&ToDate=${toDate}&Year_Code=${Year_Code}`
        );
        const json = await res.json();

        const filtered = (json.data || [])
          .filter((item) => {
            const d = new Date(item.doc_date);
            return d >= new Date(fromDate) && d <= new Date(toDate);
          })
          .map((item) => ({
            ...item,
            day_diff: num(item.purc_qty) - num(item.sale_qty),
          }));

        setRawGrouped(groupBy(filtered, ["mill_name", "Mill_Name", "millname", "MillShortName"]));
      } catch (err) {
        console.error(err);
        setError('Error fetching stock book report');
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
        const va = a[sortConfig.key];
        const vb = b[sortConfig.key];
        const na = Number(va), nb = Number(vb);
        const compare = isNaN(na) || isNaN(nb)
          ? String(va).localeCompare(String(vb))
          : na - nb;
        return sortConfig.direction === 'asc' ? compare : -compare;
      });
    }
    return rows;
  }, [rawGrouped, sortConfig]);

  // ── Grand Totals (all mills combined) ──
  const grandTotals = useMemo(() => {
    const allData = Object.values(rawGrouped).flat();
    return allData.reduce((acc, item) => {
      acc.op_qty += num(item.op_qty);
      acc.op_value += num(item.op_value);
      acc.purc_qty += num(item.purc_qty);
      acc.purc_value += num(item.purc_value);
      acc.sale_qty += num(item.sale_qty);
      acc.sale_val += num(item.sale_val);
      acc.close_qty += num(item.close_qty);
      acc.close_val += num(item.close_val);
      return acc;
    }, { op_qty: 0, op_value: 0, purc_qty: 0, purc_value: 0, sale_qty: 0, sale_val: 0, close_qty: 0, close_val: 0 });
  }, [rawGrouped]);

  // ── Row renderers ─────────────────────────────────────────────────────────
  const renderScreenRow = (item) => [
    formatDate(item.doc_date),
    item.item_name,
    formatReadableAmount(num(item.op_qty).toFixed(2)),
    formatReadableAmount(num(item.op_value).toFixed(2)),
    formatReadableAmount(num(item.purc_qty).toFixed(2)),
    formatReadableAmount(num(item.purc_value).toFixed(2)),
    formatReadableAmount(num(item.sale_qty).toFixed(2)),
    formatReadableAmount(num(item.sale_val).toFixed(2)),
    formatReadableAmount(num(item.close_qty).toFixed(2)),
    formatReadableAmount(num(item.close_val).toFixed(2)),
    formatReadableAmount(num(item.day_diff).toFixed(2)),
  ];

  const renderPrintRow = (item) => [
    item.mill_name || item.Mill_Name || '',
    formatDate(item.doc_date),
    formatReadableAmount(num(item.op_qty).toFixed(2)),
    formatReadableAmount(num(item.op_value).toFixed(2)),
    formatReadableAmount(num(item.purc_qty).toFixed(2)),
    formatReadableAmount(num(item.purc_value).toFixed(2)),
    formatReadableAmount(num(item.sale_qty).toFixed(2)),
    formatReadableAmount(num(item.sale_val).toFixed(2)),
    formatReadableAmount(num(item.close_qty).toFixed(2)),
    formatReadableAmount(num(item.close_val).toFixed(2)),
    formatReadableAmount(num(item.day_diff).toFixed(2)),
  ];

  const printFooterValues = [
    'GRAND TOTAL', '',
    formatReadableAmount(grandTotals.op_qty.toFixed(2)),
    formatReadableAmount(grandTotals.op_value.toFixed(2)),
    formatReadableAmount(grandTotals.purc_qty.toFixed(2)),
    formatReadableAmount(grandTotals.purc_value.toFixed(2)),
    formatReadableAmount(grandTotals.sale_qty.toFixed(2)),
    formatReadableAmount(grandTotals.sale_val.toFixed(2)),
    formatReadableAmount(grandTotals.close_qty.toFixed(2)),
    formatReadableAmount(grandTotals.close_val.toFixed(2)),
    '',
  ];

  const reportSubtitle = `${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`;

  // ── Excel Export (with right alignment for numeric columns) ──
  const handleExportToExcel = () => {
    const headers = ['Mill Name', ...SCREEN_COLUMNS.map(c => c.label)];

    const companyNameRow = [companyName?.toUpperCase()];
    const gstRow = [`GST No: ${companyGST}`];
    const periodRow = [`Period: ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`];
    const emptyRow = [];

    const tableData = [];
    Object.keys(rawGrouped).forEach((group) => {
      const rows = getSortedData(group);
      rows.forEach((item) => {
        const row = [
          group,
          formatDate(item.doc_date),
          item.item_name,
          num(item.op_qty),
          num(item.op_value),
          num(item.purc_qty),
          num(item.purc_value),
          num(item.sale_qty),
          num(item.sale_val),
          num(item.close_qty),
          num(item.close_val),
          num(item.day_diff),
        ];
        tableData.push(row);
      });
    });

    const totalRow = [
      'GRAND TOTAL', '', '',
      grandTotals.op_qty,
      grandTotals.op_value,
      grandTotals.purc_qty,
      grandTotals.purc_value,
      grandTotals.sale_qty,
      grandTotals.sale_val,
      grandTotals.close_qty,
      grandTotals.close_val,
      '',
    ];

    const worksheetData = [companyNameRow, gstRow, periodRow, emptyRow, headers, ...tableData, totalRow];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
    ];

    // Column widths + right-align numeric columns
    const allColumns = [{ wch: 25 }, ...SCREEN_COLUMNS.map(c => ({ wch: c.numeric ? 16 : 22 }))];
    ws['!cols'] = allColumns;

    const range = XLSX.utils.decode_range(ws['!ref']);
    const headerRowIndex = 4; // 0-based row index of the header row

    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[addr]) continue;

        if (!ws[addr].s) ws[addr].s = {};

        // Numeric columns (skip first column which is Mill Name)
        if (R >= headerRowIndex && C >= 3 && (C === 3 || C === 4 || C === 5 || C === 6 || C === 7 || C === 8 || C === 9 || C === 10 || C === 11)) {
          ws[addr].s.alignment = { horizontal: 'right' };
        } else if (C === 1) { // Date column
          ws[addr].s.alignment = { horizontal: 'center' };
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, 'StockBookMillwise');
    XLSX.writeFile(wb, `StockBook_Millwise_${fromDate}_to_${toDate}.xlsx`);
  };

  const handleGeneratePDF = () => {
    const flattenedData = [];
    Object.keys(rawGrouped).forEach((group) => {
      const rows = getSortedData(group);
      rows.forEach((row) => {
        flattenedData.push({
          ...row,
          mill_name: group,
        });
      });
    });

    generateReportPDF({
      title: 'Stock Book Report (Mill-wise)',
      subtitle: reportSubtitle,
      columns: PRINT_COLUMNS.map(c => c.label),
      columnWidths: [30, 18, 18, 20, 18, 20, 18, 20, 18, 20, 16],
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
        title="Stock Book Report (Mill-wise)"
        subtitle={reportSubtitle}
        companyName={companyName}
        companyGST={companyGST}
        columns={PRINT_COLUMNS}
        rows={Object.values(rawGrouped).flat()}
        rowRenderer={renderPrintRow}
        footerValues={printFooterValues}
        amountInWords={ConvertNumberToWord(grandTotals.close_val)}
        headerImg={HeaderJK}
        footerImg={FooterJK}
      />

      {/* Screen header */}
      <Typography variant="h5" align="center" style={{ fontWeight: 'bold', marginTop: '-50px' }}>
        {companyName}
      </Typography>
      <Typography variant="subtitle1" align="center">GSTN: {companyGST}</Typography>
      <Typography variant="h6" align="center">Stock Book Report (Mill-wise)</Typography>
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

      {pdfPreview && <PdfPreview pdfData={pdfPreview} label="StockdetailReportMillWise" />}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Screen table - Grouped by Mill */}
      {Object.keys(rawGrouped).map((group) => {
        const rows = getSortedData(group);
        const groupTotals = rows.reduce((acc, item) => {
          acc.op_qty += num(item.op_qty);
          acc.op_value += num(item.op_value);
          acc.purc_qty += num(item.purc_qty);
          acc.purc_value += num(item.purc_value);
          acc.sale_qty += num(item.sale_qty);
          acc.sale_val += num(item.sale_val);
          acc.close_qty += num(item.close_qty);
          acc.close_val += num(item.close_val);
          return acc;
        }, { op_qty: 0, op_value: 0, purc_qty: 0, purc_value: 0, sale_qty: 0, sale_val: 0, close_qty: 0, close_val: 0 });

        return (
          <div key={group} style={{ marginBottom: '30px', marginTop: '20px' }}>
            {/* Mill Header */}
            <Typography 
              variant="h6" 
              style={{ 
                backgroundColor: '#ffffff', 
                color: '#600ff7', 
                padding: '10px 15px', 
                borderRadius: '5px 5px 0 0',
                marginBottom: 0,
                fontWeight: 'bold',
                textAlign: 'left',
              }}
            >
              # {group.toUpperCase()}
            </Typography>

            <TableContainer component={Paper} style={{ maxHeight: '500px', position: 'relative', borderRadius: '0 0 5px 5px' }}>
              <Table size="small" style={{ borderCollapse: 'separate' }}>
                <TableHead>
                  {/* ── Row 1: group labels (sticky) ── */}
                  <TableRow>
                    <TableCell rowSpan={2} align="center" style={{ fontWeight: 'bold', backgroundColor: '#a8bfff', color: '#000000', whiteSpace: 'nowrap', verticalAlign: 'middle', borderRight: '1px solid #7779e8', position: 'sticky', top: 0, zIndex: 4 }}>
                      <TableSortLabel 
                        active={sortConfig.group === group && sortConfig.key === 'doc_date'} 
                        direction={sortConfig.group === group && sortConfig.key === 'doc_date' ? sortConfig.direction : 'asc'} 
                        onClick={() => requestSort(group, 'doc_date')} 
                        sx={{ '&.MuiTableSortLabel-root': { color: '#000000' }, '&.MuiTableSortLabel-root:hover': { color: '#000000' }, '&.Mui-active': { color: '#000000' }, '& .MuiTableSortLabel-icon': { color: '#000000 !important' } }}>
                        Date
                      </TableSortLabel>
                    </TableCell>
                    <TableCell rowSpan={2} align="left" style={{ fontWeight: 'bold', backgroundColor: '#a8bfff', color: '#000000', whiteSpace: 'nowrap', verticalAlign: 'middle', borderRight: '1px solid #7779e8', position: 'sticky', top: 0, zIndex: 4 }}>
                      <TableSortLabel 
                        active={sortConfig.group === group && sortConfig.key === 'item_name'} 
                        direction={sortConfig.group === group && sortConfig.key === 'item_name' ? sortConfig.direction : 'asc'} 
                        onClick={() => requestSort(group, 'item_name')} 
                        sx={{ '&.MuiTableSortLabel-root': { color: '#000000' }, '&.MuiTableSortLabel-root:hover': { color: '#000000' }, '&.Mui-active': { color: '#000000' }, '& .MuiTableSortLabel-icon': { color: '#000000 !important' } }}>
                        Item Name
                      </TableSortLabel>
                    </TableCell>
                    <TableCell colSpan={2} align="center" style={{ fontWeight: 'bold', backgroundColor: '#6ea3ee', color: '#000', borderRight: '1px solid #7779e8', borderBottom: '1px solid #7779e8', position: 'sticky', top: 0, zIndex: 3 }}>
                      Opening
                    </TableCell>
                    <TableCell colSpan={2} align="center" style={{ fontWeight: 'bold', backgroundColor: '#94ceac', color: '#000', borderRight: '1px solid #7779e8', borderBottom: '1px solid #7779e8', position: 'sticky', top: 0, zIndex: 3 }}>
                      Purchase
                    </TableCell>
                    <TableCell colSpan={2} align="center" style={{ fontWeight: 'bold', backgroundColor: '#c26a60', color: '#000', borderRight: '1px solid #7779e8', borderBottom: '1px solid #7779e8', position: 'sticky', top: 0, zIndex: 3 }}>
                      Sale
                    </TableCell>
                    <TableCell colSpan={2} align="center" style={{ fontWeight: 'bold', backgroundColor: '#e09859', color: '#000', borderRight: '1px solid #7779e8', borderBottom: '1px solid #7779e8', position: 'sticky', top: 0, zIndex: 3 }}>
                      Closing
                    </TableCell>
                    <TableCell rowSpan={2} align="right" style={{ fontWeight: 'bold', backgroundColor: '#a8bfff', color: '#000000', whiteSpace: 'nowrap', verticalAlign: 'middle', position: 'sticky', top: 0, zIndex: 4 }}>
                      <TableSortLabel 
                        active={sortConfig.group === group && sortConfig.key === 'day_diff'} 
                        direction={sortConfig.group === group && sortConfig.key === 'day_diff' ? sortConfig.direction : 'asc'} 
                        onClick={() => requestSort(group, 'day_diff')} 
                        sx={{ '&.MuiTableSortLabel-root': { color: '#000000' }, '&.MuiTableSortLabel-root:hover': { color: '#000000' }, '&.Mui-active': { color: '#fff' }, '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}>
                        Day Diff
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>

                  {/* ── Row 2: Qty / Value sub-headers ── */}
                  <TableRow>
                    <TableCell align="right" style={{ fontWeight: 'bold', backgroundColor: '#6ea3ee', color: '#000', whiteSpace: 'nowrap', position: 'sticky', top: 33, zIndex: 3 }}>
                      <TableSortLabel active={sortConfig.group === group && sortConfig.key === 'op_qty'} direction={sortConfig.group === group && sortConfig.key === 'op_qty' ? sortConfig.direction : 'asc'} onClick={() => requestSort(group, 'op_qty')} sx={{ '&.MuiTableSortLabel-root': { color: '#000' }, '&.MuiTableSortLabel-root:hover': { color: '#fff' }, '&.Mui-active': { color: '#fff' }, '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}>
                        Quintal
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right" style={{ fontWeight: 'bold', backgroundColor: '#6ea3ee', color: '#000', whiteSpace: 'nowrap', borderRight: '1px solid #7779e8', position: 'sticky', top: 33, zIndex: 3 }}>
                      <TableSortLabel active={sortConfig.group === group && sortConfig.key === 'op_value'} direction={sortConfig.group === group && sortConfig.key === 'op_value' ? sortConfig.direction : 'asc'} onClick={() => requestSort(group, 'op_value')} sx={{ '&.MuiTableSortLabel-root': { color: '#000' }, '&.MuiTableSortLabel-root:hover': { color: '#fff' }, '&.Mui-active': { color: '#fff' }, '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}>
                        Value
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right" style={{ fontWeight: 'bold', backgroundColor: '#94ceac', color: '#000', whiteSpace: 'nowrap', position: 'sticky', top: 33, zIndex: 3 }}>
                      <TableSortLabel active={sortConfig.group === group && sortConfig.key === 'purc_qty'} direction={sortConfig.group === group && sortConfig.key === 'purc_qty' ? sortConfig.direction : 'asc'} onClick={() => requestSort(group, 'purc_qty')} sx={{ '&.MuiTableSortLabel-root': { color: '#000' }, '&.MuiTableSortLabel-root:hover': { color: '#fff' }, '&.Mui-active': { color: '#fff' }, '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}>
                        Quintal
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right" style={{ fontWeight: 'bold', backgroundColor: '#94ceac', color: '#000', whiteSpace: 'nowrap', borderRight: '1px solid #7779e8', position: 'sticky', top: 33, zIndex: 3 }}>
                      <TableSortLabel active={sortConfig.group === group && sortConfig.key === 'purc_value'} direction={sortConfig.group === group && sortConfig.key === 'purc_value' ? sortConfig.direction : 'asc'} onClick={() => requestSort(group, 'purc_value')} sx={{ '&.MuiTableSortLabel-root': { color: '#000' }, '&.MuiTableSortLabel-root:hover': { color: '#fff' }, '&.Mui-active': { color: '#fff' }, '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}>
                        Value
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right" style={{ fontWeight: 'bold', backgroundColor: '#c26a60', color: '#000', whiteSpace: 'nowrap', position: 'sticky', top: 33, zIndex: 3 }}>
                      <TableSortLabel active={sortConfig.group === group && sortConfig.key === 'sale_qty'} direction={sortConfig.group === group && sortConfig.key === 'sale_qty' ? sortConfig.direction : 'asc'} onClick={() => requestSort(group, 'sale_qty')} sx={{ '&.MuiTableSortLabel-root': { color: '#000' }, '&.MuiTableSortLabel-root:hover': { color: '#fff' }, '&.Mui-active': { color: '#fff' }, '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}>
                        Quintal
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right" style={{ fontWeight: 'bold', backgroundColor: '#c26a60', color: '#000', whiteSpace: 'nowrap', borderRight: '1px solid #7779e8', position: 'sticky', top: 33, zIndex: 3 }}>
                      <TableSortLabel active={sortConfig.group === group && sortConfig.key === 'sale_val'} direction={sortConfig.group === group && sortConfig.key === 'sale_val' ? sortConfig.direction : 'asc'} onClick={() => requestSort(group, 'sale_val')} sx={{ '&.MuiTableSortLabel-root': { color: '#000' }, '&.MuiTableSortLabel-root:hover': { color: '#fff' }, '&.Mui-active': { color: '#fff' }, '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}>
                        Value
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right" style={{ fontWeight: 'bold', backgroundColor: '#e09859', color: '#000', whiteSpace: 'nowrap', position: 'sticky', top: 33, zIndex: 3 }}>
                      <TableSortLabel active={sortConfig.group === group && sortConfig.key === 'close_qty'} direction={sortConfig.group === group && sortConfig.key === 'close_qty' ? sortConfig.direction : 'asc'} onClick={() => requestSort(group, 'close_qty')} sx={{ '&.MuiTableSortLabel-root': { color: '#000' }, '&.MuiTableSortLabel-root:hover': { color: '#fff' }, '&.Mui-active': { color: '#fff' }, '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}>
                        Quintal
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right" style={{ fontWeight: 'bold', backgroundColor: '#e09859', color: '#000', whiteSpace: 'nowrap', borderRight: '1px solid #7779e8', position: 'sticky', top: 33, zIndex: 3 }}>
                      <TableSortLabel active={sortConfig.group === group && sortConfig.key === 'close_val'} direction={sortConfig.group === group && sortConfig.key === 'close_val' ? sortConfig.direction : 'asc'} onClick={() => requestSort(group, 'close_val')} sx={{ '&.MuiTableSortLabel-root': { color: '#000' }, '&.MuiTableSortLabel-root:hover': { color: '#fff' }, '&.Mui-active': { color: '#fff' }, '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}>
                        Value
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {rows.map((item, index) => (
                    <TableRow key={index} hover style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f5f8ff' }}>
                      {renderScreenRow(item).map((cell, ci) => (
                        <TableCell
                          key={ci}
                          align={SCREEN_COLUMNS[ci]?.numeric ? 'right' : SCREEN_COLUMNS[ci]?.center ? 'center' : 'left'}
                          style={{ fontSize: '0.78rem', whiteSpace: ci === 0 ? 'nowrap' : 'normal' }}
                        >
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>

                <TableFooter style={{ position: 'sticky', bottom: 0, zIndex: 2 }}>
                  <TableRow style={{ backgroundColor: '#ffffcc' }}>
                    <TableCell style={{ fontWeight: 'bold', fontSize: '0.78rem' }} />
                    <TableCell style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>GROUP TOTAL</TableCell>
                    <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
                      {formatReadableAmount(groupTotals.op_qty.toFixed(2))}
                    </TableCell>
                    <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
                      {formatReadableAmount(groupTotals.op_value.toFixed(2))}
                    </TableCell>
                    <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
                      {formatReadableAmount(groupTotals.purc_qty.toFixed(2))}
                    </TableCell>
                    <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
                      {formatReadableAmount(groupTotals.purc_value.toFixed(2))}
                    </TableCell>
                    <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
                      {formatReadableAmount(groupTotals.sale_qty.toFixed(2))}
                    </TableCell>
                    <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
                      {formatReadableAmount(groupTotals.sale_val.toFixed(2))}
                    </TableCell>
                    <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
                      {formatReadableAmount(groupTotals.close_qty.toFixed(2))}
                    </TableCell>
                    <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
                      {formatReadableAmount(groupTotals.close_val.toFixed(2))}
                    </TableCell>
                    <TableCell style={{ fontWeight: 'bold', fontSize: '0.78rem' }} />
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
                  <TableCell style={{ fontWeight: 'bold', fontSize: '0.85rem' }} />
                  <TableCell style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>GRAND TOTAL</TableCell>
                  <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                    {formatReadableAmount(grandTotals.op_qty.toFixed(2))}
                  </TableCell>
                  <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                    {formatReadableAmount(grandTotals.op_value.toFixed(2))}
                  </TableCell>
                  <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                    {formatReadableAmount(grandTotals.purc_qty.toFixed(2))}
                  </TableCell>
                  <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                    {formatReadableAmount(grandTotals.purc_value.toFixed(2))}
                  </TableCell>
                  <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                    {formatReadableAmount(grandTotals.sale_qty.toFixed(2))}
                  </TableCell>
                  <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                    {formatReadableAmount(grandTotals.sale_val.toFixed(2))}
                  </TableCell>
                  <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                    {formatReadableAmount(grandTotals.close_qty.toFixed(2))}
                  </TableCell>
                  <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                    {formatReadableAmount(grandTotals.close_val.toFixed(2))}
                  </TableCell>
                  <TableCell style={{ fontWeight: 'bold', fontSize: '0.85rem' }} />
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

export default StockBookReportMillwise;

