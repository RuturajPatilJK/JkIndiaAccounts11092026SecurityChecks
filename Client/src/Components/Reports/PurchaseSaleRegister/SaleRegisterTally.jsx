// import React, { useEffect, useMemo, useState } from "react";
// import axios from "axios";
// import "bootstrap/dist/css/bootstrap.min.css";
// import * as XLSX from "xlsx";
// import { jsPDF } from "jspdf";
// import "jspdf-autotable";
// import { useLocation } from "react-router-dom";
// import { RingLoader } from "react-spinners";
// import {
//   Paper,
//   Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
//   Typography,
//   TextField,
//   Select,
//   MenuItem,
//   FormControl,
//   InputLabel,
//   Tabs,
//   Tab,
//   Box
// } from "@mui/material";
// import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
// import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate";

// const apikey = process.env.REACT_APP_API;

// const SaleRegisterTally = () => {
//   const location = useLocation();
//   const searchParams = new URLSearchParams(location.search);

//   const Company_Name = sessionStorage.getItem("Company_Name");
//   const Company_GSTNO = sessionStorage.getItem("Company_GSTNO");

//   const fromDate = searchParams.get("fromDate");
//   const toDate = searchParams.get("toDate");
//   const company_Code = searchParams.get("companyCode");
//   const YearCode = searchParams.get("yearCode");
//   const acCode = searchParams.get("acCode");

//   const API_URL = `${apikey}/Sale_Register`;

//   const [reportData, setReportData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   // 0 = Detailed, 1 = Monthly, 2 = Partywise, 3 = Top Buyers
//   const [tab, setTab] = useState(0);

//   // Filters
//   const [filters, setFilters] = useState({
//     global: "",
//     doc_no: "",
//     billtoname: "",
//     billtogstno: "",
//     gstrate: "",
//     amountMin: "",
//     amountMax: "",
//     qtyMin: "",
//     qtyMax: "",
//   });

//   const formatDate = (dateString) => {
//     if (!dateString) return "";
//     const date = new Date(dateString);
//     const day = String(date.getDate()).padStart(2, "0");
//     const month = String(date.getMonth() + 1).padStart(2, "0");
//     const year = String(date.getFullYear());
//     return `${day}/${month}/${year}`;
//   };

//   const normalize = (v) =>
//     (v ?? "")
//       .toString()
//       .toLowerCase()
//       .trim();

//   const inRange = (val, min, max) => {
//     const num = Number(val) || 0;
//     if (min !== "" && num < Number(min)) return false;
//     if (max !== "" && num > Number(max)) return false;
//     return true;
//   };

//   useEffect(() => {
//     const fetchReportData = async () => {
//       setLoading(true);
//       setError("");
//       try {
//         const response = await axios.get(API_URL, {
//           params: {
//             from_date: fromDate,
//             to_date: toDate,
//             Company_Code: company_Code,
//             Year_code: YearCode,
//             acCode: acCode,
//           },
//         });
//         setReportData(response.data || []);
//       } catch (err) {
//         console.error("Error fetching sale register:", err);
//         setError("Error fetching report");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchReportData();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [API_URL, fromDate, toDate, company_Code, YearCode, acCode]);

//   // Dropdown options
//   const customerOptions = useMemo(() => {
//     const set = new Set(reportData.map((r) => r.billtoname).filter(Boolean));
//     return Array.from(set).sort();
//   }, [reportData]);

//   const gstOptions = useMemo(() => {
//     const set = new Set(reportData.map((r) => r.gstrate).filter((v) => v !== null && v !== undefined && v !== ""));
//     return Array.from(set).sort((a, b) => Number(a) - Number(b));
//   }, [reportData]);

//   // Apply filters
//   const filteredRows = useMemo(() => {
//     const g = normalize(filters.global);

//     return reportData.filter((r) => {
//       const docNoStr = normalize(r.doc_no);
//       const partyStr = normalize(r.billtoname);
//       const gstNoStr = normalize(r.billtogstno);
//       const gstRateStr = normalize(r.gstrate);

//       // Global search
//       if (g) {
//         const hay = `${r.doc_no ?? ""} ${r.billtoname ?? ""} ${r.billtogstno ?? ""} ${r.gstrate ?? ""}`.toLowerCase();
//         if (!hay.includes(g)) return false;
//       }

//       if (filters.doc_no && !docNoStr.includes(normalize(filters.doc_no))) return false;
//       if (filters.billtoname && !partyStr.includes(normalize(filters.billtoname))) return false;
//       if (filters.billtogstno && !gstNoStr.includes(normalize(filters.billtogstno))) return false;

//       if (filters.gstrate && gstRateStr !== normalize(filters.gstrate)) return false;

//       if (!inRange(r.Bill_Amount, filters.amountMin, filters.amountMax)) return false;
//       if (!inRange(r.NETQNTL, filters.qtyMin, filters.qtyMax)) return false;

//       return true;
//     });
//   }, [reportData, filters]);

//   // Grand totals on filtered
//   const grandTotals = useMemo(() => {
//     return filteredRows.reduce(
//       (acc, item) => {
//         acc.TotalTaxable_Amt += Number(item.TaxableAmount) || 0;
//         acc.CGSTAmt += Number(item.CGSTAmount) || 0;
//         acc.SGSTAmt += Number(item.SGSTAmount) || 0;
//         acc.IGSTAmt += Number(item.IGSTAmount) || 0;
//         acc.BillamountAmt += Number(item.Bill_Amount) || 0;
//         acc.netqntl += Number(item.NETQNTL) || 0;
//         return acc;
//       },
//       { TotalTaxable_Amt: 0, CGSTAmt: 0, SGSTAmt: 0, IGSTAmt: 0, BillamountAmt: 0, netqntl: 0 }
//     );
//   }, [filteredRows]);

//   // ---------- Aggregations ----------

//   const monthlyRows = useMemo(() => {
//     const map = new Map();
//     filteredRows.forEach((r) => {
//       const d = new Date(r.doc_date);
//       if (Number.isNaN(d.getTime())) return;
//       const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

//       const curr = map.get(key) || {
//         month: key,
//         netqntl: 0,
//         taxable: 0,
//         cgst: 0,
//         sgst: 0,
//         igst: 0,
//         bill: 0,
//         count: 0,
//       };

//       curr.netqntl += Number(r.NETQNTL) || 0;
//       curr.taxable += Number(r.TaxableAmount) || 0;
//       curr.cgst += Number(r.CGSTAmount) || 0;
//       curr.sgst += Number(r.SGSTAmount) || 0;
//       curr.igst += Number(r.IGSTAmount) || 0;
//       curr.bill += Number(r.Bill_Amount) || 0;
//       curr.count += 1;

//       map.set(key, curr);
//     });

//     return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
//   }, [filteredRows]);

//   const partywiseRows = useMemo(() => {
//     const map = new Map();
//     filteredRows.forEach((r) => {
//       const key = r.billtoname || "Unknown";
//       const curr = map.get(key) || {
//         billtoname: key,
//         billtogstno: r.billtogstno || "",
//         netqntl: 0,
//         taxable: 0,
//         cgst: 0,
//         sgst: 0,
//         igst: 0,
//         bill: 0,
//         count: 0,
//       };

//       if (!curr.billtogstno && r.billtogstno) curr.billtogstno = r.billtogstno;

//       curr.netqntl += Number(r.NETQNTL) || 0;
//       curr.taxable += Number(r.TaxableAmount) || 0;
//       curr.cgst += Number(r.CGSTAmount) || 0;
//       curr.sgst += Number(r.SGSTAmount) || 0;
//       curr.igst += Number(r.IGSTAmount) || 0;
//       curr.bill += Number(r.Bill_Amount) || 0;
//       curr.count += 1;

//       map.set(key, curr);
//     });

//     return Array.from(map.values()).sort((a, b) => (b.bill || 0) - (a.bill || 0));
//   }, [filteredRows]);

//   const topBuyersRows = useMemo(() => {
//     return partywiseRows.slice(0, 10);
//   }, [partywiseRows]);



//   const handleExportToExcel = () => {
//   const wb = XLSX.utils.book_new();
//   const n = (v) => Number(v) || 0;

//   if (tab === 0) {
//     const rows = filteredRows.map((item) => ({
//       "Bill No": item.doc_no,
//       "Date": formatDate(item.doc_date),
//       "Customer Name": item.billtoname,
//       "GST No": item.billtogstno,
//       "NetQntl": n(item.NETQNTL),
//       "Rate": item.gstrate,
//       "Taxable Amount": n(item.TaxableAmount),
//       "CGST Amt": n(item.CGSTAmount),
//       "SGST Amt": n(item.SGSTAmount),
//       "IGST Amt": n(item.IGSTAmount),
//       "Bill Amount": n(item.Bill_Amount),
//     }));

