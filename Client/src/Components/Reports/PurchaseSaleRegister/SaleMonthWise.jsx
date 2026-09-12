import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { useLocation } from "react-router-dom";
import { ScaleLoader } from "react-spinners";
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Typography, TableFooter, TableSortLabel,
} from "@mui/material";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate";
import PdfPreview from "../../../Common/PDFPreview";
import HeaderJK from "../../../Assets/HeaderJK.png";
import FooterJK from "../../../Assets/FooterJK.png";
import { ConvertNumberToWord } from "../../../Common/FormatFunctions/ConvertNumberToWord";
import { generateReportPDF } from "../../../Common/ReportCommon/CommonPDFGenerator";

const apikey = process.env.REACT_APP_API;

// 1. Screen Column Definitions
const SCREEN_COLUMNS = [
  { label: "Year", key: "yr", width: "8%", center: true },
  { label: "Month", key: "mn", width: "10%", center: true },
  { label: "SB Qty", key: "SB_qntl", width: "10%", numeric: true },
  { label: "DN Qty", key: "DN_qntl", width: "10%", numeric: true },
  { label: "CN Qty", key: "CN_qntl", width: "10%", numeric: true },
  { label: "Net Qty", key: "net_qntl", width: "10%", numeric: true },
  { label: "SB Amt", key: "SB_amt", width: "11%", numeric: true },
  { label: "DN Amt", key: "DN_amt", width: "11%", numeric: true },
  { label: "CN Amt", key: "CN_amt", width: "11%", numeric: true },
  { label: "Net Amt", key: "net_amt", width: "11%", numeric: true },
];

// 2. Refined PDF Column Widths for A4 Landscape (Ensures no cutting)
const PRINT_COLUMNS = [
  { label: "Year", key: "yr", printWidth: 12, center: true },
  { label: "Month", key: "mn", printWidth: 15, center: true },
  { label: "SB Qty", key: "SB_qntl", printWidth: 16, numeric: true },
  { label: "DN Qty", key: "DN_qntl", printWidth: 16, numeric: true },
  { label: "CN Qty", key: "CN_qntl", printWidth: 16, numeric: true },
  { label: "Net Qty", key: "net_qntl", printWidth: 20, numeric: true },
  { label: "SB Amt", key: "SB_amt", printWidth: 22, numeric: true },
  { label: "DN Amt", key: "DN_amt", printWidth: 18, numeric: true },
  { label: "CN Amt", key: "CN_amt", printWidth: 18, numeric: true },
  { label: "Net Amt", key: "net_amt", printWidth: 22, numeric: true },
];

const PRINT_NUMERIC_COLS = PRINT_COLUMNS.map((c, i) => (c.numeric ? i : null)).filter(i => i !== null);
const PRINT_CENTER_COLS = PRINT_COLUMNS.map((c, i) => (c.center ? i : null)).filter(i => i !== null);

