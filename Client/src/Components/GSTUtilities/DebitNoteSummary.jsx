import React, { useState, useMemo, useEffect } from 'react';
import axios from "../../api/axiosInstance";
import * as XLSX from 'xlsx';
import { CircularProgress, Alert, Typography, Box, Button } from '@mui/material';
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
    { label: 'SR No',           key: 'SR_No',          numeric: false, isTotal: false },
    { label: 'DN No',           key: 'DebitNote_No',   numeric: false, isTotal: false },
    { label: 'Type',            key: 'Tran_Type',      numeric: false, isTotal: false }, // Added Type to UI
    { label: 'GST No',          key: 'PartyGSTNo',     numeric: false, isTotal: false },
    { label: 'Code',            key: 'PartyCode',      numeric: false, isTotal: false },
    { label: 'Party Name',      key: 'PartyName',      numeric: false, isTotal: false },
    { label: 'State',           key: 'PartyStateCode', numeric: false, isTotal: false },
    { label: 'Date',            key: 'Date',           numeric: false, isTotal: false },
    { label: 'Quintal',         key: 'Quintal',        numeric: true,  isTotal: true },
    { label: 'Rate',            key: 'Rate',           numeric: true,  isTotal: false },
    { label: 'Taxable Amt',     key: 'TaxableAmount',  numeric: true,  isTotal: true },
    { label: 'CGST',            key: 'CGST',           numeric: true,  isTotal: true },
    { label: 'SGST',            key: 'SGST',           numeric: true,  isTotal: true },
    { label: 'IGST',            key: 'IGST',           numeric: true,  isTotal: true },
    { label: 'Final Amt',       key: 'Final_Amount',   numeric: true,  isTotal: true },
    { label: 'ACK No',          key: 'ACKNO',          numeric: false, isTotal: false },
];

const PRINT_COLUMNS = [
    { label: 'DN No',       key: 'DebitNote_No',   printWidth: 15 },
    { label: 'Type',        key: 'Tran_Type',      printWidth: 12 }, // Added Type to Print
    { label: 'Date',        key: 'Date',           printWidth: 20 },
    { label: 'Party Name',  key: 'PartyName',      printWidth: 65 },
    { label: 'Quintal',     key: 'Quintal',        printWidth: 18, numeric: true, isTotal: true },
    { label: 'Taxable Amt', key: 'TaxableAmount',  printWidth: 25, numeric: true, isTotal: true },
    { label: 'CGST',        key: 'CGST',           printWidth: 18, numeric: true, isTotal: true },
    { label: 'SGST',        key: 'SGST',           printWidth: 18, numeric: true, isTotal: true },
    { label: 'IGST',        key: 'IGST',           printWidth: 18, numeric: true, isTotal: true },
    { label: 'Final Amt',   key: 'Final_Amount',   printWidth: 30, numeric: true, isTotal: true },
];