//     // ✅ Grand Total for detail (use existing grandTotals if you have; else compute here)
//     const gt = filteredRows.reduce(
//       (a, r) => {
//         a.netqntl += n(r.NETQNTL);
//         a.taxable += n(r.TaxableAmount);
//         a.cgst += n(r.CGSTAmount);
//         a.sgst += n(r.SGSTAmount);
//         a.igst += n(r.IGSTAmount);
//         a.bill += n(r.Bill_Amount);
//         return a;
//       },
//       { netqntl: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, bill: 0 }
//     );

//     rows.push({
//       "Bill No": "",
//       "Date": "",
//       "Customer Name": "Grand Total",
//       "GST No": "",
//       "NetQntl": gt.netqntl,
//       "Rate": "",
//       "Taxable Amount": gt.taxable,
//       "CGST Amt": gt.cgst,
//       "SGST Amt": gt.sgst,
//       "IGST Amt": gt.igst,
//       "Bill Amount": gt.bill,
//     });

//     const ws = XLSX.utils.json_to_sheet(rows);
//     XLSX.utils.book_append_sheet(wb, ws, "Sale_Detail");
//   }

//   if (tab === 1) {
//     const rows = monthlyRows.map((m) => ({
//       "Month": m.month,
//       "Count": n(m.count),
//       "NetQntl": n(m.netqntl),
//       "Taxable": n(m.taxable),
//       "CGST": n(m.cgst),
//       "SGST": n(m.sgst),
//       "IGST": n(m.igst),
//       "Bill Amount": n(m.bill),
//     }));

//     const mt = monthlyRows.reduce(
//       (a, m) => {
//         a.count += n(m.count);
//         a.netqntl += n(m.netqntl);
//         a.taxable += n(m.taxable);
//         a.cgst += n(m.cgst);
//         a.sgst += n(m.sgst);
//         a.igst += n(m.igst);
//         a.bill += n(m.bill);
//         return a;
//       },
//       { count: 0, netqntl: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, bill: 0 }
//     );

//     rows.push({
//       "Month": "Grand Total",
//       "Count": mt.count,
//       "NetQntl": mt.netqntl,
//       "Taxable": mt.taxable,
//       "CGST": mt.cgst,
//       "SGST": mt.sgst,
//       "IGST": mt.igst,
//       "Bill Amount": mt.bill,
//     });

//     const ws = XLSX.utils.json_to_sheet(rows);
//     XLSX.utils.book_append_sheet(wb, ws, "Sale_Monthly");
//   }

//   if (tab === 2) {
//     const rows = partywiseRows.map((p) => ({
//       "Customer": p.billtoname,
//       "GST No": p.billtogstno,
//       "Count": n(p.count),
//       "NetQntl": n(p.netqntl),
//       "Taxable": n(p.taxable),
//       "CGST": n(p.cgst),
//       "SGST": n(p.sgst),
//       "IGST": n(p.igst),
//       "Bill Amount": n(p.bill),
//     }));

//     const pt = partywiseRows.reduce(
//       (a, p) => {
//         a.count += n(p.count);
//         a.netqntl += n(p.netqntl);
//         a.taxable += n(p.taxable);
//         a.cgst += n(p.cgst);
//         a.sgst += n(p.sgst);
//         a.igst += n(p.igst);
//         a.bill += n(p.bill);
//         return a;
//       },
//       { count: 0, netqntl: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, bill: 0 }
//     );

//     rows.push({
//       "Customer": "Grand Total",
//       "GST No": "",
//       "Count": pt.count,
//       "NetQntl": pt.netqntl,
//       "Taxable": pt.taxable,
//       "CGST": pt.cgst,
//       "SGST": pt.sgst,
//       "IGST": pt.igst,
//       "Bill Amount": pt.bill,
//     });

//     const ws = XLSX.utils.json_to_sheet(rows);
//     XLSX.utils.book_append_sheet(wb, ws, "Sale_Partywise");
//   }

//   if (tab === 3) {
//     const rows = topBuyersRows.map((p) => ({
//       "Customer": p.billtoname,
//       "GST No": p.billtogstno,
//       "Count": n(p.count),
//       "NetQntl": n(p.netqntl),
//       "Bill Amount": n(p.bill),
//     }));

//     const tt = topBuyersRows.reduce(
//       (a, p) => {
//         a.count += n(p.count);
//         a.netqntl += n(p.netqntl);
//         a.bill += n(p.bill);
//         return a;
//       },
//       { count: 0, netqntl: 0, bill: 0 }
//     );

//     rows.push({
//       "Customer": "Grand Total",
//       "GST No": "",
//       "Count": tt.count,
//       "NetQntl": tt.netqntl,
//       "Bill Amount": tt.bill,
//     });

//     const ws = XLSX.utils.json_to_sheet(rows);
//     XLSX.utils.book_append_sheet(wb, ws, "Sale_TopBuyers");
//   }

//   XLSX.writeFile(wb, "SaleRegister_Tally.xlsx");
// };


//   const generatePDF = async () => {
//     const doc = new jsPDF();

//     doc.setFontSize(14);
//     doc.text(Company_Name || "Company", doc.internal.pageSize.width / 2, 10, { align: "center" });

//     doc.setFontSize(9);
//     doc.text(`GSTN: ${Company_GSTNO || ""}`, doc.internal.pageSize.width / 2, 16, { align: "center" });

//     doc.setFontSize(11);
//     const title =
//       tab === 0 ? "Sale Register (Detailed)" :
//       tab === 1 ? "Sale Register (Monthly)" :
//       tab === 2 ? "Sale Register (Partywise)" :
//       "Sale Register (Top Buyers)";

//     doc.text(title, doc.internal.pageSize.width / 2, 22, { align: "center" });

//     doc.setFontSize(9);
//     doc.text(`${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`, 10, 28);

//     let head = [];
//     let body = [];

//     if (tab === 0) {
//       head = [[
//         "Bill No", "Date", "Customer", "GST No",
//         "NetQntl", "Rate", "Taxable", "CGST", "SGST", "IGST", "Bill Amt"
//       ]];

//       body = filteredRows.map((r) => ([
//         r.doc_no,
//         formatDate(r.doc_date),
//         r.billtoname,
//         r.billtogstno,
//         formatReadableAmount(r.NETQNTL),
//         r.gstrate,
//         formatReadableAmount(r.TaxableAmount),
//         formatReadableAmount(r.CGSTAmount),
//         formatReadableAmount(r.SGSTAmount),
//         formatReadableAmount(r.IGSTAmount),
//         formatReadableAmount(r.Bill_Amount),
//       ]));

//       body.push([
//         "", "", "Total", "",
//         formatReadableAmount(grandTotals.netqntl),
//         "",
//         formatReadableAmount(grandTotals.TotalTaxable_Amt),
//         formatReadableAmount(grandTotals.CGSTAmt),
//         formatReadableAmount(grandTotals.SGSTAmt),
//         formatReadableAmount(grandTotals.IGSTAmt),
//         formatReadableAmount(grandTotals.BillamountAmt),
//       ]);
//     }

//     if (tab === 1) {
//       head = [[ "Month", "Count", "NetQntl", "Taxable", "CGST", "SGST", "IGST", "Bill Amt" ]];
//       body = monthlyRows.map((m) => ([
//         m.month, m.count,
//         formatReadableAmount(m.netqntl),
//         formatReadableAmount(m.taxable),
//         formatReadableAmount(m.cgst),
//         formatReadableAmount(m.sgst),
//         formatReadableAmount(m.igst),
//         formatReadableAmount(m.bill),
//       ]));
//     }

//     if (tab === 2) {
//       head = [[ "Customer", "GST No", "Count", "NetQntl", "Taxable", "CGST", "SGST", "IGST", "Bill Amt" ]];
//       body = partywiseRows.map((p) => ([
//         p.billtoname,
//         p.billtogstno,
//         p.count,
//         formatReadableAmount(p.netqntl),
//         formatReadableAmount(p.taxable),
//         formatReadableAmount(p.cgst),
//         formatReadableAmount(p.sgst),
//         formatReadableAmount(p.igst),
//         formatReadableAmount(p.bill),
//       ]));
//     }

