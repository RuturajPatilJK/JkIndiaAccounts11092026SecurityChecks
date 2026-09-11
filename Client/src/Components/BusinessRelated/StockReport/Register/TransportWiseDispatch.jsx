import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as XLSX from 'xlsx';
import { useLocation } from 'react-router-dom';
import { formatReadableAmount } from '../../../../Common/FormatFunctions/FormatAmount';
import { ScaleLoader } from 'react-spinners';
import {
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, Typography, TableSortLabel, Box, TableFooter
} from '@mui/material';
import { FormaDateBalanceSheet } from '../../../../Common/FormatFunctions/FormatDate';
import PdfPreview from '../../../../Common/PDFPreview';
import HeaderJK from '../../../../Assets/HeaderJK.png';
import FooterJK from '../../../../Assets/FooterJK.png';
import { generateReportPDF } from '../../../../Common/ReportCommon/CommonPDFGenerator';
import CommonSearchBar from '../../../../Common/SearchBar/ReportSearchBar';

const apikey = process.env.REACT_APP_API;

const SCREEN_COLUMNS = [
    { label: 'Do No', key: 'doc_no', width: '60px' },
    { label: 'Date', key: 'doc_dateConverted', width: '90px' },
    { label: 'Mill Name', key: 'millshortname', width: '130px' },
    { label: 'Voucher By', key: 'voucherbyshortname', width: '130px' },
    { label: 'Get Pass', key: 'getpassshortname', width: '130px' },
    { label: 'Mill Rate', key: 'mill_rate', width: '80px', numeric: true },
    { label: 'Quantal', key: 'quantal', width: '80px', numeric: true, isTotal: true },
    { label: 'Sale Rate', key: 'sale_rate', width: '80px', numeric: true },
    { label: 'Lorry No', key: 'truck_no', width: '100px' },
    { label: 'Freight', key: 'Freight_Amount', width: '80px', numeric: true },
    { label: 'Vasuli', key: 'vasuli_amount1', width: '80px', numeric: true },
    { label: 'DO', key: 'doshortname', width: '100px' },
    { label: 'Tender No.', key: 'purc_no', width: '70px' },

    { label: 'Sale Bill To', key: 'SaleBillTo', width: '90px' },
    { label: 'Sale BIll To Name', key: 'saleBillToName', width: '160px' },
    { label: 'DO', key: 'DO', width: '90px' },
    { label: 'doname', key: 'doname', width: '160px' },
    { label: 'B.P A/C', key: 'CashDiffAc', width: '90px' },
    { label: 'B.P A/C Name', key: 'CAshdiffName', width: '160px' },

];

const PRINT_COLUMNS = [
    { label: 'DO No', key: 'doc_no', printWidth: 15 },
    { label: 'Date', key: 'doc_dateConverted', printWidth: 22 },
    { label: 'Mill', key: 'millshortname', printWidth: 35 },
    { label: 'Quantal', key: 'quantal', printWidth: 20, numeric: true },
    { label: 'Mill Rate', key: 'mill_rate', printWidth: 18, numeric: true },
    { label: 'Sale Rate', key: 'sale_rate', printWidth: 18, numeric: true },
    { label: 'Lorry No', key: 'truck_no', printWidth: 25 },
    { label: 'Freight', key: 'Freight_Amount', printWidth: 20, numeric: true },
    { label: 'Tender No', key: 'purc_no', printWidth: 15 },
];

