// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import * as XLSX from "xlsx";
// import { jsPDF } from "jspdf";
// import "jspdf-autotable";
// import { useLocation } from "react-router-dom";
// import { RingLoader } from "react-spinners";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
//   Typography,
// } from "@mui/material";
// import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
// import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate";

// const apikey = process.env.REACT_APP_API;

// const PurchaseMonthWise = () => {
//   const location = useLocation();
//   const searchParams = new URLSearchParams(location.search);
//   const Company_Name = sessionStorage.getItem("Company_Name");
//   const Company_GSTNO = sessionStorage.getItem("Company_GSTNO");
//   const fromDate = searchParams.get("fromDate");
//   const toDate = searchParams.get("toDate");
//   const company_Code = searchParams.get("companyCode");
//   const YearCode = searchParams.get("yearCode");
//   const acCode = searchParams.get("acCode");

//   const [reportData, setReportData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const API_URL = `${apikey}/PurchaseMonthWise_Register`;

//   useEffect(() => {
//     const fetchReportData = async () => {
//       setLoading(true);
//       setError("");
//       try {
//         const response = await axios.get(API_URL, {
//           params: {
//             from_date: fromDate,
//             to_date: toDate,
//             acCode,
//             Company_Code: company_Code,
//             Year_code: YearCode,
//           },
//         });
//         setReportData(response.data);
//       } catch (error) {
//         setError("Error fetching report");
//         console.error(error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchReportData();
//   }, [API_URL]);

//   const handleExportToExcel = () => {
//     const wb = XLSX.utils.book_new();

//     const headers = [
//       "Year",
//       "Month",
//       "PS Qty",
//       "DS Qty",
//       "CS Qty",
//       "Net Qty",
//       "PS Amt",
//       "DS Amt",
//       "CS Amt",
//       "Net Amt",
//     ];

//     const formattedData = reportData.map((item) => ({
//       Year: item.yr,
//       Month: item.mn,
//       "PS Qty": Number(item.PS_qntl) || 0,
//       "DS Qty": Number(item.DS_qntl) || 0,
//       "CS Qty": Number(item.CS_qntl) || 0,
//       "Net Qty": Number(item.net_qntl) || 0,
//       "PS Amt": Number(item.PS_amt) || 0,
//       "DS Amt": Number(item.DS_amt) || 0,
//       "CS Amt": Number(item.CS_amt) || 0,
//       "Net Amt": Number(item.net_amt) || 0,
//     }));

//     const grandTotal = {
//       Year: "",
//       Month: "Grand Total",
//       "PS Qty": total("PS_qntl"),
//       "DS Qty": total("DS_qntl"),
//       "CS Qty": total("CS_qntl"),
//       "Net Qty": total("net_qntl"),
//       "PS Amt": total("PS_amt"),
//       "DS Amt": total("DS_amt"),
//       "CS Amt": total("CS_amt"),
//       "Net Amt": total("net_amt"),
//     };
//     formattedData.push(grandTotal);

//     const ws = XLSX.utils.json_to_sheet(formattedData, {
//       header: headers,
//       origin: "A6",
//     });

//     const headerRows = [
//       [`Company Name : ${Company_Name}`],
//       [`GSTN         : ${Company_GSTNO}`],
//       [`Report       : Purchase Month Wise Register`],
//       [
//         `Period       : ${FormaDateBalanceSheet(
//           fromDate
//         )} to ${FormaDateBalanceSheet(toDate)}`,
//       ],
//       [],
//     ];
//     XLSX.utils.sheet_add_aoa(ws, headerRows, { origin: "A1" });

//     const wsCols = Array(10).fill({ wch: 15 });
//     ws["!cols"] = wsCols;

//     XLSX.utils.book_append_sheet(wb, ws, "PurchaseMonthWise");
//     XLSX.writeFile(wb, "PurchaseMonthWise.xlsx");
//   };

//   const handlePrint = () => {
//     const doc = new jsPDF();
//     doc.setFontSize(14);
//     doc.text(Company_Name, doc.internal.pageSize.width / 2, 10, {
//       align: "center",
//     });
//     doc.setFontSize(10);
//     doc.text(
//       `Purchase Month Wise Register From: ${FormaDateBalanceSheet(
//         fromDate
//       )} To: ${FormaDateBalanceSheet(toDate)}`,
//       10,
//       20
//     );

