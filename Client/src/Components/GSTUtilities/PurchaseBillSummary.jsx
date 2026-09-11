// import React, { useState } from 'react';
// import axios from 'axios';
// import * as XLSX from 'xlsx';
// import { Button, CircularProgress, Alert } from '@mui/material';
// import { formatReadableAmount } from "../../Common/FormatFunctions/FormatAmount"
// import Swal from 'sweetalert2';

// const API_URL = process.env.REACT_APP_API;

// const PurchaseBillSummary = ({ fromDate, toDate, companyCode, yearCode,accode}) => {
//     const [data, setData] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');
//     const [isDataFetched, setIsDataFetched] = useState(false);

//     const fetchPurchaseBillSummary = async () => {
//         try {
//             setLoading(true);
//             setError('');
//             const response = await axios.get(`${API_URL}/purchasebill-summary`, {
//                 params: {
//                     from_date: fromDate,
//                     to_date: toDate,
//                     Company_Code: companyCode,
//                     Year_Code: yearCode,
//                     accode :accode 
//                 },
//             });
//             if (response.data.length === 0) {
//                 Swal.fire({
//                     icon: 'error',
//                     title: 'Data Not Found.!',
//                     text: 'No purchase bill data found for the selected date range.',
//                 });
//                 return;
//             }
//             setData(response.data);
//             setIsDataFetched(true);
//             openInNewWindow(response.data);
//         } catch (err) {
//             setError('Failed to fetch data');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const openInNewWindow = (data) => {
//         const newWindow = window.open('', '_blank');
//         if (!newWindow) return;

//         const columns = [
//             'SR_No',
//             'OurNo',
//             'MillInvoiceNo',
//             'MillEwayBill_NO',
//             'FromGSTNo',
//             'Party_Code',
//             'Party_Name',
//             'Mill_Name',
//             'FromStateCode',
//             'Date',
//             'Vehicle_No',
//             'Quintal',
//             'Rate',
//             'TaxableAmount',
//             'CGST',
//             'SGST',
//             'IGST',
//             'Payable_Amount',
//             'DO',
//         ];

//         const totals = calculateTotals(data);

//         newWindow.document.write(`
//             <html>
//                 <head>
//                     <title>Purchase Bill Summary</title>
//                     <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
//                             <style>
//                 body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
//                 h2 { text-align: center; margin-top: 0; }
//                 .table-container {
//                     max-height: 500px;
//                     overflow-y: auto;
//                     margin: 20px auto;
//                     width: 90%;
//                 }
//                 table {
//                     width: 100%;
//                     border-collapse: collapse;
//                 }
//                 th, td {
//                     border: 1px solid #ddd;
//                     padding: 6px 8px;
//                     text-align: left;
//                     white-space: nowrap;
//                 }
//                 th {
//                     background-color:rgb(206, 200, 243);
//                     position: sticky;
//                     top: 0;
//                     z-index: 2;
//                     font-weight: bold;
//                     font-size: 20px;
//                     height: 50px;
//                     text-align: center;
//                 }
//                 .export-btn {
//                     padding: 10px 20px;
//                     font-size: 16px;
//                     background-color: green;
//                     color: white;
//                     border: none;
//                     cursor: pointer;
//                     margin-bottom: 20px;
//                     margin-top: 20px;
//                 }
//                 .total-row {
//                     background-color: yellow;
//                     font-weight: bold;
//                 }
//             </style>

//                 </head>
//                 <body>
//                     <h2>Purchase Bill Summary Report</h2>
//                     <button class="export-btn" onclick="window.exportToXlsx()">Export to XLSX</button>
//                     <table>
//                         <thead>
//                             <tr>
//                                 ${columns.map((column) => `<th style="text-align: center;">${column}</th>`).join('')}
//                             </tr>
//                         </thead>
//                         <tbody>
//                             ${data.map(row => {
//                  return `
//                                 <tr>
//                                     ${columns.map(column => {
//                         if (['TaxableAmount', 'CGST', 'SGST', 'IGST', 'Payable_Amount','Quintal','Rate'].includes(column)) {
//                     return `<td style="text-align: right;">${formatReadableAmount(row[column] || 0)}</td>`;
//                       } else {
//                       return `<td>${row[column] || ''}</td>`;
//                       }
//                          }).join('')}
//                                 </tr>`;
//                      }).join('')}
//                         </tbody>
//                         <tfoot>
//                             <tr class="total-row">
//                                 <td colspan="11">Totals</td>
//                                 <td style="text-align: right;">${formatReadableAmount(totals.Quintal.toFixed(2))}</td>
//                                 <td></td>
//                                 <td style="text-align: right;">${formatReadableAmount(totals.TaxableAmount.toFixed(2))}</td>
//                                 <td style="text-align: right;">${formatReadableAmount(totals.CGST.toFixed(2))}</td>
//                                 <td style="text-align: right;">${formatReadableAmount(totals.SGST.toFixed(2))}</td>
//                                 <td style="text-align: right;">${formatReadableAmount(totals.IGST.toFixed(2))}</td>
//                                 <td style="text-align: right;">${formatReadableAmount(totals.Payable_Amount.toFixed(2))}</td>
//                                 <td></td>
//                             </tr>
//                         </tfoot>
//                     </table>
//                      <script>
//                     window.exportToXlsx = function() {
//                     const data = ${JSON.stringify(data)};
//                     const columnOrder = ['SR_No','OurNo','MillInvoiceNo','MillEwayBill_NO','FromGSTNo','Party_Code','Party_Name','Mill_Name',
//                     'FromStateCode','Date','Vehicle_No','Quintal','Rate','TaxableAmount','CGST','SGST','IGST','Payable_Amount','DO'];

//                     const formattedData = data.map(row => {
//                         return {
//                             ...row,
//                             TaxableAmount: parseFloat(row.TaxableAmount || 0),
//                             CGST: parseFloat(row.CGST || 0),
//                             SGST: parseFloat(row.SGST || 0),
//                             IGST: parseFloat(row.IGST || 0),
//                             Payable_Amount: parseFloat(row.Payable_Amount || 0),
//                             Quintal: parseFloat(row.Quintal || 0),
//                             Rate: parseFloat(row.Rate || 0)
//                         };
//                     });

