// import React, { useEffect, useMemo, useState } from "react";
// import axios from "axios";
// import "bootstrap/dist/css/bootstrap.min.css";
// import * as XLSX from "xlsx";
// import { jsPDF } from "jspdf";
// import "jspdf-autotable";
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
//   Box,
//   Button
// } from "@mui/material";
// import { RingLoader } from "react-spinners";
// import { useLocation } from "react-router-dom";
// import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
// import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate";

// const apikey = process.env.REACT_APP_API;

// const PurchaseRegisterTally = () => {
//   const location = useLocation();
//   const searchParams = new URLSearchParams(location.search);

//   const Company_Name = sessionStorage.getItem("Company_Name");
//   const Company_GSTNO = sessionStorage.getItem("Company_GSTNO");

//   const fromDate = searchParams.get("fromDate");
//   const toDate = searchParams.get("toDate");
//   const company_Code = searchParams.get("companyCode");
//   const YearCode = searchParams.get("yearCode");
//   const acCode = searchParams.get("acCode");

//   const API_URL = `${apikey}/Purchase_Register_Tally`;
//   const API_URL_DETAIL = `${apikey}/Purchase_Register`;      
// const API_URL_TALLY  = `${apikey}/Purchase_Register_Tally`;

// const [detailData, setDetailData] = useState([]);
// const [tallyData, setTallyData] = useState([]);

//   // const [reportData, setReportData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   // Tabs: 0 Detailed, 1 Monthly, 2 Partywise, 3 Top Parties
//   const [tab, setTab] = useState(0);

//   // Tally-like filter state (filter on every field)
//   const [filters, setFilters] = useState({
//     global: "",
//     doc_no: "",
//     Bill_No: "",
//     suppliername: "",
//     suppliergstno: "",
//     CompanyPan: "",
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
//   const fetchReportData = async () => {
//     setLoading(true);
//     setError("");

//     try {
//       const url = tab === 0 ? API_URL_DETAIL : API_URL_TALLY;

//       const response = await axios.get(url, {
//         params: {
//           from_date: fromDate,
//           to_date: toDate,
//           Company_Code: company_Code,
//           Year_code: YearCode,
//           acCode: acCode,
//         },
//       });

//       const rows = response.data || [];
//       if (tab === 0) setDetailData(rows);
//       else setTallyData(rows);
//     } catch (err) {
//       console.error("Error fetching report:", err);
//       setError("Error fetching report");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // optional: avoid refetch if already loaded
//   if (tab === 0 && detailData.length) return;
//   if (tab !== 0 && tallyData.length) return;

//   fetchReportData();
//   // eslint-disable-next-line react-hooks/exhaustive-deps
// }, [tab, fromDate, toDate, company_Code, YearCode, acCode, API_URL_DETAIL, API_URL_TALLY]);

// const reportData = tab === 0 ? detailData : tallyData;

//   // Unique dropdown values for select filters
//   const supplierOptions = useMemo(() => {
//     const set = new Set(reportData.map((r) => r.suppliername).filter(Boolean));
//     return Array.from(set).sort();
//   }, [reportData]);

//   const gstOptions = useMemo(() => {
//     const set = new Set(reportData.map((r) => r.gstrate).filter((v) => v !== null && v !== undefined && v !== ""));
//     return Array.from(set).sort((a, b) => Number(a) - Number(b));
//   }, [reportData]);

//   // Apply ALL filters client-side
//   const filteredRows = useMemo(() => {
//     const g = normalize(filters.global);

//     return reportData.filter((r) => {
//       const docNoStr = normalize(r.doc_no);
//       const billNoStr = normalize(r.Bill_No);
//       const supplierStr = normalize(r.suppliername);
//       const gstNoStr = normalize(r.suppliergstno);
//       const CompanyPan = normalize(r.CompanyPan);
//       const gstRateStr = normalize(r.gstrate);

//       // Global search across key fields
//       if (g) {
//         const hay =
//           `${r.doc_no ?? ""} ${r.Bill_No ?? ""} ${r.suppliername ?? ""} ${r.suppliergstno ?? ""} ${r.CompanyPan ?? ""} ${r.gstrate ?? ""}`
//             .toLowerCase();
//         if (!hay.includes(g)) return false;
//       }

//       if (filters.doc_no && !docNoStr.includes(normalize(filters.doc_no))) return false;
//       if (filters.Bill_No && !billNoStr.includes(normalize(filters.Bill_No))) return false;
//       if (filters.suppliername && !supplierStr.includes(normalize(filters.suppliername))) return false;
//       if (filters.suppliergstno && !gstNoStr.includes(normalize(filters.suppliergstno))) return false;
//       if (filters.CompanyPan && !CompanyPan.includes(normalize(filters.CompanyPan))) return false;

//       // GST Rate exact match if selected
//       if (filters.gstrate && gstRateStr !== normalize(filters.gstrate)) return false;

//       // Amount range (Bill_Amount)
//       if (!inRange(r.Bill_Amount, filters.amountMin, filters.amountMax)) return false;

//       // Qty range (NETQNTL)
//       if (!inRange(r.NETQNTL, filters.qtyMin, filters.qtyMax)) return false;

//       return true;
//     });
//   }, [reportData, filters]);

//   // Grand totals based on FILTERED rows
//   const grandTotals = useMemo(() => {
//     return filteredRows.reduce(
//       (acc, item) => {
//         acc.TotalTaxable_Amt += Number(item.subTotal) || 0;
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

//   // ----------- Aggregations -----------

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
//       curr.taxable += Number(r.subTotal) || 0;
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
//       const key = r.suppliername || "Unknown";
//       const curr = map.get(key) || {
//         suppliername: key,
//         suppliergstno: r.suppliergstno || "",
//         CompanyPan: r.CompanyPan || "",
//         netqntl: 0,
//         taxable: 0,
//         cgst: 0,
//         sgst: 0,
//         igst: 0,
//         bill: 0,
//         count: 0,
//       };

//       // Keep GST no if blank earlier
//       if (!curr.suppliergstno && r.suppliergstno) curr.suppliergstno = r.suppliergstno;

//       curr.netqntl += Number(r.NETQNTL) || 0;
//       curr.taxable += Number(r.subTotal) || 0;
//       curr.cgst += Number(r.CGSTAmount) || 0;
//       curr.sgst += Number(r.SGSTAmount) || 0;
//       curr.igst += Number(r.IGSTAmount) || 0;
//       curr.bill += Number(r.Bill_Amount) || 0;
//       curr.count += 1;

//       map.set(key, curr);
//     });

//     return Array.from(map.values()).sort((a, b) => (b.bill || 0) - (a.bill || 0));
//   }, [filteredRows]);

//   const topPartiesRows = useMemo(() => {
//     // Top 10 by bill amount from partywise
//     return partywiseRows.slice(0, 10);
//   }, [partywiseRows]);


//   const handleExportToExcel = () => {
//   const wb = XLSX.utils.book_new();

//   // helper: number safe
//   const n = (v) => Number(v) || 0;

