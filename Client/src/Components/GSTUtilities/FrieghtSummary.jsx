
// import React, { useState } from 'react';
// import axios from 'axios';
// import * as XLSX from 'xlsx';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import Swal from 'sweetalert2';

// const API_URL = process.env.REACT_APP_API;

// const FrieghtSummary = ({ fromDate, toDate, companyCode, yearCode, accode }) => {
//     const [loading, setLoading] = useState(false);

//     const columns = [
//         'Challan_No', 'DO_No', 'Date', 'Mill_Code', 'MillName', 'MillStateCode',
//         'Billed_To', 'BillToName', 'BillToStateCode', 'TransportName',
//         'TransportStateCode', 'Vehicle_No', 'Quintal', 'Rate', 'Amount',
//         'CGST', 'SGST', 'IGST', 'FinalAmount',
//     ];

//     const fetchFrieghtSummary = async () => {
//         try {
//             setLoading(true);
//             const response = await axios.get(`${API_URL}/frieghtbill-summary`, {
//                 params: {
//                     from_date: fromDate,
//                     to_date: toDate,
//                     Company_Code: companyCode,
//                     Year_Code: yearCode,
//                     accode: accode
//                 },
//             });

//             if (response.data.length === 0) {
//                 Swal.fire({
//                     icon: 'error',
//                     title: 'Data Not Found!',
//                     text: 'No Freight Summary data found.',
//                 });
//                 return;
//             }

//             openReportInNewTab(response.data);
//         } catch (err) {
//             Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to fetch data' });
//         } finally {
//             setLoading(false);
//         }
//     };

//     const exportToExcel = (data) => {
//         // Reorder data according to columns array
//         const orderedData = data.map(row => {
//             const orderedRow = {};
//             columns.forEach(col => {
//                 orderedRow[col] = row[col] || '';
//             });
//             return orderedRow;
//         });

//         // Calculate Totals
//         const totals = data.reduce((acc, row) => ({
//             Quintal: acc.Quintal + parseFloat(row.Quintal || 0),
//             Amount: acc.Amount + parseFloat(row.Amount || 0),
//             CGST: acc.CGST + parseFloat(row.CGST || 0),
//             SGST: acc.SGST + parseFloat(row.SGST || 0),
//             IGST: acc.IGST + parseFloat(row.IGST || 0),
//             FinalAmount: acc.FinalAmount + parseFloat(row.FinalAmount || 0),
//         }), { Quintal: 0, Amount: 0, CGST: 0, SGST: 0, IGST: 0, FinalAmount: 0 });

//         // Add totals row
//         const totalsRow = {};
//         columns.forEach(col => {
//             if (col === 'Quintal') totalsRow[col] = totals.Quintal.toFixed(2);
//             else if (col === 'Amount') totalsRow[col] = totals.Amount.toFixed(2);
//             else if (col === 'CGST') totalsRow[col] = totals.CGST.toFixed(2);
//             else if (col === 'SGST') totalsRow[col] = totals.SGST.toFixed(2);
//             else if (col === 'IGST') totalsRow[col] = totals.IGST.toFixed(2);
//             else if (col === 'FinalAmount') totalsRow[col] = totals.FinalAmount.toFixed(2);
//             else totalsRow[col] = '';
//         });
//         totalsRow['Challan_No'] = 'TOTALS';

//         orderedData.push(totalsRow);

//         // Create worksheet
//         const ws = XLSX.utils.json_to_sheet(orderedData, { header: columns });

//         // Set column widths for better readability
//         const colWidths = columns.map(col => ({ wch: 15 }));
//         ws['!cols'] = colWidths;

//         // Create workbook and save
//         const wb = XLSX.utils.book_new();
//         XLSX.utils.book_append_sheet(wb, ws, 'Freight Summary');
//         XLSX.writeFile(wb, `FreightSummary_${new Date().toISOString().slice(0, 10)}.xlsx`);
//     };

//     const openReportInNewTab = (data) => {
//         const reportWindow = window.open('', '_blank');
//         if (!reportWindow) return;

//         // Calculate Totals for the report
//         const totals = data.reduce((acc, row) => ({
//             Quintal: acc.Quintal + parseFloat(row.Quintal || 0),
//             Amount: acc.Amount + parseFloat(row.Amount || 0),
//             CGST: acc.CGST + parseFloat(row.CGST || 0),
//             SGST: acc.SGST + parseFloat(row.SGST || 0),
//             IGST: acc.IGST + parseFloat(row.IGST || 0),
//             FinalAmount: acc.FinalAmount + parseFloat(row.FinalAmount || 0),
//         }), { Quintal: 0, Amount: 0, CGST: 0, SGST: 0, IGST: 0, FinalAmount: 0 });