//     if (tab === 3) {
//       head = [[ "Customer", "GST No", "Count", "NetQntl", "Bill Amt" ]];
//       body = topBuyersRows.map((p) => ([
//         p.billtoname,
//         p.billtogstno,
//         p.count,
//         formatReadableAmount(p.netqntl),
//         formatReadableAmount(p.bill),
//       ]));
//     }

//     doc.autoTable({
//       head,
//       body,
//       startY: 32,
//       styles: { fontSize: 7, cellPadding: 1 },
//       theme: "grid",
//     });

//     return doc.output("blob");
//   };

//   const handlePrint = async () => {
//     const pdfBlob = await generatePDF();
//     const pdfUrl = URL.createObjectURL(pdfBlob);
//     const win = window.open(pdfUrl, "");
//     win?.document?.close();
//     win?.print();
//   };

//   // ---------- Filter handlers ----------

//   const updateFilter = (key) => (e) => {
//     setFilters((prev) => ({ ...prev, [key]: e.target.value }));
//   };

//   const clearFilters = () => {
//     setFilters({
//       global: "",
//       doc_no: "",
//       billtoname: "",
//       billtogstno: "",
//       gstrate: "",
//       amountMin: "",
//       amountMax: "",
//       qtyMin: "",
//       qtyMax: "",
//     });
//   };

//   // ---------- Tables ----------

//   const renderDetailedTable = () => (
//     <TableContainer component={Paper} style={{ maxHeight: "70vh", overflow: "auto" }}>
//       <Table stickyHeader>
//         <TableHead>
//           <TableRow>
//             {[
//               "Bill No", "Date", "Customer Name / Party Name", "GST No.",
//               "Net Quintal", "Rate", "Taxable Amount", "CGST Amount",
//               "SGST Amount", "IGST Amount", "Bill Amount"
//             ].map((label, i) => (
//               <TableCell
//                 key={i}
//                 sx={{
//                   position: "sticky",
//                   top: 0,
//                   backgroundColor: "#f5f5f5",
//                   fontWeight: "bold",
//                   zIndex: 2,
//                   textAlign: i < 2 ? "center" : (i === 2 ? "left" : "right"),
//                   whiteSpace: "nowrap",
//                 }}
//               >
//                 {label}
//               </TableCell>
//             ))}
//           </TableRow>
//         </TableHead>

//         <TableBody>
//           {filteredRows.map((item, index) => (
//             <TableRow key={index}>
//               <TableCell>{item.doc_no}</TableCell>
//               <TableCell>{formatDate(item.doc_date)}</TableCell>
//               <TableCell style={{ textAlign: "left" }}>{item.billtoname}</TableCell>
//               <TableCell>{item.billtogstno}</TableCell>
//               <TableCell align="right">{formatReadableAmount(item.NETQNTL)}</TableCell>
//               <TableCell align="right">{item.gstrate}</TableCell>
//               <TableCell align="right">{formatReadableAmount(item.TaxableAmount)}</TableCell>
//               <TableCell align="right">{formatReadableAmount(item.CGSTAmount)}</TableCell>
//               <TableCell align="right">{formatReadableAmount(item.SGSTAmount)}</TableCell>
//               <TableCell align="right">{formatReadableAmount(item.IGSTAmount)}</TableCell>
//               <TableCell align="right">{formatReadableAmount(item.Bill_Amount)}</TableCell>
//             </TableRow>
//           ))}

//           <TableRow>
//             <TableCell
//               colSpan={4}
//               sx={{
//                 position: "sticky",
//                 bottom: 0,
//                 backgroundColor: "yellow",
//                 fontWeight: "bold",
//                 zIndex: 1,
//               }}
//             >
//               Total
//             </TableCell>
//             <TableCell
//               align="right"
//               sx={{
//                 position: "sticky",
//                 bottom: 0,
//                 backgroundColor: "yellow",
//                 fontWeight: "bold",
//                 zIndex: 1,
//               }}
//             >
//               {formatReadableAmount(grandTotals.netqntl || 0)}
//             </TableCell>
//             <TableCell
//               sx={{
//                 position: "sticky",
//                 bottom: 0,
//                 backgroundColor: "yellow",
//                 fontWeight: "bold",
//                 zIndex: 1,
//               }}
//             />
//             {[grandTotals.TotalTaxable_Amt, grandTotals.CGSTAmt, grandTotals.SGSTAmt, grandTotals.IGSTAmt, grandTotals.BillamountAmt]
//               .map((val, i) => (
//                 <TableCell
//                   key={i}
//                   align="right"
//                   sx={{
//                     position: "sticky",
//                     bottom: 0,
//                     backgroundColor: "yellow",
//                     fontWeight: "bold",
//                     zIndex: 1,
//                   }}
//                 >
//                   {formatReadableAmount(val || 0)}
//                 </TableCell>
//               ))}
//           </TableRow>
//         </TableBody>
//       </Table>
//     </TableContainer>
//   );

//   const renderMonthlyTable = () => (
//     <TableContainer component={Paper} style={{ maxHeight: "70vh", overflow: "auto" }}>
//       <Table stickyHeader>
//         <TableHead>
//           <TableRow>
//             {["Month", "Count", "Net Quintal", "Taxable", "CGST", "SGST", "IGST", "Bill Amount"].map((h, i) => (
//               <TableCell key={i} sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5", whiteSpace: "nowrap" }}>
//                 {h}
//               </TableCell>
//             ))}
//           </TableRow>
//         </TableHead>
//         <TableBody>
//           {monthlyRows.map((m, i) => (
//             <TableRow key={i}>
//               <TableCell>{m.month}</TableCell>
//               <TableCell>{m.count}</TableCell>
//               <TableCell align="right">{formatReadableAmount(m.netqntl)}</TableCell>
//               <TableCell align="right">{formatReadableAmount(m.taxable)}</TableCell>
//               <TableCell align="right">{formatReadableAmount(m.cgst)}</TableCell>
//               <TableCell align="right">{formatReadableAmount(m.sgst)}</TableCell>
//               <TableCell align="right">{formatReadableAmount(m.igst)}</TableCell>
//               <TableCell align="right">{formatReadableAmount(m.bill)}</TableCell>
//             </TableRow>
//           ))}
//         </TableBody>
//       </Table>
//     </TableContainer>
//   );

//   const renderPartywiseTable = () => (
//     <TableContainer component={Paper} style={{ maxHeight: "70vh", overflow: "auto" }}>
//       <Table stickyHeader>
//         <TableHead>
//           <TableRow>
//             {["Customer", "GST No", "Count", "Net Quintal", "Taxable", "CGST", "SGST", "IGST", "Bill Amount"].map((h, i) => (
//               <TableCell key={i} sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5", whiteSpace: "nowrap" }}>
//                 {h}
//               </TableCell>
//             ))}
//           </TableRow>
//         </TableHead>
//         <TableBody>
//           {partywiseRows.map((p, i) => (
//             <TableRow key={i}>
//               <TableCell>{p.billtoname}</TableCell>
//               <TableCell>{p.billtogstno}</TableCell>
//               <TableCell>{p.count}</TableCell>
//               <TableCell align="right">{formatReadableAmount(p.netqntl)}</TableCell>
//               <TableCell align="right">{formatReadableAmount(p.taxable)}</TableCell>
//               <TableCell align="right">{formatReadableAmount(p.cgst)}</TableCell>
//               <TableCell align="right">{formatReadableAmount(p.sgst)}</TableCell>
//               <TableCell align="right">{formatReadableAmount(p.igst)}</TableCell>
//               <TableCell align="right">{formatReadableAmount(p.bill)}</TableCell>
//             </TableRow>
//           ))}
//         </TableBody>
//       </Table>
//     </TableContainer>
//   );

//   const renderTopBuyersTable = () => (
//     <TableContainer component={Paper} style={{ maxHeight: "70vh", overflow: "auto" }}>
//       <Table stickyHeader>
//         <TableHead>
//           <TableRow>
//             {["Customer", "GST No", "Count", "Net Quintal", "Bill Amount"].map((h, i) => (
//               <TableCell key={i} sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5", whiteSpace: "nowrap" }}>
//                 {h}
//               </TableCell>
//             ))}
//           </TableRow>
//         </TableHead>
//         <TableBody>
//           {topBuyersRows.map((p, i) => (
//             <TableRow key={i}>
//               <TableCell>{p.billtoname}</TableCell>
//               <TableCell>{p.billtogstno}</TableCell>
//               <TableCell>{p.count}</TableCell>
//               <TableCell align="right">{formatReadableAmount(p.netqntl)}</TableCell>
//               <TableCell align="right">{formatReadableAmount(p.bill)}</TableCell>
//             </TableRow>
//           ))}
//         </TableBody>
//       </Table>
//     </TableContainer>
//   );

