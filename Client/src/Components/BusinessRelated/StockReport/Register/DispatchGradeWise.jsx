// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import * as XLSX from 'xlsx';
// import { jsPDF } from 'jspdf';
// import 'jspdf-autotable';
// import { useNavigate, useLocation } from 'react-router-dom';
// import PdfPreview from '../../../../Common/PDFPreview';
// import { RingLoader } from 'react-spinners';
// import { Typography } from '@mui/material';
// import { FormaDateBalanceSheet } from "../../../../Common/FormatFunctions/FormatDate"
// import { formatReadableAmount } from "../../../../Common/FormatFunctions/FormatAmount";
// import PrintButton from '../../../../Common/Buttons/PrintPDF';

// const apikey = process.env.REACT_APP_API;

// const DispatchGradeWise = () => {
//     const navigate = useNavigate();
//     const location = useLocation();

//     const searchParams = new URLSearchParams(location.search);
//     const fromDate = searchParams.get('fromDate');
//     const toDate = searchParams.get('toDate');

//     const companyCode = sessionStorage.getItem('Company_Code');
//     const Year_Code = sessionStorage.getItem('Year_Code');
//     const Company_Name = sessionStorage.getItem("Company_Name")
//     const Company_GSTNO = sessionStorage.getItem('Company_GSTNO')

//     const [reportData, setReportData] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');
//     const [pdfPreview, setPdfPreview] = useState(null);

//     const API_URL = `${apikey}/DispatchMillWise`;

//     useEffect(() => {
//         const fetchReportData = async () => {
//             setLoading(true);
//             setError('');
//             try {
//                 const response = await axios.get(API_URL, {
//                     params: {
//                         fromDT: fromDate,
//                         toDT: toDate,
//                         Company_Code: companyCode,
//                         Year_Code: Year_Code,
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

//         if (fromDate && toDate) {
//             fetchReportData();
//         }
//     }, [fromDate, toDate, companyCode, Year_Code]);

//     const handlePrint = () => {
//         const printContent = document.getElementById('reportTable').outerHTML;
//         const win = window.open('', '', 'height=700,width=900');
//         win.document.write(`
//             <html>
//                 <head>
//                     <title>Print Report</title>
//                     <style>
//                         body {
//                             font-family: Arial, sans-serif;
//                             margin: 20px;
//                         }
//                         .company-name {
//                             text-align: center;
//                             font-size: 24px;
//                             font-weight: bold;
//                             margin-bottom: 20px;
//                             color: #333;
//                         }
//                         table {
//                             width: 100%;
//                             border-collapse: collapse;
//                             margin-bottom: 20px;
//                         }
//                         th, td {
//                             border: 1px solid #ddd;
//                             padding: 8px;
//                             text-align: left;
//                         }
//                         th {
//                             background-color: #f2f2f2;
//                             font-weight: bold;
//                         }
//                         tr:nth-child(even) {
//                             background-color: #f9f9f9;
//                         }
//                         .total-row {
//                             background-color: #e0f7fa;
//                             font-weight: bold;
//                         }
//                     </style>
//                 </head>
//                 <body>
//                     <div class="company-name">${Company_Name}</div>
//                     ${printContent}
//                 </body>
//             </html>
//         `);
//         win.document.close();
//         win.print();
//     };

//     const generatePdf = () => {
//         const doc = new jsPDF();
//         const pageWidth = doc.internal.pageSize.getWidth();
//         const textWidth = doc.getTextWidth(Company_Name);
//         const xPosition = (pageWidth - textWidth) / 2;

//         doc.text(Company_Name, xPosition, 10);
//         doc.autoTable({ html: '#reportTable' });

//         const pdfBlob = doc.output('blob');
//         const url = URL.createObjectURL(pdfBlob);
//         setPdfPreview(url);
//     };

//     const handleExportToExcel = () => {
//         const wb = XLSX.utils.book_new();
//         const wsData = [];

//         wsData.push([Company_Name]);
//         wsData.push([]);

//         wsData.push([
//             'DoNo', 'Date', 'Qntl', 'Mill Rate', 'Amount', 'SaleRate',
//             'PurchaseRate', 'TDSAmt', 'CGSTAmt', 'SGSTAmt', 'IGSTAmt',
//             'BillAmt', 'NetPayableAmt'
//         ]);

//         Object.entries(groupedReportData).forEach(([key, { items }]) => {
//             wsData.push([key]);

//             let totalQty = 0, amount = 0, TDSamt = 0, CGSTAmt = 0, SGSTAmt = 0, IGSTAmt = 0, BIllAmt = 0, NetPayable = 0;

