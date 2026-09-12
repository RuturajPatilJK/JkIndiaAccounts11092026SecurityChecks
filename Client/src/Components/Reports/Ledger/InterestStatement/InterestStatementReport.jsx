import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, Typography, TableFooter, TableSortLabel,
    Button
} from "@mui/material";
import { ScaleLoader } from "react-spinners";
import DownloadIcon from "@mui/icons-material/Download";
import PrintIcon from "@mui/icons-material/Print";

// Common Components & Functions
import PdfPreview from "../../../../Common/PDFPreview";
import { formatReadableAmount } from "../../../../Common/FormatFunctions/FormatAmount";
import BackButton from "../../../../Common/Buttons/BackButton";
import { generateReportPDF } from "../../../../Common/ReportCommon/CommonPDFGenerator";

// Asset Imports (Ensure these paths are correct in your project)
import HeaderJK from "../../../../Assets/HeaderJK.png";
import FooterJK from "../../../../Assets/FooterJK.png";

const API_URL = process.env.REACT_APP_API;

// Screen Column Definitions
const SCREEN_COLUMNS = [
    { label: "#", key: "Tran_Type", width: "5%", align: "left" },
    { label: "Date", key: "Date", width: "10%", align: "left" },
    { label: "Debit Amount", key: "Debit_Amount", width: "12%", align: "right" },
    { label: "Credit Amount", key: "Credit_Amount", width: "12%", align: "right" },
    { label: "Balance", key: "Balance", width: "12%", align: "right" },
    { label: "D/C", key: "Bal_DC", width: "5%", align: "center" },
    { label: "Days", key: "Days", width: "8%", align: "right" },
    { label: "Interest", key: "Interest", width: "12%", align: "right" },
    { label: "D/C", key: "Int_DC", width: "5%", align: "center" },
];

