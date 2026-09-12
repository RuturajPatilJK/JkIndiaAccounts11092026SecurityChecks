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
    { label: 'SR No', key: 'SR_No', numeric: false, isTotal: false },
    // { label: 'From Date',     key: 'fromDate',      numeric: false, isTotal: false },
    // { label: 'To Date',       key: 'ToDate',        numeric: false, isTotal: false },
    { label: 'Bill Date', key: 'Bill_Date', numeric: false, isTotal: false },
    { label: 'Name Of Party', key: 'Name_Of_Party', numeric: false, isTotal: false },
    { label: 'GST No', key: 'PartyGst_No', numeric: false, isTotal: false },
    { label: 'Pan', key: 'Pan', numeric: false, isTotal: false },
    { label: 'Tan', key: 'Tan', numeric: false, isTotal: false },
    { label: 'Taxable Amt', key: 'Taxable_Amt', numeric: true, isTotal: true },
    { label: 'CGST', key: 'CGST', numeric: true, isTotal: true },
    { label: 'SGST', key: 'SGST', numeric: true, isTotal: true },
    { label: 'IGST', key: 'IGST', numeric: true, isTotal: true },
    { label: 'TCS', key: 'TCS', numeric: true, isTotal: true },
    { label: 'TDS', key: 'TDS', numeric: true, isTotal: true },
    { label: 'Bill Amt', key: 'Bill_Amt', numeric: true, isTotal: true },
    { label: 'Party Email', key: 'Party_Email', numeric: false, isTotal: false },
];

const PRINT_COLUMNS = [
    { label: 'SR No', key: 'SR_No', printWidth: 15 },
    { label: 'Date', key: 'Bill_Date', printWidth: 15 },
    { label: 'Name Of Party', key: 'Name_Of_Party', printWidth: 60 },
    { label: 'Taxable Amt', key: 'Taxable_Amt', printWidth: 35, numeric: true, isTotal: true },
    { label: 'CGST', key: 'CGST', printWidth: 20, numeric: true, isTotal: true },
    { label: 'SGST', key: 'SGST', printWidth: 20, numeric: true, isTotal: true },
    { label: 'IGST', key: 'IGST', printWidth: 20, numeric: true, isTotal: true },
    // { label: 'TCS',           key: 'TCS',           printWidth: 20, numeric: true, isTotal: true },
    { label: 'TDS', key: 'TDS', printWidth: 20, numeric: true, isTotal: true },
    { label: 'Bill Amt', key: 'Bill_Amt', printWidth: 35, numeric: true, isTotal: true },
];

