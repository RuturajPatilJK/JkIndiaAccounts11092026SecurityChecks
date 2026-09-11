import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Paper } from '@mui/material';
import { RingLoader } from 'react-spinners';
import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate"

const apikey = process.env.REACT_APP_API;

const SaleTCSRegister = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const Company_Name = sessionStorage.getItem('Company_Name')
    const Company_GSTNO = sessionStorage.getItem('Company_GSTNO')
    // const { fromDate, toDate } = location.state || { fromDate: '', toDate: '' ,companyCode : '',Year_Code : ''};
    const searchParams = new URLSearchParams(location.search);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const company_Code = searchParams.get('companyCode');
    const YearCode = searchParams.get('yearCode');
    const acCode = searchParams.get('acCode');

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [grandTotals, setGrandTotals] = useState({
        TotalTaxable_Amt: 0,
        CGSTAmt: 0,
        SGSTAmt: 0,
        IGSTAmt: 0,
        BillamountAmt: 0,
        TCSAmt: 0
    });

    const API_URL = `${apikey}/SaleTCS_Register`;

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear());
        return `${day}/${month}/${year}`;
    };

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
            } catch (error) {
                console.error('Error fetching report:', error);
                setError('Error fetching report');
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, [API_URL]);

    const handleExportToExcel = () => {
        const wb = XLSX.utils.book_new();
        const headers = [
            "PAN", "Party Name", "Taxable Amount", "CGST", "SGST", "IGST", "Bill Amount", "TDS Amount"
        ];

        const formattedData = reportData.map(item => ({
            PAN: item.Pan,
            "Party Name": item.Name_Of_Party,
            "Taxable Amount": Number(item.Taxable_Amt) || 0,
            "CGST": Number(item.CGST) || 0,
            "SGST": Number(item.SGST) || 0,
            "IGST": Number(item.IGST) || 0,
            "Bill Amount": Number(item.Bill_Amount) || 0,
            "TCS Amount": Number(item.TCS) || 0
        }));

        const ws = XLSX.utils.json_to_sheet(formattedData, { header: headers });

        const wsCols = [
            { wch: 15 },
            { wch: 30 },
            { wch: 15, alignment: { horizontal: "right" } },
            { wch: 10, alignment: { horizontal: "right" } },
            { wch: 10, alignment: { horizontal: "right" } },
            { wch: 10, alignment: { horizontal: "right" } },
            { wch: 15, alignment: { horizontal: "right" } },
            { wch: 12, alignment: { horizontal: "right" } }
        ];
        ws["!cols"] = wsCols;

        XLSX.utils.book_append_sheet(wb, ws, 'SaleTCSRegister');
        XLSX.writeFile(wb, 'SaleTCSRegister.xlsx');
    };

    const handlePrint = async () => {
        try {
            const companyName = Company_Name;
            const fromDate = searchParams.get('fromDate');
            const toDate = searchParams.get('toDate');

            if (!reportData || reportData.length === 0) {
                console.error("Error: reportData is empty or undefined");
                return;
            }

            const pdfBlob = await generatePDF(companyName, fromDate, toDate, reportData);

            if (!pdfBlob || !(pdfBlob instanceof Blob)) {
                console.error("Error: Invalid PDF Blob", pdfBlob);
                return;
            }
            const pdfUrl = URL.createObjectURL(pdfBlob);
            const win = window.open(pdfUrl);

            if (!win) {
                console.error("Popup blocked! Allow popups to print the PDF.");
                return;
            }
            setTimeout(() => win.print(), 1000);
        } catch (error) {
            console.error("Error in handlePrint:", error);
        }
    };

    const generatePDF = async (companyName, fromDate, toDate, reportData) => {
        if (!Array.isArray(reportData) || reportData.length === 0) {
            console.error("Error: reportData is invalid", reportData);
            return;
        }
        const doc = new jsPDF();
        const groupedData = groupReportData(reportData) || {};
        const tableData = [];
        doc.setFontSize(16);
        doc.text(companyName, doc.internal.pageSize.width / 2, 10, { align: 'center' });

        doc.setFontSize(10);
        doc.text(`Sale TCS Register From: ${formatDate(fromDate)} To ${formatDate(toDate)}`, 10, 20);

        tableData.push(['SBill No', 'Customer Name', 'Taxable Amt', 'CGST Amt', 'SGST Amt', 'IGST Amt', 'Bill Amount', 'TCS']);

        Object.entries(groupedData).forEach(([key, { TotalTaxable_Amt, CGSTAmt, SGSTAmt, IGSTAmt, BillamountAmt, TCSAmt }]) => {
            if (!TotalTaxable_Amt) return;

            const parts = key.split('-');
            const pan = parts[parts.length - 1];
            const PartyName = parts.slice(1, -1).join('-');

            tableData.push([
                pan,
                PartyName,
                formatReadableAmount(TotalTaxable_Amt.toFixed(2)),
                formatReadableAmount(CGSTAmt.toFixed(2)),
                formatReadableAmount(SGSTAmt.toFixed(2)),
                formatReadableAmount(IGSTAmt.toFixed(2)),
                formatReadableAmount(BillamountAmt.toFixed(2)),
                formatReadableAmount(TCSAmt.toFixed(2))
            ]);
        });

        const totalRow = [
            '', 'Total',

            formatReadableAmount(grandTotals.TotalTaxable_Amt),
            formatReadableAmount(grandTotals.CGSTAmt),
            formatReadableAmount(grandTotals.SGSTAmt),
            formatReadableAmount(grandTotals.IGSTAmt),
            formatReadableAmount(grandTotals.BillamountAmt),
            formatReadableAmount(grandTotals.TCSAmt)
        ];

        tableData.push(totalRow);

        doc.autoTable({
            headStyles: {
                fillColor: [255, 0, 0],
                fontStyle: 'bold',
            },
            body: tableData,
            margin: { top: 25 },
            styles: {
                fontSize: 5,
                cellPadding: 1,
                halign: 'center',
            },
            columnStyles: {
                1: { halign: 'left' },

                2: { halign: 'right' },
                3: { halign: 'right' },
                4: { halign: 'right' },
                5: { halign: 'right' },
                6: { halign: 'right' },
                7: { halign: 'right' },

            },
            theme: 'grid',
        });
        return doc.output('blob');
    };

    const groupReportData = (data) => {
        const groupedData = {};
        data.forEach((item) => {
            const key = `${item.Party_Code}-${item.Name_Of_Party}-${item.Pan}`;
            if (!groupedData[key]) {
                groupedData[key] = {
                    items: [],
                    TotalTaxable_Amt: 0,
                    CGSTAmt: 0,
                    SGSTAmt: 0,
                    IGSTAmt: 0,
                    BillamountAmt: 0,
                    TCSAmt: 0,
                };
            }
            groupedData[key].items.push(item);
            groupedData[key].TotalTaxable_Amt += parseFloat(item.Taxable_Amt) || 0;
            groupedData[key].CGSTAmt += parseFloat(item.CGST) || 0;
            groupedData[key].SGSTAmt += parseFloat(item.SGST) || 0;
            groupedData[key].IGSTAmt += parseFloat(item.IGST) || 0;
            groupedData[key].BillamountAmt += parseFloat(item.Bill_Amount) || 0;
            groupedData[key].TCSAmt += parseFloat(item.TCS) || 0;
        });
        return groupedData;
    };

    const groupedReportData = groupReportData(reportData);

    useEffect(() => {
        const totals = Object.values(groupedReportData).reduce(
            (totals, { TotalTaxable_Amt, CGSTAmt, SGSTAmt, IGSTAmt, BillamountAmt, TCSAmt }) => {
                totals.TotalTaxable_Amt += TotalTaxable_Amt || 0;
                totals.CGSTAmt += CGSTAmt || 0;
                totals.SGSTAmt += SGSTAmt || 0;
                totals.IGSTAmt += IGSTAmt || 0;
                totals.BillamountAmt += BillamountAmt || 0;
                totals.TCSAmt += TCSAmt || 0;
                return totals;
            },
            { TotalTaxable_Amt: 0, CGSTAmt: 0, SGSTAmt: 0, IGSTAmt: 0, BillamountAmt: 0, TCSAmt: 0 }
        );
        setGrandTotals(totals);
    }, [groupedReportData]);
    return (
        <div style={{marginTop:"-80px"}}>

            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold" }}>{Company_Name}</Typography>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", textDecoration: 'underline', fontWeight: "550" }}>GSTN : {Company_GSTNO}</Typography>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>Sale TCS Summary</Typography>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px" }}>{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>

            <div className="mb-3 row align-items-center">
                <div className="col-auto">
                    <button className="btn btn-secondary me-2" onClick={handlePrint}>
                        Print
                    </button>
                    <button className="btn btn-success" onClick={handleExportToExcel}>
                        Export to Excel
                    </button>
                </div>
            </div>

            <TableContainer component={Paper} sx={{ marginBottom: '60px' }} id="reportTable">
                <Table sx={{ minWidth: 650 }} aria-label="sales tcs register">
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell style={{ textAlign: "center", fontWeight: "bold" }}>SBill No</TableCell>
                            <TableCell style={{ textAlign: "left", fontWeight: "bold" }}>Customer Name</TableCell>
                            <TableCell style={{ textAlign: "right", fontWeight: "bold" }}>Taxable Amt</TableCell>
                            <TableCell style={{ textAlign: "right", fontWeight: "bold" }}>CGST Amt</TableCell>
                            <TableCell style={{ textAlign: "right", fontWeight: "bold" }}>SGST Amt</TableCell>
                            <TableCell style={{ textAlign: "right", fontWeight: "bold" }}>IGST Amt</TableCell>
                            <TableCell style={{ textAlign: "right", fontWeight: "bold" }}>Bill Amount</TableCell>
                            <TableCell style={{ textAlign: "right", fontWeight: "bold" }}>TCS</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Object.entries(groupedReportData).map(([key, { items, TotalTaxable_Amt, CGSTAmt, SGSTAmt, IGSTAmt, BillamountAmt, TCSAmt }]) => {
                            const parts = key.split('-');
                            const pan = parts[parts.length - 1];
                            const PartyName = parts.slice(1, -1).join('-');

                            return (
                                <React.Fragment key={key}>
                                    <TableRow>
                                        <TableCell className="fw-bold">{pan}</TableCell>
                                        <TableCell className="fw-bold">{PartyName}</TableCell>
                                        <TableCell align="right" className="fw-bold">{formatReadableAmount(TotalTaxable_Amt.toFixed(2))}</TableCell>
                                        <TableCell align="right" className="fw-bold">{formatReadableAmount(CGSTAmt.toFixed(2))}</TableCell>
                                        <TableCell align="right" className="fw-bold">{formatReadableAmount(SGSTAmt.toFixed(2))}</TableCell>
                                        <TableCell align="right" className="fw-bold">{formatReadableAmount(IGSTAmt.toFixed(2))}</TableCell>
                                        <TableCell align="right" className="fw-bold">{formatReadableAmount(BillamountAmt.toFixed(2))}</TableCell>
                                        <TableCell align="right" className="fw-bold">{formatReadableAmount(TCSAmt.toFixed(2))}</TableCell>
                                    </TableRow>
                                </React.Fragment>
                            );
                        })}

                        <TableRow sx={{ backgroundColor: '#e0e0e0' }}>
                            <TableCell colSpan={2} sx={{ fontWeight: 'bold', backgroundColor: "yellow" }}>Grand Total</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'right', backgroundColor: "yellow" }}>{formatReadableAmount(grandTotals.TotalTaxable_Amt.toFixed(2))}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'right', backgroundColor: "yellow" }}>{formatReadableAmount(grandTotals.CGSTAmt.toFixed(2))}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'right', backgroundColor: "yellow" }}>{formatReadableAmount(grandTotals.SGSTAmt.toFixed(2))}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'right', backgroundColor: "yellow" }}>{formatReadableAmount(grandTotals.IGSTAmt.toFixed(2))}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'right', backgroundColor: "yellow" }}>{formatReadableAmount(grandTotals.BillamountAmt.toFixed(2))}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', textAlign: 'right', backgroundColor: "yellow" }}>{formatReadableAmount(grandTotals.TCSAmt.toFixed(2))}</TableCell>
                        </TableRow>
                    </TableBody>
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
                    <RingLoader size={80} />
                </div>
            )}
            {error && <div className="alert alert-danger">{error}</div>}
        </div>
    );
};

export default SaleTCSRegister;
