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
// import PrintButton from '../../../../Common/Buttons/PrintPDF';

// const apikey = process.env.REACT_APP_API;

// const TransportAcRegister = () => {
//     const navigate = useNavigate();
//     const location = useLocation();

//     const searchParams = new URLSearchParams(location.search);
//     const fromDate = searchParams.get('fromDate');
//     const toDate = searchParams.get('toDate');
//     const acCode = searchParams.get('acCode');
//     const companyCode = sessionStorage.getItem('Company_Code');
//     const Year_Code = sessionStorage.getItem('Year_Code');
//     const Company_Name = sessionStorage.getItem('Company_Name');
//     const Company_GSTNO = sessionStorage.getItem('Company_GSTNO')

//     const [reportData, setReportData] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');
//     const [pdfPreview, setPdfPreview] = useState(null);

//     const API_URL = `${apikey}/TransportAc-Register`;

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
//                         acCode: acCode
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

//         // Add company name and report header
//         wsData.push([Company_Name]);
//         wsData.push(['Transport Account Register']);
//         wsData.push([`From: ${fromDate} To: ${toDate}`]);
//         wsData.push([]);

//         // Table headers (same as your HTML table)
//         wsData.push([
//             'Memo#', 'Date', 'Party Name', 'Mill', 'Truck No',
//             'Qntl', 'Rate', 'Freight', 'Paid1 + Paid2 + Paid3', 'Balance'
//         ]);

//         Object.entries(groupedReportData).forEach(([key, { items }]) => {
//             // Group title row
//             wsData.push([key]);

//             let totalBalance = 0;

//             items.forEach(item => {
//                 const freight = parseFloat(item.Freight) || 0;
//                 const paid1 = parseFloat(item.Paid1) || 0;
//                 const paid2 = parseFloat(item.Paid2) || 0;
//                 const paid3 = parseFloat(item.Paid3) || 0;
//                 const balance = freight - (paid1 + paid2 + paid3);
//                 totalBalance += balance;

//                 wsData.push([
//                     item.doc_no,
//                     item.dt,
//                     item.VoucherBy,
//                     item.MillShort,
//                     item.lorry,
//                     item.Qntl,
//                     item.Rate,
//                     item.Freight,
//                     `${item.Paid1} + ${item.Paid2} + ${item.Paid3}`,
//                     balance.toFixed(2)
//                 ]);
//             });

//             // Total row for the group
//             wsData.push(['', '', '', '', '', '', '', '', 'Total', totalBalance.toFixed(2)]);
//             wsData.push([]); // Spacer
//         });

//         const ws = XLSX.utils.aoa_to_sheet(wsData);
//         XLSX.utils.book_append_sheet(wb, ws, 'TransportAcRegister');
//         XLSX.writeFile(wb, 'TransportAcRegister.xlsx');
//     };



//     const groupReportData = (data) => {
//         if (!Array.isArray(data)) {
//             console.error("Expected data to be an array, but got:", data);
//             return {}; // Return an empty object if data is not an array
//         }

//         const grouped = {};
//         data.forEach(item => {
//             const key = `${item.transport}-${item.transportname}`;
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
//                 <div style={{ flex: 1, textAlign: 'center', marginLeft: "280px" }}>
//                     <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>Transport Account</Typography>
//                     <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px" }}>{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>
//                 </div>

