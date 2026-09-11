import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useNavigate, useLocation } from 'react-router-dom';
import PdfPreview from '../../../../Common/PDFPreview';
import { RingLoader } from 'react-spinners';
import { Typography } from '@mui/material';
import { formatReadableAmount } from "../../../../Common/FormatFunctions/FormatAmount";
import { FormaDateBalanceSheet } from "../../../../Common/FormatFunctions/FormatDate"

const apikey = process.env.REACT_APP_API;

const MillPaymentForGST = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const searchParams = new URLSearchParams(location.search);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const companyCode = sessionStorage.getItem('Company_Code');
    const Year_Code = sessionStorage.getItem('Year_Code');
    const Company_Name = sessionStorage.getItem('Company_Name');
    const Company_GSTNO = sessionStorage.getItem('Company_GSTNO')

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pdfPreview, setPdfPreview] = useState(null);

    const API_URL = `${apikey}/MillpaymentForGST-Register`;

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await axios.get(API_URL, {
                    params: {
                        fromDT: fromDate,
                        toDT: toDate,
                        Company_Code: companyCode,
                        Year_Code: Year_Code,
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

        if (fromDate && toDate) {
            fetchReportData();
        }
    }, [fromDate, toDate, companyCode, Year_Code]);

    const handlePrint = () => {
        const printContent = document.getElementById('reportTable').outerHTML;
        const win = window.open('', '', 'height=700,width=900');
        win.document.write(`
            <html>
                <head>
                    <title>Print Report</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            margin: 20px;
                        }
                        .company-name {
                            text-align: center;
                            font-size: 24px;
                            font-weight: bold;
                            margin-bottom: 20px;
                            color: #333;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-bottom: 20px;
                        }
                        th, td {
                            border: 1px solid #ddd;
                            padding: 8px;
                            text-align: left;
                        }
                        th {
                            background-color: #f2f2f2;
                            font-weight: bold;
                        }
                        tr:nth-child(even) {
                            background-color: #f9f9f9;
                        }
                        .total-row {
                            background-color: #e0f7fa;
                            font-weight: bold;
                        }
                    </style>
                </head>
                <body>
                    <div class="company-name">${Company_Name}</div>
                    ${printContent}
                </body>
            </html>
        `);
        win.document.close();
        win.print();
    };

    const generatePdf = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const textWidth = doc.getTextWidth(Company_Name);
        const xPosition = (pageWidth - textWidth) / 2;

        doc.text(Company_Name, xPosition, 10);
        doc.autoTable({ html: '#reportTable' });

        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        setPdfPreview(url);
    };

    const handleExportToExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [];

        wsData.push([Company_Name]);
        wsData.push([]);

        wsData.push([
            'Quantal', 'Mill Rate', 'GST Rate', 'Total GST Rate', 'Mill Amount',
            'TCS Rate', 'TCS Amount', 'TDS Rate', 'TDS Amount', 'TCS Net Payable', 'Narration'
        ]);

        Object.entries(groupedReportData).forEach(([groupKey, { items }]) => {
            wsData.push([groupKey]);

            let totalQty = 0;
            let totalMillAmt = 0;
            let totalTCSAmt = 0;
            let totalTDSAmt = 0;
            let totalNetAmt = 0;

            items.forEach(item => {
                const qtl = parseFloat(item.qtl || 0);
                const millRate = parseFloat(item.mill_rate || 0);
                const millAmt = parseFloat(item.millamount || 0);
                const tcsAmt = parseFloat(item.TCSAmt || 0);
                const tdsAmt = parseFloat(item.TDSAmt || 0);
                const netPayable = parseFloat(item.TCSNetPayable || 0);

                totalQty += qtl;
                totalMillAmt += millAmt;
                totalTCSAmt += tcsAmt;
                totalTDSAmt += tdsAmt;
                totalNetAmt += netPayable;

                wsData.push([
                    qtl.toFixed(2),
                    millRate.toFixed(2),
                    item.gst_rate,
                    item.totalmillrate,
                    millAmt.toFixed(2),
                    item.TCS_Rate,
                    tcsAmt.toFixed(2),
                    item.TDSRate,
                    tdsAmt.toFixed(2),
                    netPayable.toFixed(2),
                    `${item.LORRYNO || ''} - ${item.SupplierShortname || ''}`
                ]);
            });

            wsData.push([
                totalQty.toFixed(2), '', '', '', totalMillAmt.toFixed(2), '', totalTCSAmt.toFixed(2),
                '', totalTDSAmt.toFixed(2), totalNetAmt.toFixed(2), 'Total'
            ]);
            wsData.push([]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'MillPaymentForGST');
        XLSX.writeFile(wb, 'MillPaymentForGST.xlsx');
    };

    const groupReportData = (data) => {
        if (!Array.isArray(data)) return {};
        const grouped = {};
        data.forEach(item => {
            const key = `${item.Payment_To}-${item.paymentshortname}`;
            if (!grouped[key]) {
                grouped[key] = { items: [] };
            }
            grouped[key].items.push(item);
        });
        return grouped;
    };

    const groupedReportData = groupReportData(reportData);

    return (
        <div style={{ marginTop: '-80px' }}>
            {/* <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold" }}>{Company_Name}</Typography>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", textDecoration: 'underline', fontWeight: "550" }}>GSTN : {Company_GSTNO}</Typography> */}

            <div className="d-flex justify-content-between align-items-center ">
                <div style={{ flex: 1, textAlign: 'center', marginLeft: "280px" }}>
                    <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>Mill Payment For GST</Typography>
                    <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px" }}>{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>
                </div>

                <div className="d-flex justify-content-end ">
                    <button className="btn btn-secondary me-2" onClick={handlePrint}>Print Report</button>
                    <button className="btn btn-success me-2" onClick={handleExportToExcel}>Export to Excel</button>
                </div>
            </div>

            {loading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                    <RingLoader />
                </div>
            ) : error ? (
                <div className="alert alert-danger">{error}</div>
            ) : (
                <div style={{ maxHeight: "800px", overflowY: "auto" }}>
                    <table className="table table-striped table-bordered mt-4" id="reportTable" style={{ marginBottom: "60px", width: "100%" }}>
                        <thead className="table-light" style={{ position: "sticky", top: 0, backgroundColor: "#fff", zIndex: 1, whiteSpace: "nowrap" }}>
                            <tr>
                                <th>Quintal</th>
                                <th>Mill Rate</th>
                                <th>GST Rate</th>
                                <th>Total GST Rate</th>
                                <th>Mill Amount</th>
                                <th>TCS Rate</th>
                                <th>TCS Amount</th>
                                <th>TDS Rate</th>
                                <th>TDS Amount</th>
                                <th>TCS Net Payable</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(groupedReportData).map(([key, { items }]) => {
                                const totalQty = items.reduce((sum, item) => sum + parseFloat(item.qtl || 0), 0);
                                const totalmillamt = items.reduce((sum, item) => sum + parseFloat(item.millamount || 0), 0);
                                const totaltdsamt = items.reduce((sum, item) => sum + parseFloat(item.TDSAmt || 0), 0);
                                const totalnetamt = items.reduce((sum, item) => sum + parseFloat(item.TCSNetPayable || 0), 0);

                                return (
                                    <React.Fragment key={key}>
                                        <tr>
                                            <td align='left' className="table-primary" style={{ color: 'blue', fontWeight: 'bold' }}>{key}</td>
                                        </tr>
                                        {items.map((item, index) => (
                                            <tr key={index}>
                                                <td style={{ fontWeight: 'bold' }} align='center'>{item.qtl}</td>
                                                <td style={{ fontWeight: 'bold' }} align='center'>{formatReadableAmount(item.mill_rate)}</td>
                                                <td align="right">{item.gst_rate}</td>
                                                <td align="right">{formatReadableAmount(item.totalmillrate)}</td>
                                                <td align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(item.millamount)}</td>
                                                <td align="right">{item.TCS_Rate}</td>
                                                <td align="right">{formatReadableAmount(item.TCSAmt)}</td>
                                                <td align="right">{item.TDSRate}</td>
                                                <td align="right">{formatReadableAmount(item.TDSAmt)}</td>
                                                <td align="right">{formatReadableAmount(item.TCSNetPayable)}</td>
                                            </tr>
                                        ))}
                                        <tr style={{ fontWeight: 'bold', backgroundColor: '#f0f8ff' }}>
                                            <td align="right">{formatReadableAmount(totalQty)}</td>
                                            <td align="right" colSpan={2}>{formatReadableAmount(totalmillamt)}</td>
                                            <td align="right" colSpan={4}>{formatReadableAmount(totaltdsamt)}</td>
                                            <td align="right">{formatReadableAmount(totalnetamt)}</td>
                                        </tr>
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {pdfPreview && (
                <div className="centered-container">
                    <PdfPreview pdfData={pdfPreview} apiData={reportData} label={'NewDispatchRegister'} />
                </div>
            )}
        </div>
    );
};

export default MillPaymentForGST;