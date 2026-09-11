import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useNavigate, useLocation } from 'react-router-dom';
import PdfPreview from '../../../Common/PDFPreview'
import { formatReadableAmount } from '../../../Common/FormatFunctions/FormatAmount';
import { RingLoader } from 'react-spinners';
import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate"
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


const apikey = process.env.REACT_APP_API;

const SaudaSummaryReport = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const companyCode = sessionStorage.getItem("Company_Code");
    const Year_Code = sessionStorage.getItem("Year_Code");
    const Company_Name = sessionStorage.getItem('Company_Name')
    const Company_GSTNO = sessionStorage.getItem('Company_GSTNO')

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [emailId, setEmailId] = useState('');

    const [pdfPreview, setPdfPreview] = useState(null);

    const API_URL = `${apikey}/pendingreport-SaudaSummary?Company_Code=${companyCode}&Year_Code=${Year_Code}`;

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

    const handleExportToExcel = () => {
        const groupedData = groupReportData(reportData);
        let excelData = [];

        Object.entries(groupedData).forEach(([key, group]) => {
            group.items.forEach(item => {
                excelData.push({
                    "Tender No": item.Tender_No,
                    "Mill Name": item.Short_Name,
                    "Date": formatDate(item.Tender_Date),
                    "Payment Date": formatDate(item.payment_Date),
                    "Sauda Date": formatDate(item.Sauda_Date),
                    "Qty": Number(item.Buyer_Quantal),
                    "Sale Rate": Number(parseFloat(item.Sale_Rate) + parseFloat(item.Commission_Rate)),
                    "Amount": Number(item.AMT),
                    "Adjusted Amt": Number(item.adjusted),
                    "Receive": Number(item.received),
                    "Balance": Number(item.BALANCE),
                });


            });

            excelData.push({
                "Tender No": 'Total',
                "Balance": Number(group.totalQty),
            });

        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);

        // Manually right-align the amount-related columns
        const rightAlignCols = ["F", "G", "H", "I", "J", "K"]; // Corresponding to Qty to Balance

        rightAlignCols.forEach(col => {
            for (let row = 2; row <= excelData.length + 1; row++) {
                const cellRef = `${col}${row}`;
                if (!ws[cellRef]) continue;
                ws[cellRef].s = {
                    alignment: { horizontal: "right" }
                };
            }
        });

        // Enable styling
        wb.Sheets['Sauda Summary'] = ws;
        XLSX.utils.book_append_sheet(wb, ws, 'Sauda Summary');

        // Export with styling
        XLSX.writeFile(wb, 'SaudaSummary.xlsx', { cellStyles: true });
    };


    const handlePrint = () => {
        const groupedData = groupReportData(reportData);

        const formatRow = (cells, isHeader = false) => {
            return `<tr>
                ${cells.map((cell, index) => {
                let align = ['Qty', 'Sale Rate', 'Amount', 'Adjusted Amt', 'Recieve', 'Balance'].includes(cell) || index >= 5 ? 'right' : 'left';
                const style = isHeader
                    ? `background-color:#d3d3d3;font-weight:bold;text-align:${align};padding:4px;border:1px solid #ccc;`
                    : `text-align:${align};padding:4px;border:1px solid #ccc;`;
                return `<td style="${style}">${cell ?? ''}</td>`;
            }).join('')}
            </tr>`;
        };

        let content = `
            <html>
            <head>
                <style>
                    body { font-family: Arial; font-size: 12px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { border: 1px solid #ccc; padding: 6px; font-size: 11px; }
                    .group-header { background-color: #f2f2f2; font-weight: bold; text-align: center; padding: 6px; }
                </style>
            </head>
            <body>
                <h2 style="text-align:center;">${Company_Name}</h2>
                <h4 style="text-align:center;">Sauda Summary Report - From ${formatDate(fromDate)} To ${formatDate(toDate)}</h4>
        `;

        Object.entries(groupedData).forEach(([key, group]) => {
            const [mc, millName] = key.split('-');
            content += `<div class="group-header">${mc} - ${millName}</div>`;
            content += `<table><thead>${formatRow([
                'Tender No', 'Mill Name', 'Date', 'Payment Date', 'Sauda Date',
                'Qty', 'Sale Rate', 'Amount', 'Adjusted Amt', 'Recieve', 'Balance'
            ], true)}</thead><tbody>`;

            group.items.forEach(item => {
                content += formatRow([
                    item.Tender_No,
                    item.Short_Name,
                    formatDate(item.Tender_Date),
                    formatDate(item.payment_Date),
                    formatDate(item.Sauda_Date),
                    formatReadableAmount(item.Buyer_Quantal),
                    formatReadableAmount(item.Sale_Rate + item.Commission_Rate),
                    formatReadableAmount(item.AMT),
                    formatReadableAmount(item.adjusted),
                    formatReadableAmount(item.received),
                    formatReadableAmount(item.BALANCE)
                ]);
            });

            content += `
                <tr>
                    <td colspan="9" style="text-align:right;font-weight:bold;">Total</td>
                    <td colspan="2" style="text-align:right;font-weight:bold;color:red;">${formatReadableAmount(group.totalQty)}</td>
                </tr>
            </tbody></table>`;
        });

        content += `</body></html>`;

        const win = window.open('', '', 'height=900,width=1200');
        win.document.write(content);
        win.document.close();
        win.print();
    };



    const generatePDF = async () => {
        const doc = new jsPDF('l');
        const groupedData = groupReportData(reportData);
        let currentY = 10;

        doc.setFontSize(10);
        const pageWidth = doc.internal.pageSize.width;
        doc.text(`${Company_Name}`, pageWidth / 2, currentY, { align: "center" });
        currentY += 5;
        doc.setFontSize(8);
        doc.text(`Sauda Summary Report - From ${formatDate(fromDate)} To ${formatDate(toDate)}`, pageWidth / 2, currentY, { align: "center" });

        const tableBody = [];

        Object.entries(groupedData).forEach(([key, group]) => {
            const [mc, millName] = key.split('-');

            tableBody.push([{
                content: `${mc} - ${millName}`,
                colSpan: 11,
                styles: {
                    halign: 'center',
                    fontStyle: 'bold',
                    textColor: [0, 0, 0],
                    fillColor: [220, 230, 241],
                    fontSize: 7
                }
            }]);

            group.items.forEach(item => {
                tableBody.push([
                    item.Tender_No,
                    item.Short_Name,
                    formatDate(item.Tender_Date),
                    formatDate(item.payment_Date),
                    formatDate(item.Sauda_Date),
                    formatReadableAmount(item.Buyer_Quantal),
                    formatReadableAmount(item.Sale_Rate + item.Commission_Rate),
                    formatReadableAmount(item.AMT),
                    formatReadableAmount(item.adjusted),
                    formatReadableAmount(item.received),
                    formatReadableAmount(item.BALANCE)
                ]);
            });

            tableBody.push([
                { content: '', colSpan: 9 },
                { content: formatReadableAmount(group.totalQty), styles: { fontStyle: 'bold', halign: 'right' } },
                ''
            ]);
        });

        doc.autoTable({
            head: [[
                'Tender No', 'Mill Name', 'Date', 'Payment Date', 'Sauda Date',
                'Qty', 'Sale Rate', 'Amount', 'Adjusted Amt', 'Recieve', 'Balance'
            ]],
            body: tableBody,
            startY: currentY + 2,
            theme: 'grid',
            styles: {
                fontSize: 6,
                cellPadding: 0.6,
                overflow: 'visible',
            },
            columnStyles: {
                0: { halign: 'center' },
                1: { halign: 'left' },
                2: { halign: 'center' },
                3: { halign: 'center' },
                4: { halign: 'center' },
                5: { halign: 'right' },
                6: { halign: 'right' },
                7: { halign: 'right' },
                8: { halign: 'right' },
                9: { halign: 'right' },
                10: { halign: 'right' }
            },
            headStyles: {
                fillColor: [180, 180, 180],
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
            const key = `${item.Buyer}-${item.buyername}`;
            if (!groupedData[key]) {
                groupedData[key] = {
                    items: [],
                    totalQty: 0,
                };
            }
            groupedData[key].items.push(item);
            groupedData[key].totalQty += parseFloat(item.BALANCE) || 0;
        });
        return groupedData;
    };

    const groupedReportData = groupReportData(reportData);

    return (
        <div style={{marginTop:"-80px"}}>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold" }}>{Company_Name}</Typography>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", textDecoration: 'underline', fontWeight: "550" }}>GSTN : {Company_GSTNO}</Typography>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>Sauda Summary</Typography>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px" }}>{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>

            <div className="mb-3 row align-items-center">
                <div className="col-auto">
                    <button className="btn btn-secondary me-2" onClick={handlePrint}>Print</button>
                    <button className="btn btn-success me-2" onClick={handleExportToExcel}>Export to Excel</button>
                    {pdfPreview && <PdfPreview pdfData={pdfPreview} apiData={reportData[0]} label={"SaudaSummary"} />}
                    <button className="btn btn-success" onClick={generatePDF}>PDF Preview</button>
                </div>
            </div>

            <TableContainer component={Paper} sx={{ maxHeight: '80vh', overflow: 'auto' }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {[
                                'Tender No', 'Mill Name', 'Date', 'Payment Date', 'Sauda Date',
                                'Quantity', 'Sale Rate', 'Amount', 'Adjusted Amount', 'Recieve', 'Balance'
                            ].map((header, idx) => (
                                <TableCell
                                    key={idx}
                                    sx={{
                                        backgroundColor: '#f0f0f0',
                                        fontWeight: 'bold',
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 1,
                                        whiteSpace: 'nowrap',
                                        textAlign: idx >= 5 ? 'right' : 'left'
                                    }}
                                >
                                    {header}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {Object.entries(groupedReportData).map(([key, { items, totalQty }]) => {
                            const [mc, millName] = key.split('-');
                            return (
                                <React.Fragment key={key}>
                                    <TableRow>
                                        <TableCell colSpan={11} sx={{ backgroundColor: '#e6f0ff', fontWeight: 'bold', color: 'blue' }}>
                                            {mc} - {millName}
                                        </TableCell>
                                    </TableRow>
                                    {items.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{item.Tender_No}</TableCell>
                                            <TableCell>{item.Short_Name}</TableCell>
                                            <TableCell>{formatDate(item.Tender_Date)}</TableCell>
                                            <TableCell>{formatDate(item.payment_Date)}</TableCell>
                                            <TableCell>{formatDate(item.Sauda_Date)}</TableCell>
                                            <TableCell align="right">{formatReadableAmount(item.Buyer_Quantal)}</TableCell>
                                            <TableCell align="right">{formatReadableAmount(parseFloat(item.Sale_Rate + item.Commission_Rate))}</TableCell>
                                            <TableCell align="right">{formatReadableAmount(item.AMT)}</TableCell>
                                            <TableCell align="right">{formatReadableAmount(item.adjusted)}</TableCell>
                                            <TableCell align="right">{formatReadableAmount(item.received)}</TableCell>
                                            <TableCell align="right">{formatReadableAmount(item.BALANCE)}</TableCell>
                                        </TableRow>
                                    ))}

                                    <TableRow>
                                        <TableCell colSpan={10} />
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                            {formatReadableAmount(totalQty)}
                                        </TableCell>
                                        <TableCell />
                                    </TableRow>
                                </React.Fragment>
                            );
                        })}
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

export default SaudaSummaryReport;