//     const table = [
//       [
//         "Year",
//         "Month",
//         "PS Qty",
//         "DS Qty",
//         "CS Qty",
//         "Net Qty",
//         "PS Amt",
//         "DS Amt",
//         "CS Amt",
//         "Net Amt",
//       ],
//     ];
//     let totals = {
//       PS_qntl: 0,
//       DS_qntl: 0,
//       CS_qntl: 0,
//       net_qntl: 0,
//       PS_amt: 0,
//       DS_amt: 0,
//       CS_amt: 0,
//       net_amt: 0,
//     };

//     reportData.forEach((item) => {
//       table.push([
//         item.yr,
//         item.mn,
//         formatReadableAmount(item.PS_qntl),
//         formatReadableAmount(item.DS_qntl),
//         formatReadableAmount(item.CS_qntl),
//         formatReadableAmount(item.net_qntl),
//         formatReadableAmount(item.PS_amt),
//         formatReadableAmount(item.DS_amt),
//         formatReadableAmount(item.CS_amt),
//         formatReadableAmount(item.net_amt),
//       ]);
//       Object.keys(totals).forEach((key) => {
//         totals[key] += parseFloat(item[key]) || 0;
//       });
//     });

//     table.push([
//       "",
//       "Grand Total",
//       formatReadableAmount(totals.PS_qntl),
//       formatReadableAmount(totals.DS_qntl),
//       formatReadableAmount(totals.CS_qntl),
//       formatReadableAmount(totals.net_qntl),
//       formatReadableAmount(totals.PS_amt),
//       formatReadableAmount(totals.DS_amt),
//       formatReadableAmount(totals.CS_amt),
//       formatReadableAmount(totals.net_amt),
//     ]);

//     doc.autoTable({
//       head: [table[0]],
//       body: table.slice(1),
//       startY: 25,
//       styles: {
//         fontSize: 8,
//         halign: "right",
//         cellPadding: 2,
//       },
//       columnStyles: {
//         0: { halign: "center" }, // Year
//         1: { halign: "center" }, // Month
//       },
//       headStyles: {
//         fillColor: [200, 200, 200],
//         halign: "center",
//         fontStyle: "bold",
//       },
//       didParseCell: (data) => {
//         if (data.row.index === table.length - 2) {
//           // total row
//           data.cell.styles.fillColor = [255, 255, 153];
//           data.cell.styles.fontStyle = "bold";
//         }
//       },
//       theme: "grid",
//     });

//     const blob = doc.output("blob");
//     const url = URL.createObjectURL(blob);
//     const win = window.open(url);
//     setTimeout(() => win && win.print(), 1000);
//   };

//   const total = (key) =>
//     reportData
//       .reduce((sum, r) => sum + (parseFloat(r[key]) || 0), 0)
//       .toFixed(2);

//   return (
//     <div style={{marginTop:"-80px"}}>
//       {/* <Typography align="center" fontWeight="bold" fontSize={20}>
//         {Company_Name}
//       </Typography>
//       <Typography
//         align="center"
//         fontSize={14}
//         sx={{ textDecoration: "underline" }}
//       >
//         GSTN : {Company_GSTNO}
//       </Typography> */}
//       <Typography align="center" fontWeight="bold" fontSize={18} >
//         Purchase Month Wise Register
//       </Typography>
//       <Typography align="center" fontSize={14}>
//         {FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}
//       </Typography>

//       <div className="mb-3 text-center" >
//         <button className="btn btn-secondary me-2" onClick={handlePrint}>
//           Print
//         </button>
//         <button className="btn btn-success" onClick={handleExportToExcel}>
//           Export to Excel
//         </button>
//       </div>

