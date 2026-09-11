// import React, { useState } from 'react';
// import axios from 'axios';
// import * as XLSX from 'xlsx';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import Swal from 'sweetalert2';
// import { CircularProgress } from '@mui/material';

// const API_URL = process.env.REACT_APP_API;

// const PurchaseTCSSummary = ({ fromDate, toDate, companyCode, yearCode ,Tran_type,accode}) => {
//     const [data, setData] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');
//     const [isDataFetched, setIsDataFetched] = useState(false);

//     const fetchPurchaseTCSSummary = async () => {
//         try {
//             setLoading(true);
//             setError('');
//             const response = await axios.get(`${API_URL}/PurchaseTCS-summary`, {
//                 params: {
//                     from_date: fromDate,
//                     to_date: toDate,
//                     Company_Code: companyCode,
//                     Year_Code: yearCode,
//                     Tran_type : Tran_type,
//                     accode :accode
//                 },
//             });
//             if (response.data.length === 0) {
//                 Swal.fire({
//                     icon: 'error',
//                     title: 'Data Not Found.!',
//                     text: 'No Purchase TCS data found for the selected date range.',
//                 });
//                 return;
//             }
//             setData(response.data);
//             setIsDataFetched(true);
//         } catch (err) {
//             setError('Failed to fetch data');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const exportToXlsx = () => {
//         const ws = XLSX.utils.json_to_sheet(data);
//         const wb = XLSX.utils.book_new();
//         XLSX.utils.book_append_sheet(wb, ws, 'PurchaseTCSSummary');
//         XLSX.writeFile(wb, 'PurchaseTCSSummary.xlsx');
//     };

//     const exportToCsv = () => {
//         if (!data || data.length === 0) {
//             console.error("No data to export");
//             return;
//         }

//         const columnOrder = Object.keys(data[0]);

//         const ws = XLSX.utils.json_to_sheet(data, { header: columnOrder, skipHeader: false });

//         const csv = XLSX.utils.sheet_to_csv(ws);

//         const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//         const link = document.createElement("a");
//         link.href = URL.createObjectURL(blob);
//         link.setAttribute("download", "PurchaseTCSSummary.csv");
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//     };

//     // Define the column order explicitly
//     const columns = [
//         'SR_No',
//         'PSNo',
//         'date',
//         'Name Of Party',
//         'Pan',
//         'Tan',
//         'Address',
//         'Net',
//         'CGST',
//         'SGST',
//         'IGST',
//         'TCS',  
//     ];

//     const calculateTotals = () => {
//         let totals = {
//             Taxable_Amt: 0,
//             CGST: 0,
//             SGST: 0,
//             IGST: 0,
//             Bill_Amt: 0
//         };
//         return totals;
//     };

//     const totals = calculateTotals();

//     return (
//         <div className="d-flex flex-column align-items-center" style={{ marginTop: '5px' }}>
//             <button
//                 className="btn btn-primary"
//                 onClick={fetchPurchaseTCSSummary}
//                 disabled={loading}
//                 style={{
//                     width: '20%',  
//                     height: '60px',  
//                 }}
//             >
//                 {loading ? <CircularProgress size={24} /> : 'Purchase TCS Summary'}
//             </button>

//             {isDataFetched && (
//                 <button className="btn btn-success mt-3" style={{ float: 'left' }} onClick={exportToCsv}>
//                     Export to CSV
//                 </button>

//             )}

//             {error && <div className="alert alert-danger">{error}</div>}

