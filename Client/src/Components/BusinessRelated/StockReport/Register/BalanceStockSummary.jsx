import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useNavigate, useLocation } from 'react-router-dom';
import PdfPreview from "../../../../Common/PDFPreview";
import { RingLoader } from 'react-spinners';
import { Typography } from '@mui/material';
import './Register.css';
import { FormaDateBalanceSheet } from "../../../../Common/FormatFunctions/FormatDate"
import { formatReadableAmount } from "../../../../Common/FormatFunctions/FormatAmount";
import PrintButton from '../../../../Common/Buttons/PrintPDF';
const apikey = process.env.REACT_APP_API;

const BalanceStockSummary = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    //const { acCode, fromDate, toDate, lotNo, srNo } = location.state;
    const fromDate = searchParams.get('fromDate');
    const acCode = searchParams.get('acCode');
    const toDate = searchParams.get('toDate');
    const lotNo = searchParams.get('lotNo');
    const srNo = searchParams.get('srNo');


    const companyCode = sessionStorage.getItem("Company_Code");
    const yearCode = sessionStorage.getItem("Year_Code");
    const Company_Name = sessionStorage.getItem("Company_Name");
    const Company_GSTNO = sessionStorage.getItem('Company_GSTNO')
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pdfPreview, setPdfPreview] = useState([]);
    const [doResults, setDoResults] = useState([]);
    const [tenderResults, setTenderResults] = useState([]);
    const API_URL = `${apikey}/dispatch-details`;

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            setError('');

            try {
                const response = await axios.get(API_URL, {
                    params: {
                        Mill_Code: acCode || '',
                        fromDate: fromDate || '',
                        toDate: toDate || '',
                        lotNo: lotNo || '',
                        srNo: srNo || '',
                        Company_Code: companyCode,
                        Year_Code: yearCode,
                    },
                });

                setDoResults(response.data.do_results || []);
                setTenderResults(response.data.tender_results || []);
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
    }, [acCode, fromDate, toDate, lotNo, srNo, companyCode, yearCode]);


    const handleExportToExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [];

        wsData.push([Company_Name]);
        wsData.push([`Balance Stock Summary Report From: ${fromDate} To: ${toDate}`]);
        wsData.push([]);

        wsData.push([
            'Tender No',
            'Tender Date',
            'Mill',
            'Grade',
            'Quantal',
            'Mill Rate',
            'Qty',
            'Dispatched',
            'Balance',
            'Lifting Date',
            'Tender DO'
        ]);

        Object.entries(groupedReportData)
            .sort((a, b) => {
                const tenderA = parseFloat(a[1].items[0].Tender_No) || 0;
                const tenderB = parseFloat(b[1].items[0].Tender_No) || 0;
                return tenderA - tenderB;
            })
            .forEach(([_, { items }]) => {
                const firstItem = items[0];
                const balance = parseFloat(firstItem.Quantal) - parseFloat(firstItem.Dispatched || 0);

                wsData.push([
                    firstItem.Tender_No,
                    firstItem.Tender_Date,
                    firstItem.millname,
                    firstItem.Grade,
                    firstItem.Quantal,
                    firstItem.Mill_Rate,
                    firstItem.Quantal,
                    firstItem.Dispatched,
                    balance.toFixed(2),
                    firstItem.Lifting_Date,
                    firstItem.Tender_DO
                ]);

                items.forEach((item) => {
                    wsData.push([
                        ` ${item.Buyer}`,
                        '', '', '', '', '', item.Qty, '', '', '', ''
                    ]);

                    const relatedDOs = doResults.filter(
                        (doItem) => doItem.purc_no === item.Tender_No && doItem.purc_order === item.ID
                    );

                    relatedDOs.forEach((doItem) => {
                        wsData.push([
                            `DO#: ${doItem.detail_id}`,
                            doItem.DI_Date,
                            doItem.Getpass,
                            '',
                            '',
                            '',
                            doItem.DI_Qty,
                            '',
                            '',
                            doItem.truck_no,
                            `SR#: ${doItem.SalerateDO}`
                        ]);
                    });
                });
            });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'BalanceStockSummary');
        XLSX.writeFile(wb, 'BalanceStockSummary.xlsx');
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
            const key = `${item.Tender_No}`;
            if (!grouped[key]) {
                grouped[key] = { items: [] };
            }
            grouped[key].items.push(item);
        });
        return grouped;
    };

    const groupedReportData = groupReportData(tenderResults);

    return (
        <div style={{ marginTop: '-80px' }}>
            {/* <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold" }}>{Company_Name}</Typography>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", textDecoration: 'underline', fontWeight: "550" }}>GSTN : {Company_GSTNO}</Typography>
    */}
            <div className="d-flex justify-content-between align-items-center ">
                <div style={{ flex: 1, textAlign: 'center', marginLeft: "280px" }}>
                    <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>Balance Stock Summary</Typography>
                    <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px" }}>{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>
                </div>

                <div className="d-flex justify-content-end ">
                    <PrintButton disabledFeild={""} fetchData={handlePrint} />
                    <button className="btn btn-success" onClick={handleExportToExcel}>Export to Excel</button>
                </div>
            </div>

            {loading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                    <RingLoader />
                </div>
            ) : error ? (
                <div className="alert alert-danger">{error}</div>
            ) : (
                <div style={{ width: '100%', overflowX: 'auto', maxHeight: '800px', position: 'relative', paddingBottom: '20px' }}>
                    <div style={{ maxHeight: "800px", overflowY: "auto" }}>
                        <table className="table table-striped table-bordered mt-4" id="reportTable" style={{ marginBottom: "60px", width: "100%" }}>
                            <thead className="table-light" style={{ position: "sticky", top: 0, backgroundColor: "#fff", zIndex: 1, whiteSpace: "nowrap" }}>
                                <tr>
                                    <th style={{ width: "5%" }}>Tender No.</th>
                                    <th style={{ width: "10%" }}>Date</th>
                                    <th style={{ width: "15%", textAlign: 'left' }}>Mill Name</th>
                                    <th style={{ width: "10%", textAlign: 'left' }}>Grade</th>
                                    <th style={{ width: "10%", textAlign: 'right' }}>Net Quintal/Sale Rate</th>
                                    <th style={{ width: "10%", textAlign: 'right' }}>Mill Rate</th>
                                    <th style={{ width: "10%", textAlign: 'right' }}>Quintal</th>
                                    <th style={{ width: "10%", textAlign: 'right' }}>Dispatched</th>
                                    <th style={{ width: "10%", textAlign: 'right' }}>Balance</th>
                                    <th style={{ width: "10%" }}>Lifting Date</th>
                                    <th style={{ width: "10%", textAlign: 'left' }}>D.O</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(groupedReportData)
                                    .sort((a, b) => {
                                        const tenderA = parseFloat(a[1].items[0].Tender_No) || 0;
                                        const tenderB = parseFloat(b[1].items[0].Tender_No) || 0;
                                        return tenderA - tenderB;
                                    })
                                    .map(([key, { items }]) => {
                                        const firstItem = items[0];
                                        const totalQty = items.reduce((sum, item) => sum + (parseFloat(item.Qty) || 0), 0);
                                        const balance = parseFloat(firstItem.Quantal) - parseFloat(firstItem.Dispatched);

                                        return (
                                            <React.Fragment key={key}>
                                                <tr
                                                    style={{
                                                        backgroundColor: balance === 0 ? "#c8e6c9" : "#d3d3d3",
                                                        color: "red",
                                                        fontWeight: "bold"
                                                    }}
                                                >
                                                    <td align='center'>{firstItem.Tender_No}</td>
                                                    <td align='center'>{firstItem.Tender_Date}</td>
                                                    <td align='left' style={{ whiteSpace: "nowrap" }}>{firstItem.millname}</td>
                                                    <td align='left' style={{ whiteSpace: "nowrap" }}>{firstItem.Grade}</td>
                                                    <td align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(firstItem.Quantal)}</td>
                                                    <td align="right">{formatReadableAmount(firstItem.Mill_Rate)}</td>
                                                    <td align="right">{formatReadableAmount(firstItem.Quantal)}</td>
                                                    <td align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(firstItem.Dispatched)}</td>
                                                    <td align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(balance.toFixed(2))}</td>
                                                    <td align='center'>{firstItem.Lifting_Date}</td>
                                                    <td align='left' style={{ width: '70px', whiteSpace: "nowrap" }}>{firstItem.Tender_DO}</td>
                                                </tr>

                                                {items.map((item, index) => {
                                                    const relatedDOs = doResults.filter(
                                                        (doItem) => doItem.purc_no === item.Tender_No && doItem.purc_order === item.ID
                                                    );

                                                    return (
                                                        <React.Fragment key={index}>
                                                            <tr style={{ backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#ffffff" }}>
                                                                <td>{item.ID}</td>
                                                                <td colSpan={5} align='left'>{item.Buyer}</td>
                                                                <td align="right">{formatReadableAmount(item.Qty)}</td>
                                                                <td colSpan={3}></td>
                                                            </tr>

                                                            {relatedDOs.map((doItem, doIndex) => (
                                                                <tr key={`do-${doIndex}`} style={{ backgroundColor: "#e3f2fd" }}>
                                                                    <td ></td>
                                                                    <td colSpan={2} align='left'>{doItem.Getpass}</td>
                                                                    <td style={{ fontWeight: 'bold' }}>DO#:{doItem.detail_id}</td>
                                                                    <td colSpan={2} style={{ fontWeight: 'bold' }} align='left'>SR#:{formatReadableAmount(doItem.SalerateDO)}</td>
                                                                    <td align='center' >{doItem.DI_Date}</td>
                                                                    <td align='right'>{formatReadableAmount(doItem.DI_Qty)}</td>
                                                                    <td align='left'>{doItem.truck_no}</td>
                                                                    <td></td>
                                                                    <td></td>
                                                                </tr>
                                                            ))}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </React.Fragment>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>

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

export default BalanceStockSummary;