//       <TableContainer
//         component={Paper}
//         sx={{ maxWidth: 1100, margin: "auto", marginBottom: 5 }}
//       >
//         <Table size="small" id="reportTable">
//           <TableHead>
//             <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
//               <TableCell align="center">Year</TableCell>
//               <TableCell align="center">Month</TableCell>
//               <TableCell align="right">PS Qty</TableCell>
//               <TableCell align="right">DS Qty</TableCell>
//               <TableCell align="right">CS Qty</TableCell>
//               <TableCell align="right">Net Qty</TableCell>
//               <TableCell align="right">PS Amt</TableCell>
//               <TableCell align="right">DS Amt</TableCell>
//               <TableCell align="right">CS Amt</TableCell>
//               <TableCell align="right">Net Amt</TableCell>
//             </TableRow>
//           </TableHead>
//           <TableBody>
//             {reportData.map((item, idx) => (
//               <TableRow key={idx}>
//                 <TableCell align="center">{item.yr}</TableCell>
//                 <TableCell align="center">{item.mn}</TableCell>
//                 <TableCell align="right">
//                   {formatReadableAmount(item.PS_qntl)}
//                 </TableCell>
//                 <TableCell align="right">
//                   {formatReadableAmount(item.DS_qntl)}
//                 </TableCell>
//                 <TableCell align="right">
//                   {formatReadableAmount(item.CS_qntl)}
//                 </TableCell>
//                 <TableCell align="right">
//                   {formatReadableAmount(item.net_qntl)}
//                 </TableCell>
//                 <TableCell align="right">
//                   {formatReadableAmount(item.PS_amt)}
//                 </TableCell>
//                 <TableCell align="right">
//                   {formatReadableAmount(item.DS_amt)}
//                 </TableCell>
//                 <TableCell align="right">
//                   {formatReadableAmount(item.CS_amt)}
//                 </TableCell>
//                 <TableCell align="right">
//                   {formatReadableAmount(item.net_amt)}
//                 </TableCell>
//               </TableRow>
//             ))}
//             <TableRow sx={{ backgroundColor: "#ffff99" }}>
//               <TableCell colSpan={2} align="right">
//                 <b>Grand Total</b>
//               </TableCell>
//               <TableCell align="right">
//                 <b>{formatReadableAmount(total("PS_qntl"))}</b>
//               </TableCell>
//               <TableCell align="right">
//                 <b>{formatReadableAmount(total("DS_qntl"))}</b>
//               </TableCell>
//               <TableCell align="right">
//                 <b>{formatReadableAmount(total("CS_qntl"))}</b>
//               </TableCell>
//               <TableCell align="right">
//                 <b>{formatReadableAmount(total("net_qntl"))}</b>
//               </TableCell>
//               <TableCell align="right">
//                 <b>{formatReadableAmount(total("PS_amt"))}</b>
//               </TableCell>
//               <TableCell align="right">
//                 <b>{formatReadableAmount(total("DS_amt"))}</b>
//               </TableCell>
//               <TableCell align="right">
//                 <b>{formatReadableAmount(total("CS_amt"))}</b>
//               </TableCell>
//               <TableCell align="right">
//                 <b>{formatReadableAmount(total("net_amt"))}</b>
//               </TableCell>
//             </TableRow>
//           </TableBody>
//         </Table>
//       </TableContainer>

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
//       {error && <div className="alert alert-danger text-center">{error}</div>}
//     </div>
//   );
// };

// export default PurchaseMonthWise;


























import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { useLocation } from "react-router-dom";
import { ScaleLoader } from "react-spinners";
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Typography, TableFooter, TableSortLabel,
} from "@mui/material";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate";
import PdfPreview from "../../../Common/PDFPreview";
import HeaderJK from "../../../Assets/HeaderJK.png";
import FooterJK from "../../../Assets/FooterJK.png";
import { ConvertNumberToWord } from "../../../Common/FormatFunctions/ConvertNumberToWord";
import { generateReportPDF } from "../../../Common/ReportCommon/CommonPDFGenerator";

const apikey = process.env.REACT_APP_API;

// 1. Column Definitions for Screen
const SCREEN_COLUMNS = [
  { label: "Year", key: "yr", width: "8%", center: true },
  { label: "Month", key: "mn", width: "10%", center: true },
  { label: "PS Qty", key: "PS_qntl", width: "10%", numeric: true },
  { label: "DS Qty", key: "DS_qntl", width: "10%", numeric: true },
  { label: "CS Qty", key: "CS_qntl", width: "10%", numeric: true },
  { label: "Net Qty", key: "net_qntl", width: "10%", numeric: true },
  { label: "PS Amt", key: "PS_amt", width: "11%", numeric: true },
  { label: "DS Amt", key: "DS_amt", width: "11%", numeric: true },
  { label: "CS Amt", key: "CS_amt", width: "11%", numeric: true },
  { label: "Net Amt", key: "net_amt", width: "11%", numeric: true },
];

// 2. Balanced PDF Column Widths for A4 Landscape (Ensures no cutting)
const PRINT_COLUMNS = [
  { label: "Year", key: "yr", printWidth: 10, center: true },
  { label: "Month", key: "mn", printWidth: 16, center: true },
  { label: "PS Qty", key: "PS_qntl", printWidth: 18, numeric: true },
  { label: "DS Qty", key: "DS_qntl", printWidth: 18, numeric: true },
  { label: "CS Qty", key: "CS_qntl", printWidth: 18, numeric: true },
  { label: "Net Qty", key: "net_qntl", printWidth: 16, numeric: true },
  { label: "PS Amt", key: "PS_amt", printWidth: 22, numeric: true },
  { label: "DS Amt", key: "DS_amt", printWidth: 22, numeric: true },
  { label: "CS Amt", key: "CS_amt", printWidth: 22, numeric: true },
  { label: "Net Amt", key: "net_amt", printWidth: 22, numeric: true },
];

