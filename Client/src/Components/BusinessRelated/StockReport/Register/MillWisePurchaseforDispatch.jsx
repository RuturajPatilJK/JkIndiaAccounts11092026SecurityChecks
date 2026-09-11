// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import * as XLSX from 'xlsx';
// import { jsPDF } from 'jspdf';
// import 'jspdf-autotable';
// import { useNavigate, useLocation } from 'react-router-dom';
// import PdfPreview from '../../../../Common/PDFPreview';
// import { RingLoader } from 'react-spinners';
// import { Typography } from '@mui/material';
// import { formatReadableAmount } from "../../../../Common/FormatFunctions/FormatAmount";
// import { FormaDateBalanceSheet } from "../../../../Common/FormatFunctions/FormatDate"

// const apikey = process.env.REACT_APP_API;

// const MillWisePurchaseDispatch = () => {
//     const navigate = useNavigate();
//     const location = useLocation();

//     const searchParams = new URLSearchParams(location.search);
//     const fromDate = searchParams.get('fromDate');
//     const toDate = searchParams.get('toDate');

//     const companyCode = sessionStorage.getItem('Company_Code');
//     const Year_Code = sessionStorage.getItem('Year_Code');
//     const Company_Name = sessionStorage.getItem('Company_Name');
//     const Company_GSTNO = sessionStorage.getItem('Company_GSTNO')

//     const [reportData, setReportData] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');
//     const [pdfPreview, setPdfPreview] = useState(null);

//     const API_URL = `${apikey}/MillWisePurchaseDispatch-Register`;

//     useEffect(() => {
//         const fetchReportData = async () => {
//             setLoading(true);
//             setError('');
//             try {
//                 const response = await axios.get(API_URL, {
//                     params: {
//                         fromDT: fromDate,
//                         toDT: toDate,
//                         Company_Code: companyCode,
//                         Year_Code: Year_Code,
//                     },
//                 });
//                 setReportData(response.data);
//             } catch (error) {
//                 console.error('Error fetching report:', error);
//                 setError('Error fetching report');
//             } finally {
//                 setLoading(false);
//             }
//         };

//         if (fromDate && toDate) {
//             fetchReportData();
//         }
//     }, [fromDate, toDate, companyCode, Year_Code]);

//     const handlePrint = () => {
//         const printContent = document.getElementById('reportTable').outerHTML;
//         const win = window.open('', '', 'height=700,width=900');
//         win.document.write(`
//             <html>
//                 <head>
//                     <title>Print Report</title>
//                     <style>
//                         body {
//                             font-family: Arial, sans-serif;
//                             margin: 20px;
//                         }
//                         .company-name {
//                             text-align: center;
//                             font-size: 24px;
//                             font-weight: bold;
//                             margin-bottom: 20px;
//                             color: #333;
//                         }
//                         table {
//                             width: 100%;
//                             border-collapse: collapse;
//                             margin-bottom: 20px;
//                         }
//                         th, td {
//                             border: 1px solid #ddd;
//                             padding: 8px;
//                             text-align: left;
//                         }
//                         th {
//                             background-color: #f2f2f2;
//                             font-weight: bold;
//                         }
//                         tr:nth-child(even) {
//                             background-color: #f9f9f9;
//                         }
//                         .total-row {
//                             background-color: #e0f7fa;
//                             font-weight: bold;
//                         }
//                     </style>
//                 </head>
//                 <body>
//                     <div class="company-name">${Company_Name}</div>
//                     ${printContent}
//                 </body>
//             </html>
//         `);
//         win.document.close();
//         win.print();
//     };

//     const generatePdf = () => {
//         const doc = new jsPDF();
//         const pageWidth = doc.internal.pageSize.getWidth();
//         const textWidth = doc.getTextWidth(Company_Name);
//         const xPosition = (pageWidth - textWidth) / 2;

//         doc.text(Company_Name, xPosition, 10);
//         doc.autoTable({ html: '#reportTable' });

//         const pdfBlob = doc.output('blob');
//         const url = URL.createObjectURL(pdfBlob);
//         setPdfPreview(url);
//     };

//     const handleExportToExcel = () => {
//         const wb = XLSX.utils.book_new();
//         const wsData = [];

//         wsData.push([Company_Name]);
//         wsData.push([]);

//         wsData.push([
//             'Doc No', 'Date', 'Qunatal', 'Mill Rate', 'Amount', 'TDS Amount',
//             'CGST Amount', 'SGST Amount', 'IGST Amount', 'Bill Amount',
//             'TCS Amount', 'Net Payable', 'Narration'
//         ]);

