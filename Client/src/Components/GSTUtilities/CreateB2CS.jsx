// import React, { useState } from 'react';
// import axios from 'axios';
// import * as XLSX from 'xlsx';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import { formatReadableAmount } from "../../Common/FormatFunctions/FormatAmount"
// import Swal from 'sweetalert2';

// const API_URL = process.env.REACT_APP_API;

// const CreateB2CSFile = ({ fromDate, toDate, companyCode, yearCode }) => {
//     const [data, setData] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');
//     const [isDataFetched, setIsDataFetched] = useState(false);

//     const fetchCreateB2CSFile = async () => {
//         try {
//             setLoading(true);
//             setError('');
//             const response = await axios.get(`${API_URL}/CreateB2CSFileData-summary`, {
//                 params: {
//                     from_date: fromDate,
//                     to_date: toDate,
//                     Company_Code: companyCode,
//                     Year_Code: yearCode,
//                 },
//             });
//             if (response.data.length === 0) {
//                 Swal.fire({
//                     icon: 'error',
//                     title: 'Data Not Found.!',
//                     text: 'No CreateB2CSFile data found for the selected date range.',
//                 });
//                 return;
//             }
//             setData(response.data);
//             setIsDataFetched(true);
//             openReportInNewTab(response.data);
//         } catch (err) {
//             setError('Failed to fetch data');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const openReportInNewTab = (data) => {
//         const newWindow = window.open('', '_blank');
//         if (!newWindow) return;

//         const columns = [
//             'Type',
//             'Place Of Supply',
//             'Rate',
//             'Taxable Value',
//             'Cess Amount',
//             'E-Commerce GSTIN'
//         ];

//         newWindow.document.write(`
//             <html>
//                 <head>
//                     <title>Create B2CS Report</title>
//                     <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
//                     <style>
//                         body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
//                         h2 { text-align: center; margin-top: 0; }
//                         table { width: 80%; margin: 20px auto; border-collapse: collapse; }
//                         th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
//                         th { background-color: #f4f4f4; }
//                         .export-btn { 
//                             padding: 10px 20px; 
//                             font-size: 16px; 
//                             background-color: green; 
//                             color: white; 
//                             border: none; 
//                             cursor: pointer; 
//                             margin-top: 20px;
//                         }
//                     </style>
//                 </head>
//                 <body>
//                     <h2>Create B2CS File Report</h2>
//                     <button class="export-btn" onclick="window.exportToXlsx()">Export to Excel</button>
//                     <table>
//                         <thead>
//                             <tr>
//                                 ${columns.map((column) => `<th>${column}</th>`).join('')}
//                             </tr>
//                         </thead>
//                         <tbody>
//                             ${data.map(row => {
//             return `
//                           <tr>
//                             ${columns.map(column => {
//                 if (['Taxable Value'].includes(column)) {
//                     return `<td style="text-align: right;">${formatReadableAmount(row[column] || 0)}</td>`;
//                 } else {
//                     return `<td>${row[column] || ''}</td>`;
//                 }
//             }).join('')}
//                            </tr>
//                                 `;
//         }).join('')}
//                         </tbody>
//                     </table>
//                     <script>
//                         window.exportToXlsx = function() {
//                             const data = ${JSON.stringify(data)};
//                             const columnOrder = ['Type','Place Of Supply','Rate','Taxable Value','Cess Amount','E-Commerce GSTIN'];
//                             const ws = XLSX.utils.json_to_sheet(data, { header: columnOrder, skipHeader: false });
//                             const wb = XLSX.utils.book_new();
//                             XLSX.utils.book_append_sheet(wb, ws, 'B2CS Report');
//                             XLSX.writeFile(wb, 'B2CSFile.xlsx');
//                         };
//                     </script>
//                 </body>
//             </html>
//         `);

//         newWindow.document.close();
//     };

//     return (
//         <div className="d-flex flex-column align-items-center" style={{ marginTop: '5px' }}>
//             <button
//                 className="btn btn-primary"
//                 onClick={fetchCreateB2CSFile}
//                 disabled={loading}
//                 style={{
//                     width: '20%',
//                     height: '60px',
//                 }}
//             >
//                 {loading ? 'Loading...' : 'Create B2CS File'}
//             </button>

//             {error && <div className="alert alert-danger">{error}</div>}
//         </div>
//     );
// };

// export default CreateB2CSFile;

























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
    { label: 'Type', key: 'Type', numeric: false, isTotal: false },
    { label: 'Place Of Supply', key: 'Place Of Supply', numeric: false, isTotal: false },
    { label: 'Rate', key: 'Rate', numeric: true, isTotal: false },
    { label: 'Taxable Value', key: 'Taxable Value', numeric: true, isTotal: true },
    { label: 'Cess Amount', key: 'Cess Amount', numeric: true, isTotal: true },
    { label: 'E-Comm GSTIN', key: 'E-Commerce GSTIN', numeric: false, isTotal: false },
];

