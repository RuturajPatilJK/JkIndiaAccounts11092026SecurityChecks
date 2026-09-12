import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { ScaleLoader } from "react-spinners";
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
  { label: 'Opening Qty', key: 'opqntl', width: '8%', numeric: true },
  { label: 'Inward Qty', key: 'inwqntl', width: '8%', numeric: true },
  { label: 'Outward Qty', key: 'outqntl', width: '8%', numeric: true },
  { label: 'Balance', key: 'bal', width: '8%', numeric: true },
  { label: 'Marka', key: 'Marka', width: '8%', center: true },
  { label: 'Trans Type', key: 'Tran_Type', width: '8%', center: true },
  { label: 'DO No', key: 'DoNO', width: '8%', center: true },
  { label: 'Doc No', key: 'doc_no', width: '8%', center: true },
  { label: 'Party Name', key: 'partyShortname', width: '12%' },
  { label: 'Mill Name', key: 'MillShortName', width: '10%' },
];

const PRINT_COLUMNS = [
  { label: 'Date', key: 'doc_date', printWidth: '16mm', center: true },
  { label: 'Opening Qty', key: 'opqntl', printWidth: '18mm', numeric: true },
  { label: 'Inward Qty', key: 'inwqntl', printWidth: '18mm', numeric: true },
  { label: 'Outward Qty', key: 'outqntl', printWidth: '18mm', numeric: true },
  { label: 'Balance', key: 'bal', printWidth: '16mm', numeric: true },
  { label: 'Marka', key: 'Marka', printWidth: '16mm', center: true },
  { label: 'Trans Type', key: 'Tran_Type', printWidth: '18mm', center: true },
  { label: 'DO No', key: 'DoNO', printWidth: '16mm', center: true },
  { label: 'Doc No', key: 'doc_no', printWidth: '16mm', center: true },
  { label: 'Party Name', key: 'partyShortname', printWidth: '28mm' },
  { label: 'Mill Name', key: 'MillShortName', printWidth: '22mm' },
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

const groupBy = (arr, key) =>
  arr.reduce((acc, item) => {
    const groupKey = item[key] || "Other";
    (acc[groupKey] = acc[groupKey] || []).push(item);
    return acc;
  }, {});

// ─── Component ─────────────────────────────────────────────────────────────────

const StockReportDetail = () => {
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
          `${API_URL}/stock-book-detail?doc_date=${toDate}&from_date=${fromDate}&company_code=${companyCode}&Item_Code=${itemCode}&Year_Code=${Year_Code}`
        );
        const json = await res.json();
        setRawGrouped(groupBy(json.data || [], "System_Name_E"));
      } catch (err) {
        console.error(err);
        setError('Error fetching stock detail report');
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
        let va = a[sortConfig.key];
        let vb = b[sortConfig.key];
        
        if (sortConfig.key === 'doc_date') {
          va = new Date(va);
          vb = new Date(vb);
        } else if (['opqntl', 'inwqntl', 'outqntl', 'bal'].includes(sortConfig.key)) {
          va = num(va);
          vb = num(vb);
        } else {
          va = String(va || '').toLowerCase();
          vb = String(vb || '').toLowerCase();
        }
        
        const compare = va > vb ? 1 : va < vb ? -1 : 0;
        return sortConfig.direction === 'asc' ? compare : -compare;
      });
    }
    return rows;
  }, [rawGrouped, sortConfig]);

  // ── Grand Totals (all items combined) ──
  const grandTotals = useMemo(() => {
    const allData = Object.values(rawGrouped).flat();
    return allData.reduce((acc, item) => {
      acc.inwqntl += num(item.inwqntl);
      acc.outqntl += num(item.outqntl);
      return acc;
    }, { inwqntl: 0, outqntl: 0 });
  }, [rawGrouped]);

  // ── Row renderers ─────────────────────────────────────────────────────────
  const renderScreenRow = (item) => [
    formatDate(item.doc_date),
    formatReadableAmount(num(item.opqntl).toFixed(2)),
    formatReadableAmount(num(item.inwqntl).toFixed(2)),
    formatReadableAmount(num(item.outqntl).toFixed(2)),
    formatReadableAmount(num(item.bal).toFixed(2)),
    item.Marka || '',
    item.Tran_Type || '',
    item.DoNO || '',
    item.doc_no || '',
    item.partyShortname || '',
    item.MillShortName || '',
  ];

  const renderPrintRow = (item) => [
    formatDate(item.doc_date),
    formatReadableAmount(num(item.opqntl).toFixed(2)),
    formatReadableAmount(num(item.inwqntl).toFixed(2)),
    formatReadableAmount(num(item.outqntl).toFixed(2)),
    formatReadableAmount(num(item.bal).toFixed(2)),
    item.Marka || '',
    item.Tran_Type || '',
    item.DoNO || '',
    item.doc_no || '',
    item.partyShortname || '',
    item.MillShortName || '',
  ];

  const reportSubtitle = `${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`;

  // ── Excel Export ──
  const handleExportToExcel = () => {
    const headers = SCREEN_COLUMNS.map(c => c.label);

    const companyNameRow = [companyName?.toUpperCase()];
    const gstRow = [`GST No: ${companyGST}`];
    const periodRow = [`Period: ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`];
    const emptyRow = [];

    const tableData = [];
    Object.keys(rawGrouped).forEach((group) => {
      const rows = getSortedData(group);
      rows.forEach((item) => {
        const row = [
          formatDate(item.doc_date),
          num(item.opqntl),
          num(item.inwqntl),
          num(item.outqntl),
          num(item.bal),
          item.Marka || '',
          item.Tran_Type || '',
          item.DoNO || '',
          item.doc_no || '',
          item.partyShortname || '',
          item.MillShortName || '',
        ];
        tableData.push(row);
      });
    });

    const totalRow = [
      'GRAND TOTAL', '',
      grandTotals.inwqntl,
      grandTotals.outqntl,
      '', '', '', '', '', '', ''
    ];

    const worksheetData = [companyNameRow, gstRow, periodRow, emptyRow, headers, ...tableData, totalRow];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
    ];

    ws['!cols'] = SCREEN_COLUMNS.map(c => ({ wch: c.numeric ? 16 : 22 }));

    const range = XLSX.utils.decode_range(ws['!ref']);
    const headerRowIndex = 4;

    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[addr]) continue;
        if (!ws[addr].s) ws[addr].s = {};

        const colDef = SCREEN_COLUMNS[C];
        if (!colDef) continue;

        if (R >= headerRowIndex && colDef.numeric) {
          ws[addr].s.alignment = { horizontal: 'right' };
        } else if (colDef.center) {
          ws[addr].s.alignment = { horizontal: 'center' };
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, 'StockDetailReport');
    XLSX.writeFile(wb, `StockDetail_${fromDate}_to_${toDate}.xlsx`);
  };

  // ── PDF (via generateReportPDF) ──
  const handleGeneratePDF = () => {
    // Flatten all data with item name
    const flattenedData = [];
    Object.keys(rawGrouped).forEach((group) => {
      const rows = getSortedData(group);
      rows.forEach((row) => {
        flattenedData.push({
          ...row,
          item_name: group,
        });
      });
    });

    const printFooterValues = [
      'GRAND TOTAL', '',
      formatReadableAmount(grandTotals.inwqntl.toFixed(2)),
      formatReadableAmount(grandTotals.outqntl.toFixed(2)),
      '', '', '', '', '', '', ''
    ];

    generateReportPDF({
      title: 'Stock Book Detail Report',
      subtitle: reportSubtitle,
      columns: PRINT_COLUMNS.map(c => c.label),
      columnWidths: [16, 18, 18, 18, 16, 16, 18, 16, 16, 28, 22],
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
        title="Stock Book Detail Report"
        subtitle={reportSubtitle}
        companyName={companyName}
        companyGST={companyGST}
        columns={PRINT_COLUMNS}
        rows={Object.values(rawGrouped).flat()}
        rowRenderer={renderPrintRow}
        footerValues={['GRAND TOTAL', '', grandTotals.inwqntl.toFixed(2), grandTotals.outqntl.toFixed(2), '', '', '', '', '', '', '']}
        amountInWords={ConvertNumberToWord(grandTotals.inwqntl)}
        headerImg={HeaderJK}
        footerImg={FooterJK}
      />

      {/* Screen header */}
      <Typography variant="h5" align="center" style={{ fontWeight: 'bold', marginTop: '-50px' }}>
        {companyName}
      </Typography>
      <Typography variant="subtitle1" align="center">GSTN: {companyGST}</Typography>
      <Typography variant="h6" align="center">Stock Book Detail Report</Typography>
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

      {pdfPreview && <PdfPreview pdfData={pdfPreview} label="StockBookItemwise" />}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Screen table - Grouped by Item */}
      {Object.keys(rawGrouped).map((group) => {
        const rows = getSortedData(group);
        const groupTotals = rows.reduce((acc, item) => {
          acc.inwqntl += num(item.inwqntl);
          acc.outqntl += num(item.outqntl);
          return acc;
        }, { inwqntl: 0, outqntl: 0 });

        return (
          <div key={group} style={{ marginBottom: '15px'}}>
            {/* Item Header */}
            <Typography 
              variant="h6" 
              style={{ 
                backgroundColor: '#ffffff', 
                color: '#070aaa', 
                padding: '10px 10px', 
                borderRadius: '5px 5px 0 0',
                marginBottom: 0,
                fontWeight: 'bold',
              }}
            >
             {group.toUpperCase()}
            </Typography>

            <TableContainer component={Paper} style={{ maxHeight: '500px', position: 'relative', borderRadius: '0 0 5px 5px' }}>
              <Table size="small" style={{ borderCollapse: 'separate' }}>
                <TableHead>
                  <TableRow>
                    {SCREEN_COLUMNS.map((col) => (
                      <TableCell 
                        key={col.key}
                        align={col.center ? 'center' : col.numeric ? 'right' : 'left'}
                        style={{ 
                          fontWeight: 'bold', 
                          backgroundColor: '#494cf1', 
                          color: '#fff', 
                          whiteSpace: 'nowrap',
                          position: 'sticky', 
                          top: 0, 
                          zIndex: 4,
                          borderRight: '1px solid #7779e8'
                        }}
                      >
                        <TableSortLabel 
                          active={sortConfig.group === group && sortConfig.key === col.key} 
                          direction={sortConfig.group === group && sortConfig.key === col.key ? sortConfig.direction : 'asc'} 
                          onClick={() => requestSort(group, col.key)} 
                          sx={{ '&.MuiTableSortLabel-root': { color: '#fff' }, '&.MuiTableSortLabel-root:hover': { color: '#cce0ff' }, '&.Mui-active': { color: '#fff' }, '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}>
                          {col.label}
                        </TableSortLabel>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {rows.map((item, index) => (
                    <TableRow key={index} hover style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f5f8ff' }}>
                      {renderScreenRow(item).map((cell, ci) => (
                        <TableCell
                          key={ci}
                          align={
                            SCREEN_COLUMNS[ci]?.numeric ? 'right' 
                            : SCREEN_COLUMNS[ci]?.center ? 'center' 
                            : 'left'
                          }
                          style={{ 
                            fontSize: '0.78rem', 
                            whiteSpace: ci === 0 ? 'nowrap' : 'normal',
                            color: ci === 2 ? '#16a34a' : ci === 3 ? '#dc2626' : 'inherit',
                            fontWeight: ci === 4 ? 'bold' : 'normal'
                          }}
                        >
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>

                <TableFooter style={{ position: 'sticky', bottom: 0, zIndex: 2 }}>
                  <TableRow style={{ backgroundColor: '#ffffcc' }}>
                    <TableCell style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>GROUP TOTAL</TableCell>
                    <TableCell style={{ fontWeight: 'bold', fontSize: '0.78rem' }} />
                    <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem', color: '#16a34a' }}>
                      {formatReadableAmount(groupTotals.inwqntl.toFixed(2))}
                    </TableCell>
                    <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem', color: '#dc2626' }}>
                      {formatReadableAmount(groupTotals.outqntl.toFixed(2))}
                    </TableCell>
                    {[...Array(7)].map((_, i) => (
                      <TableCell key={i} style={{ fontWeight: 'bold', fontSize: '0.78rem' }} />
                    ))}
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
                  <TableCell style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>GRAND TOTAL</TableCell>
               
                  <TableCell align="left" style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#16a34a' }}>
                   Total Inward Qntl : {formatReadableAmount(grandTotals.inwqntl.toFixed(2))}
                  </TableCell>
                  <TableCell align="left" style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#dc2626' }}>
                    Total Outward Qntl : {formatReadableAmount(grandTotals.outqntl.toFixed(2))}
                  </TableCell>
                  {[...Array(7)].map((_, i) => (
                    <TableCell key={i} style={{ fontWeight: 'bold', fontSize: '0.85rem' }} />
                  ))}
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

export default StockReportDetail;
