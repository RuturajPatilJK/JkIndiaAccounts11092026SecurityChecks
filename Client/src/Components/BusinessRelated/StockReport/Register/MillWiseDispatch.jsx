// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import * as XLSX from 'xlsx';
// import { jsPDF } from 'jspdf';
// import 'jspdf-autotable';
// import { useNavigate, useLocation } from 'react-router-dom';
// import PdfPreview from '../../../../Common/PDFPreview';
// import { RingLoader } from 'react-spinners';
// import { Typography } from '@mui/material';
// import { FormaDateBalanceSheet } from "../../../../Common/FormatFunctions/FormatDate"
// import { formatReadableAmount } from "../../../../Common/FormatFunctions/FormatAmount";

// const apikey = process.env.REACT_APP_API;

// const MillWiseDispatch = () => {
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

//         // Company name and spacing
//         wsData.push([Company_Name]);
//         wsData.push([]);

//         // Table headers (match HTML)
//         wsData.push([
//             '#', 'Date', 'Mill', 'Voucher By', 'Getpass', 'Mill Rate', 'Quantal',
//             'Sale Rate', 'Lorry No', 'Freight', 'Vasuli Amt', 'Transport', 'DO', 'Tender'
//         ]);

//         Object.entries(groupedReportData).forEach(([groupKey, { items }]) => {
//             // Group header
//             wsData.push([groupKey]);
//             let totalQty = 0;

//             items.forEach((item, index) => {
//                 const quantal = parseFloat(item.quantal || 0);
//                 totalQty += quantal;

//                 wsData.push([
//                     item.doc_no,
//                     item.doc_dateConverted,
//                     item.millshortname,
//                     item.voucherbyshortname,
//                     item.getpassshortname,
//                     item.mill_rate,
//                     quantal,
//                     item.sale_rate,
//                     item.truck_no,
//                     item.Freight_Amount,
//                     item.vasuli_amount1,
//                     item.transportshortname,
//                     item.doshortname,
//                     item.purc_no
//                 ]);
//             });

//             // Total row
//             wsData.push([
//                 '', '', '', '', 'Total Qty:', '', totalQty.toFixed(2),
//                 '', '', '', '', '', '', ''
//             ]);

//             // Spacer row
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
//             <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", textDecoration: 'underline', fontWeight: "550" }}>GSTN : {Company_GSTNO}</Typography> */}

//             <div className="d-flex justify-content-between align-items-center">
//                 <div style={{ flex: 1, textAlign: 'center',marginLeft: "280px"  }}>
//                     <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>Mill Wise Dispatch</Typography>
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
//                                 <th>#</th>
//                                 <th>Date</th>
//                                 <th>Mill Name</th>
//                                 <th>Voucher By</th>
//                                 <th>Get Pass</th>
//                                 <th>Mill Rate</th>
//                                 <th>Quintal</th>
//                                 <th>Sale Rate</th>
//                                 <th>Lorry No</th>
//                                 <th>Frieght</th>
//                                 <th>Vasuli Amount</th>
//                                 <th>Transport</th>
//                                 <th>DO</th>
//                                 <th>Tender No.</th>

//                             </tr>
//                         </thead>
//                         <tbody>
//                             {Object.entries(groupedReportData).map(([key, { items }]) => {
//                                 const totalQty = items.reduce((sum, item) => sum + parseFloat(item.quantal || 0), 0);
//                                 return (
//                                     <React.Fragment key={key}>
//                                         <tr>
//                                             <td colSpan={15} align="left" className="table-primary" style={{ color: 'blue', fontWeight: 'bold' }}>{key}</td>
//                                         </tr>
//                                         {items.map((item, index) => (
//                                             <tr key={index}>
//                                                 <td style={{ fontWeight: 'bold' }}>{item.doc_no}</td>
//                                                 <td style={{ fontWeight: 'bold' }}>{item.doc_dateConverted}</td>
//                                                 <td align="left">{item.millshortname}</td>
//                                                 <td align="left">{item.voucherbyshortname}</td>
//                                                 <td align="left">{item.getpassshortname}</td>
//                                                 <td align="right">{formatReadableAmount(item.mill_rate)}</td>
//                                                 <td align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(item.quantal)}</td>
//                                                 <td align="right">{formatReadableAmount(item.sale_rate)}</td>
//                                                 <td align="left">{item.truck_no}</td>
//                                                 <td align="right">{item.Freight_Amount}</td>
//                                                 <td align="right">{item.vasuli_amount1}</td>
//                                                 <td align="left">{item.transportshortname}</td>
//                                                 <td align="left">{item.doshortname}</td>
//                                                 <td align="right">{item.purc_no}</td>
//                                             </tr>
//                                         ))}
//                                         <tr style={{ fontWeight: 'bold', backgroundColor: '#f0f8ff' }}>
//                                             <td colSpan={6} align="right">Total Qty:</td>
//                                             <td>{totalQty.toFixed(2)}</td>
//                                             <td colSpan={7}></td>
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

// export default MillWiseDispatch;





















