import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as XLSX from 'xlsx';
import { useLocation } from 'react-router-dom';
import { formatReadableAmount } from '../../../Common/FormatFunctions/FormatAmount';
import { ScaleLoader } from 'react-spinners';
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Typography, TableFooter, TableSortLabel,
} from '@mui/material';
import { FormaDateBalanceSheet } from '../../../Common/FormatFunctions/FormatDate';
import PdfPreview from '../../../Common/PDFPreview';
import HeaderJK from '../../../Assets/HeaderJK.png';
import FooterJK from '../../../Assets/FooterJK.png';
import { ConvertNumberToWord } from '../../../Common/FormatFunctions/ConvertNumberToWord';

import CommonPrintView from '../../../Common/ReportCommon/CommonPrintView';
import { generateReportPDF } from '../../../Common/ReportCommon/CommonPDFGenerator';

import '../../../Common/Fonts/Signika-Bold-normal';
import '../../../Common/Fonts/Signika-Regular-normal';

const apikey = process.env.REACT_APP_API;


const SCREEN_COLUMNS = [
  { label: 'Bill No', key: 'doc_no', width: '7%' },
  { label: 'Date', key: 'doc_date', width: '8%', center: true },
  { label: 'Customer Name', key: 'billtoname', width: '20%' },
  { label: 'GST No', key: 'billtogstno', width: '12%' },
  { label: 'Net Qntl', key: 'NETQNTL', width: '7%', numeric: true },
  { label: 'GST Rate', key: 'gstrate', width: '6%', center: true },
  { label: 'Taxable Amt', key: 'TaxableAmount', width: '9%', numeric: true },
  { label: 'CGST Amt', key: 'CGSTAmount', width: '7%', numeric: true },
  { label: 'SGST Amt', key: 'SGSTAmount', width: '7%', numeric: true },
  { label: 'IGST Amt', key: 'IGSTAmount', width: '7%', numeric: true },
  { label: 'Bill Amount', key: 'Bill_Amount', width: '9%', numeric: true },
];

const PRINT_COLUMNS = [
  { label: 'Bill No', key: 'doc_no', printWidth: '14mm' },
  { label: 'Date', key: 'doc_date', printWidth: '18mm', center: true },
  { label: 'Customer Name', key: 'billtoname', printWidth: '52mm' },
  { label: 'Net Qntl', key: 'NETQNTL', printWidth: '18mm', numeric: true },
  { label: 'Taxable Amt', key: 'TaxableAmount', printWidth: '22mm', numeric: true },
  { label: 'CGST Amt', key: 'CGSTAmount', printWidth: '16mm', numeric: true },
  { label: 'SGST Amt', key: 'SGSTAmount', printWidth: '16mm', numeric: true },
  { label: 'IGST Amt', key: 'IGSTAmount', printWidth: '16mm', numeric: true },
  { label: 'Bill Amount', key: 'Bill_Amount', printWidth: '20mm', numeric: true },
];

const PRINT_NUMERIC_COLS = PRINT_COLUMNS.map((c, i) => (c.numeric ? i : null)).filter(i => i !== null);
const PRINT_CENTER_COLS = PRINT_COLUMNS.map((c, i) => (c.center ? i : null)).filter(i => i !== null);

