// import React, { useState, useEffect } from 'react';
// import axios from "../../api/axiosInstance"
// import * as XLSX from 'xlsx';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import { CircularProgress } from '@mui/material';
// import { formatReadableAmount } from "../../Common/FormatFunctions/FormatAmount"
// import Swal from 'sweetalert2';

// const API_URL = process.env.REACT_APP_API;

// const SaleBillSummary = ({ fromDate, toDate, companyCode, yearCode, accode }) => {
//     const [data, setData] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');
//     const [isDataFetched, setIsDataFetched] = useState(false);

//     const getAccountingYearFormat = () => {
//         try {
//             const accountingYearData = sessionStorage.getItem('Accounting_Year');
//             if (accountingYearData) {
//                 const years = accountingYearData.split(' - ');
//                 if (years.length === 2) {
//                     const startYear = years[0].substring(0, 4);
//                     const endYear = years[1].substring(2, 4);
//                     return `${startYear}-${endYear}`;
//                 }
//             }
//             return '';
//         } catch (error) {
//             console.error('Error parsing accounting year:', error);
//             return '';
//         }
//     };

//     const formatInvoiceNumber = (invoiceNo) => {
//         if (!invoiceNo) return '';

//         const yearFormat = getAccountingYearFormat();
//         if (yearFormat) {
//             const invoiceNumber = invoiceNo.replace('SB', '');
//             return `SB${yearFormat}-${invoiceNumber}`;
//         }
//         return invoiceNo;
//     };

//     const fetchSaleBillSummary = async () => {
//         try {
//             setLoading(true);
//             setError('');
//             const response = await axios.get(`${API_URL}/salebill-summary`, {
//                 params: {
//                     fromDate: fromDate,
//                     toDate: toDate,
//                     Company_Code: companyCode,
//                     Year_Code: yearCode,
//                     accode: accode
//                 },
//             });

//             if (response.data.length === 0) {
//                 Swal.fire({
//                     icon: 'error',
//                     title: 'Data Not Found.!',
//                     text: 'No Sale bill data found for the selected date range.',
//                 });
//                 return;
//             }

//             const formattedData = response.data.map(item => ({
//                 ...item,
//                 Invoice_No: formatInvoiceNumber(item.Invoice_No)
//             }));

//             setData(formattedData);
//             setIsDataFetched(true);
//         } catch (err) {
//             setError('Failed to fetch data');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const columns = [
//         'SR_No',
//         'Invoice_No',
//         'PartyGSTNo',
//         'PartyCode',
//         'PartyName',
//         'Mill_Name',
//         'billtogststatecode',
//         'Invoice_Date',
//         'Vehicle_No',
//         'Quintal',
//         'Rate',
//         'TaxableAmount',
//         'CGST',
//         'SGST',
//         'IGST',
//         'Payable_Amount',
//         'DO_No',
//         'ACKNo'
//     ];

//     const calculateTotals = () => {
//         let totals = {
//             Quintal: 0,
//             TaxableAmount: 0,
//             CGST: 0,
//             SGST: 0,
//             IGST: 0,
//             Payable_Amount: 0
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

//     const totals = calculateTotals();

//     useEffect(() => {
//         if (isDataFetched && !error) {
//             openNewWindow();
//             setIsDataFetched(false);
//         }
//     }, [isDataFetched, error]);

//     const openNewWindow = () => {
//         const newWindow = window.open('', '_blank');
//         const htmlContent = `
//             <html>
//                 <head>
//                     <title>Sale Bill Summary</title>
//                     <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
//                     <style>
//                         body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
//                         h2 { text-align: center; margin-top: 0; }
//                         .table-container {
//                             max-height: 500px;
//                             overflow-y: auto;
//                             margin: 20px auto;
//                             width: 90%;
//                         }
//                         table {
//                             width: 100%;
//                             border-collapse: collapse;
//                         }
//                         th, td {
//                             border: 1px solid #ddd;
//                             padding: 6px 8px;
//                             text-align: left;
//                             white-space: nowrap;
//                         }
//                         th {
//                             background-color: rgb(206, 200, 243);
//                             position: sticky;
//                             top: 0;
//                             z-index: 2;
//                             font-weight: bold;
//                             font-size: 20px;
//                             height: 50px;
//                             text-align: center;
//                         }
//                         .export-btn {
//                             padding: 10px 20px;
//                             font-size: 16px;
//                             background-color: green;
//                             color: white;
//                             border: none;
//                             cursor: pointer;
//                             margin-bottom: 20px;
//                             margin-top: 20px;
//                         }
//                         .total-row {
//                             background-color: yellow;
//                             font-weight: bold;
//                         }
//                     </style>
//                 </head>
//                 <body>
//                     <h2>Sale Bill Summary</h2>
//                     <button class="export-btn" onclick="exportToXlsx()">Export to XLSX</button>