//                 <div className="d-flex justify-content-end">
//                     <PrintButton disabledFeild={""} fetchData={handlePrint} />
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
//                         <thead className="table-light" style={{ position: "sticky", top: 0, backgroundColor: "#fff", zIndex: 1, whiteSpace: "nowrap" }} >
//                             <tr>
//                                 <th>Memo#</th>
//                                 <th>Date</th>
//                                 <th>Party Name</th>
//                                 <th>Mill Name</th>
//                                 <th>truck No</th>
//                                 <th>Quintal</th>
//                                 <th>Rate</th>
//                                 <th>Frieght</th>
//                                 <th>Piad</th>
//                                 <th>Balance</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {Object.entries(groupedReportData).map(([key, { items }]) => {
//                                 const totalQty = items.reduce((sum, item) =>
//                                     sum + (parseFloat(item.Freight) - (parseFloat(item.Paid1) + parseFloat(item.Paid2) + parseFloat(item.Paid3)))
//                                     , 0);
//                                 return (
//                                     <React.Fragment key={key}>
//                                         <tr>
//                                             <td colSpan={10} align="left" className="table-primary" style={{ color: 'blue', fontWeight: 'bold' }}>{key}</td>
//                                         </tr>
//                                         {items.map((item, index) => (
//                                             <tr key={index}>
//                                                 <td style={{ fontWeight: 'bold' }} align="center">{item.doc_no}</td>
//                                                 <td align="center">{item.dt}</td>
//                                                 <td align="left">{item.VoucherBy}</td>
//                                                 <td align="left">{item.MillShort}</td>
//                                                 <td align="left">{item.lorry}</td>
//                                                 <td align="right">{item.Qntl}</td>
//                                                 <td align="right">{item.Rate}</td>
//                                                 <td align="right">{item.Freight}</td>
//                                                 <td align="right">{item.Paid1}+{item.Paid2}+{item.Paid3}</td>
//                                                 <td align="right"> {parseFloat(item.Freight) - (parseFloat(item.Paid1) + parseFloat(item.Paid2) + parseFloat(item.Paid3))}</td>

//                                             </tr>
//                                         ))}
//                                         <tr style={{ fontWeight: 'bold', backgroundColor: '#f0f8ff' }}>
//                                             <td colSpan={9} align="right">Total </td>
//                                             <td>{totalQty.toFixed(2)}</td>

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

// export default TransportAcRegister;























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
    { label: 'Memo#', key: 'doc_no', width: '7%' },
    { label: 'Date', key: 'dt', width: '9%' },
    { label: 'Party Name', key: 'VoucherBy', width: '15%' },
    { label: 'Mill Name', key: 'MillShort', width: '12%' },
    { label: 'Truck No', key: 'lorry', width: '10%' },
    { label: 'Quintal', key: 'Qntl', width: '8%', numeric: true, isTotal: true },
    { label: 'Rate', key: 'Rate', width: '7%', numeric: true, isTotal: false },
    { label: 'Freight', key: 'Freight', width: '9%', numeric: true, isTotal: true },
    { label: 'Paid', key: 'Paid_Combined', width: '13%', numeric: true, isTotal: false },
    { label: 'Balance', key: 'Balance', width: '10%', numeric: true, isTotal: true },
];

const PRINT_COLUMNS = [
    { label: 'Memo#', key: 'doc_no', printWidth: 20 },
    { label: 'Date', key: 'dt', printWidth: 25 },
    { label: 'Party', key: 'VoucherBy', printWidth: 40 },
    { label: 'Mill', key: 'MillShort', printWidth: 35 },
    { label: 'Truck No', key: 'lorry', printWidth: 30 },
    { label: 'Quintal', key: 'Qntl', printWidth: 20, numeric: true, isTotal: true },
    { label: 'Rate', key: 'Rate', printWidth: 20, numeric: true },
    { label: 'Freight', key: 'Freight', printWidth: 25, numeric: true, isTotal: true },
    { label: 'Balance', key: 'Balance', printWidth: 25, numeric: true, isTotal: true },
];

