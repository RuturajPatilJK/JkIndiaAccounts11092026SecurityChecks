// import React, { useState } from 'react';
// import axios from 'axios';
// import * as XLSX from 'xlsx';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import Swal from 'sweetalert2';

// const API_URL = process.env.REACT_APP_API;

// const ShowEntryNo = ({ fromDate, toDate, companyCode, yearCode }) => {
//     const [data, setData] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');

//     const fetchShowEntryNo = async () => {
//         try {
//             setLoading(true);
//             setError('');
//             const response = await axios.get(`${API_URL}/ShowEntryNo-summary`, {
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
//                     text: 'No ShowEntryNo data found for the selected date range.',
//                 });
//                 return;
//             }
//             setData(response.data);
//             openReportInNewTab(response.data);
//         } catch (err) {
//             setError('Failed to fetch data');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const openReportInNewTab = (reportData) => {
//         const newTab = window.open('', '_blank');
//         if (newTab) {
//             const reportHtml = `
//                 <html>
//                     <head>
//                         <title>Show Entry No Report</title>
//                         <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
//                         <style>
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
//                         .total-row { background-color: yellow; font-weight: bold; }
//                     </style>
//                     </head>
//                     <body>
//                         <div class="container mt-4">
//                             <h3 class="text-center">Show Entry No Report</h3>
//                             <button class="export-btn" onclick="downloadCSV()">Export to CSV</button>
//                             <table class="table table-bordered">
//                                 <thead>
//                                     <tr>
//                                         <th style="text-align: center;">Nature of Document</th>
//                                         <th style="text-align: center;">Sr. No. From</th>
//                                         <th style="text-align: center;">Sr. No. To</th>
//                                         <th style="text-align: center;">Total Number</th>
//                                         <th style="text-align: center;">Cancelled</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody>
//                                     ${reportData.map(row => `
//                                         <tr>
//                                             <td style="text-align: center;>${row["Nature of Document"] || ''}</td>
//                                             <td style="text-align: center;>${row["Sr. No. From"] || ''}</td>
//                                             <td style="text-align: center;>${row["Sr. No. To"] || ''}</td>
//                                             <td style="text-align: center;>${row["Total Number"] || ''}</td>
//                                             <td style="text-align: center;>${row["Cancelled"] || ''}</td>
//                                         </tr>
//                                     `).join('')}
//                                 </tbody>
//                             </table>
//                         </div>
//                         <script>
//                             function downloadCSV() {
//                                 const csvData = \`${JSON.stringify(reportData)}\`;
//                                 const parsedData = JSON.parse(csvData);
//                                 const columnOrder = ["Nature of Document","Sr. No. From","Sr. No. To","Total Number","Cancelled"]
//                                 const ws = XLSX.utils.json_to_sheet(parsedData, { header: columnOrder, skipHeader: false });
//                                 const csv = XLSX.utils.sheet_to_csv(ws);
//                                 const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//                                 const link = document.createElement("a");
//                                 link.href = URL.createObjectURL(blob);
//                                 link.setAttribute("download", "ShowEntryNo.csv");
//                                 document.body.appendChild(link);
//                                 link.click();
//                                 document.body.removeChild(link);
//                             }
//                         </script>
//                         <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.16.9/xlsx.full.min.js"></script>
//                     </body>
//                 </html>
//             `;
//             newTab.document.write(reportHtml);
//             newTab.document.close();
//         } else {
//             alert("Please allow pop-ups for this site to view the report.");
//         }
//     };

//     return (
//         <div className="d-flex flex-column align-items-center" style={{ marginTop: '5px' }}>
//             <button className="btn btn-primary mb-3" onClick={fetchShowEntryNo} disabled={loading} style={{
//                 width: '20%',
//                 height: '60px',
//             }}>
//                 {loading ? 'Loading...' : 'ShowEntryNo'}
//             </button>
//             {error && <div className="alert alert-danger">{error}</div>}
//         </div>
//     );
// };