//         Object.entries(groupedReportData).forEach(([groupKey, { items }]) => {
//             wsData.push([groupKey]);

//             let totalQty = 0;
//             let totalAmount = 0;
//             let totalTDAmt = 0;
//             let totalCGSTAmt = 0;
//             let totalSGSTAmt = 0;
//             let totalIGSTAmt = 0;
//             let totalBillAmt = 0;
//             let totalTCsAmt = 0;
//             let totalNetAmt = 0;

//             items.forEach(item => {
//                 const quantal = parseFloat(item.NETQNTL || 0);
//                 const rate = parseFloat(item.subTotal / item.NETQNTL || 0);
//                 const amount = parseFloat(item.Quantal * rate || 0);

//                 totalQty += quantal;
//                 totalAmount += amount;
//                 totalTDAmt += parseFloat(item.TDS_Amt || 0);
//                 totalCGSTAmt += parseFloat(item.CGSTAmount || 0);
//                 totalSGSTAmt += parseFloat(item.SGSTAmount || 0);
//                 totalIGSTAmt += parseFloat(item.IGSTAmount || 0);
//                 totalBillAmt += parseFloat(item.Bill_Amount || 0);
//                 totalTCsAmt += parseFloat(item.TCS_Amt || 0);
//                 totalNetAmt += parseFloat(item.TCS_Net_Payable || 0);

//                 wsData.push([
//                     item.doc_no,
//                     item.doc_dateConverted,
//                     item.NETQNTL,
//                     rate.toFixed(2),
//                     amount.toFixed(2),
//                     item.TDS_Amt,
//                     item.CGSTAmount,
//                     item.SGSTAmount,
//                     item.IGSTAmount,
//                     item.Bill_Amount,
//                     item.TCS_Amt,
//                     item.TCS_Net_Payable,
//                     `${item.LORRYNO || ''} - ${item.SupplierShortname || ''}`
//                 ]);
//             });

//             wsData.push([
//                 '', '', totalQty.toFixed(2), '', totalAmount.toFixed(2),
//                 totalTDAmt.toFixed(2), totalCGSTAmt.toFixed(2), totalSGSTAmt.toFixed(2),
//                 totalIGSTAmt.toFixed(2), totalBillAmt.toFixed(2), totalTCsAmt.toFixed(2),
//                 totalNetAmt.toFixed(2), ''
//             ]);
//             wsData.push([]);
//         });

//         const ws = XLSX.utils.aoa_to_sheet(wsData);
//         XLSX.utils.book_append_sheet(wb, ws, 'MillWiseDispatch');

//         XLSX.writeFile(wb, 'MillWiseDispatch.xlsx');
//     };


//     const groupReportData = (data) => {
//         if (!Array.isArray(data)) return {};
//         const grouped = {};
//         data.forEach(item => {
//             const key = `${item.mill_code}-${item.millname}`;
//             if (!grouped[key]) {
//                 grouped[key] = { items: [] };
//             }
//             grouped[key].items.push(item);
//         });
//         return grouped;
//     };

//     const groupedReportData = groupReportData(reportData);

//     return (
//         <div style={{ marginTop: '-80px' }}>
//             {/* <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold" }}>{Company_Name}</Typography>
//             <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", textDecoration: 'underline', fontWeight: "550" }}>GSTN : {Company_GSTNO}</Typography>
//          */}

//             <div className="d-flex justify-content-between align-items-center">
//                 <div style={{ flex: 1, textAlign: 'center', marginLeft: "280px" }}>
//                     <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>Mill Wise Purchase</Typography>
//                     <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px" }}>{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>
//                 </div>

//                 <div className="d-flex justify-content-end">
//                     <button className="btn btn-secondary me-2" onClick={handlePrint}>Print Report</button>
//                     <button className="btn btn-success me-2" onClick={handleExportToExcel}>Export to Excel</button>
//                 </div>
//             </div>