//   return (
//     <div style={{ marginTop: "-80px" }}>
//       <Typography variant="h6" style={{ textAlign: "center", fontSize: "24px", fontWeight: "bold" }}>
//         {Company_Name}
//       </Typography>
//       <Typography variant="h6" style={{ textAlign: "center", fontSize: "16px", textDecoration: "underline", fontWeight: "550" }}>
//         GSTN : {Company_GSTNO}
//       </Typography>
//       <Typography variant="h6" style={{ textAlign: "center", fontSize: "20px", fontWeight: "bold" }}>
//         Sale Register
//       </Typography>
//       <Typography variant="h6" style={{ textAlign: "center", fontSize: "16px" }}>
//         {FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}
//       </Typography>

//       {/* Buttons */}
//       <div className="mb-2 row align-items-center">
//         <div className="col-auto">
//           <button className="btn btn-secondary me-2" onClick={handlePrint}>
//             Print
//           </button>
//           <button className="btn btn-success me-2" onClick={handleExportToExcel}>
//             Export to Excel
//           </button>
//           <button className="btn btn-outline-dark" onClick={clearFilters}>
//             Clear Filters
//           </button>
//         </div>
//       </div>

//       {/* Filters */}
//       <Paper style={{ padding: 12, marginBottom: 12 }}>
//         <Box display="flex" flexWrap="wrap" gap={2}>
//           <TextField
//             size="small"
//             label="Global Search"
//             value={filters.global}
//             onChange={updateFilter("global")}
//           />
//           <TextField
//             size="small"
//             label="Bill No"
//             value={filters.doc_no}
//             onChange={updateFilter("doc_no")}
//           />

//           <FormControl size="small" style={{ minWidth: 220 }}>
//             <InputLabel>Customer</InputLabel>
//             <Select
//               label="Customer"
//               value={filters.billtoname}
//               onChange={updateFilter("billtoname")}
//             >
//               <MenuItem value="">All</MenuItem>
//               {customerOptions.map((s, i) => (
//                 <MenuItem key={i} value={s}>{s}</MenuItem>
//               ))}
//             </Select>
//           </FormControl>

//           <TextField
//             size="small"
//             label="GST No"
//             value={filters.billtogstno}
//             onChange={updateFilter("billtogstno")}
//           />

//           <FormControl size="small" style={{ minWidth: 120 }}>
//             <InputLabel>GST Rate</InputLabel>
//             <Select
//               label="GST Rate"
//               value={filters.gstrate}
//               onChange={updateFilter("gstrate")}
//             >
//               <MenuItem value="">All</MenuItem>
//               {gstOptions.map((g, i) => (
//                 <MenuItem key={i} value={String(g)}>{g}</MenuItem>
//               ))}
//             </Select>
//           </FormControl>

//           <TextField
//             size="small"
//             label="Amount From"
//             type="number"
//             value={filters.amountMin}
//             onChange={updateFilter("amountMin")}
//           />
//           <TextField
//             size="small"
//             label="Amount To"
//             type="number"
//             value={filters.amountMax}
//             onChange={updateFilter("amountMax")}
//           />
//           <TextField
//             size="small"
//             label="Qty From"
//             type="number"
//             value={filters.qtyMin}
//             onChange={updateFilter("qtyMin")}
//           />
//           <TextField
//             size="small"
//             label="Qty To"
//             type="number"
//             value={filters.qtyMax}
//             onChange={updateFilter("qtyMax")}
//           />
//         </Box>
//       </Paper>

//       {/* Tabs */}
//       <Paper style={{ marginBottom: 10 }}>
//         <Tabs
//           value={tab}
//           onChange={(_, v) => setTab(v)}
//           variant="scrollable"
//           scrollButtons="auto"
//         >
//           <Tab label="Detailed" />
//           <Tab label="Monthly Sale" />
//           <Tab label="Partywise Sale" />
//           <Tab label="Top Buyers" />
//         </Tabs>
//       </Paper>

//       {tab === 0 && renderDetailedTable()}
//       {tab === 1 && renderMonthlyTable()}
//       {tab === 2 && renderPartywiseTable()}
//       {tab === 3 && renderTopBuyersTable()}

//       {loading && (
//         <div
//           style={{
//             position: "fixed",
//             top: "50%",
//             left: "50%",
//             transform: "translate(-50%, -50%)",
//             zIndex: 9999,
//           }}
//         >
//           <RingLoader size={80} />
//         </div>
//       )}
//       {error && <div className="alert alert-danger">{error}</div>}
//     </div>
//   );
// };

// export default SaleRegisterTally;












































import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import * as XLSX from "xlsx";
import {
  Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TableFooter,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TableSortLabel
} from "@mui/material";
import { RingLoader } from "react-spinners";
import { useLocation } from "react-router-dom";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate";
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import PdfPreview from '../../../Common/PDFPreview';
import HeaderJK from '../../../Assets/HeaderJK.png';
import FooterJK from '../../../Assets/FooterJK.png';
import { ConvertNumberToWord } from '../../../Common/FormatFunctions/ConvertNumberToWord';
import CommonPrintView from '../../../Common/ReportCommon/CommonPrintView';
import { generateReportPDF } from '../../../Common/ReportCommon/CommonPDFGenerator';

const apikey = process.env.REACT_APP_API;

// Screen Columns for Detailed View
const DETAIL_SCREEN_COLUMNS = [
  { label: 'Bill No', key: 'doc_no', width: '7%', center: true },
  { label: 'Date', key: 'doc_date', width: '8%', center: true },
  { label: 'Customer Name', key: 'billtoname', width: '20%' },
  { label: 'GST No', key: 'billtogstno', width: '12%', center: true },
  { label: 'Net Quintal', key: 'NETQNTL', width: '7%', numeric: true },
  { label: 'GST Rate', key: 'gstrate', width: '6%', center: true },
  { label: 'Taxable Amount', key: 'TaxableAmount', width: '9%', numeric: true },
  { label: 'CGST Amount', key: 'CGSTAmount', width: '7%', numeric: true },
  { label: 'SGST Amount', key: 'SGSTAmount', width: '7%', numeric: true },
  { label: 'IGST Amount', key: 'IGSTAmount', width: '7%', numeric: true },
  { label: 'Bill Amount', key: 'Bill_Amount', width: '9%', numeric: true },
];

// Print Columns for Detailed View
const DETAIL_PRINT_COLUMNS = [
  { label: 'Bill No', key: 'doc_no', printWidth: '12mm', center: true },
  { label: 'Date', key: 'doc_date', printWidth: '14mm', center: true },
  { label: 'Customer Name', key: 'billtoname', printWidth: '50mm' },
  { label: 'Net Qntl', key: 'NETQNTL', printWidth: '16mm', numeric: true },
  { label: 'Taxable Amt', key: 'TaxableAmount', printWidth: '20mm', numeric: true },
  { label: 'CGST Amt', key: 'CGSTAmount', printWidth: '16mm', numeric: true },
  { label: 'SGST Amt', key: 'SGSTAmount', printWidth: '16mm', numeric: true },
  { label: 'IGST Amt', key: 'IGSTAmount', printWidth: '16mm', numeric: true },
  { label: 'Bill Amount', key: 'Bill_Amount', printWidth: '18mm', numeric: true },
];

// Monthly Columns
const MONTHLY_SCREEN_COLUMNS = [
  { label: 'Month', key: 'month', width: '15%', center: true },
  { label: 'Count', key: 'count', width: '8%', center: true },
  { label: 'Net Quintal', key: 'netqntl', width: '12%', numeric: true },
  { label: 'Taxable Amount', key: 'taxable', width: '12%', numeric: true },
  { label: 'CGST Amount', key: 'cgst', width: '10%', numeric: true },
  { label: 'SGST Amount', key: 'sgst', width: '10%', numeric: true },
  { label: 'IGST Amount', key: 'igst', width: '10%', numeric: true },
  { label: 'Bill Amount', key: 'bill', width: '12%', numeric: true },
];

const MONTHLY_PRINT_COLUMNS = [
  { label: 'Month', key: 'month', printWidth: '30mm', center: true },
  { label: 'Count', key: 'count', printWidth: '12mm', center: true },
  { label: 'Net Qntl', key: 'netqntl', printWidth: '20mm', numeric: true },
  { label: 'Taxable Amt', key: 'taxable', printWidth: '22mm', numeric: true },
  { label: 'CGST Amt', key: 'cgst', printWidth: '18mm', numeric: true },
  { label: 'SGST Amt', key: 'sgst', printWidth: '18mm', numeric: true },
  { label: 'IGST Amt', key: 'igst', printWidth: '18mm', numeric: true },
  { label: 'Bill Amount', key: 'bill', printWidth: '20mm', numeric: true },
];