//                     const totals = formattedData.reduce((acc, row) => {
//                         acc.Quintal += row.Quintal || 0;
//                         acc.TaxableAmount += row.TaxableAmount || 0;
//                         acc.CGST += row.CGST || 0;
//                         acc.SGST += row.SGST || 0;
//                         acc.IGST += row.IGST || 0;
//                         acc.Payable_Amount += row.Payable_Amount || 0;
//                         return acc;
//                     }, {
//                         Quintal: 0,
//                         TaxableAmount: 0,
//                         CGST: 0,
//                         SGST: 0,
//                         IGST: 0,
//                         Payable_Amount: 0
//                     });

//                     formattedData.push({
//                         SR_No: 'Totals',
//                         Quintal: totals.Quintal.toFixed(2),
//                         TaxableAmount: totals.TaxableAmount.toFixed(2),
//                         CGST: totals.CGST.toFixed(2),
//                         SGST: totals.SGST.toFixed(2),
//                         IGST: totals.IGST.toFixed(2),
//                         Payable_Amount: totals.Payable_Amount.toFixed(2)
//                     });

//                     const ws = XLSX.utils.json_to_sheet(formattedData, { header: columnOrder, skipHeader: false });
//                     const wb = XLSX.utils.book_new();
//                     XLSX.utils.book_append_sheet(wb, ws, 'PurchaseBillSummary');

//                     XLSX.writeFile(wb, 'PurchaseBillSummary.xlsx');
//                 };

//                 </script>
//                 </body>
//             </html>
//         `);

//         newWindow.document.close();
//     };

//     const calculateTotals = (data) => {
//         let totals = {
//             Quintal: 0,
//             TaxableAmount: 0,
//             CGST: 0,
//             SGST: 0,
//             IGST: 0,
//             Payable_Amount: 0,
//         };

//         data.forEach(row => {
//             totals.Quintal += parseFloat(row.Quintal || 0);
//             totals.TaxableAmount += parseFloat(row.TaxableAmount || 0);
//             totals.CGST += parseFloat(row.CGST || 0);
//             totals.SGST += parseFloat(row.SGST || 0);
//             totals.IGST += parseFloat(row.IGST || 0);
//             totals.Payable_Amount += parseFloat(row.Payable_Amount || 0);
//         });

//         return totals;
//     };

//     return (
//         <div style={{ textAlign: 'center', marginTop: '5px' }}>
//             <Button
//                 variant="contained"
//                 color="primary"
//                 onClick={fetchPurchaseBillSummary}
//                 disabled={loading}
//                 style={{
//                     width: '20%',  
//                     height: '60px',  
//                 }}
//             >
//                 {loading ? <CircularProgress size={24} color="inherit" /> : 'Purchase Bill Summary'}
//             </Button>

//             {error && <Alert severity="error" sx={{ marginTop: 2 }}>{error}</Alert>}
//         </div>
//     );
// };

// export default PurchaseBillSummary;




















// import React, { useState, useMemo } from 'react';
// import axios from 'axios';
// import * as XLSX from 'xlsx';
// import { CircularProgress, Alert } from '@mui/material';
// import { formatReadableAmount } from "../../Common/FormatFunctions/FormatAmount";
// import { FormaDateBalanceSheet } from '../../Common/FormatFunctions/FormatDate';
// import { generateReportPDF } from '../../Common/ReportCommon/CommonPDFGenerator';
// import PdfPreview from '../../Common/PDFPreview';
// import Swal from 'sweetalert2';
// import { ScaleLoader } from 'react-spinners';
// import HeaderJK from '../../Assets/HeaderJK.png';
// import FooterJK from '../../Assets/FooterJK.png';

// const API_URL = process.env.REACT_APP_API;

// // ─── Column Definitions ──────────────────────────────────────────────────────

// const SCREEN_COLUMNS = [
//     { label: 'SR No',          key: 'SR_No',           numeric: false, isTotal: false, width: '5%' },
//     { label: 'Our No',         key: 'OurNo',           numeric: false, isTotal: false, width: '7%' },
//     { label: 'Invoice No',     key: 'MillInvoiceNo',   numeric: false, isTotal: false, width: '9%' },
//     { label: 'Eway Bill',      key: 'MillEwayBill_NO', numeric: false, isTotal: false, width: '9%' },
//     { label: 'GST No',         key: 'FromGSTNo',       numeric: false, isTotal: false, width: '10%' },
//     { label: 'Party Code',     key: 'Party_Code',      numeric: false, isTotal: false, width: '6%' },
//     { label: 'Party Name',     key: 'Party_Name',      numeric: false, isTotal: false, width: '12%' },
//     { label: 'Mill Name',      key: 'Mill_Name',       numeric: false, isTotal: false, width: '10%' },
//     { label: 'State',          key: 'FromStateCode',   numeric: false, isTotal: false, width: '5%' },
//     { label: 'Date',           key: 'Date',            numeric: false, isTotal: false, width: '7%' },
//     { label: 'Vehicle No',     key: 'Vehicle_No',      numeric: false, isTotal: false, width: '7%' },
//     { label: 'Quintal',        key: 'Quintal',         numeric: true,  isTotal: true,  width: '6%' },
//     { label: 'Rate',           key: 'Rate',            numeric: true,  isTotal: false, width: '5%' },
//     { label: 'Taxable Amt',    key: 'TaxableAmount',   numeric: true,  isTotal: true,  width: '7%' },
//     { label: 'CGST',           key: 'CGST',            numeric: true,  isTotal: true,  width: '5%' },
//     { label: 'SGST',           key: 'SGST',            numeric: true,  isTotal: true,  width: '5%' },
//     { label: 'IGST',           key: 'IGST',            numeric: true,  isTotal: true,  width: '5%' },
//     { label: 'Payable Amt',    key: 'Payable_Amount',  numeric: true,  isTotal: true,  width: '7%' },
//     { label: 'DO',             key: 'DO',              numeric: false, isTotal: false, width: '5%' },
// ];

// // Limited columns for PDF print — only 7 key columns
// const PRINT_COLUMNS = [
//     { label: 'SR No',       key: 'SR_No',          printWidth: 18 },
//     { label: 'Party Name',  key: 'Party_Name',     printWidth: 50 },
//     { label: 'Mill Name',   key: 'Mill_Name',      printWidth: 45 },
//     { label: 'Date',        key: 'Date',           printWidth: 25 },
//     { label: 'Quintal',     key: 'Quintal',        printWidth: 22, numeric: true, isTotal: true },
//     { label: 'Taxable Amt', key: 'TaxableAmount',  printWidth: 32, numeric: true, isTotal: true },
//     { label: 'Payable Amt', key: 'Payable_Amount', printWidth: 32, numeric: true, isTotal: true },
// ];