//             items.forEach(item => {
//                 const qntl = parseFloat(item.quantal) || 0;
//                 const amt = parseFloat(item.amount) || 0;
//                 const tds = parseFloat(item.TDS_Amt) || 0;
//                 const cgst = parseFloat(item.CGSTAmount) || 0;
//                 const sgst = parseFloat(item.SGSTAmount) || 0;
//                 const igst = parseFloat(item.IGSTAmount) || 0;
//                 const bill = parseFloat(item.Bill_Amount) || 0;
//                 const net = parseFloat(item.TCS_Net_Payable) || 0;

//                 totalQty += qntl;
//                 amount += amt;
//                 TDSamt += tds;
//                 CGSTAmt += cgst;
//                 SGSTAmt += sgst;
//                 IGSTAmt += igst;
//                 BIllAmt += bill;
//                 NetPayable += net;

//                 wsData.push([
//                     item.do_no,
//                     item.do_date,
//                     qntl,
//                     item.millrate,
//                     amt,
//                     item.salerate,
//                     item.PurchaseRate,
//                     tds,
//                     cgst,
//                     sgst,
//                     igst,
//                     bill,
//                     net,

//                 ]);
//             });

//             wsData.push([
//                 'Total',

//                 '',
//                 totalQty.toFixed(2),
//                 '',
//                 amount.toFixed(2),
//                 '',
//                 '',
//                 TDSamt.toFixed(2),
//                 CGSTAmt.toFixed(2),
//                 SGSTAmt.toFixed(2),
//                 IGSTAmt.toFixed(2),
//                 BIllAmt.toFixed(2),
//                 NetPayable.toFixed(2),

//             ]);

//             wsData.push([]);
//         });

//         const ws = XLSX.utils.aoa_to_sheet(wsData);
//         XLSX.utils.book_append_sheet(wb, ws, 'DispatchGradeWise');
//         XLSX.writeFile(wb, 'DispatchGradeWise.xlsx');
//     };

//     const groupReportData = (data) => {
//         const grouped = {};
//         data.forEach(item => {
//             const key = `${item.purc_no}-${item.grade}`;
//             if (!grouped[key]) {
//                 grouped[key] = { items: [] };
//             }
//             grouped[key].items.push(item);
//         });
//         return grouped;
//     };

//     const groupedReportData = groupReportData(reportData);

//     return (
//         <div style={{ marginTop: '-80px' }}>
//             {/* <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold" }}>{Company_Name}</Typography>
//             <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", textDecoration: 'underline', fontWeight: "550" }}>GSTN : {Company_GSTNO}</Typography> */}

//             <div className="d-flex justify-content-between align-items-center">
//                 <div style={{ flex: 1, textAlign: 'center',marginLeft:"280px"  }}>
//                     <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>Dispatch Grade Wise</Typography>
//                     <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px" }}>{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>
//                 </div>

//                 <div className="d-flex justify-content-end">
//                     <PrintButton disabledFeild={""} fetchData={handlePrint} />
//                     <button className="btn btn-success me-2" onClick={handleExportToExcel}>Export to Excel</button>
//                     <button className="btn btn-secondary" onClick={generatePdf}>PDF</button>
//                 </div>
//             </div>


//             {loading ? (
//                 <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
//                     <RingLoader />
//                 </div>
//             ) : error ? (
//                 <div className="alert alert-danger">{error}</div>
//             ) : (
//                 <div style={{ maxHeight: "800px", overflowY: "auto" }}>
//                     <table className="table table-striped table-bordered mt-4" id="reportTable" style={{ marginBottom: "60px", width: "100%" }}>
//                         <thead className="table-light" style={{ position: "sticky", top: 0, backgroundColor: "#fff", zIndex: 1, whiteSpace: "nowrap" }}>
//                             <tr>
//                                 <th>Do No</th>
//                                 <th>Date</th>
//                                 <th>Quintal</th>
//                                 <th>Mill Rate</th>
//                                 <th>Amount</th>
//                                 <th>Sale Rate</th>
//                                 <th>Purchase Rate</th>
//                                 <th>TDS</th>
//                                 <th>CGST</th>
//                                 <th>SGST</th>
//                                 <th>IGST</th>
//                                 <th>Bill Amount</th>
//                                 <th>Net Payable Amount</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {Object.entries(groupedReportData).map(([key, { items }]) => {
//                                 const totalQty = items.reduce((sum, item) => sum + parseFloat(item.quantal || 0), 0);
//                                 const amount = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
//                                 const TDSamt = items.reduce((sum, item) => sum + parseFloat(item.TDS_Amt || 0), 0);
//                                 const CGSTAmt = items.reduce((sum, item) => sum + parseFloat(item.CGSTAmount || 0), 0);
//                                 const SGSTAmt = items.reduce((sum, item) => sum + parseFloat(item.SGSTAmount || 0), 0);
//                                 const IGSTAmt = items.reduce((sum, item) => sum + parseFloat(item.IGSTAmount || 0), 0);
//                                 const BIllAmt = items.reduce((sum, item) => sum + parseFloat(item.Bill_Amount || 0), 0);
//                                 const NetPayable = items.reduce((sum, item) => sum + parseFloat(item.TCS_Net_Payable || 0), 0);

