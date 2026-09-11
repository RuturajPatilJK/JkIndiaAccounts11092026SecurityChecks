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
    Paper,
} from "@mui/material";
import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate"
import PdfPreview from '../../../Common/PDFPreview'
import { formatReadableAmount } from '../../../Common/FormatFunctions/FormatAmount';
import { RingLoader } from 'react-spinners';

const apikey = process.env.REACT_APP_API;

const NormalSaudaSummary = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const acCode = searchParams.get('acCode')
    const companyCode = sessionStorage.getItem("Company_Code");
    const Year_Code = sessionStorage.getItem("Year_Code");
    const Company_Name = sessionStorage.getItem('Company_Name')
    const Company_GSTNO = sessionStorage.getItem('Company_GSTNO')

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [emailId, setEmailId] = useState('');
    const [popconfirmvalue, setPopconfirmvalue] = useState('Y');

    const [pdfPreview, setPdfPreview] = useState(null);

    const API_URL = `${apikey}/get-normal-sauda`;

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    };

    useEffect(() => {
        // Prompt user if acCode is present
        if (acCode) {
            const result = window.confirm("Do you want to display Buyer Name instead of Cross Name?");
            setPopconfirmvalue(result ? 'Y' : 'N');
        }
    }, [acCode]);

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await axios.get(API_URL, {
                    params: {
                        Company_Code: companyCode,
                        Year_Code: Year_Code,
                        popconfirmvalue: popconfirmvalue,
                        from_date: fromDate,
                        to_date: toDate,
                        accode: acCode
                    },
                });

                const resData = response.data;
                const finalData = Array.isArray(resData) ? resData : resData.data || [];
                setReportData(finalData);
            } catch (error) {
                console.error('Error fetching report:', error);
                setError('Error fetching report');
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, [API_URL, fromDate, toDate, companyCode, Year_Code, acCode, popconfirmvalue]);

    const handleExportToExcel = () => {
        const groupedData = groupReportData(reportData);
        const excelData = [];

        Object.entries(groupedData).forEach(([key, group]) => {
            group.items.forEach(item => {
                excelData.push({
                    "Sauda Date": formatDate(item.Sauda_date) || item.Sauda_DateConverted,
                    "Tender ID": item.tenderdetailid,
                    "Tender No": item.Tender_No,
                    "ID": item.ID,
                    "CrossName": popconfirmvalue === 'Y' ? item.millname : item.buyername,
                    "Season": item.season || '',
                    "Grade": item.Grade || '',
                    "Sale Rate": Number(item.Sale_Rate),
                    "Mill Rate": Number(item.Mill_Rate),
                    "Party Name": item.buyershortname || '',
                    "Qty": Number(item.Buyer_Quantal),
                    "D Type": item.Delivery_Type || '',
                    "CA": Number(item.CashDifference) || 0,
                    "Payment Date": item.payment_dateConverted || '',
                    "Narration": item.detail_narration || ''
                });
            });

            excelData.push({
                "Tender No": 'Total',
                "Qty": Number(group.totalQty)
            });
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);

        XLSX.utils.book_append_sheet(wb, ws, 'Normal Sauda');
        XLSX.writeFile(wb, 'NormalSaudaSummary.xlsx');
    };

    const handlePrint = () => {
        const groupedData = groupReportData(reportData);

        const formatRow = (cells, isHeader = false) => {
            return `<tr>${cells.map((cell, index) => {
                let align = index >= 7 ? 'right' : (index === 1 || index === 4) ? 'left' : 'center';
                const style = isHeader
                    ? `background-color:#e0e0e0;font-weight:bold;text-align:${align};padding:4px;border:1px solid #ccc;`
                    : `text-align:${align};padding:4px;border:1px solid #ccc;`;
                return `<td style="${style}">${cell ?? ''}</td>`;
            }).join('')}</tr>`;
        };

        let content = `<html><head><style>
            body { font-family: Arial; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ccc; padding: 6px; font-size: 11px; }
            .group-header { background-color: #f2f2f2; font-weight: bold; text-align: center; padding: 6px; }
        </style></head><body>
        <h2 style="text-align:center;">${Company_Name}</h2>
        <h4 style="text-align:center;">Normal Sauda Summary - From ${formatDate(fromDate)} To ${formatDate(toDate)}</h4>`;

        Object.entries(groupedData).forEach(([key, group]) => {
            const [buyerCode, buyerName] = key.split('-');
            content += `<div class="group-header">${buyerCode} - ${buyerName}</div>`;
            content += `<table><thead>${formatRow([
                'Sauda Date', 'Tender ID', 'Tender No', 'ID', 'CrossName', 'Season', 'Grade', 'Sale Rate',
                'Mill Rate', 'Party Name', 'Qty', 'D Type', 'CA', 'Payment Date', 'Narration'
            ], true)}</thead><tbody>`;

            group.items.forEach(item => {
                content += formatRow([
                    formatDate(item.Sauda_date) || item.Sauda_DateConverted,
                    item.tenderdetailid,
                    item.Tender_No,
                    item.ID,
                    popconfirmvalue === 'Y' ? item.millname : item.buyername,
                    item.season || '',
                    item.Grade || '',
                    formatReadableAmount(item.Sale_Rate),
                    formatReadableAmount(item.Mill_Rate),
                    item.buyershortname,
                    formatReadableAmount(item.Buyer_Quantal),
                    item.Delivery_Type || '',
                    formatReadableAmount(item.CashDifference),
                    item.payment_dateConverted || '',
                    item.detail_narration || ''
                ]);
            });

            content += `<tr><td colspan="10" style="text-align:right;font-weight:bold;">Total Qty:</td>
                        <td colspan="5" style="text-align:right;font-weight:bold;color:red;">${formatReadableAmount(group.totalQty)}</td></tr></tbody></table>`;
        });

        content += '</body></html>';
        const win = window.open('', '', 'height=900,width=1200');
        win.document.write(content);
        win.document.close();
        win.print();
    };


    const generatePDF = async () => {
        const doc = new jsPDF('l');
        const pageWidth = doc.internal.pageSize.width;
        const groupedData = groupReportData(reportData);
        let currentY = 10;

        doc.setFontSize(10);
        doc.text(`${Company_Name}`, pageWidth / 2, currentY, { align: "center" });
        currentY += 5;
        doc.setFontSize(8);
        doc.text(`Normal Sauda Summary - From ${formatDate(fromDate)} To ${formatDate(toDate)}`, pageWidth / 2, currentY, { align: "center" });

        const tableBody = [];

        Object.entries(groupedData).forEach(([key, group]) => {
            const [buyerCode, buyerName] = key.split('-');
            tableBody.push([{
                content: `${buyerCode} - ${buyerName}`,
                colSpan: 15,
                styles: { halign: 'center', fontStyle: 'bold', fillColor: [230, 230, 250] }
            }]);

            group.items.forEach(item => {
                tableBody.push([
                    formatDate(item.Sauda_date) || item.Sauda_DateConverted,
                    item.tenderdetailid,
                    item.Tender_No,
                    item.ID,
                    popconfirmvalue === 'Y' ? item.millname : item.buyername,
                    item.season,
                    item.Grade,
                    formatReadableAmount(item.Sale_Rate),
                    formatReadableAmount(item.Mill_Rate),
                    item.buyershortname,
                    formatReadableAmount(item.Buyer_Quantal),
                    item.Delivery_Type,
                    formatReadableAmount(item.CashDifference),
                    item.payment_dateConverted,
                    item.detail_narration
                ]);
            });

            tableBody.push([
                { content: '', colSpan: 10 },
                { content: formatReadableAmount(group.totalQty), styles: { halign: 'right', fontStyle: 'bold' } },
                '', '', '', ''
            ]);
        });

        doc.autoTable({
            head: [[
                'Sauda Date', 'Tender ID', 'Tender No', 'ID', 'CrossName', 'Season', 'Grade',
                'Sale Rate', 'Mill Rate', 'Party Name', 'Qty', 'D Type', 'CA', 'Payment Date', 'Narration'
            ]],
            body: tableBody,
            startY: currentY + 3,
            styles: {
                fontSize: 6,
                cellPadding: 0.6,
                overflow: 'visible'
            },
            columnStyles: {
                0: { halign: 'center' },
                1: { halign: 'center' },
                2: { halign: 'center' },
                3: { halign: 'center' },
                4: { halign: 'left' },
                5: { halign: 'left' },
                6: { halign: 'left' },
                7: { halign: 'right' },
                8: { halign: 'right' },
                9: { halign: 'left' },
                10: { halign: 'right' },
                11: { halign: 'center' },
                12: { halign: 'right' },
                13: { halign: 'center' },
                14: { halign: 'left' },
            },
            headStyles: {
                fillColor: [200, 200, 200],
                textColor: [0, 0, 0],
                fontStyle: 'bold'
            }
        });

        const blob = doc.output("blob");
        const pdfUrl = URL.createObjectURL(blob);
        setPdfPreview(pdfUrl);
    };


    const groupReportData = (data) => {
        const groupedData = {};
        (data || []).forEach((item) => {
            const key = `${item.Buyer}-${item.buyername || item.buyerpartyname || 'Unknown Buyer'}`;
            if (!groupedData[key]) {
                groupedData[key] = { items: [], totalQty: 0 };
            }
            groupedData[key].items.push(item);
            groupedData[key].totalQty += parseFloat(item.Buyer_Quantal || 0);
        });
        return groupedData;
    };

    const groupedReportData = groupReportData(reportData);

    return (
        <div style={{marginTop:"-80px"}}>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold" }}>{Company_Name}</Typography>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", textDecoration: 'underline', fontWeight: "550" }}>GSTN : {Company_GSTNO}</Typography>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>Normal Sauda Summary</Typography>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px" }}>{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>

            <div className="row align-items-center mb-3">
                <div className="col-auto">
                    <button className="btn btn-secondary me-2" onClick={handlePrint}>Print</button>
                    <button className="btn btn-success me-2" onClick={handleExportToExcel}>Export to Excel</button>
                    {pdfPreview && <PdfPreview pdfData={pdfPreview} apiData={reportData[0]} label="NormalSaudaSummary" />}
                    <button className="btn btn-success" onClick={generatePDF}>PDF Preview</button>
                </div>
            </div>

            <TableContainer component={Paper} sx={{ maxHeight: '80vh', overflow: 'auto' }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {[
                                "Sauda Date", "Tender ID", "Tender No", "ID", "Cross Name", "Season", "Grade",
                                "Sale Rate", "Mill Rate", "Party Name", "Quantity", "D Type", "CA", "Payment Date", "Narration"
                            ].map((header, index) => (
                                <TableCell
                                    key={index}
                                    sx={{
                                        backgroundColor: "#f0f0f0",
                                        fontWeight: "bold",
                                        position: "sticky",
                                        top: 0,
                                        zIndex: 1,
                                        textAlign: index >= 7 && index <= 12 ? "right" : "left",
                                        whiteSpace: "nowrap"
                                    }}
                                >
                                    {header}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {Object.entries(groupedReportData).map(([key, { items, totalQty }]) => {
                            const [buyerId, buyerName] = key.split("-");
                            return (
                                <React.Fragment key={key}>
                                    <TableRow>
                                        <TableCell colSpan={15} sx={{ backgroundColor: "#e6f0ff", fontWeight: "bold", color: "blue" }}>
                                            {buyerId} - {buyerName}
                                        </TableCell>
                                    </TableRow>

                                    {items.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{formatDate(item.Sauda_date) || item.Sauda_DateConverted}</TableCell>
                                            <TableCell>{item.tenderdetailid}</TableCell>
                                            <TableCell>{item.Tender_No}</TableCell>
                                            <TableCell>{item.ID}</TableCell>
                                            <TableCell>{popconfirmvalue === 'Y' ? item.millname : item.buyername}</TableCell>
                                            <TableCell>{item.season}</TableCell>
                                            <TableCell>{item.Grade}</TableCell>
                                            <TableCell align="right">{formatReadableAmount(item.Sale_Rate)}</TableCell>
                                            <TableCell align="right">{formatReadableAmount(item.Mill_Rate)}</TableCell>
                                            <TableCell align="right">{item.buyershortname}</TableCell>
                                            <TableCell align="right">{formatReadableAmount(item.Buyer_Quantal)}</TableCell>
                                            <TableCell>{item.Delivery_Type}</TableCell>
                                            <TableCell align="right">{formatReadableAmount(item.CashDifference)}</TableCell>
                                            <TableCell>{item.payment_dateConverted}</TableCell>
                                            <TableCell>{item.detail_narration}</TableCell>
                                        </TableRow>
                                    ))}

                                    <TableRow>
                                        <TableCell colSpan={10} align="right" sx={{ fontWeight: "bold" }}>
                                            Total
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: "bold" }}>
                                            {formatReadableAmount(totalQty)}
                                        </TableCell>
                                        <TableCell colSpan={4}></TableCell>
                                    </TableRow>
                                </React.Fragment>
                            );
                        })}
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

export default NormalSaudaSummary;
