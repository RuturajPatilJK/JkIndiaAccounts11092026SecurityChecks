import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';
import { ScaleLoader } from 'react-spinners';
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import { FormaDateBalanceSheet } from '../../../Common/FormatFunctions/FormatDate';
import { ConvertNumberToWord } from '../../../Common/FormatFunctions/ConvertNumberToWord';
import PdfPreview from "../../../Common/PDFPreview";
import BackButton from "../../../Common/Buttons/BackButton";
import CommonPrintView from '../../../Common/ReportCommon/CommonPrintView';
import { generateReportPDF } from '../../../Common/ReportCommon/CommonPDFGenerator';
import HeaderJK from '../../../Assets/HeaderJK.png';
import FooterJK from '../../../Assets/FooterJK.png';

import '../../../Common/Fonts/Signika-Bold-normal';
import '../../../Common/Fonts/Signika-Regular-normal';

import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Typography, TableFooter, TableSortLabel,
} from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';

const API_URL = process.env.REACT_APP_API;

// ─── Column definitions ────────────────────────────────────────────────────────

const SCREEN_COLUMNS = [
  { label: 'Date', key: 'doc_date', width: '8%', center: true },
  { label: 'Item Name', key: 'item_name', width: '18%' },
  { label: 'Open Qty', key: 'op_qty', width: '8%', numeric: true },
  { label: 'Open Value', key: 'op_value', width: '9%', numeric: true },
  { label: 'Purchase Qty', key: 'purc_qty', width: '8%', numeric: true },
  { label: 'Purchase Value', key: 'purc_value', width: '9%', numeric: true },
  { label: 'Sale Qty', key: 'sale_qty', width: '8%', numeric: true },
  { label: 'Sale Value', key: 'sale_val', width: '9%', numeric: true },
  { label: 'Close Qty', key: 'close_qty', width: '8%', numeric: true },
  { label: 'Close Value', key: 'close_val', width: '9%', numeric: true },
  { label: 'Day Diff', key: 'day_diff', width: '6%', numeric: true },
];

const PRINT_COLUMNS = [
  { label: 'Date', key: 'doc_date', printWidth: '20mm', center: true },
  { label: 'Item Name', key: 'item_name', printWidth: '32mm' },
  { label: 'Open Qty', key: 'op_qty', printWidth: '18mm', numeric: true },
  { label: 'Open Value', key: 'op_value', printWidth: '20mm', numeric: true },
  { label: 'Purchase Qty', key: 'purc_qty', printWidth: '18mm', numeric: true },
  { label: 'Purchase Value', key: 'purc_value', printWidth: '20mm', numeric: true },
  { label: 'Sale Qty', key: 'sale_qty', printWidth: '18mm', numeric: true },
  { label: 'Sale Value', key: 'sale_val', printWidth: '20mm', numeric: true },
  { label: 'Close Qty', key: 'close_qty', printWidth: '18mm', numeric: true },
  { label: 'Close Value', key: 'close_val', printWidth: '20mm', numeric: true },
  { label: 'Day Diff', key: 'day_diff', printWidth: '16mm', numeric: true },
];

const PRINT_NUMERIC_COLS = PRINT_COLUMNS
  .map((c, i) => (c.numeric ? i : null))
  .filter(i => i !== null);

const PRINT_CENTER_COLS = PRINT_COLUMNS
  .map((c, i) => (c.center ? i : null))
  .filter(i => i !== null);

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return [
    String(d.getDate()).padStart(2, '0'),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getFullYear()),
  ].join('/');
};

const num = (v) => parseFloat(v) || 0;

// ─── Component ─────────────────────────────────────────────────────────────────