//                     <table>
//                         <thead>
//                             <tr>
//                                 ${columns.map(column => `<th style="text-align: center;">${column}</th>`).join('')}
//                             </tr>
//                         </thead>
//                         <tbody>
//                             ${data.map(row => `
//                                 <tr>
//                                     ${columns.map(column => {
//             if (['TaxableAmount', 'CGST', 'SGST', 'IGST', 'Payable_Amount', 'Rate', 'Quintal'].includes(column)) {
//                 return `<td style="text-align: right;">${formatReadableAmount(row[column] || 0)}</td>`;
//             } else {
//                 return `<td>${row[column] || ''}</td>`;
//             }
//         }).join('')}
//                                 </tr>
//                             `).join('')}
//                             <tr class="total-row" colspan="11" style="font-weight: bold; background-color: yellow;">
//                                 <td colspan="9"></td>
//                                 <td style="text-align: right;">${formatReadableAmount(totals.Quintal.toFixed(2))}</td>
//                                 <td></td>
//                                 <td style="text-align: right;">${formatReadableAmount(totals.TaxableAmount.toFixed(2))}</td>
//                                 <td style="text-align: right;">${formatReadableAmount(totals.CGST.toFixed(2))}</td>
//                                 <td style="text-align: right;">${formatReadableAmount(totals.SGST.toFixed(2))}</td>
//                                 <td style="text-align: right;">${formatReadableAmount(totals.IGST.toFixed(2))}</td>
//                                 <td style="text-align: right;">${formatReadableAmount(totals.Payable_Amount.toFixed(2))}</td>
//                                 <td colspan="2"></td>
//                             </tr>
//                         </tbody>
//                     </table>
//                     <script>
//                         window.exportToXlsx = function() {
//                             const data = ${JSON.stringify(data)};
//                             const columnOrder = ${JSON.stringify(columns)};

//                             const formattedData = data.map(row => {
//                                 return {
//                                     ...row,
//                                     TaxableAmount: parseFloat(row.TaxableAmount || 0),
//                                     CGST: parseFloat(row.CGST || 0),
//                                     SGST: parseFloat(row.SGST || 0),
//                                     IGST: parseFloat(row.IGST || 0),
//                                     Payable_Amount: parseFloat(row.Payable_Amount || 0),
//                                     Quintal: parseFloat(row.Quintal || 0),
//                                     Rate: parseFloat(row.Rate || 0)
//                                 };
//                             });

//                             const totals = formattedData.reduce((acc, row) => {
//                                 acc.Quintal += row.Quintal || 0;
//                                 acc.TaxableAmount += row.TaxableAmount || 0;
//                                 acc.CGST += row.CGST || 0;
//                                 acc.SGST += row.SGST || 0;
//                                 acc.IGST += row.IGST || 0;
//                                 acc.Payable_Amount += row.Payable_Amount || 0;
//                                 return acc;
//                             }, {
//                                 Quintal: 0,
//                                 TaxableAmount: 0,
//                                 CGST: 0,
//                                 SGST: 0,
//                                 IGST: 0,
//                                 Payable_Amount: 0
//                             });

//                             formattedData.push({
//                                 SR_No: 'Totals',
//                                 Quintal: totals.Quintal.toFixed(2),
//                                 TaxableAmount: totals.TaxableAmount.toFixed(2),
//                                 CGST: totals.CGST.toFixed(2),
//                                 SGST: totals.SGST.toFixed(2),
//                                 IGST: totals.IGST.toFixed(2),
//                                 Payable_Amount: totals.Payable_Amount.toFixed(2)
//                             });