// // ─── Component ────────────────────────────────────────────────────────────────

// const PurchaseBillSummary = ({ fromDate, toDate, companyCode, yearCode, accode }) => {
//     const [data, setData]               = useState([]);
//     const [loading, setLoading]         = useState(false);
//     const [isPrinting, setIsPrinting]   = useState(false);
//     const [error, setError]             = useState('');
//     const [isDataFetched, setIsDataFetched] = useState(false);
//     const [searchTerm, setSearchTerm]   = useState('');
//     const [sortConfig, setSortConfig]   = useState({ key: 'SR_No', direction: 'asc' });
//     const [pdfPreview, setPdfPreview]   = useState(null);

//     // ── Fetch ──────────────────────────────────────────────────────────────────
//     const fetchPurchaseBillSummary = async () => {
//         try {
//             setLoading(true);
//             setError('');
//             setIsDataFetched(false);
//             setPdfPreview(null);
//             const response = await axios.get(`${API_URL}/purchasebill-summary`, {
//                 params: {
//                     from_date: fromDate,
//                     to_date: toDate,
//                     Company_Code: companyCode,
//                     Year_Code: yearCode,
//                     accode,
//                 },
//             });
//             if (!response.data || response.data.length === 0) {
//                 Swal.fire({
//                     icon: 'error',
//                     title: 'Data Not Found!',
//                     text: 'No purchase bill data found for the selected date range.',
//                 });
//                 return;
//             }
//             setData(response.data);
//             openInNewWindow(response.data);
//         } catch (err) {
//             setError('Failed to fetch data. Please try again.');
//         } finally {
//             setLoading(false);
//         }
//     };

//     // ── Sort ───────────────────────────────────────────────────────────────────
//     const requestSort = (key) => {
//         setSortConfig(prev => ({
//             key,
//             direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
//         }));
//     };

//     // ── Filtered + Sorted Data ────────────────────────────────────────────────
//     const displayData = useMemo(() => {
//         let items = [...data];
//         if (searchTerm) {
//             items = items.filter(row =>
//                 Object.values(row).some(val =>
//                     String(val).toLowerCase().includes(searchTerm.toLowerCase())
//                 )
//             );
//         }
//         if (sortConfig.key) {
//             items.sort((a, b) => {
//                 const isNum = SCREEN_COLUMNS.find(c => c.key === sortConfig.key)?.numeric;
//                 const va = isNum ? parseFloat(a[sortConfig.key] || 0) : String(a[sortConfig.key] || '');
//                 const vb = isNum ? parseFloat(b[sortConfig.key] || 0) : String(b[sortConfig.key] || '');
//                 if (va < vb) return sortConfig.direction === 'asc' ? -1 : 1;
//                 if (va > vb) return sortConfig.direction === 'asc' ? 1 : -1;
//                 return 0;
//             });
//         }
//         return items;
//     }, [data, searchTerm, sortConfig]);

//     // ── Totals ─────────────────────────────────────────────────────────────────
//     const grandTotals = useMemo(() => {
//         const t = { Quintal: 0, TaxableAmount: 0, CGST: 0, SGST: 0, IGST: 0, Payable_Amount: 0 };
//         displayData.forEach(row => {
//             Object.keys(t).forEach(k => { t[k] += parseFloat(row[k] || 0); });
//         });
//         return t;
//     }, [displayData]);

//     // ── PDF Generation (mirrors TransportAcRegister pattern) ──────────────────
//   // ── PDF Generation (TransportAcRegister Pattern) ──────────────────
//     const handleGeneratePDF = () => {
//         if (displayData.length === 0) {
//             Swal.fire('No Data', 'No data available to print', 'info');
//             return;
//         }

//         setIsPrinting(true);

//         // 1. Prepare the Body Rows based on PRINT_COLUMNS
//         const rows = displayData.map((row) =>
//             PRINT_COLUMNS.map((col) => {
//                 const value = row[col.key];
//                 if (col.numeric) {
//                     return formatReadableAmount(value || 0);
//                 }
//                 // Format Date if the column is 'Date'
//                 if (col.key === 'Date' || col.key === 'doc_date') {
//                     return value ? FormaDateBalanceSheet(value) : '';
//                 }
//                 return value || '';
//             })
//         );

//         // 2. Prepare the Footer Row (Grand Totals)
//         const footerRow = PRINT_COLUMNS.map((col) => {
//             if (col.isTotal) {
//                 return {
//                     content: formatReadableAmount(grandTotals[col.key] || 0),
//                     styles: { halign: 'right', fontStyle: 'bold', fillColor: [255, 249, 196] },
//                 };
//             }
//             if (col.key === 'SR_No' || col.label === 'SR No') {
//                 return {
//                     content: 'GRAND TOTAL',
//                     styles: { fontStyle: 'bold', fillColor: [255, 249, 196] },
//                 };
//             }
//             return '';
//         });

//         // 3. Call the Common PDF Generator
//         generateReportPDF({
//             title: 'Purchase Bill Summary Report',
//             subtitle: `${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`,
//             columns: PRINT_COLUMNS.map((c) => c.label),
//             rows: rows,
//             footerRow: footerRow,
//             headerImgSrc: HeaderJK,
//             footerImgSrc: FooterJK,
//             // Pass column indices that should be right-aligned in PDF
//             numericCols: PRINT_COLUMNS.map((c, i) => (c.numeric ? i : null)).filter((i) => i !== null),
//             orientation: 'landscape', // Better for wide reports
//             onComplete: (url) => {
//                 setPdfPreview(url);
//                 setIsPrinting(false);
//             },
//         });
//     };

//     // ── Open in New Window ─────────────────────────────────────────────────────
//     const openInNewWindow = (reportData) => {
//         const newWindow = window.open('', '_blank');
//         if (!newWindow) return;