//         reportWindow.document.write(`
//             <html>
//                 <head>
//                     <title>Freight Bill Summary Report</title>
//                     <style>
//                         body { font-family: Arial, sans-serif; padding: 20px; }
//                         table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
//                         th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
//                         th { background-color: #f2f2f2; }
//                         .total-row { font-weight: bold; background-color: #ffffcc; }
//                         .btn-container { margin-bottom: 20px; text-align: center; }
//                         button { padding: 10px 20px; cursor: pointer; background: #28a745; color: white; border: none; border-radius: 4px; margin: 0 5px; }
//                         .print-btn { background: #007bff; }
//                     </style>
//                 </head>
//                 <body>
//                     <h2 style="text-align: center;">Freight Bill Summary Report</h2>
//                     <div class="btn-container">
//                         <button onclick="window.exportToExcel()">Export to Excel</button>
//                         <button class="print-btn" onclick="window.print()">Print</button>
//                     </div>
//                     <table id="reportTable">
//                         <thead>
//                             <tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr>
//                         </thead>
//                         <tbody>
//                             ${data.map(row => `
//                                 <tr>${columns.map(c => `<td>${row[c] || ''}</td>`).join('')}</tr>
//                             `).join('')}
//                             <tr class="total-row">
//                                 <td colspan="12" style="text-align: right;">Totals:</td>
//                                 <td>${totals.Quintal.toFixed(2)}</td>
//                                 <td></td>
//                                 <td>${totals.Amount.toFixed(2)}</td>
//                                 <td>${totals.CGST.toFixed(2)}</td>
//                                 <td>${totals.SGST.toFixed(2)}</td>
//                                 <td>${totals.IGST.toFixed(2)}</td>
//                                 <td>${totals.FinalAmount.toFixed(2)}</td>
//                             </tr>
//                         </tbody>
//                     </table>
//                     <script>
//                         window.exportToExcel = function() {
//                             const data = ${JSON.stringify(data)};
//                             const columns = ${JSON.stringify(columns)};

//                             // Reorder data according to columns array
//                             const orderedData = data.map(row => {
//                                 const orderedRow = {};
//                                 columns.forEach(col => {
//                                     orderedRow[col] = row[col] || '';
//                                 });
//                                 return orderedRow;
//                             });

//                             // Calculate totals
//                             const totals = {
//                                 Quintal: ${totals.Quintal},
//                                 Amount: ${totals.Amount},
//                                 CGST: ${totals.CGST},
//                                 SGST: ${totals.SGST},
//                                 IGST: ${totals.IGST},
//                                 FinalAmount: ${totals.FinalAmount}
//                             };

//                             // Add totals row
//                             const totalsRow = {};
//                             columns.forEach(col => {
//                                 if (col === 'Quintal') totalsRow[col] = totals.Quintal.toFixed(2);
//                                 else if (col === 'Amount') totalsRow[col] = totals.Amount.toFixed(2);
//                                 else if (col === 'CGST') totalsRow[col] = totals.CGST.toFixed(2);
//                                 else if (col === 'SGST') totalsRow[col] = totals.SGST.toFixed(2);
//                                 else if (col === 'IGST') totalsRow[col] = totals.IGST.toFixed(2);
//                                 else if (col === 'FinalAmount') totalsRow[col] = totals.FinalAmount.toFixed(2);
//                                 else totalsRow[col] = '';
//                             });
//                             totalsRow['Challan_No'] = 'TOTALS';

//                             orderedData.push(totalsRow);

//                             // Create worksheet
//                             const ws = XLSX.utils.json_to_sheet(orderedData, { header: columns });

//                             // Set column widths
//                             const colWidths = columns.map(col => ({ wch: 15 }));
//                             ws['!cols'] = colWidths;

//                             // Create workbook and save
//                             const wb = XLSX.utils.book_new();
//                             XLSX.utils.book_append_sheet(wb, ws, 'Freight Summary');
//                             XLSX.writeFile(wb, 'FreightSummary_' + new Date().toISOString().slice(0,10) + '.xlsx');
//                         }
//                     </script>
//                     <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
//                 </body>
//             </html>
//         `);
//         reportWindow.document.close();
//     };

