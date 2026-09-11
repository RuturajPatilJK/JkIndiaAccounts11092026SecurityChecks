// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import * as XLSX from 'xlsx';
// import { jsPDF } from 'jspdf';
// import 'jspdf-autotable';
// import { useNavigate, useLocation } from 'react-router-dom';
// import PdfPreview from '../../../../Common/PDFPreview';
// import { RingLoader } from 'react-spinners';
// import { Typography } from '@mui/material';
// import { FormaDateBalanceSheet } from "../../../../Common/FormatFunctions/FormatDate";
// import { formatReadableAmount } from "../../../../Common/FormatFunctions/FormatAmount";

// const apikey = process.env.REACT_APP_API;

// const DOWiseDispatch = () => {
//     const navigate = useNavigate();
//     const location = useLocation();

//     const searchParams = new URLSearchParams(location.search);
//     const fromDate = searchParams.get('fromDate');
//     const toDate = searchParams.get('toDate');

//     const companyCode = sessionStorage.getItem('Company_Code');
//     const Year_Code = sessionStorage.getItem('Year_Code');
//     const Company_Name = sessionStorage.getItem('Company_Name');
//     const Company_GSTNO = sessionStorage.getItem('Company_GSTNO');

//     const [reportData, setReportData] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');
//     const [pdfPreview, setPdfPreview] = useState(null);

//     const API_URL = `${apikey}/CategoryWiseDispatch-Register`;

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
//                 const sortedData = response.data.sort((a, b) => {
//                     const dateA = new Date(a.doc_dateConverted);
//                     const dateB = new Date(b.doc_dateConverted);

//                     if (dateA - dateB !== 0) {
//                         return dateA - dateB;
//                     }

//                     return (parseInt(a.doc_no) || 0) - (parseInt(b.doc_no) || 0);
//                 });
//                 setReportData(sortedData);
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
//                             font-size: 10px;
//                             table-layout: fixed;
//                             word-wrap: break-word;
//                         }
//                         th, td {
//                             border: 1px solid #ddd;
//                             padding: 4px;
//                             text-align: left;
//                             word-wrap: break-word;
//                             max-width: 100px;
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
//         win.focus();
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
//             '#', 'Date', 'Mill', 'Voucher By', 'Getpass', 'Bill To', 'Bill No', 'Mill Rate',
//             'Quantal', 'Sale Rate', 'Commision', 'Lorry No', 'Frieght', 'Vasuli Amt', 'Transport', 'DO', 'Tender'
//         ]);

//         reportData.forEach((item) => {
//             wsData.push([
//                 item.doc_no,
//                 item.doc_dateConverted,
//                 item.millshortname,
//                 item.voucherbyshortname,
//                 item.getpassshortname,
//                 item.billtoshortname,
//                 item.SB_No,
//                 item.mill_rate,
//                 item.quantal,
//                 item.sale_rate,
//                 item.Tender_Commission,
//                 item.truck_no,
//                 item.Freight_Amount,
//                 item.vasuli_amount1,
//                 item.transportshortname,
//                 item.doshortname,
//                 item.purc_no
//             ]);
//         });

//         // Total row
//         const totalQty = reportData.reduce((sum, item) => sum + parseFloat(item.quantal || 0), 0);
//         wsData.push([]);
//         wsData.push(['', '', '', '', '', '', '', 'Total Qty:', totalQty.toFixed(2)]);

//         const ws = XLSX.utils.aoa_to_sheet(wsData);
//         XLSX.utils.book_append_sheet(wb, ws, 'DOWiseDispatch');
//         XLSX.writeFile(wb, 'DOWiseDispatch.xlsx');
//     };


//     const totalQty = reportData.reduce((sum, item) => sum + parseFloat(item.quantal || 0), 0);

//     return (
//         <div  style={{ marginTop: '-80px' }}>
//             {/* <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold" }}>{Company_Name}</Typography>
//             <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", textDecoration: 'underline', fontWeight: "550" }}>GSTN : {Company_GSTNO}</Typography> */}
//             <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>DO Wise Dispatch</Typography>
//             <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px" }}>{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>

