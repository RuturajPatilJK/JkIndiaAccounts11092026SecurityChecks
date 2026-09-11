import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useNavigate, useLocation } from 'react-router-dom';
import PdfPreview from "../../../../Common/PDFPreview";
import { RingLoader } from 'react-spinners';
import { Typography } from '@mui/material';
import { FormaDateBalanceSheet } from "../../../../Common/FormatFunctions/FormatDate"
import { formatReadableAmount } from "../../../../Common/FormatFunctions/FormatAmount";
import PrintButton from '../../../../Common/Buttons/PrintPDF';

const apikey = process.env.REACT_APP_API;

const NewDispatchRegister = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    //const { acCode, fromDate, toDate, lotNo, srNo } = location.state;
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const companyCode = sessionStorage.getItem("Company_Code");
    const Year_Code = sessionStorage.getItem("Year_Code");
    const Company_Name = sessionStorage.getItem("Company_Name");
    const Company_GSTNO = sessionStorage.getItem('Company_GSTNO')

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pdfPreview, setPdfPreview] = useState([]);

    const API_URL = `${apikey}/Newdispatch-details`;

    useEffect(() => {
        if (!fromDate || !toDate) {
            navigate('/journal-voucher');
            return;
        }

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

        fetchReportData();
    }, [fromDate, toDate, companyCode, Year_Code]);

    const handleExportToExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [];

        wsData.push([Company_Name]);
        wsData.push([`Dispatch Report From ${fromDate} To ${toDate}`]);
        wsData.push([]);

        const headers = [
            'Doc No', 'Mill', 'Rate', 'Quantal', 'Party Name',
            'Truck', 'Transport', 'DO', 'Broker', 'S.R.',
            'Grade', 'Freight', 'Ref No', 'TN', 'TDN',
            'Narration', 'Adv. Freight', 'SB No', 'TCS Rate',
            'Bill Amount', 'TCS Amount', 'Final Total',
            'Getpass', 'Payment To', 'Bill To', 'Ship To'
        ];
        wsData.push(headers);

        Object.entries(groupedReportData).forEach(([date, { items }]) => {
            wsData.push([`Date: ${date}`]);
            items.forEach(item => {
                wsData.push([
                    item.doc_no,
                    item.mill,
                    item.millrate,
                    item.qntl,
                    item.party,
                    item.lorry,
                    item.transport,
                    item.DO,
                    item.brokername,
                    item.salerate,
                    item.grade,
                    item.frieght,
                    item.refno,
                    item.tn,
                    item.tdn,
                    item.narration,
                    item.MM_Rate,
                    item.SB_No,
                    item.TCS_Rate,
                    item.Bill_Amount,
                    item.TCS_Amt,
                    item.TCS_Net_Payable,
                    item.getpass,
                    item.paymenttoname,
                    item.narr4,
                    item.shiptoname
                ]);
            });
            wsData.push([]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Dispatch Report');
        XLSX.writeFile(wb, 'NewDispatchRegister.xlsx');
    };


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

    const groupReportData = (data) => {
        const grouped = {};
        data.forEach(item => {
            const key = `${item.Do_Date}`;
            if (!grouped[key]) {
                grouped[key] = { items: [] };
            }
            grouped[key].items.push(item);
        });
        return grouped;
    };

    const groupedReportData = groupReportData(reportData);

    const SaleRate = (DelieveryType, SR, MMRate, Comm) => {
        let Salerate = 0.00;
        if (DelieveryType === "C") {
            Salerate = SR + MMRate + Comm;
        }


        return Salerate
    }
    const handleRowClick = (doc_no, tran_type) => {
        if (tran_type === 'JV') {
            const url = `${window.location.origin}/journal-voucher`;
            const params = new URLSearchParams({
                navigatedRecord: doc_no,
                navigatedTranType: tran_type,
            });
            window.open(`${url}?${params.toString()}`, '_blank');
        }
    };

    return (
        <div style={{ marginTop: '-80px' }}>
            {/* <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold" }}>{Company_Name}</Typography>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", textDecoration: 'underline', fontWeight: "550" }}>GSTN : {Company_GSTNO}</Typography> */}

            <div className="d-flex justify-content-between align-items-center">
                <div style={{ flex: 1, textAlign: 'center',marginLeft: "280px"  }}>
                    <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>Dispatch Register</Typography>
                    <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px" }}>{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>
                </div>

                <div className="d-flex justify-content-end ">
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
                                <th>#</th>
                                <th>Mill Name</th>
                                <th>Rate</th>
                                <th>Quintal</th>
                                <th>Name of Party</th>
                                <th style={{ textAlign: 'right' }}>Truck No.</th>
                                <th style={{ textAlign: 'right' }}>Transport</th>
                                <th> DO</th>
                                <th>DO print</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(groupedReportData).map(([key, { items }]) => (
                                <React.Fragment key={key}>
                                    <tr>
                                        <td colSpan={12} align="left" className="table-primary" style={{ color: 'blue', fontWeight: "bold" }}>
                                            {key}
                                        </td>
                                    </tr>
                                    {items.map((item, index) => (
                                        <React.Fragment key={index}>
                                            <tr>
                                                <td style={{ fontWeight: "bold" }}>{item.doc_no}</td>
                                                <td align="left" style={{ fontWeight: "bold" }}>{item.mill}</td>
                                                <td align="right">{formatReadableAmount(item.millrate)}</td>
                                                <td align="right">{formatReadableAmount(item.qntl)}</td>
                                                <td align="left" style={{ fontWeight: "bold" }}>{item.party}</td>
                                                <td align="right">{item.lorry}</td>
                                                <td align="left">{item.transport}</td>
                                                <td align="left">{item.DO}</td>
                                            </tr>
                                            <tr>
                                                <td colSpan={2} align="left">Broker: {item.brokername}</td>
                                                <td>Sale Rate {formatReadableAmount(item.salerate)}</td>
                                                <td>{item.grade}</td>
                                                <td align="left">Freight</td>
                                                <td align="left">{item.frieght}</td>
                                                <td align="right">Ref.No:</td>
                                                <td align="right">{item.refno}</td>
                                            </tr>
                                            <tr style={{ borderBottom: '2px solid #000' }}>
                                                <td>{item.tn}</td>
                                                <td>{item.tdn}</td>
                                                <td align="left" colSpan={2}>{item.narration}</td>

                                                <td align="left">  Adv. Freight: {formatReadableAmount(item.MM_Rate)} Voc.No: {item.SB_No}SB</td>
                                                <td align="right">TCS Rate: {formatReadableAmount(item.TCS_Rate)}</td>
                                                <td>Bill Amount: {formatReadableAmount(item.Bill_Amount)}</td>
                                                <td>TCS Amount: {formatReadableAmount(item.TCS_Amt)}</td>
                                                <td style={{ fontWeight: "bold" }}>Final Total: {formatReadableAmount(item.TCS_Net_Payable)}</td>
                                            </tr>
                                            <tr style={{ borderBottom: '2px solid #000' }}>
                                                <td colSpan={3} align="left" style={{ fontWeight: "bold" }}>Getpass: {item.getpass}</td>
                                                <td align="left">Payment To:{item.paymenttoname}</td>
                                                <td colSpan={2}>Bill To:{item.narr4}</td>
                                                <td align="left" colSpan={2}>{item.shiptoname}</td>
                                            </tr>
                                        </React.Fragment>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {pdfPreview && pdfPreview.length > 0 && (
                <div className="centered-container">
                    <PdfPreview pdfData={pdfPreview} apiData={reportData} label={"NewDispatchRegister"} />
                </div>
            )}
        </div>
    );
};

export default NewDispatchRegister;