//   if (tab === 0) {
//     const formattedData = filteredRows.map((item) => ({
//       "Our No": item.doc_no,
//       "Date": formatDate(item.doc_date),
//       "Bill No": item.Bill_No,
//       "Supplier Name": item.suppliername,
//       "Supplier GSTNo": item.suppliergstno,
//       "Supplier PANNo": item.CompanyPan,
//       "NetQntl": n(item.NETQNTL),
//       "GST Rate": item.gstrate,
//       "Taxable Amount": n(item.subTotal),
//       "CGST Amount": n(item.CGSTAmount),
//       "SGST Amount": n(item.SGSTAmount),
//       "IGST Amount": n(item.IGSTAmount),
//       "Bill Amount": n(item.Bill_Amount),
//     }));

//     // ✅ Grand Total row (based on your existing grandTotals)
//     formattedData.push({
//       "Our No": "",
//       "Date": "",
//       "Bill No": "",
//       "Supplier Name": "Grand Total",
//       "Supplier GSTNo": "",
//       "Supplier PANNo": "",
//       "NetQntl": n(grandTotals.netqntl),
//       "GST Rate": "",
//       "Taxable Amount": n(grandTotals.TotalTaxable_Amt),
//       "CGST Amount": n(grandTotals.CGSTAmt),
//       "SGST Amount": n(grandTotals.SGSTAmt),
//       "IGST Amount": n(grandTotals.IGSTAmt),
//       "Bill Amount": n(grandTotals.BillamountAmt),
//     });

//     const ws = XLSX.utils.json_to_sheet(formattedData);
//     XLSX.utils.book_append_sheet(wb, ws, "PurchaseRegister_Detail");
//   }

//   if (tab === 1) {
//     const rows = monthlyRows.map((m) => ({
//       "Month": m.month,
//       // "Count": n(m.count),
//       "NetQntl": n(m.netqntl),
//       "Taxable Amount": n(m.taxable),
//       "CGST Amount": n(m.cgst),
//       "SGST Amount": n(m.sgst),
//       "IGST Amount": n(m.igst),
//       "Bill Amount": n(m.bill),
//     }));

//     // ✅ Monthly totals
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
//       // "Count": mt.count,
//       "NetQntl": mt.netqntl,
//       "Taxable Amount": mt.taxable,
//       "CGST Amount": mt.cgst,
//       "SGST Amount": mt.sgst,
//       "IGST Amount": mt.igst,
//       "Bill Amount": mt.bill,
//     });

//     const ws = XLSX.utils.json_to_sheet(rows);
//     XLSX.utils.book_append_sheet(wb, ws, "PurchaseRegister_Monthly");
//   }

//   if (tab === 2) {
//     const rows = partywiseRows.map((p) => ({
//       "Supplier": p.suppliername,
//       "GST No": p.suppliergstno,
//       "PAN No": p.CompanyPan,
//       // "Count": n(p.count),
//       "NetQntl": n(p.netqntl),
//       "Taxable Amount": n(p.taxable),
//       "CGST Amount": n(p.cgst),
//       "SGST Amount": n(p.sgst),
//       "IGST Amount": n(p.igst),
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
//       "Supplier": "Grand Total",
//       "GST No": "",
//       "PAN No": "",
//       // "Count": pt.count,
//       "NetQntl": pt.netqntl,
//       "Taxable Amount": pt.taxable,
//       "CGST Amount": pt.cgst,
//       "SGST Amount": pt.sgst,
//       "IGST Amount": pt.igst,
//       "Bill Amount": pt.bill,
//     });

//     const ws = XLSX.utils.json_to_sheet(rows);
//     XLSX.utils.book_append_sheet(wb, ws, "PurchaseRegister_Partywise");
//   }

//   if (tab === 3) {
//     const rows = topPartiesRows.map((p) => ({
//       "Supplier": p.suppliername,
//       "GST No": p.suppliergstno,
//       "PAN No": p.CompanyPan,
//       // "Count": n(p.count),
//       "NetQntl": n(p.netqntl),
//       "Bill Amount": n(p.bill),
//     }));

//     const tt = topPartiesRows.reduce(
//       (a, p) => {
//         a.count += n(p.count);
//         a.netqntl += n(p.netqntl);
//         a.bill += n(p.bill);
//         return a;
//       },
//       { count: 0, netqntl: 0, bill: 0 }
//     );

//     rows.push({
//       "Supplier": "Grand Total",
//       "GST No": "",
//       "PAN No": "",
//       // "Count": tt.count,
//       "NetQntl": tt.netqntl,
//       "Bill Amount": tt.bill,
//     });

//     const ws = XLSX.utils.json_to_sheet(rows);
//     XLSX.utils.book_append_sheet(wb, ws, "PurchaseRegister_TopParties");
//   }

//   XLSX.writeFile(wb, "PurchaseRegister_Tally.xlsx");
// };


//   const generatePDF = async () => {
//     const doc = new jsPDF();

//     doc.setFontSize(14);
//     doc.text(Company_Name || "Company", doc.internal.pageSize.width / 2, 10, { align: "center" });

//     doc.setFontSize(9);
//     doc.text(`GSTN: ${Company_GSTNO || ""}`, doc.internal.pageSize.width / 2, 16, { align: "center" });

//     doc.setFontSize(11);
//     const title =
//       tab === 0 ? "Purchase Register (Detailed)" :
//       tab === 1 ? "Purchase Register (Monthly)" :
//       tab === 2 ? "Purchase Register (Partywise)" :
//       "Purchase Register (Top Parties)";

//     doc.text(title, doc.internal.pageSize.width / 2, 22, { align: "center" });

//     doc.setFontSize(9);
//     doc.text(`${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`, 10, 28);

//     let head = [];
//     let body = [];

//     if (tab === 0) {
//       head = [[
//         "Our No", "Date", "Bill No", "Supplier", "GST No","PAN No",
//         "NetQntl", "GST Rate", "Taxable Amount", "CGST Amount", "SGST Amount", "IGST Amount", "Bill Amount"
//       ]];

//       body = filteredRows.map((r) => ([
//         r.doc_no,
//         formatDate(r.doc_date),
//         r.Bill_No,
//         r.suppliername,
//         r.suppliergstno,
//         r.CompanyPan,
//         formatReadableAmount(r.NETQNTL),
//         r.gstrate,
//         formatReadableAmount(r.subTotal),
//         formatReadableAmount(r.CGSTAmount),
//         formatReadableAmount(r.SGSTAmount),
//         formatReadableAmount(r.IGSTAmount),
//         formatReadableAmount(r.Bill_Amount),
//       ]));

//       body.push([
//         "", "", "", "Total", "",
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
//       head = [[ "Month", "NetQntl", "Taxable Amount", "CGST Amount", "SGST Amount", "IGST Amount", "Bill Amount" ]];
//       body = monthlyRows.map((m) => ([
//         m.month, 
//         formatReadableAmount(m.netqntl),
//         formatReadableAmount(m.taxable),
//         formatReadableAmount(m.cgst),
//         formatReadableAmount(m.sgst),
//         formatReadableAmount(m.igst),
//         formatReadableAmount(m.bill),
//       ]));
//     }