const InterestStatementReport = () => {
    const companyCode = sessionStorage.getItem("Company_Code");
    const companyName = sessionStorage.getItem("Company_Name");
    const location = useLocation();
    const navigate = useNavigate();

    const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

    const acCode = queryParams.get("acCode");
    const fromDate = queryParams.get("fromDate");
    const toDate = queryParams.get("toDate");
    const interestRate = queryParams.get("interestRate");
    const interestDays = queryParams.get("interestDays");
    const filter = queryParams.get("filter") || "All";
    const acname = queryParams.get("acname");

    const [transactions, setTransactions] = useState([]);
    const [totals, setTotals] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pdfPreview, setPdfPreview] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: "Date", direction: "asc" });

    useEffect(() => {
        if (!acCode) return;
        const fetchReport = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_URL}/interest-statement?accode=${acCode}&fromdt=${fromDate}&todt=${toDate}&intRate=${interestRate}&intDays=${interestDays}&company_code=${companyCode}`);
                const data = await response.json();
                setTransactions(data.data || []);
                setTotals(data.totals || {});
            } catch (err) {
                console.error("API Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [acCode, fromDate, toDate, interestRate, interestDays, companyCode]);

    const sortedData = useMemo(() => {
        let filtered = filter === "OnlyDr" ? transactions.filter(t => t.Bal_DC === "Dr") : transactions;
        let items = [...filtered];
        if (sortConfig.key) {
            items.sort((a, b) => {
                let va = a[sortConfig.key];
                let vb = b[sortConfig.key];
                if (!isNaN(parseFloat(va)) && !isNaN(parseFloat(vb))) {
                    return sortConfig.direction === "asc" ? va - vb : vb - va;
                }
                return sortConfig.direction === "asc"
                    ? String(va).localeCompare(String(vb))
                    : String(vb).localeCompare(String(va));
            });
        }
        return items;
    }, [transactions, filter, sortConfig]);

    const requestSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
        }));
    };

    const handleExportExcel = () => {
        const worksheetData = [
            [companyName.toUpperCase()],
            [`Interest Statement Report: ${acname}`],
            [`From: ${fromDate} To: ${toDate} | Rate: ${interestRate}%`],
            [],
            SCREEN_COLUMNS.map(c => c.label),
            ...sortedData.map(t => [
                t.Tran_Type, t.Date, t.Debit_Amount, t.Credit_Amount, t.Balance, t.Bal_DC, t.Days, t.Interest, t.Int_DC
            ]),
            [],
            ["TOTALS", "", totals?.Total_Debit, totals?.Total_Credit, totals?.Net_Balance, totals?.Net_Balance_DC, totals?.Net_Days, totals?.Net_Interest, totals?.Net_Interest_DC]
        ];
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(worksheetData);
        XLSX.utils.book_append_sheet(wb, ws, "Interest_Report");
        XLSX.writeFile(wb, `Interest_${acname}.xlsx`);
    };


    const handleGeneratePDF = () => {
        const footerStyle = { fillColor: [240, 240, 240], fontStyle: 'bold' };
        const subtitle = `Account: ${acname} | Period: ${fromDate} to ${toDate} | Rate: ${interestRate}%`;

        const printRows = sortedData.map(t => [
            { content: t.Tran_Type, styles: { halign: 'left' } },
            { content: t.Date, styles: { halign: 'left' } },
            { content: formatReadableAmount(t.Debit_Amount.toFixed(2)), styles: { halign: 'right', textColor: [0, 0, 255] } },
            { content: formatReadableAmount(t.Credit_Amount.toFixed(2)), styles: { halign: 'right', textColor: [255, 0, 0] } },
            { content: formatReadableAmount(t.Balance.toFixed(2)), styles: { halign: 'right' } },
            { content: t.Bal_DC, styles: { halign: 'center' } },
            { content: t.Days, styles: { halign: 'right' } },
            { content: formatReadableAmount(t.Interest.toFixed(2)), styles: { halign: 'right', fontStyle: 'bold' } },
            { content: t.Int_DC, styles: { halign: 'center' } },
        ]);

        const styledFooterRow = [
            { content: "TOTALS", colSpan: 2, styles: { ...footerStyle, halign: 'center' } },
            { content: formatReadableAmount(totals?.Total_Debit.toFixed(2)), styles: { ...footerStyle, halign: 'right', textColor: [0, 0, 255] } },
            { content: formatReadableAmount(totals?.Total_Credit.toFixed(2)), styles: { ...footerStyle, halign: 'right', textColor: [255, 0, 0] } },
            { content: formatReadableAmount(totals?.Net_Balance.toFixed(2)), styles: { ...footerStyle, halign: 'right' } },
            { content: totals?.Net_Balance_DC, styles: { ...footerStyle, halign: 'center' } },
            { content: totals?.Net_Days.toString(), styles: { ...footerStyle, halign: 'right' } },
            { content: formatReadableAmount(totals?.Net_Interest.toFixed(2)), styles: { ...footerStyle, halign: 'right' } },
            { content: totals?.Net_Interest_DC, styles: { ...footerStyle, halign: 'center' } },
        ];

        generateReportPDF({
            title: 'Interest Statement Report',
            subtitle,
            columns: SCREEN_COLUMNS.map(c => c.label),
            rows: printRows,
            footerRow: styledFooterRow,
            headerImgSrc: HeaderJK,
            footerImgSrc: FooterJK,
            // columnStyles still kept as fallback
            columnStyles: {
                0: { halign: 'left' },
                1: { halign: 'left' },
                2: { halign: 'right' },
                3: { halign: 'right' },
                4: { halign: 'right' },
                5: { halign: 'center' },
                6: { halign: 'right' },
                7: { halign: 'right' },
                8: { halign: 'center' }
            },
            orientation: 'landscape',
            onComplete: (url) => setPdfPreview(url),
        });
    };


    return (
        <div style={{ padding: "20px", marginTop: "-15px" }}>
            <Typography variant="h6" align="center" sx={{ fontWeight: 'bold' }}>{companyName}</Typography>
            <Typography variant="subtitle1" align="center" sx={{ fontWeight: 'bold', mb: 1 }}>Interest Statement Report</Typography>
            <Typography variant="body2" align="center" sx={{ mb: 2, color: "#666" }}>
                Account: <strong>{acname}</strong> | From: {fromDate} To: {toDate} | Rate: {interestRate}%
            </Typography>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <BackButton onClick={() => navigate("/interest-statement")} />
                <div>
                    <Button variant="contained" color="error" size="small" startIcon={<PrintIcon />} onClick={handleGeneratePDF} sx={{ mr: 1 }}>Print PDF</Button>
                    <Button variant="contained" color="success" size="small" startIcon={<DownloadIcon />} onClick={handleExportExcel}>Export Excel</Button>
                </div>
            </div>

            {pdfPreview && <PdfPreview pdfData={pdfPreview} label="intereststatement" />}

            <TableContainer component={Paper} sx={{ maxHeight: "68vh", boxShadow: 3 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {SCREEN_COLUMNS.map((col) => (
                                <TableCell
                                    key={col.key}
                                    align={col.align}
                                    sx={{ backgroundColor: "#1a237e", color: "white", fontWeight: "bold", fontSize: "12px" }}
                                >
                                    <TableSortLabel
                                        active={sortConfig.key === col.key}
                                        direction={sortConfig.direction}
                                        onClick={() => requestSort(col.key)}
                                        sx={{
                                            '&.Mui-active, & .MuiTableSortLabel-icon': { color: 'white !important' }
                                        }}
                                    >
                                        {col.label}
                                    </TableSortLabel>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedData.map((txn, idx) => (
                            <TableRow key={idx} hover sx={{ backgroundColor: idx % 2 === 0 ? "#fff" : "#f1f3f4" }}>
                                <TableCell sx={{ fontSize: "12px" }}>{txn.Tran_Type}</TableCell>
                                <TableCell sx={{ fontSize: "12px" }}>{txn.Date}</TableCell>
                                <TableCell align="right" sx={{ fontSize: "12px", color: "blue" }}>{formatReadableAmount(txn.Debit_Amount.toFixed(2))}</TableCell>
                                <TableCell align="right" sx={{ fontSize: "12px", color: "red" }}>{formatReadableAmount(txn.Credit_Amount.toFixed(2))}</TableCell>
                                <TableCell align="right" sx={{ fontSize: "12px" }}>{formatReadableAmount(txn.Balance.toFixed(2))}</TableCell>
                                <TableCell align="center" sx={{ fontSize: "12px" }}>{txn.Bal_DC}</TableCell>
                                <TableCell align="right" sx={{ fontSize: "12px" }}>{txn.Days}</TableCell>
                                <TableCell align="right" sx={{ fontSize: "12px", fontWeight: "bold" }}>{formatReadableAmount(txn.Interest.toFixed(2))}</TableCell>
                                <TableCell align="center" sx={{ fontSize: "12px" }}>{txn.Int_DC}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    {totals && (
                        <TableFooter sx={{ position: "sticky", bottom: 0, zIndex: 10 }}>
                            <TableRow sx={{ backgroundColor: "#fff9c4" }}>
                                <TableCell colSpan={2} sx={{ fontWeight: "bold", fontSize: "12px" }}>TOTALS</TableCell>
                                <TableCell align="right" sx={{ fontWeight: "bold", color: "blue", fontSize: "12px" }}>{formatReadableAmount(totals.Total_Debit.toFixed(2))}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: "bold", color: "red", fontSize: "12px" }}>{formatReadableAmount(totals.Total_Credit.toFixed(2))}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: "bold", fontSize: "12px" }}>{formatReadableAmount(totals.Net_Balance.toFixed(2))}</TableCell>
                                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "12px" }}>{totals.Net_Balance_DC}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: "bold", fontSize: "12px" }}>{totals.Net_Days}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: "bold", fontSize: "12px" }}>{formatReadableAmount(totals.Net_Interest.toFixed(2))}</TableCell>
                                <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "12px" }}>{totals.Net_Interest_DC}</TableCell>
                            </TableRow>
                        </TableFooter>
                    )}
                </Table>
            </TableContainer>

            {loading && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: "50px" }}>
                    <ScaleLoader color="#1a237e" />
                </div>
            )}
        </div>
    );
};

export default InterestStatementReport;