//             <div className="mb-3 row align-items-center">
//                 <div className="col-auto">
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
//                                 <th>#</th>
//                                 <th>Date</th>
//                                 <th>Mill Name</th>
//                                 <th>Voucher By</th>
//                                 <th>Get Pass</th>
//                                 <th>Bill To</th>
//                                 <th>Bill No</th>
//                                 <th>Mill Rate</th>
//                                 <th>Quantal</th>
//                                 <th>Sale Rate</th>
//                                 <th>Commision</th>
//                                 <th>Lorry No</th>
//                                 <th>Frieght</th>
//                                 <th>Vasuli Amount</th>
//                                 <th>Transport</th>
//                                 <th>DO</th>
//                                 <th>Tender No.</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {reportData.map((item, index) => (
//                                 <tr key={index}>
//                                     <td style={{ fontWeight: 'bold' }}>{item.doc_no}</td>
//                                     <td style={{ fontWeight: 'bold' }}>{item.doc_dateConverted}</td>
//                                     <td align="left">{item.millshortname}</td>
//                                     <td align="left">{item.voucherbyshortname}</td>
//                                     <td align="left">{item.getpassshortname}</td>
//                                     <td align="left">{item.billtoshortname}</td>
//                                     <td align="center">{item.SB_No}</td>
//                                     <td align="right">{formatReadableAmount(item.mill_rate)}</td>
//                                     <td align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(item.quantal)}</td>
//                                     <td align="right">{formatReadableAmount(item.sale_rate)}</td>
//                                     <td align="right">{item.Tender_Commission}</td>
//                                     <td align="left">{item.truck_no}</td>
//                                     <td align="right">{item.Freight_Amount}</td>
//                                     <td align="right">{item.vasuli_amount1}</td>
//                                     <td align="left">{item.transportshortname}</td>
//                                     <td align="left">{item.doshortname}</td>
//                                     <td align="right">{item.purc_no}</td>
//                                 </tr>
//                             ))}
//                             <tr style={{ fontWeight: 'bold', backgroundColor: '#f0f8ff' }}>
//                                 <td colSpan={8} align="right">Total Qty:</td>
//                                 <td>{totalQty.toFixed(2)}</td>
//                                 <td colSpan={7}></td>
//                             </tr>
//                         </tbody>
//                     </table>
//                 </div>
//             )}

//             {pdfPreview && (
//                 <div className="centered-container">
//                     <PdfPreview pdfData={pdfPreview} apiData={reportData} label={'TransportWiseDispatch'} />
//                 </div>
//             )}
//         </div>
//     );
// };

// export default DOWiseDispatch;

















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

const SCREEN_COLUMNS = [
    { label: '#', key: 'doc_no', width: '50px' },
    { label: 'Date', key: 'doc_dateConverted', width: '90px' },
    { label: 'Mill Name', key: 'millshortname', width: '150px' },
    { label: 'Voucher By', key: 'voucherbyshortname', width: '150px' },
    { label: 'Get Pass', key: 'getpassshortname', width: '150px' },
    { label: 'Bill To', key: 'billtoshortname', width: '150px' },
    { label: 'Bill No', key: 'SB_No', width: '80px' },
    { label: 'Mill Rate', key: 'mill_rate', width: '80px', numeric: true },
    { label: 'Quantal', key: 'quantal', width: '80px', numeric: true, isTotal: true },
    { label: 'Sale Rate', key: 'sale_rate', width: '80px', numeric: true },
    { label: 'Lorry No', key: 'truck_no', width: '100px' },
    { label: 'Frieght', key: 'Freight_Amount', width: '80px', numeric: true },
    { label: 'Vasuli', key: 'vasuli_amount1', width: '80px', numeric: true },
    { label: 'Tender', key: 'purc_no', width: '70px' },
];