// Partywise Columns
const PARTYWISE_SCREEN_COLUMNS = [
  { label: 'Customer', key: 'billtoname', width: '25%' },
  { label: 'GST No', key: 'billtogstno', width: '15%', center: true },
  { label: 'Count', key: 'count', width: '8%', center: true },
  { label: 'Net Quintal', key: 'netqntl', width: '10%', numeric: true },
  { label: 'Taxable Amount', key: 'taxable', width: '10%', numeric: true },
  { label: 'CGST Amount', key: 'cgst', width: '8%', numeric: true },
  { label: 'SGST Amount', key: 'sgst', width: '8%', numeric: true },
  { label: 'IGST Amount', key: 'igst', width: '8%', numeric: true },
  { label: 'Bill Amount', key: 'bill', width: '10%', numeric: true },
];

const PARTYWISE_PRINT_COLUMNS = [
  { label: 'Customer', key: 'billtoname', printWidth: '55mm' },
  { label: 'Count', key: 'count', printWidth: '12mm', center: true },
  { label: 'Net Qntl', key: 'netqntl', printWidth: '18mm', numeric: true },
  { label: 'Taxable Amt', key: 'taxable', printWidth: '22mm', numeric: true },
  { label: 'CGST Amt', key: 'cgst', printWidth: '16mm', numeric: true },
  { label: 'SGST Amt', key: 'sgst', printWidth: '16mm', numeric: true },
  { label: 'IGST Amt', key: 'igst', printWidth: '16mm', numeric: true },
  { label: 'Bill Amount', key: 'bill', printWidth: '20mm', numeric: true },
];

// Top Buyers Columns
const TOPBUYERS_SCREEN_COLUMNS = [
  { label: 'Customer', key: 'billtoname', width: '35%' },
  { label: 'GST No', key: 'billtogstno', width: '20%', center: true },
  { label: 'Count', key: 'count', width: '10%', center: true },
  { label: 'Net Quintal', key: 'netqntl', width: '15%', numeric: true },
  { label: 'Bill Amount', key: 'bill', width: '20%', numeric: true },
];

const TOPBUYERS_PRINT_COLUMNS = [
  { label: 'Customer', key: 'billtoname', printWidth: '70mm' },
  { label: 'Count', key: 'count', printWidth: '15mm', center: true },
  { label: 'Net Qntl', key: 'netqntl', printWidth: '25mm', numeric: true },
  { label: 'Bill Amount', key: 'bill', printWidth: '30mm', numeric: true },
];