//     return (
//         <div className="text-center">
//             <button
//                 className="btn btn-primary"
//                 onClick={fetchFrieghtSummary}
//                 disabled={loading}
//                 style={{
//                     width: '20%',
//                     height: '60px',
//                 }}
//             >
//                 {loading ? 'Loading...' : 'Freight Bill Summary'}
//             </button>
//         </div>
//     );
// };

// export default FrieghtSummary;























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
    { label: 'Challan No', key: 'Challan_No', numeric: false, isTotal: false, width: '5%' },
    { label: 'DO No', key: 'DO_No', numeric: false, isTotal: false, width: '5%' },
    { label: 'Date', key: 'Date', numeric: false, isTotal: false, width: '7%' },
    { label: 'Mill Name', key: 'MillName', numeric: false, isTotal: false, width: '12%' },
    { label: 'Billed To', key: 'BillToName', numeric: false, isTotal: false, width: '12%' },
    { label: 'Transport', key: 'TransportName', numeric: false, isTotal: false, width: '12%' },
    { label: 'Vehicle No', key: 'Vehicle_No', numeric: false, isTotal: false, width: '8%' },
    { label: 'Quintal', key: 'Quintal', numeric: true, isTotal: true, width: '6%' },
    { label: 'Rate', key: 'Rate', numeric: true, isTotal: false, width: '5%' },
    { label: 'Amount', key: 'Amount', numeric: true, isTotal: true, width: '7%' },
    { label: 'CGST', key: 'CGST', numeric: true, isTotal: true, width: '5%' },
    { label: 'SGST', key: 'SGST', numeric: true, isTotal: true, width: '5%' },
    { label: 'IGST', key: 'IGST', numeric: true, isTotal: true, width: '5%' },
    { label: 'Final Amount', key: 'FinalAmount', numeric: true, isTotal: true, width: '8%' },
];

const PRINT_COLUMNS = [
    { label: 'Date', key: 'Date', printWidth: 25 },
    { label: 'Mill Name', key: 'MillName', printWidth: 50 },
    { label: 'Party', key: 'BillToName', printWidth: 50 },
    { label: 'Vehicle No', key: 'Vehicle_No', printWidth: 30 },
    { label: 'Quintal', key: 'Quintal', printWidth: 25, numeric: true, isTotal: true },
    { label: 'Amount', key: 'Amount', printWidth: 30, numeric: true, isTotal: true },
    { label: 'CGST', key: 'CGST', printWidth: 20, numeric: true, isTotal: true },
    { label: 'SGST', key: 'SGST', printWidth: 20, numeric: true, isTotal: true },
    { label: 'IGST', key: 'IGST', printWidth: 20, numeric: true, isTotal: true },
    { label: 'Final Amount', key: 'FinalAmount', printWidth: 30, numeric: true, isTotal: true },
];