//             {loading ? (
//                 <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
//                     <RingLoader />
//                 </div>
//             ) : error ? (
//                 <div className="alert alert-danger">{error}</div>
//             ) : (
//                 <div style={{ maxHeight: "800px", overflowY: "auto" }}>
//                     <table className="table table-striped table-bordered mt-4" id="reportTable" style={{ marginBottom: "60px", width: "100%" }}>
//                         <thead className="table-light" style={{ position: "sticky", top: 0, backgroundColor: "#fff", zIndex: 1, whiteSpace: "nowrap" }}>
//                             <tr>
//                                 <th>No</th>
//                                 <th>Date</th>
//                                 <th>Qunatal</th>
//                                 <th>Mill Rate</th>
//                                 <th>Amount</th>
//                                 <th>TDS Amount</th>
//                                 <th>CGST Amount</th>
//                                 <th>SGST Amount</th>
//                                 <th>IGST Amount</th>
//                                 <th>Bill Amount</th>
//                                 <th>TCS Amount</th>
//                                 <th>Net Payable</th>
//                                 <th>Narration</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {Object.entries(groupedReportData).map(([key, { items }]) => {
//                                 const totalQty = items.reduce((sum, item) => sum + parseFloat(item.NETQNTL || 0), 0);
//                                 const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.Quantal * (item.subTotal / item.NETQNTL) || 0), 0);
//                                 const totalTDAmt = items.reduce((sum, item) => sum + parseFloat(item.TDS_Amt || 0), 0);
//                                 const totalTCsAmt = items.reduce((sum, item) => sum + parseFloat(item.TCS_Amt || 0), 0);
//                                 const totalCGSTAmt = items.reduce((sum, item) => sum + parseFloat(item.CGSTAmount || 0), 0);
//                                 const totalSGSTAmt = items.reduce((sum, item) => sum + parseFloat(item.SGSTAmount || 0), 0);
//                                 const totalIGSTAmt = items.reduce((sum, item) => sum + parseFloat(item.IGSTAmount || 0), 0);
//                                 const totalBillAmt = items.reduce((sum, item) => sum + parseFloat(item.Bill_Amount || 0), 0);
//                                 const totalNetAmt = items.reduce((sum, item) => sum + parseFloat(item.TCS_Net_Payable || 0), 0);

//                                 return (
//                                     <React.Fragment key={key}>
//                                         <tr>
//                                             <td colSpan={15} align="left" className="table-primary" style={{ color: 'blue', fontWeight: 'bold' }}>{key}</td>
//                                         </tr>
//                                         {items.map((item, index) => (
//                                             <tr key={index}>
//                                                 <td style={{ fontWeight: 'bold' }} align='center'>{item.doc_no}</td>
//                                                 <td style={{ fontWeight: 'bold' }} align='center'>{item.doc_dateConverted}</td>
//                                                 <td align="right">{formatReadableAmount(item.NETQNTL)}</td>
//                                                 <td align="right">{(parseFloat(item.NETQNTL) > 0 && !isNaN(parseFloat(item.subTotal)))
//                                                     ? (parseFloat(item.subTotal) / parseFloat(item.NETQNTL)).toFixed(2)
//                                                     : '0.00'}</td>
//                                                 <td align="right">
//                                                     {(() => {
//                                                         const subTotal = Number(item.subTotal) || 0;
//                                                         const netQntl = Number(item.NETQNTL) || 0;
//                                                         const quantal = Number(item.Quantal) || 0;

//                                                         if (netQntl !== 0) {
//                                                             return (quantal * (subTotal / netQntl)).toFixed(2);
//                                                         }
//                                                         return '0.00';
//                                                     })()}
//                                                 </td>
//                                                 <td align="right">{formatReadableAmount(item.TDS_Amt)}</td>
//                                                 <td align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(item.CGSTAmount)}</td>
//                                                 <td align="right">{formatReadableAmount(item.SGSTAmount)}</td>
//                                                 <td align="right">{formatReadableAmount(item.IGSTAmount)}</td>
//                                                 <td align="right">{formatReadableAmount(item.Bill_Amount)}</td>
//                                                 <td align="right">{formatReadableAmount(item.TCS_Amt)}</td>
//                                                 <td align="right">{formatReadableAmount(item.TCS_Net_Payable)}</td>
//                                                 <td align="left">{`${item.LORRYNO || ''} - ${item.SupplierShortname || ''}`}</td>

