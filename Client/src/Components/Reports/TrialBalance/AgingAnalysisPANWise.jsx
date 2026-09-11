
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { useLocation } from "react-router-dom";
import { ScaleLoader } from "react-spinners";
import {
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, Typography, TableFooter, TableSortLabel,
    Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton,
    Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";
import DownloadIcon from "@mui/icons-material/Download";

import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate";
import PdfPreview from "../../../Common/PDFPreview";
import HeaderJK from "../../../Assets/HeaderJK.png";
import FooterJK from "../../../Assets/FooterJK.png";
import { ConvertNumberToWord } from "../../../Common/FormatFunctions/ConvertNumberToWord";
import { generateReportPDF } from "../../../Common/ReportCommon/CommonPDFGenerator";

const apikey = process.env.REACT_APP_API;

const SCREEN_COLUMNS = [
    { label: 'PAN No', key: 'PAN', width: '10%' },
    { label: 'Account Name', key: 'Ac_name', width: '40%' },
    { label: 'City', key: 'City_name', width: '20%' },
    { label: 'Credit (-)', key: 'Credit', width: '15%', numeric: true },
    { label: 'Debit (+)', key: 'Debit', width: '15%', numeric: true },
];

const PRINT_COLUMNS = [
    { label: 'Code', key: 'Ac_code', printWidth: '20mm' },
    { label: 'Account Name', key: 'Ac_name', printWidth: '72mm' },
    { label: 'City', key: 'City_name', printWidth: '35mm' },
    { label: 'Credit', key: 'Credit', printWidth: '22mm', numeric: true },
    { label: 'Debit', key: 'Debit', printWidth: '22mm', numeric: true },
];

const DETAIL_COLUMNS = [
    { label: 'A/c Code', key: 'ac_code', numeric: false },
    { label: 'Account Name', key: 'Ac_Name_E', numeric: false },
    { label: 'City', key: 'cityname', numeric: false },
    { label: 'Credit (-)', key: 'credit', numeric: true },
    { label: 'Debit (+)', key: 'debit', numeric: true },
];

const getNum = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
};