const SaleMonthWise = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const Company_Name = sessionStorage.getItem("Company_Name");
  const Company_GSTNO = sessionStorage.getItem("Company_GSTNO");
  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDate");
  const company_Code = searchParams.get("companyCode");
  const YearCode = searchParams.get("yearCode");
  const acCode = searchParams.get("acCode");

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pdfPreview, setPdfPreview] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "yr", direction: "desc" });

  const API_URL = `${apikey}/MonthSaleWise_Register`;

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(API_URL, {
          params: { from_date: fromDate, to_date: toDate, acCode, Company_Code: company_Code, Year_code: YearCode },
        });
        setReportData(response.data);
      } catch (error) {
        setError("Error fetching report data");
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [API_URL, fromDate, toDate, acCode, company_Code, YearCode]);

  const sortedData = useMemo(() => {
    let items = [...reportData];
    if (sortConfig.key) {
      items.sort((a, b) => {
        const va = a[sortConfig.key] || 0;
        const vb = b[sortConfig.key] || 0;
        if (va < vb) return sortConfig.direction === "asc" ? -1 : 1;
        if (va > vb) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [reportData, sortConfig]);

  const requestSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const grandTotals = useMemo(() =>
    reportData.reduce((acc, row) => {
      acc.SB_qntl += parseFloat(row.SB_qntl) || 0;
      acc.DN_qntl += parseFloat(row.DN_qntl) || 0;
      acc.CN_qntl += parseFloat(row.CN_qntl) || 0;
      acc.net_qntl += parseFloat(row.net_qntl) || 0;
      acc.SB_amt += parseFloat(row.SB_amt) || 0;
      acc.DN_amt += parseFloat(row.DN_amt) || 0;
      acc.CN_amt += parseFloat(row.CN_amt) || 0;
      acc.net_amt += parseFloat(row.net_amt) || 0;
      return acc;
    }, { SB_qntl: 0, DN_qntl: 0, CN_qntl: 0, net_qntl: 0, SB_amt: 0, DN_amt: 0, CN_amt: 0, net_amt: 0 }),
    [reportData]);

  const reportSubtitle = `${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`;

  const handleExportToExcel = () => {
    const headers = SCREEN_COLUMNS.map(c => c.label);
    const worksheetData = [
      [Company_Name?.toUpperCase()],
      [`GST No: ${Company_GSTNO}`],
      [`Sale Month Wise Register: ${reportSubtitle}`],
      [],
      headers,
      ...sortedData.map(item => SCREEN_COLUMNS.map(col => col.numeric ? Number(item[col.key]) || 0 : item[col.key])),
      ["", "GRAND TOTAL", 
        grandTotals.SB_qntl, grandTotals.DN_qntl, grandTotals.CN_qntl, grandTotals.net_qntl, 
        grandTotals.SB_amt, grandTotals.DN_amt, grandTotals.CN_amt, grandTotals.net_amt]
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    ws['!cols'] = SCREEN_COLUMNS.map(() => ({ wch: 15 }));
    XLSX.utils.book_append_sheet(wb, ws, "SaleMonthWise");
    XLSX.writeFile(wb, `SaleMonthWise_${fromDate}.xlsx`);
  };

  // const handleGeneratePDF = () => {
  //   generateReportPDF({
  //     title: 'Sale Month Wise Register',
  //     subtitle: reportSubtitle,
  //     columns: PRINT_COLUMNS.map(c => c.label),
  //     columnWidths: PRINT_COLUMNS.map(c => c.printWidth),
  //     rows: sortedData.map(item => [
  //       item.yr, item.mn,
  //       formatReadableAmount(item.SB_qntl), formatReadableAmount(item.DN_qntl),
  //       formatReadableAmount(item.CN_qntl), formatReadableAmount(item.net_qntl),
  //       formatReadableAmount(item.SB_amt), formatReadableAmount(item.DN_amt),
  //       formatReadableAmount(item.CN_amt), formatReadableAmount(item.net_amt),
  //     ]),
  //     // Fixed Footer Alignment: Ensure indexing matches columns exactly
  //     footerRow: [
  //       '', 
  //       'GRAND TOTAL',
  //       formatReadableAmount(grandTotals.SB_qntl), 
  //       formatReadableAmount(grandTotals.DN_qntl),
  //       formatReadableAmount(grandTotals.CN_qntl), 
  //       formatReadableAmount(grandTotals.net_qntl),
  //       formatReadableAmount(grandTotals.SB_amt), 
  //       formatReadableAmount(grandTotals.DN_amt),
  //       formatReadableAmount(grandTotals.CN_amt), 
  //       formatReadableAmount(grandTotals.net_amt)
  //     ],
  //     numericCols: PRINT_NUMERIC_COLS,
  //     centerCols: PRINT_CENTER_COLS,
  //     amountInWords: ConvertNumberToWord(grandTotals.net_amt),
  //     headerImgSrc: HeaderJK,
  //     footerImgSrc: FooterJK,
  //     orientation: 'landscape',
  //     onComplete: (url) => setPdfPreview(url),
  //   });
  // };




  const handleGeneratePDF = () => {
  generateReportPDF({
    title: 'Sale Month Wise Register',
    subtitle: reportSubtitle,
    columns: PRINT_COLUMNS.map(c => c.label),
    columnWidths: PRINT_COLUMNS.map(c => c.printWidth),
    rows: sortedData.map(item => [
      item.yr, 
      item.mn,
      formatReadableAmount(item.SB_qntl), 
      formatReadableAmount(item.DN_qntl),
      formatReadableAmount(item.CN_qntl), 
      formatReadableAmount(item.net_qntl),
      formatReadableAmount(item.SB_amt), 
      formatReadableAmount(item.DN_amt),
      formatReadableAmount(item.CN_amt), 
      formatReadableAmount(item.net_amt),
    ]),
    
    // Updated footer with styling (Yellow background [255, 249, 196] and alignments)
    footerRow: [
      { content: '', styles: { fillColor: [255, 249, 196] } }, 
      { content: 'GRAND TOTAL', styles: { fontStyle: 'bold', fillColor: [255, 249, 196] } },
      { content: formatReadableAmount(grandTotals.SB_qntl), styles: { halign: 'right', fontStyle: 'bold', fillColor: [255, 249, 196] } }, 
      { content: formatReadableAmount(grandTotals.DN_qntl), styles: { halign: 'right', fontStyle: 'bold', fillColor: [255, 249, 196] } },
      { content: formatReadableAmount(grandTotals.CN_qntl), styles: { halign: 'right', fontStyle: 'bold', fillColor: [255, 249, 196] } }, 
      { content: formatReadableAmount(grandTotals.net_qntl), styles: { halign: 'right', fontStyle: 'bold', fillColor: [255, 249, 196] } },
      { content: formatReadableAmount(grandTotals.SB_amt), styles: { halign: 'right', fontStyle: 'bold', fillColor: [255, 249, 196] } }, 
      { content: formatReadableAmount(grandTotals.DN_amt), styles: { halign: 'right', fontStyle: 'bold', fillColor: [255, 249, 196] } },
      { content: formatReadableAmount(grandTotals.CN_amt), styles: { halign: 'right', fontStyle: 'bold', fillColor: [255, 249, 196] } }, 
      { content: formatReadableAmount(grandTotals.net_amt), styles: { halign: 'right', fontStyle: 'bold', fillColor: [255, 249, 196] } }
    ],

    numericCols: PRINT_NUMERIC_COLS,
    centerCols: PRINT_CENTER_COLS,
    amountInWords: ConvertNumberToWord(grandTotals.net_amt),
    headerImgSrc: HeaderJK,
    footerImgSrc: FooterJK,
    orientation: 'landscape',
    onComplete: (url) => setPdfPreview(url),
  });
};

  return (
    <div style={{ padding: '20px', marginTop: '-20px' }}>
      <Typography variant="h5" align="center" style={{ fontWeight: 'bold' }}>{Company_Name}</Typography>
      <Typography variant="subtitle1" align="center">GSTN: {Company_GSTNO}</Typography>
      <Typography variant="h6" align="center">Sale Month Wise Register</Typography>
      <Typography variant="subtitle2" align="center" color="textSecondary">{reportSubtitle}</Typography>

      <div className="my-3 no-print d-flex justify-content-end">
        <button className="btn btn-danger" onClick={handleGeneratePDF}>Print PDF</button>
        <button className="btn btn-success ms-2" onClick={handleExportToExcel}>Export Excel</button>
      </div>

      {pdfPreview && <PdfPreview pdfData={pdfPreview} label="SaleMonthWise" />}
      {error && <div className="alert alert-danger">{error}</div>}

      <TableContainer component={Paper} style={{ maxHeight: '700px', maxWidth: '1250px', margin: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {SCREEN_COLUMNS.map(col => (
                <TableCell
                  key={col.key}
                  align={col.numeric ? 'right' : col.center ? 'center' : 'left'}
                  style={{ backgroundColor: '#5557df', color: '#fff', fontWeight: 'bold' }}
                >
                  <TableSortLabel
                    active={sortConfig.key === col.key}
                    direction={sortConfig.direction}
                    onClick={() => requestSort(col.key)}
                    sx={{ '&.Mui-active, & .MuiTableSortLabel-icon': { color: '#fff !important' }, '&:hover': { color: '#cce0ff' } }}
                  > {col.label} </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((item, idx) => (
              <TableRow key={idx} hover style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f9faff' }}>
                {SCREEN_COLUMNS.map((col, i) => (
                  <TableCell key={i} align={col.numeric ? 'right' : col.center ? 'center' : 'left'} style={{ fontSize: '0.85rem' }}>
                    {col.numeric ? formatReadableAmount(item[col.key]) : item[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
          <TableFooter style={{ position: 'sticky', bottom: 0, zIndex: 2 }}>
            <TableRow style={{ backgroundColor: '#ffffcc' }}>
              <TableCell colSpan={2} style={{ fontWeight: 'bold', textAlign: 'center' }}>GRAND TOTAL</TableCell>
              <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.SB_qntl)}</TableCell>
              <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.DN_qntl)}</TableCell>
              <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.CN_qntl)}</TableCell>
              <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.net_qntl)}</TableCell>
              <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.SB_amt)}</TableCell>
              <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.DN_amt)}</TableCell>
              <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.CN_amt)}</TableCell>
              <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.net_amt)}</TableCell>
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

export default SaleMonthWise;