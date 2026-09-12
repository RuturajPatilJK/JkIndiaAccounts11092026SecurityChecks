import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as XLSX from 'xlsx';
import { useLocation } from 'react-router-dom';
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import {
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, Typography, TableSortLabel, TableFooter
} from "@mui/material";
import { ScaleLoader } from 'react-spinners';
import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate";
import PdfPreview from '../../../Common/PDFPreview';
import HeaderJK from '../../../Assets/HeaderJK.png';
import FooterJK from '../../../Assets/FooterJK.png';
import { ConvertNumberToWord } from '../../../Common/FormatFunctions/ConvertNumberToWord';
import { generateReportPDF } from '../../../Common/ReportCommon/CommonPDFGenerator';

const apikey = process.env.REACT_APP_API;

// All columns for Screen and Excel
const SCREEN_COLUMNS = [
    { label: "Our No", key: "doc_no", width: '5%' },
    { label: "Date", key: "doc_date", width: '8%', center: true },
    { label: "Bill No", key: "Bill_No", width: '7%' },
    { label: "Supplier Name", key: "suppliername", width: '20%' },
    { label: "GST No", key: "suppliergstno", width: '12%' },
    { label: "Net Qntl", key: "NETQNTL", width: '8%', numeric: true },
    { label: "GST Rate", key: "gstrate", width: '6%', numeric: true },
    { label: "Taxable", key: "subTotal", width: '8%', numeric: true },
    { label: "CGST", key: "CGSTAmount", width: '6%', numeric: true },
    { label: "SGST", key: "SGSTAmount", width: '6%', numeric: true },
    { label: "IGST", key: "IGSTAmount", width: '6%', numeric: true },
    { label: "Bill Amount", key: "Bill_Amount", width: '8%', numeric: true },
];

// Limited columns for PDF Print (Removed GST No and GST Rate)
const PRINT_COLUMNS = [
    { label: 'Our No', key: 'doc_no', printWidth: '12mm' },
    { label: 'Date', key: 'doc_date', printWidth: '18mm', center: true },
    { label: 'Bill No', key: 'Bill_No', printWidth: '15mm' },
    { label: 'Supplier Name', key: 'suppliername', printWidth: '45mm' },
    { label: 'Net Qntl', key: 'NETQNTL', printWidth: '18mm', numeric: true },
    { label: 'Taxable', key: 'subTotal', printWidth: '22mm', numeric: true },
    { label: 'CGST', key: 'CGSTAmount', printWidth: '18mm', numeric: true },
    { label: 'SGST', key: 'SGSTAmount', printWidth: '18mm', numeric: true },
    { label: 'IGST', key: 'IGSTAmount', printWidth: '15mm', numeric: true },
    { label: 'Bill Amount', key: 'Bill_Amount', printWidth: '20mm', numeric: true },
];

const PRINT_NUMERIC_COLS = PRINT_COLUMNS.map((c, i) => (c.numeric ? i : null)).filter(i => i !== null);
const PRINT_CENTER_COLS = PRINT_COLUMNS.map((c, i) => (c.center ? i : null)).filter(i => i !== null);