//                                             </tr>
//                                         ))}
//                                         <tr style={{ fontWeight: 'bold', backgroundColor: '#f0f8ff' }}>
//                                             <td colSpan={2} align="right">Total :</td>
//                                             <td align="right">{formatReadableAmount(totalQty.toFixed(2))}</td>
//                                             <td></td>
//                                             <td align="right">{formatReadableAmount(totalAmount.toFixed(2))}</td>
//                                             <td align="right">{formatReadableAmount(totalTDAmt.toFixed(2))}</td>
//                                             <td align="right">{formatReadableAmount(totalCGSTAmt.toFixed(2))}</td>
//                                             <td align="right">{formatReadableAmount(totalSGSTAmt.toFixed(2))}</td>
//                                             <td align="right">{formatReadableAmount(totalIGSTAmt.toFixed(2))}</td>
//                                             <td align="right">{formatReadableAmount(totalBillAmt.toFixed(2))}</td>
//                                             <td align="right">{formatReadableAmount(totalTCsAmt.toFixed(2))}</td>
//                                             <td align="right">{formatReadableAmount(totalNetAmt.toFixed(2))}</td>
//                                         </tr>
//                                     </React.Fragment>
//                                 );
//                             })}
//                         </tbody>
//                     </table>
//                 </div>
//             )}

//             {pdfPreview && (
//                 <div className="centered-container">
//                     <PdfPreview pdfData={pdfPreview} apiData={reportData} label={'NewDispatchRegister'} />
//                 </div>
//             )}
//         </div>
//     );
// };

// export default MillWisePurchaseDispatch;




















import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as XLSX from 'xlsx';
import { useLocation } from 'react-router-dom';
import { formatReadableAmount } from '../../../../Common/FormatFunctions/FormatAmount';
import { ScaleLoader } from 'react-spinners';
import {
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, Typography, TableSortLabel, TableFooter, Box
} from '@mui/material';
import { FormaDateBalanceSheet } from '../../../../Common/FormatFunctions/FormatDate';
import PdfPreview from '../../../../Common/PDFPreview';
import HeaderJK from '../../../../Assets/HeaderJK.png';
import FooterJK from '../../../../Assets/FooterJK.png';
import { generateReportPDF } from '../../../../Common/ReportCommon/CommonPDFGenerator';
import CommonSearchBar from '../../../../Common/SearchBar/ReportSearchBar';

const apikey = process.env.REACT_APP_API;

// Full columns for UI display
const SCREEN_COLUMNS = [
    { label: 'No', key: 'doc_no', width: '5%' },
    { label: 'Date', key: 'doc_dateConverted', width: '8%' },
    { label: 'Quintal', key: 'NETQNTL', width: '8%', numeric: true },
    { label: 'Mill Rate', key: 'mill_rate', width: '8%', numeric: true },
    { label: 'Amount', key: 'Amount', width: '10%', numeric: true },
    { label: 'TDS', key: 'TDS_Amt', width: '7%', numeric: true },
    { label: 'CGST', key: 'CGSTAmount', width: '7%', numeric: true },
    { label: 'SGST', key: 'SGSTAmount', width: '7%', numeric: true },
    { label: 'IGST', key: 'IGSTAmount', width: '7%', numeric: true },
    { label: 'Bill Amt', key: 'Bill_Amount', width: '10%', numeric: true },
    { label: 'Net Payable', key: 'TCS_Net_Payable', width: '10%', numeric: true },
];

// Limited columns for PDF Print to ensure it fits on A4
const PRINT_COLUMNS = [
    { label: 'Do No', key: 'doc_no' },
    { label: 'Date', key: 'doc_dateConverted' },
    { label: 'Quintal', key: 'NETQNTL', numeric: true },
    { label: 'Mill Rate', key: 'mill_rate', numeric: true },
    { label: 'TDS', key: 'TDS_Amt', numeric: true },
    { label: 'CGST', key: 'CGSTAmount', numeric: true },
    { label: 'SGST', key: 'SGSTAmount', numeric: true },
    { label: 'IGST', key: 'IGSTAmount', numeric: true },
    { label: 'Bill Amount', key: 'Bill_Amount', numeric: true },
];