//                                 return (
//                                     <React.Fragment key={key}>
//                                         <tr>
//                                             <td colSpan={14} align="left" className="table-primary" style={{ color: 'blue', fontWeight: 'bold' }}>{key}</td>
//                                         </tr>
//                                         {items.map((item, index) => (
//                                             <tr key={index}>
//                                                 <td style={{ fontWeight: 'bold' }}>{item.do_no}</td>
//                                                 <td style={{ fontWeight: 'bold' }}>{item.do_date}</td>

//                                                 <td align="right">{formatReadableAmount(item.quantal)}</td>
//                                                 <td align="right">{formatReadableAmount(item.millrate)}</td>
//                                                 <td align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(item.amount)}</td>
//                                                 <td align="right">{formatReadableAmount(item.salerate)}</td>
//                                                 <td align="right">{formatReadableAmount(item.PurchaseRate)}</td>
//                                                 <td align="right">{formatReadableAmount(item.TDS_Amt)}</td>
//                                                 <td align="right">{formatReadableAmount(item.CGSTAmount)}</td>
//                                                 <td align="right">{formatReadableAmount(item.SGSTAmount)}</td>
//                                                 <td align="right">{formatReadableAmount(item.IGSTAmount)}</td>
//                                                 <td align="right">{formatReadableAmount(item.Bill_Amount)}</td>
//                                                 <td align="right">{formatReadableAmount(item.TCS_Net_Payable)}</td>

//                                             </tr>
//                                         ))}
//                                         <tr style={{ fontWeight: 'bold', backgroundColor: '#f0f8ff' }}>
//                                             <td colSpan={2} align="right">Total </td>
//                                             <td align="right">{formatReadableAmount(totalQty.toFixed(2))}</td>
//                                             <td></td>
//                                             <td align="right">{formatReadableAmount(amount.toFixed(2))}</td>
//                                             <td></td>
//                                             <td></td>
//                                             <td align="right">{formatReadableAmount(TDSamt.toFixed(2))}</td>
//                                             <td align="right">{formatReadableAmount(CGSTAmt.toFixed(2))}</td>
//                                             <td align="right">{formatReadableAmount(SGSTAmt.toFixed(2))}</td>
//                                             <td align="right">{formatReadableAmount(IGSTAmt.toFixed(2))}</td>
//                                             <td align="right">{formatReadableAmount(BIllAmt.toFixed(2))}</td>
//                                             <td align="right">{formatReadableAmount(NetPayable.toFixed(2))}</td>
//                                         </tr>
//                                     </React.Fragment>
//                                 );
//                             })}
//                         </tbody>
//                     </table>
//                 </div>
//             )}

//             {pdfPreview && (
//                 <div className="centered-container">
//                     <PdfPreview pdfData={pdfPreview} apiData={reportData} label={'NewDispatchRegister'} />
//                 </div>
//             )}
//         </div>
//     );
// };

// export default DispatchGradeWise;



















// import React, { useState, useEffect, useMemo } from 'react';
// import axios from 'axios';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import * as XLSX from 'xlsx';
// import { useLocation } from 'react-router-dom';
// import { formatReadableAmount } from '../../../../Common/FormatFunctions/FormatAmount';
// import { RingLoader } from 'react-spinners';
// import {
//     Table, TableBody, TableCell, TableContainer, TableHead,
//     TableRow, Paper, Typography, TableSortLabel, TableFooter, Box
// } from '@mui/material';
// import { FormaDateBalanceSheet } from '../../../../Common/FormatFunctions/FormatDate';
// import PdfPreview from '../../../../Common/PDFPreview';
// import HeaderJK from '../../../../Assets/HeaderJK.png';
// import FooterJK from '../../../../Assets/FooterJK.png';
// import { generateReportPDF } from '../../../../Common/ReportCommon/CommonPDFGenerator';
// import CommonSearchBar from '../../../../Common/SearchBar/ReportSearchBar';

// const apikey = process.env.REACT_APP_API;

// // Screen columns (UI Table)
// const SCREEN_COLUMNS = [
//     { label: 'Do No', key: 'do_no', width: '5%' },
//     { label: 'Date', key: 'do_date', width: '8%' },
//     { label: 'Quintal', key: 'quantal', width: '7%', numeric: true, isTotal: true },
//     { label: 'Mill Rate', key: 'millrate', width: '7%', numeric: true, isTotal: false },
//     { label: 'Sale Rate', key: 'salerate', width: '7%', numeric: true, isTotal: false },
//     { label: 'Purchase Rate', key: 'PurchaseRate', width: '7%', numeric: true, isTotal: false },
//     { label: 'Amount', key: 'amount', width: '8%', numeric: true, isTotal: true },
//     { label: 'TDS', key: 'TDS_Amt', width: '6%', numeric: true, isTotal: false },
//     { label: 'CGST', key: 'CGSTAmount', width: '6%', numeric: true, isTotal: true },
//     { label: 'SGST', key: 'SGSTAmount', width: '6%', numeric: true, isTotal: true },
//     { label: 'IGST', key: 'IGSTAmount', width: '6%', numeric: true, isTotal: true },
//     { label: 'Bill Amt', key: 'Bill_Amount', width: '8%', numeric: true, isTotal: true },
//     { label: 'Net Payable', key: 'TCS_Net_Payable', width: '8%', numeric: true, isTotal: true },
// ];