const PurchaseTCSTDSSummary = ({ fromDate, toDate, companyCode, yearCode, accode }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [error, setError] = useState('');
    const [pdfPreview, setPdfPreview] = useState(null);

    // Bridge for triggering PDF generation from the pop-up dashboard
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data === 'TRIGGER_PURCHASE_TCSTDS_PRINT') {
                handleGeneratePDF();
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [data]);

    const grandTotals = useMemo(() => {
        const t = { Taxable_Amt: 0, CGST: 0, SGST: 0, IGST: 0, TCS: 0, TDS: 0, Bill_Amt: 0 };
        data.forEach(row => {
            Object.keys(t).forEach(k => { t[k] += parseFloat(row[k] || 0); });
        });
        return t;
    }, [data]);

    const fetchPurchaseTCSTDSSummary = async () => {
        try {
            setLoading(true);
            setError('');
            setPdfPreview(null);
            const response = await axios.get(`${API_URL}/PurchaseTCSTDS-summary`, {
                params: {
                    from_date: fromDate,
                    to_date: toDate,
                    Company_Code: companyCode,
                    Year_Code: yearCode,
                    accode: accode
                },
            });

            if (!response.data || response.data.length === 0) {
                Swal.fire({ icon: 'error', title: 'Data Not Found!', text: 'No Purchase TCS/TDS records found.' });
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
            return col.label === 'SR No' ? { content: 'GRAND TOTAL', styles: { fontStyle: 'bold', fillColor: [255, 249, 196] } } : '';
        });

        generateReportPDF({
            title: 'Purchase TCS/TDS Summary',
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
<html><head><title>Purchase TCS/TDS</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',sans-serif;padding:15px;background:#f0f2ff}
  h2{text-align:center;color:#1a237e;margin-bottom:4px;font-size:20px}
  .sub{text-align:center;color:#5c6bc0;font-size:13px;margin-bottom:14px}
  .toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:8px}
  .search{border:1px solid #c5cae9;border-radius:6px;padding:7px 12px;font-size:13px;width:240px;outline:none}
  .btn{padding:7px 16px;border-radius:6px;border:none;font-size:13px;font-weight:600;cursor:pointer;color:#fff;transition:0.2s}
  .btn:active{transform:scale(0.96)}
  .btn-green{background:#2e7d32}.btn-red{background:#c62828}
  .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:12px}
  .card{background:#fff;border:1px solid #c5cae9;border-radius:8px;padding:8px 10px;text-align:center}
  .card-label{font-size:10px;color:#5c6bc0;font-weight:600;text-transform:uppercase}
  .card-value{font-size:13px;font-weight:700;color:#1a237e}
  .wrap{max-height:750px;overflow:auto;border:1px solid #c5cae9;border-radius:8px;box-shadow:0 4px 18px rgba(26,35,126,.1)}
  table{width:100%;border-collapse:collapse;font-size:12px;min-width:1800px}
  th{background:#1a237e;color:#fff;padding:10px 7px;position:sticky;top:0;z-index:2;text-align:left;cursor:pointer;user-select:none;transition:background 0.2s}
  th:hover{background:#283593}
  th.num{text-align:right}
  .sort-icon{font-size:14px;margin-left:6px;font-weight:bold;display:inline-block;vertical-align:middle;opacity:0.4;color:#fff}
  .sort-active{opacity:1;color:#ffeb3b}
  td{padding:6px 7px;border-bottom:1px solid #e8eaf6;white-space:nowrap}
  td.num{text-align:right}
  tr:nth-child(even) td{background:#f7f8fd}
  tr:hover td{background:#e8eaf6}
  tfoot tr td{background:#fff9c4;font-weight:700;border-top:2px solid #fbc02d;position:sticky;bottom:0}
</style></head><body>
<h2>Purchase TCS/TDS Summary </h2>
<div class="sub">Period: ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}</div>
<div class="cards" id="cards"></div>
<div class="toolbar">
  <input class="search" id="searchBox" placeholder="🔍 Search records..." oninput="filterTable()">
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
  document.getElementById('cards').innerHTML = ['Taxable_Amt','CGST','SGST','IGST','TCS','TDS','Bill_Amt'].map(k=>\`
    <div class="card">
      <div class="card-label">\${k.replace('_',' ')}</div>
      <div class="card-value">\${fmt(sum(k))}</div>
    </div>\`).join('');

  document.getElementById('hdr').innerHTML = COLS.map(c=> {
    const isSorted = currentSort.key === c.key;
    let icon = '↕';
    if(isSorted) icon = currentSort.dir === 'asc' ? '↑' : '↓';
    return \`<th class="\${c.numeric?'num':'txt'}" onclick="handleSort('\${c.key}')">\${c.label}<span class="sort-icon \${isSorted?'sort-active':''}">\${icon}</span></th>\`;
  }).join('');

  document.getElementById('tbody').innerHTML = data.map(row=>\`<tr>\${COLS.map(c=>\`<td class="\${c.numeric?'num':'txt'}">\${c.numeric?fmt(row[c.key]||0):(row[c.key]||'')}</td>\`).join('')}</tr>\`).join('');
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
    let valA = a[key] ?? ''; let valB = b[key] ?? '';
    if(!isNaN(valA) && !isNaN(valB) && valA !== '' && valB !== '') return currentSort.dir === 'asc' ? Number(valA)-Number(valB) : Number(valB)-Number(valA);
    valA = String(valA).toLowerCase(); valB = String(valB).toLowerCase();
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

function printPremiumPDF(){ window.opener.postMessage('TRIGGER_PURCHASE_TCSTDS_PRINT', '*'); }

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
  const wsData = [['Purchase TCS/TDS Summary'], ['Period: ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}'], [], headers, ...dataRows, [], totalRow];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'PurchaseTCSTDSSummary');
  XLSX.writeFile(wb, 'PurchaseTCSTDSSummary.xlsx');
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
                    padding: '12px 22px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(26,35,126,0.2)'
                }}
                onClick={fetchPurchaseTCSTDSSummary}
                disabled={loading}
            >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Purchase TCS/TDS Summary"}
            </button>

            {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
            {pdfPreview && <PdfPreview pdfData={pdfPreview} label="GSTPurchaseTCSTDSSummary" />}

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

export default PurchaseTCSTDSSummary;
