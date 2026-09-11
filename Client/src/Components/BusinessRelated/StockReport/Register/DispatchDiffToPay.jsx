import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useLocation } from 'react-router-dom';
import PdfPreview from '../../../../Common/PDFPreview';
import { RingLoader } from 'react-spinners';
import { Typography } from '@mui/material';
import { FormaDateBalanceSheet } from "../../../../Common/FormatFunctions/FormatDate"
import { formatReadableAmount } from "../../../../Common/FormatFunctions/FormatAmount";
import PrintButton from '../../../../Common/Buttons/PrintPDF';

const apikey = process.env.REACT_APP_API;

const DispatchDiffToPay = () => {
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

    const API_URL = `${apikey}/DispatchDiff`;

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
                        }
                        tr:nth-child(even) {
                            background-color: #f9f9f9;
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
            'Date', 'No', 'Name of Account', 'Mill', 'Quantal',
            'Mill Rate', 'Sale Rate', 'Broker', 'Amount',
            'Voucher No', 'Chq No'
        ]);

        Object.entries(groupedReportData).forEach(([key, { items }]) => {
            const firstItem = items[0];
            if (!firstItem || parseFloat(firstItem.amount || 0) <= 0) return;

            wsData.push([
                firstItem.tdate,
                firstItem.tno,
                firstItem.getpassname,
                firstItem.mill,
                firstItem.quantal,
                firstItem.millrate,
                firstItem.salerate,
                firstItem.broker,
                firstItem.amount,
                '', ''
            ]);

            items.forEach(item => {
                wsData.push([
                    '', '', '', '', '', '', '', '', '',
                    `${item.voucher_no}${item.voucher_type}`,
                    `Chq.no. ${item.detail_id}`
                ]);
            });

            wsData.push([]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'DispatchDiffPay');
        XLSX.writeFile(wb, 'DispatchDiffPay.xlsx');
    };

    const groupReportData = (data) => {
        const grouped = {};
        data.forEach(item => {
            const key = item.tno;
            if (!grouped[key]) {
                grouped[key] = { items: [] };
            }
            grouped[key].items.push(item);
        });
        return grouped;
    };

    const groupedReportData = groupReportData(reportData);

    const handleVoucherClick = (doc_no, tran_type) => {
        if (doc_no && (tran_type === 'CV' || tran_type === 'LV')) {
            const url = `${window.location.origin}/commission-bill`;
            const params = new URLSearchParams({
                selectedVoucherNo: doc_no,
                selectedVoucherType: tran_type
            });
            window.open(`${url}?${params.toString()}`, '_blank');
        }
    };

    return (
        <div style={{ marginTop: '-80px' }}>
            {/* <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold" }}>{Company_Name}</Typography>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", textDecoration: 'underline', fontWeight: "550" }}>GSTN : {Company_GSTNO}</Typography> */}

            <div className="d-flex justify-content-between align-items-center">
                <div style={{ flex: 1, textAlign: 'center', marginLeft: "280px" }}>
                    <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>Dispatch Difference Pay</Typography>
                    <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px" }}>{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>
                </div>

                <div className="d-flex justify-content-end gap-2">
                    <PrintButton disabledFeild={""} fetchData={handlePrint} />
                    <button className="btn btn-success me-2" onClick={handleExportToExcel}>Export to Excel</button>
                    <button className="btn btn-secondary" onClick={generatePdf}>PDF</button>
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
                                <th>Date</th>
                                <th>No</th>
                                <th>Name of Account</th>
                                <th>Mill</th>
                                <th>Quintal</th>
                                <th>Mill Rate</th>
                                <th>Sale Rate</th>
                                <th>Broker</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(groupedReportData).map(([key, { items }]) => {
                                const firstItem = items[0];
                                if (!firstItem || parseFloat(firstItem.amount || 0) >= 0) return null;

                                return (
                                    <React.Fragment key={key}>
                                        <tr style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                                            <td>{firstItem.tdate}</td>
                                            <td>{firstItem.tno}</td>
                                            <td>{firstItem.getpassname}</td>
                                            <td align="left">{firstItem.mill}</td>
                                            <td align="right">{formatReadableAmount(firstItem.quantal)}</td>
                                            <td align="right">{formatReadableAmount(firstItem.millrate)}</td>
                                            <td align="right">{formatReadableAmount(firstItem.salerate)}</td>
                                            <td align="left">{firstItem.broker}</td>
                                            <td align="right">{formatReadableAmount(firstItem.amount)}</td>
                                        </tr>
                                        {items.map((item, index) => (
                                            <tr key={index}>
                                                <td align='left'
                                                    style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
                                                    onClick={() => handleVoucherClick(item.voucher_no, item.voucher_type)}
                                                >
                                                    Voc.no {item.voucher_no}{item.voucher_type}
                                                </td>
                                                <td></td>
                                                <td colSpan={6} align='left'> Chq.no.</td>
                                            </tr>
                                        ))}
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

export default DispatchDiffToPay;