const MillWisePurchaseDispatch = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const companyCode = sessionStorage.getItem('Company_Code');
    const Year_Code = sessionStorage.getItem('Year_Code');
    const Company_Name = sessionStorage.getItem('Company_Name');

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [error, setError] = useState('');
    const [pdfPreview, setPdfPreview] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'doc_no', direction: 'asc' });

    const API_URL = `${apikey}/MillWisePurchaseDispatch-Register`;

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {
                const res = await axios.get(API_URL, {
                    params: { fromDT: fromDate, toDT: toDate, Company_Code: companyCode, Year_Code: Year_Code },
                });
                setReportData(Array.isArray(res.data) ? res.data : []);
            } catch (err) { setError('Error fetching report'); }
            finally { setLoading(false); }
        };
        if (fromDate && toDate) fetchReportData();
    }, [fromDate, toDate, companyCode, Year_Code]);

    // Data Calculation and Filtering
    const processedData = useMemo(() => {
        return reportData.map(item => {
            const netQntl = parseFloat(item.NETQNTL || 0);
            const subTotal = parseFloat(item.subTotal || 0);
            const quantal = parseFloat(item.Quantal || 0);
            const rate = netQntl !== 0 ? (subTotal / netQntl) : 0;
            const amount = netQntl !== 0 ? (quantal * rate) : 0;

            return {
                ...item,
                mill_rate: rate.toFixed(2),
                Amount: amount.toFixed(2)
            };
        });
    }, [reportData]);

    const filteredAndSortedData = useMemo(() => {
        let items = [...processedData];
        if (searchTerm) {
            items = items.filter((item) =>
                Object.values(item).some((val) => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        return items.sort((a, b) => {
            const va = a[sortConfig.key] || 0;
            const vb = b[sortConfig.key] || 0;
            if (va < vb) return sortConfig.direction === 'asc' ? -1 : 1;
            if (va > vb) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [processedData, sortConfig, searchTerm]);

    // Grouping Logic
    const { groupedData, grandTotals } = useMemo(() => {
        const groups = {};
        const grand = { NETQNTL: 0, Amount: 0, TDS_Amt: 0, CGSTAmount: 0, SGSTAmount: 0, IGSTAmount: 0, Bill_Amount: 0, TCS_Amt: 0, TCS_Net_Payable: 0 };

        filteredAndSortedData.forEach(item => {
            const key = `${item.mill_code}-${item.millname}`;
            if (!groups[key]) {
                groups[key] = { items: [], totals: { NETQNTL: 0, Amount: 0, TDS_Amt: 0, CGSTAmount: 0, SGSTAmount: 0, IGSTAmount: 0, Bill_Amount: 0, TCS_Amt: 0, TCS_Net_Payable: 0 } };
            }
            groups[key].items.push(item);

            // Increment totals
            Object.keys(grand).forEach(field => {
                const val = parseFloat(item[field] || 0);
                groups[key].totals[field] += val;
                grand[field] += val;
            });
        });
        return { groupedData: groups, grandTotals: grand };
    }, [filteredAndSortedData]);

    const handleGeneratePDF = () => {
        setIsPrinting(true);
        const rows = [];

        Object.entries(groupedData).forEach(([millName, group]) => {
            rows.push([{ content: `Mill: ${millName}`, colSpan: PRINT_COLUMNS.length, styles: { fillColor: [232, 234, 246], fontStyle: 'bold' } }]);

            group.items.forEach(item => {
                rows.push(PRINT_COLUMNS.map(col => col.numeric ? formatReadableAmount(item[col.key]) : item[col.key]));
            });

            rows.push(PRINT_COLUMNS.map(col => {
                if (group.totals[col.key] !== undefined && col.numeric) {
                    return { content: formatReadableAmount(group.totals[col.key].toFixed(2)), styles: { halign: 'right', fontStyle: 'bold' } };
                }
                return col.key === 'doc_dateConverted' ? { content: 'Sub Total:', styles: { fontStyle: 'bold' } } : '';
            }));
        });

        generateReportPDF({
            title: 'Mill Wise Purchase Register',
            subtitle: `${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`,
            columns: PRINT_COLUMNS.map(c => c.label),
            rows,
            footerRow: PRINT_COLUMNS.map(col => {
                if (grandTotals[col.key] !== undefined && col.numeric) {
                    return { content: formatReadableAmount(grandTotals[col.key].toFixed(2)), styles: { halign: 'right', fontStyle: 'bold', fillColor: [255, 249, 196] } };
                }
                return col.key === 'doc_no' ? { content: 'GRAND TOTAL', styles: { fontStyle: 'bold', fillColor: [255, 249, 196] } } : '';
            }),
            headerImgSrc: HeaderJK,
            footerImgSrc: FooterJK,
            numericCols: PRINT_COLUMNS.map((c, i) => c.numeric ? i : null).filter(i => i !== null),
            onComplete: (url) => { setPdfPreview(url); setIsPrinting(false); }
        });
    };

    const handleExportToExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [[Company_Name?.toUpperCase()], ["Mill Wise Purchase Report"], [`Period: ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`], [], SCREEN_COLUMNS.map(c => c.label)];

        Object.entries(groupedData).forEach(([mill, group]) => {
            wsData.push([`Mill: ${mill}`]);
            group.items.forEach(item => {
                wsData.push(SCREEN_COLUMNS.map(col => item[col.key]));
            });
            wsData.push(["", "Sub Total:", group.totals.NETQNTL.toFixed(2), "", group.totals.Amount.toFixed(2), group.totals.TDS_Amt.toFixed(2), group.totals.CGSTAmount.toFixed(2), group.totals.SGSTAmount.toFixed(2), group.totals.IGSTAmount.toFixed(2), group.totals.Bill_Amount.toFixed(2), group.totals.TCS_Amt.toFixed(2), group.totals.TCS_Net_Payable.toFixed(2)]);
            wsData.push([]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'MillWisePurchase');
        XLSX.writeFile(wb, `MillWisePurchase.xlsx`);
    };

    return (
        <Box sx={{ padding: '15px', marginTop: "-80px" }}>
            <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ textDecoration: 'underline', fontWeight: 'bold' }}>Mill Wise Purchase Register</Typography>
                <Typography variant="subtitle2">{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <CommonSearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search Mill or Doc No..." />
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <button className="btn btn-danger btn-sm" onClick={handleGeneratePDF} disabled={isPrinting}>Print PDF</button>
                    <button className="btn btn-success btn-sm" onClick={handleExportToExcel}>Export Excel</button>
                </Box>
            </Box>

            <TableContainer component={Paper} sx={{ maxHeight: '700px', boxShadow: 5 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {SCREEN_COLUMNS.map(col => (
                                <TableCell key={col.key} align={col.numeric ? 'right' : 'left'}
                                    style={{ backgroundColor: '#1a237e', color: '#fff', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                    <TableSortLabel
                                        active={sortConfig.key === col.key} direction={sortConfig.direction}
                                        onClick={() => setSortConfig({ key: col.key, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                                        sx={{ '& .MuiTableSortLabel-icon': { color: '#fff !important' }, color: '#fff !important' }}>
                                        {col.label}
                                    </TableSortLabel>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Object.entries(groupedData).map(([mill, group]) => (
                            <React.Fragment key={mill}>
                                <TableRow>
                                    <TableCell colSpan={SCREEN_COLUMNS.length} sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', color: '#1a237e' }}>
                                        Mill: {mill}
                                    </TableCell>
                                </TableRow>
                                {group.items.map((item, idx) => (
                                    <TableRow key={idx} hover>
                                        {SCREEN_COLUMNS.map(col => (
                                            <TableCell key={col.key} align={col.numeric ? 'right' : 'left'}>
                                                {col.numeric ? formatReadableAmount(item[col.key]) : item[col.key]}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                                <TableRow sx={{ backgroundColor: '#e1f5fe' }}>
                                    <TableCell colSpan={2} align="right" sx={{ fontWeight: 'bold' }}>Total Quintal:</TableCell>
                                    {SCREEN_COLUMNS.slice(2).map(col => (
                                        <TableCell key={col.key} align="right" sx={{ fontWeight: 'bold' }}>
                                            {group.totals[col.key] !== undefined ? formatReadableAmount(group.totals[col.key].toFixed(2)) : ''}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </React.Fragment>
                        ))}
                    </TableBody>
                    <TableFooter sx={{ position: 'sticky', bottom: 0, zIndex: 10, backgroundColor: '#fff9c4' }}>
                        <TableRow>
                            <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>GRAND TOTAL</TableCell>
                            {SCREEN_COLUMNS.slice(2).map(col => (
                                <TableCell key={col.key} align="right" sx={{ fontWeight: 'bold' }}>
                                    {grandTotals[col.key] !== undefined ? formatReadableAmount(grandTotals[col.key].toFixed(2)) : ''}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableFooter>
                </Table>
            </TableContainer>

            {pdfPreview && <PdfPreview pdfData={pdfPreview} label="MillWisePurchase" />}

            {(loading || isPrinting) && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <ScaleLoader color="#1a237e" size={60} />
                        <Typography sx={{ mt: 2, fontWeight: 'bold', color: '#1a237e' }}>
                            {isPrinting ? "Generating PDF..." : "Loading Data..."}
                        </Typography>
                    </Box>
                </div>
            )}
        </Box>
    );
};

export default MillWisePurchaseDispatch;