const TransportWiseDispatch = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const companyCode = sessionStorage.getItem('Company_Code');
    const Year_Code = sessionStorage.getItem('Year_Code');
    const Company_Name = sessionStorage.getItem("Company_Name");
    const Company_GSTNO = sessionStorage.getItem('Company_GSTNO');

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [pdfPreview, setPdfPreview] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'doc_no', direction: 'asc' });

    const API_URL = `${apikey}/CategoryWiseDispatch-Register`;

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {
                const res = await axios.get(API_URL, {
                    params: { fromDT: fromDate, toDT: toDate, Company_Code: companyCode, Year_Code: Year_Code },
                });
                setReportData(Array.isArray(res.data) ? res.data : []);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        if (fromDate && toDate) fetchReportData();
    }, [fromDate, toDate, companyCode, Year_Code]);

    const { groupedData, grandTotalQuantal } = useMemo(() => {
        let filtered = reportData.filter(item =>
            Object.values(item).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
        );

        let total = 0;
        const groups = {};
        filtered.forEach(item => {
            const qty = parseFloat(item.quantal || 0);
            total += qty;
            const key = `${item.transport || 'NA'}-${item.transportname || 'Unknown'}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });

        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => {
                const va = a[sortConfig.key] || 0;
                const vb = b[sortConfig.key] || 0;
                if (va < vb) return sortConfig.direction === 'asc' ? -1 : 1;
                if (va > vb) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        });

        return { groupedData: groups, grandTotalQuantal: total };
    }, [reportData, searchTerm, sortConfig]);

    const handleGeneratePDF = () => {
        setIsPrinting(true);
        const allRows = [];

        Object.entries(groupedData).forEach(([groupName, items]) => {
            allRows.push([
                { content: groupName, colSpan: PRINT_COLUMNS.length, styles: { fillColor: [240, 240, 240], fontStyle: 'bold', lineWidth: 0.1 } }
            ]);

            items.forEach(item => {
                allRows.push(PRINT_COLUMNS.map(col => col.numeric ? formatReadableAmount(item[col.key]) : item[col.key]));
            });

            const groupTotal = items.reduce((sum, i) => sum + parseFloat(i.quantal || 0), 0);
            const groupFooterRow = new Array(PRINT_COLUMNS.length).fill("");
            groupFooterRow[0] = { content: "Group Total:", styles: { fontStyle: 'bold' } };
            const qtyIdx = PRINT_COLUMNS.findIndex(c => c.key === 'quantal');
            groupFooterRow[qtyIdx] = { content: formatReadableAmount(groupTotal), styles: { fontStyle: 'bold', halign: 'right' } };
            allRows.push(groupFooterRow);
        });

        // Add Grand Total Row at the very end of PDF
        const grandTotalRow = new Array(PRINT_COLUMNS.length).fill("");
        grandTotalRow[0] = { content: "GRAND TOTAL:", styles: { fontStyle: 'bold', fillColor: [255, 249, 196] } };
        const qtyIndex = PRINT_COLUMNS.findIndex(c => c.key === 'quantal');
        grandTotalRow[qtyIndex] = { content: formatReadableAmount(grandTotalQuantal), styles: { fontStyle: 'bold', halign: 'right', fillColor: [255, 249, 196] } };
        allRows.push(grandTotalRow);

        generateReportPDF({
            title: 'Transport Wise Dispatch',
            subtitle: `Period: ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`,
            columns: PRINT_COLUMNS.map(c => c.label),
            rows: allRows,
            // lineWidth and lineDash [2, 2] creates the dotted effect
            tableStyles: {
                lineWidth: 0.1,
                lineColor: [150, 150, 150],
                lineDash: [1, 1]
            },
            headerStyles: { fillColor: [26, 35, 126], textColor: [255, 255, 255], lineWidth: 0.1 },
            headerImgSrc: HeaderJK,
            footerImgSrc: FooterJK,
            numericCols: PRINT_COLUMNS.map((c, i) => c.numeric ? i : null).filter(i => i !== null),
            onComplete: (url) => {
                setPdfPreview(url);
                setIsPrinting(false);
            },
        });
    };

    const handleExportToExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [
            [Company_Name?.toUpperCase()],
            [`Transport Wise Dispatch: ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`],
            [],
            SCREEN_COLUMNS.map(c => c.label)
        ];

        Object.entries(groupedData).forEach(([groupName, items]) => {
            wsData.push([groupName]);
            items.forEach(item => {
                wsData.push(SCREEN_COLUMNS.map(c => c.numeric ? (parseFloat(item[c.key]) || 0) : item[c.key]));
            });
            const totalQty = items.reduce((sum, i) => sum + parseFloat(i.quantal || 0), 0);
            wsData.push(["", "Group Total:", "", "", "", "", totalQty, "", "", "", "", ""]);
            wsData.push([]);
        });

        wsData.push(["GRAND TOTAL", "", "", "", "", "", grandTotalQuantal]);

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'TransportReport');
        XLSX.writeFile(wb, `Transport_Wise_Dispatch.xlsx`);
    };

    return (
        <Box sx={{ padding: '15px', marginTop: "-80px" }}>
            <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ textDecoration: 'underline', fontWeight: 'bold' }}>Transport Wise Dispatch</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <CommonSearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search transport or mill..." />
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <button className="btn btn-danger btn-sm" onClick={handleGeneratePDF} disabled={isPrinting}>
                        {isPrinting ? 'Wait...' : 'Print PDF'}
                    </button>
                    <button className="btn btn-success btn-sm" onClick={handleExportToExcel}>Export Excel</button>
                </Box>
            </Box>

            <TableContainer component={Paper} sx={{ maxHeight: '700px', boxShadow: 5 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {SCREEN_COLUMNS.map(col => (
                                <TableCell
                                    key={col.key}
                                    align={col.numeric ? 'right' : 'left'}
                                    sx={{
                                        backgroundColor: '#1a237e !important',
                                        color: '#fff !important',
                                        fontWeight: 'bold',
                                        fontSize: '12px',
                                        minWidth: col.width,
                                        whiteSpace: 'normal'
                                    }}
                                >
                                    <TableSortLabel
                                        active={sortConfig.key === col.key}
                                        direction={sortConfig.direction}
                                        onClick={() => setSortConfig({ key: col.key, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                                        sx={{ '& .MuiTableSortLabel-icon': { color: '#fff !important' }, color: '#fff !important' }}
                                    >
                                        {col.label}
                                    </TableSortLabel>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Object.entries(groupedData).map(([groupKey, items]) => (
                            <React.Fragment key={groupKey}>
                                <TableRow sx={{ backgroundColor: '#e3f2fd' }}>
                                    <TableCell colSpan={SCREEN_COLUMNS.length} sx={{ fontWeight: 'bold', color: '#1a237e' }}>
                                        {groupKey}
                                    </TableCell>
                                </TableRow>
                                {items.map((item, idx) => (
                                    <TableRow key={idx} hover sx={{ borderBottom: '1px solid #eee' }}>
                                        {SCREEN_COLUMNS.map(col => (
                                            <TableCell
                                                key={col.key}
                                                align={col.numeric ? 'right' : 'left'}
                                                sx={{ fontSize: '11px', whiteSpace: 'normal', wordBreak: 'break-word' }}
                                            >
                                                {col.numeric ? formatReadableAmount(item[col.key]) : item[col.key]}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                                <TableRow sx={{ backgroundColor: '#f1f8e9' }}>
                                    <TableCell colSpan={6} align="right" sx={{ fontWeight: 'bold', fontSize: '11px' }}>Group Total:</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '11px' }}>
                                        {formatReadableAmount(items.reduce((sum, i) => sum + parseFloat(i.quantal || 0), 0))}
                                    </TableCell>
                                    <TableCell colSpan={6}></TableCell>
                                </TableRow>
                            </React.Fragment>
                        ))}
                    </TableBody>
                    <TableFooter sx={{ position: 'sticky', bottom: 0, zIndex: 10, backgroundColor: '#fff9c4' }}>
                        <TableRow>
                            <TableCell colSpan={6} align="right" sx={{ fontWeight: 'bold', fontSize: '13px', color: '#000' }}>GRAND TOTAL:</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '13px', color: '#000' }}>
                                {formatReadableAmount(grandTotalQuantal)}
                            </TableCell>
                            <TableCell colSpan={6}></TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </TableContainer>

            {pdfPreview && <PdfPreview pdfData={pdfPreview} label="TransportWiseCategoryDispatch" />}

            {(loading || isPrinting) && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <ScaleLoader color="#1a237e" size={60} />
                        <Typography sx={{ mt: 2, fontWeight: 'bold', color: '#1a237e' }}>
                            {isPrinting ? "Generating PDF..." : "Loading Data..."}
                        </Typography>
                    </Box>
                </div>
            )}
        </Box>
    );
};

export default TransportWiseDispatch;