//     if (tab === 2) {
//       head = [[ "Supplier", "GST No", "PAN No", "NetQntl", "Taxable Amount", "CGST Amount", "SGST Amount", "IGST Amount", "Bill Amount" ]];
//       body = partywiseRows.map((p) => ([
//         p.suppliername,
//         p.suppliergstno,
//         p.CompanyPan,
//         // p.count,
//         formatReadableAmount(p.netqntl),
//         formatReadableAmount(p.taxable),
//         formatReadableAmount(p.cgst),
//         formatReadableAmount(p.sgst),
//         formatReadableAmount(p.igst),
//         formatReadableAmount(p.bill),
//       ]));
//     }

//     if (tab === 3) {
//       head = [[ "Supplier", "GST No","PAN No","NetQntl", "Bill Amount" ]];
//       body = topPartiesRows.map((p) => ([
//         p.suppliername,
//         p.suppliergstno,
//          p.CompanyPan,
//         // p.count,
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

//   // ----------- Filter UI handlers -----------

//   const updateFilter = (key) => (e) => {
//     setFilters((prev) => ({ ...prev, [key]: e.target.value }));
//   };

//   const clearFilters = () => {
//     setFilters({
//       global: "",
//       doc_no: "",
//       Bill_No: "",
//       suppliername: "",
//       suppliergstno: "",
//       CompanyPan: "",
//       gstrate: "",
//       amountMin: "",
//       amountMax: "",
//       qtyMin: "",
//       qtyMax: "",
//     });
//   };

//   // ----------- Render Tables -----------

//   const renderDetailedTable = () => (
//     <TableContainer component={Paper} style={{ maxHeight: "70vh", overflow: "auto" }}>
//       <Table stickyHeader>
//         <TableHead>
//           <TableRow>
//             {[
//               "Our No", "Date", "Bill No", "Supplier Name", "Supplier GST No","Supplier PAN No",
//               "Net Quintal", "GST Rate", "Taxable Amount", "CGST Amount",
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
//                  textAlign: ([0, 1, 2, 4, 5].includes(i) ? "center" : (i === 3 ? "left" : "right")),
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
//               <TableCell align="center">{item.doc_no}</TableCell>
//               <TableCell align="center">{formatDate(item.doc_date)}</TableCell>
//               <TableCell align="center">{item.Bill_No}</TableCell>
//               <TableCell align="left">{item.suppliername}</TableCell>
//               <TableCell align="center">{item.suppliergstno}</TableCell>
//                <TableCell align="center">{item.CompanyPan}</TableCell>
//               <TableCell align="right">{formatReadableAmount(item.NETQNTL)}</TableCell>
//               <TableCell align="right">{item.gstrate}</TableCell>
//               <TableCell align="right">{formatReadableAmount(item.subTotal)}</TableCell>
//               <TableCell align="right">{formatReadableAmount(item.CGSTAmount)}</TableCell>
//               <TableCell align="right">{formatReadableAmount(item.SGSTAmount)}</TableCell>
//               <TableCell align="right">{formatReadableAmount(item.IGSTAmount)}</TableCell>
//               <TableCell align="right">{formatReadableAmount(item.Bill_Amount)}</TableCell>
//             </TableRow>
//           ))}

//           {/* Sticky totals row */}
//           <TableRow>
//             <TableCell
//               colSpan={6}
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
//             {["Month","Net Quintal", "Taxable Amount", "CGST Amount", "SGST Amount", "IGST Amount", "Bill Amount"].map((h, i) => (
//               <TableCell key={i} sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5", whiteSpace: "nowrap", textAlign: i === 0 ? "center" : "right",}}>
//                 {h}
//               </TableCell>
//             ))}
//           </TableRow>
//         </TableHead>
//         <TableBody>
//           {monthlyRows.map((m, i) => (
//             <TableRow key={i}>
//               <TableCell>{m.month}</TableCell>
//               {/* <TableCell>{m.count}</TableCell> */}
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
//             {["Supplier", "GST No", "PAN No","Net Quintal", "Taxable Amount", "CGST Amount", "SGST Amount", "IGST Amount", "Bill Amount"].map((h, i) => (
//               <TableCell key={i} sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5", whiteSpace: "nowrap",textAlign: i === 0 ? "left" : (i === 1 || i === 2 ? "left" : "right"), }}>
//                 {h}
//               </TableCell>
//             ))}
//           </TableRow>
//         </TableHead>
//         <TableBody>
//           {partywiseRows.map((p, i) => (
//             <TableRow key={i}>
//               <TableCell>{p.suppliername}</TableCell>
//               <TableCell>{p.suppliergstno}</TableCell>
//               <TableCell>{p.CompanyPan}</TableCell>
//               {/* <TableCell>{p.count}</TableCell> */}
//               <TableCell align="right">{formatReadableAmount(p.netqntl)}</TableCell>
//               <TableCell align="right">{formatReadableAmount(p.taxable)}</TableCell>
//               <TableCell align="right">{formatReadableAmount(p.cgst)}</TableCell>
//               <TableCell align="right">{formatReadableAmount(p.sgst)}</TableCell>
//               <TableCell align="right">{formatReadableAmount(p.igst)}</TableCell>
//               <TableCell align="right">{formatReadableAmount(p.bill)}</TableCell>
//             </TableRow>
//           ))}
//         </TableBody>
//         {/* Sticky totals row */}
// <TableRow>
//   <TableCell
//     colSpan={3}
//     sx={{
//       position: "sticky",
//       bottom: 0,
//       backgroundColor: "yellow",
//       fontWeight: "bold",
//       zIndex: 1,
//     }}
//   >
//     Grand Total
//   </TableCell>

//   <TableCell
//     align="right"
//     sx={{
//       position: "sticky",
//       bottom: 0,
//       backgroundColor: "yellow",
//       fontWeight: "bold",
//       zIndex: 1,
//     }}
//   >
//     {formatReadableAmount(
//       partywiseRows.reduce((a, p) => a + (Number(p.netqntl) || 0), 0)
//     )}
//   </TableCell>

//   {[
//     partywiseRows.reduce((a, p) => a + (Number(p.taxable) || 0), 0),
//     partywiseRows.reduce((a, p) => a + (Number(p.cgst) || 0), 0),
//     partywiseRows.reduce((a, p) => a + (Number(p.sgst) || 0), 0),
//     partywiseRows.reduce((a, p) => a + (Number(p.igst) || 0), 0),
//     partywiseRows.reduce((a, p) => a + (Number(p.bill) || 0), 0),
//   ].map((val, i) => (
//     <TableCell
//       key={i}
//       align="right"
//       sx={{
//         position: "sticky",
//         bottom: 0,
//         backgroundColor: "yellow",
//         fontWeight: "bold",
//         zIndex: 1,
//       }}
//     >
//       {formatReadableAmount(val)}
//     </TableCell>
//   ))}
// </TableRow>

//       </Table>
//     </TableContainer>
//   );

