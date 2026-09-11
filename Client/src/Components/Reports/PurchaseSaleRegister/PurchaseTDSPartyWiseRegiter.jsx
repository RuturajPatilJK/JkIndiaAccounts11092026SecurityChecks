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

// 1. Column Definitions
const SCREEN_COLUMNS = [
    { label: 'Bill No', key: 'PSNo', width: '8%' },
    { label: 'DONO', key: 'dono', width: '8%' },
    { label: 'Inv Date', key: 'date', width: '10%' },
    { label: 'Mill Bill', key: 'Bill_No', width: '10%' },
    { label: 'Taxable', key: 'Taxable_Amt', width: '10%', numeric: true },
    { label: 'CGST', key: 'CGST', width: '8%', numeric: true },
    { label: 'SGST', key: 'SGST', width: '8%', numeric: true },
    { label: 'IGST', key: 'IGST', width: '8%', numeric: true },
    { label: 'Bill Amount', key: 'Bill_Amount', width: '12%', numeric: true },
    { label: 'TDS', key: 'TDS_Amt', width: '8%', numeric: true },
];

const PRINT_COLUMNS = [
    { label: 'Bill No', key: 'PSNo', printWidth: '18mm' },
    { label: 'Inv Date', key: 'date', printWidth: '22mm' },
    { label: 'Mill Bill', key: 'Bill_No', printWidth: '22mm' },
    { label: 'Taxable', key: 'Taxable_Amt', printWidth: '20mm', numeric: true },
    { label: 'CGST', key: 'CGST', printWidth: '20mm', numeric: true },
    { label: 'SGST', key: 'SGST', printWidth: '20mm', numeric: true },
    { label: 'IGST', key: 'IGST', printWidth: '20mm', numeric: true },
    { label: 'Bill Amt', key: 'Bill_Amount', printWidth: '25mm', numeric: true },
    { label: 'TDS', key: 'TDS_Amt', printWidth: '24mm', numeric: true },
];

const PRINT_NUMERIC_COLS = PRINT_COLUMNS.map((c, i) => (c.numeric ? i : null)).filter(i => i !== null);