const PRINT_COLUMNS = [
    { label: '#', key: 'doc_no', printWidth: 15 },
    { label: 'Date', key: 'doc_dateConverted', printWidth: 22 },
    { label: 'Mill', key: 'millshortname', printWidth: 35 },
    { label: 'Voucher By', key: 'voucherbyshortname', printWidth: 35 },
    { label: 'Quantal', key: 'quantal', printWidth: 20, numeric: true, isTotal: true },
    { label: 'Mill Rate', key: 'mill_rate', printWidth: 18, numeric: true },
    { label: 'Sale Rate', key: 'sale_rate', printWidth: 18, numeric: true },
    { label: 'Lorry No', key: 'truck_no', printWidth: 25 },
    { label: 'Bill No', key: 'SB_No', printWidth: 15 },
];

const DOWiseDispatch = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const companyCode = sessionStorage.getItem('Company_Code');
    const Year_Code = sessionStorage.getItem('Year_Code');
    const Company_Name = sessionStorage.getItem("Company_Name");
    const Company_GSTNO = sessionStorage.getItem('Company_GSTNO');

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [error, setError] = useState('');
    const [pdfPreview, setPdfPreview] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'doc_no', direction: 'asc' });

    const API_URL = `${apikey}/CategoryWiseDispatch-Register`;

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

    const filteredAndSortedData = useMemo(() => {
        let items = [...reportData];
        if (searchTerm) {
            items = items.filter((item) =>
                Object.values(item).some((val) =>
                    String(val).toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }
        if (sortConfig.key) {
            items.sort((a, b) => {
                const va = a[sortConfig.key] || 0;
                const vb = b[sortConfig.key] || 0;
                if (va < vb) return sortConfig.direction === 'asc' ? -1 : 1;
                if (va > vb) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return items;
    }, [reportData, sortConfig, searchTerm]);

    const grandTotals = useMemo(() => {
        const totals = {};
        SCREEN_COLUMNS.filter(c => c.isTotal).forEach(c => totals[c.key] = 0);
        filteredAndSortedData.forEach(item => {
            SCREEN_COLUMNS.filter(c => c.isTotal).forEach(c => {
                totals[c.key] += parseFloat(item[c.key]) || 0;
            });
        });
        return totals;
    }, [filteredAndSortedData]);

    const requestSort = (key) =>
        setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));

    const handleGeneratePDF = () => {
        setIsPrinting(true);
        const rows = filteredAndSortedData.map(item => 
            PRINT_COLUMNS.map(col => col.numeric ? formatReadableAmount(item[col.key]) : item[col.key])
        );

        generateReportPDF({
            title: 'DO Wise Dispatch Report',
            subtitle: `Period: ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`,
            columns: PRINT_COLUMNS.map(c => c.label),
            rows: rows,
            // Custom styles to ensure horizontal lines show clearly
            tableStyles: {
                lineWidth: 0.1,
                lineColor: [200, 200, 200], // Light grey lines
            },
            headerStyles: {
                fillColor: [26, 35, 126],
                textColor: [255, 255, 255],
                lineWidth: 0.1,
            },
            footerRow: PRINT_COLUMNS.map(col => {
                if (col.isTotal) {
                    return { 
                        content: formatReadableAmount(grandTotals[col.key]), 
                        styles: { halign: 'right', fontStyle: 'bold', fillColor: [255, 249, 196], lineWidth: 0.1 } 
                    };
                }
                return col.label === '#' ? { content: 'TOTAL', styles: { fontStyle: 'bold', fillColor: [255, 249, 196], lineWidth: 0.1 } } : '';
            }),
            headerImgSrc: HeaderJK,
            footerImgSrc: FooterJK,
            numericCols: PRINT_COLUMNS.map((c, i) => c.numeric ? i : null).filter(i => i !== null),
            onComplete: (url) => {
                setPdfPreview(url);
                setIsPrinting(false);
            },
        });
    };

    const handleExportToExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [
            [Company_Name?.toUpperCase()],
            [`GST No: ${Company_GSTNO}`],
            [`DO Wise Dispatch Report`],
            [`Period: ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`],
            [],
            SCREEN_COLUMNS.map(c => c.label)
        ];

        filteredAndSortedData.forEach(item => {
            wsData.push(SCREEN_COLUMNS.map(c => c.numeric ? (parseFloat(item[c.key]) || 0) : item[c.key]));
        });

        const totalRow = new Array(SCREEN_COLUMNS.length).fill("");
        totalRow[0] = "GRAND TOTAL:";
        SCREEN_COLUMNS.forEach((c, i) => { if (c.isTotal) totalRow[i] = grandTotals[c.key]; });
        wsData.push(totalRow);

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'DOWiseDispatch');
        XLSX.writeFile(wb, `DO_Wise_Dispatch.xlsx`);
    };

    return (
        <Box sx={{ padding: '15px', marginTop: "-80px" }}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ textDecoration: 'underline', fontWeight: 'bold' }}>DO Wise Dispatch</Typography>
                <Typography variant="subtitle3">
                   {FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
                <CommonSearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search records..." />
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <button className="btn btn-danger btn-sm" onClick={handleGeneratePDF} disabled={isPrinting}>
                        {isPrinting ? 'Wait...' : 'Print PDF'}
                    </button>
                    <button className="btn btn-success btn-sm" onClick={handleExportToExcel}>Export Excel</button>
                </Box>
            </Box>

            <TableContainer component={Paper} sx={{ maxHeight: '700px', boxShadow: 5 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {SCREEN_COLUMNS.map(col => (
                                <TableCell 
                                    key={col.key} 
                                    align={col.numeric ? 'right' : 'left'} 
                                    sx={{ 
                                        backgroundColor: '#1a237e !important', 
                                        color: '#fff !important', 
                                        fontWeight: 'bold', 
                                        fontSize: '12px',
                                        minWidth: col.width,
                                        // Prevents header text from being cut
                                        whiteSpace: 'normal',
                                        wordBreak: 'break-word'
                                    }}
                                >
                                    <TableSortLabel 
                                        active={sortConfig.key === col.key} 
                                        direction={sortConfig.direction} 
                                        onClick={() => requestSort(col.key)} 
                                        sx={{ 
                                            '& .MuiTableSortLabel-icon': { color: '#fff !important' }, 
                                            color: '#fff !important' 
                                        }}
                                    >
                                        {col.label}
                                    </TableSortLabel>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredAndSortedData.map((item, idx) => (
                            <TableRow key={idx} hover sx={{ borderBottom: '1px solid #e0e0e0' }}>
                                {SCREEN_COLUMNS.map(col => (
                                    <TableCell 
                                        key={col.key} 
                                        align={col.numeric ? 'right' : 'left'} 
                                        sx={{ 
                                            fontSize: '11px',
                                            // FIX: Prevent cutting, allow wrapping
                                            whiteSpace: 'normal', 
                                            wordBreak: 'break-word',
                                            padding: '8px 4px'
                                        }}
                                    >
                                        {col.numeric ? formatReadableAmount(item[col.key]) : item[col.key]}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter sx={{ position: 'sticky', bottom: 0, zIndex: 10, backgroundColor: '#fff9c4' }}>
                        <TableRow sx={{ borderTop: '2px solid #1a237e' }}>
                            <TableCell colSpan={7} sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>GRAND TOTAL</TableCell>
                            {SCREEN_COLUMNS.slice(7).map(col => (
                                <TableCell key={col.key} align={col.numeric ? 'right' : 'left'} sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                                    {col.isTotal ? formatReadableAmount(grandTotals[col.key]) : ''}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableFooter>
                </Table>
            </TableContainer>

            {pdfPreview && <PdfPreview pdfData={pdfPreview} label="DowiseCategoryDispatch" />}
            
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

export default DOWiseDispatch;
