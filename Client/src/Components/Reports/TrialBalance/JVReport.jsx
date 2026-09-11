import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../Reports/TrialBalance/TrialBalance.css';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useNavigate, useLocation } from 'react-router-dom';
import PdfPreview from "../../../Common/PDFPreview";
import { RingLoader } from 'react-spinners';
import { Typography } from '@mui/material';
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import { FormaDateBalanceSheet } from '../../../Common/FormatFunctions/FormatDate';
import PrintButton from '../../../Common/Buttons/PrintPDF';

const apikey = process.env.REACT_APP_API;

const JVReport = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const searchParams = new URLSearchParams(location.search);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const doc_no = searchParams.get('doc_no');

    // const { fromDate, toDate, doc_no } = location.state || { fromDate: '', toDate: '', doc_no: '' };

    //GET values from the session
    const companyCode = sessionStorage.getItem("Company_Code");
    const Year_Code = sessionStorage.getItem("Year_Code");
    const Company_Name = sessionStorage.getItem("Company_Name");
    const Company_GSTNO = sessionStorage.getItem("Company_GSTNO");

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [emailId, setEmailId] = useState('');
    const [pdfPreview, setPdfPreview] = useState([])

    const API_URL = `${apikey}/JV-Report`;

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await axios.get(API_URL, {
                    params: {
                        from_date: fromDate,
                        to_date: toDate,
                        Company_Code: companyCode,
                        Year_Code: Year_Code,
                        doc_no: doc_no
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
        const wsData = [];

        wsData.push([Company_Name]); // Add company name
        wsData.push([]); // Empty row for spacing

        const headers = [
            'Tran Type',
            'Doc No',
            'Date',
            'Party Name',
            'Debit',
            'Credit',
        ];
        wsData.push(headers);

        Object.entries(groupedReportData).forEach(([key, value]) => {
            value.items.forEach((item) => {
                const row = [
                    item.TRAN_TYPE,
                    item.DOC_NO,
                    item.DOC_DATE,
                    item.Ac_Name_E,
                    parseFloat(item.Debit) || 0, 
                    parseFloat(item.Credit) || 0,
                ];
                wsData.push(row);
            });
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'JVReport');

        XLSX.writeFile(wb, 'JVReport.xlsx');
    };


    // const handlePrint = () => {
    //     const printContent = document.getElementById('reportTable').outerHTML;
    //     const win = window.open('', '', 'height=700,width=900');

    //     win.document.write(`
    //         <html>
    //             <head>
    //                 <title>Print Report</title>
    //                 <style>
    //                     body {
    //                         font-family: Arial, sans-serif;
    //                         margin: 20px;
    //                     }
    //                     .company-name {
    //                         text-align: center;
    //                         font-size: 24px;
    //                         font-weight: bold;
    //                         margin-bottom: 20px;
    //                         color: #333;
    //                     }
    //                     table {
    //                         width: 100%;
    //                         border-collapse: collapse;
    //                         margin-bottom: 20px;
    //                     }
    //                     th, td {
    //                         border: 1px solid #ddd;
    //                         padding: 8px;
    //                         text-align: left;
    //                     }
    //                     th {
    //                         background-color: #f2f2f2;
    //                         font-weight: bold;
    //                     }
    //                     tr:nth-child(even) {
    //                         background-color: #f9f9f9;
    //                     }
    //                     .total-row {
    //                         background-color: #e0f7fa;
    //                         font-weight: bold;
    //                     }
    //                 </style>
    //             </head>
    //             <body>
    //                 <div class="company-name">${Company_Name}</div>
    //                 ${printContent}
    //             </body>
    //         </html>
    //     `);
    //     win.document.close();
    //     win.print();
    // };

    const handlePrint = () => {
        const printContent = document.getElementById('reportTable').outerHTML;
    
        const win = window.open('', '', 'height=700,width=900');
    
        const headerHTML = `
            <div style="text-align: center; font-size: 24px; font-weight: bold;">${Company_Name}</div>
            <div style="text-align: center; font-size: 16px; text-decoration: underline; font-weight: 550;">GSTN : ${Company_GSTNO}</div>
            <div style="text-align: center; font-size: 20px; font-weight: bold;">Journal Voucher</div>
            <div style="text-align: center; font-size: 16px;">${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}</div>
            <br/>
        `;

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
                    ${headerHTML}
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


    const groupReportData = (data) => {
        const groupedData = {};
        data.forEach((item) => {
            const key = `${item.DOC_DATE}`;
            if (!groupedData[key]) {
                groupedData[key] = {
                    items: [],
                    totalQty: 0,
                    groupcreditamt: 0,
                    groupdebitamt: 0
                };
            }
            groupedData[key].items.push(item);
            groupedData[key].groupcreditamt += parseFloat(item.Credit) || 0;
            groupedData[key].groupdebitamt += parseFloat(item.Debit) || 0;
        });
        return groupedData;
    };

    const groupedReportData = groupReportData(reportData);

    const handleBack = () => {
        navigate('/journal-voucher');
    };

    const handleRowClick = (doc_no, tran_type) => {

        if (tran_type === 'JV') {
            const url = `${window.location.origin}/journal-voucher`;
            const params = new URLSearchParams({
                navigatedRecord: doc_no,
                navigatedTranType: tran_type
            });
            window.open(`${url}?${params.toString()}`, '_blank');
        }
    };


    return (
        <div style={{marginTop:"-80px"}}>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold" }}>{Company_Name}</Typography>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", textDecoration: 'underline', fontWeight: "550" }}>GSTN : {Company_GSTNO}</Typography>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>Journal Voucher</Typography>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px" }}>{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>

            <div className="d-flex justify-content-end mt-3">
                <PrintButton disabledFeild={""} fetchData={handlePrint} />
                <button className="btn btn-success" onClick={handleExportToExcel}>
                    Export to Excel
                </button>
                {/* <button onClick={generatePdf} className="btn btn-secondary">
                      PDF
                    </button> */}
            </div>

            <div className="table-responsive">
                <table className="table table-striped table-bordered mt-4" id="reportTable" style={{ marginBottom: "60px" }}>
                    <thead className="table-light">
                        <tr>
                            <th>Tran Type</th>
                            <th>Doc No</th>
                            <th>Date</th>
                            <th>Party Name</th>
                            <th>Narration</th>
                            <th style={{ textAlign: 'right' }}>Debit</th>
                            <th style={{ textAlign: 'right' }}>Credit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(groupedReportData).map(([key, { items, groupdebitamt, groupcreditamt }]) => {
                            const [mc] = key.split('-');
                            return (
                                <React.Fragment key={key}>
                                    <tr>
                                        <td colSpan={12} className="table-primary" style={{ color: 'red', fontWeight: "bold" }}>
                                            {mc}
                                        </td>
                                    </tr>
                                    {items.map((item, index) => (
                                        <tr key={index}>

                                            <td>{item.TRAN_TYPE}</td>
                                            <td onClick={() => handleRowClick(item.DOC_NO, item.TRAN_TYPE)} style={{ cursor: "pointer" }}>{item.DOC_NO}</td>
                                            <td>{item.DOC_DATE}</td>
                                            <td align='left'>{item.Ac_Name_E}</td>
                                            <td align='left'>{item.NARRATION}</td>
                                            <td align='right'>{formatReadableAmount(item.Debit)}</td>
                                            <td align='right'>{formatReadableAmount(item.Credit)}</td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td className="text-end fw-bold" colSpan={5} align='left'>Total</td>
                                        <td className="fw-bold" align='right'>{formatReadableAmount(Math.abs(groupdebitamt))}</td>
                                        <td className="fw-bold" align='right'>{formatReadableAmount(Math.abs(groupcreditamt))}</td>
                                    </tr>
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {loading && <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                }}
            >
                <RingLoader />
            </div>}
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="centered-container">

                {pdfPreview && pdfPreview.length > 0 && (
                    <PdfPreview pdfData={pdfPreview} apiData={reportData} label={"JournalVoucher"} />
                )}
            </div>
        </div>
    );
};

export default JVReport;