import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as XLSX from 'xlsx';
import { useLocation } from 'react-router-dom';
import { formatReadableAmount } from '../../../../Common/FormatFunctions/FormatAmount';
import { ScaleLoader } from 'react-spinners';
import {
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, Typography, TableSortLabel, Box, TableFooter
} from '@mui/material';
import { FormaDateBalanceSheet } from '../../../../Common/FormatFunctions/FormatDate';
import PdfPreview from '../../../../Common/PDFPreview';
import HeaderJK from '../../../../Assets/HeaderJK.png';
import FooterJK from '../../../../Assets/FooterJK.png';
import { generateReportPDF } from '../../../../Common/ReportCommon/CommonPDFGenerator';
import CommonSearchBar from '../../../../Common/SearchBar/ReportSearchBar';

const apikey = process.env.REACT_APP_API;

// Configuration for Screen Display
const SCREEN_COLUMNS = [
    { label: 'Do No', key: 'doc_no', width: '60px' },
    { label: 'Date', key: 'doc_dateConverted', width: '90px' },
    { label: 'Mill Name', key: 'millshortname', width: '130px' },
    { label: 'Voucher By', key: 'voucherbyshortname', width: '130px' },
    { label: 'Get Pass', key: 'getpassshortname', width: '130px' },
    { label: 'Mill Rate', key: 'mill_rate', width: '80px', numeric: true },
    { label: 'Quintal', key: 'quantal', width: '80px', numeric: true },
    { label: 'Sale Rate', key: 'sale_rate', width: '80px', numeric: true },
    { label: 'Lorry No', key: 'truck_no', width: '100px' },
    { label: 'Freight', key: 'Freight_Amount', width: '80px', numeric: true },
    { label: 'Vasuli', key: 'vasuli_amount1', width: '80px', numeric: true },
    { label: 'Transport', key: 'transportshortname', width: '120px' },
    { label: 'DO', key: 'doshortname', width: '100px' },
    { label: 'Tender No', key: 'purc_no', width: '70px' },
];

// Configuration for PDF Printing
const PRINT_COLUMNS = [
    { label: 'Do No', key: 'doc_no', printWidth: 15 },
    { label: 'Date', key: 'doc_dateConverted', printWidth: 22 },
    { label: 'Voucher By', key: 'voucherbyshortname', printWidth: 35 },
    { label: 'Quintal', key: 'quantal', printWidth: 20, numeric: true },
    { label: 'M.Rate', key: 'mill_rate', printWidth: 18, numeric: true },
    { label: 'S.Rate', key: 'sale_rate', printWidth: 18, numeric: true },
    { label: 'Lorry No', key: 'truck_no', printWidth: 25 },
    { label: 'Freight', key: 'Freight_Amount', printWidth: 20, numeric: true },
    { label: 'Tender No', key: 'purc_no', printWidth: 15 },
];

