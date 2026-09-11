import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import PdfPreview from '../../../../Common/PDFPreview';
import { ScaleLoader } from 'react-spinners';
import PrintButton from "../../../../Common/Buttons/PrintPDF";
import { formatReadableAmount } from "../../../../Common/FormatFunctions/FormatAmount";
import { Typography, Button } from '@mui/material';
import {
    Paper, Table, TableContainer, TableHead, TableBody,
    TableRow, TableCell, TableSortLabel, TableFooter
} from '@mui/material';
import SearchBar from "../../../../Common/UtilityCommon/SearchBar";
import CommonPrintView from '../../../../Common/ReportCommon/CommonPrintView';
import { generateReportPDF } from '../../../../Common/ReportCommon/CommonPDFGenerator';
import HeaderJK from '../../../../Assets/HeaderJK.png';
import FooterJK from '../../../../Assets/FooterJK.png';
import { ConvertNumberToWord } from '../../../../Common/FormatFunctions/ConvertNumberToWord';

const apikey = process.env.REACT_APP_API;

// ── Column definitions (screen + print) ──────────────────────────────────────
const SCREEN_COLUMNS = [
    { label: 'Tender No', key: 'Tender_No', width: '8%', numeric: false },
    { label: 'Mill Name', key: 'millshortname', width: '12%', numeric: false },
    { label: 'Grade', key: 'Grade', width: '6%', numeric: false },
    { label: 'Mill Rate', key: 'Mill_Rate', width: '8%', numeric: true },
    { label: 'Sale Rate', key: 'Sale_Rate', width: '8%', numeric: true },
    { label: 'Lifting Date', key: 'Tender_Date', width: '10%', numeric: false },
    { label: 'Sauda Date', key: 'Sauda_Date', width: '10%', numeric: false },
    { label: 'Do', key: 'Do', width: '8%', numeric: false },
    { label: 'Quintal', key: 'totalQuantal', width: '10%', numeric: true },
    { label: 'Dispatch', key: 'totalDespatch', width: '10%', numeric: true },
    { label: 'Balance', key: 'totalBalance', width: '10%', numeric: true },
];

const PRINT_COLUMNS = [
    { label: 'Tender No', key: 'Tender_No', printWidth: '22mm', numeric: false },
    { label: 'Mill Name', key: 'millshortname', printWidth: '30mm', numeric: false },
    { label: 'Grade', key: 'Grade', printWidth: '14mm', numeric: false },
    { label: 'Mill Rate', key: 'Mill_Rate', printWidth: '18mm', numeric: true },
    { label: 'Sale Rate', key: 'Sale_Rate', printWidth: '18mm', numeric: true },
    { label: 'Lifting Date', key: 'Tender_Date', printWidth: '22mm', numeric: false },
    { label: 'Sauda Date', key: 'Sauda_Date', printWidth: '22mm', numeric: false },
    { label: 'Do', key: 'Do', printWidth: '16mm', numeric: false },
    { label: 'Quintal', key: 'Buyer_Quantal', printWidth: '20mm', numeric: true },
    { label: 'Dispatch', key: 'DESPATCH', printWidth: '18mm', numeric: true },
    { label: 'Balance', key: 'BALANCE', printWidth: '18mm', numeric: true },
];