const SaleRegisterTally = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const Company_Name = sessionStorage.getItem("Company_Name");
  const Company_GSTNO = sessionStorage.getItem("Company_GSTNO");

  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDate");
  const company_Code = searchParams.get("companyCode");
  const YearCode = searchParams.get("yearCode");
  const acCode = searchParams.get("acCode");

  const API_URL = `${apikey}/Sale_Register`;

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [pdfPreview, setPdfPreview] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    global: "",
    doc_no: "",
    billtoname: "",
    billtogstno: "",
    gstrate: "",
    amountMin: "",
    amountMax: "",
    qtyMin: "",
    qtyMax: "",
  });

  const [tempFilters, setTempFilters] = useState({});

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());
    return `${day}/${month}/${year}`;
  };

  const normalize = (v) =>
    (v ?? "")
      .toString()
      .toLowerCase()
      .trim();

  const inRange = (val, min, max) => {
    const num = Number(val) || 0;
    if (min !== "" && num < Number(min)) return false;
    if (max !== "" && num > Number(max)) return false;
    return true;
  };

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(API_URL, {
          params: {
            from_date: fromDate,
            to_date: toDate,
            Company_Code: company_Code,
            Year_code: YearCode,
            acCode: acCode,
          },
        });
        setReportData(response.data || []);
      } catch (err) {
        console.error("Error fetching sale register:", err);
        setError("Error fetching report");
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [API_URL, fromDate, toDate, company_Code, YearCode, acCode]);

  // Dropdown options
  const customerOptions = useMemo(() => {
    const set = new Set(reportData.map((r) => r.billtoname).filter(Boolean));
    return Array.from(set).sort();
  }, [reportData]);

  const gstOptions = useMemo(() => {
    const set = new Set(reportData.map((r) => r.gstrate).filter((v) => v !== null && v !== undefined && v !== ""));
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [reportData]);

  // Apply filters
  const filteredRows = useMemo(() => {
    const g = normalize(filters.global);

    return reportData.filter((r) => {
      const docNoStr = normalize(r.doc_no);
      const partyStr = normalize(r.billtoname);
      const gstNoStr = normalize(r.billtogstno);
      const gstRateStr = normalize(r.gstrate);

      if (g) {
        const hay = `${r.doc_no ?? ""} ${r.billtoname ?? ""} ${r.billtogstno ?? ""} ${r.gstrate ?? ""}`.toLowerCase();
        if (!hay.includes(g)) return false;
      }

      if (filters.doc_no && !docNoStr.includes(normalize(filters.doc_no))) return false;
      if (filters.billtoname && !partyStr.includes(normalize(filters.billtoname))) return false;
      if (filters.billtogstno && !gstNoStr.includes(normalize(filters.billtogstno))) return false;
      if (filters.gstrate && gstRateStr !== normalize(filters.gstrate)) return false;
      if (!inRange(r.Bill_Amount, filters.amountMin, filters.amountMax)) return false;
      if (!inRange(r.NETQNTL, filters.qtyMin, filters.qtyMax)) return false;

      return true;
    });
  }, [reportData, filters]);

  // Sorting
  const sortedData = useMemo(() => {
    const items = [...filteredRows];
    if (sortConfig.key) {
      items.sort((a, b) => {
        let va = a[sortConfig.key];
        let vb = b[sortConfig.key];

        if (sortConfig.key === 'doc_date') {
          va = new Date(va).getTime();
          vb = new Date(vb).getTime();
        } else if (['NETQNTL', 'TaxableAmount', 'CGSTAmount', 'SGSTAmount', 'IGSTAmount', 'Bill_Amount'].includes(sortConfig.key)) {
          va = Number(va) || 0;
          vb = Number(vb) || 0;
        } else {
          va = (va || "").toLowerCase();
          vb = (vb || "").toLowerCase();
        }

        if (va < vb) return sortConfig.direction === 'asc' ? -1 : 1;
        if (va > vb) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [filteredRows, sortConfig]);

  const requestSort = (key) =>
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));

  // Grand totals on filtered
  const grandTotals = useMemo(() => {
    return filteredRows.reduce(
      (acc, item) => {
        acc.TotalTaxable_Amt += Number(item.TaxableAmount) || 0;
        acc.CGSTAmt += Number(item.CGSTAmount) || 0;
        acc.SGSTAmt += Number(item.SGSTAmount) || 0;
        acc.IGSTAmt += Number(item.IGSTAmount) || 0;
        acc.BillamountAmt += Number(item.Bill_Amount) || 0;
        acc.netqntl += Number(item.NETQNTL) || 0;
        return acc;
      },
      { TotalTaxable_Amt: 0, CGSTAmt: 0, SGSTAmt: 0, IGSTAmt: 0, BillamountAmt: 0, netqntl: 0 }
    );
  }, [filteredRows]);

  // Aggregations
  const monthlyRows = useMemo(() => {
    const map = new Map();
    filteredRows.forEach((r) => {
      const d = new Date(r.doc_date);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

      const curr = map.get(key) || {
        month: key,
        netqntl: 0,
        taxable: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        bill: 0,
        count: 0,
      };

      curr.netqntl += Number(r.NETQNTL) || 0;
      curr.taxable += Number(r.TaxableAmount) || 0;
      curr.cgst += Number(r.CGSTAmount) || 0;
      curr.sgst += Number(r.SGSTAmount) || 0;
      curr.igst += Number(r.IGSTAmount) || 0;
      curr.bill += Number(r.Bill_Amount) || 0;
      curr.count += 1;

      map.set(key, curr);
    });

    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredRows]);

  const monthlyTotals = useMemo(() => {
    return monthlyRows.reduce(
      (acc, m) => {
        acc.count += m.count;
        acc.netqntl += m.netqntl;
        acc.taxable += m.taxable;
        acc.cgst += m.cgst;
        acc.sgst += m.sgst;
        acc.igst += m.igst;
        acc.bill += m.bill;
        return acc;
      },
      { count: 0, netqntl: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, bill: 0 }
    );
  }, [monthlyRows]);

  const partywiseRows = useMemo(() => {
    const map = new Map();
    filteredRows.forEach((r) => {
      const key = r.billtoname || "Unknown";
      const curr = map.get(key) || {
        billtoname: key,
        billtogstno: r.billtogstno || "",
        netqntl: 0,
        taxable: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        bill: 0,
        count: 0,
      };

      if (!curr.billtogstno && r.billtogstno) curr.billtogstno = r.billtogstno;

      curr.netqntl += Number(r.NETQNTL) || 0;
      curr.taxable += Number(r.TaxableAmount) || 0;
      curr.cgst += Number(r.CGSTAmount) || 0;
      curr.sgst += Number(r.SGSTAmount) || 0;
      curr.igst += Number(r.IGSTAmount) || 0;
      curr.bill += Number(r.Bill_Amount) || 0;
      curr.count += 1;

      map.set(key, curr);
    });

    return Array.from(map.values()).sort((a, b) => (b.bill || 0) - (a.bill || 0));
  }, [filteredRows]);

  const partywiseTotals = useMemo(() => {
    return partywiseRows.reduce(
      (acc, p) => {
        acc.count += p.count;
        acc.netqntl += p.netqntl;
        acc.taxable += p.taxable;
        acc.cgst += p.cgst;
        acc.sgst += p.sgst;
        acc.igst += p.igst;
        acc.bill += p.bill;
        return acc;
      },
      { count: 0, netqntl: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, bill: 0 }
    );
  }, [partywiseRows]);

  const topBuyersRows = useMemo(() => {
    return partywiseRows.slice(0, 10);
  }, [partywiseRows]);

  const topBuyersTotals = useMemo(() => {
    return topBuyersRows.reduce(
      (acc, p) => {
        acc.count += p.count;
        acc.netqntl += p.netqntl;
        acc.bill += p.bill;
        return acc;
      },
      { count: 0, netqntl: 0, bill: 0 }
    );
  }, [topBuyersRows]);

  const reportSubtitle = `${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`;

  // Print row renderers
  const renderDetailedPrintRow = (item) => [
    item.doc_no,
    formatDate(item.doc_date),
    item.billtoname,
    formatReadableAmount(item.NETQNTL),
    formatReadableAmount(item.TaxableAmount),
    formatReadableAmount(item.CGSTAmount),
    formatReadableAmount(item.SGSTAmount),
    formatReadableAmount(item.IGSTAmount),
    formatReadableAmount(item.Bill_Amount),
  ];

  const renderMonthlyPrintRow = (item) => [
    item.month,
    item.count,
    formatReadableAmount(item.netqntl),
    formatReadableAmount(item.taxable),
    formatReadableAmount(item.cgst),
    formatReadableAmount(item.sgst),
    formatReadableAmount(item.igst),
    formatReadableAmount(item.bill),
  ];

  const renderPartywisePrintRow = (item) => [
    item.billtoname,
    item.count,
    formatReadableAmount(item.netqntl),
    formatReadableAmount(item.taxable),
    formatReadableAmount(item.cgst),
    formatReadableAmount(item.sgst),
    formatReadableAmount(item.igst),
    formatReadableAmount(item.bill),
  ];

  const renderTopBuyersPrintRow = (item) => [
    item.billtoname,
    item.count,
    formatReadableAmount(item.netqntl),
    formatReadableAmount(item.bill),
  ];

  // Footer values for print
  const detailedPrintFooter = [
    '', '', 'GRAND TOTAL',
    formatReadableAmount(grandTotals.netqntl),
    formatReadableAmount(grandTotals.TotalTaxable_Amt),
    formatReadableAmount(grandTotals.CGSTAmt),
    formatReadableAmount(grandTotals.SGSTAmt),
    formatReadableAmount(grandTotals.IGSTAmt),
    formatReadableAmount(grandTotals.BillamountAmt),
  ];

  const monthlyPrintFooter = [
    'GRAND TOTAL',
    monthlyTotals.count,
    formatReadableAmount(monthlyTotals.netqntl),
    formatReadableAmount(monthlyTotals.taxable),
    formatReadableAmount(monthlyTotals.cgst),
    formatReadableAmount(monthlyTotals.sgst),
    formatReadableAmount(monthlyTotals.igst),
    formatReadableAmount(monthlyTotals.bill),
  ];

  const partywisePrintFooter = [
    'GRAND TOTAL',
    partywiseTotals.count,
    formatReadableAmount(partywiseTotals.netqntl),
    formatReadableAmount(partywiseTotals.taxable),
    formatReadableAmount(partywiseTotals.cgst),
    formatReadableAmount(partywiseTotals.sgst),
    formatReadableAmount(partywiseTotals.igst),
    formatReadableAmount(partywiseTotals.bill),
  ];

  const topBuyersPrintFooter = [
    'GRAND TOTAL',
    topBuyersTotals.count,
    formatReadableAmount(topBuyersTotals.netqntl),
    formatReadableAmount(topBuyersTotals.bill),
  ];

  // Generate PDF
const handleGeneratePDF = () => {
  let config = {};

  // Helper function to apply yellow background [255, 249, 196], bold font, and correct alignment
  const styleFooter = (footerValues, numericIndices, centerIndices = []) => {
    return footerValues.map((value, index) => ({
      content: value,
      styles: {
        fillColor: [255, 249, 196],
        fontStyle: 'bold',
        halign: numericIndices.includes(index) ? 'right' : (centerIndices.includes(index) ? 'center' : 'left')
      }
    }));
  };

  if (tab === 0) {
    const numericCols = [3, 4, 5, 6, 7, 8];
    const centerCols = [0, 1];
    config = {
      title: 'Sale Register',
      subtitle: reportSubtitle,
      columns: DETAIL_PRINT_COLUMNS.map(c => c.label),
      columnWidths: [12, 14, 50, 16, 20, 16, 18, 18, 20],
      rows: sortedData.map(renderDetailedPrintRow),
      footerRow: styleFooter(detailedPrintFooter, numericCols, centerCols),
      numericCols,
      centerCols,
      headerImgSrc: HeaderJK,
      footerImgSrc: FooterJK,
      orientation: 'landscape',
      onComplete: (url) => setPdfPreview(url),
    };
  } else if (tab === 1) {
    const numericCols = [2, 3, 4, 5, 6, 7];
    const centerCols = [0, 1];
    config = {
      title: 'Sale Register (Monthly)',
      subtitle: reportSubtitle,
      columns: MONTHLY_PRINT_COLUMNS.map(c => c.label),
      columnWidths: [30, 12, 20, 22, 18, 18, 18, 20],
      rows: monthlyRows.map(renderMonthlyPrintRow),
      footerRow: styleFooter(monthlyPrintFooter, numericCols, centerCols),
      numericCols,
      centerCols,
      headerImgSrc: HeaderJK,
      footerImgSrc: FooterJK,
      orientation: 'landscape',
      onComplete: (url) => setPdfPreview(url),
    };
  } else if (tab === 2) {
    const numericCols = [2, 3, 4, 5, 6, 7];
    const centerCols = [1];
    config = {
      title: 'Sale Register (Partywise)',
      subtitle: reportSubtitle,
      columns: PARTYWISE_PRINT_COLUMNS.map(c => c.label),
      columnWidths: [55, 12, 18, 22, 16, 16, 16, 20],
      rows: partywiseRows.map(renderPartywisePrintRow),
      footerRow: styleFooter(partywisePrintFooter, numericCols, centerCols),
      numericCols,
      centerCols,
      headerImgSrc: HeaderJK,
      footerImgSrc: FooterJK,
      orientation: 'landscape',
      onComplete: (url) => setPdfPreview(url),
    };
  } else if (tab === 3) {
    const numericCols = [2, 3];
    const centerCols = [1];
    config = {
      title: 'Sale Register (Top 10 Buyers)',
      subtitle: reportSubtitle,
      columns: TOPBUYERS_PRINT_COLUMNS.map(c => c.label),
      columnWidths: [70, 15, 25, 30],
      rows: topBuyersRows.map(renderTopBuyersPrintRow),
      footerRow: styleFooter(topBuyersPrintFooter, numericCols, centerCols),
      numericCols,
      centerCols,
      headerImgSrc: HeaderJK,
      footerImgSrc: FooterJK,
      orientation: 'landscape',
      onComplete: (url) => setPdfPreview(url),
    };
  }

  generateReportPDF(config);
};

  // Export to Excel
  const handleExportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const n = (v) => Number(v) || 0;

    if (tab === 0) {
      const rows = sortedData.map((item) => ({
        "Bill No": item.doc_no,
        "Date": formatDate(item.doc_date),
        "Customer Name": item.billtoname,
        "GST No": item.billtogstno,
        "Net Qntl": n(item.NETQNTL),
        "GST Rate": item.gstrate,
        "Taxable Amount": n(item.TaxableAmount),
        "CGST Amt": n(item.CGSTAmount),
        "SGST Amt": n(item.SGSTAmount),
        "IGST Amt": n(item.IGSTAmount),
        "Bill Amount": n(item.Bill_Amount),
      }));

      rows.push({
        "Bill No": "",
        "Date": "",
        "Customer Name": "GRAND TOTAL",
        "GST No": "",
        "Net Qntl": n(grandTotals.netqntl),
        "GST Rate": "",
        "Taxable Amount": n(grandTotals.TotalTaxable_Amt),
        "CGST Amt": n(grandTotals.CGSTAmt),
        "SGST Amt": n(grandTotals.SGSTAmt),
        "IGST Amt": n(grandTotals.IGSTAmt),
        "Bill Amount": n(grandTotals.BillamountAmt),
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "SaleRegister_Detail");
    }

    if (tab === 1) {
      const rows = monthlyRows.map((m) => ({
        "Month": m.month,
        "Count": n(m.count),
        "Net Qntl": n(m.netqntl),
        "Taxable Amount": n(m.taxable),
        "CGST Amount": n(m.cgst),
        "SGST Amount": n(m.sgst),
        "IGST Amount": n(m.igst),
        "Bill Amount": n(m.bill),
      }));

      rows.push({
        "Month": "GRAND TOTAL",
        "Count": n(monthlyTotals.count),
        "Net Qntl": n(monthlyTotals.netqntl),
        "Taxable Amount": n(monthlyTotals.taxable),
        "CGST Amount": n(monthlyTotals.cgst),
        "SGST Amount": n(monthlyTotals.sgst),
        "IGST Amount": n(monthlyTotals.igst),
        "Bill Amount": n(monthlyTotals.bill),
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "SaleRegister_Monthly");
    }

    if (tab === 2) {
      const rows = partywiseRows.map((p) => ({
        "Customer": p.billtoname,
        "GST No": p.billtogstno,
        "Count": n(p.count),
        "Net Qntl": n(p.netqntl),
        "Taxable Amount": n(p.taxable),
        "CGST Amount": n(p.cgst),
        "SGST Amount": n(p.sgst),
        "IGST Amount": n(p.igst),
        "Bill Amount": n(p.bill),
      }));

      rows.push({
        "Customer": "GRAND TOTAL",
        "GST No": "",
        "Count": n(partywiseTotals.count),
        "Net Qntl": n(partywiseTotals.netqntl),
        "Taxable Amount": n(partywiseTotals.taxable),
        "CGST Amount": n(partywiseTotals.cgst),
        "SGST Amount": n(partywiseTotals.sgst),
        "IGST Amount": n(partywiseTotals.igst),
        "Bill Amount": n(partywiseTotals.bill),
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "SaleRegister_Partywise");
    }

    if (tab === 3) {
      const rows = topBuyersRows.map((p) => ({
        "Customer": p.billtoname,
        "GST No": p.billtogstno,
        "Count": n(p.count),
        "Net Qntl": n(p.netqntl),
        "Bill Amount": n(p.bill),
      }));

      rows.push({
        "Customer": "GRAND TOTAL",
        "GST No": "",
        "Count": n(topBuyersTotals.count),
        "Net Qntl": n(topBuyersTotals.netqntl),
        "Bill Amount": n(topBuyersTotals.bill),
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "SaleRegister_TopBuyers");
    }

    XLSX.writeFile(wb, `SaleRegister_${fromDate}_to_${toDate}.xlsx`);
  };

  // Filter handlers
  const openFilterDialog = () => {
    setTempFilters({ ...filters });
    setFilterOpen(true);
  };

  const applyFilters = () => {
    setFilters({ ...tempFilters });
    setFilterOpen(false);
  };

  const clearFilters = () => {
    const emptyFilters = {
      global: "",
      doc_no: "",
      billtoname: "",
      billtogstno: "",
      gstrate: "",
      amountMin: "",
      amountMax: "",
      qtyMin: "",
      qtyMax: "",
    };
    setFilters(emptyFilters);
    setTempFilters(emptyFilters);
    setFilterOpen(false);
  };

  const updateTempFilter = (key) => (e) => {
    setTempFilters((prev) => ({ ...prev, [key]: e.target.value }));
  };

  // Screen row renderers
  const renderDetailedScreenRow = (item) => [
    item.doc_no,
    formatDate(item.doc_date),
    item.billtoname,
    item.billtogstno,
    formatReadableAmount(item.NETQNTL),
    item.gstrate,
    formatReadableAmount(item.TaxableAmount),
    formatReadableAmount(item.CGSTAmount),
    formatReadableAmount(item.SGSTAmount),
    formatReadableAmount(item.IGSTAmount),
    formatReadableAmount(item.Bill_Amount),
  ];

  const renderMonthlyScreenRow = (item) => [
    item.month,
    item.count,
    formatReadableAmount(item.netqntl),
    formatReadableAmount(item.taxable),
    formatReadableAmount(item.cgst),
    formatReadableAmount(item.sgst),
    formatReadableAmount(item.igst),
    formatReadableAmount(item.bill),
  ];

  const renderPartywiseScreenRow = (item) => [
    item.billtoname,
    item.billtogstno,
    item.count,
    formatReadableAmount(item.netqntl),
    formatReadableAmount(item.taxable),
    formatReadableAmount(item.cgst),
    formatReadableAmount(item.sgst),
    formatReadableAmount(item.igst),
    formatReadableAmount(item.bill),
  ];

  const renderTopBuyersScreenRow = (item) => [
    item.billtoname,
    item.billtogstno,
    item.count,
    formatReadableAmount(item.netqntl),
    formatReadableAmount(item.bill),
  ];

  return (
    <div style={{ marginTop: "-80px", padding: "20px" }}>
      {/* Print View Component */}
      <CommonPrintView
        title={tab === 0 ? "Sale Register (Detailed)" : tab === 1 ? "Sale Register (Monthly)" : tab === 2 ? "Sale Register (Partywise)" : "Sale Register (Top 10 Buyers)"}
        subtitle={reportSubtitle}
        companyName={Company_Name}
        companyGST={Company_GSTNO}
        columns={tab === 0 ? DETAIL_PRINT_COLUMNS : tab === 1 ? MONTHLY_PRINT_COLUMNS : tab === 2 ? PARTYWISE_PRINT_COLUMNS : TOPBUYERS_PRINT_COLUMNS}
        rows={tab === 0 ? sortedData : tab === 1 ? monthlyRows : tab === 2 ? partywiseRows : topBuyersRows}
        rowRenderer={tab === 0 ? renderDetailedPrintRow : tab === 1 ? renderMonthlyPrintRow : tab === 2 ? renderPartywisePrintRow : renderTopBuyersPrintRow}
        footerValues={tab === 0 ? detailedPrintFooter : tab === 1 ? monthlyPrintFooter : tab === 2 ? partywisePrintFooter : topBuyersPrintFooter}
        amountInWords={ConvertNumberToWord(
          tab === 0 ? grandTotals.BillamountAmt :
            tab === 1 ? monthlyTotals.bill :
              tab === 2 ? partywiseTotals.bill :
                topBuyersTotals.bill
        )}
        headerImg={HeaderJK}
        footerImg={FooterJK}
      />

      {/* Screen Header */}
      <Typography variant="h5" align="center" style={{ fontWeight: 'bold', marginTop: '-10px' }}>
        {Company_Name}
      </Typography>
      <Typography variant="subtitle1" align="center">GSTN: {Company_GSTNO}</Typography>
      <Typography variant="h6" align="center" style={{ fontWeight: 'bold' }}>
        Sale Register
      </Typography>
      <Typography variant="subtitle2" align="center" color="textSecondary">
        {reportSubtitle}
      </Typography>

      <div className="my-3 no-print d-flex justify-content-between align-items-center" style={{ marginTop: "10px" }}>

        {/* Left Side: Filter Button */}
        <div className="d-flex" style={{ gap: "5px" }}>
          <Button variant="outlined" startIcon={<FilterListIcon />} onClick={openFilterDialog}>
            Filters
          </Button>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="d-flex" style={{ gap: "5px" }}>
          <Button variant="contained" color="secondary" onClick={handleGeneratePDF}>
            Print
          </Button>
          <Button variant="contained" color="success" onClick={handleExportToExcel}>
            Export Excel
          </Button>
        </div>

      </div>


      {pdfPreview && <PdfPreview pdfData={pdfPreview} label="SaleRegister" />}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Tabs */}
      <Paper style={{ marginBottom: 10, marginTop: 20 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab label="Detailed" />
          <Tab label="Monthly Sale" />
          <Tab label="Partywise Sale" />
          <Tab label="Top Buyers" />
        </Tabs>
      </Paper>

      {/* Tab Content - Detailed Table */}
      {tab === 0 && (
        <TableContainer component={Paper} style={{ maxHeight: '700px', position: 'relative' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {DETAIL_SCREEN_COLUMNS.map(col => (
                  <TableCell
                    key={col.key}
                    align={col.numeric ? 'right' : col.center ? 'center' : 'left'}
                    style={{ fontWeight: 'bold', backgroundColor: '#5557df', color: '#fff', whiteSpace: 'nowrap' }}
                  >
                    <TableSortLabel
                      active={sortConfig.key === col.key}
                      direction={sortConfig.direction}
                      onClick={() => requestSort(col.key)}
                      sx={{
                        '&.MuiTableSortLabel-root': { color: '#fff' },
                        '&.MuiTableSortLabel-root:hover': { color: '#cce0ff' },
                        '&.Mui-active': { color: '#fff' },
                        '& .MuiTableSortLabel-icon': { color: '#fff !important' },
                      }}
                    >
                      {col.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map((item, index) => (
                <TableRow key={index} hover style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f5f8ff' }}>
                  {renderDetailedScreenRow(item).map((cell, ci) => (
                    <TableCell
                      key={ci}
                      align={DETAIL_SCREEN_COLUMNS[ci]?.numeric ? 'right' : DETAIL_SCREEN_COLUMNS[ci]?.center ? 'center' : 'left'}
                      style={{ fontSize: '0.78rem', whiteSpace: ci < 2 ? 'nowrap' : 'normal' }}
                    >
                      {cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
            <TableFooter style={{ position: 'sticky', bottom: 0, zIndex: 2 }}>
              <TableRow style={{ backgroundColor: '#ffffcc' }}>
                <TableCell colSpan={4} style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>GRAND TOTAL</TableCell>
                <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>{formatReadableAmount(grandTotals.netqntl)}</TableCell>
                <TableCell />
                <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>{formatReadableAmount(grandTotals.TotalTaxable_Amt)}</TableCell>
                <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>{formatReadableAmount(grandTotals.CGSTAmt)}</TableCell>
                <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>{formatReadableAmount(grandTotals.SGSTAmt)}</TableCell>
                <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>{formatReadableAmount(grandTotals.IGSTAmt)}</TableCell>
                <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>{formatReadableAmount(grandTotals.BillamountAmt)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      )}

      {/* Tab Content - Monthly Table */}
      {tab === 1 && (
        <TableContainer component={Paper} style={{ maxHeight: '700px', position: 'relative' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {MONTHLY_SCREEN_COLUMNS.map(col => (
                  <TableCell
                    key={col.key}
                    align={col.numeric ? 'right' : col.center ? 'center' : 'left'}
                    style={{ fontWeight: 'bold', backgroundColor: '#5557df', color: '#fff', whiteSpace: 'nowrap' }}
                  >
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {monthlyRows.map((item, index) => (
                <TableRow key={index} hover style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f5f8ff' }}>
                  {renderMonthlyScreenRow(item).map((cell, ci) => (
                    <TableCell
                      key={ci}
                      align={MONTHLY_SCREEN_COLUMNS[ci]?.numeric ? 'right' : MONTHLY_SCREEN_COLUMNS[ci]?.center ? 'center' : 'left'}
                      style={{ fontSize: '0.78rem' }}
                    >
                      {cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Tab Content - Partywise Table */}
      {tab === 2 && (
        <TableContainer component={Paper} style={{ maxHeight: '700px', position: 'relative' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {PARTYWISE_SCREEN_COLUMNS.map(col => (
                  <TableCell
                    key={col.key}
                    align={col.numeric ? 'right' : col.center ? 'center' : 'left'}
                    style={{ fontWeight: 'bold', backgroundColor: '#5557df', color: '#fff', whiteSpace: 'nowrap' }}
                  >
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {partywiseRows.map((item, index) => (
                <TableRow key={index} hover style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f5f8ff' }}>
                  {renderPartywiseScreenRow(item).map((cell, ci) => (
                    <TableCell
                      key={ci}
                      align={PARTYWISE_SCREEN_COLUMNS[ci]?.numeric ? 'right' : PARTYWISE_SCREEN_COLUMNS[ci]?.center ? 'center' : 'left'}
                      style={{ fontSize: '0.78rem' }}
                    >
                      {cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Tab Content - Top Buyers Table */}
      {tab === 3 && (
        <TableContainer component={Paper} style={{ maxHeight: '700px', position: 'relative' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {TOPBUYERS_SCREEN_COLUMNS.map(col => (
                  <TableCell
                    key={col.key}
                    align={col.numeric ? 'right' : col.center ? 'center' : 'left'}
                    style={{ fontWeight: 'bold', backgroundColor: '#5557df', color: '#fff', whiteSpace: 'nowrap' }}
                  >
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {topBuyersRows.map((item, index) => (
                <TableRow key={index} hover style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f5f8ff' }}>
                  {renderTopBuyersScreenRow(item).map((cell, ci) => (
                    <TableCell
                      key={ci}
                      align={TOPBUYERS_SCREEN_COLUMNS[ci]?.numeric ? 'right' : TOPBUYERS_SCREEN_COLUMNS[ci]?.center ? 'center' : 'left'}
                      style={{ fontSize: '0.78rem' }}
                    >
                      {cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Filter Dialog */}
      <Dialog open={filterOpen} onClose={() => setFilterOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Filter Options
          <IconButton aria-label="close" onClick={() => setFilterOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} sx={{ mt: 2 }}>
            <TextField
              size="small"
              label="Global Search"
              value={tempFilters.global}
              onChange={updateTempFilter("global")}
              fullWidth
            />
            <Box display="flex" gap={2}>
              <TextField
                size="small"
                label="Bill No"
                value={tempFilters.doc_no}
                onChange={updateTempFilter("doc_no")}
                fullWidth
              />
            </Box>
            <FormControl size="small" fullWidth>
              <InputLabel>Customer</InputLabel>
              <Select label="Customer" value={tempFilters.billtoname} onChange={updateTempFilter("billtoname")}>
                <MenuItem value="">All</MenuItem>
                {customerOptions.map((s, i) => (
                  <MenuItem key={i} value={s}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              label="GST No"
              value={tempFilters.billtogstno}
              onChange={updateTempFilter("billtogstno")}
              fullWidth
            />
            <FormControl size="small" fullWidth>
              <InputLabel>GST Rate</InputLabel>
              <Select label="GST Rate" value={tempFilters.gstrate} onChange={updateTempFilter("gstrate")}>
                <MenuItem value="">All</MenuItem>
                {gstOptions.map((g, i) => (
                  <MenuItem key={i} value={String(g)}>{g}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box display="flex" gap={2}>
              <TextField
                size="small"
                label="Amount From"
                type="number"
                value={tempFilters.amountMin}
                onChange={updateTempFilter("amountMin")}
                fullWidth
              />
              <TextField
                size="small"
                label="Amount To"
                type="number"
                value={tempFilters.amountMax}
                onChange={updateTempFilter("amountMax")}
                fullWidth
              />
            </Box>
            <Box display="flex" gap={2}>
              <TextField
                size="small"
                label="Qty From"
                type="number"
                value={tempFilters.qtyMin}
                onChange={updateTempFilter("qtyMin")}
                fullWidth
              />
              <TextField
                size="small"
                label="Qty To"
                type="number"
                value={tempFilters.qtyMax}
                onChange={updateTempFilter("qtyMax")}
                fullWidth
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={clearFilters} color="error">Clear All</Button>
          <Button onClick={() => setFilterOpen(false)} color="secondary">Cancel</Button>
          <Button onClick={applyFilters} variant="contained" color="primary">Apply Filters</Button>
        </DialogActions>
      </Dialog>

      {/* Loading */}
      {loading && (
        <div style={{
          position: "fixed", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)", zIndex: 9999
        }}>
          <RingLoader size={80} />
        </div>
      )}
    </div>
  );
};

export default SaleRegisterTally;