//                             const ws = XLSX.utils.json_to_sheet(formattedData, { header: columnOrder, skipHeader: false });
//                             const wb = XLSX.utils.book_new();
//                             XLSX.utils.book_append_sheet(wb, ws, 'SaleBillSummary');

//                             XLSX.writeFile(wb, 'SaleBillSummary.xlsx');
//                         };
//                     </script>
//                 </body>
//             </html>
//         `;
//         newWindow.document.write(htmlContent);
//         newWindow.document.close();
//     };

//     return (
//         <div className="d-flex flex-column align-items-center" style={{ marginTop: '5px' }}>
//             <button
//                 variant="contained"
//                 color="primary"
//                 onClick={fetchSaleBillSummary}
//                 disabled={loading}
//                 style={{
//                     width: '15%',
//                     height: '60px',
//                 }}
//             >
//                 {loading ? <CircularProgress size={24} /> : 'Sale Bill Summary'}
//             </button>

//             {error && <div className="alert alert-danger">{error}</div>}
//         </div>
//     );
// };

// export default SaleBillSummary;


















import React, { useState, useMemo, useEffect } from 'react';
import axios from "../../api/axiosInstance";
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
    { label: 'SR No', key: 'SR_No', numeric: false, isTotal: false },
    { label: 'Invoice No', key: 'Invoice_No', numeric: false, isTotal: false },
    { label: 'GST No', key: 'PartyGSTNo', numeric: false, isTotal: false },
    { label: 'Party Code', key: 'PartyCode', numeric: false, isTotal: false },
    { label: 'Party Name', key: 'PartyName', numeric: false, isTotal: false },
    { label: 'Mill Name', key: 'Mill_Name', numeric: false, isTotal: false },
    { label: 'State Code', key: 'billtogststatecode', numeric: false, isTotal: false },
    { label: 'Date', key: 'Invoice_Date', numeric: false, isTotal: false },
    { label: 'Vehicle No', key: 'Vehicle_No', numeric: false, isTotal: false },
    { label: 'Quintal', key: 'Quintal', numeric: true, isTotal: true },
    { label: 'Rate', key: 'Rate', numeric: true, isTotal: false },
    { label: 'Taxable Amount', key: 'TaxableAmount', numeric: true, isTotal: true },
    { label: 'CGST', key: 'CGST', numeric: true, isTotal: true },
    { label: 'SGST', key: 'SGST', numeric: true, isTotal: true },
    { label: 'IGST', key: 'IGST', numeric: true, isTotal: true },
    { label: 'Payable Amount', key: 'Payable_Amount', numeric: true, isTotal: true },
    { label: 'DO No', key: 'DO_No', numeric: false, isTotal: false },
    { label: 'ACK No', key: 'ACKNo', numeric: false, isTotal: false },
];

const PRINT_COLUMNS = [
    { label: 'Inv No', key: 'Invoice_No', printWidth: 25 },
    { label: 'Party Code', key: 'PartyCode', printWidth: 65 },
    { label: 'Party Name', key: 'PartyName', printWidth: 65 },
    { label: 'Quintal', key: 'Quintal', printWidth: 20, numeric: true, isTotal: true },
    { label: 'Taxable Amount', key: 'TaxableAmount', printWidth: 35, numeric: true, isTotal: true },
    { label: 'CGST', key: 'CGST', printWidth: 20, numeric: true, isTotal: true },
    { label: 'SGST', key: 'SGST', printWidth: 20, numeric: true, isTotal: true },
    { label: 'IGST', key: 'IGST', printWidth: 20, numeric: true, isTotal: true },
    { label: 'Payable Amount', key: 'Payable_Amount', printWidth: 35, numeric: true, isTotal: true },
];