//         const totals = { Quintal: 0, TaxableAmount: 0, CGST: 0, SGST: 0, IGST: 0, Payable_Amount: 0 };
//         reportData.forEach(row => {
//             Object.keys(totals).forEach(k => { totals[k] += parseFloat(row[k] || 0); });
//         });

//         const numericKeys = ['Quintal', 'Rate', 'TaxableAmount', 'CGST', 'SGST', 'IGST', 'Payable_Amount'];
//         const totalKeys   = ['Quintal', 'TaxableAmount', 'CGST', 'SGST', 'IGST', 'Payable_Amount'];

//         const colDefs = SCREEN_COLUMNS;

//         newWindow.document.write(`<!DOCTYPE html>
// <html><head><title>Purchase Bill Summary</title>
// <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
// <style>
//   *{box-sizing:border-box;margin:0;padding:0}
//   body{font-family:'Segoe UI',sans-serif;padding:20px;background:#f0f2ff}
//   h2{text-align:center;color:#1a237e;margin-bottom:4px;font-size:20px}
//   .sub{text-align:center;color:#5c6bc0;font-size:13px;margin-bottom:14px}
//   .toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px}
//   .search{border:1px solid #c5cae9;border-radius:6px;padding:7px 12px;font-size:13px;width:240px;outline:none}
//   .btn{padding:7px 16px;border-radius:6px;border:none;font-size:13px;font-weight:600;cursor:pointer;color:#fff}
//   .btn-green{background:#2e7d32}.btn-red{background:#c62828}
//   .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:12px}
//   .card{background:#fff;border:1px solid #c5cae9;border-radius:8px;padding:8px 10px;text-align:center}
//   .card-label{font-size:10px;color:#5c6bc0;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
//   .card-value{font-size:14px;font-weight:700;color:#1a237e;margin-top:2px}
//   .wrap{max-height:550px;overflow:auto;border:1px solid #c5cae9;border-radius:8px;box-shadow:0 4px 18px rgba(26,35,126,.1)}
//   table{width:100%;border-collapse:collapse;font-size:12px;min-width:1400px}
//   th{background:#1a237e;color:#fff;padding:9px 7px;white-space:nowrap;cursor:pointer;user-select:none;border-right:1px solid rgba(255,255,255,.12);position:sticky;top:0;z-index:2}
//   th.num{text-align:right}th.txt{text-align:left}
//   td{padding:6px 7px;border-bottom:1px solid #e8eaf6;white-space:nowrap}
//   td.num{text-align:right}td.txt{text-align:left}
//   tr:nth-child(even) td{background:#f7f8fd}
//   tr:hover td{background:#e8eaf6!important}
//   tfoot tr td{background:#fff9c4;font-weight:700;border-top:2px solid #fbc02d;position:sticky;bottom:0}
//   .sort-icon{margin-left:4px;font-size:10px;opacity:.5}
//   .sort-icon.active{opacity:1}
// </style></head><body>
// <h2>Purchase Bill Summary Report</h2>
// <div class="sub">Period: ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}</div>

// <div class="cards" id="cards"></div>

// <div class="toolbar">
//   <input class="search" id="searchBox" placeholder="🔍 Search records..." oninput="filterTable()">
//   <div style="display:flex;gap:8px">
//     <button class="btn btn-red" onclick="printPDF()">🖨 Print</button>
//     <button class="btn btn-green" onclick="exportXlsx()">⬇ Export Excel</button>
//   </div>
// </div>

// <div class="wrap"><table id="tbl">
//   <thead><tr id="hdr"></tr></thead>
//   <tbody id="tbody"></tbody>
//   <tfoot><tr id="tfoot"></tr></tfoot>
// </table></div>

// <script>
// const RAW = ${JSON.stringify(reportData)};
// const COLS = ${JSON.stringify(colDefs)};
// const NUMERIC_KEYS = ${JSON.stringify(numericKeys)};
// const TOTAL_KEYS   = ${JSON.stringify(totalKeys)};
// const TOTALS       = ${JSON.stringify(totals)};

// let sortKey = 'SR_No', sortDir = 'asc';
// let filtered = [...RAW];

// function fmt(v){ return v == null || v === '' ? '' : Number(v).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2}); }

// function buildCards(data){
//   const card = (label,val) => \`<div class="card"><div class="card-label">\${label}</div><div class="card-value">\${val}</div></div>\`;
//   const sum = k => data.reduce((a,r)=>a+parseFloat(r[k]||0),0);
//   document.getElementById('cards').innerHTML =
//     card('Records',data.length)+
//     card('Quintal',fmt(sum('Quintal')))+
//     card('Taxable',fmt(sum('TaxableAmount')))+
//     card('CGST',fmt(sum('CGST')))+
//     card('SGST',fmt(sum('SGST')))+
//     card('IGST',fmt(sum('IGST')))+
//     card('Payable',fmt(sum('Payable_Amount')));
// }

// function buildHeader(){
//   const tr = document.getElementById('hdr');
//   tr.innerHTML = COLS.map(c=>\`<th class="\${c.numeric?'num':'txt'}" onclick="sortBy('\${c.key}')">\${c.label} <span class="sort-icon" id="si_\${c.key}">⇅</span></th>\`).join('');
// }

// function buildBody(data){
//   document.getElementById('tbody').innerHTML = data.length===0
//     ? \`<tr><td colspan="\${COLS.length}" style="text-align:center;padding:32px;color:#9e9e9e">No records found.</td></tr>\`
//     : data.map(row=>\`<tr>\${COLS.map(c=>\`<td class="\${c.numeric?'num':'txt'}">\${c.numeric?fmt(row[c.key]||0):(row[c.key]||'')}</td>\`).join('')}</tr>\`).join('');
// }

// function buildFooter(data){
//   const sum = k => data.reduce((a,r)=>a+parseFloat(r[k]||0),0);
//   document.getElementById('tfoot').innerHTML = COLS.map((c,i)=>\`<td class="\${c.numeric?'num':'txt'}">\${i===0?'GRAND TOTAL':c.isTotal?fmt(sum(c.key)):''}</td>\`).join('');
// }

// function render(data){ buildCards(data); buildBody(data); buildFooter(data); }

// function filterTable(){
//   const q = document.getElementById('searchBox').value.toLowerCase();
//   filtered = q ? RAW.filter(r=>Object.values(r).some(v=>String(v).toLowerCase().includes(q))) : [...RAW];
//   applySort();
// }