const PRINT_NUMERIC_COLS = PRINT_COLUMNS.map((c, i) => (c.numeric ? i : null)).filter(i => i !== null);
const PRINT_CENTER_COLS = PRINT_COLUMNS.map((c, i) => (c.center ? i : null)).filter(i => i !== null);

const PurchaseMonthWise = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const Company_Name = sessionStorage.getItem("Company_Name");
  const Company_GSTNO = sessionStorage.getItem("Company_GSTNO");
  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDate");
  const company_Code = searchParams.get("companyCode");
  const YearCode = searchParams.get("yearCode");
  const acCode = searchParams.get("acCode");

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pdfPreview, setPdfPreview] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "yr", direction: "desc" });

  const API_URL = `${apikey}/PurchaseMonthWise_Register`;

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(API_URL, {
          params: { from_date: fromDate, to_date: toDate, acCode, Company_Code: company_Code, Year_code: YearCode },
        });
        setReportData(response.data);
      } catch (error) {
        setError("Error fetching report data");
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [API_URL, fromDate, toDate, acCode, company_Code, YearCode]);

  const sortedData = useMemo(() => {
    let items = [...reportData];
    if (sortConfig.key) {
      items.sort((a, b) => {
        const va = a[sortConfig.key] || 0;
        const vb = b[sortConfig.key] || 0;
        if (va < vb) return sortConfig.direction === "asc" ? -1 : 1;
        if (va > vb) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [reportData, sortConfig]);

  const requestSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const grandTotals = useMemo(() =>
    reportData.reduce((acc, row) => {
      acc.PS_qntl += parseFloat(row.PS_qntl) || 0;
      acc.DS_qntl += parseFloat(row.DS_qntl) || 0;
      acc.CS_qntl += parseFloat(row.CS_qntl) || 0;
      acc.net_qntl += parseFloat(row.net_qntl) || 0;
      acc.PS_amt += parseFloat(row.PS_amt) || 0;
      acc.DS_amt += parseFloat(row.DS_amt) || 0;
      acc.CS_amt += parseFloat(row.CS_amt) || 0;
      acc.net_amt += parseFloat(row.net_amt) || 0;
      return acc;
    }, { PS_qntl: 0, DS_qntl: 0, CS_qntl: 0, net_qntl: 0, PS_amt: 0, DS_amt: 0, CS_amt: 0, net_amt: 0 }),
    [reportData]);

  const reportSubtitle = `${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`;

  const handleExportToExcel = () => {
    const headers = SCREEN_COLUMNS.map(c => c.label);
    const worksheetData = [
      [Company_Name?.toUpperCase()],
      [`GST No: ${Company_GSTNO}`],
      [`Purchase Month Wise Register: ${reportSubtitle}`],
      [],
      headers,
      ...sortedData.map(item => SCREEN_COLUMNS.map(col => col.numeric ? Number(item[col.key]) || 0 : item[col.key])),
      ["", "GRAND TOTAL",
        grandTotals.PS_qntl, grandTotals.DS_qntl, grandTotals.CS_qntl, grandTotals.net_qntl,
        grandTotals.PS_amt, grandTotals.DS_amt, grandTotals.CS_amt, grandTotals.net_amt]
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    ws['!cols'] = SCREEN_COLUMNS.map(() => ({ wch: 15 }));
    XLSX.utils.book_append_sheet(wb, ws, "PurchaseMonthWise");
    XLSX.writeFile(wb, `PurchaseMonthWise_${fromDate}.xlsx`);
  };

  const handleGeneratePDF = () => {
    // Define the yellow highlight style
    const yellowFooterStyle = { 
        fillColor: [255, 249, 196], 
        fontStyle: 'bold' 
    };

    generateReportPDF({
      title: 'Purchase Month Wise Register',
      subtitle: reportSubtitle,
      columns: PRINT_COLUMNS.map(c => c.label),
      columnWidths: PRINT_COLUMNS.map(c => c.printWidth),
      rows: sortedData.map(item => [
        item.yr, 
        item.mn,
        formatReadableAmount(item.PS_qntl), 
        formatReadableAmount(item.DS_qntl),
        formatReadableAmount(item.CS_qntl), 
        formatReadableAmount(item.net_qntl),
        formatReadableAmount(item.PS_amt), 
        formatReadableAmount(item.DS_amt),
        formatReadableAmount(item.CS_amt), 
        formatReadableAmount(item.net_amt),
      ]),

      // Fixed Footer: Added Yellow background and Right-Alignment for amounts
      footerRow: [
        { content: '', styles: yellowFooterStyle }, 
        { content: 'GRAND TOTAL', styles: yellowFooterStyle },
        { content: formatReadableAmount(grandTotals.PS_qntl), styles: { ...yellowFooterStyle, halign: 'right' } }, 
        { content: formatReadableAmount(grandTotals.DS_qntl), styles: { ...yellowFooterStyle, halign: 'right' } },
        { content: formatReadableAmount(grandTotals.CS_qntl), styles: { ...yellowFooterStyle, halign: 'right' } }, 
        { content: formatReadableAmount(grandTotals.net_qntl), styles: { ...yellowFooterStyle, halign: 'right' } },
        { content: formatReadableAmount(grandTotals.PS_amt), styles: { ...yellowFooterStyle, halign: 'right' } }, 
        { content: formatReadableAmount(grandTotals.DS_amt), styles: { ...yellowFooterStyle, halign: 'right' } },
        { content: formatReadableAmount(grandTotals.CS_amt), styles: { ...yellowFooterStyle, halign: 'right' } }, 
        { content: formatReadableAmount(grandTotals.net_amt), styles: { ...yellowFooterStyle, halign: 'right' } }
      ],

      numericCols: PRINT_NUMERIC_COLS,
      centerCols: PRINT_CENTER_COLS,
      amountInWords: ConvertNumberToWord(grandTotals.net_amt),
      headerImgSrc: HeaderJK,
      footerImgSrc: FooterJK,
      orientation: 'landscape',
      onComplete: (url) => setPdfPreview(url),
    });
};

  return (
    <div style={{ padding: '20px', marginTop: '-20px' }}>
      <Typography variant="h5" align="center" style={{ fontWeight: 'bold' }}>{Company_Name}</Typography>
      <Typography variant="subtitle1" align="center">GSTN: {Company_GSTNO}</Typography>
      <Typography variant="h6" align="center">Purchase Month Wise Register</Typography>
      <Typography variant="subtitle2" align="center" color="textSecondary">{reportSubtitle}</Typography>

      <div className="my-3 no-print d-flex justify-content-center gap-2">
        <button className="btn btn-danger" onClick={handleGeneratePDF}>Print PDF</button>
        <button className="btn btn-success" onClick={handleExportToExcel}>Export Excel</button>
      </div>

      {pdfPreview && <PdfPreview pdfData={pdfPreview} label="PurchaseMonthWise" />}
      {error && <div className="alert alert-danger">{error}</div>}

      <TableContainer component={Paper} style={{ maxHeight: '700px', maxWidth: '1250px', margin: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {SCREEN_COLUMNS.map(col => (
                <TableCell
                  key={col.key}
                  align={col.numeric ? 'right' : col.center ? 'center' : 'left'}
                  style={{ backgroundColor: '#5557df', color: '#fff', fontWeight: 'bold' }}
                >
                  <TableSortLabel
                    active={sortConfig.key === col.key}
                    direction={sortConfig.direction}
                    onClick={() => requestSort(col.key)}
                    sx={{ '&.Mui-active, & .MuiTableSortLabel-icon': { color: '#fff !important' }, '&:hover': { color: '#cce0ff' } }}
                  > {col.label} </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((item, idx) => (
              <TableRow key={idx} hover style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f9faff' }}>
                {SCREEN_COLUMNS.map((col, i) => (
                  <TableCell key={i} align={col.numeric ? 'right' : col.center ? 'center' : 'left'} style={{ fontSize: '0.85rem' }}>
                    {col.numeric ? formatReadableAmount(item[col.key]) : item[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
          <TableFooter style={{ position: 'sticky', bottom: 0, zIndex: 2 }}>
            <TableRow style={{ backgroundColor: '#ffffcc' }}>
              <TableCell colSpan={2} style={{ fontWeight: 'bold', textAlign: 'center' }}>GRAND TOTAL</TableCell>
              <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.PS_qntl)}</TableCell>
              <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.DS_qntl)}</TableCell>
              <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.CS_qntl)}</TableCell>
              <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.net_qntl)}</TableCell>
              <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.PS_amt)}</TableCell>
              <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.DS_amt)}</TableCell>
              <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.CS_amt)}</TableCell>
              <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.net_amt)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>

      {loading && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999 }}>
          <ScaleLoader color="#36d7b7" size={70} />
        </div>
      )}
    </div>
  );
};

export default PurchaseMonthWise;
