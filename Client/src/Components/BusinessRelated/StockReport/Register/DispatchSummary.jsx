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
// import PrintButton from '../../../../Common/Buttons/PrintPDF';

// const apikey = process.env.REACT_APP_API;

// const DispatchSummary = () => {
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

//     const API_URL = `${apikey}/DispatchSummary`;

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

//         // Add Company Name
//         wsData.push([Company_Name]);
//         wsData.push([]);

//         // Add Table Headers (same as HTML table)
//         wsData.push([
//             '#', 'Mill', 'Rate', 'MR for GST', 'Quantal', 'Name of Party',
//             'Ship to', 'Truck', 'Transport', 'Driver', 'EwayBill No',
//             'TNo', 'TId', 'PSNo', 'SBno'
//         ]);

//         Object.entries(groupedReportData).forEach(([date, { items }]) => {
//             // Add group header (DI_Date)
//             wsData.push([`${date}`]);

//             let totalQty = 0;

//             items.forEach((item, index) => {
//                 const qty = parseFloat(item.DI_Qty || 0);
//                 totalQty += qty;

//                 wsData.push([
//                     item.detail_id,
//                     item.millshortname,
//                     item.mill_rate,
//                     item.millrateGST,
//                     qty,
//                     item.billtoshortname,
//                     item.ShippedTo,
//                     item.truck_no,
//                     item.transportshortname,
//                     item.driver_no,
//                     item.Eway_Bill_No,
//                     item.purc_no,
//                     item.purc_order,
//                     item.voucher_no,
//                     item.SB_No
//                 ]);
//             });

//             // Add total row
//             wsData.push([
//                 '', '', '', 'Total Qty:', totalQty.toFixed(2),
//                 '', '', '', '', '', '', '', '', '', ''
//             ]);

//             wsData.push([]); // spacing between groups
//         });

//         const ws = XLSX.utils.aoa_to_sheet(wsData);
//         XLSX.utils.book_append_sheet(wb, ws, 'DispatchSummary');
//         XLSX.writeFile(wb, 'DispatchSummary.xlsx');
//     };



//     const groupReportData = (data) => {
//         const grouped = {};
//         data.forEach(item => {
//             const key = `${item.DI_Date}`;
//             if (!grouped[key]) {
//                 grouped[key] = { items: [] };
//             }
//             grouped[key].items.push(item);
//         });
//         return grouped;
//     };

//     const groupedReportData = groupReportData(reportData);

//     const handleVoucherClick = (doc_no) => {
//         const url = `${window.location.origin}/sugarpurchasebill`;
//         const params = new URLSearchParams({ navigatedRecord: doc_no });
//         window.open(`${url}?${params.toString()}`, '_blank');
//     };

//     const handleSBNoClick = (doc_no) => {
//         const url = `${window.location.origin}/sale-bill`;
//         const params = new URLSearchParams({ navigatedRecord: doc_no });
//         window.open(`${url}?${params.toString()}`, '_blank');
//     };

//     return (
//         <div style={{ marginTop: '-80px' }}>
//             {/* <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold" }}>{Company_Name}</Typography>
//             <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", textDecoration: 'underline', fontWeight: "550" }}>GSTN : {Company_GSTNO}</Typography> */}

//             <div className="d-flex justify-content-between align-items-center">
//                 <div style={{ flex: 1, textAlign: 'center', marginLeft: "280px" }}>
//                     <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>Dispatch Summary</Typography>
//                     <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px" }}>{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>

//                 </div>

