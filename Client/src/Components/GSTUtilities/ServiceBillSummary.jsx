// import React, { useState } from 'react';
// import axios from 'axios';
// import * as XLSX from 'xlsx';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import { formatReadableAmount } from "../../Common/FormatFunctions/FormatAmount"
// import { CircularProgress } from '@mui/material';

// const API_URL = process.env.REACT_APP_API;

// const ServiceBillSummary = ({ fromDate, toDate, companyCode, yearCode }) => {
//     const [data, setData] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');
//     const [isDataFetched, setIsDataFetched] = useState(false);

//     const fetchServiceBillSummary = async () => {
//         try {
//             setLoading(true);
//             setError('');
//             const response = await axios.get(`${API_URL}/ServiceBill-summary`, {
//                 params: {
//                     from_date: fromDate,
//                     to_date: toDate,
//                     Company_Code: companyCode,
//                     Year_Code: yearCode,
//                 },
//             });
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
//             'Invoice_No',
//             'PartyGSTNo',
//             'PartyCode',
//             'PartyName',
//             'PartyStateCode',
//             'Invoice_Date',
//             'TaxableAmount',
//             'CGST',
//             'SGST',
//             'IGST',
//             'Final_Amount',
//             'ACKNo',
//         ];

//         const totals = calculateTotals(data);

//         newWindow.document.write(`
//             <html>
//                 <head>
//                     <title>Service Bill Summary</title>
//                     <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
//                     <style>
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
//                     <h2>Service Bill Summary Report</h2>
//                     <button class="export-btn" onclick="window.exportToXlsx()">Export to XLSX</button>
//                     <table>
//                         <thead>
//                             <tr>
//                                 ${columns.map((column) => `<th style="text-align: center;">${column}</th>`).join('')}
//                             </tr>
//                         </thead>
//                         <tbody>
//                             ${data.map(row => {
//                                 return `
//                                     <tr>
//                                          ${columns.map(column => {
//                                          if (['TaxableAmount', 'CGST', 'SGST', 'IGST', 'Final_Amount'].includes(column)) {
//                                             return `<td style="text-align: right;">${formatReadableAmount(row[column] || 0)}</td>`;
//                                          } else {
//                                             return `<td>${row[column] || ''}</td>`;
//                                         }
//                                         }).join('')}
//                                     </tr>
//                                 `;
//                             }).join('')}
//                         </tbody>
//                         <tfoot>
//                             <tr class="total-row">
//                                 <td colspan="7">Totals</td>
//                                 <td style="text-align: right;">${formatReadableAmount(totals.TaxableAmount.toFixed(2))}</td>
//                                 <td style="text-align: right;">${formatReadableAmount(totals.CGST.toFixed(2))}</td>
//                                 <td style="text-align: right;">${formatReadableAmount(totals.SGST.toFixed(2))}</td>
//                                 <td style="text-align: right;">${formatReadableAmount(totals.IGST.toFixed(2))}</td>
//                                 <td style="text-align: right;">${formatReadableAmount(totals.Final_Amount.toFixed(2))}</td>
//                                 <td></td>
//                             </tr>
//                         </tfoot>
//                     </table>
//                     <script>
//                     window.exportToXlsx = function() {
//                         const data = ${JSON.stringify(data)};
//                         const columnOrder = ['SR_No','Invoice_No','PartyGSTNo','PartyCode','PartyName','PartyStateCode','Invoice_Date','TaxableAmount','CGST','SGST','IGST','Final_Amount','ACKNo',];
                        
//                         const formattedData = data.map(row => {
//                             return {
//                                 ...row,
//                                 TaxableAmount: parseFloat(row.TaxableAmount || 0),
//                                 CGST: parseFloat(row.CGST || 0),
//                                 SGST: parseFloat(row.SGST || 0),
//                                 IGST: parseFloat(row.IGST || 0),
//                                 Final_Amount: parseFloat(row.Final_Amount || 0),
//                             };
//                         });
    
