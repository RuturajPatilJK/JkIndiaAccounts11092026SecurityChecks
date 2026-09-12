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
    { label: 'PAN', key: 'Pan', width: '12%' },
    { label: 'Code', key: 'Party_Code', width: '8%' },
    { label: 'Party Name', key: 'Name_Of_Party', width: '25%' },
    { label: 'Taxable Amt', key: 'Taxable_Amt', width: '10%', numeric: true },
    { label: 'CGST', key: 'CGST', width: '8%', numeric: true },
    { label: 'SGST', key: 'SGST', width: '8%', numeric: true },
    { label: 'IGST', key: 'IGST', width: '8%', numeric: true },
    { label: 'Bill Amount', key: 'Bill_Amount', width: '11%', numeric: true },
    { label: 'TDS', key: 'TDS_Amt', width: '10%', numeric: true },
];

const PRINT_COLUMNS = [
    { label: 'PAN', key: 'Pan', printWidth: '25mm' },
    { label: 'Party Name', key: 'Name_Of_Party', printWidth: '55mm' },
    { label: 'Taxable Amt', key: 'Taxable_Amt', printWidth: '22mm', numeric: true },
    { label: 'CGST', key: 'CGST', printWidth: '18mm', numeric: true },
    { label: 'SGST', key: 'SGST', printWidth: '18mm', numeric: true },
    { label: 'IGST', key: 'IGST', printWidth: '18mm', numeric: true },
    { label: 'Bill Amount', key: 'Bill_Amount', printWidth: '22mm', numeric: true },
    { label: 'TDS', key: 'TDS_Amt', printWidth: '18mm', numeric: true },
];

const PRINT_NUMERIC_COLS = PRINT_COLUMNS.map((c, i) => (c.numeric ? i : null)).filter(i => i !== null);

