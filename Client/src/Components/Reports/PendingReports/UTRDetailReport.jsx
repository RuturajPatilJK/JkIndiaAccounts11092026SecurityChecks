import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper
} from "@mui/material";

import { RingLoader } from 'react-spinners';
import PdfPreview from '../../../Common/PDFPreview'
import { formatReadableAmount } from '../../../Common/FormatFunctions/FormatAmount';
import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate"

const apikey = process.env.REACT_APP_API;

const UTRDetailReport = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const Company_Name = sessionStorage.getItem("Company_Name")
    const Company_GSTNO = sessionStorage.getItem('Company_GSTNO')
    const searchParams = new URLSearchParams(location.search);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [emailId, setEmailId] = useState('');

    const [pdfPreview, setPdfPreview] = useState(null);

    const API_URL = `${apikey}/utr-detail-report`;

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
                        to_date: toDate,
                    },
                });
                setReportData(groupReportData(response.data));
            } catch (error) {
                console.error('Error fetching report:', error);
                setError('Error fetching report');
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, [API_URL, fromDate, toDate]);

    const handleExportToExcel = () => {
        const wb = XLSX.utils.book_new();

        const excelData = reportData.map(item => ({
            "Doc No": item.doc_no,
            "Date": formatDate(item.doc_date),
            "Bank Name": item.bankname,
            "Mill Name": item.millname,
            "UTR No": item.utr_no,
            "UTR Amount": formatReadableAmount(item.amount),
            "D.O.#": item.dono,
            "DO Date": item.dodate,
            "Used": formatReadableAmount(item.used),
            "Balance": formatReadableAmount(item.balance),
            "Net Balance": formatReadableAmount(item.netBalance),
            "Grade Info": `${item.Detail_Id} | ${item.utrgradename} | ${formatReadableAmount(item.detailamount)}`
        }));

        const ws = XLSX.utils.json_to_sheet(excelData);
        XLSX.utils.book_append_sheet(wb, ws, 'UTR Detail');
        XLSX.writeFile(wb, 'UTRDetailReport.xlsx');
    };

    const handlePrint = () => {
        const win = window.open('', '', 'height=900,width=1200');
        const formatRow = (cells, isHeader = false) => {
            return `<tr>
                ${cells.map((cell, index) => {
                const isAmount = index >= 5 && index !== 6 && index !== 7; // Amounts excluding DO# and DO Date
                const align = isAmount ? 'right' : 'left';
                const style = isHeader
                    ? `background-color:#d3d3d3;font-weight:bold;text-align:${align};padding:4px;border:1px solid #ccc;`
                    : `text-align:${align};padding:4px;border:1px solid #ccc;`;
                return `<td style="${style}">${cell ?? ''}</td>`;
            }).join('')}
            </tr>`;
        };

        let content = `
            <html><head><style>
            body { font-family: Arial; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ccc; padding: 6px; font-size: 11px; }
            .group-header { background-color: #f2f2f2; font-weight: bold; text-align: center; padding: 6px; }
            </style></head><body>
            <h2 style="text-align:center;">${Company_Name}</h2>
            <h4 style="text-align:center;">UTR Detail Report - From ${formatDate(fromDate)} To ${formatDate(toDate)}</h4>
            <table>
                <thead>${formatRow([
            'Doc No', 'Date', 'Bank Name', 'Mill Name', 'UTR No', 'UTR Amount',
            'D.O.#', 'DO Date', 'Used', 'Balance', 'Net Balance'
        ], true)}</thead>
                <tbody>`;

        reportData.forEach(item => {
            content += formatRow([
                item.doc_no,
                formatDate(item.doc_date),
                item.bankname,
                item.millname,
                item.utr_no,
                formatReadableAmount(item.amount),
                item.dono,
                item.dodate,
                formatReadableAmount(item.used),
                formatReadableAmount(item.balance),
                `<span style="color:red;font-weight:bold;">${formatReadableAmount(item.netBalance)}</span>`
            ]);

            content += `<tr><td colspan="11" style="padding:6px;color:#555;">
                <strong>${item.Detail_Id}</strong> | ${item.utrgradename} | ${formatReadableAmount(item.detailamount)}
            </td></tr><tr style="height:5px;background-color:#e9ecef;"><td colspan="11"></td></tr>`;
        });

        content += `</tbody></table></body></html>`;
        win.document.write(content);
        win.document.close();
        win.print();
    };

    const generatePDF = async () => {
        const doc = new jsPDF('l');
        const currentY = 10;

        doc.setFontSize(10);
        const pageWidth = doc.internal.pageSize.width;
        doc.text(Company_Name, pageWidth / 2, currentY, { align: 'center' });
        doc.setFontSize(8);
        doc.text(`UTR Detail Report - From ${formatDate(fromDate)} To ${formatDate(toDate)}`, pageWidth / 2, currentY + 5, { align: 'center' });

        const tableBody = [];

        reportData.forEach((item) => {
            tableBody.push([
                item.doc_no,
                formatDate(item.doc_date),
                item.bankname,
                item.millname,
                item.utr_no,
                formatReadableAmount(item.amount),
                item.dono,
                item.dodate,
                formatReadableAmount(item.used),
                formatReadableAmount(item.balance),
                formatReadableAmount(item.netBalance)
            ]);

            tableBody.push([
                {
                    content: `${item.Detail_Id} | ${item.utrgradename} | ${formatReadableAmount(item.detailamount)}`,
                    colSpan: 11,
                    styles: {
                        fontStyle: 'italic',
                        fontSize: 7,
                        textColor: [100, 100, 100],
                        halign: 'left'
                    }
                }
            ]);
        });

        doc.autoTable({
            head: [[
                'Doc No', 'Date', 'Bank Name', 'Mill Name', 'UTR No',
                'UTR Amount', 'D.O.#', 'DO Date', 'Used', 'Balance', 'Net Balance'
            ]],
            body: tableBody,
            startY: currentY + 10,
            theme: 'grid',
            styles: {
                fontSize: 6.5,
                cellPadding: 0.8,
            },
            columnStyles: {
                0: { halign: 'center' },
                1: { halign: 'center' },
                2: { halign: 'left' },
                3: { halign: 'left' },
                4: { halign: 'left' },
                5: { halign: 'right' },
                6: { halign: 'center' },
                7: { halign: 'center' },
                8: { halign: 'right' },
                9: { halign: 'right' },
                10: { halign: 'right' }
            },
            headStyles: {
                fillColor: [200, 200, 200],
                textColor: [0, 0, 0],
                fontStyle: 'bold'
            }
        });

        const pdfBlob = doc.output("blob");
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPdfPreview(pdfUrl);
    };


    const groupReportData = (data) => {
        const detailGrouping = {};
        const docGrouping = {};

        data.forEach(item => {
            const detailKey = `${item.utr_detail_id}`;
            if (!detailGrouping[detailKey]) {
                detailGrouping[detailKey] = { totalBankAmountDetail: 0 };
            }
            detailGrouping[detailKey].totalBankAmountDetail += parseFloat(item.bankamount || 0);
        });

        data.forEach(item => {
            const docKey = `${item.doc_no}`;
            if (!docGrouping[docKey]) {
                docGrouping[docKey] = { totalBankAmountDoc: 0 };
            }
            docGrouping[docKey].totalBankAmountDoc += parseFloat(item.bankamount || 0);
        });

        return data.map(item => {
            const detailKey = `${item.utr_detail_id}`;
            const docKey = `${item.doc_no}`;
            const used = docGrouping[docKey].totalBankAmountDoc;
            const balance = item.detailamount - detailGrouping[detailKey].totalBankAmountDetail;
            const netBalance = item.amount - docGrouping[docKey].totalBankAmountDoc;

            return {
                ...item,
                used,
                balance,
                netBalance
            };
        });
    };

    return (
        <div className="container-fluid mt-3">
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold" }}>{Company_Name}</Typography>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", textDecoration: 'underline', fontWeight: "550" }}>GSTN : {Company_GSTNO}</Typography>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}> UTR Detail Report</Typography>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px" }}>{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>

            <div className="row align-items-center mb-3">
                <div className="col-auto">
                    <button className="btn btn-secondary me-2" onClick={handlePrint}>Print</button>
                    <button className="btn btn-success me-2" onClick={handleExportToExcel}>Export to Excel</button>
                    {pdfPreview && <PdfPreview pdfData={pdfPreview} apiData={reportData[0]} label="UTRDetailReport" />}
                    <button className="btn btn-success" onClick={generatePDF}>PDF Preview</button>
                </div>
            </div>

            <TableContainer component={Paper} sx={{ maxHeight: '80vh', overflow: 'auto' }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {[
                                "Doc No", "Date", "Bank Name", "Mill Name", "UTR No", "UTR Amount", "D.O.#",
                                "DO Date", "Used", "Balance", "Net Balance"
                            ].map((col, idx) => (
                                <TableCell
                                    key={idx}
                                    sx={{
                                        backgroundColor: "#f0f0f0",
                                        fontWeight: "bold",
                                        position: "sticky",
                                        top: 0,
                                        zIndex: 1,
                                        whiteSpace: "nowrap"
                                    }}
                                >
                                    {col}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {reportData.map((item, index) => (
                            <React.Fragment key={index}>

                                <TableRow sx={{ backgroundColor: "#f7f7f7" }}>
                                    <TableCell>{item.doc_no}</TableCell>
                                    <TableCell>{formatDate(item.doc_date)}</TableCell>
                                    <TableCell>{item.bankname}</TableCell>
                                    <TableCell>{item.millname}</TableCell>
                                    <TableCell>{item.utr_no}</TableCell>
                                    <TableCell align="right">
                                        {formatReadableAmount(item.amount + item.narration_header)}
                                    </TableCell>
                                    <TableCell>{item.dono}</TableCell>
                                    <TableCell>{item.dodate}</TableCell>
                                    <TableCell>{item.used}</TableCell>
                                    <TableCell align="right">
                                        {formatReadableAmount(parseFloat(item.balance).toFixed(2))}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: "bold", color: "blue" }}>
                                        {formatReadableAmount(item.netBalance)}
                                    </TableCell>
                                </TableRow>

                                <TableRow colSpan={6} sx={{ backgroundColor: "#f7f7f7" }}>
                                    <TableCell colSpan={11} sx={{ pl: 6, py: 1 }}>
                                        <strong>{item.Detail_Id}</strong> {' '}
                                        {item.utrgradename} {' '}
                                        {formatReadableAmount(item?.detailamount)}
                                    </TableCell>
                                </TableRow>
                                <TableRow sx={{ height: 5, backgroundColor: "#e9ecef" }}>
                                    <TableCell colSpan={11}></TableCell>
                                </TableRow>
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {loading && (
                <div
                    style={{
                        position: "fixed",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        zIndex: 9999,
                    }}
                >
                    <RingLoader size={80} />
                </div>
            )}
            {error && <div className="alert alert-danger">{error}</div>}
        </div>
    );

};

export default UTRDetailReport;