//                         const totals = formattedData.reduce((acc, row) => {
//                             acc.TaxableAmount += row.TaxableAmount || 0;
//                             acc.CGST += row.CGST || 0;
//                             acc.SGST += row.SGST || 0;
//                             acc.IGST += row.IGST || 0;
//                             acc.Final_Amount += row.Final_Amount || 0;
//                             return acc;
//                         }, {
//                             TaxableAmount: 0,
//                             CGST: 0,
//                             SGST: 0,
//                             IGST: 0,
//                             Bill_Amount: 0,
//                             Final_Amount: 0
//                         });
    
//                         formattedData.push({
//                             SR_No: 'Totals',
//                             TaxableAmount: totals.TaxableAmount.toFixed(2),
//                             CGST: totals.CGST.toFixed(2),
//                             SGST: totals.SGST.toFixed(2),
//                             IGST: totals.IGST.toFixed(2),
//                             Final_Amount: totals.Final_Amount.toFixed(2)
//                         });
    
//                         const ws = XLSX.utils.json_to_sheet(formattedData, { header: columnOrder, skipHeader: false });
//                         const wb = XLSX.utils.book_new();
//                         XLSX.utils.book_append_sheet(wb, ws, 'ServiceBillSummary');
                        
//                         XLSX.writeFile(wb, 'ServiceBillSummary.xlsx');
//                     };

//                     </script>
//                 </body>
//             </html>
//         `);

//         newWindow.document.close();
//     };

//     const calculateTotals = (data) => {
//         let totals = {
//             TaxableAmount: 0,
//             CGST: 0,
//             SGST: 0,
//             IGST: 0,
//             Final_Amount: 0,
//         };

//         data.forEach(row => {
//             totals.TaxableAmount += parseFloat(row.TaxableAmount || 0);
//             totals.CGST += parseFloat(row.CGST || 0);
//             totals.SGST += parseFloat(row.SGST || 0);
//             totals.IGST += parseFloat(row.IGST || 0);
//             totals.Final_Amount += parseFloat(row.Final_Amount || 0);
//         });
//         return totals;
//     };

//     return (
//         <div className="d-flex flex-column align-items-center" style={{ marginTop: '5px' }}>
//             <button
//                 className="btn btn-primary"
//                 onClick={fetchServiceBillSummary}
//                 disabled={loading}
//                 style={{
//                     width: '15%',
//                     height: '60px',
//                 }}
//             >
//                 {loading ? 'Loading...' : 'Service Bill Summary'}
//             </button>


//             {error && <div className="alert alert-danger">{error}</div>}
//         </div>
//     );
// };

// export default ServiceBillSummary;























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
    { label: 'SR No',         key: 'SR_No',          numeric: false, isTotal: false },
    { label: 'Invoice No',    key: 'Invoice_No',     numeric: false, isTotal: false },
    { label: 'GST No',        key: 'PartyGSTNo',     numeric: false, isTotal: false },
    { label: 'Party Code',    key: 'PartyCode',      numeric: false, isTotal: false },
    { label: 'Party Name',    key: 'PartyName',      numeric: false, isTotal: false },
    { label: 'State Code',    key: 'PartyStateCode', numeric: false, isTotal: false },
    { label: 'Date',          key: 'Invoice_Date',    numeric: false, isTotal: false },
    { label: 'Taxable Amount',   key: 'TaxableAmount',  numeric: true,  isTotal: true },
    { label: 'CGST',          key: 'CGST',           numeric: true,  isTotal: true },
    { label: 'SGST',          key: 'SGST',           numeric: true,  isTotal: true },
    { label: 'IGST',          key: 'IGST',           numeric: true,  isTotal: true },
    { label: 'Final Amount',  key: 'Final_Amount',   numeric: true,  isTotal: true },
    { label: 'ACK No',        key: 'ACKNo',          numeric: false, isTotal: false },
];