// function sortBy(key){
//   if(sortKey===key) sortDir = sortDir==='asc'?'desc':'asc'; else{ sortKey=key; sortDir='asc'; }
//   document.querySelectorAll('.sort-icon').forEach(el=>{ el.textContent='⇅'; el.classList.remove('active'); });
//   const si = document.getElementById('si_'+key);
//   if(si){ si.textContent = sortDir==='asc'?'↑':'↓'; si.classList.add('active'); }
//   applySort();
// }

// function applySort(){
//   const isNum = COLS.find(c=>c.key===sortKey)?.numeric;
//   filtered.sort((a,b)=>{
//     const va = isNum?parseFloat(a[sortKey]||0):String(a[sortKey]||'');
//     const vb = isNum?parseFloat(b[sortKey]||0):String(b[sortKey]||'');
//     return va<vb?(sortDir==='asc'?-1:1):va>vb?(sortDir==='asc'?1:-1):0;
//   });
//   render(filtered);
// }

// function exportXlsx(){
//   const wb = XLSX.utils.book_new();
//   const headers = COLS.map(c=>c.label);
//   const rows = filtered.map(row=>COLS.map(c=>c.numeric?parseFloat(row[c.key]||0):(row[c.key]||'')));
//   const sumRow = COLS.map((c,i)=>{
//     if(i===0) return 'GRAND TOTAL';
//     if(c.isTotal) return parseFloat(filtered.reduce((a,r)=>a+parseFloat(r[c.key]||0),0).toFixed(2));
//     return '';
//   });

//   const wsData = [
//     ['Purchase Bill Summary Report'],
//     ['Period: ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}'],
//     [],
//     headers,
//     ...rows,
//     [],
//     sumRow,
//   ];

//   const ws = XLSX.utils.aoa_to_sheet(wsData);

//   // Right-align numeric columns
//   const numericColIdxs = COLS.map((c,i)=>c.numeric?i:null).filter(i=>i!==null);
//   const dataStartRow = 4; // 0-based: rows 0-2 are header, 3 is blank, 4 is col headers
//   const totalRows = wsData.length;

//   for(let r = dataStartRow; r < totalRows; r++){
//     numericColIdxs.forEach(ci=>{
//       const cellRef = XLSX.utils.encode_cell({r, c: ci});
//       if(ws[cellRef]){
//         ws[cellRef].s = { alignment: { horizontal: 'right' } };
//       }
//     });
//   }

//   // Set column widths
//   ws['!cols'] = COLS.map(c=>({ wch: c.numeric ? 16 : (c.key==='Party_Name'||c.key==='Mill_Name'?28:14) }));

//   XLSX.utils.book_append_sheet(wb, ws, 'PurchaseBillSummary');
//   XLSX.writeFile(wb, 'PurchaseBillSummary.xlsx');
// }

// function printPDF(){ window.print(); }

// buildHeader();
// render(RAW);
// <\/script>
// </body></html>`);
//         newWindow.document.close();
//     };

//     // ── Excel Export (from main window, same right-align logic) ───────────────
//     const handleExportToExcel = () => {
//         const wb = XLSX.utils.book_new();
//         const numericColIdxs = SCREEN_COLUMNS.map((c, i) => c.numeric ? i : null).filter(i => i !== null);

//         const headerRow   = SCREEN_COLUMNS.map(c => c.label);
//         const dataRows    = displayData.map(row => SCREEN_COLUMNS.map(c => c.numeric ? parseFloat(row[c.key] || 0) : (row[c.key] || '')));
//         const totalRow    = SCREEN_COLUMNS.map((c, i) => {
//             if (i === 0) return 'GRAND TOTAL';
//             if (c.isTotal) return parseFloat(grandTotals[c.key].toFixed(2));
//             return '';
//         });

//         const wsData = [
//             ['Purchase Bill Summary Report'],
//             [`Period: ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`],
//             [],
//             headerRow,
//             ...dataRows,
//             [],
//             totalRow,
//         ];

//         const ws = XLSX.utils.aoa_to_sheet(wsData);

//         // Right-align all numeric data cells (rows 4 onward = data + total)
//         const dataStartRow = 3; // 0-based row index of header row
//         for (let r = dataStartRow; r < wsData.length; r++) {
//             numericColIdxs.forEach(ci => {
//                 const cellRef = XLSX.utils.encode_cell({ r, c: ci });
//                 if (ws[cellRef]) {
//                     ws[cellRef].s = { alignment: { horizontal: 'right' } };
//                 }
//             });
//         }

//         // Column widths
//         ws['!cols'] = SCREEN_COLUMNS.map(c => ({
//             wch: c.numeric ? 16 : (['Party_Name', 'Mill_Name', 'FromGSTNo'].includes(c.key) ? 28 : 14),
//         }));

//         XLSX.utils.book_append_sheet(wb, ws, 'PurchaseBillSummary');
//         XLSX.writeFile(wb, 'PurchaseBillSummary.xlsx');
//     };

//     // ── Sort Icon helper ───────────────────────────────────────────────────────
//     const SortIcon = ({ colKey }) => {
//         if (sortConfig.key !== colKey) return <span style={{ opacity: 0.35, marginLeft: 4, fontSize: 10 }}>⇅</span>;
//         return <span style={{ marginLeft: 4, fontSize: 10 }}>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
//     };

