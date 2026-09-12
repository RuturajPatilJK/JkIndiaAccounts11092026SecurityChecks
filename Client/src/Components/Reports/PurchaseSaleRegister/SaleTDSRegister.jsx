import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as XLSX from 'xlsx';
import { useLocation } from 'react-router-dom';
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import { 
    Table, TableBody, TableCell, TableHead, TableRow, 
    Typography, Paper, TableFooter, TableContainer, TableSortLabel 
} from '@mui/material';
import { ScaleLoader } from 'react-spinners';
import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate";
import PdfPreview from '../../../Common/PDFPreview';
import HeaderJK from '../../../Assets/HeaderJK.png';
import FooterJK from '../../../Assets/FooterJK.png';
import { ConvertNumberToWord } from '../../../Common/FormatFunctions/ConvertNumberToWord';
import CommonPrintView from '../../../Common/ReportCommon/CommonPrintView';
import { generateReportPDF } from '../../../Common/ReportCommon/CommonPDFGenerator';

const apikey = process.env.REACT_APP_API;

// Adjusted widths to total 100% and prevent overflow
const SCREEN_COLUMNS = [
    { label: 'PAN', key: 'pan', width: '12%' },
    { label: 'Customer Name', key: 'PartyName', width: '28%' },
    { label: 'Taxable Amt', key: 'TotalTaxable_Amt', width: '10%', numeric: true },
    { label: 'CGST', key: 'CGSTAmt', width: '10%', numeric: true },
    { label: 'SGST', key: 'SGSTAmt', width: '10%', numeric: true },
    { label: 'IGST', key: 'IGSTAmt', width: '10%', numeric: true },
    { label: 'Bill Amt', key: 'BillamountAmt', width: '10%', numeric: true },
    { label: 'TDS', key: 'TDSAmt', width: '10%', numeric: true },
];

const PRINT_COLUMNS = [
    { label: 'PAN', key: 'pan', printWidth: '25mm' },
    { label: 'Customer Name', key: 'PartyName', printWidth: '60mm' },
    { label: 'Taxable Amt', key: 'TotalTaxable_Amt', printWidth: '20mm', numeric: true },
    { label: 'CGST', key: 'CGSTAmt', printWidth: '17mm', numeric: true },
    { label: 'SGST', key: 'SGSTAmt', printWidth: '17mm', numeric: true },
    { label: 'IGST', key: 'IGSTAmt', printWidth: '17mm', numeric: true },
    { label: 'Bill Amt', key: 'BillamountAmt', printWidth: '20mm', numeric: true },
    { label: 'TDS', key: 'TDSAmt', printWidth: '17mm', numeric: true },
];