// // PDF columns (Limited columns for Print)
// const PRINT_COLUMNS = [
//     { label: 'Do No', key: 'do_no', printWidth: 20 },
//     { label: 'Date', key: 'do_date', printWidth: 25 },
//     { label: 'Quintal', key: 'quantal', printWidth: 25, numeric: true, isTotal: true },
//     { label: 'Mill Rate', key: 'millrate', printWidth: 25, numeric: true, isTotal: false },
//     { label: 'Sale Rate', key: 'salerate', printWidth: 25, numeric: true, isTotal: false },
//     { label: 'CGST', key: 'CGSTAmount', printWidth: 25, numeric: true, isTotal: true },
//     { label: 'SGST', key: 'SGSTAmount', printWidth: 25, numeric: true, isTotal: true },
//     { label: 'IGST', key: 'IGSTAmount', printWidth: 25, numeric: true, isTotal: true },
//     { label: 'Bill Amount', key: 'Bill_Amount', printWidth: 30, numeric: true, isTotal: true },
// ];

// const DispatchGradeWise = () => {
//     const location = useLocation();
//     const searchParams = new URLSearchParams(location.search);
//     const fromDate = searchParams.get('fromDate');
//     const toDate = searchParams.get('toDate');

//     const companyCode = sessionStorage.getItem('Company_Code');
//     const Year_Code = sessionStorage.getItem('Year_Code');
//     const Company_Name = sessionStorage.getItem("Company_Name");
//     const Company_GSTNO = sessionStorage.getItem('Company_GSTNO');

//     const [reportData, setReportData] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');
//     const [pdfPreview, setPdfPreview] = useState(null);
//     const [searchTerm, setSearchTerm] = useState('');
//     const [sortConfig, setSortConfig] = useState({ key: 'do_no', direction: 'asc' });

//     const API_URL = `${apikey}/DispatchMillWise`;

//     useEffect(() => {
//         const fetchReportData = async () => {
//             setLoading(true);
//             try {
//                 const res = await axios.get(API_URL, {
//                     params: { fromDT: fromDate, toDT: toDate, Company_Code: companyCode, Year_Code: Year_Code },
//                 });
//                 setReportData(res.data);
//             } catch (err) { setError('Error fetching report'); }
//             finally { setLoading(false); }
//         };
//         if (fromDate && toDate) fetchReportData();
//     }, [fromDate, toDate, companyCode, Year_Code]);

//     // Search and Sort Logic
//     const filteredAndSortedData = useMemo(() => {
//         let items = [...reportData];
//         if (searchTerm) {
//             items = items.filter((item) =>
//                 Object.values(item).some((val) =>
//                     String(val).toLowerCase().includes(searchTerm.toLowerCase())
//                 )
//             );
//         }
//         if (sortConfig.key) {
//             items.sort((a, b) => {
//                 const va = a[sortConfig.key] || 0;
//                 const vb = b[sortConfig.key] || 0;
//                 if (va < vb) return sortConfig.direction === 'asc' ? -1 : 1;
//                 if (va > vb) return sortConfig.direction === 'asc' ? 1 : -1;
//                 return 0;
//             });
//         }
//         return items;
//     }, [reportData, sortConfig, searchTerm]);

//     // Grouping and Totals Logic (Grade-Wise)
//     const { groupedData, grandTotals } = useMemo(() => {
//         const groups = {};
//         const grand = {};
//         SCREEN_COLUMNS.filter(c => c.isTotal).forEach(c => grand[c.key] = 0);

//         filteredAndSortedData.forEach(item => {
//             const key = `${item.purc_no}-${item.grade}`;
//             if (!groups[key]) {
//                 groups[key] = { items: [], totals: {} };
//                 SCREEN_COLUMNS.filter(c => c.isTotal).forEach(c => groups[key].totals[c.key] = 0);
//             }
//             groups[key].items.push(item);
//             SCREEN_COLUMNS.filter(c => c.isTotal).forEach(c => {
//                 const val = parseFloat(item[c.key]) || 0;
//                 groups[key].totals[c.key] += val;
//                 grand[c.key] += val;
//             });
//         });
//         return { groupedData: groups, grandTotals: grand };
//     }, [filteredAndSortedData]);