const PurchaseTDSRegister = () => {
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

    const API_URL = `${apikey}/PurchaseTDS_Register`;

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await axios.get(API_URL, {
                    params: {
                        from_date: fromDate,
                        toDate: toDate,
                        companyCode: company_Code,
                        YearCode: YearCode,
                        acCode: acCode
                    },
                });
                setReportData(response.data);
            } catch (err) {
                console.error(err);
                setError('Error fetching report');
            } finally {
                setLoading(false);
            }
        };
        fetchReportData();
    }, [API_URL, fromDate, toDate, company_Code, YearCode, acCode]);

    const groupedData = useMemo(() => {
        const groups = {};
        reportData.forEach((item) => {
           
            const pan = (item.Pan || '').trim();
            const key = pan !== '' ? pan : `NOPAN-${item.Party_Code}-${item.Name_Of_Party}`;
            if (!groups[key]) {
                groups[key] = {
                    ...item,
                    Taxable_Amt: 0, CGST: 0, SGST: 0, IGST: 0, Bill_Amount: 0, TDS_Amt: 0
                };
            }
            groups[key].Taxable_Amt += parseFloat(item.Taxable_Amt) || 0;
            groups[key].CGST += parseFloat(item.CGST) || 0;
            groups[key].SGST += parseFloat(item.SGST) || 0;
            groups[key].IGST += parseFloat(item.IGST) || 0;
            groups[key].Bill_Amount += parseFloat(item.Bill_Amount) || 0;
            groups[key].TDS_Amt += parseFloat(item.TDS_Amt) || 0;
        });
        return Object.values(groups);
    }, [reportData]);

    const sortedData = useMemo(() => {
        const items = [...groupedData];
        if (sortConfig.key) {
            items.sort((a, b) => {
                const va = a[sortConfig.key], vb = b[sortConfig.key];
                if (va < vb) return sortConfig.direction === 'asc' ? -1 : 1;
                if (va > vb) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return items;
    }, [groupedData, sortConfig]);

    const requestSort = (key) =>
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));

    const grandTotals = useMemo(() =>
        sortedData.reduce((acc, item) => {
            acc.Taxable_Amt += item.Taxable_Amt;
            acc.CGST += item.CGST;
            acc.SGST += item.SGST;
            acc.IGST += item.IGST;
            acc.Bill_Amount += item.Bill_Amount;
            acc.TDS_Amt += item.TDS_Amt;
            return acc;
        }, { Taxable_Amt: 0, CGST: 0, SGST: 0, IGST: 0, Bill_Amount: 0, TDS_Amt: 0 }),
        [sortedData]);

    const renderScreenRow = (item) => [
        item.Pan,
        item.Party_Code,
        item.Name_Of_Party,
        formatReadableAmount(item.Taxable_Amt.toFixed(2)),
        formatReadableAmount(item.CGST.toFixed(2)),
        formatReadableAmount(item.SGST.toFixed(2)),
        formatReadableAmount(item.IGST.toFixed(2)),
        formatReadableAmount(item.Bill_Amount.toFixed(2)),
        formatReadableAmount(item.TDS_Amt.toFixed(2)),
    ];

    const renderPrintRow = (item) => [
        item.Pan,
        item.Name_Of_Party,
        formatReadableAmount(item.Taxable_Amt.toFixed(2)),
        formatReadableAmount(item.CGST.toFixed(2)),
        formatReadableAmount(item.SGST.toFixed(2)),
        formatReadableAmount(item.IGST.toFixed(2)),
        formatReadableAmount(item.Bill_Amount.toFixed(2)),
        formatReadableAmount(item.TDS_Amt.toFixed(2)),
    ];

    const printFooterValues = [
        '', 'GRAND TOTAL',
        formatReadableAmount(grandTotals.Taxable_Amt.toFixed(2)),
        formatReadableAmount(grandTotals.CGST.toFixed(2)),
        formatReadableAmount(grandTotals.SGST.toFixed(2)),
        formatReadableAmount(grandTotals.IGST.toFixed(2)),
        formatReadableAmount(grandTotals.Bill_Amount.toFixed(2)),
        formatReadableAmount(grandTotals.TDS_Amt.toFixed(2)),
    ];

    const reportSubtitle = `${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`;

    const handleExportToExcel = () => {
        // 1. Prepare Headers
        const headers = SCREEN_COLUMNS.map((c) => c.label);

        // 2. Prepare Data Rows
        const tableData = sortedData.map((item) =>
            SCREEN_COLUMNS.map((col) => {
                // Ensure numeric values are actually numbers for Excel
                if (col.numeric) return Number(item[col.key]) || 0;
                return item[col.key];
            })
        );


        const totalRow = [
            "GRAND TOTAL", "", "",
            grandTotals.Taxable_Amt,
            grandTotals.CGST,
            grandTotals.SGST,
            grandTotals.IGST,
            grandTotals.Bill_Amount,
            grandTotals.TDS_Amt
        ];

        // 4. Combine Meta Data and Table Data
        const worksheetData = [
            [Company_Name.toUpperCase()],
            [`GST No: ${Company_GSTNO}`],
            [`Period: ${reportSubtitle}`],
            [], // Empty row
            headers,
            ...tableData,
            totalRow
        ];

        // 5. Create Worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(worksheetData);

        // 6. Set Column Widths and Alignments
        // 'wch' is character width
        ws['!cols'] = SCREEN_COLUMNS.map((col) => ({
            wch: col.width ? parseInt(col.width) * 2 : 20
        }));


        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell_address = { c: C, r: R };
                const cell_ref = XLSX.utils.encode_cell(cell_address);
                if (!ws[cell_ref]) continue;


                if (SCREEN_COLUMNS[C]?.numeric) {
                    if (!ws[cell_ref].s) ws[cell_ref].s = {};
                    ws[cell_ref].s.alignment = { horizontal: "right" };
                    // Ensure type is number
                    if (R > 4) ws[cell_ref].t = 'n';
                }
            }
        }


        XLSX.utils.book_append_sheet(wb, ws, 'PurchaseTDSRegister');
        XLSX.writeFile(wb, `PurchaseTDS_Register_${fromDate}_to_${toDate}.xlsx`);
    };

