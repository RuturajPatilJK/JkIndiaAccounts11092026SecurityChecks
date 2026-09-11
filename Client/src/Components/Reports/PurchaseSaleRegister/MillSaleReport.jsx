// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import * as XLSX from 'xlsx';
// import { jsPDF } from 'jspdf';
// import 'jspdf-autotable';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Paper } from '@mui/material';
// import { RingLoader } from 'react-spinners';
// import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
// import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate"

// const apikey = process.env.REACT_APP_API;

// const MillSaleReportRegister = () => {
//     const navigate = useNavigate();
//     const location = useLocation();
//     const searchParams = new URLSearchParams(location.search);
//     const Company_Name = sessionStorage.getItem('Company_Name')
//     const Company_GSTNO = sessionStorage.getItem('Company_GSTNO')
//     const fromDate = searchParams.get('fromDate');
//     const toDate = searchParams.get('toDate');
//     const company_Code = searchParams.get('companyCode');
//     const YearCode = searchParams.get('yearCode');
//     const acCode = searchParams.get('acCode');

//     const [reportData, setReportData] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');

//     const API_URL = `${apikey}/MillSaleReport_Register`;

//     const formatDate = (dateString) => {
//         const date = new Date(dateString);
//         const day = String(date.getDate()).padStart(2, '0');
//         const month = String(date.getMonth() + 1).padStart(2, '0');
//         const year = String(date.getFullYear());
//         return `${day}/${month}/${year}`;
//     };

//     useEffect(() => {
//         const fetchReportData = async () => {
//             setLoading(true);
//             setError('');
//             try {
//                 const response = await axios.get(API_URL, {
//                     params: {
//                         from_date: fromDate,
//                         to_date: toDate,
//                         acCode: acCode,
//                         Company_Code: company_Code,
//                         Year_code: YearCode
//                     },
//                 });
//                 setReportData(response.data);
//             } catch (error) {
//                 console.error('Error fetching report:', error);
//                 setError('Error fetching report');
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchReportData();
//     }, [API_URL]);

//     const handleExportToExcel = () => {
//         const wb = XLSX.utils.book_new();

//         const headers = [
//             "#", "Date", "Party Name", "Mill Name", "Lorry No", "Qty", "Rate", "Subtotal", "Commission", "Frieght", "Other Amt", "Bill Amount"
//         ];

//         const formattedData = reportData.map(item => ({

//             "#": item.doc_no,
//             "Date": formatDate(item.doc_date),
//             "Party Name": item.billtoname,
//             "Mill Name": item.millshortname,
//             "Lorry No": item.LORRYNO,
//             "Qty": Number(item.NETQNTL) || 0,
//             "Rate": item.salerate,
//             "Subtotal": Number(item.subTotal) || 0,
//             "Commission": Number(item.bank_commission) || 0,
//             "Frieght": Number(item.freight) || 0,
//             "Other Amt": Number(item.OTHER_AMT) || 0,
//             "Bill Amount": Number(item.Bill_Amount) || 0,

//         }));

//         const ws = XLSX.utils.json_to_sheet(formattedData, { header: headers });

//         const wsCols = [
//             { wch: 15 },
//             { wch: 30 },
//             { wch: 15, alignment: { horizontal: "right" } },
//             { wch: 10, alignment: { horizontal: "right" } },
//             { wch: 10, alignment: { horizontal: "right" } },
//             { wch: 10, alignment: { horizontal: "right" } },
//             { wch: 15, alignment: { horizontal: "right" } },
//             { wch: 12, alignment: { horizontal: "right" } }
//         ];
//         ws["!cols"] = wsCols;

//         XLSX.utils.book_append_sheet(wb, ws, 'MillSaleReport');
//         XLSX.writeFile(wb, 'MillSaleReport.xlsx');
//     };

//     const handlePrint = async () => {
//         try {
//             const companyName = Company_Name;
//             const fromDate = searchParams.get('fromDate');
//             const toDate = searchParams.get('toDate');