//     const requestSort = (key) =>
//         setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));

//     const handleExportToExcel = () => {
//         const wb = XLSX.utils.book_new();
//         const wsData = [
//             [Company_Name?.toUpperCase()],
//             [`GST No: ${Company_GSTNO}`],
//             [`Dispatch Grade Wise Report`],
//             [`Period: ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`],
//             [],
//             SCREEN_COLUMNS.map(c => c.label)
//         ];

//         Object.entries(groupedData).forEach(([grade, group]) => {
//             wsData.push([grade]);
//             group.items.forEach(item => {
//                 wsData.push(SCREEN_COLUMNS.map(c => c.numeric ? (parseFloat(item[c.key]) || 0) : item[c.key]));
//             });
//             const subRow = new Array(SCREEN_COLUMNS.length).fill("");
//             subRow[0] = "Sub Total:";
//             SCREEN_COLUMNS.forEach((c, i) => { if (c.isTotal) subRow[i] = group.totals[c.key]; });
//             wsData.push(subRow);
//             wsData.push([]);
//         });

//         const ws = XLSX.utils.aoa_to_sheet(wsData);
//         XLSX.utils.book_append_sheet(wb, ws, 'DispatchGrade');
//         XLSX.writeFile(wb, `Dispatch_GradeWise.xlsx`);
//     };

//     const handleGeneratePDF = () => {
//         const rows = [];
//         Object.entries(groupedData).forEach(([grade, group]) => {
//             rows.push([{ content: grade, colSpan: PRINT_COLUMNS.length, styles: { fillColor: [240, 240, 240], fontStyle: 'bold' } }]);
//             group.items.forEach(item => {
//                 rows.push(PRINT_COLUMNS.map(col => col.numeric ? formatReadableAmount(item[col.key]) : item[col.key]));
//             });
//             rows.push(PRINT_COLUMNS.map(col => col.isTotal ? formatReadableAmount(group.totals[col.key]) : (col.label === 'Do No' ? 'Total' : '')));
//         });

//         generateReportPDF({
//             title: 'Dispatch Grade Wise',
//             subtitle: `Period: ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`,
//             columns: PRINT_COLUMNS.map(c => c.label),
//             rows: rows,
//             footerRow: PRINT_COLUMNS.map(col => col.isTotal ? { content: formatReadableAmount(grandTotals[col.key]), alignment: 'right' } : (col.label === 'Do No' ? { content: 'GRAND TOTAL', alignment: 'left' } : { content: '', alignment: 'left' })),
//             headerImgSrc: HeaderJK,
//             footerImgSrc: FooterJK,
//             numericCols: PRINT_COLUMNS.map((c, i) => c.numeric ? i : null).filter(i => i !== null),
//             onComplete: (url) => setPdfPreview(url),
//         });
//     };

//     return (
//         <Box sx={{ padding: '15px', marginTop: "-80px" }}>
//             <Box sx={{ textAlign: 'center' }}>
//                 {/* <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a237e' }}>{Company_Name}</Typography> */}
//                 <Typography variant="h6" sx={{ textDecoration: 'underline' }}>Dispatch Grade Wise</Typography>
//                 <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
//                     Date: {FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}
//                 </Typography>
//             </Box>

//             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
//                 <CommonSearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search records..." />
//                 <Box sx={{ display: 'flex', gap: 1 }}>
//                     <button className="btn btn-danger btn-sm" onClick={handleGeneratePDF}>Print PDF</button>
//                     <button className="btn btn-success btn-sm" onClick={handleExportToExcel}>Export Excel</button>
//                 </Box>
//             </Box>