//             {data.length > 0 && (
//                 <>
//                     <table className="table table-bordered mt-3" style={{ width: '80%' }}>
//                         <thead>
//                             <tr>
//                                 {columns.map((column) => (
//                                     <th key={column}>{column}</th>
//                                 ))}
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {data.map((row, index) => (
//                                 <tr key={index}>
//                                     {columns.map((column, idx) => (
//                                         <td key={idx}>{row[column] || ''}</td>
//                                     ))}
//                                 </tr>
//                             ))}

//                             {/* <tr >
//                                 <td style={{ fontWeight: 'bold', backgroundColor: 'yellow' }} colSpan="6"></td>
//                                 <td style={{ fontWeight: 'bold', backgroundColor: 'yellow' }}></td>
//                                 <td style={{ fontWeight: 'bold', backgroundColor: 'yellow' }}>{totals.TaxableAmount.toFixed(2)}</td>
//                                 <td style={{ fontWeight: 'bold', backgroundColor: 'yellow' }}>{totals.CGST.toFixed(2)}</td>
//                                 <td style={{ fontWeight: 'bold', backgroundColor: 'yellow' }}>{totals.SGST.toFixed(2)}</td>
//                                 <td style={{ fontWeight: 'bold', backgroundColor: 'yellow' }}>{totals.IGST.toFixed(2)}</td>
//                                 <td style={{ fontWeight: 'bold', backgroundColor: 'yellow' }}>{totals.Bill_Amount.toFixed(2)}</td>
//                                 <td style={{ fontWeight: 'bold', backgroundColor: 'yellow' }}></td>
//                             </tr> */}
//                         </tbody>
//                     </table>
//                 </>
//             )}
//         </div>
//     );
// };

// export default PurchaseTCSSummary;


















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
    { label: 'PS No', key: 'PSNo', numeric: false, isTotal: false },
    { label: 'Date', key: 'date', numeric: false, isTotal: false },
    { label: 'Name Of Party', key: 'Name Of Party', numeric: false, isTotal: false },
    { label: 'Pan No', key: 'Pan', numeric: false, isTotal: false },
    { label: 'Tan No', key: 'Tan', numeric: false, isTotal: false },
    { label: 'Address', key: 'Address', numeric: false, isTotal: false },
    { label: 'Net Amount', key: 'Net', numeric: true, isTotal: true },
    { label: 'CGST', key: 'CGST', numeric: true, isTotal: true },
    { label: 'SGST', key: 'SGST', numeric: true, isTotal: true },
    { label: 'IGST', key: 'IGST', numeric: true, isTotal: true },
    { label: 'TCS', key: 'TCS', numeric: true, isTotal: true },
];

const PRINT_COLUMNS = [
    { label: 'PS No', key: 'PSNo', printWidth: 20 },
    { label: 'Date', key: 'date', printWidth: 25 },
    { label: 'Party Name', key: 'Name Of Party', printWidth: 85 },

    { label: 'CGST', key: 'CGST', printWidth: 22, numeric: true, isTotal: true },
    { label: 'SGST', key: 'SGST', printWidth: 22, numeric: true, isTotal: true },
    { label: 'IGST', key: 'IGST', printWidth: 22, numeric: true, isTotal: true },
    { label: 'TCS', key: 'TCS', printWidth: 22, numeric: true, isTotal: true },
        { label: 'Net Amount', key: 'Net', printWidth: 30, numeric: true, isTotal: true },
];

const PurchaseTCSSummary = ({ fromDate, toDate, companyCode, yearCode, Tran_type, accode }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [error, setError] = useState('');
    const [pdfPreview, setPdfPreview] = useState(null);

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data === 'TRIGGER_PURCHASE_TCS_PRINT') {
                handleGeneratePDF();
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [data]);

    const grandTotals = useMemo(() => {
        const t = { Net: 0, CGST: 0, SGST: 0, IGST: 0, TCS: 0 };
        data.forEach(row => {
            Object.keys(t).forEach(k => { t[k] += parseFloat(row[k] || 0); });
        });
        return t;
    }, [data]);

    const fetchPurchaseTCSSummary = async () => {
        try {
            setLoading(true);
            setError('');
            setPdfPreview(null);
            const response = await axios.get(`${API_URL}/PurchaseTCS-summary`, {
                params: { from_date: fromDate, to_date: toDate, Company_Code: companyCode, Year_Code: yearCode, Tran_type, accode }
            });

            if (!response.data || response.data.length === 0) {
                Swal.fire({ icon: 'error', title: 'Data Not Found!', text: 'No Purchase TCS data found.' });
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
            return col.label === 'PS No' ? { content: 'TOTAL', styles: { fontStyle: 'bold', fillColor: [255, 249, 196] } } : '';
        });

        generateReportPDF({
            title: 'Purchase TCS Summary',
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
<html><head><title>Purchase TCS Summary</title>
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
  .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px}
  .card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:12px;text-align:center;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05)}
  .card-label{font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase}
  .card-value{font-size:16px;font-weight:800;color:#1e293b;margin-top:6px}
  .wrap{max-height:680px;overflow:auto;border-radius:12px;border:1px solid #e2e8f0;background:#fff}
  table{width:100%;border-collapse:collapse;font-size:13px;min-width:1800px}
  th{background:#1a237e;color:#fff;padding:12px 10px;position:sticky;top:0;z-index:2;text-align:left;cursor:pointer;user-select:none}
  th.num{text-align:right}
  td{padding:10px;border-bottom:1px solid #f1f5f9;white-space:nowrap;color:#334155}
  td.num{text-align:right;font-family:monospace;font-size:14px}
  tr:hover td{background:#f8fafc}
  tfoot tr td{background:#fff9c4;font-weight:700;border-top:2px solid #fbc02d;position:sticky;bottom:0}
</style></head><body>
<h2>Purchase TCS Summary Report</h2>
<div class="sub">${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}</div>
<div class="cards" id="cards"></div>
<div class="toolbar">
  <input class="search" id="searchBox" placeholder="Search Party, PAN, Address..." oninput="filterTable()">
  <div style="display:flex;gap:10px">
    <button class="btn btn-pdf" onclick="printReport()">Print PDF</button>
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
  document.getElementById('cards').innerHTML = ['Net','CGST','SGST','IGST','TCS'].map(k=>\`
    <div class="card">
      <div class="card-label">\${k === 'Net' ? 'Net Amount' : k}</div>
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

function printReport(){ window.opener.postMessage('TRIGGER_PURCHASE_TCS_PRINT', '*'); }

function exportXlsx(){
  const wb = XLSX.utils.book_new();
  const headers = COLS.map(c => c.label);
  const dataRows = filtered.map(row => COLS.map(c => c.numeric ? parseFloat(row[c.key] || 0) : (row[c.key] || '')));
  const ws = XLSX.utils.aoa_to_sheet([['Purchase TCS Summary'], ['Period: ${fromDate} to ${toDate}'], [], headers, ...dataRows]);
  XLSX.utils.book_append_sheet(wb, ws, 'PurchaseTCS_Summary');
  XLSX.writeFile(wb, 'PurchaseTCS_Summary.xlsx');
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
                onClick={fetchPurchaseTCSSummary}
                disabled={loading}
            >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Purchase TCS Summary"}
            </button>

            {error && <Alert severity="error" sx={{ mt: 2, maxWidth: '450px', mx: 'auto' }}>{error}</Alert>}
            {pdfPreview && <PdfPreview pdfData={pdfPreview} label="GSTPurchaseTCSSmmary" />}

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

export default PurchaseTCSSummary;