//   const renderTopPartiesTable = () => (
//     <TableContainer component={Paper} style={{ maxHeight: "70vh", overflow: "auto" }}>
//       <Table stickyHeader>
//         <TableHead>
//           <TableRow>
//             {["Supplier", "GST No","PAN No", "Net Quintal", "Bill Amount"].map((h, i) => (
//               <TableCell key={i} sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5", whiteSpace: "nowrap", textAlign: i === 0 ? "left" : (i === 3 || i === 4 ? "right" : "left"), }}>
//                 {h}
//               </TableCell>
//             ))}
//           </TableRow>
//         </TableHead>
//         <TableBody>
//           {topPartiesRows.map((p, i) => (
//             <TableRow key={i}>
//               <TableCell>{p.suppliername}</TableCell>
//               <TableCell>{p.suppliergstno}</TableCell>
//                 <TableCell>{p.CompanyPan}</TableCell>
//               {/* <TableCell>{p.count}</TableCell> */}
//               <TableCell align="right">{formatReadableAmount(p.netqntl)}</TableCell>
//               <TableCell align="right">{formatReadableAmount(p.bill)}</TableCell>
//             </TableRow>
//           ))}
//         </TableBody>
//         {/* Sticky totals row */}
// <TableRow>
//   <TableCell
//     colSpan={3}
//     sx={{
//       position: "sticky",
//       bottom: 0,
//       backgroundColor: "yellow",
//       fontWeight: "bold",
//       zIndex: 1,
//     }}
//   >
//     Grand Total
//   </TableCell>

//   <TableCell
//     align="right"
//     sx={{
//       position: "sticky",
//       bottom: 0,
//       backgroundColor: "yellow",
//       fontWeight: "bold",
//       zIndex: 1,
//     }}
//   >
//     {formatReadableAmount(
//       topPartiesRows.reduce((a, p) => a + (Number(p.netqntl) || 0), 0)
//     )}
//   </TableCell>

//   <TableCell
//     align="right"
//     sx={{
//       position: "sticky",
//       bottom: 0,
//       backgroundColor: "yellow",
//       fontWeight: "bold",
//       zIndex: 1,
//     }}
//   >
//     {formatReadableAmount(
//       topPartiesRows.reduce((a, p) => a + (Number(p.bill) || 0), 0)
//     )}
//   </TableCell>
// </TableRow>

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
//         Purchase Register
//       </Typography>
//       <Typography variant="h6" style={{ textAlign: "center", fontSize: "16px" }}>
//         {FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}
//       </Typography>

//       {/* Action buttons */}
//       <div className="mb-2 row align-items-center">
//         <div className="col-auto">
//           <button className="btn btn-secondary me-2" onClick={handlePrint}>Print</button>
//           <button className="btn btn-success me-2" onClick={handleExportToExcel}>Export to Excel</button>
//           <button className="btn btn-outline-dark" onClick={clearFilters}>Clear Filters</button>
//         </div>
//       </div>

//       {/* Filter Bar */}
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
//             label="Our No"
//             value={filters.doc_no}
//             onChange={updateFilter("doc_no")}
//           />
//           <TextField
//             size="small"
//             label="Bill No"
//             value={filters.Bill_No}
//             onChange={updateFilter("Bill_No")}
//           />

//           <FormControl size="small" style={{ minWidth: 220 }}>
//             <InputLabel>Supplier</InputLabel>
//             <Select
//               label="Supplier"
//               value={filters.suppliername}
//               onChange={updateFilter("suppliername")}
//             >
//               <MenuItem value="">All</MenuItem>
//               {supplierOptions.map((s, i) => (
//                 <MenuItem key={i} value={s}>{s}</MenuItem>
//               ))}
//             </Select>
//           </FormControl>

//           <TextField
//             size="small"
//             label="Supplier GST No"
//             value={filters.suppliergstno}
//             onChange={updateFilter("suppliergstno")}
//           />

//           <TextField
//             size="small"
//             label="Supplier PAN No"
//             value={filters.CompanyPan}
//             onChange={updateFilter("CompanyPan")}
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

//           {/* In between range filters */}
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

//       {/* Tabs for multiple report modes */}
//       <Paper style={{ marginBottom: 10 }}>
//         <Tabs
//           value={tab}
//           onChange={(_, v) => setTab(v)}
//           variant="scrollable"
//           scrollButtons="auto"
//         >
//           <Tab label="Detailed" />
//           <Tab label="Monthly Purchase" />
//           <Tab label="Partywise Purchase" />
//           <Tab label="Top Parties" />
//         </Tabs>
//       </Paper>

//       {/* Tab Content */}
//       {tab === 0 && renderDetailedTable()}
//       {tab === 1 && renderMonthlyTable()}
//       {tab === 2 && renderPartywiseTable()}
//       {tab === 3 && renderTopPartiesTable()}

//       {/* Loading */}
//       {loading && (
//         <div style={{
//           position: "fixed",
//           top: "50%",
//           left: "50%",
//           transform: "translate(-50%, -50%)",
//           zIndex: 9999
//         }}>
//           <RingLoader size={80} />
//         </div>
//       )}

//       {error && <div className="alert alert-danger">{error}</div>}
//     </div>
//   );
// };

// export default PurchaseRegisterTally;




























import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import * as XLSX from "xlsx";
import {
  Paper,
  TableFooter,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
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
import { ScaleLoader } from "react-spinners";
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
  { label: 'Our No', key: 'doc_no', width: '7%', center: true },
  { label: 'Date', key: 'doc_date', width: '8%', center: true },
  { label: 'Bill No', key: 'Bill_No', width: '8%', center: true },
  { label: 'Supplier Name', key: 'suppliername', width: '20%' },
  { label: 'GST No', key: 'suppliergstno', width: '12%', center: true },
  { label: 'PAN No', key: 'CompanyPan', width: '10%', center: true },
  { label: 'Net Quintal', key: 'NETQNTL', width: '7%', numeric: true },
  { label: 'GST Rate', key: 'gstrate', width: '6%', center: true },
  { label: 'Taxable Amount', key: 'subTotal', width: '9%', numeric: true },
  { label: 'CGST Amount', key: 'CGSTAmount', width: '7%', numeric: true },
  { label: 'SGST Amount', key: 'SGSTAmount', width: '7%', numeric: true },
  { label: 'IGST Amount', key: 'IGSTAmount', width: '7%', numeric: true },
  { label: 'Bill Amount', key: 'Bill_Amount', width: '9%', numeric: true },
];

// Print Columns for Detailed View (without GST No, PAN No, GST Rate for better fit)
const DETAIL_PRINT_COLUMNS = [
  { label: 'Our No', key: 'doc_no', printWidth: '12mm', center: true },
  { label: 'Date', key: 'doc_date', printWidth: '14mm', center: true },
  { label: 'Bill No', key: 'Bill_No', printWidth: '12mm', center: true },
  { label: 'Supplier Name', key: 'suppliername', printWidth: '45mm' },
  { label: 'Net Qntl', key: 'NETQNTL', printWidth: '16mm', numeric: true },
  { label: 'Taxable Amt', key: 'subTotal', printWidth: '20mm', numeric: true },
  { label: 'CGST Amt', key: 'CGSTAmount', printWidth: '16mm', numeric: true },
  { label: 'SGST Amt', key: 'SGSTAmount', printWidth: '16mm', numeric: true },
  { label: 'IGST Amt', key: 'IGSTAmount', printWidth: '16mm', numeric: true },
  { label: 'Bill Amount', key: 'Bill_Amount', printWidth: '18mm', numeric: true },
];