//             if (!reportData || reportData.length === 0) {
//                 console.error("Error: reportData is empty or undefined");
//                 return;
//             }

//             const pdfBlob = await generatePDF(companyName, fromDate, toDate, reportData);

//             if (!pdfBlob || !(pdfBlob instanceof Blob)) {
//                 console.error("Error: Invalid PDF Blob", pdfBlob);
//                 return;
//             }

//             const pdfUrl = URL.createObjectURL(pdfBlob);
//             const win = window.open(pdfUrl);

//             if (!win) {
//                 console.error("Popup blocked! Allow popups to print the PDF.");
//                 return;
//             }

//             setTimeout(() => win.print(), 1000);
//         } catch (error) {
//             console.error("Error in handlePrint:", error);
//         }
//     };

//     const generatePDF = async (companyName, fromDate, toDate, reportData) => {
//         if (!Array.isArray(reportData) || reportData.length === 0) {
//             console.error("Error: reportData is invalid", reportData);
//             return;
//         }

//         const doc = new jsPDF({
//             orientation: 'portrait',
//             unit: 'mm',
//             format: 'a4',
//         });

//         const groupedData = groupReportData(reportData) || {};

//         const tableData = [];

//         doc.setFontSize(16);
//         doc.text(companyName, doc.internal.pageSize.width / 2, 10, { align: 'center' });

//         doc.setFontSize(10);
//         doc.text(`Mill Sale Report From: ${formatDate(fromDate)} To ${formatDate(toDate)}`, 10, 20);

//         tableData.push([
//             'SBill No', 'Customer Name', 'Mill Name', 'Lorry No',
//             'Qty', 'Sale Rate', 'SubTotal', 'Bank Commission',
//             'Freight', 'Other Amt', 'Bill Amount'
//         ]);


//         Object.entries(groupedData).forEach(([key, group]) => {
//             if (!group.items || group.items.length === 0) {

//                 return;
//             }
//             const [mc] = key.split('-');


//             tableData.push([
//                 { content: `${formatDate(mc)}`, colSpan: 11, styles: { halign: 'center', fontStyle: 'bold', textColor: [255, 0, 0] } }
//             ]);

//             group.items.forEach(item => {
//                 tableData.push([
//                     item.doc_no,
//                     item.billtoname,
//                     item.millshortname,
//                     item.LORRYNO,
//                     item.NETQNTL,
//                     formatReadableAmount(item.salerate),
//                     formatReadableAmount(item.subTotal),
//                     formatReadableAmount(item.bank_commission),
//                     formatReadableAmount(item.freight),
//                     formatReadableAmount(item.OTHER_AMT),
//                     formatReadableAmount(item.Bill_Amount)
//                 ]);
//             });

//             tableData.push([
//                 '', 'Total', '', '', formatReadableAmount(group.totalQty), '', formatReadableAmount(group.subtotal), '', '', '', formatReadableAmount(group.BillAmt)
//             ]);
//         });

//         doc.autoTable({
//             headStyles: { fillColor: [255, 0, 0], fontStyle: 'bold' },
//             body: tableData,
//             margin: { top: 25 },
//             styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
//             columnStyles: {
//                 0: { halign: 'center', cellWidth: 20 },
//                 1: { halign: 'left', cellWidth: 55 },
//                 2: { halign: 'left', cellWidth: 30 },
//                 3: { halign: 'center', cellWidth: 25 },
//                 4: { halign: 'right', cellWidth: 20 },
//                 5: { halign: 'right', cellWidth: 20 },
//                 6: { halign: 'right', cellWidth: 25 },
//                 7: { halign: 'right', cellWidth: 20 },
//                 8: { halign: 'right', cellWidth: 20 },
//                 9: { halign: 'right', cellWidth: 20 },
//                 10: { halign: 'right', cellWidth: 30 },
//             },
//             theme: 'grid',
//             didParseCell: function (data) {
//                 if (data.cell.raw && data.cell.raw.colSpan) {
//                     data.cell.styles.lineWidth = 0;
//                 }
//             },
//             didDrawCell: function (data) {
//                 if (data.cell.raw && data.cell.raw.colSpan) {
//                     const { doc, cursor } = data;
//                     const startX = data.cell.x;
//                     const endX = data.cell.x + data.table.columns.reduce((sum, col) => sum + col.width, 0);
//                     const lineY = cursor.y + 0;