const PRINT_COLUMNS = [
    { label: 'Type', key: 'Type', printWidth: 30 },
    { label: 'Place Of Supply', key: 'Place Of Supply', printWidth: 60 },
    { label: 'Rate (%)', key: 'Rate', printWidth: 25, numeric: true },
    { label: 'Taxable Value', key: 'Taxable Value', printWidth: 50, numeric: true, isTotal: true },
    { label: 'Cess Amount', key: 'Cess Amount', printWidth: 35, numeric: true, isTotal: true },
];

const CreateB2CSFile = ({ fromDate, toDate, companyCode, yearCode }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [error, setError] = useState('');
    const [pdfPreview, setPdfPreview] = useState(null);

    // Listen for print trigger from dashboard window
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data === 'TRIGGER_B2CS_PRINT') handleGeneratePDF();
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [data]);

    const grandTotals = useMemo(() => {
        const totals = { "Taxable Value": 0, "Cess Amount": 0 };
        data.forEach(row => {
            Object.keys(totals).forEach(k => { totals[k] += parseFloat(row[k] || 0); });
        });
        return totals;
    }, [data]);

    const fetchCreateB2CSFile = async () => {
        try {
            setLoading(true);
            setError('');
            setPdfPreview(null);
            const response = await axios.get(`${API_URL}/CreateB2CSFileData-summary`, {
                params: { from_date: fromDate, to_date: toDate, Company_Code: companyCode, Year_Code: yearCode },
            });
            if (!response.data || response.data.length === 0) {
                Swal.fire({ icon: 'error', title: 'Data Not Found!', text: 'No B2CS records found for the selected range.' });
                return;
            }
            setData(response.data);
            openInNewWindow(response.data);
        } catch (err) {
            setError('Failed to fetch B2CS data');
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
            return col.label === 'Type' ? { content: 'TOTAL', styles: { fontStyle: 'bold', fillColor: [255, 249, 196] } } : '';
        });

        generateReportPDF({
            title: `B2CS Report`,
            subtitle: `${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`,
            columns: PRINT_COLUMNS.map(c => c.label),
            rows, footerRow, headerImgSrc: HeaderJK, footerImgSrc: FooterJK,
            numericCols: PRINT_COLUMNS.map((c, i) => c.numeric ? i : null).filter(i => i !== null),
            orientation: 'portrait',
            onComplete: (url) => { setPdfPreview(url); setIsPrinting(false); },
        });
    };

    const openInNewWindow = (reportData) => {
        const newWindow = window.open('', '_blank');
        if (!newWindow) return;

        newWindow.document.write(`<!DOCTYPE html>
<html><head><title>B2CS Summary</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',sans-serif;padding:20px;background:#f8f9ff}
  h2{text-align:center;color:#283593;margin-bottom:4px;font-size:22px}
  .sub{text-align:center; color: #555;font-size:14px;margin-bottom:15px}
  .toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:10px}
  .search{border:1.5px solid #d1d9ff;border-radius:8px;padding:10px 15px;font-size:14px;width:320px;outline:none;transition:0.3s}
  .search:focus{border-color:#283593;box-shadow:0 0 0 3px rgba(40,53,147,0.1)}
  .btn{padding:10px 20px;border-radius:8px;border:none;font-size:14px;font-weight:600;cursor:pointer;color:#fff;transition:0.2s}
  .btn-green{background:#2e7d32}.btn-red{background:#c62828}
  .btn:hover{filter:brightness(1.1);transform:translateY(-1px)}
  .cards{display:flex;gap:15px;margin-bottom:15px;justify-content:center}
  .card{background:#fff;border:1px solid #d1d9ff;border-radius:10px;padding:15px;min-width:200px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.05)}
  .card-label{font-size:11px;color:#7986cb;font-weight:700;text-transform:uppercase;letter-spacing:0.5px}
  .card-value{font-size:18px;font-weight:800;color:#283593;margin-top:5px}
  .wrap{max-height:600px;overflow:auto;border:1px solid #d1d9ff;border-radius:10px;background:#fff}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{background:#283593;color:#fff;padding:14px 12px;position:sticky;top:0;z-index:2;text-align:left;cursor:pointer;user-select:none}
  th.num{text-align:right}
  .sort-icon{font-size:14px;margin-left:5px;opacity:0.4}
  .sort-active{opacity:1;color:#ffd54f}
  td{padding:10px 12px;border-bottom:1px solid #f0f2ff;white-space:nowrap}
  td.num{text-align:right}
  tr:nth-child(even) td{background:#fcfdff}
  tr:hover td{background:#f0f2ff}
  tfoot tr td{background:#fffde7;font-weight:800;border-top:2px solid #fbc02d;position:sticky;bottom:0;color:#283593}
</style></head><body>
<h2>B2CS Report</h2>
<div class="sub">${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}</div>
<div class="cards" id="cards"></div>
<div class="toolbar">
  <input class="search" id="searchBox" placeholder="Search by POS or Rate..." oninput="filterTable()">
  <div style="display:flex;gap:10px">
    <button class="btn btn-red" onclick="window.opener.postMessage('TRIGGER_B2CS_PRINT', '*')">Print</button>
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
let currentSort = { key: 'Place Of Supply', dir: 'asc' };

function fmt(v){ return v == null || v === '' ? '' : Number(v).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2}); }

function render(data){
  const sum = k => data.reduce((a,r)=>a+parseFloat(r[k]||0),0);
  document.getElementById('cards').innerHTML = ['Taxable Value','Cess Amount'].map(k=>\`
    <div class="card">
      <div class="card-label">\${k}</div>
      <div class="card-value">\${fmt(sum(k))}</div>
    </div>\`).join('');

  document.getElementById('hdr').innerHTML = COLS.map(c=> {
    const isSorted = currentSort.key === c.key;
    let icon = '↕'; 
    if(isSorted) icon = currentSort.dir === 'asc' ? '↑' : '↓';
    return \`<th class="\${c.numeric?'num':''}" onclick="handleSort('\${c.key}')">
        \${c.label} <span class="sort-icon \${isSorted ? 'sort-active' : ''}">\${icon}</span>
      </th>\`;
  }).join('');

  document.getElementById('tbody').innerHTML = data.map(row=>\`<tr>\${COLS.map(c=>\`<td class="\${c.numeric?'num':''}">\${c.numeric?fmt(row[c.key]||0):(row[c.key]||'')}</td>\`).join('')}</tr>\`).join('');
  document.getElementById('tfoot').innerHTML = COLS.map((c,i)=>\`<td class="\${c.numeric?'num':''}">\${i===0?'TOTAL':c.isTotal?fmt(sum(c.key)):''}</td>\`).join('');
}

function handleSort(key) {
  if (currentSort.key === key) { currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc'; } 
  else { currentSort.key = key; currentSort.dir = 'asc'; }
  
  filtered.sort((a, b) => {
    let valA = a[key] ?? ''; let valB = b[key] ?? '';
    if(!isNaN(valA) && !isNaN(valB) && valA !== '' && valB !== '') {
       return currentSort.dir === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
    }
    valA = String(valA).toLowerCase(); valB = String(valB).toLowerCase();
    return currentSort.dir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });
  render(filtered);
}

function filterTable(){
  const q = document.getElementById('searchBox').value.toLowerCase();
  filtered = RAW.filter(r=>Object.values(r).some(v=>String(v).toLowerCase().includes(q)));
  render(filtered);
}

function exportXlsx(){
  const wb = XLSX.utils.book_new();
  const headers = COLS.map(c => c.label);
  const dataRows = filtered.map(row => COLS.map(c => c.numeric ? parseFloat(row[c.key] || 0) : row[c.key]));
  const wsData = [['B2CS Small Consumers Report'],['${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}'],[],headers,...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'B2CSReport');
  XLSX.writeFile(wb, 'CreateB2CSFile.xlsx');
}
render(RAW);
</script></body></html>`);
        newWindow.document.close();
    };

    return (
        <div style={{ padding: '5px', textAlign: 'center' }}>
            <button style={{
                marginTop: '5px', background: '#007bff', color: '#fff', border: 'none',
                borderRadius: '8px', padding: '12px 10px', fontWeight: 600, cursor: 'pointer',
                width: '20%', height: '60px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }} onClick={fetchCreateB2CSFile} disabled={loading}>
                {loading ? <CircularProgress size={24} color="inherit" /> : "Create B2CS File"}
            </button>

            {error && <Alert severity="error" sx={{ mt: 2, maxWidth: '400px', mx: 'auto' }}>{error}</Alert>}

            {pdfPreview && <PdfPreview pdfData={pdfPreview} label="GSTCreateB2CS" />}

            {(loading || isPrinting) && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(255,255,255,0.85)', zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <ScaleLoader color="#283593" height={45} />
                    <Typography sx={{ mt: 2, fontWeight: 700, color: '#283593', letterSpacing: '0.5px' }}>
                        {isPrinting ? 'Generating B2CS Document...' : 'Fetching Data...'}
                    </Typography>
                </div>
            )}
        </div>
    );
};

export default CreateB2CSFile;