//             <TableContainer component={Paper} sx={{ maxHeight: '750px', boxShadow: 5 }}>
//                 <Table stickyHeader size="small">
//                     <TableHead>
//                         <TableRow>
//                             {SCREEN_COLUMNS.map(col => (
//                                 <TableCell key={col.key} align={col.numeric ? 'right' : 'left'} style={{ backgroundColor: '#1a237e', color: '#fff', fontWeight: 'bold' }}>
//                                     <TableSortLabel active={sortConfig.key === col.key} direction={sortConfig.direction} onClick={() => requestSort(col.key)} sx={{ '& .MuiTableSortLabel-icon': { color: '#fff !important' }, color: '#fff !important' }}>
//                                         {col.label}
//                                     </TableSortLabel>
//                                 </TableCell>
//                             ))}
//                         </TableRow>
//                     </TableHead>
//                     <TableBody>
//                         {Object.entries(groupedData).map(([grade, group]) => (
//                             <React.Fragment key={grade}>
//                                 <TableRow>
//                                     <TableCell colSpan={SCREEN_COLUMNS.length} sx={{ fontWeight: 'bold', backgroundColor: '#e8eaf6', color: '#1a237e' }}>{grade}</TableCell>
//                                 </TableRow>
//                                 {group.items.map((item, idx) => (
//                                     <TableRow key={idx} hover>
//                                         {SCREEN_COLUMNS.map(col => (
//                                             <TableCell key={col.key} align={col.numeric ? 'right' : 'left'}>
//                                                 {col.numeric ? formatReadableAmount(item[col.key]) : item[col.key]}
//                                             </TableCell>
//                                         ))}
//                                     </TableRow>
//                                 ))}
//                                 <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
//                                     <TableCell colSpan={2} sx={{ fontWeight: 'bold', textAlign: 'right' }}>Sub Total:</TableCell>
//                                     {SCREEN_COLUMNS.slice(2).map(col => (
//                                         <TableCell key={col.key} align={col.numeric ? 'right' : 'left'} sx={{ fontWeight: 'bold' }}>
//                                             {col.isTotal ? formatReadableAmount(group.totals[col.key]) : ''}
//                                         </TableCell>
//                                     ))}
//                                 </TableRow>
//                             </React.Fragment>
//                         ))}
//                     </TableBody>
//                     <TableFooter sx={{ position: 'sticky', bottom: 0, zIndex: 10, backgroundColor: '#fff9c4' }}>
//                         <TableRow>
//                             <TableCell colSpan={2} sx={{ fontWeight: 'bold', fontSize: '1rem' }}>GRAND TOTAL</TableCell>
//                             {SCREEN_COLUMNS.slice(2).map(col => (
//                                 <TableCell key={col.key} align={col.numeric ? 'right' : 'left'} sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
//                                     {col.isTotal ? formatReadableAmount(grandTotals[col.key]) : ''}
//                                 </TableCell>
//                             ))}
//                         </TableRow>
//                     </TableFooter>
//                 </Table>
//             </TableContainer>

//             {pdfPreview && <PdfPreview pdfData={pdfPreview} label="DispatchGradeWise" />}
//             {loading && <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}><RingLoader color="#1a237e" size={60} /></div>}
//         </Box>
//     );
// };

// export default DispatchGradeWise;















import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as XLSX from 'xlsx';
import { useLocation } from 'react-router-dom';
import { formatReadableAmount } from '../../../../Common/FormatFunctions/FormatAmount';
import { ScaleLoader } from 'react-spinners';
import {
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, Typography, TableSortLabel, TableFooter, Box
} from '@mui/material';
import { FormaDateBalanceSheet } from '../../../../Common/FormatFunctions/FormatDate';
import PdfPreview from '../../../../Common/PDFPreview';
import HeaderJK from '../../../../Assets/HeaderJK.png';
import FooterJK from '../../../../Assets/FooterJK.png';
import { generateReportPDF } from '../../../../Common/ReportCommon/CommonPDFGenerator';
import CommonSearchBar from '../../../../Common/SearchBar/ReportSearchBar';

const apikey = process.env.REACT_APP_API;

const SCREEN_COLUMNS = [
    { label: 'Do No', key: 'do_no', width: '5%' },
    { label: 'Date', key: 'do_date', width: '8%' },
    { label: 'Quintal', key: 'quantal', width: '7%', numeric: true, isTotal: true },
    { label: 'Mill Rate', key: 'millrate', width: '7%', numeric: true, isTotal: false },
    { label: 'Sale Rate', key: 'salerate', width: '7%', numeric: true, isTotal: false },
    { label: 'Purchase Rate', key: 'PurchaseRate', width: '7%', numeric: true, isTotal: false },
    { label: 'Amount', key: 'amount', width: '8%', numeric: true, isTotal: true },
    { label: 'TDS', key: 'TDS_Amt', width: '6%', numeric: true, isTotal: false },
    { label: 'CGST', key: 'CGSTAmount', width: '6%', numeric: true, isTotal: true },
    { label: 'SGST', key: 'SGSTAmount', width: '6%', numeric: true, isTotal: true },
    { label: 'IGST', key: 'IGSTAmount', width: '6%', numeric: true, isTotal: true },
    { label: 'Bill Amt', key: 'Bill_Amount', width: '8%', numeric: true, isTotal: true },
    { label: 'Net Payable', key: 'TCS_Net_Payable', width: '8%', numeric: true, isTotal: true },
];

const PRINT_COLUMNS = [
    { label: 'Do No', key: 'do_no', printWidth: 20 },
    { label: 'Date', key: 'do_date', printWidth: 25 },
    { label: 'Quintal', key: 'quantal', printWidth: 25, numeric: true, isTotal: true },
    { label: 'Mill Rate', key: 'millrate', printWidth: 25, numeric: true, isTotal: false },
    { label: 'Sale Rate', key: 'salerate', printWidth: 25, numeric: true, isTotal: false },
    { label: 'CGST', key: 'CGSTAmount', printWidth: 25, numeric: true, isTotal: true },
    { label: 'SGST', key: 'SGSTAmount', printWidth: 25, numeric: true, isTotal: true },
    { label: 'IGST', key: 'IGSTAmount', printWidth: 25, numeric: true, isTotal: true },
    { label: 'Bill Amount', key: 'Bill_Amount', printWidth: 30, numeric: true, isTotal: true },
];