const TransportAcRegister = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const acCode = searchParams.get('acCode');

    const companyCode = sessionStorage.getItem('Company_Code');
    const Year_Code = sessionStorage.getItem('Year_Code');
    const Company_Name = sessionStorage.getItem("Company_Name");

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [error, setError] = useState('');
    const [pdfPreview, setPdfPreview] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'doc_no', direction: 'asc' });

    const API_URL = `${apikey}/TransportAc-Register`;

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {
                const res = await axios.get(API_URL, {
                    params: { fromDT: fromDate, toDT: toDate, Company_Code: companyCode, Year_Code: Year_Code, acCode: acCode },
                });
                const data = Array.isArray(res.data) ? res.data : [];
                // Pre-calculate Balance for each row
                const processedData = data.map(item => ({
                    ...item,
                    Balance: (parseFloat(item.Freight) || 0) - ((parseFloat(item.Paid1) || 0) + (parseFloat(item.Paid2) || 0) + (parseFloat(item.Paid3) || 0))
                }));
                setReportData(processedData);
            } catch (err) { setError('Error fetching report'); }
            finally { setLoading(false); }
        };
        if (fromDate && toDate) fetchReportData();
    }, [fromDate, toDate, companyCode, Year_Code, acCode]);

    const filteredAndSortedData = useMemo(() => {
        let items = [...reportData];
        if (searchTerm) {
            items = items.filter((item) =>
                Object.values(item).some((val) => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
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

    const { groupedData, grandTotals } = useMemo(() => {
        const groups = {};
        const grand = {};
        SCREEN_COLUMNS.filter(c => c.isTotal).forEach(c => grand[c.key] = 0);

        filteredAndSortedData.forEach(item => {
            const key = `${item.transport}-${item.transportname}`;
            if (!groups[key]) {
                groups[key] = { items: [], totals: {} };
                SCREEN_COLUMNS.filter(c => c.isTotal).forEach(c => groups[key].totals[c.key] = 0);
            }
            groups[key].items.push(item);
            SCREEN_COLUMNS.filter(c => c.isTotal).forEach(c => {
                groups[key].totals[c.key] += (parseFloat(item[c.key]) || 0);
                grand[c.key] += (parseFloat(item[c.key]) || 0);
            });
        });
        return { groupedData: groups, grandTotals: grand };
    }, [filteredAndSortedData]);

    const requestSort = (key) =>
        setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));

    const handleGeneratePDF = () => {
        setIsPrinting(true);
        const rows = [];
        Object.entries(groupedData).forEach(([transport, group]) => {
            rows.push([{ content: transport, colSpan: PRINT_COLUMNS.length, styles: { fillColor: [240, 240, 240], fontStyle: 'bold' } }]);
            
            group.items.forEach(item => {
                rows.push(PRINT_COLUMNS.map(col => col.numeric ? formatReadableAmount(item[col.key]) : item[col.key]));
            });

            rows.push(PRINT_COLUMNS.map(col => {
                if (col.isTotal) return { content: formatReadableAmount(group.totals[col.key]), styles: { halign: 'right', fontStyle: 'bold' } };
                return col.label === 'Memo#' ? { content: 'Sub Total', styles: { fontStyle: 'bold' } } : '';
            }));

            rows.push([{ content: '-----------------------------------------------------------------------------------------------------------------', colSpan: PRINT_COLUMNS.length, styles: { halign: 'center', textColor: [150, 150, 150], fontSize: 8 } }]);
        });

        generateReportPDF({
            title: 'Transport Account Register',
            subtitle: `${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`,
            columns: PRINT_COLUMNS.map(c => c.label),
            rows,
            footerRow: PRINT_COLUMNS.map(col => {
                if (col.isTotal) return { content: formatReadableAmount(grandTotals[col.key]), styles: { halign: 'right', fontStyle: 'bold', fillColor: [255, 249, 196] } };
                return col.label === 'Memo#' ? { content: 'GRAND TOTAL', styles: { fontStyle: 'bold', fillColor: [255, 249, 196] } } : '';
            }),
            headerImgSrc: HeaderJK,
            footerImgSrc: FooterJK,
            numericCols: PRINT_COLUMNS.map((c, i) => c.numeric ? i : null).filter(i => i !== null),
            onComplete: (url) => { setPdfPreview(url); setIsPrinting(false); }
        });
    };

    const handleExportToExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [[Company_Name?.toUpperCase()], ["Transport Account Register"], [`Period: ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`], [], SCREEN_COLUMNS.map(c => c.label)];

        Object.entries(groupedData).forEach(([transport, group]) => {
            wsData.push([transport]);
            group.items.forEach(item => {
                const paidStr = `${item.Paid1} + ${item.Paid2} + ${item.Paid3}`;
                wsData.push([item.doc_no, item.dt, item.VoucherBy, item.MillShort, item.lorry, item.Qntl, item.Rate, item.Freight, paidStr, item.Balance]);
            });
            const subRow = new Array(SCREEN_COLUMNS.length).fill("");
            subRow[0] = "Sub Total:";
            SCREEN_COLUMNS.forEach((c, i) => { if (c.isTotal) subRow[i] = group.totals[c.key]; });
            wsData.push(subRow);
            wsData.push([]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'TransportRegister');
        XLSX.writeFile(wb, `TransportAcRegister.xlsx`);
    };

    return (
        <Box sx={{ padding: '15px', marginTop: "-80px" }}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ textDecoration: 'underline', fontWeight: 'bold' }}>Transport Account Register</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Period: {FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center'}} className="no-print">
                <CommonSearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search records..." />
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <button className="btn btn-danger btn-sm" onClick={handleGeneratePDF} disabled={isPrinting}>Print PDF</button>
                    <button className="btn btn-success btn-sm" onClick={handleExportToExcel}>Export Excel</button>
                </Box>
            </Box>

            <TableContainer component={Paper} sx={{ maxHeight: '750px', boxShadow: 5 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {SCREEN_COLUMNS.map(col => (
                                <TableCell key={col.key} align={col.numeric ? 'right' : 'left'} style={{ backgroundColor: '#1a237e', color: '#fff', fontWeight: 'bold' }}>
                                    <TableSortLabel active={sortConfig.key === col.key} direction={sortConfig.direction} onClick={() => requestSort(col.key)} sx={{ '& .MuiTableSortLabel-icon': { color: '#fff !important' }, color: '#fff !important' }}>
                                        {col.label}
                                    </TableSortLabel>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Object.entries(groupedData).map(([transport, group]) => (
                            <React.Fragment key={transport}>
                                <TableRow>
                                    <TableCell colSpan={SCREEN_COLUMNS.length} sx={{ fontWeight: 'bold', backgroundColor: '#e8eaf6', color: '#1a237e' }}>{transport}</TableCell>
                                </TableRow>
                                {group.items.map((item, idx) => (
                                    <TableRow key={idx} hover>
                                        {SCREEN_COLUMNS.map(col => (
                                            <TableCell key={col.key} align={col.numeric ? 'right' : 'left'}>
                                                {col.key === 'Paid_Combined' ? `${item.Paid1}+${item.Paid2}+${item.Paid3}` : (col.numeric ? formatReadableAmount(item[col.key]) : item[col.key])}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                    <TableCell colSpan={2} sx={{ fontWeight: 'bold', textAlign: 'right' }}>Sub Total:</TableCell>
                                    {SCREEN_COLUMNS.slice(2).map(col => (
                                        <TableCell key={col.key} align={col.numeric ? 'right' : 'left'} sx={{ fontWeight: 'bold' }}>
                                            {col.isTotal ? formatReadableAmount(group.totals[col.key]) : ''}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </React.Fragment>
                        ))}
                    </TableBody>
                    <TableFooter sx={{ position: 'sticky', bottom: 0, zIndex: 10, backgroundColor: '#fff9c4' }}>
                        <TableRow>
                            <TableCell colSpan={2} sx={{ fontWeight: 'bold', fontSize: '1rem' }}>GRAND TOTAL</TableCell>
                            {SCREEN_COLUMNS.slice(2).map(col => (
                                <TableCell key={col.key} align={col.numeric ? 'right' : 'left'} sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                                    {col.isTotal ? formatReadableAmount(grandTotals[col.key]) : ''}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableFooter>
                </Table>
            </TableContainer>

            {pdfPreview && <PdfPreview pdfData={pdfPreview} label="TransportAccountRegister" />}
            
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

export default TransportAcRegister;