const FrieghtSummary = ({ fromDate, toDate, companyCode, yearCode, accode }) => {
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
        const t = { Quintal: 0, Amount: 0, CGST: 0, SGST: 0, IGST: 0, FinalAmount: 0 };
        data.forEach(row => {
            Object.keys(t).forEach(k => { t[k] += parseFloat(row[k] || 0); });
        });
        return t;
    }, [data]);

    const fetchFrieghtSummary = async () => {
        try {
            setLoading(true);
            setError('');
            setPdfPreview(null);
            const response = await axios.get(`${API_URL}/frieghtbill-summary`, {
                params: {
                    from_date: fromDate,
                    to_date: toDate,
                    Company_Code: companyCode,
                    Year_Code: yearCode,
                    accode: accode
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
            return col.label === 'Challan' ? { content: 'TOTAL', styles: { fontStyle: 'bold', fillColor: [255, 249, 196] } } : '';
        });

        generateReportPDF({
            title: 'Freight Bill Summary',
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
<html><head><title>Freight Summary</title>
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
  table{width:100%;border-collapse:collapse;font-size:11px;min-width:1800px}
  th{background:#1a237e;color:#fff;padding:12px 7px;position:sticky;top:0;z-index:2;text-align:left;cursor:pointer;user-select:none}
  th.num{text-align:right}
  .sort-icon{font-size:14px;margin-left:6px;opacity:0.4}
  .sort-active{opacity:1;color:#ffeb3b}
  td{padding:6px 7px;border-bottom:1px solid #e8eaf6;white-space:nowrap}
  td.num{text-align:right}
  tr:nth-child(even) td{background:#f7f8fd}
  tr:hover td{background:#e8eaf6}
  tfoot tr td{background:#fff9c4;font-weight:700;border-top:2px solid #fbc02d;position:sticky;bottom:0}
</style></head><body>
<h2>Freight Bill Summary</h2>
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
let currentSort = { key: 'Challan_No', dir: 'asc' };

function fmt(v){ return v == null || v === '' ? '' : Number(v).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2}); }

function render(data){
  const sum = k => data.reduce((a,r)=>a+parseFloat(r[k]||0),0);
  document.getElementById('cards').innerHTML = ['Quintal','Amount','CGST','SGST','IGST','FinalAmount'].map(k=>\`
    <div class="card">
      <div class="card-label">\${k.replace(/([A-Z])/g, ' \$1')}</div>
      <div class="card-value">\${fmt(sum(k))}</div>
    </div>\`).join('');

  document.getElementById('hdr').innerHTML = COLS.map(c=> {
    const isSorted = currentSort.key === c.key;
    let icon = '↕'; 
    if(isSorted) icon = currentSort.dir === 'asc' ? '↑' : '↓';
    return \`<th class="\${c.numeric?'num':'txt'}" onclick="handleSort('\${c.key}')">
        \${c.label} <span class="sort-icon \${isSorted ? 'sort-active' : ''}">\${icon}</span>
      </th>\`;
  }).join('');

  document.getElementById('tbody').innerHTML = data.map(row=>\`<tr>\${COLS.map(c=>\`<td class="\${c.numeric?'num':'txt'}">\${c.numeric?fmt(row[c.key]||0):(row[c.key]||'')}</td>\`).join('')}</tr>\`).join('');
  document.getElementById('tfoot').innerHTML = COLS.map((c,i)=>\`<td class="\${c.numeric?'num':'txt'}">\${i===0?'TOTAL':c.isTotal?fmt(sum(c.key)):''}</td>\`).join('');
}

function handleSort(key) {
  if (currentSort.key === key) { currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc'; } 
  else { currentSort.key = key; currentSort.dir = 'asc'; }
  filtered.sort((a, b) => {
    let valA = a[key] ?? ''; let valB = b[key] ?? '';
    if(!isNaN(valA) && !isNaN(valB) && valA !== '' && valB !== '') return currentSort.dir === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
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

function printPremiumPDF(){ window.opener.postMessage('TRIGGER_PREMIUM_PRINT', '*'); }

function exportXlsx(){
  const wb = XLSX.utils.book_new();
  const headers = COLS.map(c => c.label);
  const dataRows = filtered.map(row => COLS.map(c => c.numeric ? parseFloat(row[c.key] || 0) : (row[c.key] || '')));
  const sum = k => filtered.reduce((a,r)=>a+parseFloat(r[k]||0),0);
  const totalRow = COLS.map((c, i) => i === 0 ? 'TOTAL' : (c.isTotal ? parseFloat(sum(c.key).toFixed(2)) : ''));
  const wsData = [['Freight Bill Summary Report'], ['${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}'], [], headers, ...dataRows, [], totalRow];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Freight');
  XLSX.writeFile(wb, 'FreightSummary.xlsx');
}
render(RAW);
</script></body></html>`);
        newWindow.document.close();
    };

    return (
        <div style={{ padding: '5px', textAlign: 'center' }}>
            <button style={{
                marginTop: '10px',
                background: '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 10px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(26,35,126,0.2)',
                width: '20%',
                height: '60px'
            }} onClick={fetchFrieghtSummary} disabled={loading}>
                {loading ? <CircularProgress size={24} color="inherit" /> : "Freight Bill Summary"}
            </button>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            {pdfPreview && <PdfPreview pdfData={pdfPreview} label="GSTFreightBillSummary" />}
            {(loading || isPrinting) && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(255,255,255,0.8)', zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <ScaleLoader color="#1a237e" height={40} />
                    <Typography sx={{ mt: 2, fontWeight: 700, color: '#1a237e' }}>
                        {isPrinting ? 'Generating PDF...' : 'Loading Data...'}
                    </Typography>
                </div>
            )}
        </div>
    );
};

export default FrieghtSummary;