const SaleTDSRegister = () => {
    const location = useLocation();
    const Company_Name = sessionStorage.getItem('Company_Name');
    const Company_GSTNO = sessionStorage.getItem('Company_GSTNO');
    const searchParams = new URLSearchParams(location.search);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const company_Code = searchParams.get('companyCode');
    const YearCode = searchParams.get('yearCode');
    const acCode = searchParams.get('acCode');

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pdfPreview, setPdfPreview] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const API_URL = `${apikey}/SaleTDS_Register`;

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(API_URL, {
                    params: { from_date: fromDate, toDate, companyCode: company_Code, YearCode, acCode },
                });
                setReportData(response.data);
            } catch (error) {
                setError('Error fetching report');
            } finally {
                setLoading(false);
            }
        };
        fetchReportData();
    }, [API_URL]);

    const groupedData = useMemo(() => {
        const grouped = {};
        reportData.forEach((item) => {
            const key = `${item.Party_Code}-${item.Name_Of_Party}-${item.Pan}`;
            if (!grouped[key]) {
                grouped[key] = {
                    pan: item.Pan || '',
                    PartyName: item.Name_Of_Party || '',
                    TotalTaxable_Amt: 0,
                    CGSTAmt: 0,
                    SGSTAmt: 0,
                    IGSTAmt: 0,
                    BillamountAmt: 0,
                    TDSAmt: 0,
                };
            }
            grouped[key].TotalTaxable_Amt += parseFloat(item.Taxable_Amt) || 0;
            grouped[key].CGSTAmt += parseFloat(item.CGST) || 0;
            grouped[key].SGSTAmt += parseFloat(item.SGST) || 0;
            grouped[key].IGSTAmt += parseFloat(item.IGST) || 0;
            grouped[key].BillamountAmt += parseFloat(item.Bill_Amount) || 0;
            grouped[key].TDSAmt += parseFloat(item.TDS_Amt) || 0;
        });
        return Object.values(grouped);
    }, [reportData]);

    const sortedData = useMemo(() => {
        let sortableItems = [...groupedData];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [groupedData, sortConfig]);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const grandTotals = useMemo(() => {
        return groupedData.reduce((acc, curr) => ({
            TotalTaxable_Amt: acc.TotalTaxable_Amt + curr.TotalTaxable_Amt,
            CGSTAmt: acc.CGSTAmt + curr.CGSTAmt,
            SGSTAmt: acc.SGSTAmt + curr.SGSTAmt,
            IGSTAmt: acc.IGSTAmt + curr.IGSTAmt,
            BillamountAmt: acc.BillamountAmt + curr.BillamountAmt,
            TDSAmt: acc.TDSAmt + curr.TDSAmt,
        }), { TotalTaxable_Amt: 0, CGSTAmt: 0, SGSTAmt: 0, IGSTAmt: 0, BillamountAmt: 0, TDSAmt: 0 });
    }, [groupedData]);

    const reportSubtitle = `${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`;

    const handleExportToExcel = () => {
        const worksheetData = [
            [Company_Name.toUpperCase()],
            [`GST No: ${Company_GSTNO}`],
            [`Sale TDS Summary: ${reportSubtitle}`],
            [],
            SCREEN_COLUMNS.map(c => c.label),
            ...sortedData.map(item => [
                item.pan, item.PartyName, item.TotalTaxable_Amt, item.CGSTAmt, 
                item.SGSTAmt, item.IGSTAmt, item.BillamountAmt, item.TDSAmt
            ]),
            ['', 'GRAND TOTAL', grandTotals.TotalTaxable_Amt, grandTotals.CGSTAmt, 
             grandTotals.SGSTAmt, grandTotals.IGSTAmt, grandTotals.BillamountAmt, grandTotals.TDSAmt]
        ];
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(worksheetData);
        XLSX.utils.book_append_sheet(wb, ws, 'SaleTDSRegister');
        XLSX.writeFile(wb, `SaleTDSRegister_${fromDate}.xlsx`);
    };



    const handleGeneratePDF = () => {
    // Define the common footer style for consistency
    const footerStyle = { 
        fillColor: [255, 249, 196], 
        fontStyle: 'bold' 
    };

    generateReportPDF({
        title: 'Sale TDS Summary',
        subtitle: reportSubtitle,
        columns: PRINT_COLUMNS.map(c => c.label),
        columnWidths: [25, 60, 20, 17, 17, 17, 20, 17],
        rows: sortedData.map(item => [
            item.pan, 
            item.PartyName, 
            // Keep existing row alignment logic
            { content: formatReadableAmount(item.TotalTaxable_Amt), alignment: 'right' },
            { content: formatReadableAmount(item.CGSTAmt), alignment: 'right' },
            { content: formatReadableAmount(item.SGSTAmt), alignment: 'right' },
            { content: formatReadableAmount(item.IGSTAmt), alignment: 'right' },
            { content: formatReadableAmount(item.BillamountAmt), alignment: 'right' },
            { content: formatReadableAmount(item.TDSAmt), alignment: 'right' }
        ]),
        
        // Updated Footer with Yellow Background and Right Alignment for amounts
        footerRow: [
            { content: '', styles: footerStyle }, 
            { content: 'GRAND TOTAL', styles: footerStyle }, 
            { content: formatReadableAmount(grandTotals.TotalTaxable_Amt), styles: { ...footerStyle, halign: 'right' } }, 
            { content: formatReadableAmount(grandTotals.CGSTAmt), styles: { ...footerStyle, halign: 'right' } }, 
            { content: formatReadableAmount(grandTotals.SGSTAmt), styles: { ...footerStyle, halign: 'right' } }, 
            { content: formatReadableAmount(grandTotals.IGSTAmt), styles: { ...footerStyle, halign: 'right' } }, 
            { content: formatReadableAmount(grandTotals.BillamountAmt), styles: { ...footerStyle, halign: 'right' } }, 
            { content: formatReadableAmount(grandTotals.TDSAmt), styles: { ...footerStyle, halign: 'right' } }
        ],

        numericCols: [2, 3, 4, 5, 6, 7],
        headerImgSrc: HeaderJK,
        footerImgSrc: FooterJK,
        orientation: 'landscape',
        onComplete: (url) => setPdfPreview(url),
    });
};

    return (
        <div style={{ marginTop: '-40px', padding: '20px' }}>
            <CommonPrintView
                title="Sale TDS Summary"
                subtitle={reportSubtitle}
                companyName={Company_Name}
                companyGST={Company_GSTNO}
                columns={PRINT_COLUMNS}
                rows={sortedData}
                rowRenderer={(item) => [
                    item.pan, item.PartyName, 
                    formatReadableAmount(item.TotalTaxable_Amt),
                    formatReadableAmount(item.CGSTAmt),
                    formatReadableAmount(item.SGSTAmt),
                    formatReadableAmount(item.IGSTAmt),
                    formatReadableAmount(item.BillamountAmt),
                    formatReadableAmount(item.TDSAmt)
                ]}
                footerValues={['', 'GRAND TOTAL', formatReadableAmount(grandTotals.TotalTaxable_Amt), formatReadableAmount(grandTotals.CGSTAmt), formatReadableAmount(grandTotals.SGSTAmt), formatReadableAmount(grandTotals.IGSTAmt), formatReadableAmount(grandTotals.BillamountAmt), formatReadableAmount(grandTotals.TDSAmt)]}
                amountInWords={ConvertNumberToWord(grandTotals.BillamountAmt)}
                headerImg={HeaderJK}
                footerImg={FooterJK}
            />

            <Typography variant="h5" align="center" style={{ fontWeight: 'bold', marginTop: '-50px' }}>{Company_Name}</Typography>
            <Typography variant="subtitle1" align="center">GSTN: {Company_GSTNO}</Typography>
            <Typography variant="h6" align="center">Sale TDS Summary</Typography>
            <Typography variant="subtitle2" align="center" color="textSecondary" style={{ marginBottom: '15px' }}>{reportSubtitle}</Typography>

            <div className="my-3 no-print d-flex justify-content-end">
                <button className="btn btn-danger me-2" onClick={handleGeneratePDF}>Print PDF</button>
                <button className="btn btn-success" onClick={handleExportToExcel}>Export Excel</button>
            </div>

            {pdfPreview && <PdfPreview pdfData={pdfPreview} label="SaleTDSRegister" />}

            <TableContainer component={Paper} style={{ maxHeight: '700px', overflowX: 'hidden' }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {SCREEN_COLUMNS.map(col => (
                                <TableCell 
                                    key={col.label} 
                                    align={col.numeric ? 'right' : 'left'} 
                                    style={{ 
                                        backgroundColor: '#5557df', 
                                        color: '#fff', 
                                        fontWeight: 'bold',
                                        width: col.width,
                                        padding: '8px'
                                    }}
                                >
                                    <TableSortLabel
                                        active={sortConfig.key === col.key}
                                        direction={sortConfig.key === col.key ? sortConfig.direction : 'asc'}
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
                        {sortedData.map((row, index) => (
                            <TableRow key={index} hover style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f5f8ff' }}>
                                <TableCell style={{ whiteSpace: 'nowrap' }}>{row.pan}</TableCell>
                                <TableCell style={{ wordBreak: 'break-word' }}>{row.PartyName}</TableCell>
                                <TableCell align="right">{formatReadableAmount(row.TotalTaxable_Amt)}</TableCell>
                                <TableCell align="right">{formatReadableAmount(row.CGSTAmt)}</TableCell>
                                <TableCell align="right">{formatReadableAmount(row.SGSTAmt)}</TableCell>
                                <TableCell align="right">{formatReadableAmount(row.IGSTAmt)}</TableCell>
                                <TableCell align="right">{formatReadableAmount(row.BillamountAmt)}</TableCell>
                                <TableCell align="right">{formatReadableAmount(row.TDSAmt)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter style={{ position: 'sticky', bottom: 0, zIndex: 2 }}>
                        <TableRow style={{ backgroundColor: '#ffffcc' }}>
                            <TableCell colSpan={2} style={{ fontWeight: 'bold' }}>GRAND TOTAL</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.TotalTaxable_Amt)}</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.CGSTAmt)}</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.SGSTAmt)}</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.IGSTAmt)}</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.BillamountAmt)}</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.TDSAmt)}</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </TableContainer>

            {loading && (
                <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999 }}>
                    <ScaleLoader color="#36d7b7" height={35} width={4} radius={2} margin={2} />
                </div>
            )}
        </div>
    );
};

export default SaleTDSRegister;