//     // ── Styles ─────────────────────────────────────────────────────────────────
//     const styles = {
//         wrapper: {
//             fontFamily: "'Segoe UI', system-ui, sans-serif",
//             padding: '16px',
//         },
//         triggerSection: {
//             textAlign: 'center',
//             marginBottom: '16px',
//         },
//         fetchBtn: {
//             background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
//             color: '#fff',
//             border: 'none',
//             borderRadius: '8px',
//             padding: '12px 32px',
//             fontSize: '15px',
//             fontWeight: 600,
//             cursor: 'pointer',
//             boxShadow: '0 4px 14px rgba(26,35,126,0.3)',
//             transition: 'all 0.2s',
//             minWidth: '220px',
//             height: '50px',
//             display: 'inline-flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             gap: '8px',
//         },
//         // ─ Toolbar ─
//         toolbar: {
//             display: 'flex',
//             justifyContent: 'space-between',
//             alignItems: 'center',
//             marginBottom: '10px',
//             flexWrap: 'wrap',
//             gap: '8px',
//         },
//         searchInput: {
//             border: '1px solid #c5cae9',
//             borderRadius: '6px',
//             padding: '7px 12px',
//             fontSize: '13px',
//             width: '260px',
//             outline: 'none',
//         },
//         actionBtns: { display: 'flex', gap: '8px' },
//         btn: (color) => ({
//             padding: '7px 16px',
//             borderRadius: '6px',
//             border: 'none',
//             fontSize: '13px',
//             fontWeight: 600,
//             cursor: 'pointer',
//             background: color === 'red' ? '#c62828' : color === 'green' ? '#2e7d32' : '#1565c0',
//             color: '#fff',
//             transition: 'opacity .15s',
//         }),
//         // ─ Summary cards ─
//         summaryGrid: {
//             display: 'grid',
//             gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
//             gap: '10px',
//             marginBottom: '14px',
//         },
//         card: {
//             background: '#f3f4fd',
//             border: '1px solid #c5cae9',
//             borderRadius: '8px',
//             padding: '10px 12px',
//             textAlign: 'center',
//         },
//         cardLabel: { fontSize: '11px', color: '#5c6bc0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' },
//         cardValue: { fontSize: '16px', fontWeight: 700, color: '#1a237e', marginTop: '2px' },
//         // ─ Table ─
//         tableContainer: {
//             maxHeight: '520px',
//             overflowY: 'auto',
//             overflowX: 'auto',
//             border: '1px solid #c5cae9',
//             borderRadius: '8px',
//             boxShadow: '0 4px 18px rgba(26,35,126,0.10)',
//         },
//         table: {
//             width: '100%',
//             borderCollapse: 'collapse',
//             fontSize: '12.5px',
//             minWidth: '1400px',
//         },
//         th: (numeric) => ({
//             background: '#1a237e',
//             color: '#fff',
//             fontWeight: 600,
//             padding: '9px 8px',
//             textAlign: numeric ? 'right' : 'left',
//             whiteSpace: 'nowrap',
//             cursor: 'pointer',
//             userSelect: 'none',
//             borderRight: '1px solid rgba(255,255,255,0.12)',
//             position: 'sticky',
//             top: 0,
//             zIndex: 2,
//         }),
//         tdBase: (numeric, idx) => ({
//             padding: '7px 8px',
//             textAlign: numeric ? 'right' : 'left',
//             whiteSpace: 'nowrap',
//             borderBottom: '1px solid #e8eaf6',
//             background: idx % 2 === 0 ? '#fff' : '#f7f8fd',
//         }),
//         tfootTd: (numeric) => ({
//             padding: '8px 8px',
//             textAlign: numeric ? 'right' : 'left',
//             fontWeight: 700,
//             background: '#fff9c4',
//             borderTop: '2px solid #fbc02d',
//             fontSize: '12.5px',
//             position: 'sticky',
//             bottom: 0,
//         }),
//         // ─ Full-screen overlay ─
//         overlay: {
//             position: 'fixed',
//             top: 0, left: 0,
//             width: '100vw', height: '100vh',
//             background: 'rgba(255,255,255,0.75)',
//             zIndex: 9999,
//             display: 'flex',
//             flexDirection: 'column',
//             justifyContent: 'center',
//             alignItems: 'center',
//             gap: '12px',
//         },
//         overlayText: { fontWeight: 700, color: '#1a237e', fontSize: '15px' },
//         badge: {
//             background: '#e8eaf6',
//             color: '#1a237e',
//             borderRadius: '12px',
//             padding: '2px 10px',
//             fontSize: '12px',
//             fontWeight: 600,
//         },
//     };

//     // ── Render ─────────────────────────────────────────────────────────────────
//     return (
//         <div style={styles.wrapper}>

//             {/* ── Fetch Button — always visible ── */}
//             <div style={styles.triggerSection}>
//                 <button
//                     style={styles.fetchBtn}
//                     onClick={fetchPurchaseBillSummary}
//                     disabled={loading}
//                     onMouseOver={e => e.currentTarget.style.opacity = '0.88'}
//                     onMouseOut={e => e.currentTarget.style.opacity = '1'}
//                 >
//                     {loading
//                         ? <CircularProgress size={20} color="inherit" />
//                         : <>📋 Purchase Bill Summary</>
//                     }
//                 </button>
//                 {error && <Alert severity="error" sx={{ mt: 2, maxWidth: 400, mx: 'auto' }}>{error}</Alert>}
//             </div>

//             {/* ── Loading / Printing Overlay ── */}
//             {(loading || isPrinting) && (
//                 <div style={styles.overlay}>
//                     <ScaleLoader color="#1a237e" height={40} />
//                     <p style={styles.overlayText}>
//                         {isPrinting ? 'Generating PDF…' : 'Loading data…'}
//                     </p>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default PurchaseBillSummary;






import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { CircularProgress, Alert, Typography } from '@mui/material';
import { formatReadableAmount } from "../../Common/FormatFunctions/FormatAmount";
import { FormaDateBalanceSheet } from '../../Common/FormatFunctions/FormatDate';
import { generateReportPDF } from '../../Common/ReportCommon/CommonPDFGenerator';
import PdfPreview from '../../Common/PDFPreview';
import Swal from 'sweetalert2';
import { ScaleLoader } from 'react-spinners';
import HeaderJK from '../../Assets/HeaderJK.png';
import FooterJK from '../../Assets/FooterJK.png';

const API_URL = process.env.REACT_APP_API;