const PendingReports = () => {
    const Company_Name = sessionStorage.getItem("Company_Name");
    const Company_GSTNO = sessionStorage.getItem('Company_GSTNO');

    const navigate = useNavigate();
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pdfPreview, setPdfPreview] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const requestSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const API_URL = `${apikey}/partywise-stockReport`;

    useEffect(() => {
        setLoading(true);
        axios.get(API_URL, {
            params: {
                Company_Code: sessionStorage.getItem('Company_Code'),
                Year_Code: sessionStorage.getItem('Year_Code'),
            }
        })
            .then(response => { setReportData(response.data); setLoading(false); })
            .catch(err => { console.error(err); setError('Failed to load data'); setLoading(false); });
    }, []);

    // ── Grouping (unchanged logic) ───────────────────────────────────────────
    const groupReportData = (data) => {
        return data.reduce((acc, item) => {
            const bal = parseFloat(item.BALANCE || 0);
            if (parseFloat(item.BALANCE) !== 0) {
                const { buyername } = item;
                const buyerCode = item.Buyer ?? item.Buyer_Party ?? item.buyer ?? item.buyer_code ?? null;
                if (!acc[buyername]) {
                    acc[buyername] = {
                        items: [], buyerCode,
                        totalDespatch: 0, totalBalance: 0,
                        totalQuantal: 0, totalStockValueAtSale: 0,
                        partyBalance: item.partyBalance ?? 0,
                        partyGstNo: item.partyGstNo ?? '',
                    };
                }
                acc[buyername].items.push(item);
                acc[buyername].totalDespatch += parseFloat(item.DESPATCH || 0);
                acc[buyername].totalBalance += parseFloat(item.BALANCE || 0);
                acc[buyername].totalQuantal += parseFloat(item.Buyer_Quantal || 0);
                acc[buyername].totalStockValueAtSale += parseFloat(item.Sale_Rate || 0) * bal;
            }
            return acc;
        }, {});
    };

    const groupedReportData = useMemo(() => groupReportData(reportData), [reportData]);

    // ── Sorted entries ───────────────────────────────────────────────────────
    const sortedEntries = useMemo(() => {
        const entries = Object.entries(groupedReportData);
        if (!sortConfig.key) return entries;
        return [...entries].sort(([, a], [, b]) => {
            let aVal, bVal;
            if (sortConfig.key === 'totalQuantal') { aVal = a.totalQuantal; bVal = b.totalQuantal; }
            else if (sortConfig.key === 'totalDespatch') { aVal = a.totalDespatch; bVal = b.totalDespatch; }
            else if (sortConfig.key === 'totalBalance') { aVal = a.totalBalance; bVal = b.totalBalance; }
            else { aVal = a.items[0]?.[sortConfig.key] ?? ''; bVal = b.items[0]?.[sortConfig.key] ?? ''; }
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [groupedReportData, sortConfig]);

    // ── Grand totals ─────────────────────────────────────────────────────────
    const grandTotals = useMemo(() => {
        return Object.values(groupedReportData).reduce(
            (acc, g) => ({
                totalQuantal: acc.totalQuantal + g.totalQuantal,
                totalDespatch: acc.totalDespatch + g.totalDespatch,
                totalBalance: acc.totalBalance + g.totalBalance,
            }),
            { totalQuantal: 0, totalDespatch: 0, totalBalance: 0 }
        );
    }, [groupedReportData]);

    const toNum = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

    // ── Flatten rows for PDF / print (group header + items + subtotal) ───────
    const flatRowsForPDF = useMemo(() => {
        const rows = [];
        sortedEntries.forEach(([buyername, group]) => {
            // Buyer header row (span-like — we pass a flag via a sentinel)
            rows.push({ __isBuyerHeader: true, buyername });
            group.items.forEach(item => {
                rows.push([
                    item.Tender_No ?? '',
                    item.millshortname ?? '',
                    item.Grade ?? '',
                    formatReadableAmount(item.Mill_Rate),
                    formatReadableAmount(item.Sale_Rate),
                    item.Tender_Date ?? '',
                    item.Sauda_Date ?? '',
                    item.Do ?? '',
                    formatReadableAmount(item.Buyer_Quantal),
                    formatReadableAmount(item.DESPATCH),
                    formatReadableAmount(item.BALANCE),
                ]);
            });
            // Sub-total row
            rows.push({
                __isSubTotal: true,
                values: [
                    'Sub Total', '', '', '', '', '', '', '',
                    formatReadableAmount(group.totalQuantal.toFixed(2)),
                    formatReadableAmount(group.totalDespatch.toFixed(2)),
                    formatReadableAmount(group.totalBalance.toFixed(2)),
                ],
            });
        });
        return rows;
    }, [sortedEntries]);

    // ── Excel export with proper right-alignment via cell styles ─────────────
    const handleExportToExcel = () => {
        // Numeric column indices (0-based): Mill Rate=3, Sale Rate=4, Quintal=7, Desp=8, Bal=9
        const numericCols = new Set([3, 4, 7, 8, 9]);

        const makeCell = (value, bold = false, isNumeric = false) => ({
            v: value,
            t: isNumeric ? 'n' : 's',
            s: {
                font: { bold },
                alignment: { horizontal: isNumeric ? 'right' : 'left' },
            },
        });

        const worksheetData = [];

        // Header rows
        worksheetData.push([makeCell(Company_Name.toUpperCase(), true)]);
        worksheetData.push([makeCell(`GST No: ${Company_GSTNO}`)]);
        worksheetData.push([makeCell('Partywise Sugar Balance Stock', true)]);
        worksheetData.push([]);

        // Column headers
        worksheetData.push(
            SCREEN_COLUMNS.map(c => makeCell(c.label, true, false))
        );

        // Data rows grouped
        Object.entries(groupedReportData).forEach(([buyername, group]) => {
            // Buyer name row
            worksheetData.push([makeCell(buyername, true)]);

            group.items.forEach(item => {
                worksheetData.push([
                    makeCell(item.Tender_No ?? '', false, false),
                    makeCell(item.millshortname ?? '', false, false),
                    makeCell(item.Grade ?? '', false, false),
                    makeCell(parseFloat(item.Mill_Rate) || 0, false, true),
                    makeCell(parseFloat(item.Sale_Rate) || 0, false, true),
                    makeCell(item.Tender_Date ?? '', false, false),
                    makeCell(item.Sauda_Date ?? '', false, false),
                    makeCell(item.Do ?? '', false, false),
                    makeCell(parseFloat(item.Buyer_Quantal) || 0, false, true),
                    makeCell(parseFloat(item.DESPATCH) || 0, false, true),
                    makeCell(parseFloat(item.BALANCE) || 0, false, true),
                ]);
            });

            // Sub-total row
            worksheetData.push([
                makeCell('Sub Total', true, false),
                makeCell('', false, false),
                makeCell('', false, false),
                makeCell('', false, false),
                makeCell('', false, false),
                makeCell('', false, false),
                makeCell('', false, false),
                makeCell('', false, false),
                makeCell(parseFloat(group.totalQuantal.toFixed(2)), true, true),
                makeCell(parseFloat(group.totalDespatch.toFixed(2)), true, true),
                makeCell(parseFloat(group.totalBalance.toFixed(2)), true, true),
            ]);
        });

        // Grand total row
        worksheetData.push([
            makeCell('Grand Total', true, false),
            makeCell('', false, false),
            makeCell('', false, false),
            makeCell('', false, false),
            makeCell('', false, false),
            makeCell('', false, false),
            makeCell('', false, false),
            makeCell('', false, false),
            makeCell(parseFloat(grandTotals.totalQuantal.toFixed(2)), true, true),
            makeCell(parseFloat(grandTotals.totalDespatch.toFixed(2)), true, true),
            makeCell(parseFloat(grandTotals.totalBalance.toFixed(2)), true, true),
        ]);

        // Column widths
        const colWidths = [12, 18, 8, 10, 10, 14, 14, 10, 12, 12, 12].map(w => ({ wch: w }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(worksheetData);
        ws['!cols'] = colWidths;
        XLSX.utils.book_append_sheet(wb, ws, 'PartywiseBalanceStock');
        XLSX.writeFile(wb, 'PartywiseBalanceStockReport.xlsx');
    };


    const handleGeneratePDF = () => {
        // Flatten: buyer-header + items + subtotals → plain arrays with styling metadata
        const rows = [];

        sortedEntries.forEach(([buyername, group]) => {
            // 1. Buyer Header Row - We use an object with content and styles for the first cell
            // We set colSpan to cover all columns for a clean header look
            rows.push([
                {
                    content: `► ${buyername}`,
                    colSpan: 11,
                    styles: {
                        fillColor: [240, 240, 240],
                        fontStyle: 'bold',
                        textColor: [0, 0, 0],
                        halign: 'left'
                    }
                }
            ]);

            // 2. Data Rows
            group.items.forEach(item => {
                rows.push([
                    item.Tender_No ?? '',
                    item.millshortname ?? '',
                    item.Grade ?? '',
                    formatReadableAmount(item.Mill_Rate),
                    formatReadableAmount(item.Sale_Rate),
                    item.Tender_Date ?? '',
                    item.Sauda_Date ?? '',
                    item.Do ?? '',
                    formatReadableAmount(item.Buyer_Quantal),
                    formatReadableAmount(item.DESPATCH),
                    formatReadableAmount(item.BALANCE),
                ]);

            });

            // 3. Sub Total Row for each group
            rows.push([
                {
                    content: 'Sub Total',
                    colSpan: 8,
                    styles: { fontStyle: 'bold', halign: 'right' }
                },
                // We need to provide the remaining 3 columns manually since colSpan is 8
                { content: formatReadableAmount(group.totalQuantal.toFixed(2)), styles: { fontStyle: 'bold', halign: 'right' } },
                { content: formatReadableAmount(group.totalDespatch.toFixed(2)), styles: { fontStyle: 'bold', halign: 'right' } },
                { content: formatReadableAmount(group.totalBalance.toFixed(2)), styles: { fontStyle: 'bold', halign: 'right' } },
            ]);


            rows.push([
                {
                    content: '',
                    colSpan: 11,
                    styles: {
                        minCellHeight: 1,
                        lineWidth: { bottom: 0.1 },
                        lineColor: [100, 100, 100],
                        dashRetain: [1, 1]
                    }
                }
            ]);

        });

        // 4. Call the helper function
        generateReportPDF({
            title: 'Partywise Sugar Balance Stock',
            subtitle: '',
            columns: PRINT_COLUMNS.map(c => c.label),
            columnWidths: [22, 25, 14, 18, 18, 16, 16, 12, 16, 16, 16],
            rows,
            footerRow: [
                { content: 'Grand Total', colSpan: 8, styles: { fontStyle: 'bold', halign: 'right', fillColor: [255, 249, 196], textColor: [0, 0, 0] } },
                { content: formatReadableAmount(grandTotals.totalQuantal.toFixed(2)), styles: { fontStyle: 'bold', halign: 'right', fillColor: [255, 249, 196], textColor: [0, 0, 0] } },
                { content: formatReadableAmount(grandTotals.totalDespatch.toFixed(2)), styles: { fontStyle: 'bold', halign: 'right', fillColor: [255, 249, 196], textColor: [0, 0, 0] } },
                { content: formatReadableAmount(grandTotals.totalBalance.toFixed(2)), styles: { fontStyle: 'bold', halign: 'right', fillColor: [255, 249, 196], textColor: [0, 0, 0] } },
            ],
            numericCols: [3, 4, 8, 9, 10], // Indexes for right alignment
            amountInWords: ConvertNumberToWord(grandTotals.totalBalance),
            headerImgSrc: HeaderJK,
            footerImgSrc: FooterJK,
            onComplete: (url) => setPdfPreview(url),
        });
    };

    return (
        <div style={{ marginTop: "-70px" }}>
            {/* ── CommonPrintView (same pattern as SaleTDSRegister) ── */}
            <CommonPrintView
                title="Partywise Sugar Balance Stock"
                subtitle=""
                companyName={Company_Name}
                companyGST={Company_GSTNO}
                columns={PRINT_COLUMNS}
                rows={sortedEntries.flatMap(([buyername, group]) => [
                    { __buyerHeader: buyername },
                    ...group.items,
                    { __subTotal: group },
                ])}
                rowRenderer={(item) => {
                    if (item.__buyerHeader) return [`► ${item.__buyerHeader}`, '', '', '', '', '', '', '', '', '', ''];
                    if (item.__subTotal) {
                        const g = item.__subTotal;
                        return ['Sub Total', '', '', '', '', '', '', '',
                            formatReadableAmount(g.totalQuantal.toFixed(2)),
                            formatReadableAmount(g.totalDespatch.toFixed(2)),
                            formatReadableAmount(g.totalBalance.toFixed(2))];
                    }
                    return [
                        item.Tender_No ?? '', item.millshortname ?? '', item.Grade ?? '',
                        formatReadableAmount(item.Mill_Rate), formatReadableAmount(item.Sale_Rate),
                        item.Tender_Date ?? '', item.Sauda_Date ?? '', item.Do ?? '',
                        formatReadableAmount(item.Buyer_Quantal),
                        formatReadableAmount(item.DESPATCH),
                        formatReadableAmount(item.BALANCE),
                    ];
                }}
                footerValues={[
                    'Grand Total', '', '', '', '', '', '', '',
                    formatReadableAmount(grandTotals.totalQuantal.toFixed(2)),
                    formatReadableAmount(grandTotals.totalDespatch.toFixed(2)),
                    formatReadableAmount(grandTotals.totalBalance.toFixed(2)),
                ]}
                amountInWords={ConvertNumberToWord(grandTotals.totalBalance)}
                headerImg={HeaderJK}
                footerImg={FooterJK}
            />

            <Typography variant="h5" style={{ textAlign: 'center', fontSize: "16px", fontWeight: "bold", color: "black" }}>
                Partywise Sugar Balance Stock
            </Typography>

            <div className="d-flex justify-content-between align-items-center flex-wrap">
                <div style={{ flex: 1, minWidth: "250px", maxWidth: "1100px" }}>
                    <SearchBar value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="d-flex flex-wrap align-items-center" style={{ gap: "8px" }}>
                    {pdfPreview && (
                        <PdfPreview pdfData={pdfPreview} apiData={reportData} label="Partywise Balance Stock Report" />
                    )}
                    {/* Print PDF — same red button style as SaleTDSRegister */}
                    <button className="btn btn-danger me-2 no-print" onClick={handleGeneratePDF}>
                        Print
                    </button>
                    <Button variant="outlined" color="secondary" onClick={handleExportToExcel}>
                        Export to Excel
                    </Button>
                    <Button variant="outlined" color="secondary" onClick={() => window.open('/millwise-stock', '_blank')}>
                        Mill Wise Lifting Wise
                    </Button>
                    <Button variant="outlined" color="secondary" onClick={() => window.open('/self-stock', '_blank')}>
                        Self Stock
                    </Button>
                    <Button variant="outlined" color="secondary" onClick={() => window.open('/ebuysugar-self-stock', '_blank')}>
                        eBuySelf Stock
                    </Button>
                </div>
            </div>

            {/* Data Table */}
            <div className="relative">
                <Paper elevation={0} className="rounded-xl border border-gray-200 overflow-hidden shadow-lg bg-white/80 backdrop-blur-sm">
                    <TableContainer >
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    {SCREEN_COLUMNS.map(col => (
                                        <TableCell
                                            key={col.key}
                                            align={col.numeric ? 'right' : 'left'}
                                            sx={{
                                                background: 'linear-gradient(180deg, #5557df 0%, #3e40b3 100%) !important',
                                                color: '#fff !important',
                                                fontWeight: 'bold',
                                                width: col.width,
                                                fontSize: '0.85rem',
                                                padding: '12px 8px',
                                                borderBottom: 'none'
                                            }}
                                        >
                                            <TableSortLabel
                                                active={sortConfig.key === col.key}
                                                direction={sortConfig.key === col.key ? sortConfig.direction : 'asc'}
                                                onClick={() => requestSort(col.key)}
                                                sx={{
                                                    '&.MuiTableSortLabel-root': { color: '#fff !important' },
                                                    '&.MuiTableSortLabel-root:hover': { color: '#e0e7ff !important' },
                                                    '&.Mui-active': { color: '#fff !important' },
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
                                {sortedEntries
                                    .filter(([buyername, group]) =>
                                        searchQuery.trim() === '' ||
                                        buyername.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        group.items.some(item =>
                                            Object.values(item).some(val =>
                                                val?.toString().toLowerCase().includes(searchQuery.toLowerCase())
                                            )
                                        )
                                    )
                                    .map(([buyername, group]) => (
                                        <React.Fragment key={buyername}>
                                            {/* Group Header Row */}
                                            <TableRow>
                                                <TableCell
                                                    colSpan={11}
                                                    sx={{
                                                        backgroundColor: '#f8faff',
                                                        color: '#1e40af',
                                                        fontWeight: '800',
                                                        fontSize: '0.95rem',
                                                        borderBottom: '1px solid #e2e8f0',
                                                        padding: '10px 16px'
                                                    }}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                                                        {buyername}
                                                    </span>
                                                </TableCell>
                                            </TableRow>

                                            {/* Item Rows */}
                                            {group.items.map((item, index) => (
                                                <TableRow
                                                    key={index}
                                                    hover
                                                    sx={{
                                                        height: 35,
                                                        '& td': { padding: '6px 12px', color: '#334155', borderBottom: '1px solid #f1f5f9' },
                                                        '&:hover': { backgroundColor: '#fdfdff !important' }
                                                    }}
                                                >
                                                    <TableCell>{item.Tender_No}</TableCell>
                                                    <TableCell className="font-medium">{item.millshortname || ''}</TableCell>
                                                    <TableCell>{item.Grade}</TableCell>
                                                    <TableCell align="right">{formatReadableAmount(item.Mill_Rate)}</TableCell>
                                                    <TableCell align="right" className="text-blue-700 font-semibold">{formatReadableAmount(item.Sale_Rate)}</TableCell>
                                                    <TableCell>{item.Tender_Date}</TableCell>
                                                    <TableCell>{item.Sauda_Date}</TableCell>
                                                    <TableCell>{item.Do}</TableCell>
                                                    <TableCell align="right">{formatReadableAmount(item.Buyer_Quantal)}</TableCell>
                                                    <TableCell align="right">{item.DESPATCH}</TableCell>
                                                    <TableCell align="right" className="font-bold text-gray-900">{item.BALANCE}</TableCell>
                                                </TableRow>
                                            ))}

                                            {/* Premium Glassmorphic Sub-total Card Area */}
                                            <TableRow>
                                                <TableCell colSpan={11} sx={{ padding: '0px' }}>
                                                    <div className="m-2 p-3 bg-yellow-50/80 backdrop-blur-sm border border-yellow-200 rounded-xl flex flex-wrap items-center justify-between gap-4 shadow-inner">
                                                        <div className="flex flex-wrap gap-4 text-xs">
                                                            {(() => {
                                                                const accountBalance = toNum(group.partyBalance);
                                                                const stockValue = toNum(group.totalStockValueAtSale);
                                                                let pending = accountBalance < 0 ? accountBalance + stockValue : accountBalance - stockValue;
                                                                pending = Number(pending.toFixed(2));
                                                                if (Object.is(pending, -0)) pending = 0;

                                                                return (
                                                                    <>
                                                                        <div className="flex flex-col">
                                                                            <span className="text-gray-500 uppercase font-bold tracking-wider">Party Balance</span>
                                                                            <span className="text-sm font-black text-gray-800">{formatReadableAmount(accountBalance)}</span>
                                                                        </div>
                                                                        <div className="flex flex-col border-l border-yellow-300 pl-4">
                                                                            <span className="text-gray-500 uppercase font-bold tracking-wider">Stock Value</span>
                                                                            <span className="text-sm font-black text-gray-800">{formatReadableAmount(stockValue)}</span>
                                                                        </div>
                                                                        <div className="flex flex-col border-l border-yellow-300 pl-4">
                                                                            <span className="text-gray-500 uppercase font-bold tracking-wider">Pending Payment</span>
                                                                            <span className={`text-sm font-black`}>{formatReadableAmount(pending)}</span>
                                                                        </div>
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                        <div className="flex items-center gap-6">
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[10px] text-yellow-700 font-bold uppercase">Group Totals</span>
                                                                <div className="flex gap-4">
                                                                    <div className="text-right"><span className="text-[10px] block text-gray-500">Quintal</span><span className="font-bold">{formatReadableAmount(group.totalQuantal.toFixed(2))}</span></div>
                                                                    <div className="text-right"><span className="text-[10px] block text-gray-500">Dispatch</span><span className="font-bold">{formatReadableAmount(group.totalDespatch.toFixed(2))}</span></div>
                                                                    <div className="text-right"><span className="text-[10px] block text-gray-500">Balance</span><span className="font-bold text-indigo-700">{formatReadableAmount(group.totalBalance.toFixed(2))}</span></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        </React.Fragment>
                                    ))}
                            </TableBody>

                            <TableFooter className="sticky bottom-0 z-10">
                                <TableRow className="bg-indigo-900 shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
                                    <TableCell colSpan={8} sx={{ fontWeight: '900', color: '#fff', fontSize: '1rem', letterSpacing: '1px' }}>
                                        GRAND TOTAL
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: '900', color: '#fff', fontSize: '0.9rem' }}>
                                        {formatReadableAmount(grandTotals.totalQuantal.toFixed(2))}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: '900', color: '#fff', fontSize: '0.9rem' }}>
                                        {formatReadableAmount(grandTotals.totalDespatch.toFixed(2))}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: '900', color: '#34d399', fontSize: '1rem' }}>
                                        {formatReadableAmount(grandTotals.totalBalance.toFixed(2))}
                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </TableContainer>
                </Paper>
            </div>


            {/* ScaleLoader — same as SaleTDSRegister */}
            {loading && (
                <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999 }}>
                    <ScaleLoader color="#040649" height={35} width={4} radius={2} margin={2} />
                </div>
            )}

            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
};

export default PendingReports;