const MillWiseDispatch = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const companyCode = sessionStorage.getItem('Company_Code');
    const Year_Code = sessionStorage.getItem('Year_Code');
    const Company_Name = sessionStorage.getItem("Company_Name");

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
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
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        if (fromDate && toDate) fetchReportData();
    }, [fromDate, toDate, companyCode, Year_Code]);

    // Grouping, Filtering and Grand Total Logic
    const { groupedData, grandTotalQuintal } = useMemo(() => {
        let filtered = reportData.filter(item =>
            Object.values(item).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
        );

        let total = 0;
        const groups = {};
        filtered.forEach(item => {
            const qty = parseFloat(item.quantal || 0);
            total += qty;
            const key = `${item.mill_code || 'NA'}-${item.millname || 'Unknown Mill'}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });

        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => {
                const va = a[sortConfig.key] || 0;
                const vb = b[sortConfig.key] || 0;
                if (va < vb) return sortConfig.direction === 'asc' ? -1 : 1;
                if (va > vb) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        });

        return { groupedData: groups, grandTotalQuintal: total };
    }, [reportData, searchTerm, sortConfig]);

    const handleGeneratePDF = () => {
        setIsPrinting(true);
        const allRows = [];

        Object.entries(groupedData).forEach(([millName, items]) => {
            // Mill Group Header
            allRows.push([
                { content: millName, colSpan: PRINT_COLUMNS.length, styles: { fillColor: [240, 240, 240], fontStyle: 'bold', lineWidth: 0.1 } }
            ]);

            // Mill Data Rows
            items.forEach(item => {
                allRows.push(PRINT_COLUMNS.map(col => col.numeric ? formatReadableAmount(item[col.key]) : item[col.key]));
            });

            // Mill Group Total
            const groupTotal = items.reduce((sum, i) => sum + parseFloat(i.quantal || 0), 0);
            const groupFooterRow = new Array(PRINT_COLUMNS.length).fill("");
            groupFooterRow[0] = { content: "Mill Total:", styles: { fontStyle: 'bold' } };
            const qtyIdx = PRINT_COLUMNS.findIndex(c => c.key === 'quantal');
            groupFooterRow[qtyIdx] = { content: formatReadableAmount(groupTotal), styles: { fontStyle: 'bold', halign: 'right' } };
            allRows.push(groupFooterRow);

            // Spacer / Dotted Line indicator row
            allRows.push([{ content: "", colSpan: PRINT_COLUMNS.length, styles: { minCellHeight: 2 } }]);
        });

        // Final Grand Total Row
        const grandTotalRow = new Array(PRINT_COLUMNS.length).fill("");
        grandTotalRow[0] = { content: "GRAND TOTAL:", styles: { fontStyle: 'bold', fillColor: [255, 249, 196] } };
        const qtyIndex = PRINT_COLUMNS.findIndex(c => c.key === 'quantal');
        grandTotalRow[qtyIndex] = { content: formatReadableAmount(grandTotalQuintal), styles: { fontStyle: 'bold', halign: 'right', fillColor: [255, 249, 196] } };
        allRows.push(grandTotalRow);

        generateReportPDF({
            title: 'Mill Wise Dispatch',
            subtitle: `${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`,
            columns: PRINT_COLUMNS.map(c => c.label),
            rows: allRows,
            tableStyles: { 
                lineWidth: 0.1, 
                lineColor: [150, 150, 150],
                lineDash: [1, 1] 
            },
            headerStyles: { fillColor: [26, 35, 126], textColor: [255, 255, 255], lineWidth: 0.1 },
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
            [`Mill Wise Dispatch: ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`],
            [],
            SCREEN_COLUMNS.map(c => c.label)
        ];

        Object.entries(groupedData).forEach(([millKey, items]) => {
            wsData.push([millKey]);
            items.forEach(item => {
                wsData.push(SCREEN_COLUMNS.map(c => c.numeric ? (parseFloat(item[c.key]) || 0) : item[c.key]));
            });
            const totalQty = items.reduce((sum, i) => sum + parseFloat(i.quantal || 0), 0);
            wsData.push(["", "Mill Total:", "", "", "", "", totalQty]);
            wsData.push([]);
        });

        wsData.push(["GRAND TOTAL", "", "", "", "", "", grandTotalQuintal]);

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'MillReport');
        XLSX.writeFile(wb, `Mill_Wise_Dispatch.xlsx`);
    };

    return (
        <Box sx={{ padding: '15px', marginTop: "-80px" }}>
            <Box sx={{ textAlign: 'center'}}>
                <Typography variant="h6" sx={{ textDecoration: 'underline', fontWeight: 'bold' }}>Mill Wise Dispatch</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <CommonSearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search mill or voucher..." />
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
                                        minWidth: col.width
                                    }}
                                >
                                    <TableSortLabel 
                                        active={sortConfig.key === col.key} 
                                        direction={sortConfig.direction} 
                                        onClick={() => setSortConfig({ key: col.key, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                                        sx={{ '& .MuiTableSortLabel-icon': { color: '#fff !important' }, color: '#fff !important' }}
                                    >
                                        {col.label}
                                    </TableSortLabel>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Object.entries(groupedData).map(([groupKey, items]) => (
                            <React.Fragment key={groupKey}>
                                <TableRow sx={{ backgroundColor: '#e3f2fd' }}>
                                    <TableCell colSpan={SCREEN_COLUMNS.length} sx={{ fontWeight: 'bold', color: '#1a237e' }}>
                                        {groupKey}
                                    </TableCell>
                                </TableRow>
                                {items.map((item, idx) => (
                                    <TableRow key={idx} hover>
                                        {SCREEN_COLUMNS.map(col => (
                                            <TableCell 
                                                key={col.key} 
                                                align={col.numeric ? 'right' : 'left'} 
                                                sx={{ fontSize: '11px' }}
                                            >
                                                {col.numeric ? formatReadableAmount(item[col.key]) : item[col.key]}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                                <TableRow sx={{ backgroundColor: '#f1f8e9' }}>
                                    <TableCell colSpan={6} align="right" sx={{ fontWeight: 'bold', fontSize: '11px' }}>Total Quintal:</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '11px' }}>
                                        {formatReadableAmount(items.reduce((sum, i) => sum + parseFloat(i.quantal || 0), 0))}
                                    </TableCell>
                                    <TableCell colSpan={7}></TableCell>
                                </TableRow>
                            </React.Fragment>
                        ))}
                    </TableBody>
                    <TableFooter sx={{ position: 'sticky', bottom: 0, zIndex: 10, backgroundColor: '#fff9c4' }}>
                        <TableRow>
                            <TableCell colSpan={6} align="right" sx={{ fontWeight: 'bold', fontSize: '13px', color: '#000' }}>GRAND TOTAL:</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '13px', color: '#000' }}>
                                {formatReadableAmount(grandTotalQuintal)}
                            </TableCell>
                            <TableCell colSpan={7}></TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </TableContainer>

            {pdfPreview && <PdfPreview pdfData={pdfPreview} label="MillWiseCategoryDispatch" />}
            
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

export default MillWiseDispatch;