// export default ShowEntryNo;
















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
    { label: 'Nature of Document', key: 'Nature of Document', numeric: false, isTotal: false },
    { label: 'Sr. No. From', key: 'Sr. No. From', numeric: false, isTotal: false },
    { label: 'Sr. No. To', key: 'Sr. No. To', numeric: false, isTotal: false },
    { label: 'Total Number', key: 'Total Number', numeric: true, isTotal: true },
    { label: 'Cancelled', key: 'Cancelled', numeric: true, isTotal: true },
];

const PRINT_COLUMNS = [
    { label: 'Nature of Document', key: 'Nature of Document', printWidth: 70 },
    { label: 'From No', key: 'Sr. No. From', printWidth: 35 },
    { label: 'To No', key: 'Sr. No. To', printWidth: 35 },
    { label: 'Total', key: 'Total Number', printWidth: 30, numeric: true, isTotal: true },
    { label: 'Cancelled', key: 'Cancelled', printWidth: 30, numeric: true, isTotal: true },
];

const ShowEntryNo = ({ fromDate, toDate, companyCode, yearCode }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [error, setError] = useState('');
    const [pdfPreview, setPdfPreview] = useState(null);

    // Listen for print trigger from dashboard window
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data === 'TRIGGER_ENTRY_PRINT') handleGeneratePDF();
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [data]);

    const grandTotals = useMemo(() => {
        const totals = { "Total Number": 0, "Cancelled": 0 };
        data.forEach(row => {
            Object.keys(totals).forEach(k => { totals[k] += parseFloat(row[k] || 0); });
        });
        return totals;
    }, [data]);

    const fetchShowEntryNo = async () => {
        try {
            setLoading(true);
            setError('');
            setPdfPreview(null);
            const response = await axios.get(`${API_URL}/ShowEntryNo-summary`, {
                params: { from_date: fromDate, to_date: toDate, Company_Code: companyCode, Year_Code: yearCode },
            });
            if (!response.data || response.data.length === 0) {
                Swal.fire({ icon: 'error', title: 'Data Not Found!', text: 'No entry records found for the selected range.' });
                return;
            }
            setData(response.data);
            openInNewWindow(response.data);
        } catch (err) {
            setError('Failed to fetch entry data');
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePDF = () => {
        if (data.length === 0) return;
        setIsPrinting(true);
        const rows = data.map(row => PRINT_COLUMNS.map(col => col.numeric ? (row[col.key] || 0) : (row[col.key] || '')));
        const footerRow = PRINT_COLUMNS.map(col => {
            if (col.isTotal) return { content: String(grandTotals[col.key] || 0), styles: { halign: 'right', fontStyle: 'bold', fillColor: [255, 249, 196] } };
            return col.label === 'Nature of Document' ? { content: 'GRAND TOTAL', styles: { fontStyle: 'bold', fillColor: [255, 249, 196] } } : '';
        });

        generateReportPDF({
            title: `Document Sequence Report`,
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
<html><head><title>Entry No Dashboard</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',sans-serif;padding:20px;background:#f4f7f6}
  h2{text-align:center;color:#2c3e50;margin-bottom:4px;font-size:22px}
  .sub{text-align:center; color: #7f8c8d;font-size:14px;margin-bottom:15px}
  .toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:10px}
  .search{border:1px solid #bdc3c7;border-radius:8px;padding:10px 15px;font-size:14px;width:320px;outline:none}
  .btn{padding:10px 20px;border-radius:8px;border:none;font-size:14px;font-weight:600;cursor:pointer;color:#fff;transition:0.2s}
  .btn-green{background:#27ae60}.btn-red{background:#e74c3c}
  .cards{display:flex;gap:15px;margin-bottom:15px;justify-content:center}
  .card{background:#fff;border-left:5px solid #3498db;border-radius:8px;padding:15px;min-width:180px;text-align:center;box-shadow:0 2px 5px rgba(0,0,0,0.1)}
  .card-label{font-size:11px;color:#95a5a6;font-weight:700;text-transform:uppercase}
  .card-value{font-size:18px;font-weight:800;color:#2c3e50;margin-top:5px}
  .wrap{max-height:600px;overflow:auto;border:1px solid #ddd;border-radius:10px;background:#fff}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{background:#34495e;color:#fff;padding:14px 12px;position:sticky;top:0;z-index:2;text-align:left;cursor:pointer}
  th.num{text-align:right}
  .sort-icon{font-size:14px;margin-left:5px;opacity:0.3}
  td{padding:10px 12px;border-bottom:1px solid #eee;white-space:nowrap}
  td.num{text-align:right}
  tr:nth-child(even) td{background:#fafafa}
  tr:hover td{background:#f1f2f6}
  tfoot tr td{background:#f1c40f33;font-weight:800;border-top:2px solid #f1c40f;position:sticky;bottom:0}
</style></head><body>
<h2>Show Entry No Summary</h2>
<div class="sub">${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}</div>
<div class="cards" id="cards"></div>
<div class="toolbar">
  <input class="search" id="searchBox" placeholder="Search document types..." oninput="filterTable()">
  <div style="display:flex;gap:10px">
    <button class="btn btn-red" onclick="window.opener.postMessage('TRIGGER_ENTRY_PRINT', '*')">Print PDF</button>
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
let currentSort = { key: 'Nature of Document', dir: 'asc' };

function render(data){
  const sum = k => data.reduce((a,r)=>a+parseFloat(r[k]||0),0);
  document.getElementById('cards').innerHTML = ['Total Number','Cancelled'].map(k=>\`
    <div class="card">
      <div class="card-label">\${k}</div>
      <div class="card-value">\${sum(k)}</div>
    </div>\`).join('');

  document.getElementById('hdr').innerHTML = COLS.map(c=> 
    \`<th class="\${c.numeric?'num':''}" onclick="handleSort('\${c.key}')">
        \${c.label} <span class="sort-icon">\${currentSort.key===c.key?(currentSort.dir==='asc'?'↑':'↓'):'↕'}</span>
      </th>\`).join('');

  document.getElementById('tbody').innerHTML = data.map(row=>\`<tr>\${COLS.map(c=>\`<td class="\${c.numeric?'num':''}">\${row[c.key]||0}</td>\`).join('')}</tr>\`).join('');
  document.getElementById('tfoot').innerHTML = COLS.map((c,i)=>\`<td class="\${c.numeric?'num':''}">\${i===0?'TOTAL':c.isTotal?sum(c.key):''}</td>\`).join('');
}

function handleSort(key) {
  currentSort.dir = (currentSort.key === key && currentSort.dir === 'asc') ? 'desc' : 'asc';
  currentSort.key = key;
  filtered.sort((a, b) => {
    let vA = a[key]||''; let vB = b[key]||'';
    return currentSort.dir === 'asc' ? (vA > vB ? 1 : -1) : (vA < vB ? 1 : -1);
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
  const ws = XLSX.utils.json_to_sheet(filtered);
  XLSX.utils.book_append_sheet(wb, ws, 'EntryNoReport');
  XLSX.writeFile(wb, 'ShowEntryNo.xlsx');
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
                width: '20%', height: '60px'
            }} onClick={fetchShowEntryNo} disabled={loading}>
                {loading ? <CircularProgress size={24} color="inherit" /> : "Show Entry No"}
            </button>

            {error && <Alert severity="error" sx={{ mt: 2, maxWidth: '400px', mx: 'auto' }}>{error}</Alert>}

            {pdfPreview && <PdfPreview pdfData={pdfPreview} label="EntryNo_Report" />}

            {(loading || isPrinting) && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(255,255,255,0.85)', zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <ScaleLoader color="#34495e" height={45} />
                    <Typography sx={{ mt: 2, fontWeight: 700, color: '#34495e' }}>
                        {isPrinting ? 'Generating Document Report...' : 'Fetching Entry Data...'}
                    </Typography>
                </div>
            )}
        </div>
    );
};

export default ShowEntryNo;