// ─── Detail Drill-Down Modal ──────────────────────────────────────────────────
const DetailModal = ({ open, onClose, gstNo, acName, cityName, groupCode, companyCode, toDate, groupName }) => {
    const [detailData, setDetailData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [pdfPreview, setPdfPreview] = useState(null);

    useEffect(() => {
        if (!open || !gstNo) return;
        setPdfPreview(null);
        const fetchDetail = async () => {
            setLoading(true);
            setError("");
            try {
                const resp = await axios.get(`${apikey}/AgingAnalysis-GSTwise-Detail`, {
                    params: { Gst_No: gstNo, Group_code: groupCode, Company_Code: companyCode },
                });
                setDetailData(Array.isArray(resp.data) ? resp.data : []);
            } catch {
                setError("Error fetching detail data");
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [open, gstNo, groupCode, companyCode]);

    const totals = useMemo(() => detailData.reduce((acc, row) => {
        const bal = getNum(row.balance);
        acc.credit += bal < 0 ? Math.abs(bal) : 0;
        acc.debit += bal > 0 ? bal : 0;
        return acc;
    }, { credit: 0, debit: 0 }), [detailData]);

    const detailNetDiff = totals.debit - totals.credit;
    const detailNetDiffAbs = Math.abs(detailNetDiff);
    const detailNetDiffSuffix = detailNetDiff >= 0 ? " Dr" : " Cr";
    const detailNetDiffColor = detailNetDiff >= 0 ? "blue" : "red";

    const handleGeneratePDF = () => {
        const footerStyle = { fillColor: [255, 249, 196], fontStyle: 'bold' };
        const subtitle = `GST No: ${gstNo}  |  ${acName}  |  City: ${cityName}  |  Period upto: ${FormaDateBalanceSheet(toDate)}`;

        const printRows = detailData.map(row => {
            const bal = getNum(row.balance);
            return [
                row.ac_code ?? "",
                row.Ac_Name_E ?? "",
                row.cityname ?? "",
                formatReadableAmount(bal < 0 ? Math.abs(bal).toFixed(2) : "0.00"),
                formatReadableAmount(bal > 0 ? bal.toFixed(2) : "0.00"),
            ];
        });

        const styledFooterRow = [
            { content: "GRAND TOTAL", colSpan: 2, styles: { ...footerStyle, halign: 'left' } },
            {
                content: `Net Diff : ${formatReadableAmount(detailNetDiffAbs.toFixed(2))}${detailNetDiffSuffix}`,
                styles: { ...footerStyle, halign: 'right', textColor: detailNetDiff >= 0 ? [0, 0, 180] : [180, 0, 0] }
            },
            {
                content: formatReadableAmount(totals.credit.toFixed(2)),
                styles: { ...footerStyle, halign: 'right', textColor: [180, 0, 0] }
            },
            {
                content: formatReadableAmount(totals.debit.toFixed(2)),
                styles: { ...footerStyle, halign: 'right', textColor: [0, 0, 180] }
            },
        ];

        generateReportPDF({
            title: 'GST-wise Trial Balance Detail',
            subtitle,
            columns: ['A/c Code', 'Account Name', 'City', 'Credit (-)', 'Debit (+)'],
            columnWidths: [20, 72, 35, 23, 22],
            rows: printRows,
            footerRow: styledFooterRow,
            numericCols: [3, 4],
            headerImgSrc: HeaderJK,
            footerImgSrc: FooterJK,
            orientation: 'portrait',
            onComplete: (url) => setPdfPreview(url),
        });
    };

    const handleExportXLSX = () => {
        const wsData = [
            [groupName ?? "Balance Report"],
            [`GST No: ${gstNo}`],
            [`${acName} | City: ${cityName} | Period upto: ${FormaDateBalanceSheet(toDate)}`],
            [],
            ["A/c Code", "Account Name", "City", "Credit (-)", "Debit (+)"],
            ...detailData.map(row => {
                const bal = getNum(row.balance);
                return [
                    row.ac_code,
                    row.Ac_Name_E,
                    row.cityname,
                    bal < 0 ? Math.abs(bal) : 0,
                    bal > 0 ? bal : 0,
                ];
            }),
            [],
            ["", "", "GRAND TOTAL", totals.credit, totals.debit],
        ];
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws["!cols"] = [{ wch: 12 }, { wch: 40 }, { wch: 20 }, { wch: 16 }, { wch: 16 }];
        XLSX.utils.book_append_sheet(wb, ws, "GSTDetail");
        XLSX.writeFile(wb, `GSTDetail_${gstNo}_${toDate}.xlsx`);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle
                sx={{
                    backgroundColor: "#5557df", color: "#fff", py: 1.2,
                    display: "flex", alignItems: "center", justifyContent: "space-between"
                }}
            >
                <span style={{ fontSize: "13px" }}>
                    <strong>GST No:</strong> {gstNo} &nbsp;|&nbsp;
                    <strong>Account:</strong> {acName} &nbsp;|&nbsp;
                    <strong>City:</strong> {cityName} &nbsp;|&nbsp;
                    <strong>Period upto:</strong> {FormaDateBalanceSheet(toDate)}
                </span>
                <IconButton onClick={onClose} size="small" sx={{ color: "#fff" }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 1 }}>
                {error && <div className="alert alert-danger py-1">{error}</div>}
                {pdfPreview && <PdfPreview pdfData={pdfPreview} label="trialBalanceGSTwise" />}
                {loading ? (
                    <div style={{ textAlign: "center", padding: "30px" }}>
                        <ScaleLoader color="#1a329b" height={30} width={4} />
                    </div>
                ) : (
                    <TableContainer component={Paper} style={{ maxHeight: "55vh" }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    {DETAIL_COLUMNS.map(col => (
                                        <TableCell
                                            key={col.key}
                                            align={col.numeric ? "right" : "left"}
                                            style={{ fontWeight: "bold", backgroundColor: "#5557df", color: "#fff", fontSize: "12px" }}
                                        >
                                            {col.label}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {detailData.map((row, idx) => {
                                    const bal = getNum(row.balance);
                                    return (
                                        <TableRow
                                            key={idx}
                                            hover
                                            style={{ backgroundColor: idx % 2 === 0 ? "#fff" : "#f5f8ff" }}
                                        >
                                            <TableCell style={{ fontSize: "12px" }}>{row.ac_code}</TableCell>
                                            <TableCell style={{ fontSize: "12px" }}>{row.Ac_Name_E}</TableCell>
                                            <TableCell style={{ fontSize: "12px" }}>{row.cityname}</TableCell>
                                            <TableCell align="right" style={{ color: "red", fontSize: "12px" }}>
                                                {bal < 0 ? formatReadableAmount(Math.abs(bal).toFixed(2)) : "0.00"}
                                            </TableCell>
                                            <TableCell align="right" style={{ color: "blue", fontSize: "12px" }}>
                                                {bal > 0 ? formatReadableAmount(bal.toFixed(2)) : "0.00"}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                            <TableFooter style={{ position: "sticky", bottom: 0, zIndex: 2 }}>
                                <TableRow style={{ backgroundColor: "#ffffcc" }}>
                                    <TableCell colSpan={2} style={{ fontWeight: "bold", fontSize: "12px" }}>
                                        GRAND TOTAL
                                    </TableCell>
                                    <TableCell align="right" style={{ fontWeight: "bold", color: detailNetDiffColor, fontSize: "12px" }}>
                                        Net Diff : {formatReadableAmount(detailNetDiffAbs.toFixed(2))}{detailNetDiffSuffix}
                                    </TableCell>
                                    <TableCell align="right" style={{ fontWeight: "bold", color: "red", fontSize: "12px" }}>
                                        {formatReadableAmount(totals.credit.toFixed(2))}
                                    </TableCell>
                                    <TableCell align="right" style={{ fontWeight: "bold", color: "blue", fontSize: "12px" }}>
                                        {formatReadableAmount(totals.debit.toFixed(2))}
                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 2, py: 1 }}>
                <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<PrintIcon />}
                    onClick={handleGeneratePDF}
                    disabled={loading || detailData.length === 0}
                >
                    Print PDF
                </Button>
                <Button
                    variant="outlined"
                    color="success"
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportXLSX}
                    disabled={loading || detailData.length === 0}
                >
                    Export XLSX
                </Button>
                <Button variant="contained" size="small" onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AgingAnalysisPANwiseReport = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    const toDate = searchParams.get("toDT");
    const Group_code = searchParams.get("Group_code");
    const Groupname = searchParams.get("Groupname");

    const companyCode = sessionStorage.getItem("Company_Code");
    const Company_Name = sessionStorage.getItem("Company_Name");
    const Company_GSTNO = sessionStorage.getItem("Company_GSTNO");

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [pdfPreview, setPdfPreview] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: "Ac_name", direction: "asc" });

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);

    const API_URL = `${apikey}/AgingAnalysis-Report-Debtorspanwise`;

    useEffect(() => {
        debugger
        const fetchReportData = async () => {
            setLoading(true);
            setError("");
            try {
                const response = await axios.get(API_URL, {
                    params: { toDT: toDate, Company_Code: companyCode, Group_code: Group_code },
                });
                setReportData(Array.isArray(response.data) ? response.data : []);
            } catch (err) {
                setError("Error fetching report data");
            } finally {
                setLoading(false);
            }
        };
        if (toDate && companyCode) fetchReportData();
    }, [toDate, companyCode, Group_code]);

    const requestSort = (key) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
        }));
    };

    const sortedData = useMemo(() => {
        let items = [...reportData];
        if (sortConfig.key) {
            items.sort((a, b) => {
                const va = (a[sortConfig.key] || "");
                const vb = (b[sortConfig.key] || "");
                if (va < vb) return sortConfig.direction === "asc" ? -1 : 1;
                if (va > vb) return sortConfig.direction === "asc" ? 1 : -1;
                return 0;
            });
        }
        return items;
    }, [reportData, sortConfig]);

    const totals = useMemo(() => {
        return reportData.reduce((acc, item) => {
            const bal = getNum(item.Balance);
            acc.credit += bal < 0 ? Math.abs(bal) : 0;
            acc.debit += bal > 0 ? bal : 0;
            return acc;
        }, { credit: 0, debit: 0 });
    }, [reportData]);

    const netDiff = totals.debit - totals.credit;
    const netDiffAbs = Math.abs(netDiff);
    const netDiffSuffix = netDiff >= 0 ? " Dr" : " Cr";
    const netDiffColor = netDiff >= 0 ? "blue" : "red";

    const reportSubtitle = `Balance Report: ${Groupname} (Upto ${FormaDateBalanceSheet(toDate)})`;

    const handleExportToExcel = () => {
        const headers = SCREEN_COLUMNS.map(c => c.label);
        const tableData = sortedData.map(item => {
            const bal = getNum(item.Balance);
            return [
                item.PAN,
                item.Ac_name,
                item.City_name,
                bal < 0 ? Math.abs(bal) : 0,
                bal > 0 ? bal : 0,
            ];
        });

        const worksheetData = [
            [Company_Name.toUpperCase()],
            [`GST No: ${Company_GSTNO}`],
            [reportSubtitle],
            [],
            headers,
            ...tableData,
            ["", "GRAND TOTAL", `${formatReadableAmount(netDiffAbs.toFixed(2))}${netDiffSuffix}`, totals.credit, totals.debit],
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(worksheetData);
        XLSX.utils.book_append_sheet(wb, ws, "AgingAnalysis");
        XLSX.writeFile(wb, `AgingAnalysis_${toDate}.xlsx`);
    };

    const handleGeneratePDF = () => {
        const footerStyle = { fillColor: [255, 249, 196], fontStyle: 'bold' };

        const printRows = sortedData.map(item => {
            const bal = getNum(item.Balance);
            return [
                item.Ac_code,
                item.Ac_name,
                item.City_name,
                formatReadableAmount(bal < 0 ? Math.abs(bal).toFixed(2) : "0.00"),
                formatReadableAmount(bal > 0 ? bal.toFixed(2) : "0.00"),
            ];
        });

        const styledFooterRow = [
            { content: "GRAND TOTAL", colSpan: 2, styles: { ...footerStyle, halign: 'left' } },
            {
                content: `Net Diff : ${formatReadableAmount(netDiffAbs.toFixed(2))}${netDiffSuffix}`,
                styles: { ...footerStyle, halign: 'right', textColor: netDiff >= 0 ? [0, 0, 180] : [180, 0, 0] }
            },
            {
                content: `${formatReadableAmount(totals.credit.toFixed(2))}`,
                styles: { ...footerStyle, halign: 'right', textColor: [180, 0, 0] }
            },
            {
                content: `${formatReadableAmount(totals.debit.toFixed(2))}`,
                styles: { ...footerStyle, halign: 'right', textColor: [0, 0, 180] }
            },
        ];

        generateReportPDF({
            title: 'Aging Analysis Report',
            subtitle: reportSubtitle,
            columns: PRINT_COLUMNS.map(c => c.label),
            columnWidths: [20, 72, 35, 23, 22, 22],
            rows: printRows,
            footerRow: styledFooterRow,
            numericCols: [3, 4, 5],
            headerImgSrc: HeaderJK,
            footerImgSrc: FooterJK,
            orientation: 'portrait',
            onComplete: (url) => setPdfPreview(url),
        });
    };

    const handleRowClick = (item) => {
        setSelectedRow(item);
        setModalOpen(true);
    };

    return (
        <div style={{ marginTop: "-50px", padding: "20px" }}>
            <Typography variant="h6" align="center" sx={{ fontWeight: 'bold', fontSize: '17px' }}>
                {Company_Name}
            </Typography>
            <Typography variant="h5" align="center" sx={{ fontWeight: 'bold', fontSize: '15px' }}>
                Trial Balance Report PAN wise
            </Typography>
            <Typography variant="body2" align="center" sx={{ fontSize: '12px', color: '#444', mb: 0.5 }}>
                PAN wise Trial Balance &nbsp;|&nbsp; <strong>{Groupname}</strong> &nbsp;|&nbsp; Period upto: <strong>{FormaDateBalanceSheet(toDate)}</strong>
            </Typography>

            <div className="my-2 d-flex justify-content-end no-print">
                <button className="btn btn-danger me-2" onClick={handleGeneratePDF}>Print PDF</button>
                <button className="btn btn-success" onClick={handleExportToExcel}>Export Excel</button>
            </div>

            {pdfPreview && <PdfPreview pdfData={pdfPreview} label="AgingAnalysisGSTwise" />}
            {error && <div className="alert alert-danger">{error}</div>}

            <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                backgroundColor: '#e8f4fd', border: '1px solid #90caf9',
                borderRadius: '6px', padding: '5px 12px', marginBottom: '6px',
                fontSize: '12px', color: '#1565c0'
            }}>
                <span style={{ fontSize: '16px' }}>👆</span>
                <span><strong>Tip:</strong> Click on any row to view GST account-wise detail with Credit / Debit.</span>
            </div>

            <TableContainer component={Paper} style={{ maxHeight: "600px", position: "relative" }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {SCREEN_COLUMNS.map((col) => (
                                <TableCell
                                    key={col.key}
                                    align={col.numeric ? "right" : "left"}
                                    style={{ fontWeight: "bold", backgroundColor: "#5557df", color: "#fff" }}
                                >
                                    <TableSortLabel
                                        active={sortConfig.key === col.key}
                                        direction={sortConfig.direction}
                                        onClick={() => requestSort(col.key)}
                                        sx={{
                                            '&.MuiTableSortLabel-root': { color: '#fff' },
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
                        {sortedData.map((item, index) => {
                            const bal = getNum(item.Balance);
                            return (
                                <Tooltip
                                    key={index}
                                    title={`Click to view account-wise details for GST: ${item.PAN}`}
                                    placement="top"
                                    arrow
                                >
                                    <TableRow
                                        hover
                                        onClick={() => handleRowClick(item)}
                                        style={{
                                            backgroundColor: index % 2 === 0 ? "#fff" : "#f5f8ff",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <TableCell style={{ color: '#1565c0', fontWeight: 'bold' }}>
                                            {item.PAN}
                                        </TableCell>
                                        <TableCell>{item.Ac_name}</TableCell>
                                        <TableCell>{item.City_name}</TableCell>
                                        <TableCell align="right" style={{ color: 'red' }}>
                                            {bal < 0 ? formatReadableAmount(Math.abs(bal).toFixed(2)) : "0.00"}
                                        </TableCell>
                                        <TableCell align="right" style={{ color: 'blue' }}>
                                            {bal > 0 ? formatReadableAmount(bal.toFixed(2)) : "0.00"}
                                        </TableCell>
                                    </TableRow>
                                </Tooltip>
                            );
                        })}
                    </TableBody>

                    <TableFooter style={{ position: "sticky", bottom: 0, zIndex: 2 }}>
                        <TableRow style={{ backgroundColor: "#ffffcc" }}>
                            <TableCell colSpan={2} style={{ fontWeight: "bold", fontSize: "13px" }}>
                                GRAND TOTAL
                            </TableCell>
                            <TableCell align="right" style={{ fontWeight: "bold", color: netDiffColor }}>
                                Net Diff : {formatReadableAmount(netDiffAbs.toFixed(2))}{netDiffSuffix}
                            </TableCell>
                            <TableCell align="right" style={{ fontWeight: "bold", color: 'red' }}>
                                {formatReadableAmount(totals.credit.toFixed(2))}
                            </TableCell>
                            <TableCell align="right" style={{ fontWeight: "bold", color: 'blue' }}>
                                {formatReadableAmount(totals.debit.toFixed(2))}
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </TableContainer>

            {loading && (
                <div style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 9999
                }}>
                    <ScaleLoader color="#1a329b" height={35} width={4} />
                </div>
            )}

            {selectedRow && (
                <DetailModal
                    key={selectedRow.Gst_No}
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    gstNo={selectedRow.Gst_No}
                    acName={selectedRow.Ac_name}
                    cityName={selectedRow.City_name}
                    groupCode={Group_code}
                    companyCode={companyCode}
                    toDate={toDate}
                    groupName={Groupname}
                />
            )}
        </div>
    );
};

export default AgingAnalysisPANwiseReport;