// Monthly Columns
const MONTHLY_SCREEN_COLUMNS = [
  { label: 'Month', key: 'month', width: '15%', center: true },
  { label: 'Net Quintal', key: 'netqntl', width: '15%', numeric: true },
  { label: 'Taxable Amount', key: 'taxable', width: '15%', numeric: true },
  { label: 'CGST Amount', key: 'cgst', width: '12%', numeric: true },
  { label: 'SGST Amount', key: 'sgst', width: '12%', numeric: true },
  { label: 'IGST Amount', key: 'igst', width: '12%', numeric: true },
  { label: 'Bill Amount', key: 'bill', width: '15%', numeric: true },
];

const MONTHLY_PRINT_COLUMNS = [
  { label: 'Month', key: 'month', printWidth: '30mm', center: true },
  { label: 'Net Qntl', key: 'netqntl', printWidth: '22mm', numeric: true },
  { label: 'Taxable Amt', key: 'taxable', printWidth: '25mm', numeric: true },
  { label: 'CGST Amt', key: 'cgst', printWidth: '20mm', numeric: true },
  { label: 'SGST Amt', key: 'sgst', printWidth: '20mm', numeric: true },
  { label: 'IGST Amt', key: 'igst', printWidth: '20mm', numeric: true },
  { label: 'Bill Amount', key: 'bill', printWidth: '22mm', numeric: true },
];

// Partywise Columns
const PARTYWISE_SCREEN_COLUMNS = [
  { label: 'Supplier', key: 'suppliername', width: '25%' },
  { label: 'GST No', key: 'suppliergstno', width: '15%', center: true },
  { label: 'PAN No', key: 'CompanyPan', width: '12%', center: true },
  { label: 'Net Quintal', key: 'netqntl', width: '10%', numeric: true },
  { label: 'Taxable Amount', key: 'taxable', width: '10%', numeric: true },
  { label: 'CGST Amount', key: 'cgst', width: '8%', numeric: true },
  { label: 'SGST Amount', key: 'sgst', width: '8%', numeric: true },
  { label: 'IGST Amount', key: 'igst', width: '8%', numeric: true },
  { label: 'Bill Amount', key: 'bill', width: '10%', numeric: true },
];

const PARTYWISE_PRINT_COLUMNS = [
  { label: 'Supplier', key: 'suppliername', printWidth: '55mm' },
  { label: 'Net Qntl', key: 'netqntl', printWidth: '18mm', numeric: true },
  { label: 'Taxable Amt', key: 'taxable', printWidth: '22mm', numeric: true },
  { label: 'CGST Amt', key: 'cgst', printWidth: '16mm', numeric: true },
  { label: 'SGST Amt', key: 'sgst', printWidth: '16mm', numeric: true },
  { label: 'IGST Amt', key: 'igst', printWidth: '16mm', numeric: true },
  { label: 'Bill Amount', key: 'bill', printWidth: '20mm', numeric: true },
];

// Top Parties Columns
const TOPPARTIES_SCREEN_COLUMNS = [
  { label: 'Supplier', key: 'suppliername', width: '35%' },
  { label: 'GST No', key: 'suppliergstno', width: '20%', center: true },
  { label: 'PAN No', key: 'CompanyPan', width: '15%', center: true },
  { label: 'Net Quintal', key: 'netqntl', width: '15%', numeric: true },
  { label: 'Bill Amount', key: 'bill', width: '15%', numeric: true },
];

const TOPPARTIES_PRINT_COLUMNS = [
  { label: 'Supplier', key: 'suppliername', printWidth: '70mm' },
  { label: 'Net Qntl', key: 'netqntl', printWidth: '25mm', numeric: true },
  { label: 'Bill Amount', key: 'bill', printWidth: '30mm', numeric: true },
];


const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};