// ─── Column Definitions ──────────────────────────────────────────────────────
const SCREEN_COLUMNS = [
    { label: 'SR No', key: 'SR_No', numeric: false, isTotal: false, width: '5%' },
    { label: 'Our No', key: 'OurNo', numeric: false, isTotal: false, width: '7%' },
    { label: 'Invoice No', key: 'MillInvoiceNo', numeric: false, isTotal: false, width: '9%' },
    { label: 'Eway Bill', key: 'MillEwayBill_NO', numeric: false, isTotal: false, width: '9%' },
    { label: 'GST No', key: 'FromGSTNo', numeric: false, isTotal: false, width: '10%' },
    { label: 'Party Code', key: 'Party_Code', numeric: false, isTotal: false, width: '6%' },
    { label: 'Party Name', key: 'Party_Name', numeric: false, isTotal: false, width: '12%' },
    { label: 'Mill Name', key: 'Mill_Name', numeric: false, isTotal: false, width: '10%' },
    { label: 'State', key: 'FromStateCode', numeric: false, isTotal: false, width: '5%' },
    { label: 'Date', key: 'Date', numeric: false, isTotal: false, width: '7%' },
    { label: 'Vehicle No', key: 'Vehicle_No', numeric: false, isTotal: false, width: '7%' },
    { label: 'Quintal', key: 'Quintal', numeric: true, isTotal: true, width: '6%' },
    { label: 'Rate', key: 'Rate', numeric: true, isTotal: false, width: '5%' },
    { label: 'Taxable Amount', key: 'TaxableAmount', numeric: true, isTotal: true, width: '7%' },
    { label: 'CGST', key: 'CGST', numeric: true, isTotal: true, width: '5%' },
    { label: 'SGST', key: 'SGST', numeric: true, isTotal: true, width: '5%' },
    { label: 'IGST', key: 'IGST', numeric: true, isTotal: true, width: '5%' },
    { label: 'Payable Amount', key: 'Payable_Amount', numeric: true, isTotal: true, width: '7%' },
    { label: 'DO No', key: 'DO', numeric: false, isTotal: false, width: '5%' },
];

const PRINT_COLUMNS = [
    { label: 'SR No', key: 'SR_No', printWidth: 18 },
    { label: 'Party Name', key: 'Party_Name', printWidth: 50 },
    { label: 'Mill Name', key: 'Mill_Name', printWidth: 45 },
    { label: 'Date', key: 'Date', printWidth: 25 },
    { label: 'Quintal', key: 'Quintal', printWidth: 22, numeric: true, isTotal: true },
    { label: 'Rate', key: 'Rate', printWidth: 22, numeric: true },
    { label: 'Taxable Amount', key: 'TaxableAmount', printWidth: 32, numeric: true, isTotal: true },
    { label: 'Payable Amount', key: 'Payable_Amount', printWidth: 32, numeric: true, isTotal: true },
];