const PRINT_COLUMNS = [
    { label: 'Inv No',      key: 'Invoice_No',     printWidth: 25 },
    { label: 'Party Name',  key: 'PartyName',      printWidth: 80 },
    { label: 'Date',        key: 'Invoice_Date',    printWidth: 25 },
    { label: 'Taxable Amount', key: 'TaxableAmount',  printWidth: 35, numeric: true, isTotal: true },
    { label: 'CGST',        key: 'CGST',           printWidth: 20, numeric: true, isTotal: true },
    { label: 'SGST',        key: 'SGST',           printWidth: 20, numeric: true, isTotal: true },
    { label: 'IGST',        key: 'IGST',           printWidth: 20, numeric: true, isTotal: true },
    { label: 'Final Amount',   key: 'Final_Amount',   printWidth: 35, numeric: true, isTotal: true },
];

const ServiceBillSummary = ({ fromDate, toDate, companyCode, yearCode }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [error, setError] = useState('');
    const [pdfPreview, setPdfPreview] = useState(null);

    // Bridge for dashboard to trigger PDF generation
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data === 'TRIGGER_SERVICEBILL_PRINT') {
                handleGeneratePDF();
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [data]);

    const grandTotals = useMemo(() => {
        const t = { TaxableAmount: 0, CGST: 0, SGST: 0, IGST: 0, Final_Amount: 0 };
        data.forEach(row => {
            Object.keys(t).forEach(k => { t[k] += parseFloat(row[k] || 0); });
        });
        return t;
    }, [data]);

    const fetchServiceBillSummary = async () => {
        try {
            setLoading(true);
            setError('');
            setPdfPreview(null);
            const response = await axios.get(`${API_URL}/ServiceBill-summary`, {
                params: { from_date: fromDate, to_date: toDate, Company_Code: companyCode, Year_Code: yearCode }
            });

            if (!response.data || response.data.length === 0) {
                Swal.fire({ icon: 'error', title: 'Data Not Found!', text: 'No service bill records found.' });
                return;
            }

            setData(response.data);
            openInNewWindow(response.data);
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
            title: 'Service Bill Summary',
            subtitle: `Period: ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`,
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
<html><head><title>Service Bill Summary</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',sans-serif;padding:20px;background:#f8fafc}
  h2{text-align:center;color:#1e293b;margin-bottom:5px;font-size:24px}
  .sub{text-align:center;color:#64748b;font-size:14px;margin-bottom:20px}
  .toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;gap:12px}
  .search{border:1.5px solid #cbd5e1;border-radius:10px;padding:10px 15px;font-size:14px;width:320px;outline:none}
  .search:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,0.1)}
  .btn{padding:10px 20px;border-radius:10px;border:none;font-size:14px;font-weight:600;cursor:pointer;color:#fff;transition:0.2s}
  .btn-xlsx{background:#059669}.btn-pdf{background:#e11d48}
  .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:20px}
  .card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:12px;text-align:center;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05)}
  .card-label{font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase}
  .card-value{font-size:16px;font-weight:800;color:#1e293b;margin-top:6px}
  .wrap{max-height:680px;overflow:auto;border-radius:12px;border:1px solid #e2e8f0;background:#fff}
  table{width:100%;border-collapse:collapse;font-size:13px;min-width:1800px}
 th{background:#1a237e;color:#fff;padding:10px 7px;position:sticky;top:0;z-index:2;text-align:left;cursor:pointer;user-select:none;transition:background 0.2s}
  th:hover{background:#283593}
  th.num{text-align:right}
  td{padding:10px;border-bottom:1px solid #f1f5f9;white-space:nowrap;color:#334155}
  td.num{text-align:right;font-family:monospace;font-size:14px}
  tr:hover td{background:#f8fafc}
 tfoot tr td{background:#fff9c4;font-weight:700;border-top:2px solid #fbc02d;position:sticky;bottom:0}
</style></head><body>
<h2>Service Bill Summary</h2>
<div class="sub">${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}</div>
<div class="cards" id="cards"></div>
<div class="toolbar">
  <input class="search" id="searchBox" placeholder="Search Invoice, Party, GST..." oninput="filterTable()">
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
let sortState = { key: 'SR_No', dir: 'asc' };

function fmt(v){ return v == null || v === '' ? '' : Number(v).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2}); }

function render(data){
  const sum = k => data.reduce((a,r)=>a+parseFloat(r[k]||0),0);
  document.getElementById('cards').innerHTML = ['TaxableAmount','CGST','SGST','IGST','Final_Amount'].map(k=>\`
    <div class="card">
      <div class="card-label">\${k.replace('_',' ')}</div>
      <div class="card-value">\${fmt(sum(k))}</div>
    </div>\`).join('');

  document.getElementById('hdr').innerHTML = COLS.map(c=> \`<th class="\${c.numeric?'num':'txt'}" onclick="handleSort('\${c.key}')">\${c.label}</th>\`).join('');
  document.getElementById('tbody').innerHTML = data.map(row=>\`<tr>\${COLS.map(c=>\`<td class="\${c.numeric?'num':'txt'}">\${c.numeric?fmt(row[c.key]||0):(row[c.key]||'')}</td>\`).join('')}</tr>\`).join('');
  document.getElementById('tfoot').innerHTML = COLS.map((c,i)=>\`<td class="\${c.numeric?'num':'txt'}">\${i===0?'TOTAL':c.isTotal?fmt(sum(c.key)):''}</td>\`).join('');
}

function handleSort(key) {
  sortState.dir = (sortState.key === key && sortState.dir === 'asc') ? 'desc' : 'asc';
  sortState.key = key;
  filtered.sort((a, b) => {
    let vA = a[key] ?? ''; let vB = b[key] ?? '';
    if(!isNaN(vA) && !isNaN(vB) && vA !== '' && vB !== '') return sortState.dir === 'asc' ? Number(vA)-Number(vB) : Number(vB)-Number(vA);
    return sortState.dir === 'asc' ? String(vA).localeCompare(String(vB)) : String(vB).localeCompare(String(vA));
  });
  render(filtered);
}

function filterTable(){
  const q = document.getElementById('searchBox').value.toLowerCase();
  filtered = RAW.filter(r=>Object.values(r).some(v=>String(v).toLowerCase().includes(q)));
  render(filtered);
}

function printReport(){ window.opener.postMessage('TRIGGER_SERVICEBILL_PRINT', '*'); }

function exportXlsx(){
  const wb = XLSX.utils.book_new();
  const headers = COLS.map(c => c.label);
  const dataRows = filtered.map(row => COLS.map(c => c.numeric ? parseFloat(row[c.key] || 0) : (row[c.key] || '')));
  const ws = XLSX.utils.aoa_to_sheet([['Service Bill Summary'], ['Period: ${fromDate} to ${toDate}'], [], headers, ...dataRows]);
  XLSX.utils.book_append_sheet(wb, ws, 'ServiceBillSummary');
  XLSX.writeFile(wb, 'ServiceBillSummary.xlsx');
}
render(RAW);
</script></body></html>`);
        newWindow.document.close();
    };

    return (
        <div style={{ textAlign: 'center' }}>
            <button 
                style={{
                    marginTop: '-10px',
                    background: '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 30px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(26,35,126,0.2)'
                }}
                onClick={fetchServiceBillSummary} 
                disabled={loading}
            >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Service Bill Summary"}
            </button>

            {error && <Alert severity="error" sx={{ mt: 2, maxWidth: '450px', mx: 'auto' }}>{error}</Alert>}
            {pdfPreview && <PdfPreview pdfData={pdfPreview} label="GSTServiceBillSummary" />}

            {(loading || isPrinting) && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(255,255,255,0.8)', zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <ScaleLoader color="#1a237e" height={50} width={6} radius={2} margin={4} />
                    <Typography sx={{ mt: 3, fontWeight: 700, color: '#1a237e' }}>
                        {isPrinting ? 'Generating PDF...' : 'Loading Data...'}
                    </Typography>
                </div>
            )}
        </div>
    );
};

export default ServiceBillSummary;