const SaleRegister = () => {
  const location = useLocation();
  const Company_Name = sessionStorage.getItem('Company_Name');
  const Company_GSTNO = sessionStorage.getItem('Company_GSTNO');
  const searchParams = new URLSearchParams(location.search);
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');
  const company_Code = searchParams.get('companyCode');
  const YearCode = searchParams.get('yearCode');
  const acCode = searchParams.get('acCode');

  const [pdfPreview, setPdfPreview] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const API_URL = `${apikey}/Sale_Register`;

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return [
      String(d.getDate()).padStart(2, '0'),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getFullYear()),
    ].join('/');
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(API_URL, {
          params: {
            from_date: fromDate, to_date: toDate,
            Company_Code: company_Code, Year_code: YearCode, acCode,
          },
        });
        setReportData(res.data);
      } catch (err) {
        console.error(err);
        setError('Error fetching report');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [API_URL]);

  const sortedData = useMemo(() => {
    const items = [...reportData];
    if (sortConfig.key) {
      items.sort((a, b) => {
        const va = a[sortConfig.key], vb = b[sortConfig.key];
        if (va < vb) return sortConfig.direction === 'asc' ? -1 : 1;
        if (va > vb) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [reportData, sortConfig]);

  const requestSort = (key) =>
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));

  const grandTotals = useMemo(() =>
    reportData.reduce((acc, item) => {
      acc.TotalTaxable_Amt += Number(item.TaxableAmount) || 0;
      acc.CGSTAmt += Number(item.CGSTAmount) || 0;
      acc.SGSTAmt += Number(item.SGSTAmount) || 0;
      acc.IGSTAmt += Number(item.IGSTAmount) || 0;
      acc.BillamountAmt += Number(item.Bill_Amount) || 0;
      acc.netqntl += Number(item.NETQNTL) || 0;
      return acc;
    }, { TotalTaxable_Amt: 0, CGSTAmt: 0, SGSTAmt: 0, IGSTAmt: 0, BillamountAmt: 0, netqntl: 0 }),
    [reportData]);

  // Screen row: 11 cols (all)
  const renderScreenRow = (item) => [
    item.doc_no,
    formatDate(item.doc_date),
    item.billtoname,
    item.billtogstno,
    formatReadableAmount(item.NETQNTL),
    item.gstrate,
    formatReadableAmount(item.TaxableAmount),
    formatReadableAmount(item.CGSTAmount),
    formatReadableAmount(item.SGSTAmount),
    formatReadableAmount(item.IGSTAmount),
    formatReadableAmount(item.Bill_Amount),
  ];

  // Print row: 9 cols (no GST No, no GST Rate)
  const renderPrintRow = (item) => [
    item.doc_no,
    formatDate(item.doc_date),
    item.billtoname,
    formatReadableAmount(item.NETQNTL),
    formatReadableAmount(item.TaxableAmount),
    formatReadableAmount(item.CGSTAmount),
    formatReadableAmount(item.SGSTAmount),
    formatReadableAmount(item.IGSTAmount),
    formatReadableAmount(item.Bill_Amount),
  ];

  const printFooterValues = [
    '', 'GRAND TOTAL', '',
    formatReadableAmount(grandTotals.netqntl),
    formatReadableAmount(grandTotals.TotalTaxable_Amt),
    formatReadableAmount(grandTotals.CGSTAmt),
    formatReadableAmount(grandTotals.SGSTAmt),
    formatReadableAmount(grandTotals.IGSTAmt),
    formatReadableAmount(grandTotals.BillamountAmt),
  ];

  const reportSubtitle = `${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`;

  const handleExportToExcel = () => {
    const headers = SCREEN_COLUMNS.map((c) => c.label);

    // 1. Create the Meta Data Rows
    const companyNameRow = [Company_Name.toUpperCase()];
    const gstRow = [`GST No: ${Company_GSTNO}`];
    const periodRow = [`Period: ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`];
    const emptyRow = [];

    // 2. Map the Table Data
    const tableData = sortedData.map((item) =>
      SCREEN_COLUMNS.map((col) => {
        if (col.numeric) return Number(item[col.key]) || 0;
        if (col.key === 'doc_date') return formatDate(item[col.key]);
        return item[col.key];
      })
    );

    // 3. Add Grand Total Row for Excel
    const totalRow = [
      "GRAND TOTAL", "", "", "",
      grandTotals.netqntl,
      "",
      grandTotals.TotalTaxable_Amt,
      grandTotals.CGSTAmt,
      grandTotals.SGSTAmt,
      grandTotals.IGSTAmt,
      grandTotals.BillamountAmt
    ];

    // 4. Combine all into an Array of Arrays
    const worksheetData = [
      companyNameRow,
      gstRow,
      periodRow,
      emptyRow,
      headers,
      ...tableData,
      totalRow
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // Optional: Basic styling/merging for the title
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Merge Company Name
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }  // Merge GST
    ];

    ws['!cols'] = SCREEN_COLUMNS.map((c) => ({ wch: c.numeric ? 15 : 25 }));

    XLSX.utils.book_append_sheet(wb, ws, 'SaleRegister');
    XLSX.writeFile(wb, `SaleRegister_${fromDate}_to_${toDate}.xlsx`);
  };

  // const handleGeneratePDF = () => {
  //   generateReportPDF({
  //     title: 'Sale Register',
  //     subtitle: reportSubtitle,
  //     columns: PRINT_COLUMNS.map(c => c.label),
  //     // PDF column widths in mm matching PRINT_COLUMNS printWidth
  //     columnWidths: [14, 18, 52, 18, 22, 16, 16, 16, 20],
  //     rows: sortedData.map(renderPrintRow),
  //     footerRow: printFooterValues,
  //     numericCols: PRINT_NUMERIC_COLS,
  //     centerCols: PRINT_CENTER_COLS,
  //     amountInWords: ConvertNumberToWord(grandTotals.BillamountAmt),
  //     headerImgSrc: HeaderJK,
  //     footerImgSrc: FooterJK,
  //     onComplete: (url) => setPdfPreview(url),
  //   });
  // };

const handleGeneratePDF = () => {
  // Define the styles once to keep the code clean
  const footerStyle = { 
    fillColor: [255, 249, 196], 
    fontStyle: 'bold' 
  };

  // Map the existing printFooterValues to include the required styling
  const styledFooterRow = printFooterValues.map((value, index) => {
    const isNumeric = PRINT_NUMERIC_COLS.includes(index);
    
    return {
      content: value,
      styles: {
        ...footerStyle,
        halign: isNumeric ? 'right' : (PRINT_CENTER_COLS.includes(index) ? 'center' : 'left')
      }
    };
  });

  generateReportPDF({
    title: 'Sale Register',
    subtitle: reportSubtitle,
    columns: PRINT_COLUMNS.map(c => c.label),
    columnWidths: [14, 18, 52, 18, 22, 16, 16, 16, 20],
    rows: sortedData.map(renderPrintRow),
    
    // Use the newly styled footer row
    footerRow: styledFooterRow,
    
    numericCols: PRINT_NUMERIC_COLS,
    centerCols: PRINT_CENTER_COLS,
    amountInWords: ConvertNumberToWord(grandTotals.BillamountAmt),
    headerImgSrc: HeaderJK,
    footerImgSrc: FooterJK,
    orientation: 'landscape', // Added landscape to match your previous requirements
    onComplete: (url) => setPdfPreview(url),
  });
};


  const handlePrint = () => window.print();

  return (
    <div style={{ marginTop: '-20px', padding: '20px' }}>

      {/* Print view — PRINT_COLUMNS (no GST No, no GST Rate) */}
      <CommonPrintView
        title="Sale Register Report"
        subtitle={reportSubtitle}
        companyName={Company_Name}
        companyGST={Company_GSTNO}
        columns={PRINT_COLUMNS}
        rows={sortedData}
        rowRenderer={renderPrintRow}
        footerValues={printFooterValues}
        amountInWords={ConvertNumberToWord(grandTotals.BillamountAmt)}
        headerImg={HeaderJK}
        footerImg={FooterJK}
      />

      {/* Screen header */}
      <Typography variant="h5" align="center" style={{ fontWeight: 'bold',marginTop:'-50px' }}>
        {Company_Name}
      </Typography>
      <Typography variant="subtitle1" align="center">GSTN: {Company_GSTNO}</Typography>
      <Typography variant="h6" align="center">
        Sale Register
      </Typography>
      <Typography variant="subtitle2" align="center" color="textSecondary">
        {reportSubtitle}
      </Typography>


      <div className="my-3 no-print d-flex justify-content-end">

        <button className="btn btn-danger" onClick={handleGeneratePDF}>
          Print
        </button>
        <button className="btn btn-success me-2" onClick={handleExportToExcel}>
          Export Excel
        </button>

      </div>

      {pdfPreview && <PdfPreview pdfData={pdfPreview} label="SaleRegister" />}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Screen table — ALL columns */}
      <TableContainer component={Paper} style={{ maxHeight: '700px', position: 'relative' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {SCREEN_COLUMNS.map(col => (
                <TableCell
                  key={col.key}
                  align={col.numeric ? 'right' : col.center ? 'center' : 'left'}
                  style={{ fontWeight: 'bold', backgroundColor: '#5557df', color: '#fff', whiteSpace: 'nowrap' }}
                >
                  <TableSortLabel
                    active={sortConfig.key === col.key}
                    direction={sortConfig.direction}
                    onClick={() => requestSort(col.key)}
                    sx={{
                      '&.MuiTableSortLabel-root': { color: '#fff' },
                      '&.MuiTableSortLabel-root:hover': { color: '#cce0ff' },
                      '&.Mui-active': { color: '#fff' },
                      '& .MuiTableSortLabel-icon': { color: '#fff !important' },
                    }}
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
                    align={SCREEN_COLUMNS[ci]?.numeric ? 'right' : SCREEN_COLUMNS[ci]?.center ? 'center' : 'left'}
                    style={{ fontSize: '0.78rem', whiteSpace: ci < 2 ? 'nowrap' : 'normal' }}
                  >
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>

          <TableFooter style={{ position: 'sticky', bottom: 0, zIndex: 2 }}>
            <TableRow style={{ backgroundColor: '#ffffcc' }}>
              <TableCell colSpan={4} style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>GRAND TOTAL</TableCell>
              <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>{formatReadableAmount(grandTotals.netqntl)}</TableCell>
              <TableCell />
              <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>{formatReadableAmount(grandTotals.TotalTaxable_Amt)}</TableCell>
              <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>{formatReadableAmount(grandTotals.CGSTAmt)}</TableCell>
              <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>{formatReadableAmount(grandTotals.SGSTAmt)}</TableCell>
              <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>{formatReadableAmount(grandTotals.IGSTAmt)}</TableCell>
              <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>{formatReadableAmount(grandTotals.BillamountAmt)}</TableCell>
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

export default SaleRegister;