const StockBookReport = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const companyCode = sessionStorage.getItem('Company_Code');
  const Year_Code = sessionStorage.getItem('Year_Code');
  const companyName = sessionStorage.getItem('Company_Name');
  const companyGST = sessionStorage.getItem('Company_GSTNO');

  const searchParams = new URLSearchParams(location.search);
  const itemCode = searchParams.get('itemCode');
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfPreview, setPdfPreview] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(
          `${API_URL}/report-stock-book?fromDate=${fromDate}&company_code=${companyCode}&Item_Code=${itemCode}&ToDate=${toDate}&Year_Code=${Year_Code}`
        );
        const json = await res.json();

        // Filter by date range and flatten with computed day_diff
        const filtered = (json.data || [])
          .filter((item) => {
            const d = new Date(item.doc_date);
            return d >= new Date(fromDate) && d <= new Date(toDate);
          })
          .map((item) => ({
            ...item,
            day_diff: num(item.purc_qty) - num(item.sale_qty),
          }));

        setReportData(filtered);
      } catch (err) {
        console.error(err);
        setError('Error fetching stock book report');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [fromDate, toDate, companyCode, Year_Code, itemCode]);

  // ── Sorting ────────────────────────────────────────────────────────────────
  const requestSort = (key) =>
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));

  const sortedData = useMemo(() => {
    const items = [...reportData];
    if (sortConfig.key) {
      items.sort((a, b) => {
        const va = a[sortConfig.key];
        const vb = b[sortConfig.key];
        const na = Number(va), nb = Number(vb);
        const compare = isNaN(na) || isNaN(nb)
          ? String(va).localeCompare(String(vb))
          : na - nb;
        return sortConfig.direction === 'asc' ? compare : -compare;
      });
    }
    return items;
  }, [reportData, sortConfig]);

  // ── Grand Totals ──────────────────────────────────────────────────────────
  const grandTotals = useMemo(() =>
    reportData.reduce((acc, item) => {
      acc.op_qty += num(item.op_qty);
      acc.op_value += num(item.op_value);
      acc.purc_qty += num(item.purc_qty);
      acc.purc_value += num(item.purc_value);
      acc.sale_qty += num(item.sale_qty);
      acc.sale_val += num(item.sale_val);
      acc.close_qty += num(item.close_qty);
      acc.close_val += num(item.close_val);
      return acc;
    }, { op_qty: 0, op_value: 0, purc_qty: 0, purc_value: 0, sale_qty: 0, sale_val: 0, close_qty: 0, close_val: 0 }),
    [reportData]
  );

  // ── Row renderers ─────────────────────────────────────────────────────────
  const renderScreenRow = (item) => [
    formatDate(item.doc_date),
    item.item_name,
    formatReadableAmount(num(item.op_qty).toFixed(2)),
    formatReadableAmount(num(item.op_value).toFixed(2)),
    formatReadableAmount(num(item.purc_qty).toFixed(2)),
    formatReadableAmount(num(item.purc_value).toFixed(2)),
    formatReadableAmount(num(item.sale_qty).toFixed(2)),
    formatReadableAmount(num(item.sale_val).toFixed(2)),
    formatReadableAmount(num(item.close_qty).toFixed(2)),
    formatReadableAmount(num(item.close_val).toFixed(2)),
    formatReadableAmount(num(item.day_diff).toFixed(2)),
  ];

  const renderPrintRow = (item) => [
    formatDate(item.doc_date),
    item.item_name,
    formatReadableAmount(num(item.op_qty).toFixed(2)),
    formatReadableAmount(num(item.op_value).toFixed(2)),
    formatReadableAmount(num(item.purc_qty).toFixed(2)),
    formatReadableAmount(num(item.purc_value).toFixed(2)),
    formatReadableAmount(num(item.sale_qty).toFixed(2)),
    formatReadableAmount(num(item.sale_val).toFixed(2)),
    formatReadableAmount(num(item.close_qty).toFixed(2)),
    formatReadableAmount(num(item.close_val).toFixed(2)),
    formatReadableAmount(num(item.day_diff).toFixed(2)),
  ];

  const printFooterValues = [
    '', 'GRAND TOTAL',
    formatReadableAmount(grandTotals.op_qty.toFixed(2)),
    formatReadableAmount(grandTotals.op_value.toFixed(2)),
    formatReadableAmount(grandTotals.purc_qty.toFixed(2)),
    formatReadableAmount(grandTotals.purc_value.toFixed(2)),
    formatReadableAmount(grandTotals.sale_qty.toFixed(2)),
    formatReadableAmount(grandTotals.sale_val.toFixed(2)),
    formatReadableAmount(grandTotals.close_qty.toFixed(2)),
    formatReadableAmount(grandTotals.close_val.toFixed(2)),
    '',
  ];

  const reportSubtitle = `${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`;

  // ── Excel Export ───────────────────────────────────────────────────────────
  const handleExportToExcel = () => {
    const headers = SCREEN_COLUMNS.map(c => c.label);

    const companyNameRow = [companyName?.toUpperCase()];
    const gstRow = [`GST No: ${companyGST}`];
    const periodRow = [`Period: ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`];
    const emptyRow = [];

    const tableData = sortedData.map((item) =>
      SCREEN_COLUMNS.map((col) => {
        if (col.numeric) return Number(item[col.key]) || 0;
        if (col.key === 'doc_date') return formatDate(item[col.key]);
        return item[col.key];
      })
    );

    const totalRow = [
      'GRAND TOTAL', '',
      grandTotals.op_qty,
      grandTotals.op_value,
      grandTotals.purc_qty,
      grandTotals.purc_value,
      grandTotals.sale_qty,
      grandTotals.sale_val,
      grandTotals.close_qty,
      grandTotals.close_val,
      '',
    ];

    const worksheetData = [companyNameRow, gstRow, periodRow, emptyRow, headers, ...tableData, totalRow];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
    ];

    // Column widths + right-align numeric columns for every data row
    ws['!cols'] = SCREEN_COLUMNS.map(c => ({ wch: c.numeric ? 16 : 22 }));

    const range = XLSX.utils.decode_range(ws['!ref']);
    const headerRowIndex = 4; // 0-based row index of the header row

    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[addr]) continue;

        const colDef = SCREEN_COLUMNS[C];
        if (!colDef) continue;

        if (!ws[addr].s) ws[addr].s = {};

        if (R >= headerRowIndex && colDef.numeric) {
          // Right-align amounts (including header for that column)
          ws[addr].s.alignment = { horizontal: 'right' };
        } else if (colDef.center) {
          ws[addr].s.alignment = { horizontal: 'center' };
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, 'StockBook');
    XLSX.writeFile(wb, `StockBook_${fromDate}_to_${toDate}.xlsx`);
  };

  // ── PDF (via generateReportPDF — same pattern as SaleRegister) ────────────
  const handleGeneratePDF = () => {
    generateReportPDF({
      title: 'Stock Book Report',
      subtitle: reportSubtitle,
      columns: PRINT_COLUMNS.map(c => c.label),
      columnWidths: [16, 16, 18, 20, 18, 20, 18, 20, 18, 20, 16],
      rows: sortedData.map(renderPrintRow),
      footerRow: printFooterValues,
      numericCols: PRINT_NUMERIC_COLS,
      centerCols: PRINT_CENTER_COLS,
      headerImgSrc: HeaderJK,
      footerImgSrc: FooterJK,
      onComplete: (url) => setPdfPreview(url),
    });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ marginTop: '-40px', padding: '20px' }}>

      {/* Print view (hidden on screen, shown @media print) */}
      <CommonPrintView
        title="Stock Book Report"
        subtitle={reportSubtitle}
        companyName={companyName}
        companyGST={companyGST}
        columns={PRINT_COLUMNS}
        rows={sortedData}
        rowRenderer={renderPrintRow}
        footerValues={printFooterValues}
        amountInWords={ConvertNumberToWord(grandTotals.close_val)}
        headerImg={HeaderJK}
        footerImg={FooterJK}
      />

      {/* Screen header */}
      <Typography variant="h5" align="center" style={{ fontWeight: 'bold', marginTop: '-50px' }}>
        {companyName}
      </Typography>
      <Typography variant="subtitle1" align="center">GSTN: {companyGST}</Typography>
      <Typography variant="h6" align="center">Stock Book Report</Typography>
      <Typography variant="subtitle2" align="center" color="textSecondary">
        {reportSubtitle}
      </Typography>

      {/* Action buttons */}
      <div className="my-2 no-print d-flex justify-content-end gap-1 align-items-center">
        <BackButton onClick={() => navigate('/stock-book')} />
        <button className="btn btn-danger" onClick={handleGeneratePDF}>
          Print
        </button>
        <button className="btn btn-success" onClick={handleExportToExcel}>
          Export Excel
        </button>
      </div>

      {pdfPreview && <PdfPreview pdfData={pdfPreview} label="StockdetailReport" />}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Screen table */}
      <TableContainer component={Paper} style={{ maxHeight: '700px', position: 'relative' }}>
        <Table size="small" style={{ borderCollapse: 'separate' }}>
          <TableHead>
            {/* ── Row 1: group labels (sticky at top: 0) ── */}
            <TableRow>
              {/* Date */}
              <TableCell rowSpan={2} align="center" style={{ fontWeight: 'bold', backgroundColor: '#494cf1', color: '#000000', whiteSpace: 'nowrap', verticalAlign: 'middle', borderRight: '1px solid #7779e8', position: 'sticky', top: 0, zIndex: 4 }}>
                <TableSortLabel active={sortConfig.key === 'doc_date'} direction={sortConfig.direction} onClick={() => requestSort('doc_date')} sx={{ '&.MuiTableSortLabel-root': { color: '#fff' }, '&.MuiTableSortLabel-root:hover': { color: '#cce0ff' }, '&.Mui-active': { color: '#fff' }, '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}>
                  Date
                </TableSortLabel>
              </TableCell>
              {/* Item Name */}
              <TableCell rowSpan={2} align="left" style={{ fontWeight: 'bold', backgroundColor: '#494cf1', color: '#000000', whiteSpace: 'nowrap', verticalAlign: 'middle', borderRight: '1px solid #7779e8', position: 'sticky', top: 0, zIndex: 4 }}>
                <TableSortLabel active={sortConfig.key === 'item_name'} direction={sortConfig.direction} onClick={() => requestSort('item_name')} sx={{ '&.MuiTableSortLabel-root': { color: '#fff' }, '&.MuiTableSortLabel-root:hover': { color: '#cce0ff' }, '&.Mui-active': { color: '#fff' }, '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}>
                  Item Name
                </TableSortLabel>
              </TableCell>
              {/* Opening group */}
              <TableCell colSpan={2} align="center" style={{ fontWeight: 'bold', backgroundColor: '#6ea3ee', color: '#000000', borderRight: '1px solid #7779e8', borderBottom: '1px solid #7779e8', position: 'sticky', top: 0, zIndex: 3 }}>
                Opening
              </TableCell>
              {/* Purchase group */}
              <TableCell colSpan={2} align="center" style={{ fontWeight: 'bold', backgroundColor: '#94ceac', color: '#000000', borderRight: '1px solid #7779e8', borderBottom: '1px solid #7779e8', position: 'sticky', top: 0, zIndex: 3 }}>
                Purchase
              </TableCell>
              {/* Sale group */}
              <TableCell colSpan={2} align="center" style={{ fontWeight: 'bold', backgroundColor: '#c26a60', color: '#000000', borderRight: '1px solid #7779e8', borderBottom: '1px solid #7779e8', position: 'sticky', top: 0, zIndex: 3 }}>
                Sale
              </TableCell>
              {/* Closing group */}
              <TableCell colSpan={2} align="center" style={{ fontWeight: 'bold', backgroundColor: '#e09859', color: '#000000', borderRight: '1px solid #7779e8', borderBottom: '1px solid #7779e8', position: 'sticky', top: 0, zIndex: 3 }}>
                Closing
              </TableCell>
              {/* Day Diff */}
              <TableCell rowSpan={2} align="right" style={{ fontWeight: 'bold', backgroundColor: '#494cf1', color: '#000000', whiteSpace: 'nowrap', verticalAlign: 'middle', position: 'sticky', top: 0, zIndex: 4 }}>
                <TableSortLabel active={sortConfig.key === 'day_diff'} direction={sortConfig.direction} onClick={() => requestSort('day_diff')} sx={{ '&.MuiTableSortLabel-root': { color: '#fff' }, '&.MuiTableSortLabel-root:hover': { color: '#cce0ff' }, '&.Mui-active': { color: '#fff' }, '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}>
                  Day Diff
                </TableSortLabel>
              </TableCell>
            </TableRow>

            {/* ── Row 2: Qty / Value sub-headers (sticky at top: 33px = row1 height) ── */}
            <TableRow>
              {[
                { key: 'op_qty', label: 'Quintal', bg: '#6ea3ee' },
                { key: 'op_value', label: 'Value', bg: '#6ea3ee', borderRight: true },
                { key: 'purc_qty', label: 'Quintal', bg: '#94ceac' },
                { key: 'purc_value', label: 'Value', bg: '#94ceac', borderRight: true },
                { key: 'sale_qty', label: 'Quintal', bg: '#c26a60' },
                { key: 'sale_val', label: 'Value', bg: '#c26a60', borderRight: true },
                { key: 'close_qty', label: 'Quintal', bg: '#e09859' },
                { key: 'close_val', label: 'Value', bg: '#e09859', borderRight: true },
              ].map(col => (
                <TableCell key={col.key} align="right"
                  style={{ fontWeight: 'bold', backgroundColor: col.bg, color: '#000000', whiteSpace: 'nowrap', borderRight: col.borderRight ? '1px solid #7779e8' : undefined, position: 'sticky', top: 33, zIndex: 3 }}
                >
                  <TableSortLabel active={sortConfig.key === col.key} direction={sortConfig.direction} onClick={() => requestSort(col.key)}
                    sx={{ '&.MuiTableSortLabel-root': { color: '#000000' }, '&.MuiTableSortLabel-root:hover': { color: '#ffffff' }, '&.Mui-active': { color: '#fff' }, '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}
                  >
                    {col.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {sortedData.map((item, index) => (
              <TableRow
                key={index}
                hover
                style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f5f8ff' }}
              >
                {renderScreenRow(item).map((cell, ci) => (
                  <TableCell
                    key={ci}
                    align={
                      SCREEN_COLUMNS[ci]?.numeric ? 'right'
                        : SCREEN_COLUMNS[ci]?.center ? 'center'
                          : 'left'
                    }
                    style={{ fontSize: '0.78rem', whiteSpace: ci === 0 ? 'nowrap' : 'normal' }}
                  >
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>

          <TableFooter style={{ position: 'sticky', bottom: 0, zIndex: 2 }}>
            <TableRow style={{ backgroundColor: '#ffffcc' }}>
              {/* Date */}
              <TableCell style={{ fontWeight: 'bold', fontSize: '0.78rem' }} />
              {/* Item Name */}
              <TableCell style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>GRAND TOTAL</TableCell>
              {/* Open Qty */}
              <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
                {formatReadableAmount(grandTotals.op_qty.toFixed(2))}
              </TableCell>
              {/* Open Value */}
              <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
                {formatReadableAmount(grandTotals.op_value.toFixed(2))}
              </TableCell>
              {/* Purchase Qty */}
              <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
                {formatReadableAmount(grandTotals.purc_qty.toFixed(2))}
              </TableCell>
              {/* Purchase Value */}
              <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
                {formatReadableAmount(grandTotals.purc_value.toFixed(2))}
              </TableCell>
              {/* Sale Qty */}
              <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
                {formatReadableAmount(grandTotals.sale_qty.toFixed(2))}
              </TableCell>
              {/* Sale Value */}
              <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
                {formatReadableAmount(grandTotals.sale_val.toFixed(2))}
              </TableCell>
              {/* Close Qty */}
              <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
                {formatReadableAmount(grandTotals.close_qty.toFixed(2))}
              </TableCell>
              {/* Close Value */}
              <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
                {formatReadableAmount(grandTotals.close_val.toFixed(2))}
              </TableCell>
              {/* Day Diff */}
              <TableCell style={{ fontWeight: 'bold', fontSize: '0.78rem' }} />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>

      {loading && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)', zIndex: 9999,
        }}>
          <ScaleLoader color="#36d7b7" height={35} width={4} radius={2} margin={2} />
        </div>
      )}
    </div>
  );
};

export default StockBookReport;