//                 <div className="d-flex justify-content-end">
//                     <PrintButton disabledFeild={""} fetchData={handlePrint} />
//                     <button className="btn btn-success me-2" onClick={handleExportToExcel}>Export to Excel</button>
//                     <button className="btn btn-secondary" onClick={generatePdf}>PDF</button>
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
//                                 <th>Mill Name</th>
//                                 <th>Rate</th>
//                                 <th>Mill Rate for GST</th>
//                                 <th>Quintal</th>
//                                 <th>Name of Party</th>
//                                 <th>Ship to</th>
//                                 <th>Truck No.</th>
//                                 <th>Transport</th>
//                                 <th>Driver</th>
//                                 <th>Eway Bill No.</th>
//                                 <th>T No.</th>
//                                 <th>T Id</th>
//                                 <th>Purchase Bill No.</th>
//                                 <th>Sale Bill No.</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {Object.entries(groupedReportData).map(([key, { items }]) => {
//                                 const totalQty = items.reduce((sum, item) => sum + parseFloat(item.DI_Qty || 0), 0);
//                                 return (
//                                     <React.Fragment key={key}>
//                                         <tr>
//                                             <td colSpan={15} align="left" className="table-primary" style={{ color: 'blue', fontWeight: 'bold' }}>{key}</td>
//                                         </tr>
//                                         {items.map((item, index) => (
//                                             <tr key={index}>
//                                                 <td style={{ fontWeight: 'bold' }}>{item.detail_id}</td>
//                                                 <td align="left" style={{ fontWeight: 'bold' }}>{item.millshortname}</td>
//                                                 <td align="right">{formatReadableAmount(item.mill_rate)}</td>
//                                                 <td align="right">{formatReadableAmount(item.millrateGST)}</td>
//                                                 <td align="right">{formatReadableAmount(item.DI_Qty)}</td>
//                                                 <td align="left" style={{ fontWeight: 'bold' }}>{item.billtoshortname}</td>
//                                                 <td align="left">{item.ShippedTo}</td>
//                                                 <td>{item.truck_no}</td>
//                                                 <td align="left">{item.transportshortname}</td>
//                                                 <td align="right">{item.driver_no}</td>
//                                                 <td align="right">{item.Eway_Bill_No}</td>
//                                                 <td align="right">{item.purc_no}</td>
//                                                 <td align="right">{item.purc_order}</td>
//                                                 <td
//                                                     align="right"
//                                                     style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
//                                                     onClick={() => handleVoucherClick(item.voucher_no)}
//                                                 >
//                                                     {item.voucher_no}
//                                                 </td>
//                                                 <td
//                                                     align="right"
//                                                     style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
//                                                     onClick={() => handleSBNoClick(item.SB_No)}
//                                                 >
//                                                     {item.SB_No}
//                                                 </td>
//                                             </tr>
//                                         ))}
//                                         <tr style={{ fontWeight: 'bold', backgroundColor: '#f0f8ff' }}>
//                                             <td colSpan={4} align="right">Total Quintal:</td>
//                                             <td align="right">{formatReadableAmount(totalQty.toFixed(2))}</td>
//                                             <td colSpan={10}></td>
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

// export default DispatchSummary;






















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

// Full columns for the UI Screen
const SCREEN_COLUMNS = [
    { label: 'Do No', key: 'detail_id', width: '5%' },
    { label: 'Mill Name', key: 'millshortname', width: '12%' },
    { label: 'Rate', key: 'mill_rate', width: '7%', numeric: true },
    { label: 'MR GST', key: 'millrateGST', width: '7%', numeric: true },
    { label: 'Quintal', key: 'DI_Qty', width: '8%', numeric: true, isTotal: true },
    { label: 'Party Name', key: 'billtoshortname', width: '12%' },
    { label: 'Ship to', key: 'ShippedTo', width: '10%' },
    { label: 'Truck No', key: 'truck_no', width: '10%' },
    { label: 'Transport', key: 'transportshortname', width: '10%' },
    { label: 'Eway Bill', key: 'Eway_Bill_No', width: '10%' },
    { label: 'Purc No', key: 'purc_no', width: '5%' },
    { label: 'Sale No', key: 'SB_No', width: '5%', isLink: true },
];

// LIMITED COLUMNS FOR PRINTING (Fits better on A4)
const PRINT_COLUMNS = [
    { label: 'Do No', key: 'detail_id' },
    { label: 'Mill Name', key: 'millshortname' },
    { label: 'Quintal', key: 'DI_Qty', numeric: true },
    { label: 'Party Name', key: 'billtoshortname' },
    { label: 'Truck No', key: 'truck_no' },
    { label: 'Transport', key: 'transportshortname' },
    { label: 'Purc No', key: 'purc_no' },
    { label: 'Sale No', key: 'SB_No' },
];