const PurchaseRegister = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const Company_Name = sessionStorage.getItem('Company_Name');
    const Company_GSTNO = sessionStorage.getItem('Company_GSTNO');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const company_Code = searchParams.get('companyCode');
    const YearCode = searchParams.get('yearCode');
    const acCode = searchParams.get('acCode');

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pdfPreview, setPdfPreview] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'doc_no', direction: 'asc' });

    // Date formatter for DD/MM/YYYY
    const formatDate = (dateString) => {
        if (!dateString) return "";
        const d = new Date(dateString);
        return [
            String(d.getDate()).padStart(2, '0'),
            String(d.getMonth() + 1).padStart(2, '0'),
            String(d.getFullYear()),
        ].join('/');
    };

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${apikey}/Purchase_Register`, {
                    params: { from_date: fromDate, to_date: toDate, Company_Code: company_Code, Year_code: YearCode, acCode }
                });
                setReportData(response.data);
            } catch (error) {
                console.error('Error fetching report:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchReportData();
    }, [fromDate, toDate, company_Code, YearCode, acCode]);

    const sortedData = useMemo(() => {
        let items = [...reportData];
        if (sortConfig.key) {
            items.sort((a, b) => {
                const aVal = isNaN(a[sortConfig.key]) ? a[sortConfig.key] : parseFloat(a[sortConfig.key]);
                const bVal = isNaN(b[sortConfig.key]) ? b[sortConfig.key] : parseFloat(b[sortConfig.key]);
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return items;
    }, [reportData, sortConfig]);

    const grandTotals = useMemo(() => {
        return sortedData.reduce((acc, item) => ({
            netqntl: acc.netqntl + (parseFloat(item.NETQNTL) || 0),
            taxable: acc.taxable + (parseFloat(item.subTotal) || 0),
            cgst: acc.cgst + (parseFloat(item.CGSTAmount) || 0),
            sgst: acc.sgst + (parseFloat(item.SGSTAmount) || 0),
            igst: acc.igst + (parseFloat(item.IGSTAmount) || 0),
            bill: acc.bill + (parseFloat(item.Bill_Amount) || 0),
        }), { netqntl: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, bill: 0 });
    }, [sortedData]);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const handleExportExcel = () => {
        const worksheetData = sortedData.map(item => ({
            "Our No": item.doc_no,
            "Date": formatDate(item.doc_date),
            "Bill No": item.Bill_No,
            "Supplier": item.suppliername,
            "GST No": item.suppliergstno,
            "Net Qntl": parseFloat(item.NETQNTL || 0),
            "GST Rate": parseFloat(item.gstrate || 0),
            "Taxable": parseFloat(item.subTotal || 0),
            "CGST": parseFloat(item.CGSTAmount || 0),
            "SGST": parseFloat(item.SGSTAmount || 0),
            "IGST": parseFloat(item.IGSTAmount || 0),
            "Bill Amount": parseFloat(item.Bill_Amount || 0),
        }));

        worksheetData.push({
            "Supplier": "GRAND TOTAL",
            "Net Qntl": grandTotals.netqntl,
            "Taxable": grandTotals.taxable,
            "CGST": grandTotals.cgst,
            "SGST": grandTotals.sgst,
            "IGST": grandTotals.igst,
            "Bill Amount": grandTotals.bill,
        });

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Purchase_Register");
        XLSX.writeFile(workbook, `PurchaseRegister_${fromDate}_to_${toDate}.xlsx`);
    };

    // Data specifically for PDF Print (Matches PRINT_COLUMNS)
    const renderPrintRow = (item) => [
        item.doc_no,
        formatDate(item.doc_date),
        item.Bill_No,
        item.suppliername,
        formatReadableAmount(item.NETQNTL),
        formatReadableAmount(item.subTotal),
        formatReadableAmount(item.CGSTAmount),
        formatReadableAmount(item.SGSTAmount),
        formatReadableAmount(item.IGSTAmount),
        formatReadableAmount(item.Bill_Amount)
    ];

const handleGeneratePDF = () => {
    const yellowFooterStyle = { 
        fillColor: [255, 249, 196], 
        fontStyle: 'bold' 
    };

    generateReportPDF({
        title: 'Purchase Register',
        subtitle: `${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`,
        columns: PRINT_COLUMNS.map(c => c.label),
        columnWidths: PRINT_COLUMNS.map(c => parseInt(c.printWidth)),
        rows: sortedData.map(renderPrintRow),
        
        // Styled footer with yellow background and correct alignment
        footerRow: [
            { content: 'TOTAL', styles: yellowFooterStyle },
            { content: '', styles: yellowFooterStyle },
            { content: '', styles: yellowFooterStyle },
            { content: '', styles: yellowFooterStyle },
            { content: formatReadableAmount(grandTotals.netqntl), styles: { ...yellowFooterStyle, halign: 'right' } },
            { content: formatReadableAmount(grandTotals.taxable), styles: { ...yellowFooterStyle, halign: 'right' } },
            { content: formatReadableAmount(grandTotals.cgst), styles: { ...yellowFooterStyle, halign: 'right' } },
            { content: formatReadableAmount(grandTotals.sgst), styles: { ...yellowFooterStyle, halign: 'right' } },
            { content: formatReadableAmount(grandTotals.igst), styles: { ...yellowFooterStyle, halign: 'right' } },
            { content: formatReadableAmount(grandTotals.bill), styles: { ...yellowFooterStyle, halign: 'right' } }
        ],

        numericCols: PRINT_NUMERIC_COLS,
        centerCols: PRINT_CENTER_COLS,
        amountInWords: ConvertNumberToWord(grandTotals.bill),
        headerImgSrc: HeaderJK,
        footerImgSrc: FooterJK,
        orientation: 'landscape',
        onComplete: (url) => setPdfPreview(url),
    });
};

    return (
        <div style={{ padding: '10px',marginTop: '-80px'}}>
            <Typography variant="h5" align="center" style={{ fontWeight: 'bold'  }}>{Company_Name}</Typography>
            <Typography variant="subtitle1" align="center">GSTN: {Company_GSTNO}</Typography>
            <Typography variant="h6" align="center" style={{ fontWeight: 'bold'}}>Purchase Register</Typography>
            <Typography variant="subtitle2" align="center" color="textSecondary">
                {FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}
            </Typography>

            <div className="my-1 d-flex justify-content-end no-print">
                <button className="btn btn-danger me-2" onClick={handleGeneratePDF}>Print</button>
                <button className="btn btn-success" onClick={handleExportExcel}>Export Excel</button>
            </div>

            {pdfPreview && <PdfPreview pdfData={pdfPreview} label="PurchaseRegister" />}

            <TableContainer component={Paper} elevation={3} style={{ maxHeight: '70vh' }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {SCREEN_COLUMNS.map(col => (
                                <TableCell
                                    key={col.label}
                                    align={col.numeric ? 'right' : col.center ? 'center' : 'left'}
                                    style={{ backgroundColor: '#5557df', color: '#fff', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                                >
                                    <TableSortLabel
                                        active={sortConfig.key === col.key}
                                        direction={sortConfig.key === col.key ? sortConfig.direction : 'asc'}
                                        onClick={() => requestSort(col.key)}
                                        sx={{ '&.MuiTableSortLabel-root, &.Mui-active, & .MuiTableSortLabel-icon': { color: '#fff !important' } }}
                                    >
                                        {col.label}
                                    </TableSortLabel>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedData.map((item, idx) => (
                            <TableRow key={idx} hover>
                                <TableCell>{item.doc_no}</TableCell>
                                <TableCell align="center">{formatDate(item.doc_date)}</TableCell>
                                <TableCell>{item.Bill_No}</TableCell>
                                <TableCell>{item.suppliername}</TableCell>
                                <TableCell>{item.suppliergstno}</TableCell>
                                <TableCell align="right">{formatReadableAmount(item.NETQNTL)}</TableCell>
                                <TableCell align="right">{item.gstrate}</TableCell>
                                <TableCell align="right">{formatReadableAmount(item.subTotal)}</TableCell>
                                <TableCell align="right">{formatReadableAmount(item.CGSTAmount)}</TableCell>
                                <TableCell align="right">{formatReadableAmount(item.SGSTAmount)}</TableCell>
                                <TableCell align="right">{formatReadableAmount(item.IGSTAmount)}</TableCell>
                                <TableCell align="right">{formatReadableAmount(item.Bill_Amount)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter style={{ position: 'sticky', bottom: 0, zIndex: 5 }}>
                        <TableRow style={{ backgroundColor: '#ffffcc' }}>
                            <TableCell colSpan={5} style={{ fontWeight: 'bold' }}>GRAND TOTAL</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.netqntl)}</TableCell>
                            <TableCell />
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.taxable)}</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.cgst)}</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.sgst)}</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.igst)}</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.bill)}</TableCell>
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

export default PurchaseRegister;