const DispatchGradeWise = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const companyCode = sessionStorage.getItem('Company_Code');
    const Year_Code = sessionStorage.getItem('Year_Code');
    const Company_Name = sessionStorage.getItem("Company_Name");
    const Company_GSTNO = sessionStorage.getItem('Company_GSTNO');

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [error, setError] = useState('');
    const [pdfPreview, setPdfPreview] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'do_no', direction: 'asc' });

    const API_URL = `${apikey}/DispatchMillWise`;

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {
                const res = await axios.get(API_URL, {
                    params: { fromDT: fromDate, toDT: toDate, Company_Code: companyCode, Year_Code: Year_Code },
                });
                setReportData(res.data);
            } catch (err) { setError('Error fetching report'); }
            finally { setLoading(false); }
        };
        if (fromDate && toDate) fetchReportData();
    }, [fromDate, toDate, companyCode, Year_Code]);

    const filteredAndSortedData = useMemo(() => {
        let items = [...reportData];
        if (searchTerm) {
            items = items.filter((item) =>
                Object.values(item).some((val) =>
                    String(val).toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }
        if (sortConfig.key) {
            items.sort((a, b) => {
                const va = a[sortConfig.key] || 0;
                const vb = b[sortConfig.key] || 0;
                if (va < vb) return sortConfig.direction === 'asc' ? -1 : 1;
                if (va > vb) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return items;
    }, [reportData, sortConfig, searchTerm]);

    const { groupedData, grandTotals } = useMemo(() => {
        const groups = {};
        const grand = {};
        SCREEN_COLUMNS.filter(c => c.isTotal).forEach(c => grand[c.key] = 0);

        filteredAndSortedData.forEach(item => {
            const key = `${item.purc_no}-${item.grade}`;
            if (!groups[key]) {
                groups[key] = { items: [], totals: {} };
                SCREEN_COLUMNS.filter(c => c.isTotal).forEach(c => groups[key].totals[c.key] = 0);
            }
            groups[key].items.push(item);
            SCREEN_COLUMNS.filter(c => c.isTotal).forEach(c => {
                const val = parseFloat(item[c.key]) || 0;
                groups[key].totals[c.key] += val;
                grand[c.key] += val;
            });
        });
        return { groupedData: groups, grandTotals: grand };
    }, [filteredAndSortedData]);

    const requestSort = (key) =>
        setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));

   const handleGeneratePDF = () => {
        setIsPrinting(true);
        const rows = [];
        
        Object.entries(groupedData).forEach(([grade, group]) => {
            // 1. Add Group Header
            rows.push([{ 
                content: grade, 
                colSpan: PRINT_COLUMNS.length, 
                styles: { fillColor: [240, 240, 240], fontStyle: 'bold' } 
            }]);

            // 2. Add Group Items
            group.items.forEach(item => {
                rows.push(PRINT_COLUMNS.map(col => 
                    col.numeric ? formatReadableAmount(item[col.key]) : item[col.key]
                ));
            });

            // 3. Add Sub Total Row
            rows.push(PRINT_COLUMNS.map(col => {
                if (col.isTotal) {
                    return { 
                        content: formatReadableAmount(group.totals[col.key]), 
                        styles: { halign: 'right', fontStyle: 'bold' } 
                    };
                }
                return col.label === 'Do No' ? { content: 'Total', styles: { fontStyle: 'bold' } } : '';
            }));

            // 4. ADD DOTTED LINE SEPARATOR
            // We create a row that spans all columns and contains a string of dots/dashes
            rows.push([{
                content: '-----------------------------------------------------------------------------------------------------------------------------------',
                colSpan: PRINT_COLUMNS.length,
                styles: { 
                    halign: 'center', 
                    textColor: [150, 150, 150], // Grey color for the line
                    fontSize: 8,
                    cellPadding: 1
                }
            }]);
        });

        generateReportPDF({
            title: 'Dispatch Grade Wise',
            subtitle: `Period: ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`,
            columns: PRINT_COLUMNS.map(c => c.label),
            rows: rows,
            footerRow: PRINT_COLUMNS.map(col => {
                if (col.isTotal) {
                    return { 
                        content: formatReadableAmount(grandTotals[col.key]), 
                        styles: { halign: 'right', fontStyle: 'bold', fillColor: [255, 249, 196] } 
                    };
                }
                return col.label === 'Do No' ? { content: 'GRAND TOTAL', styles: { fontStyle: 'bold', fillColor: [255, 249, 196] } } : '';
            }),
            headerImgSrc: HeaderJK,
            footerImgSrc: FooterJK,
            numericCols: PRINT_COLUMNS.map((c, i) => c.numeric ? i : null).filter(i => i !== null),
            onComplete: (url) => {
                setPdfPreview(url);
                setIsPrinting(false);
            },
        });
    };

    const handleExportToExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [
            [Company_Name?.toUpperCase()],
            [`GST No: ${Company_GSTNO}`],
            [`Dispatch Grade Wise Report`],
            [`Period: ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`],
            [],
            SCREEN_COLUMNS.map(c => c.label)
        ];

        Object.entries(groupedData).forEach(([grade, group]) => {
            wsData.push([grade]);
            group.items.forEach(item => {
                wsData.push(SCREEN_COLUMNS.map(c => c.numeric ? (parseFloat(item[c.key]) || 0) : item[c.key]));
            });
            const subRow = new Array(SCREEN_COLUMNS.length).fill("");
            subRow[0] = "Sub Total:";
            SCREEN_COLUMNS.forEach((c, i) => { if (c.isTotal) subRow[i] = group.totals[c.key]; });
            wsData.push(subRow);
            wsData.push([]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'DispatchGrade');
        XLSX.writeFile(wb, `Dispatch_GradeWise.xlsx`);
    };

    return (
        <Box sx={{ padding: '15px', marginTop: "-80px" }}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ textDecoration: 'underline', fontWeight: 'bold' }}>Dispatch Grade Wise</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Date: {FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }} className="no-print">
                <CommonSearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search records..." />
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <button className="btn btn-danger btn-sm" onClick={handleGeneratePDF} disabled={isPrinting}>
                        {isPrinting ? 'Wait...' : 'Print PDF'}
                    </button>
                    <button className="btn btn-success btn-sm" onClick={handleExportToExcel}>Export Excel</button>
                </Box>
            </Box>

            <TableContainer component={Paper} sx={{ maxHeight: '750px', boxShadow: 5 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {SCREEN_COLUMNS.map(col => (
                                <TableCell key={col.key} align={col.numeric ? 'right' : 'left'} style={{ backgroundColor: '#1a237e', color: '#fff', fontWeight: 'bold' }}>
                                    <TableSortLabel active={sortConfig.key === col.key} direction={sortConfig.direction} onClick={() => requestSort(col.key)} sx={{ '& .MuiTableSortLabel-icon': { color: '#fff !important' }, color: '#fff !important' }}>
                                        {col.label}
                                    </TableSortLabel>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Object.entries(groupedData).map(([grade, group]) => (
                            <React.Fragment key={grade}>
                                <TableRow>
                                    <TableCell colSpan={SCREEN_COLUMNS.length} sx={{ fontWeight: 'bold', backgroundColor: '#e8eaf6', color: '#1a237e' }}>{grade}</TableCell>
                                </TableRow>
                                {group.items.map((item, idx) => (
                                    <TableRow key={idx} hover>
                                        {SCREEN_COLUMNS.map(col => (
                                            <TableCell key={col.key} align={col.numeric ? 'right' : 'left'}>
                                                {col.numeric ? formatReadableAmount(item[col.key]) : item[col.key]}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                    <TableCell colSpan={2} sx={{ fontWeight: 'bold', textAlign: 'right' }}>Sub Total:</TableCell>
                                    {SCREEN_COLUMNS.slice(2).map(col => (
                                        <TableCell key={col.key} align={col.numeric ? 'right' : 'left'} sx={{ fontWeight: 'bold' }}>
                                            {col.isTotal ? formatReadableAmount(group.totals[col.key]) : ''}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </React.Fragment>
                        ))}
                    </TableBody>
                    <TableFooter sx={{ position: 'sticky', bottom: 0, zIndex: 10, backgroundColor: '#fff9c4' }}>
                        <TableRow>
                            <TableCell colSpan={2} sx={{ fontWeight: 'bold', fontSize: '1rem' }}>GRAND TOTAL</TableCell>
                            {SCREEN_COLUMNS.slice(2).map(col => (
                                <TableCell key={col.key} align={col.numeric ? 'right' : 'left'} sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                                    {col.isTotal ? formatReadableAmount(grandTotals[col.key]) : ''}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableFooter>
                </Table>
            </TableContainer>

            {pdfPreview && <PdfPreview pdfData={pdfPreview} label="DispatchGradeWise" />}
            
            {(loading || isPrinting) && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <ScaleLoader color="#1a237e" size={60} />
                        <Typography sx={{ mt: 2, fontWeight: 'bold', color: '#1a237e' }}>
                            {isPrinting ? "Generating PDF..." : "Loading Data..."}
                        </Typography>
                    </Box>
                </div>
            )}
        </Box>
    );
};

export default DispatchGradeWise;