const DebitnoteSummary = ({ fromDate, toDate, companyCode, yearCode, accode, Tran_Type }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [error, setError] = useState('');
    const [pdfPreview, setPdfPreview] = useState(null);

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data === 'TRIGGER_DEBITNOTE_PRINT') {
                handleGeneratePDF();
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [data]);

    const grandTotals = useMemo(() => {
        const t = { Quintal: 0, TaxableAmount: 0, CGST: 0, SGST: 0, IGST: 0, Final_Amount: 0 };
        data.forEach(row => {
            Object.keys(t).forEach(k => { t[k] += parseFloat(row[k] || 0); });
        });
        return t;
    }, [data]);

    const fetchDebitnoteSummary = async () => {
        try {
            setLoading(true);
            setError('');
            setPdfPreview(null);
            const response = await axios.get(`${API_URL}/Debitnote-summary`, {
                params: { from_date: fromDate, to_date: toDate, Company_Code: companyCode, Year_Code: yearCode, accode, Tran_Type }
            });

            if (!response.data || response.data.length === 0) {
                Swal.fire({ icon: 'error', title: 'Data Not Found!', text: 'No records found.' });
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
            return col.label === 'DN No' ? { content: 'TOTAL', styles: { fontStyle: 'bold', fillColor: [255, 249, 196] } } : '';
        });

        generateReportPDF({
            title: 'Debit Note Summary',
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
<html><head><title>Debit Note Summary</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',sans-serif;padding:20px;background:#f0f2ff}
  h2{text-align:center;color:#1a237e;margin-bottom:4px;font-size:20px}
  .sub{text-align:center;color:#000;font-size:13px;margin-bottom:14px}
  .toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:8px}
  .search{border:1px solid #c5cae9;border-radius:6px;padding:7px 12px;font-size:13px;width:300px;outline:none}
  .btn{padding:7px 16px;border-radius:6px;border:none;font-size:13px;font-weight:600;cursor:pointer;color:#fff;transition:0.2s}
  .btn-xlsx{background:#2e7d32}.btn-pdf{background:#c62828}
  .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:12px}
  .card{background:#fff;border:1px solid #c5cae9;border-radius:8px;padding:8px 10px;text-align:center}
  .card-label{font-size:10px;color:#5c6bc0;font-weight:600;text-transform:uppercase}
  .card-value{font-size:14px;font-weight:700;color:#1a237e}
  .wrap{max-height:750px;overflow:auto;border:1px solid #c5cae9;border-radius:8px}
  table{width:100%;border-collapse:collapse;font-size:12px;min-width:1900px}
  th{background:#1a237e;color:#fff;padding:12px 7px;position:sticky;top:0;z-index:2;text-align:left;cursor:pointer}
  th.num{text-align:right}
  td{padding:6px 7px;border-bottom:1px solid #e8eaf6;white-space:nowrap}
  td.num{text-align:right}
  tr:nth-child(even) td{background:#f7f8fd}
  tr:hover td{background:#e8eaf6}
  tfoot tr td{background:#fff9c4;font-weight:700;border-top:2px solid #fbc02d;position:sticky;bottom:0}
</style></head><body>
<h2>Debit Note Summary Dashboard</h2>
<div class="sub">${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}</div>
<div class="cards" id="cards"></div>
<div class="toolbar">
  <input class="search" id="searchBox" placeholder="Search..." oninput="filterTable()">
  <div style="display:flex;gap:8px">
    <button class="btn btn-pdf" onclick="printReport()">Print</button>
    <button class="btn btn-xlsx" onclick="exportXlsx()">Export Excel</button>
  </div>
</div>
<div class="wrap"><table>
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
  document.getElementById('cards').innerHTML = ['Quintal','TaxableAmount','CGST','SGST','IGST','Final_Amount'].map(k=>\`
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

function printReport(){ window.opener.postMessage('TRIGGER_DEBITNOTE_PRINT', '*'); }

function exportXlsx(){
  const wb = XLSX.utils.book_new();
  const headers = [...COLS.map(c => c.label)];
  const dataRows = filtered.map(row => COLS.map(c => c.numeric ? parseFloat(row[c.key] || 0) : (row[c.key] || '')));
  
  // Total Row logic for Excel
  const sum = k => filtered.reduce((a,r)=>a+parseFloat(r[k]||0),0);
  const footerRow = COLS.map((c, i) => i === 0 ? 'TOTAL' : c.isTotal ? parseFloat(sum(c.key).toFixed(2)) : '');

  const ws = XLSX.utils.aoa_to_sheet([['Debit Note Summary'], ['Period: ${fromDate} to ${toDate}'], [], headers, ...dataRows, footerRow]);
  XLSX.utils.book_append_sheet(wb, ws, 'Summary');
  XLSX.writeFile(wb, 'DebitNote_Summary.xlsx');
}
render(RAW);
</script></body></html>`);
        newWindow.document.close();
    };

    return (
        <Box sx={{ textAlign: 'center', marginTop: '5px' }}>
            <Button
                variant="contained"
                onClick={fetchDebitnoteSummary}
                disabled={loading}
                style={{ background: '#007bff', color: '#fff', borderRadius: '8px', padding: '12px 40px', fontWeight: 600, cursor: 'pointer' }}
            >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Debitnote Summary'}
            </Button>

            {error && <Alert severity="error" sx={{ mt: 2, maxWidth: '450px', mx: 'auto' }}>{error}</Alert>}
            {pdfPreview && <PdfPreview pdfData={pdfPreview} label="GSTDebitNoteSummary" />}

            {(loading || isPrinting) && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(255,255,255,0.8)', zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <ScaleLoader color="#1a237e" height={50} width={6} />
                    <Typography sx={{ mt: 3, fontWeight: 700, color: '#1a237e' }}>
                        {isPrinting ? 'Generating PDF...' : 'Loading Data...'}
                    </Typography>
                </div>
            )}
        </Box>
    );
};

export default DebitnoteSummary;