const SaleBillSummary = ({ fromDate, toDate, companyCode, yearCode, accode }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [error, setError] = useState('');
    const [pdfPreview, setPdfPreview] = useState(null);

    // Communication bridge for the pop-up dashboard to trigger parent PDF logic
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data === 'TRIGGER_SALEBILL_PRINT') {
                handleGeneratePDF();
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [data]);

    const getAccountingYearFormat = () => {
        try {
            const accountingYearData = sessionStorage.getItem('Accounting_Year');
            if (accountingYearData) {
                const years = accountingYearData.split(' - ');
                if (years.length === 2) {
                    return `${years[0].substring(0, 4)}-${years[1].substring(2, 4)}`;
                }
            }
            return '';
        } catch (e) { return ''; }
    };

    const formatInvoiceNumber = (invoiceNo) => {
        if (!invoiceNo) return '';
        const yearFormat = getAccountingYearFormat();
        return yearFormat ? `SB${yearFormat}-${invoiceNo.replace('SB', '')}` : invoiceNo;
    };

    const grandTotals = useMemo(() => {
        const t = { Quintal: 0, TaxableAmount: 0, CGST: 0, SGST: 0, IGST: 0, Payable_Amount: 0 };
        data.forEach(row => {
            Object.keys(t).forEach(k => { t[k] += parseFloat(row[k] || 0); });
        });
        return t;
    }, [data]);

    const fetchSaleBillSummary = async () => {
        try {
            setLoading(true);
            setError('');
            setPdfPreview(null);
            const response = await axios.get(`${API_URL}/salebill-summary`, {
                params: { fromDate, toDate, Company_Code: companyCode, Year_Code: yearCode, accode }
            });

            if (!response.data || response.data.length === 0) {
                Swal.fire({ icon: 'error', title: 'Data Not Found!', text: 'No Sale bill records found for this range.' });
                return;
            }

            const formattedData = response.data.map(item => ({
                ...item,
                Invoice_No: formatInvoiceNumber(item.Invoice_No)
            }));

            setData(formattedData);
            openInNewWindow(formattedData);
        } catch (err) {
            setError('Failed to fetch data');
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
            return col.label === 'Inv No' ? { content: 'TOTAL', styles: { fontStyle: 'bold', fillColor: [255, 249, 196] } } : '';
        });

        generateReportPDF({
            title: 'Sale Bill Summary Report',
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
<html><head><title>Sale Bill Summary</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',sans-serif;padding:15px;background:#f4f7fe}
  h2{text-align:center;color:#1e293b;margin-bottom:4px;font-size:22px}
  .sub{text-align:center;color:#64748b;font-size:14px;margin-bottom:18px}
  .toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:10px}
  .search{border:1.5px solid #e2e8f0;border-radius:8px;padding:8px 14px;font-size:14px;width:300px;outline:none;transition:0.2s}
  .search:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,0.1)}
  .btn{padding:9px 18px;border-radius:8px;border:none;font-size:14px;font-weight:600;cursor:pointer;color:#fff;transition:0.2s;display:inline-flex;align-items:center;gap:6px}
  .btn:active{transform:scale(0.97)}
  .btn-xlsx{background:#10b981}.btn-pdf{background:#ef4444}
  .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:15px}
  .card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:10px 15px;text-align:center;box-shadow:0 2px 4px rgba(0,0,0,0.02)}
  .card-label{font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px}
  .card-value{font-size:15px;font-weight:800;color:#0f172a;margin-top:4px}
  .wrap{max-height:720px;overflow:auto;border:1px solid #e2e8f0;border-radius:12px;background:#fff}
  table{width:100%;border-collapse:collapse;font-size:13px;min-width:2000px}
   th{background:#1a237e;color:#fff;padding:10px 7px;position:sticky;top:0;z-index:2;text-align:left;cursor:pointer;user-select:none;transition:background 0.2s}
  th:hover{background:#283593}
  th.num{text-align:right}
  .sort-icon{font-size:12px;margin-left:8px;color:#94a3b8}
  .sort-active{color:#3b82f6}
  td{padding:8px 10px;border-bottom:1px solid #f1f5f9;white-space:nowrap;color:#334155}
  td.num{text-align:right;font-family:monospace;font-size:14px}
  tr:hover td{background:#f8fafc}
  tfoot tr td{background:#fefce8;font-weight:800;border-top:2px solid #fbc02d;position:sticky;bottom:0;color:#854d0e}
</style></head><body>
<h2>Sale Bill Summary</h2>
<div class="sub">Period: ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}</div>
<div class="cards" id="cards"></div>
<div class="toolbar">
  <input class="search" id="searchBox" placeholder="Search by Invoice, Party, GST..." oninput="filterTable()">
  <div style="display:flex;gap:10px">
    <button class="btn btn-pdf" onclick="printReport()">Print</button>
    <button class="btn btn-xlsx" onclick="exportXlsx()">Export Excel</button>
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
  document.getElementById('cards').innerHTML = ['Quintal','TaxableAmount','CGST','SGST','IGST','Payable_Amount'].map(k=>\`
    <div class="card">
      <div class="card-label">\${k.replace('_',' ')}</div>
      <div class="card-value">\${fmt(sum(k))}</div>
    </div>\`).join('');

  document.getElementById('hdr').innerHTML = COLS.map(c=> {
    const isSorted = currentSort.key === c.key;
    let icon = isSorted ? (currentSort.dir === 'asc' ? '▴' : '▾') : '↕';
    return \`<th class="\${c.numeric?'num':'txt'}" onclick="handleSort('\${c.key}')">\${c.label}<span class="sort-icon \${isSorted?'sort-active':''}">\${icon}</span></th>\`;
  }).join('');

  document.getElementById('tbody').innerHTML = data.map(row=>\`<tr>\${COLS.map(c=>\`<td class="\${c.numeric?'num':'txt'}">\${c.numeric?fmt(row[c.key]||0):(row[c.key]||'')}</td>\`).join('')}</tr>\`).join('');
  document.getElementById('tfoot').innerHTML = COLS.map((c,i)=>\`<td class="\${c.numeric?'num':'txt'}">\${i===0?'TOTAL':c.isTotal?fmt(sum(c.key)):''}</td>\`).join('');
}

function handleSort(key) {
  currentSort.dir = (currentSort.key === key && currentSort.dir === 'asc') ? 'desc' : 'asc';
  currentSort.key = key;
  filtered.sort((a, b) => {
    let vA = a[key] ?? ''; let vB = b[key] ?? '';
    if(!isNaN(vA) && !isNaN(vB) && vA !== '' && vB !== '') return currentSort.dir === 'asc' ? Number(vA)-Number(vB) : Number(vB)-Number(vA);
    vA = String(vA).toLowerCase(); vB = String(vB).toLowerCase();
    return currentSort.dir === 'asc' ? vA.localeCompare(vB) : vB.localeCompare(vA);
  });
  render(filtered);
}

function filterTable(){
  const q = document.getElementById('searchBox').value.toLowerCase();
  filtered = RAW.filter(r=>Object.values(r).some(v=>String(v).toLowerCase().includes(q)));
  render(filtered);
}

function printReport(){ window.opener.postMessage('TRIGGER_SALEBILL_PRINT', '*'); }

function exportXlsx(){
  const wb = XLSX.utils.book_new();
  const headers = COLS.map(c => c.label);
  const dataRows = filtered.map(row => COLS.map(c => c.numeric ? parseFloat(row[c.key] || 0) : (row[c.key] || '')));
  const wsData = [['Sale Bill Summary'], ['Period: ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}'], [], headers, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'SaleBillSummary');
  XLSX.writeFile(wb, 'SaleBillSummary.xlsx');
}
render(RAW);
</script></body></html>`);
        newWindow.document.close();
    };

    return (
        <div style={{ textAlign: 'center' }}>
            <button
                style={{
                    marginTop: '10px',
                    background: '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 40px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(26,35,126,0.2)'
                }}
                onClick={fetchSaleBillSummary}
                disabled={loading}

            >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Sale Bill Summary"}
            </button>

            {error && <Alert severity="error" sx={{ mt: 2, maxWidth: '400px', mx: 'auto' }}>{error}</Alert>}
            {pdfPreview && <PdfPreview pdfData={pdfPreview} label="GSTSaleBillSummary" />}

            {(loading || isPrinting) && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(255,255,255,0.85)', zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <ScaleLoader color="#051f57" height={45} width={5} margin={3} />
                    <Typography sx={{ mt: 3, fontWeight: 800, color: '#051f57', letterSpacing: '0.5px' }}>
                        {isPrinting ? 'Generating PDF...' : 'Loading Data...'}
                    </Typography>
                </div>
            )}
        </div>
    );
};

export default SaleBillSummary;