const PurchaseRegisterTally = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const Company_Name = sessionStorage.getItem("Company_Name");
  const Company_GSTNO = sessionStorage.getItem("Company_GSTNO");

  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDate");
  const company_Code = searchParams.get("companyCode");
  const YearCode = searchParams.get("yearCode");
  const acCode = searchParams.get("acCode");

  const API_URL_DETAIL = `${apikey}/Purchase_Register`;
  const API_URL_TALLY = `${apikey}/Purchase_Register_Tally`;

  const [detailData, setDetailData] = useState([]);
  const [tallyData, setTallyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [pdfPreview, setPdfPreview] = useState(null);


  // Tally-like filter state
  const [filters, setFilters] = useState({
    global: "",
    doc_no: "",
    Bill_No: "",
    suppliername: "",
    suppliergstno: "",
    CompanyPan: "",
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



  // ADD this hook at the top of the component (after useState imports):


  const debouncedFilters = useDebounce(filters, 300);

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
        const url = tab === 0 ? API_URL_DETAIL : API_URL_TALLY;

        const response = await axios.get(url, {
          params: {
            from_date: fromDate,
            to_date: toDate,
            Company_Code: company_Code,
            Year_code: YearCode,
            acCode: acCode,
          },
        });

        const rows = response.data || [];
        if (tab === 0) setDetailData(rows);
        else setTallyData(rows);
      } catch (err) {
        console.error("Error fetching report:", err);
        setError("Error fetching report");
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [tab, fromDate, toDate, company_Code, YearCode, acCode]);

  const reportData = tab === 0 ? detailData : tallyData;

  // Apply filters
  // const filteredRows = useMemo(() => {
  //   const g = normalize(filters.global);

  //   return reportData.filter((r) => {
  //     const docNoStr = normalize(r.doc_no);
  //     const billNoStr = normalize(r.Bill_No);
  //     const supplierStr = normalize(r.suppliername);
  //     const gstNoStr = normalize(r.suppliergstno);
  //     const CompanyPan = normalize(r.CompanyPan);
  //     const gstRateStr = normalize(r.gstrate);

  //     if (g) {
  //       const hay =
  //         `${r.doc_no ?? ""} ${r.Bill_No ?? ""} ${r.suppliername ?? ""} ${r.suppliergstno ?? ""} ${r.CompanyPan ?? ""} ${r.gstrate ?? ""}`
  //           .toLowerCase();
  //       if (!hay.includes(g)) return false;
  //     }

  //     if (filters.doc_no && !docNoStr.includes(normalize(filters.doc_no))) return false;
  //     if (filters.Bill_No && !billNoStr.includes(normalize(filters.Bill_No))) return false;
  //     if (filters.suppliername && !supplierStr.includes(normalize(filters.suppliername))) return false;
  //     if (filters.suppliergstno && !gstNoStr.includes(normalize(filters.suppliergstno))) return false;
  //     if (filters.CompanyPan && !CompanyPan.includes(normalize(filters.CompanyPan))) return false;
  //     if (filters.gstrate && gstRateStr !== normalize(filters.gstrate)) return false;
  //     if (!inRange(r.Bill_Amount, filters.amountMin, filters.amountMax)) return false;
  //     if (!inRange(r.NETQNTL, filters.qtyMin, filters.qtyMax)) return false;

  //     return true;
  //   });
  // }, [reportData, filters]);


  const filteredRows = useMemo(() => {
  const g = normalize(debouncedFilters.global);
  return reportData.filter((r) => {
    const docNoStr = normalize(r.doc_no);
    const billNoStr = normalize(r.Bill_No);
    const supplierStr = normalize(r.suppliername);
    const gstNoStr = normalize(r.suppliergstno);
    const CompanyPan = normalize(r.CompanyPan);
    const gstRateStr = normalize(r.gstrate);

    if (g) {
      const hay = `${r.doc_no ?? ""} ${r.Bill_No ?? ""} ${r.suppliername ?? ""} ${r.suppliergstno ?? ""} ${r.CompanyPan ?? ""} ${r.gstrate ?? ""}`.toLowerCase();
      if (!hay.includes(g)) return false;
    }

    if (debouncedFilters.doc_no && !docNoStr.includes(normalize(debouncedFilters.doc_no))) return false;
    if (debouncedFilters.Bill_No && !billNoStr.includes(normalize(debouncedFilters.Bill_No))) return false;
    if (debouncedFilters.suppliername && !supplierStr.includes(normalize(debouncedFilters.suppliername))) return false;
    if (debouncedFilters.suppliergstno && !gstNoStr.includes(normalize(debouncedFilters.suppliergstno))) return false;
    if (debouncedFilters.CompanyPan && !CompanyPan.includes(normalize(debouncedFilters.CompanyPan))) return false;
    if (debouncedFilters.gstrate && gstRateStr !== normalize(debouncedFilters.gstrate)) return false;
    if (!inRange(r.Bill_Amount, debouncedFilters.amountMin, debouncedFilters.amountMax)) return false;
    if (!inRange(r.NETQNTL, debouncedFilters.qtyMin, debouncedFilters.qtyMax)) return false;

    return true;
  });
}, [reportData, debouncedFilters]);

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
        } else if (['NETQNTL', 'subTotal', 'CGSTAmount', 'SGSTAmount', 'IGSTAmount', 'Bill_Amount'].includes(sortConfig.key)) {
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

  // Grand totals
  const grandTotals = useMemo(() => {
    return filteredRows.reduce(
      (acc, item) => {
        acc.TotalTaxable_Amt += Number(item.subTotal) || 0;
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
      };

      curr.netqntl += Number(r.NETQNTL) || 0;
      curr.taxable += Number(r.subTotal) || 0;
      curr.cgst += Number(r.CGSTAmount) || 0;
      curr.sgst += Number(r.SGSTAmount) || 0;
      curr.igst += Number(r.IGSTAmount) || 0;
      curr.bill += Number(r.Bill_Amount) || 0;

      map.set(key, curr);
    });

    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredRows]);

  const monthlyTotals = useMemo(() => {
    return monthlyRows.reduce(
      (acc, m) => {
        acc.netqntl += m.netqntl;
        acc.taxable += m.taxable;
        acc.cgst += m.cgst;
        acc.sgst += m.sgst;
        acc.igst += m.igst;
        acc.bill += m.bill;
        return acc;
      },
      { netqntl: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, bill: 0 }
    );
  }, [monthlyRows]);

  const partywiseRows = useMemo(() => {
    const map = new Map();
    filteredRows.forEach((r) => {
      const key = r.suppliername || "Unknown";
      const curr = map.get(key) || {
        suppliername: key,
        suppliergstno: r.suppliergstno || "",
        CompanyPan: r.CompanyPan || "",
        netqntl: 0,
        taxable: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        bill: 0,
      };

      if (!curr.suppliergstno && r.suppliergstno) curr.suppliergstno = r.suppliergstno;
      if (!curr.CompanyPan && r.CompanyPan) curr.CompanyPan = r.CompanyPan;

      curr.netqntl += Number(r.NETQNTL) || 0;
      curr.taxable += Number(r.subTotal) || 0;
      curr.cgst += Number(r.CGSTAmount) || 0;
      curr.sgst += Number(r.SGSTAmount) || 0;
      curr.igst += Number(r.IGSTAmount) || 0;
      curr.bill += Number(r.Bill_Amount) || 0;

      map.set(key, curr);
    });

    return Array.from(map.values()).sort((a, b) => (b.bill || 0) - (a.bill || 0));
  }, [filteredRows]);

  const partywiseTotals = useMemo(() => {
    return partywiseRows.reduce(
      (acc, p) => {
        acc.netqntl += p.netqntl;
        acc.taxable += p.taxable;
        acc.cgst += p.cgst;
        acc.sgst += p.sgst;
        acc.igst += p.igst;
        acc.bill += p.bill;
        return acc;
      },
      { netqntl: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, bill: 0 }
    );
  }, [partywiseRows]);

  const topPartiesRows = useMemo(() => {
    return partywiseRows.slice(0, 10);
  }, [partywiseRows]);

  const topPartiesTotals = useMemo(() => {
    return topPartiesRows.reduce(
      (acc, p) => {
        acc.netqntl += p.netqntl;
        acc.bill += p.bill;
        return acc;
      },
      { netqntl: 0, bill: 0 }
    );
  }, [topPartiesRows]);

  const reportSubtitle = `${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`;

  // Print row renderers
  const renderDetailedPrintRow = (item) => [
    item.doc_no,
    formatDate(item.doc_date),
    item.Bill_No,
    item.suppliername,
    formatReadableAmount(item.NETQNTL),
    formatReadableAmount(item.subTotal),
    formatReadableAmount(item.CGSTAmount),
    formatReadableAmount(item.SGSTAmount),
    formatReadableAmount(item.IGSTAmount),
    formatReadableAmount(item.Bill_Amount),
  ];

  const renderMonthlyPrintRow = (item) => [
    item.month,
    formatReadableAmount(item.netqntl),
    formatReadableAmount(item.taxable),
    formatReadableAmount(item.cgst),
    formatReadableAmount(item.sgst),
    formatReadableAmount(item.igst),
    formatReadableAmount(item.bill),
  ];

  const renderPartywisePrintRow = (item) => [
    item.suppliername,
    formatReadableAmount(item.netqntl),
    formatReadableAmount(item.taxable),
    formatReadableAmount(item.cgst),
    formatReadableAmount(item.sgst),
    formatReadableAmount(item.igst),
    formatReadableAmount(item.bill),
  ];

  const renderTopPartiesPrintRow = (item) => [
    item.suppliername,
    formatReadableAmount(item.netqntl),
    formatReadableAmount(item.bill),
  ];

  // Footer values for print
  const detailedPrintFooter = [
    '', '', '', 'GRAND TOTAL',
    formatReadableAmount(grandTotals.netqntl),
    formatReadableAmount(grandTotals.TotalTaxable_Amt),
    formatReadableAmount(grandTotals.CGSTAmt),
    formatReadableAmount(grandTotals.SGSTAmt),
    formatReadableAmount(grandTotals.IGSTAmt),
    formatReadableAmount(grandTotals.BillamountAmt),
  ];

  const monthlyPrintFooter = [
    'GRAND TOTAL',
    formatReadableAmount(monthlyTotals.netqntl),
    formatReadableAmount(monthlyTotals.taxable),
    formatReadableAmount(monthlyTotals.cgst),
    formatReadableAmount(monthlyTotals.sgst),
    formatReadableAmount(monthlyTotals.igst),
    formatReadableAmount(monthlyTotals.bill),
  ];

  const partywisePrintFooter = [
    'GRAND TOTAL',
    formatReadableAmount(partywiseTotals.netqntl),
    formatReadableAmount(partywiseTotals.taxable),
    formatReadableAmount(partywiseTotals.cgst),
    formatReadableAmount(partywiseTotals.sgst),
    formatReadableAmount(partywiseTotals.igst),
    formatReadableAmount(partywiseTotals.bill),
  ];

  const topPartiesPrintFooter = [
    'GRAND TOTAL',
    formatReadableAmount(topPartiesTotals.netqntl),
    formatReadableAmount(topPartiesTotals.bill),
  ];

  // Generate PDF
  const handleGeneratePDF = () => {
  let config = {};

  // Helper to apply yellow background, bold font, and right-alignment to footers
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
    const numericCols = [4, 5, 6, 7, 8, 9];
    const centerCols = [0, 1, 2];
    config = {
      title: 'Purchase Register',
      subtitle: reportSubtitle,
      columns: DETAIL_PRINT_COLUMNS.map(c => c.label),
      columnWidths: [12, 14, 12, 45, 16, 20, 16, 16, 16, 18],
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
    const numericCols = [1, 2, 3, 4, 5, 6];
    const centerCols = [0];
    config = {
      title: 'Purchase Register (Monthly)',
      subtitle: reportSubtitle,
      columns: MONTHLY_PRINT_COLUMNS.map(c => c.label),
      columnWidths: [30, 22, 25, 20, 20, 20, 22],
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
    const numericCols = [1, 2, 3, 4, 5, 6];
    config = {
      title: 'Purchase Register (Partywise)',
      subtitle: reportSubtitle,
      columns: PARTYWISE_PRINT_COLUMNS.map(c => c.label),
      columnWidths: [55, 18, 22, 16, 16, 16, 20],
      rows: partywiseRows.map(renderPartywisePrintRow),
      footerRow: styleFooter(partywisePrintFooter, numericCols),
      numericCols,
      centerCols: [],
      headerImgSrc: HeaderJK,
      footerImgSrc: FooterJK,
      orientation: 'landscape',
      onComplete: (url) => setPdfPreview(url),
    };
  } else if (tab === 3) {
    const numericCols = [1, 2];
    config = {
      title: 'Purchase Register (Top 10 Parties)',
      subtitle: reportSubtitle,
      columns: TOPPARTIES_PRINT_COLUMNS.map(c => c.label),
      columnWidths: [70, 25, 30],
      rows: topPartiesRows.map(renderTopPartiesPrintRow),
      footerRow: styleFooter(topPartiesPrintFooter, numericCols),
      numericCols,
      centerCols: [],
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
      const formattedData = sortedData.map((item) => ({
        "Our No": item.doc_no,
        "Date": formatDate(item.doc_date),
        "Bill No": item.Bill_No,
        "Supplier Name": item.suppliername,
        "Supplier GSTNo": item.suppliergstno,
        "Supplier PANNo": item.CompanyPan,
        "Net Qntl": n(item.NETQNTL),
        "GST Rate": item.gstrate,
        "Taxable Amount": n(item.subTotal),
        "CGST Amount": n(item.CGSTAmount),
        "SGST Amount": n(item.SGSTAmount),
        "IGST Amount": n(item.IGSTAmount),
        "Bill Amount": n(item.Bill_Amount),
      }));

      formattedData.push({
        "Our No": "",
        "Date": "",
        "Bill No": "",
        "Supplier Name": "GRAND TOTAL",
        "Supplier GSTNo": "",
        "Supplier PANNo": "",
        "Net Qntl": n(grandTotals.netqntl),
        "GST Rate": "",
        "Taxable Amount": n(grandTotals.TotalTaxable_Amt),
        "CGST Amount": n(grandTotals.CGSTAmt),
        "SGST Amount": n(grandTotals.SGSTAmt),
        "IGST Amount": n(grandTotals.IGSTAmt),
        "Bill Amount": n(grandTotals.BillamountAmt),
      });

      const ws = XLSX.utils.json_to_sheet(formattedData);
      XLSX.utils.book_append_sheet(wb, ws, "PurchaseRegister_Detail");
    }

    if (tab === 1) {
      const rows = monthlyRows.map((m) => ({
        "Month": m.month,
        "Net Qntl": n(m.netqntl),
        "Taxable Amount": n(m.taxable),
        "CGST Amount": n(m.cgst),
        "SGST Amount": n(m.sgst),
        "IGST Amount": n(m.igst),
        "Bill Amount": n(m.bill),
      }));

      rows.push({
        "Month": "GRAND TOTAL",
        "Net Qntl": n(monthlyTotals.netqntl),
        "Taxable Amount": n(monthlyTotals.taxable),
        "CGST Amount": n(monthlyTotals.cgst),
        "SGST Amount": n(monthlyTotals.sgst),
        "IGST Amount": n(monthlyTotals.igst),
        "Bill Amount": n(monthlyTotals.bill),
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "PurchaseRegister_Monthly");
    }

    if (tab === 2) {
      const rows = partywiseRows.map((p) => ({
        "Supplier": p.suppliername,
        "GST No": p.suppliergstno,
        "PAN No": p.CompanyPan,
        "Net Qntl": n(p.netqntl),
        "Taxable Amount": n(p.taxable),
        "CGST Amount": n(p.cgst),
        "SGST Amount": n(p.sgst),
        "IGST Amount": n(p.igst),
        "Bill Amount": n(p.bill),
      }));

      rows.push({
        "Supplier": "GRAND TOTAL",
        "GST No": "",
        "PAN No": "",
        "Net Qntl": n(partywiseTotals.netqntl),
        "Taxable Amount": n(partywiseTotals.taxable),
        "CGST Amount": n(partywiseTotals.cgst),
        "SGST Amount": n(partywiseTotals.sgst),
        "IGST Amount": n(partywiseTotals.igst),
        "Bill Amount": n(partywiseTotals.bill),
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "PurchaseRegister_Partywise");
    }

    if (tab === 3) {
      const rows = topPartiesRows.map((p) => ({
        "Supplier": p.suppliername,
        "GST No": p.suppliergstno,
        "PAN No": p.CompanyPan,
        "Net Qntl": n(p.netqntl),
        "Bill Amount": n(p.bill),
      }));

      rows.push({
        "Supplier": "GRAND TOTAL",
        "GST No": "",
        "PAN No": "",
        "Net Qntl": n(topPartiesTotals.netqntl),
        "Bill Amount": n(topPartiesTotals.bill),
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "PurchaseRegister_TopParties");
    }

    XLSX.writeFile(wb, `PurchaseRegister_${fromDate}_to_${toDate}.xlsx`);
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
      Bill_No: "",
      suppliername: "",
      suppliergstno: "",
      CompanyPan: "",
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

  // Unique dropdown values
  const supplierOptions = useMemo(() => {
    const set = new Set(reportData.map((r) => r.suppliername).filter(Boolean));
    return Array.from(set).sort();
  }, [reportData]);

  const gstOptions = useMemo(() => {
    const set = new Set(reportData.map((r) => r.gstrate).filter((v) => v !== null && v !== undefined && v !== ""));
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [reportData]);

  // Render functions for screen tables
  const renderDetailedScreenRow = (item) => [
    item.doc_no,
    formatDate(item.doc_date),
    item.Bill_No,
    item.suppliername,
    item.suppliergstno,
    item.CompanyPan,
    formatReadableAmount(item.NETQNTL),
    item.gstrate,
    formatReadableAmount(item.subTotal),
    formatReadableAmount(item.CGSTAmount),
    formatReadableAmount(item.SGSTAmount),
    formatReadableAmount(item.IGSTAmount),
    formatReadableAmount(item.Bill_Amount),
  ];

  const renderMonthlyScreenRow = (item) => [
    item.month,
    formatReadableAmount(item.netqntl),
    formatReadableAmount(item.taxable),
    formatReadableAmount(item.cgst),
    formatReadableAmount(item.sgst),
    formatReadableAmount(item.igst),
    formatReadableAmount(item.bill),
  ];

  const renderPartywiseScreenRow = (item) => [
    item.suppliername,
    item.suppliergstno,
    item.CompanyPan,
    formatReadableAmount(item.netqntl),
    formatReadableAmount(item.taxable),
    formatReadableAmount(item.cgst),
    formatReadableAmount(item.sgst),
    formatReadableAmount(item.igst),
    formatReadableAmount(item.bill),
  ];

  const renderTopPartiesScreenRow = (item) => [
    item.suppliername,
    item.suppliergstno,
    item.CompanyPan,
    formatReadableAmount(item.netqntl),
    formatReadableAmount(item.bill),
  ];

  return (
    <div style={{ marginTop: "-80px", padding: "20px" }}>
      {/* Print View Component (Hidden on screen, visible when printing) */}
      <CommonPrintView
        title={tab === 0 ? "Purchase Register" : tab === 1 ? "Purchase Register (Monthly)" : tab === 2 ? "Purchase Register (Partywise)" : "Purchase Register (Top 10 Parties)"}
        subtitle={reportSubtitle}
        companyName={Company_Name}
        companyGST={Company_GSTNO}
        columns={tab === 0 ? DETAIL_PRINT_COLUMNS : tab === 1 ? MONTHLY_PRINT_COLUMNS : tab === 2 ? PARTYWISE_PRINT_COLUMNS : TOPPARTIES_PRINT_COLUMNS}
        rows={tab === 0 ? sortedData : tab === 1 ? monthlyRows : tab === 2 ? partywiseRows : topPartiesRows}
        rowRenderer={tab === 0 ? renderDetailedPrintRow : tab === 1 ? renderMonthlyPrintRow : tab === 2 ? renderPartywisePrintRow : renderTopPartiesPrintRow}
        footerValues={tab === 0 ? detailedPrintFooter : tab === 1 ? monthlyPrintFooter : tab === 2 ? partywisePrintFooter : topPartiesPrintFooter}
        amountInWords={ConvertNumberToWord(
          tab === 0 ? grandTotals.BillamountAmt : 
          tab === 1 ? monthlyTotals.bill : 
          tab === 2 ? partywiseTotals.bill : 
          topPartiesTotals.bill
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
        Purchase Register
      </Typography>
      <Typography variant="subtitle2" align="center" color="textSecondary">
        {reportSubtitle}
      </Typography>

{/* Container for both Left and Right sets of buttons */}
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

      {pdfPreview && <PdfPreview pdfData={pdfPreview} label="PurchaseRegister" />}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Tabs */}
      <Paper style={{ marginBottom: 10, marginTop: 5 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab label="Detailed" />
          <Tab label="Monthly Purchase" />
          <Tab label="Partywise Purchase" />
          <Tab label="Top Parties" />
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
                    style={{ fontWeight: 'bold', backgroundColor: '#5557df', color: '#fff' }}
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
                      style={{ fontSize: '0.78rem', whiteSpace: ci < 3 ? 'nowrap' : 'normal' }}
                    >
                      {cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
            <TableFooter style={{ position: 'sticky', bottom: 0, zIndex: 2 }}>
              <TableRow style={{ backgroundColor: '#ffffcc' }}>
                <TableCell colSpan={6} style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>GRAND TOTAL</TableCell>
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

      {/* Tab Content - Top Parties Table */}
      {tab === 3 && (
        <TableContainer component={Paper} style={{ maxHeight: '700px', position: 'relative' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {TOPPARTIES_SCREEN_COLUMNS.map(col => (
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
              {topPartiesRows.map((item, index) => (
                <TableRow key={index} hover style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f5f8ff' }}>
                  {renderTopPartiesScreenRow(item).map((cell, ci) => (
                    <TableCell
                      key={ci}
                      align={TOPPARTIES_SCREEN_COLUMNS[ci]?.numeric ? 'right' : TOPPARTIES_SCREEN_COLUMNS[ci]?.center ? 'center' : 'left'}
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
              label="Search..."
              value={tempFilters.global}
              onChange={updateTempFilter("global")}
              fullWidth
            />
            <Box display="flex" gap={2}>
              <TextField
                size="small"
                label="Our No"
                value={tempFilters.doc_no}
                onChange={updateTempFilter("doc_no")}
                fullWidth
              />
              <TextField
                size="small"
                label="Bill No"
                value={tempFilters.Bill_No}
                onChange={updateTempFilter("Bill_No")}
                fullWidth
              />
            </Box>
            <FormControl size="small" fullWidth>
              <InputLabel>Supplier</InputLabel>
              <Select label="Supplier" value={tempFilters.suppliername} onChange={updateTempFilter("suppliername")}>
                <MenuItem value="">All</MenuItem>
                {supplierOptions.map((s, i) => (
                  <MenuItem key={i} value={s}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box display="flex" gap={2}>
              <TextField
                size="small"
                label="Supplier GST No"
                value={tempFilters.suppliergstno}
                onChange={updateTempFilter("suppliergstno")}
                fullWidth
              />
              <TextField
                size="small"
                label="Supplier PAN No"
                value={tempFilters.CompanyPan}
                onChange={updateTempFilter("CompanyPan")}
                fullWidth
              />
            </Box>
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
           <ScaleLoader color="#1005ad" height={35} width={4} radius={2} margin={2} />
        </div>
      )}
    </div>
  );
};

export default PurchaseRegisterTally;