const DispatchSummary = () => {
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
    const [error, setError] = useState('');
    const [pdfPreview, setPdfPreview] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'DI_Date', direction: 'asc' });

    const API_URL = `${apikey}/DispatchSummary`;

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
        const grand = { DI_Qty: 0 };
        filteredAndSortedData.forEach(item => {
            const key = item.DI_Date;
            if (!groups[key]) {
                groups[key] = { items: [], totals: { DI_Qty: 0 } };
            }
            groups[key].items.push(item);
            const qty = parseFloat(item.DI_Qty) || 0;
            groups[key].totals.DI_Qty += qty;
            grand.DI_Qty += qty;
        });
        return { groupedData: groups, grandTotals: grand };
    }, [filteredAndSortedData]);

    const handleGeneratePDF = () => {
        setIsPrinting(true);
        const rows = [];

        Object.entries(groupedData).forEach(([date, group]) => {
            // Group Header Row
            rows.push([{ content: `Date: ${date}`, colSpan: PRINT_COLUMNS.length, styles: { fillColor: [240, 240, 240], fontStyle: 'bold' } }]);

            // Data Rows (Using LIMITED PRINT_COLUMNS)
            group.items.forEach(item => {
                rows.push(PRINT_COLUMNS.map(col => col.numeric ? formatReadableAmount(item[col.key]) : item[col.key]));
            });

            // Sub Total Row
            rows.push(PRINT_COLUMNS.map(col => {
                if (col.key === 'DI_Qty') return { content: formatReadableAmount(group.totals.DI_Qty), styles: { halign: 'right', fontStyle: 'bold' } };
                return col.key === 'millshortname' ? { content: 'Sub Total:', styles: { fontStyle: 'bold' } } : '';
            }));
        });

        generateReportPDF({
            title: 'Dispatch Summary',
            subtitle: `${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`,
            columns: PRINT_COLUMNS.map(c => c.label), // Limited column labels
            rows,
            footerRow: PRINT_COLUMNS.map(col => {
                if (col.key === 'DI_Qty') return { content: formatReadableAmount(grandTotals.DI_Qty), styles: { halign: 'right', fontStyle: 'bold', fillColor: [255, 249, 196] } };
                return col.key === 'millshortname' ? { content: 'GRAND TOTAL', styles: { fontStyle: 'bold', fillColor: [255, 249, 196] } } : '';
            }),
            headerImgSrc: HeaderJK,
            footerImgSrc: FooterJK,
            numericCols: PRINT_COLUMNS.map((c, i) => c.numeric ? i : null).filter(i => i !== null),
            onComplete: (url) => { setPdfPreview(url); setIsPrinting(false); }
        });
    };

    const handleExportToExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [[Company_Name?.toUpperCase()], ["Dispatch Summary Report"], [`Period: ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`], [], SCREEN_COLUMNS.map(c => c.label)];

        Object.entries(groupedData).forEach(([date, group]) => {
            wsData.push([`Date: ${date}`]);
            group.items.forEach(item => {
                wsData.push(SCREEN_COLUMNS.map(col => item[col.key]));
            });
            wsData.push(["", "Sub Total:", "", "", group.totals.DI_Qty]);
            wsData.push([]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'DispatchSummary');
        XLSX.writeFile(wb, `DispatchSummary.xlsx`);
    };

    return (
        <Box sx={{ padding: '15px', marginTop: "-80px" }}>
            <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ textDecoration: 'underline', fontWeight: 'bold' }}>Dispatch Summary</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <CommonSearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search records..." />
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
                                    style={{ backgroundColor: '#1a237e', color: '#fff', fontWeight: 'bold' }}>
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
                        {Object.entries(groupedData).map(([date, group]) => (
                            <React.Fragment key={date}>
                                <TableRow>
                                    <TableCell colSpan={SCREEN_COLUMNS.length} sx={{ fontWeight: 'bold', backgroundColor: '#e8eaf6', color: '#1a237e' }}>
                                        {date}
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
                                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                    <TableCell colSpan={4} sx={{ fontWeight: 'bold', textAlign: 'right' }}>Sub Total:</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatReadableAmount(group.totals.DI_Qty)}</TableCell>
                                    <TableCell colSpan={7}></TableCell>
                                </TableRow>
                            </React.Fragment>
                        ))}
                    </TableBody>
                    <TableFooter sx={{ position: 'sticky', bottom: 0, zIndex: 10, backgroundColor: '#fff9c4' }}>
                        <TableRow>
                            <TableCell colSpan={4} sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>GRAND TOTAL</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{formatReadableAmount(grandTotals.DI_Qty)}</TableCell>
                            <TableCell colSpan={7}></TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </TableContainer>

            {pdfPreview && <PdfPreview pdfData={pdfPreview} label="DispatchSummary" />}

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

export default DispatchSummary;