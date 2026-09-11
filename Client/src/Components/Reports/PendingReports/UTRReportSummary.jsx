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
} from '@mui/material';
import { RingLoader } from 'react-spinners';
import PdfPreview from '../../../Common/PDFPreview'
import { formatReadableAmount } from '../../../Common/FormatFunctions/FormatAmount';
import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate"

const apikey = process.env.REACT_APP_API;

const UTRReportSummary = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const Company_Name = sessionStorage.getItem('Company_Name')
    const Company_GSTNO = sessionStorage.getItem('Company_GSTNO')

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [emailId, setEmailId] = useState('');
    const [pdfPreview, setPdfPreview] = useState(null);

    const API_URL = `${apikey}/pendingreport-UTRReport-Summary`;

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

    const prepareDataForExcel = (groupedData) => {
        const data = [];

        Object.entries(groupedData).forEach(([key, group]) => {
            group.items.forEach(item => {
                data.push({
                    "UTR": item.doc_no,
                    "Date": formatDate(item.doc_date),
                    "Bank Name": item.bankname,
                    "UTR Number": item.utr_no,
                    "UTR Amount": formatReadableAmount(item.amount),
                    "Narration": item.narration_header,
                    "Grade": item.utrgradename,
                    "Detail Amount": formatReadableAmount(item.detailamount),
                    "Used Amount": formatReadableAmount(item.usedamount),
                    "Balance": formatReadableAmount(item.balanceamount)
                });
            });

            data.push({
                "UTR": "Total",
                "Balance": formatReadableAmount(group.totalQty)
            });
        });

        return data;
    };


    const handleExportToExcel = () => {
        const dataForExcel = prepareDataForExcel(groupReportData(reportData));
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(dataForExcel);
        XLSX.utils.book_append_sheet(wb, ws, 'UTR Report');
        XLSX.writeFile(wb, 'UTRReportSummary.xlsx');
    };


    const handlePrint = () => {
        const groupedData = groupReportData(reportData);
        const win = window.open('', '', 'height=900,width=1200');

        const formatRow = (cells, isHeader = false) => {
            return `<tr>
                ${cells.map((cell, index) => {
                let align = 'left';
                if (index === 1) align = 'center';
                if ([4, 7, 8, 9].includes(index)) align = 'right';

                const style = isHeader
                    ? `background-color:#b4b4b4;font-weight:bold;text-align:${align};padding:4px;border:1px solid #ccc;`
                    : `text-align:${align};padding:4px;border:1px solid #ccc;`;

                return `<td style="${style}">${cell ?? ''}</td>`;
            }).join('')}
            </tr>`;
        };

        let content = `
            <html>
            <head>
                <title>UTR Report</title>
                <style>
                    body { font-family: Arial, sans-serif; font-size: 12px; color: #000; }
                    h2, h4 { text-align: center; margin: 4px 0; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { border: 1px solid #ccc; padding: 4px; font-size: 11px; }
                    .group-header { background-color: #dce6f1; font-weight: bold; text-align: center; padding: 6px; }
                    .total-row td { font-weight: bold; background-color: #f9f9f9; }
                </style>
            </head>
            <body>
                <h2>${Company_Name}</h2>
                <h4>UTR Report Summary - From ${formatDate(fromDate)} To ${formatDate(toDate)}</h4>
        `;

        Object.entries(groupedData).forEach(([key, group]) => {
            content += `<div class="group-header">UTR ID: ${key}</div>`;
            content += `<table>
                <thead>
                    ${formatRow([
                'UTR', 'Date', 'Bank Name', 'UTR Number', 'UTR Amount',
                'Narration', 'Grade', 'Detail Amount', 'Used Amount', 'Balance'
            ], true)}
                </thead>
                <tbody>`;

            group.items.forEach(item => {
                content += formatRow([
                    item.doc_no,
                    formatDate(item.doc_date),
                    item.bankname,
                    item.utr_no,
                    formatReadableAmount(item.amount),
                    item.narration_header,
                    item.utrgradename,
                    formatReadableAmount(item.detailamount),
                    formatReadableAmount(item.usedamount),
                    formatReadableAmount(item.balanceamount)
                ]);
            });

            content += `
                <tr class="total-row">
                    <td colspan="9"></td>
                    <td style="text-align:right;">${formatReadableAmount(group.totalQty)}</td>
                </tr>
                </tbody></table>`;
        });

        content += `</body></html>`;
        win.document.write(content);
        win.document.close();
        win.print();
    };


    const generatePDF = async () => {
        const doc = new jsPDF('l');
        doc.setFontSize(10);
        const pageWidth = doc.internal.pageSize.width;
        let currentY = 10;

        doc.text(Company_Name, pageWidth / 2, currentY, { align: 'center' });
        currentY += 6;
        const title = `UTR Report Summary - From ${formatDate(fromDate)} To ${formatDate(toDate)}`;
        doc.setFontSize(8);
        doc.text(title, pageWidth / 2, currentY, { align: 'center' });
        currentY += 4;

        const tableBody = [];

        Object.entries(groupReportData(reportData)).forEach(([key, group]) => {
            tableBody.push([{
                content: `UTR ID: ${key}`,
                colSpan: 10,
                styles: { fontStyle: 'bold', halign: 'center', textColor: [0, 0, 0], fillColor: [220, 230, 241] }
            }]);

            group.items.forEach(item => {
                tableBody.push([
                    item.doc_no,
                    formatDate(item.doc_date),
                    item.bankname,
                    item.utr_no,
                    formatReadableAmount(item.amount),
                    item.narration_header,
                    item.utrgradename,
                    formatReadableAmount(item.detailamount),
                    formatReadableAmount(item.usedamount),
                    formatReadableAmount(item.balanceamount)
                ]);
            });

            tableBody.push([
                { content: 'Total', colSpan: 9 },
                { content: formatReadableAmount(group.totalQty), styles: { halign: 'right', fontStyle: 'bold' } }
            ]);
        });

        doc.autoTable({
            head: [[
                'UTR', 'Date', 'Bank Name', 'UTR Number', 'UTR Amount',
                'Narration', 'Grade', 'Detail Amount', 'Used Amount', 'Balance'
            ]],
            body: tableBody,
            startY: currentY + 2,
            styles: {
                fontSize: 6,
                cellPadding: 0.6
            },
            columnStyles: {
                0: { halign: 'left' },
                1: { halign: 'center' },
                2: { halign: 'left' },
                3: { halign: 'left' },
                4: { halign: 'right' },
                5: { halign: 'left' },
                6: { halign: 'left' },
                7: { halign: 'right' },
                8: { halign: 'right' },
                9: { halign: 'right' },
            },
            theme: 'grid',
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
        const groupedData = {};
        data.forEach((item) => {
            const key = `${item.utrid}`;
            if (!groupedData[key]) {
                groupedData[key] = {
                    items: [],
                    totalQty: 0,
                };
            }
            groupedData[key].items.push(item);
            groupedData[key].totalQty += parseFloat(item.balanceamount) || 0;
        });
        return groupedData;
    };

    const groupedReportData = groupReportData(reportData);

    return (
        <div style={{marginTop:"-80px"}}>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold" }}>{Company_Name}</Typography>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", textDecoration: 'underline', fontWeight: "550" }}>GSTN : {Company_GSTNO}</Typography>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>UTR Report Summary</Typography>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px" }}>{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>

            <div className="mb-3 row align-items-center">
                <div className="col-auto">
                    <button className="btn btn-secondary me-2" onClick={handlePrint}>Print Report</button>
                    <button className="btn btn-success me-2" onClick={handleExportToExcel}>Export to Excel</button>
                    {pdfPreview && <PdfPreview pdfData={pdfPreview} apiData={reportData[0]} label={"UTRSummary"} />}
                    <button className="btn btn-success" onClick={generatePDF}>PDF Preview</button>
                </div>
            </div>

            <TableContainer component={Paper} style={{ maxHeight: '70vh', overflow: 'auto' }}>
                <Table stickyHeader size="small" aria-label="UTR Summary Table">
                    <TableHead>
                        <TableRow>
                            {[
                                "UTR", "Date", "Bank Name", "UTR Number", "UTR Amount",
                                "Narration", "Grade", "Detail Amount", "Used Amount", "Balance"
                            ].map((header, i) => (
                                <TableCell
                                    key={i}
                                    sx={{
                                        position: 'sticky',
                                        top: 0,
                                        backgroundColor: '#f5f5f5',
                                        fontWeight: 'bold',
                                        textAlign: i >= 4 ? 'right' : 'left',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {header}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {Object.entries(groupedReportData).map(([key, { items, totalQty }]) => (
                            <React.Fragment key={key}>
                                {items.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{item.doc_no}</TableCell>
                                        <TableCell>{formatDate(item.doc_date)}</TableCell>
                                        <TableCell>{item.bankname}</TableCell>
                                        <TableCell>{item.utr_no}</TableCell>
                                        <TableCell align="right">{formatReadableAmount(item.amount)}</TableCell>
                                        <TableCell align="right">{item.narration_header}</TableCell>
                                        <TableCell align="right">{item.utrgradename}</TableCell>
                                        <TableCell align="right">{formatReadableAmount(item.detailamount)}</TableCell>
                                        <TableCell align="right">{formatReadableAmount(item.usedamount)}</TableCell>
                                        <TableCell align="right">{formatReadableAmount(item.balanceamount)}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow>
                                    <TableCell colSpan={9}></TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'blue' }}>
                                        {formatReadableAmount(totalQty)}
                                    </TableCell>
                                </TableRow>
                            </React.Fragment>
                        ))}
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

export default UTRReportSummary;