const handleGeneratePDF = () => {
    // Define the style for the yellow total bar
    const yellowFooterStyle = { 
        fillColor: [255, 249, 196], 
        fontStyle: 'bold' 
    };

    // Transform the simple footer values into styled objects
    const styledFooterRow = printFooterValues.map((value, index) => {
        // Check if this specific column index is supposed to be numeric
        const isNumeric = PRINT_NUMERIC_COLS.includes(index);
        
        return {
            content: value,
            styles: {
                ...yellowFooterStyle,
                halign: isNumeric ? 'right' : 'left'
            }
        };
    });

    generateReportPDF({
        title: 'Purchase TDS Register',
        subtitle: reportSubtitle,
        columns: PRINT_COLUMNS.map(c => c.label),
        columnWidths: [25, 55, 22, 18, 18, 18, 22, 18],
        rows: sortedData.map(renderPrintRow),
        
        // Use the new styled footer
        footerRow: styledFooterRow,
        
        numericCols: PRINT_NUMERIC_COLS,
        amountInWords: ConvertNumberToWord(grandTotals.Bill_Amount),
        headerImgSrc: HeaderJK,
        footerImgSrc: FooterJK,
        orientation: 'landscape',
        onComplete: (url) => setPdfPreview(url),
    });
};
    return (
        <div style={{ marginTop: '-80px', padding: '20px' }}>
            <CommonPrintView
                title="Purchase TDS Register"
                subtitle={reportSubtitle}
                companyName={Company_Name}
                companyGST={Company_GSTNO}
                columns={PRINT_COLUMNS}
                rows={sortedData}
                rowRenderer={renderPrintRow}
                footerValues={printFooterValues}
                amountInWords={ConvertNumberToWord(grandTotals.Bill_Amount)}
                headerImg={HeaderJK}
                footerImg={FooterJK}
            />

            <Typography variant="h5" align="center" style={{ fontWeight: 'bold'}}>
                {Company_Name}
            </Typography>
            <Typography variant="subtitle1" align="center">GSTN: {Company_GSTNO}</Typography>
            <Typography variant="h6" align="center">Purchase TDS Register</Typography>
            <Typography variant="subtitle2" align="center" color="textSecondary">{reportSubtitle}</Typography>

            <div className="my-3 no-print d-flex justify-content-end">
                <button className="btn btn-danger" onClick={handleGeneratePDF}>Print</button>
                <button className="btn btn-success ms-2" onClick={handleExportToExcel}>Export Excel</button>
            </div>

            {pdfPreview && <PdfPreview pdfData={pdfPreview} label="PurchaseTDSRegister" />}
            {error && <div className="alert alert-danger">{error}</div>}

            <TableContainer component={Paper} style={{ maxHeight: '700px', position: 'relative' }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {SCREEN_COLUMNS.map(col => (
                                <TableCell
                                    key={col.key}
                                    align={col.numeric ? 'right' : 'left'}
                                    style={{ fontWeight: 'bold', backgroundColor: '#5557df', color: '#fff', whiteSpace: 'nowrap' }}
                                >
                                    <TableSortLabel
                                        active={sortConfig.key === col.key}
                                        direction={sortConfig.direction}
                                        onClick={() => requestSort(col.key)}
                                        sx={{
                                            '&.MuiTableSortLabel-root, &.Mui-active, & .MuiTableSortLabel-icon': { color: '#fff !important' },
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
                            <TableRow key={index} hover style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f5f8ff' }}>
                                {renderScreenRow(item).map((cell, ci) => (
                                    <TableCell
                                        key={ci}
                                        align={SCREEN_COLUMNS[ci]?.numeric ? 'right' : 'left'}
                                        style={{ fontSize: '0.78rem' }}
                                    >
                                        {cell}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>

                    <TableFooter style={{ position: 'sticky', bottom: 0, zIndex: 2 }}>
                        <TableRow style={{ backgroundColor: '#ffffcc' }}>
                            <TableCell colSpan={3} style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>GRAND TOTAL</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>{formatReadableAmount(grandTotals.Taxable_Amt.toFixed(2))}</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>{formatReadableAmount(grandTotals.CGST.toFixed(2))}</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>{formatReadableAmount(grandTotals.SGST.toFixed(2))}</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>{formatReadableAmount(grandTotals.IGST.toFixed(2))}</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>{formatReadableAmount(grandTotals.Bill_Amount.toFixed(2))}</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>{formatReadableAmount(grandTotals.TDS_Amt.toFixed(2))}</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </TableContainer>

            {loading && (
                <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999 }}>
                    <ScaleLoader color="#36d7b7" height={35} />
                </div>
            )}
        </div>
    );
};

export default PurchaseTDSRegister;
