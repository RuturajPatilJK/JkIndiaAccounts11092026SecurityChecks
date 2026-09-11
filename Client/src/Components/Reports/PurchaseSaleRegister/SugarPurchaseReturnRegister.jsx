import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import { Typography } from '@mui/material';
import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate"

const apikey = process.env.REACT_APP_API;

const SugarPurchaseReturnRegister = () => {
    const navigate = useNavigate();
    const location = useLocation();
    // const { fromDate, toDate } = location.state || { fromDate: '', toDate: '' ,companyCode : '',Year_Code : ''};
    const searchParams = new URLSearchParams(location.search);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const company_Code = searchParams.get('companyCode');
    const Company_Name = searchParams.get('Company_Name');
    const Company_GSTNO = sessionStorage.getItem('Company_GSTNO')
    const YearCode = searchParams.get('yearCode');
    const acCode = searchParams.get('acCode');

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [emailId, setEmailId] = useState('');
    const [grandTotals, setGrandTotals] = useState({
        TotalTaxable_Amt: 0,
        CGSTAmt: 0,
        SGSTAmt: 0,
        IGSTAmt: 0,
        BillamountAmt: 0,
        netqntl: 0
    });

    const API_URL = `${apikey}/PurchaseReturn_Register`;

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
                        Company_Code: company_Code,
                        Year_code: YearCode,
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

    useEffect(() => {
        if (reportData.length > 0) {
            const totals = reportData.reduce(
                (acc, item) => {
                    acc.TotalTaxable_Amt += Number(item.subTotal) || 0;
                    acc.CGSTAmt += Number(item.CGSTAmount) || 0;
                    acc.SGSTAmt += Number(item.SGSTAmount) || 0;
                    acc.IGSTAmt += Number(item.IGSTAmount) || 0;
                    acc.BillamountAmt += Number(item.Bill_Amount) || 0;
                    // acc.netqntl += Number(item.NETQNTL) || 0;
                    return acc;
                },
                { TotalTaxable_Amt: 0, CGSTAmt: 0, SGSTAmt: 0, IGSTAmt: 0, BillamountAmt: 0, netqntl: 0 }
            );

            setGrandTotals(totals);
        }
    }, [reportData]);

    const handleExportToExcel = () => {
        const wb = XLSX.utils.book_new();

        const headers = [
            "Our No", "Date", "Bill No", "Account Name", "Taxable Amount", "CGST Amt", "SGST Amt", "IGST Amt", "Bill Amount"
        ];

        const formattedData = reportData.map(item => ({

            "Our No": item.doc_no,
            "Date": formatDate(item.doc_date),
            "Bill No": item.Bill_No,
            "Account Name": item.Ac_Name_E,
            "Taxable Amount": Number(item.subTotal) || 0,
            "CGST Amt": Number(item.CGSTAmount) || 0,
            "SGST Amt": Number(item.SGSTAmount) || 0,
            "IGST Amt": Number(item.IGSTAmount) || 0,
            "Bill Amount": Number(item.Bill_Amount) || 0,

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

        XLSX.utils.book_append_sheet(wb, ws, 'PurchaseReturnRegister');
        XLSX.writeFile(wb, 'PurchaseReturnRegister.xlsx');
    };

    const handlePrint = () => {
        const printContent = document.getElementById('reportTable').outerHTML;
        const win = window.open('', '', 'height=700,width=900');
        win.document.write('<html><head><title>Print Report</title>');
        win.document.write('</head><body>');
        win.document.write(printContent);
        win.document.write('</body></html>');
        win.document.close();
        win.print();
    };


    const generatePDF = async () => {
        const doc = new jsPDF();
        const groupedData = groupReportData(reportData);
        const tableData = [];

        Object.entries(groupedData).forEach(([key, group]) => {
            tableData.push([{ content: key, colSpan: 10, styles: { halign: 'center', fontStyle: 'bold', textColor: [255, 0, 0] } }]);
            group.items.forEach((item) => {
                tableData.push([
                    item.doc_no,
                    formatDate(item.doc_date),
                    item.utr_no,
                    item.amount,
                    item.narration_header,
                    item.utrgradename,
                    item.detailamount,
                    item.usedamount,
                    item.balanceamount
                ]);
            });
            tableData.push([{ content: `${group.totalQty}`, colSpan: 10, styles: { halign: 'right', fontStyle: 'bold' } }, '']);
        });

        doc.autoTable({
            head: [['UTR', 'Date', 'Bank Name', 'UTR Number', 'UTR Amount', 'Narration', 'Grade', 'DEtail Amount', 'Used Amount', 'Balance']],
            body: tableData,
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
            styles: {
                cellPadding: 1,
                fontSize: 10,
                overflow: 'linebreak',
            },
            theme: 'striped'
        });

        return doc.output('blob');
    };


    const groupReportData = (data) => {
        const groupedData = {};
        data.forEach((item) => {
            const key = `${item.saleid}`;
            if (!groupedData[key]) {
                groupedData[key] = {
                    items: [],
                    totalQty: 0,
                };
            }
            groupedData[key].items.push(item);
            groupedData[key].totalQty += parseFloat(item.Bill_Amount) || 0;
        });
        return groupedData;
    };

    const groupedReportData = groupReportData(reportData);

    return (
        <div style={{marginTop:"-80px"}}>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold" }}>{Company_Name}</Typography>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", textDecoration: 'underline', fontWeight: "550" }}>GSTN : {Company_GSTNO}</Typography>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>Purchase TCS Summary</Typography>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px" }}>{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>

            <div className="mb-3 row align-items-center">
                <div className="col-auto">
                    <button className="btn btn-secondary me-2" onClick={handlePrint}>
                        Print Report
                    </button>
                    <button className="btn btn-success" onClick={handleExportToExcel}>
                        Export to Excel
                    </button>
                </div>

            </div>

            <div className="table-responsive">
                <table className="table table-striped table-bordered mt-4" id="reportTable" style={{ marginBottom: "60px" }}>
                    <thead className="table-light">
                        <tr>
                            <th>Our No</th>
                            <th>Date</th>
                            <th>Bill No</th>
                            <th>Account Name</th>
                            <th>Taxable Amount</th>
                            <th>CGST Amount</th>
                            <th>SGST Amount</th>
                            <th>IGST Amount</th>
                            <th>Bill Amount</th>

                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(groupedReportData).map(([key, { items, totalQty }]) => {
                            const [mc, millName] = key.split('-');
                            return (
                                <React.Fragment key={key}>

                                    {items.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.doc_no}</td>
                                            <td>{formatDate(item.doc_date)}</td>
                                            <td>{item.Bill_No}</td>
                                            <td>{item.Ac_Name_E}</td>
                                            <td>
                                                {formatReadableAmount(item.subTotal)}
                                            </td>
                                            <td>{formatReadableAmount(item.CGSTAmount)}</td>
                                            <td>{formatReadableAmount(item.SGSTAmount)}</td>
                                            <td>{formatReadableAmount(item.IGSTAmount)}</td>
                                            <td>{formatReadableAmount(item.Bill_Amount)}</td>

                                        </tr>
                                    ))}

                                </React.Fragment>
                            );
                        })}
                    </tbody>
                    <tr className="grand-total-row">
                        <td className="fw-bold" colSpan={4}> Total</td>
                        <td className="fw-bold text-end">{formatReadableAmount(grandTotals.TotalTaxable_Amt)}</td>
                        <td className="fw-bold text-end">{formatReadableAmount(grandTotals.CGSTAmt)}</td>
                        <td className="fw-bold text-end">{formatReadableAmount(grandTotals.SGSTAmt)}</td>
                        <td className="fw-bold text-end">{formatReadableAmount(grandTotals.IGSTAmt)}</td>
                        <td className="fw-bold text-end">{formatReadableAmount(grandTotals.BillamountAmt)}</td>
                    </tr>
                </table>
            </div>
            {loading && <p>Loading report data...</p>}
            {error && <div className="alert alert-danger">{error}</div>}
        </div>
    );
};

export default SugarPurchaseReturnRegister;