//                     doc.setDrawColor(0, 0, 0);
//                     doc.setLineWidth(0.3);
//                     doc.line(startX, lineY, endX, lineY);
//                 }
//             }
//         });
//         doc.pageSize = 'A4';
//         doc.pageOrientation = 'landscape';

//         return doc.output('blob');
//     };

//     const groupReportData = (data) => {
//         const groupedData = {};
//         data.forEach((item) => {
//             const key = `${item.doc_date}`;
//             if (!groupedData[key]) {
//                 groupedData[key] = {
//                     items: [],
//                     totalQty: 0,
//                     subtotal: 0,
//                     BillAmt: 0
//                 };
//             }
//             groupedData[key].items.push(item);
//             groupedData[key].totalQty += parseFloat(item.NETQNTL) || 0;
//             groupedData[key].subtotal += parseFloat(item.subTotal) || 0;
//             groupedData[key].BillAmt += parseFloat(item.Bill_Amount) || 0;
//         });
//         return groupedData;
//     };

//     const groupedReportData = groupReportData(reportData);

//     return (
//         <div style={{marginTop:"-80px"}}>
//             <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold" }}>{Company_Name}</Typography>
//             <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", textDecoration: 'underline', fontWeight: "550" }}>GSTN : {Company_GSTNO}</Typography>
//             <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>Mill Sale Report</Typography>
//             <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px" }}>{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>

//             <div className="mb-3 row align-items-center">
//                 <div className="col-auto">
//                     <button className="btn btn-secondary me-2" onClick={handlePrint}>
//                         Print
//                     </button>
//                     <button className="btn btn-success" onClick={handleExportToExcel}>
//                         Export to Excel
//                     </button>
//                 </div>
//             </div>

//             <div style={{ maxHeight: '75vh', overflow: 'auto', border: '1px solid #ddd' }}>
//                 <Table stickyHeader>
//                     <TableHead>
//                         <TableRow>
//                             {[
//                                 '#', 'Party Name', 'Mill Name', 'Lorry No',
//                                 'Quintal', 'Rate', 'Sub Total',
//                                 'Commission', 'Freight', 'Other Amount', 'Bill Amount'
//                             ].map((label, index) => (
//                                 <TableCell
//                                     key={index}
//                                     sx={{
//                                         position: 'sticky',
//                                         top: 0,
//                                         backgroundColor: '#f5f5f5',
//                                         fontWeight: 'bold',
//                                         zIndex: 2,
//                                         textAlign: index === 0 ? 'center' : index < 4 ? 'left' : 'right'
//                                     }}
//                                 >
//                                     {label}
//                                 </TableCell>
//                             ))}
//                         </TableRow>
//                     </TableHead>

//                     <TableBody>
//                         {Object.entries(groupedReportData).map(([key, { items, totalQty, subtotal, BillAmt }]) => {
//                             const [mc] = key.split('-');
//                             return (
//                                 <React.Fragment key={key}>
//                                     <TableRow>
//                                         <TableCell colSpan={11} sx={{ backgroundColor: '#dbeafe', color: 'blue', fontWeight: 'bold' }}>
//                                             {formatDate(mc)}
//                                         </TableCell>
//                                     </TableRow>

