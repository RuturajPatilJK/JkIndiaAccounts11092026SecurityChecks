import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import PdfPreview from '../../../../Common/PDFPreview';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { ScaleLoader } from 'react-spinners';
import PrintButton from "../../../../Common/Buttons/PrintPDF";
import { formatReadableAmount } from "../../../../Common/FormatFunctions/FormatAmount"
import {
    Box,
    Typography,
    Button,
    Stack,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel
} from "@mui/material";
import SearchBar from "../../../../Common/UtilityCommon/SearchBar";

import { generateReportPDF } from "../../../../Common/ReportCommon/CommonPDFGenerator";
import { ConvertNumberToWord } from "../../../../Common/FormatFunctions/ConvertNumberToWord";
import HeaderJK from '../../../../Assets/HeaderJK.png';
import FooterJK from '../../../../Assets/FooterJK.png';

const API_URL = process.env.REACT_APP_API;

const MillWiseLiftingWise = () => {
    const Company_Name = sessionStorage.getItem("Company_Name");
    const Company_GSTNO = sessionStorage.getItem('Company_GSTNO');

    const [groupedData, setGroupedData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pdfPreview, setPdfPreview] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${API_URL}/millwise-stock-report`, {
                    params: { Company_Code: sessionStorage.getItem('Company_Code') },
                });
                const data = response.data;

                filterSelfRecords(data);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load data.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filterSelfRecords = (data) => {
        const despatchSaudaDetails = data.despatch_sauda_details || {};
        const ebuyBalanceDetails = data.ebuy_balance_details || {};
        const selfBalanceDetails = data.self_balance_details || {};
        const grouped = data.tender_details.map((tender) => {
            const salesDetails = data.sales_details.find(
                (sale) => sale.Tender_No === tender.Tender_No
            );

            const despatchSauda = despatchSaudaDetails[tender.Tender_No] || {};
            const selfBalance = selfBalanceDetails[tender.Tender_No];

            // Self (ID=1) row's Quintal/Balance are overridden with the
            // query-derived self balance BEFORE the BALANCE!=0 filter below -
            // otherwise a self row whose own raw BALANCE is 0 gets dropped
            // before the override ever has a chance to replace it.
            const rawDetails = salesDetails ? salesDetails.details : [];
            const selfAdjustedAll = rawDetails.map((sale) =>
                sale.ID === 1
                    ? { ...sale, Buyer_Quantal: selfBalance, BALANCE: selfBalance }
                    : sale
            );
            const selfAdjustedDetails = selfAdjustedAll.filter((sale) => parseFloat(sale.BALANCE) !== 0);

            return {
                ...tender.details[0],
                salesDetails: selfAdjustedDetails,
                despatch: despatchSauda.despatch,
                sauda: despatchSauda.sauda,
                ebuyBalance: ebuyBalanceDetails[tender.Tender_No],
                selfBalance,
            };
        });
        setGroupedData(grouped.filter((tender) => tender.salesDetails.length > 0));
    };

    // Sorting Logic
    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredData = useMemo(() => {
        let data = groupedData.filter((tender) => {
            const query = searchQuery.toLowerCase();
            const tenderMatch = Object.values(tender).some(val =>
                String(val).toLowerCase().includes(query)
            );
            const salesMatch = tender.salesDetails.some(sale =>
                Object.values(sale).some(val =>
                    String(val).toLowerCase().includes(query)
                )
            );
            return tenderMatch || salesMatch;
        });

        if (sortConfig.key) {
            data.sort((a, b) => {
                const aVal = a[sortConfig.key] ?? '';
                const bVal = b[sortConfig.key] ?? '';
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return data;
    }, [groupedData, searchQuery, sortConfig]);

    const handleExportToExcel = () => {
        const table = document.getElementById('reportContent').querySelector('table');
        const rows = Array.from(table.rows);
        const sheetData = rows.map(row => Array.from(row.cells).map(cell => cell.textContent.trim()));
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'MillWiseLiftingWise');
        XLSX.writeFile(workbook, 'MillWiseLiftingWise.xlsx');
    };

    const generatePDF = () => {
        const columns = [
            'Tender/Buyer Name', 'Date', 'Grade', 'Lot', 'Mill Rate',
            'Sale Rate', 'Quintal', 'Disp', 'Balance', 'Sauda', 'Lifting', 'DO'
        ];
        const rows = [];
        let grandTotalBalance = 0;

        const millGroups = {};
        filteredData.forEach(tender => {
            const mill = tender.millname || 'Unknown Mill';
            if (!millGroups[mill]) millGroups[mill] = [];
            millGroups[mill].push(tender);
        });

        Object.entries(millGroups).forEach(([millName, tenders]) => {
            rows.push([
                {
                    content: `Mill: ${millName}`,
                    colSpan: 12,
                    styles: { textColor: [0, 0, 0], fontStyle: 'bold', halign: 'left', fontSize: 10 }
                }
            ]);

            tenders.forEach((tender) => {
                const totalDispatch = tender.salesDetails.reduce((sum, s) => sum + parseFloat(s.despatchqty || 0), 0);
                const totalBalance = tender.salesDetails.reduce((sum, s) => sum + parseFloat(s.BALANCE || 0), 0);
                grandTotalBalance += totalBalance;

                rows.push([
                    { content: `Tender No: ${tender.Tender_No}`, styles: { fontStyle: 'bold', halign: 'left' } },
                    tender.Tender_Date || '',
                    tender.Grade || '',
                    '',
                    { content: formatReadableAmount(tender.Mill_Rate), styles: { halign: 'right' } },
                    { content: formatReadableAmount(tender.Purc_Rate), styles: { halign: 'right' } },
                    { content: formatReadableAmount(tender.Quantal), styles: { halign: 'right' } },
                    { content: formatReadableAmount(totalDispatch), styles: { halign: 'right' } },
                    { content: formatReadableAmount(totalBalance), styles: { halign: 'right' } },
                    '',
                    tender.Lifting_Date || '',
                    tender.doname || ''
                ]);

                tender.salesDetails.forEach((sale) => {
                    rows.push([
                        {
                            content: `${sale.ID} - ${sale.buyerbrokerfullname}`,
                            styles: { textColor: [0, 0, 0], fontStyle: 'bold', halign: 'left', fontSize: 7 }
                        },
                        '',
                        sale.Grade || '',
                        '',
                        { content: formatReadableAmount(sale.MillRate), styles: { halign: 'right' } },
                        { content: formatReadableAmount(sale.Sale_Rate), styles: { halign: 'right' } },
                        { content: formatReadableAmount(sale.Buyer_Quantal), styles: { halign: 'right' } },
                        { content: formatReadableAmount(sale.despatchqty), styles: { halign: 'right' } },
                        { content: formatReadableAmount(sale.BALANCE), styles: { halign: 'right' } },
                        sale.Sauda_Date || '',
                        '',
                        ''
                    ]);
                });
                rows.push([{ content: '', colSpan: 12, styles: { minCellHeight: 1 } }]);
            });
        });

        generateReportPDF({
            title: 'Millwise Lifting Stock Report',
            columns: columns,
            rows: rows,
            footerRow: [
                'GRAND TOTAL', '', '', '', '', '', '', '',
                formatReadableAmount(grandTotalBalance),
                '', '', ''
            ],
            columnStyles: {
                0: { cellWidth: 50, halign: 'left' },
                4: { halign: 'right' }, 5: { halign: 'right' },
                6: { halign: 'right' }, 7: { halign: 'right' },
                8: { halign: 'right' },
            },
            amountInWords: ConvertNumberToWord(grandTotalBalance),
            headerImgSrc: HeaderJK,
            footerImgSrc: FooterJK,
            orientation: 'landscape',
            onComplete: (url) => {
                setPdfPreview(url);
                window.open(url, '_blank'); // Opens PDF in new tab same as Sale Register
            },
        });
    };

    const COLUMNS = [
        { label: 'Tender No.', key: 'Tender_No' },
        { label: 'Date', key: 'Tender_Date' },
        { label: 'Mill', key: 'millname' },
        { label: 'Grade', key: 'Grade' },
        { label: 'Lot', key: 'Lot' },
        { label: 'Mill Rate', key: 'Mill_Rate' },
        { label: 'Sale Rate', key: 'Purc_Rate' },
        { label: 'Quintal', key: 'Quantal' },
        { label: 'Dispatched', key: 'Dispatched' },
        { label: 'Balance', key: 'Balance' },
        { label: 'Lifting Date', key: 'Lifting_Date' },
        { label: 'Sauda Date', key: 'Sauda_Date' },
        { label: 'DO', key: 'doname' }
    ];

    return (
        <Box style={{ marginTop: "-90px" }}>
            <Typography variant="h6" align="center" fontWeight="bold" color="blue" fontSize="16px">
                Mill Wise Stock Report
            </Typography>

            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                <Box sx={{ flex: 1 }} />
                <Box sx={{ flexShrink: 0 }}>
                    <Box style={{ minWidth: "250px", maxWidth: "600px", margin: "0 auto" }}>
                        <SearchBar value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </Box>
                </Box>

                <Stack direction="row" spacing={2} sx={{ flex: 1 }} justifyContent="flex-end">
                    {pdfPreview && (
                        <PdfPreview pdfData={pdfPreview} apiData={groupedData} label="Millwise Lifting Stock Report" />
                    )}
                    <PrintButton disabledFeild={""} fetchData={generatePDF} />
                    <Button variant="outlined" color="secondary" onClick={handleExportToExcel}>
                        Export to Excel
                    </Button>
                </Stack>
            </Stack>

            <Box sx={{
                height: 'calc(100vh - 150px)',
                overflow: 'auto',
                position: 'relative',
                border: 'dashed rgb(134, 133, 133)',
                borderRadius: '4px'
            }}>
                <TableContainer
                    id="reportContent"
                    component={Paper}
                    sx={{ position: 'relative', overflow: 'auto', height: '100%' }}
                >
                    <Table stickyHeader size="small" sx={{
                        minWidth: 1000,
                        '& .MuiTableCell-root': { border: '0.1px dashed rgb(134, 133, 133)' },
                        '& .MuiTableCell-head': { backgroundColor: 'black', color: 'white', zIndex: 2 }
                    }}>
                        <TableHead>
                            <TableRow>
                                {COLUMNS.map((col) => (
                                    <TableCell key={col.key} align="center">
                                        <TableSortLabel
                                            active={sortConfig.key === col.key}
                                            direction={sortConfig.direction}
                                            onClick={() => requestSort(col.key)}
                                            sx={{
                                                color: 'white !important',
                                                '& .MuiTableSortLabel-icon': { color: 'white !important' }
                                            }}
                                        >
                                            {col.label}
                                        </TableSortLabel>
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredData.map((tender, index) => {
                                const totalBalance = tender.salesDetails.reduce((sum, sale) => sum + parseFloat(sale.BALANCE || 0), 0);
                                const totalDispatch = tender.salesDetails.reduce((sum, sale) => sum + parseFloat(sale.despatchqty || 0), 0);

                                return (
                                    <React.Fragment key={index}>
                                        <TableRow>
                                            <TableCell rowSpan={tender.salesDetails.length + 1} sx={{ textAlign: 'left', fontSize: "16px", fontWeight: "bold" }}>
                                                {tender.Tender_No}
                                            </TableCell>
                                            <TableCell style={{ whiteSpace: "nowrap" }}>
                                                {tender.Tender_Date} / <span style={{ color: 'red' }}> Disp : {formatReadableAmount(tender.despatch || 0)} </span> /
                                                <span style={{ color: 'green', fontWeight: 'bold' }}> Sauda : {formatReadableAmount(tender.sauda || 0)} </span>
                                                {tender.ebuyBalance !== undefined && (
                                                    <span style={{ color: 'purple', fontWeight: 'bold' }}>
                                                        {' '}/ eBuy : {formatReadableAmount(tender.ebuyBalance || 0)}
                                                    </span>
                                                )}
                                                {(tender.ebuyBalance !== undefined || tender.selfBalance !== undefined) && (
                                                    <span style={{ color: 'black', fontWeight: 'bold' }}>
                                                        {' '}/ eBuy with Self Balance : {formatReadableAmount((parseFloat(tender.ebuyBalance) || 0) + (parseFloat(tender.selfBalance) || 0))}
                                                    </span>
                                                )}
                                                {/* {tender.selfBalance !== undefined && (
                                                    <span style={{ color: 'black', fontWeight: 'bold' }}>
                                                        {' '}/ Self : {formatReadableAmount(tender.selfBalance || 0)}
                                                    </span>
                                                )} */}
                                            </TableCell>
                                            <TableCell sx={{ textAlign: 'left', fontWeight: "bold" }}>{tender.millname}</TableCell>
                                            <TableCell>{tender.Grade}</TableCell>
                                            <TableCell></TableCell>
                                            <TableCell align="right">{formatReadableAmount(tender.Mill_Rate)}</TableCell>
                                            <TableCell align="right">{formatReadableAmount(tender.Purc_Rate)}</TableCell>
                                            <TableCell align="right">{formatReadableAmount(tender.Quantal)}</TableCell>
                                            <TableCell align="right">{formatReadableAmount(totalDispatch)}</TableCell>
                                            <TableCell align="right">{formatReadableAmount(totalBalance)}</TableCell>
                                            <TableCell>{tender.Lifting_Date}</TableCell>
                                            <TableCell>{tender.Sauda_Date}</TableCell>
                                            <TableCell>{tender.doname}</TableCell>
                                        </TableRow>

                                        {tender.salesDetails.map((sale, saleIndex) => (
                                            <TableRow key={saleIndex} sx={{ backgroundColor: sale.ID === 1 ? '#ffcccc' : 'white' }}>
                                                <TableCell sx={{ color: 'blue', fontWeight: 'bold' }}>{sale.ID}-{sale.buyerbrokerfullname}</TableCell>
                                                <TableCell />
                                                <TableCell>{sale.Grade}</TableCell>
                                                <TableCell />
                                                <TableCell align="right">{formatReadableAmount(sale.MillRate)}</TableCell>
                                                <TableCell align="right">{formatReadableAmount(sale.Sale_Rate)}</TableCell>
                                                <TableCell align="right">{formatReadableAmount(sale.Buyer_Quantal)}</TableCell>
                                                <TableCell align="right">{formatReadableAmount(sale.despatchqty)}</TableCell>
                                                <TableCell align="right">{formatReadableAmount(sale.BALANCE)}</TableCell>
                                                <TableCell />
                                                <TableCell>{sale.Sauda_Date}</TableCell>
                                                <TableCell />
                                            </TableRow>
                                        ))}
                                        <TableRow>
                                            <TableCell colSpan={13} sx={{ height: 15, backgroundColor: '#f5f5f5' }} />
                                        </TableRow>
                                    </React.Fragment>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
                {loading && (
                    <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}>
                        <ScaleLoader color="#36d7b7" />
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default MillWiseLiftingWise;