const PurchaseTDSPartyWiseRegister = () => {
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
    const [sortConfig, setSortConfig] = useState({ key: 'Name_Of_Party', direction: 'asc' });

    const API_URL = `${apikey}/PurchaseTDS_Register`;

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(API_URL, {
                    params: { from_date: fromDate, toDate, companyCode: company_Code, YearCode, acCode },
                });
                setReportData(response.data);
            } catch (err) {
                setError('Error fetching data');
            } finally {
                setLoading(false);
            }
        };
        fetchReportData();
    }, [API_URL, fromDate, toDate, company_Code, YearCode, acCode]);

    const requestSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const groupedData = useMemo(() => {
        let items = [...reportData];
        if (sortConfig.key) {
            items.sort((a, b) => {
                const va = a[sortConfig.key] || "";
                const vb = b[sortConfig.key] || "";
                if (va < vb) return sortConfig.direction === 'asc' ? -1 : 1;
                if (va > vb) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        const groups = {};
        items.forEach((item) => {
            const key = `${item.Party_Code}-${item.Name_Of_Party}-${item.Pan}`;
            if (!groups[key]) {
                groups[key] = {
                    PartyName: item.Name_Of_Party,
                    PAN: item.Pan,
                    items: [],
                    subTaxable: 0, subCGST: 0, subSGST: 0, subIGST: 0, subBill: 0, subTDS: 0
                };
            }
            groups[key].items.push(item);
            groups[key].subTaxable += parseFloat(item.Taxable_Amt) || 0;
            groups[key].subCGST += parseFloat(item.CGST) || 0;
            groups[key].subSGST += parseFloat(item.SGST) || 0;
            groups[key].subIGST += parseFloat(item.IGST) || 0;
            groups[key].subBill += parseFloat(item.Bill_Amount) || 0;
            groups[key].subTDS += parseFloat(item.TDS_Amt) || 0;
        });
        return groups;
    }, [reportData, sortConfig]);

    const grandTotals = useMemo(() =>
        Object.values(groupedData).reduce((acc, g) => {
            acc.Taxable_Amt += g.subTaxable;
            acc.CGST += g.subCGST;
            acc.SGST += g.subSGST;
            acc.IGST += g.subIGST;
            acc.Bill_Amount += g.subBill;
            acc.TDS_Amt += g.subTDS;
            return acc;
        }, { Taxable_Amt: 0, CGST: 0, SGST: 0, IGST: 0, Bill_Amount: 0, TDS_Amt: 0 }),
        [groupedData]);

    const reportSubtitle = `${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`;

    // Row Renderer for Table
    const renderScreenRow = (item) => [
        item.PSNo, item.dono, item.date, item.Bill_No,
        formatReadableAmount(item.Taxable_Amt),
        formatReadableAmount(item.CGST),
        formatReadableAmount(item.SGST),
        formatReadableAmount(item.IGST),
        formatReadableAmount(item.Bill_Amount),
        formatReadableAmount(item.TDS_Amt)
    ];

    // Row Renderer for Print/PDF
    const renderPrintRow = (item) => [
        item.PSNo, item.date, item.Bill_No,
        formatReadableAmount(item.Taxable_Amt),
        formatReadableAmount(item.CGST),
        formatReadableAmount(item.SGST),
        formatReadableAmount(item.IGST),
        formatReadableAmount(item.Bill_Amount),
        formatReadableAmount(item.TDS_Amt)
    ];

  const handleGeneratePDF = () => {
    const pdfRows = [];
    const yellowFooterStyle = { fillColor: [255, 249, 196], fontStyle: 'bold' };
    
    Object.values(groupedData).forEach(group => {
        // Group Header (Gray row) with styled sub-totals
        pdfRows.push([
            { content: `PAN: ${group.PAN} - ${group.PartyName}`, colSpan: 3, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
            { content: formatReadableAmount(group.subTaxable.toFixed(2)), styles: { fontStyle: 'bold', fillColor: [240, 240, 240], halign: 'right' } },
            { content: formatReadableAmount(group.subCGST.toFixed(2)), styles: { fontStyle: 'bold', fillColor: [240, 240, 240], halign: 'right' } },
            { content: formatReadableAmount(group.subSGST.toFixed(2)), styles: { fontStyle: 'bold', fillColor: [240, 240, 240], halign: 'right' } },
            { content: formatReadableAmount(group.subIGST.toFixed(2)), styles: { fontStyle: 'bold', fillColor: [240, 240, 240], halign: 'right' } },
            { content: formatReadableAmount(group.subBill.toFixed(2)), styles: { fontStyle: 'bold', fillColor: [240, 240, 240], halign: 'right' } },
            { content: formatReadableAmount(group.subTDS.toFixed(2)), styles: { fontStyle: 'bold', fillColor: [240, 240, 240], halign: 'right' } },
        ]);
        
        group.items.forEach(item => pdfRows.push(renderPrintRow(item)));
    });

    generateReportPDF({
        title: 'Purchase TDS Partywise Register',
        subtitle: reportSubtitle,
        columns: PRINT_COLUMNS.map(c => c.label),
        columnWidths: PRINT_COLUMNS.map(c => parseInt(c.printWidth)),
        rows: pdfRows,
        
        footerRow: [
            { content: '', styles: yellowFooterStyle },
            { content: '', styles: yellowFooterStyle },
            { content: 'GRAND TOTAL', styles: yellowFooterStyle },
            { content: formatReadableAmount(grandTotals.Taxable_Amt.toFixed(2)), styles: { ...yellowFooterStyle, halign: 'right' } },
            { content: formatReadableAmount(grandTotals.CGST.toFixed(2)), styles: { ...yellowFooterStyle, halign: 'right' } },
            { content: formatReadableAmount(grandTotals.SGST.toFixed(2)), styles: { ...yellowFooterStyle, halign: 'right' } },
            { content: formatReadableAmount(grandTotals.IGST.toFixed(2)), styles: { ...yellowFooterStyle, halign: 'right' } },
            { content: formatReadableAmount(grandTotals.Bill_Amount.toFixed(2)), styles: { ...yellowFooterStyle, halign: 'right' } },
            { content: formatReadableAmount(grandTotals.TDS_Amt.toFixed(2)), styles: { ...yellowFooterStyle, halign: 'right' } }
        ],
        
        numericCols: PRINT_NUMERIC_COLS,
        amountInWords: ConvertNumberToWord(grandTotals.Bill_Amount),
        headerImgSrc: HeaderJK,
        footerImgSrc: FooterJK,
        orientation: 'landscape',
        onComplete: (url) => setPdfPreview(url),
    });
};
    const handleExportToExcel = () => {
        const headers = SCREEN_COLUMNS.map(c => c.label);
        const worksheetData = [
            [Company_Name.toUpperCase()],
            [`GST No: ${Company_GSTNO}`],
            [`Purchase TDS Register: ${reportSubtitle}`],
            [],
            headers
        ];

        Object.values(groupedData).forEach(group => {
            worksheetData.push([group.PAN, group.PartyName, "", "", group.subTaxable, group.subCGST, group.subSGST, group.subIGST, group.subBill, group.subTDS]);
            group.items.forEach(item => {
                worksheetData.push(SCREEN_COLUMNS.map(col => col.numeric ? Number(item[col.key]) : item[col.key]));
            });
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(worksheetData);
        XLSX.utils.book_append_sheet(wb, ws, 'TDS_Register');
        XLSX.writeFile(wb, `TDS_Register_${fromDate}.xlsx`);
    };

    return (
        <div style={{ padding: '20px', marginTop: '-80px' }}>
            <Typography variant="h5" align="center" style={{ fontWeight: 'bold' }}>{Company_Name}</Typography>
            <Typography variant="subtitle1" align="center">GSTN: {Company_GSTNO}</Typography>
            <Typography variant="h6" align="center">Purchase TDS Partywise Register</Typography>
            <Typography variant="subtitle2" align="center" color="textSecondary">{reportSubtitle}</Typography>

            <div className="my-3 no-print d-flex justify-content-end">
                <button className="btn btn-danger" onClick={handleGeneratePDF}>Print PDF</button>
                <button className="btn btn-success ms-2" onClick={handleExportToExcel}>Export Excel</button>
            </div>

            {pdfPreview && <PdfPreview pdfData={pdfPreview} label="PurchaseTDSRegisterPartywise" />}

            <TableContainer component={Paper} style={{ maxHeight: '700px' }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {SCREEN_COLUMNS.map(col => (
                                <TableCell
                                    key={col.key}
                                    align={col.numeric ? 'right' : 'left'}
                                    style={{ backgroundColor: '#5557df', color: '#fff', fontWeight: 'bold' }}
                                >
                                    <TableSortLabel
                                        active={sortConfig.key === col.key}
                                        direction={sortConfig.direction}
                                        onClick={() => requestSort(col.key)}
                                        sx={{ '&.Mui-active, & .MuiTableSortLabel-icon': { color: '#fff !important' }, '&:hover': { color: '#fff' } }}
                                    > {col.label} </TableSortLabel>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Object.entries(groupedData).map(([key, group]) => (
                            <React.Fragment key={key}>
                                <TableRow style={{ backgroundColor: '#f0f4ff' }}>
                                    <TableCell colSpan={2} style={{ fontWeight: 'bold' }}>{group.PAN}</TableCell>
                                    <TableCell colSpan={2} style={{ fontWeight: 'bold' }}>{group.PartyName}</TableCell>
                                    <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(group.subTaxable.toFixed(2))}</TableCell>
                                    <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(group.subCGST.toFixed(2))}</TableCell>
                                    <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(group.subSGST.toFixed(2))}</TableCell>
                                    <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(group.subIGST.toFixed(2))}</TableCell>
                                    <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(group.subBill.toFixed(2))}</TableCell>
                                    <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(group.subTDS.toFixed(2))}</TableCell>
                                </TableRow>
                                {group.items.map((item, idx) => (
                                    <TableRow key={idx} hover>
                                        {renderScreenRow(item).map((cell, i) => (
                                            <TableCell key={i} align={SCREEN_COLUMNS[i].numeric ? 'right' : 'left'}>{cell}</TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </React.Fragment>
                        ))}
                    </TableBody>
                    <TableFooter style={{ position: 'sticky', bottom: 0, zIndex: 2 }}>
                        <TableRow style={{ backgroundColor: '#ffffcc' }}>
                            <TableCell colSpan={4} style={{ fontWeight: 'bold' }}>GRAND TOTAL</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.Taxable_Amt.toFixed(2))}</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.CGST.toFixed(2))}</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.SGST.toFixed(2))}</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.IGST.toFixed(2))}</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.Bill_Amount.toFixed(2))}</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.TDS_Amt.toFixed(2))}</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </TableContainer>
            {loading && <div className="text-center mt-4"><ScaleLoader color="#36d7b7" /></div>}
        </div>
    );
};

export default PurchaseTDSPartyWiseRegister;