//                                     {items.map((item, index) => (
//                                         <TableRow key={index}>
//                                             <TableCell align="center">{item.doc_no}</TableCell>
//                                             <TableCell align="left">{item.billtoname}</TableCell>
//                                             <TableCell align="left">{item.millshortname}</TableCell>
//                                             <TableCell align="center">{item.LORRYNO}</TableCell>
//                                             <TableCell align="right">{formatReadableAmount(item.NETQNTL)}</TableCell>
//                                             <TableCell align="right">{formatReadableAmount(item.salerate)}</TableCell>
//                                             <TableCell align="right">{formatReadableAmount(item.subTotal)}</TableCell>
//                                             <TableCell align="right">{formatReadableAmount(item.bank_commission)}</TableCell>
//                                             <TableCell align="right">{formatReadableAmount(item.freight)}</TableCell>
//                                             <TableCell align="right">{formatReadableAmount(item.OTHER_AMT)}</TableCell>
//                                             <TableCell align="right">{formatReadableAmount(item.Bill_Amount)}</TableCell>
//                                         </TableRow>
//                                     ))}

//                                     <TableRow>
//                                         <TableCell colSpan={4} sx={{ fontWeight: 'bold', backgroundColor: 'yellow', textAlign: 'right' }}>Total</TableCell>
//                                         <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'yellow', textAlign: 'right' }}>{formatReadableAmount(totalQty)}</TableCell>
//                                         <TableCell sx={{ backgroundColor: 'yellow' }} />
//                                         <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'yellow', textAlign: 'right' }}>{formatReadableAmount(subtotal)}</TableCell>
//                                         <TableCell colSpan={3} sx={{ backgroundColor: 'yellow' }} />
//                                         <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'yellow', textAlign: 'right' }}>{formatReadableAmount(BillAmt)}</TableCell>
//                                     </TableRow>
//                                 </React.Fragment>
//                             );
//                         })}
//                     </TableBody>
//                 </Table>
//             </div>

//             {loading && (
//                 <div style={{
//                     position: 'fixed',
//                     top: '50%',
//                     left: '50%',
//                     transform: 'translate(-50%, -50%)',
//                     zIndex: 9999
//                 }}>
//                     <RingLoader size={80} />
//                 </div>
//             )}

//             {error && <div className="alert alert-danger">{error}</div>}
//         </div>
//     );

// };

// export default MillSaleReportRegister;














import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { useLocation } from "react-router-dom";
import { RingLoader } from "react-spinners";
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Typography, TableFooter, TableSortLabel,
} from "@mui/material";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import PdfPreview from "../../../Common/PDFPreview";
import HeaderJK from "../../../Assets/HeaderJK.png";
import FooterJK from "../../../Assets/FooterJK.png";
import { ConvertNumberToWord } from "../../../Common/FormatFunctions/ConvertNumberToWord";
import { generateReportPDF } from "../../../Common/ReportCommon/CommonPDFGenerator";

const apikey = process.env.REACT_APP_API;

const formatDateStr = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date)) return dateString; 
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const SCREEN_COLUMNS = [
  { label: "#", key: "doc_no", width: "5%", center: true },
  { label: "Date", key: "doc_date", width: "8%", center: true, isDate: true },
  { label: "Party Name", key: "billtoname", width: "15%" },
  { label: "Mill Name", key: "millshortname", width: "10%" },
  { label: "Lorry No", key: "LORRYNO", width: "10%", center: true },
  { label: "Qty", key: "NETQNTL", width: "7%", numeric: true },
  { label: "Rate", key: "salerate", width: "7%", numeric: true },
  { label: "Subtotal", key: "subTotal", width: "9%", numeric: true },
  { label: "Commission", key: "bank_commission", width: "9%", numeric: true },
  { label: "Freight", key: "freight", width: "9%", numeric: true },
  { label: "Other", key: "OTHER_AMT", width: "7%", numeric: true },
  { label: "Bill Amount", key: "Bill_Amount", width: "10%", numeric: true },
];