const PurchaseBillSummary = ({ fromDate, toDate, companyCode, yearCode, accode }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [error, setError] = useState('');
    const [pdfPreview, setPdfPreview] = useState(null);

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data === 'TRIGGER_PREMIUM_PRINT') {
                handleGeneratePDF();
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [data]);

    const grandTotals = useMemo(() => {
        const t = { Quintal: 0, TaxableAmount: 0, CGST: 0, SGST: 0, IGST: 0, Payable_Amount: 0 };
        data.forEach(row => {
            Object.keys(t).forEach(k => { t[k] += parseFloat(row[k] || 0); });
        });
        return t;
    }, [data]);

    const fetchPurchaseBillSummary = async () => {
        try {
            setLoading(true);
            setError('');
            setPdfPreview(null);
            const response = await axios.get(`${API_URL}/purchasebill-summary`, {
                params: {
                    from_date: fromDate,
                    to_date: toDate,
                    Company_Code: companyCode,
                    Year_Code: yearCode,
                    accode,
                },
            });
            if (!response.data || response.data.length === 0) {
                Swal.fire({ icon: 'error', title: 'Data Not Found!', text: 'No records found.' });
                return;
            }
            setData(response.data);
            openInNewWindow(response.data);
        } catch (err) {
            setError('Failed to fetch data.');
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePDF = () => {
        if (data.length === 0) return;
        setIsPrinting(true);
        const rows = data.map(row => PRINT_COLUMNS.map(col => col.numeric ? formatReadableAmount(row[col.key] || 0) : (row[col.key] || '')));
        const footerRow = PRINT_COLUMNS.map(col => {
            if (col.isTotal) return { content: formatReadableAmount(grandTotals[col.key] || 0), styles: { halign: 'right', fontStyle: 'bold', fillColor: [255, 249, 196] } };
            return col.label === 'SR No' ? { content: 'GRAND TOTAL', styles: { fontStyle: 'bold', fillColor: [255, 249, 196] } } : '';
        });

        generateReportPDF({
            title: 'Purchase Bill Summary',
            subtitle: `${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`,
            columns: PRINT_COLUMNS.map(c => c.label),
            rows, footerRow, headerImgSrc: HeaderJK, footerImgSrc: FooterJK,
            numericCols: PRINT_COLUMNS.map((c, i) => c.numeric ? i : null).filter(i => i !== null),
            orientation: 'landscape',
            onComplete: (url) => { setPdfPreview(url); setIsPrinting(false); },
        });
    };

    const openInNewWindow = (reportData) => {
        const newWindow = window.open('', '_blank');
        if (!newWindow) return;

        newWindow.document.write(`<!DOCTYPE html>
<html><head><title>Purchase Bill Summary</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',sans-serif;padding:20px;background:#f0f2ff}
  h2{text-align:center;color:#1a237e;margin-bottom:4px;font-size:20px}
  .sub{text-align:center; color: #000000;font-size:13px;margin-bottom:14px}
  .toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:8px}
  .search{border:1px solid #c5cae9;border-radius:6px;padding:7px 12px;font-size:13px;width:300px;outline:none}
  .btn{padding:7px 16px;border-radius:6px;border:none;font-size:13px;font-weight:600;cursor:pointer;color:#fff;transition:0.2s}
  .btn:active{transform:scale(0.96)}
  .btn-green{background:#2e7d32}.btn-red{background:#c62828}
  .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:12px}
  .card{background:#fff;border:1px solid #c5cae9;border-radius:8px;padding:8px 10px;text-align:center}
  .card-label{font-size:10px;color:#5c6bc0;font-weight:600;text-transform:uppercase}
  .card-value{font-size:14px;font-weight:700;color:#1a237e}
  .wrap{max-height:750px;overflow:auto;border:1px solid #c5cae9;border-radius:8px;box-shadow:0 4px 18px rgba(26,35,126,.1)}
  table{width:100%;border-collapse:collapse;font-size:12px;min-width:1600px}
  th{background:#1a237e;color:#fff;padding:12px 7px;position:sticky;top:0;z-index:2;text-align:left;cursor:pointer;user-select:none;transition:background 0.2s}
  th:hover{background:#283593}
  th.num{text-align:right}
  
  /* Sorting Icon Styles */
  .sort-icon{font-size:14px;margin-left:6px;font-weight:bold;display:inline-block;vertical-align:middle;opacity:0.4;color:#fff}
  .sort-active{opacity:1;color:#ffeb3b}
  
  td{padding:6px 7px;border-bottom:1px solid #e8eaf6;white-space:nowrap}
  td.num{text-align:right}
  tr:nth-child(even) td{background:#f7f8fd}
  tr:hover td{background:#e8eaf6}
  tfoot tr td{background:#fff9c4;font-weight:700;border-top:2px solid #fbc02d;position:sticky;bottom:0}
</style></head><body>
<h2>Purchase Bill Summary</h2>
<div class="sub">${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}</div>
<div class="cards" id="cards"></div>
<div class="toolbar">
  <input class="search" id="searchBox" placeholder="Search..." oninput="filterTable()">
  <div style="display:flex;gap:8px">
    <button class="btn btn-red" onclick="printPremiumPDF()">Print</button>
    <button class="btn btn-green" onclick="exportXlsx()">Export Excel</button>
  </div>
</div>
<div class="wrap"><table id="tbl">
  <thead><tr id="hdr"></tr></thead>
  <tbody id="tbody"></tbody>
  <tfoot><tr id="tfoot"></tr></tfoot>
</table></div>
<script>
const RAW = ${JSON.stringify(reportData)};
const COLS = ${JSON.stringify(SCREEN_COLUMNS)};
let filtered = [...RAW];
let currentSort = { key: 'SR_No', dir: 'asc' };

function fmt(v){ return v == null || v === '' ? '' : Number(v).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2}); }

function render(data){
  const sum = k => data.reduce((a,r)=>a+parseFloat(r[k]||0),0);
  
  // Cards
  document.getElementById('cards').innerHTML = ['Quintal','TaxableAmount','CGST','SGST','IGST','Payable_Amount'].map(k=>\`
    <div class="card">
      <div class="card-label">\${k.replace('_',' ')}</div>
      <div class="card-value">\${fmt(sum(k))}</div>
    </div>\`).join('');

  // Header with Always Visible Sort Icons
  document.getElementById('hdr').innerHTML = COLS.map(c=> {
    const isSorted = currentSort.key === c.key;
    let icon = '↕'; // Default always visible
    if(isSorted){
        icon = currentSort.dir === 'asc' ? '↑' : '↓';
    }
    return \`
      <th class="\${c.numeric?'num':'txt'}" onclick="handleSort('\${c.key}')">
        \${c.label}
        <span class="sort-icon \${isSorted ? 'sort-active' : ''}">\${icon}</span>
      </th>\`;
  }).join('');

  // Body
  document.getElementById('tbody').innerHTML = data.map(row=>\`<tr>\${COLS.map(c=>\`<td class="\${c.numeric?'num':'txt'}">\${c.numeric?fmt(row[c.key]||0):(row[c.key]||'')}</td>\`).join('')}</tr>\`).join('');
  
  // Footer
  document.getElementById('tfoot').innerHTML = COLS.map((c,i)=>\`<td class="\${c.numeric?'num':'txt'}">\${i===0?'GRAND TOTAL':c.isTotal?fmt(sum(c.key)):''}</td>\`).join('');
}

function handleSort(key) {
  if (currentSort.key === key) {
    currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc';
  } else {
    currentSort.key = key;
    currentSort.dir = 'asc';
  }
  
  filtered.sort((a, b) => {
    let valA = a[key] ?? '';
    let valB = b[key] ?? '';
    
    if(!isNaN(valA) && !isNaN(valB) && valA !== '' && valB !== '') {
        return currentSort.dir === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
    }
    
    valA = String(valA).toLowerCase();
    valB = String(valB).toLowerCase();
    if (valA < valB) return currentSort.dir === 'asc' ? -1 : 1;
    if (valA > valB) return currentSort.dir === 'asc' ? 1 : -1;
    return 0;
  });
  
  render(filtered);
}

function filterTable(){
  const q = document.getElementById('searchBox').value.toLowerCase();
  filtered = RAW.filter(r=>Object.values(r).some(v=>String(v).toLowerCase().includes(q)));
  render(filtered);
}

function printPremiumPDF(){ window.opener.postMessage('TRIGGER_PREMIUM_PRINT', '*'); }

function exportXlsx(){
  const wb = XLSX.utils.book_new();
  const headers = COLS.map(c => c.label);
  const dataRows = filtered.map(row => COLS.map(c => c.numeric ? parseFloat(row[c.key] || 0) : (row[c.key] || '')));
  const sum = k => filtered.reduce((a,r)=>a+parseFloat(r[k]||0),0);
  const totalRow = COLS.map((c, i) => {
    if(i === 0) return 'GRAND TOTAL';
    if(c.isTotal) return parseFloat(sum(c.key).toFixed(2));
    return '';
  });
  const wsData = [['Purchase Bill Summary'], ['${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}'], [], headers, ...dataRows, [], totalRow];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'PurchaseBillSummary');
  XLSX.writeFile(wb, 'PurchaseBillSummary.xlsx');
}

render(RAW);
</script></body></html>`);
        newWindow.document.close();
    };

    const styles = {
        wrapper: { padding: '5px', textAlign: 'center' },
        fetchBtn: { background: '#1a237e', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 30px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(26,35,126,0.2)' },
        overlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(255,255,255,0.8)', zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }
    };

    return (
        <div style={styles.wrapper}>
            <button style={{
                width: '20%',
                height: '60px',
                backgroundColor: '#007bff',
                color: '#fff',
                border: 'none',
                fontWeight: 'bold'
            }} onClick={fetchPurchaseBillSummary} disabled={loading}>
                {loading ? <CircularProgress size={24} color="inherit" /> : "Purchase Bill Summary"}
            </button>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            {pdfPreview && <PdfPreview pdfData={pdfPreview} label="GSTPurchaseBillSummary" />}
            {(loading || isPrinting) && (
                <div style={styles.overlay}>
                    <ScaleLoader color="#1a237e" height={40} />
                    <Typography sx={{ mt: 2, fontWeight: 700, color: '#1a237e' }}>
                        {isPrinting ? 'Generating PDF...' : 'Loading Data...'}
                    </Typography>
                </div>
            )}
        </div>
    );
};

export default PurchaseBillSummary;