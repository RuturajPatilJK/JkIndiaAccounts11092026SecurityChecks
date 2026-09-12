import React, { useEffect, useState, useMemo, useCallback } from "react";
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
  { label: 'Mill Name', key: 'mill_name', printWidth: '30mm' },
  { label: 'Date', key: 'doc_date', printWidth: '18mm', center: true },
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

const getKey = (obj, candidates) => {
  for (const k of candidates) if (k in obj) return k;
  return candidates[candidates.length - 1];
};

const groupBy = (arr, keys) => {
  if (!arr || arr.length === 0) return {};
  const pk = getKey(arr[0], keys);
  const grouped = arr.reduce((acc, item) => {
    const k = (item[pk] ?? "Unknown").toString();
    (acc[k] = acc[k] || []).push(item);
    return acc;
  }, {});
  const sorted = {};
  Object.keys(grouped).sort((a, b) => a.localeCompare(b)).forEach((k) => { sorted[k] = grouped[k]; });
  return sorted;
};

// ─── Component ─────────────────────────────────────────────────────────────────

const StockBookReportMillwise = () => {
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

  const [rawGrouped, setRawGrouped] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfPreview, setPdfPreview] = useState(null);
  const [sortConfig, setSortConfig] = useState({ group: null, key: null, direction: 'asc' });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(
          `${API_URL}/report-stock-book-millwise?fromDate=${fromDate}&company_code=${companyCode}&Item_Code=${itemCode}&ToDate=${toDate}&Year_Code=${Year_Code}`
        );
        const json = await res.json();

        const filtered = (json.data || [])
          .filter((item) => {
            const d = new Date(item.doc_date);
            return d >= new Date(fromDate) && d <= new Date(toDate);
          })
          .map((item) => ({
            ...item,
            day_diff: num(item.purc_qty) - num(item.sale_qty),
          }));

        setRawGrouped(groupBy(filtered, ["mill_name", "Mill_Name", "millname", "MillShortName"]));
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
  const requestSort = (group, key) =>
    setSortConfig(prev => ({
      group,
      key,
      direction: prev.group === group && prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));

  const getSortedData = useCallback((group) => {
    const rows = [...(rawGrouped[group] || [])];
    if (sortConfig.group === group && sortConfig.key) {
      rows.sort((a, b) => {
        const va = a[sortConfig.key];
        const vb = b[sortConfig.key];
        const na = Number(va), nb = Number(vb);
        const compare = isNaN(na) || isNaN(nb)
          ? String(va).localeCompare(String(vb))
          : na - nb;
        return sortConfig.direction === 'asc' ? compare : -compare;
      });
    }
    return rows;
  }, [rawGrouped, sortConfig]);

  // ── Grand Totals (all mills combined) ──
  const grandTotals = useMemo(() => {
    const allData = Object.values(rawGrouped).flat();
    return allData.reduce((acc, item) => {
      acc.op_qty += num(item.op_qty);
      acc.op_value += num(item.op_value);
      acc.purc_qty += num(item.purc_qty);
      acc.purc_value += num(item.purc_value);
      acc.sale_qty += num(item.sale_qty);
      acc.sale_val += num(item.sale_val);
      acc.close_qty += num(item.close_qty);
      acc.close_val += num(item.close_val);
      return acc;
    }, { op_qty: 0, op_value: 0, purc_qty: 0, purc_value: 0, sale_qty: 0, sale_val: 0, close_qty: 0, close_val: 0 });
  }, [rawGrouped]);

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
    item.mill_name || item.Mill_Name || '',
    formatDate(item.doc_date),
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
    'GRAND TOTAL', '',
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

  // ── Excel Export (with right alignment for numeric columns) ──
  const handleExportToExcel = () => {
    const headers = ['Mill Name', ...SCREEN_COLUMNS.map(c => c.label)];

    const companyNameRow = [companyName?.toUpperCase()];
    const gstRow = [`GST No: ${companyGST}`];
    const periodRow = [`Period: ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`];
    const emptyRow = [];

    const tableData = [];
    Object.keys(rawGrouped).forEach((group) => {
      const rows = getSortedData(group);
      rows.forEach((item) => {
        const row = [
          group,
          formatDate(item.doc_date),
          item.item_name,
          num(item.op_qty),
          num(item.op_value),
          num(item.purc_qty),
          num(item.purc_value),
          num(item.sale_qty),
          num(item.sale_val),
          num(item.close_qty),
          num(item.close_val),
          num(item.day_diff),
        ];
        tableData.push(row);
      });
    });

    const totalRow = [
      'GRAND TOTAL', '', '',
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
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
    ];

    // Column widths + right-align numeric columns
    const allColumns = [{ wch: 25 }, ...SCREEN_COLUMNS.map(c => ({ wch: c.numeric ? 16 : 22 }))];
    ws['!cols'] = allColumns;

    const range = XLSX.utils.decode_range(ws['!ref']);
    const headerRowIndex = 4; // 0-based row index of the header row

    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[addr]) continue;

        if (!ws[addr].s) ws[addr].s = {};

        // Numeric columns (skip first column which is Mill Name)
        if (R >= headerRowIndex && C >= 3 && (C === 3 || C === 4 || C === 5 || C === 6 || C === 7 || C === 8 || C === 9 || C === 10 || C === 11)) {
          ws[addr].s.alignment = { horizontal: 'right' };
        } else if (C === 1) { // Date column
          ws[addr].s.alignment = { horizontal: 'center' };
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, 'StockBookMillwise');
    XLSX.writeFile(wb, `StockBook_Millwise_${fromDate}_to_${toDate}.xlsx`);
  };

  const handleGeneratePDF = () => {
    const flattenedData = [];
    Object.keys(rawGrouped).forEach((group) => {
      const rows = getSortedData(group);
      rows.forEach((row) => {
        flattenedData.push({
          ...row,
          mill_name: group,
        });
      });
    });

    generateReportPDF({
      title: 'Stock Book Report (Mill-wise)',
      subtitle: reportSubtitle,
      columns: PRINT_COLUMNS.map(c => c.label),
      columnWidths: [30, 18, 18, 20, 18, 20, 18, 20, 18, 20, 16],
      rows: flattenedData.map(renderPrintRow),
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
        title="Stock Book Report (Mill-wise)"
        subtitle={reportSubtitle}
        companyName={companyName}
        companyGST={companyGST}
        columns={PRINT_COLUMNS}
        rows={Object.values(rawGrouped).flat()}
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
      <Typography variant="h6" align="center">Stock Book Report (Mill-wise)</Typography>
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

      {pdfPreview && <PdfPreview pdfData={pdfPreview} label="StockdetailReportMillWise" />}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Screen table - Grouped by Mill */}
      {Object.keys(rawGrouped).map((group) => {
        const rows = getSortedData(group);
        const groupTotals = rows.reduce((acc, item) => {
          acc.op_qty += num(item.op_qty);
          acc.op_value += num(item.op_value);
          acc.purc_qty += num(item.purc_qty);
          acc.purc_value += num(item.purc_value);
          acc.sale_qty += num(item.sale_qty);
          acc.sale_val += num(item.sale_val);
          acc.close_qty += num(item.close_qty);
          acc.close_val += num(item.close_val);
          return acc;
        }, { op_qty: 0, op_value: 0, purc_qty: 0, purc_value: 0, sale_qty: 0, sale_val: 0, close_qty: 0, close_val: 0 });

        return (
          <div key={group} style={{ marginBottom: '30px', marginTop: '20px' }}>
            {/* Mill Header */}
            <Typography 
              variant="h6" 
              style={{ 
                backgroundColor: '#ffffff', 
                color: '#600ff7', 
                padding: '10px 15px', 
                borderRadius: '5px 5px 0 0',
                marginBottom: 0,
                fontWeight: 'bold',
                textAlign: 'left',
              }}
            >
              # {group.toUpperCase()}
            </Typography>

            <TableContainer component={Paper} style={{ maxHeight: '500px', position: 'relative', borderRadius: '0 0 5px 5px' }}>
              <Table size="small" style={{ borderCollapse: 'separate' }}>
                <TableHead>
                  {/* ── Row 1: group labels (sticky) ── */}
                  <TableRow>
                    <TableCell rowSpan={2} align="center" style={{ fontWeight: 'bold', backgroundColor: '#a8bfff', color: '#000000', whiteSpace: 'nowrap', verticalAlign: 'middle', borderRight: '1px solid #7779e8', position: 'sticky', top: 0, zIndex: 4 }}>
                      <TableSortLabel 
                        active={sortConfig.group === group && sortConfig.key === 'doc_date'} 
                        direction={sortConfig.group === group && sortConfig.key === 'doc_date' ? sortConfig.direction : 'asc'} 
                        onClick={() => requestSort(group, 'doc_date')} 
                        sx={{ '&.MuiTableSortLabel-root': { color: '#000000' }, '&.MuiTableSortLabel-root:hover': { color: '#000000' }, '&.Mui-active': { color: '#000000' }, '& .MuiTableSortLabel-icon': { color: '#000000 !important' } }}>
                        Date
                      </TableSortLabel>
                    </TableCell>
                    <TableCell rowSpan={2} align="left" style={{ fontWeight: 'bold', backgroundColor: '#a8bfff', color: '#000000', whiteSpace: 'nowrap', verticalAlign: 'middle', borderRight: '1px solid #7779e8', position: 'sticky', top: 0, zIndex: 4 }}>
                      <TableSortLabel 
                        active={sortConfig.group === group && sortConfig.key === 'item_name'} 
                        direction={sortConfig.group === group && sortConfig.key === 'item_name' ? sortConfig.direction : 'asc'} 
                        onClick={() => requestSort(group, 'item_name')} 
                        sx={{ '&.MuiTableSortLabel-root': { color: '#000000' }, '&.MuiTableSortLabel-root:hover': { color: '#000000' }, '&.Mui-active': { color: '#000000' }, '& .MuiTableSortLabel-icon': { color: '#000000 !important' } }}>
                        Item Name
                      </TableSortLabel>
                    </TableCell>
                    <TableCell colSpan={2} align="center" style={{ fontWeight: 'bold', backgroundColor: '#6ea3ee', color: '#000', borderRight: '1px solid #7779e8', borderBottom: '1px solid #7779e8', position: 'sticky', top: 0, zIndex: 3 }}>
                      Opening
                    </TableCell>
                    <TableCell colSpan={2} align="center" style={{ fontWeight: 'bold', backgroundColor: '#94ceac', color: '#000', borderRight: '1px solid #7779e8', borderBottom: '1px solid #7779e8', position: 'sticky', top: 0, zIndex: 3 }}>
                      Purchase
                    </TableCell>
                    <TableCell colSpan={2} align="center" style={{ fontWeight: 'bold', backgroundColor: '#c26a60', color: '#000', borderRight: '1px solid #7779e8', borderBottom: '1px solid #7779e8', position: 'sticky', top: 0, zIndex: 3 }}>
                      Sale
                    </TableCell>
                    <TableCell colSpan={2} align="center" style={{ fontWeight: 'bold', backgroundColor: '#e09859', color: '#000', borderRight: '1px solid #7779e8', borderBottom: '1px solid #7779e8', position: 'sticky', top: 0, zIndex: 3 }}>
                      Closing
                    </TableCell>
                    <TableCell rowSpan={2} align="right" style={{ fontWeight: 'bold', backgroundColor: '#a8bfff', color: '#000000', whiteSpace: 'nowrap', verticalAlign: 'middle', position: 'sticky', top: 0, zIndex: 4 }}>
                      <TableSortLabel 
                        active={sortConfig.group === group && sortConfig.key === 'day_diff'} 
                        direction={sortConfig.group === group && sortConfig.key === 'day_diff' ? sortConfig.direction : 'asc'} 
                        onClick={() => requestSort(group, 'day_diff')} 
                        sx={{ '&.MuiTableSortLabel-root': { color: '#000000' }, '&.MuiTableSortLabel-root:hover': { color: '#000000' }, '&.Mui-active': { color: '#fff' }, '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}>
                        Day Diff
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>

                  {/* ── Row 2: Qty / Value sub-headers ── */}
                  <TableRow>
                    <TableCell align="right" style={{ fontWeight: 'bold', backgroundColor: '#6ea3ee', color: '#000', whiteSpace: 'nowrap', position: 'sticky', top: 33, zIndex: 3 }}>
                      <TableSortLabel active={sortConfig.group === group && sortConfig.key === 'op_qty'} direction={sortConfig.group === group && sortConfig.key === 'op_qty' ? sortConfig.direction : 'asc'} onClick={() => requestSort(group, 'op_qty')} sx={{ '&.MuiTableSortLabel-root': { color: '#000' }, '&.MuiTableSortLabel-root:hover': { color: '#fff' }, '&.Mui-active': { color: '#fff' }, '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}>
                        Quintal
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right" style={{ fontWeight: 'bold', backgroundColor: '#6ea3ee', color: '#000', whiteSpace: 'nowrap', borderRight: '1px solid #7779e8', position: 'sticky', top: 33, zIndex: 3 }}>
                      <TableSortLabel active={sortConfig.group === group && sortConfig.key === 'op_value'} direction={sortConfig.group === group && sortConfig.key === 'op_value' ? sortConfig.direction : 'asc'} onClick={() => requestSort(group, 'op_value')} sx={{ '&.MuiTableSortLabel-root': { color: '#000' }, '&.MuiTableSortLabel-root:hover': { color: '#fff' }, '&.Mui-active': { color: '#fff' }, '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}>
                        Value
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right" style={{ fontWeight: 'bold', backgroundColor: '#94ceac', color: '#000', whiteSpace: 'nowrap', position: 'sticky', top: 33, zIndex: 3 }}>
                      <TableSortLabel active={sortConfig.group === group && sortConfig.key === 'purc_qty'} direction={sortConfig.group === group && sortConfig.key === 'purc_qty' ? sortConfig.direction : 'asc'} onClick={() => requestSort(group, 'purc_qty')} sx={{ '&.MuiTableSortLabel-root': { color: '#000' }, '&.MuiTableSortLabel-root:hover': { color: '#fff' }, '&.Mui-active': { color: '#fff' }, '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}>
                        Quintal
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right" style={{ fontWeight: 'bold', backgroundColor: '#94ceac', color: '#000', whiteSpace: 'nowrap', borderRight: '1px solid #7779e8', position: 'sticky', top: 33, zIndex: 3 }}>
                      <TableSortLabel active={sortConfig.group === group && sortConfig.key === 'purc_value'} direction={sortConfig.group === group && sortConfig.key === 'purc_value' ? sortConfig.direction : 'asc'} onClick={() => requestSort(group, 'purc_value')} sx={{ '&.MuiTableSortLabel-root': { color: '#000' }, '&.MuiTableSortLabel-root:hover': { color: '#fff' }, '&.Mui-active': { color: '#fff' }, '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}>
                        Value
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right" style={{ fontWeight: 'bold', backgroundColor: '#c26a60', color: '#000', whiteSpace: 'nowrap', position: 'sticky', top: 33, zIndex: 3 }}>
                      <TableSortLabel active={sortConfig.group === group && sortConfig.key === 'sale_qty'} direction={sortConfig.group === group && sortConfig.key === 'sale_qty' ? sortConfig.direction : 'asc'} onClick={() => requestSort(group, 'sale_qty')} sx={{ '&.MuiTableSortLabel-root': { color: '#000' }, '&.MuiTableSortLabel-root:hover': { color: '#fff' }, '&.Mui-active': { color: '#fff' }, '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}>
                        Quintal
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right" style={{ fontWeight: 'bold', backgroundColor: '#c26a60', color: '#000', whiteSpace: 'nowrap', borderRight: '1px solid #7779e8', position: 'sticky', top: 33, zIndex: 3 }}>
                      <TableSortLabel active={sortConfig.group === group && sortConfig.key === 'sale_val'} direction={sortConfig.group === group && sortConfig.key === 'sale_val' ? sortConfig.direction : 'asc'} onClick={() => requestSort(group, 'sale_val')} sx={{ '&.MuiTableSortLabel-root': { color: '#000' }, '&.MuiTableSortLabel-root:hover': { color: '#fff' }, '&.Mui-active': { color: '#fff' }, '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}>
                        Value
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right" style={{ fontWeight: 'bold', backgroundColor: '#e09859', color: '#000', whiteSpace: 'nowrap', position: 'sticky', top: 33, zIndex: 3 }}>
                      <TableSortLabel active={sortConfig.group === group && sortConfig.key === 'close_qty'} direction={sortConfig.group === group && sortConfig.key === 'close_qty' ? sortConfig.direction : 'asc'} onClick={() => requestSort(group, 'close_qty')} sx={{ '&.MuiTableSortLabel-root': { color: '#000' }, '&.MuiTableSortLabel-root:hover': { color: '#fff' }, '&.Mui-active': { color: '#fff' }, '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}>
                        Quintal
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right" style={{ fontWeight: 'bold', backgroundColor: '#e09859', color: '#000', whiteSpace: 'nowrap', borderRight: '1px solid #7779e8', position: 'sticky', top: 33, zIndex: 3 }}>
                      <TableSortLabel active={sortConfig.group === group && sortConfig.key === 'close_val'} direction={sortConfig.group === group && sortConfig.key === 'close_val' ? sortConfig.direction : 'asc'} onClick={() => requestSort(group, 'close_val')} sx={{ '&.MuiTableSortLabel-root': { color: '#000' }, '&.MuiTableSortLabel-root:hover': { color: '#fff' }, '&.Mui-active': { color: '#fff' }, '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}>
                        Value
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {rows.map((item, index) => (
                    <TableRow key={index} hover style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f5f8ff' }}>
                      {renderScreenRow(item).map((cell, ci) => (
                        <TableCell
                          key={ci}
                          align={SCREEN_COLUMNS[ci]?.numeric ? 'right' : SCREEN_COLUMNS[ci]?.center ? 'center' : 'left'}
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
                    <TableCell style={{ fontWeight: 'bold', fontSize: '0.78rem' }} />
                    <TableCell style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>GROUP TOTAL</TableCell>
                    <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
                      {formatReadableAmount(groupTotals.op_qty.toFixed(2))}
                    </TableCell>
                    <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
                      {formatReadableAmount(groupTotals.op_value.toFixed(2))}
                    </TableCell>
                    <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
                      {formatReadableAmount(groupTotals.purc_qty.toFixed(2))}
                    </TableCell>
                    <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
                      {formatReadableAmount(groupTotals.purc_value.toFixed(2))}
                    </TableCell>
                    <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
                      {formatReadableAmount(groupTotals.sale_qty.toFixed(2))}
                    </TableCell>
                    <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
                      {formatReadableAmount(groupTotals.sale_val.toFixed(2))}
                    </TableCell>
                    <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
                      {formatReadableAmount(groupTotals.close_qty.toFixed(2))}
                    </TableCell>
                    <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
                      {formatReadableAmount(groupTotals.close_val.toFixed(2))}
                    </TableCell>
                    <TableCell style={{ fontWeight: 'bold', fontSize: '0.78rem' }} />
                  </TableRow>
                </TableFooter>
              </Table>
            </TableContainer>
          </div>
        );
      })}

      {/* Grand Total Footer */}
      {Object.keys(rawGrouped).length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableFooter>
                <TableRow style={{ backgroundColor: '#ffffcc' }}>
                  <TableCell style={{ fontWeight: 'bold', fontSize: '0.85rem' }} />
                  <TableCell style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>GRAND TOTAL</TableCell>
                  <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                    {formatReadableAmount(grandTotals.op_qty.toFixed(2))}
                  </TableCell>
                  <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                    {formatReadableAmount(grandTotals.op_value.toFixed(2))}
                  </TableCell>
                  <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                    {formatReadableAmount(grandTotals.purc_qty.toFixed(2))}
                  </TableCell>
                  <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                    {formatReadableAmount(grandTotals.purc_value.toFixed(2))}
                  </TableCell>
                  <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                    {formatReadableAmount(grandTotals.sale_qty.toFixed(2))}
                  </TableCell>
                  <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                    {formatReadableAmount(grandTotals.sale_val.toFixed(2))}
                  </TableCell>
                  <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                    {formatReadableAmount(grandTotals.close_qty.toFixed(2))}
                  </TableCell>
                  <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                    {formatReadableAmount(grandTotals.close_val.toFixed(2))}
                  </TableCell>
                  <TableCell style={{ fontWeight: 'bold', fontSize: '0.85rem' }} />
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        </div>
      )}

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

export default StockBookReportMillwise;