const PRINT_COLUMNS = [
  { label: "Doc No", key: "doc_no", printWidth: 12, center: true },
  { label: "Date", key: "doc_date", printWidth: 18, center: true },
  { label: "Party Name", key: "billtoname", printWidth: 38 },
  { label: "Mill Name", key: "millshortname", printWidth: 28 },
  { label: "Lorry No", key: "LORRYNO", printWidth: 22, center: true },
  { label: "Qty", key: "NETQNTL", printWidth: 18, numeric: true },
  { label: "Rate", key: "salerate", printWidth: 15, numeric: true },
  { label: "Subtotal", key: "subTotal", printWidth: 22, numeric: true },
  { label: "Bill Amt", key: "Bill_Amount", printWidth: 25, numeric: true },
];

const MillSaleReportRegister = () => {
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
  const [sortConfig, setSortConfig] = useState({ key: "doc_no", direction: "asc" });

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(`${apikey}/MillSaleReport_Register`, {
          params: { from_date: fromDate, to_date: toDate, acCode, Company_Code: company_Code, Year_code: YearCode },
        });
        setReportData(response.data);
      } catch (err) {
        setError("Error fetching report data");
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [fromDate, toDate, acCode, company_Code, YearCode]);

  const sortedData = useMemo(() => {
    let items = [...reportData];
    if (sortConfig.key) {
      items.sort((a, b) => {
        const va = a[sortConfig.key] ?? "";
        const vb = b[sortConfig.key] ?? "";
        if (va < vb) return sortConfig.direction === "asc" ? -1 : 1;
        if (va > vb) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [reportData, sortConfig]);

  // CORRECTED CALCULATION: Added all keys and ensured fallback to 0
const grandTotals = useMemo(() =>
    reportData.reduce((acc, row) => {
      acc.NETQNTL += parseFloat(row.NETQNTL || 0);
      acc.subTotal += parseFloat(row.subTotal || 0);
      acc.bank_commission += parseFloat(row.bank_commission || 0); // Added
      acc.freight += parseFloat(row.freight || 0);               // Added
      acc.OTHER_AMT += parseFloat(row.OTHER_AMT || 0);           // Added
      acc.Bill_Amount += parseFloat(row.Bill_Amount || 0);
      return acc;
    }, { 
      NETQNTL: 0, 
      subTotal: 0, 
      bank_commission: 0, // Initialized
      freight: 0,         // Initialized
      OTHER_AMT: 0,       // Initialized
      Bill_Amount: 0 
    }),
    [reportData]);

  const reportSubtitle = `${formatDateStr(fromDate)} to ${formatDateStr(toDate)}`;

  const handleExportToExcel = () => {
    const headers = SCREEN_COLUMNS.map(c => c.label);
    const worksheetData = [
      [Company_Name?.toUpperCase()],
      [`GST No: ${Company_GSTNO}`],
      [`Mill Sale Report: ${reportSubtitle}`],
      [],
      headers,
      ...sortedData.map(item => SCREEN_COLUMNS.map(col => {
        if (col.isDate) return formatDateStr(item[col.key]);
        return col.numeric ? Number(item[col.key]) || 0 : item[col.key];
      })),
      ["", "GRAND TOTAL", "", "", "", 
       grandTotals.NETQNTL, "", grandTotals.subTotal, grandTotals.bank_commission, 
       grandTotals.freight, grandTotals.OTHER_AMT, grandTotals.Bill_Amount]
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(wb, ws, "MillSaleReport");
    XLSX.writeFile(wb, `MillSaleReport_${fromDate}.xlsx`);
  };

const handleGeneratePDF = () => {
    const headers = PRINT_COLUMNS.map(c => c.label);
    const colWidths = PRINT_COLUMNS.map(c => c.printWidth);

    const rows = sortedData.map(item => 
      PRINT_COLUMNS.map(col => {
        if (col.key === "doc_date") return formatDateStr(item[col.key]);
        if (col.numeric) return formatReadableAmount(item[col.key]);
        return item[col.key] || "";
      })
    );

    // Style configuration for the yellow footer bar
    const yellowFooterStyle = { 
        fillColor: [255, 249, 196], 
        fontStyle: 'bold' 
    };

    // Generate styled footerRow by mapping PRINT_COLUMNS
    const footerRow = PRINT_COLUMNS.map((col, index) => {
        let content = "";
        
        // Logical placement of totals based on your indices
        if (index === 2) content = "GRAND TOTAL";
        if (index === 5) content = formatReadableAmount(grandTotals.NETQNTL);
        if (index === 7) content = formatReadableAmount(grandTotals.subTotal);
        if (index === 8) content = formatReadableAmount(grandTotals.Bill_Amount);

        return {
            content: content,
            styles: {
                ...yellowFooterStyle,
                // Right align if the column is numeric, else left/center
                halign: col.numeric ? 'right' : (col.center ? 'center' : 'left')
            }
        };
    });

    generateReportPDF({
      title: 'Mill Sale Report',
      subtitle: reportSubtitle,
      columns: headers,
      columnWidths: colWidths,
      rows: rows,
      footerRow: footerRow,
      numericCols: PRINT_COLUMNS.map((c, i) => c.numeric ? i : null).filter(i => i !== null),
      centerCols: PRINT_COLUMNS.map((c, i) => c.center ? i : null).filter(i => i !== null),
      amountInWords: ConvertNumberToWord(grandTotals.Bill_Amount),
      headerImgSrc: HeaderJK,
      footerImgSrc: FooterJK,
      orientation: 'landscape',
      onComplete: (url) => setPdfPreview(url),
    });
};


  return (
    <div style={{ padding: '20px', marginTop: '-80px' }}>
      <Typography variant="h5" align="center" style={{ fontWeight: 'bold' }}>{Company_Name}</Typography>
      <Typography variant="subtitle1" align="center">GSTN: {Company_GSTNO}</Typography>
      <Typography variant="h6" align="center">Mill Sale Report</Typography>
      <Typography variant="subtitle2" align="center" color="textSecondary" sx={{ mb: 2 }}>{reportSubtitle}</Typography>

  <div className="my-3 no-print d-flex justify-content-end">
        <button className="btn btn-danger" onClick={handleGeneratePDF}>Print</button>
        <button className="btn btn-success" onClick={handleExportToExcel}>Export Excel</button>
      </div>

      {pdfPreview && <PdfPreview pdfData={pdfPreview} label="MillSaleReport" />}

      <TableContainer component={Paper} sx={{ maxHeight: '70vh', border: '1px solid #ddd' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {SCREEN_COLUMNS.map(col => (
                <TableCell key={col.key} align={col.numeric ? 'right' : col.center ? 'center' : 'left'}
                  sx={{ backgroundColor: '#5557df', color: '#fff', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                  <TableSortLabel 
                    active={sortConfig.key === col.key} 
                    direction={sortConfig.direction}
                    onClick={() => setSortConfig({ key: col.key, direction: sortConfig.key === col.key && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                    sx={{ '&.Mui-active, & .MuiTableSortLabel-icon': { color: '#fff !important' } }}>
                    {col.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((item, idx) => (
              <TableRow key={idx} hover sx={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f9faff' }}>
                {SCREEN_COLUMNS.map(col => (
                  <TableCell key={col.key} align={col.numeric ? 'right' : col.center ? 'center' : 'left'}>
                    {col.numeric ? formatReadableAmount(item[col.key]) : col.isDate ? formatDateStr(item[col.key]) : item[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
          <TableFooter sx={{ position: 'sticky', bottom: 0, zIndex: 2 }}>
            <TableRow sx={{ backgroundColor: '#ffffcc' }}>
              <TableCell colSpan={5} align="center" sx={{ fontWeight: 'bold' }}>GRAND TOTAL</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.NETQNTL)}</TableCell>
              <TableCell />
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.subTotal)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.bank_commission)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.freight)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.OTHER_AMT)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.Bill_Amount)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>

      {loading && <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}><RingLoader color="#36d7b7" size={70} /></div>}
      {error && <div className="alert alert-danger mt-3">{error}</div>}
    </div>
  );
};

export default MillSaleReportRegister;