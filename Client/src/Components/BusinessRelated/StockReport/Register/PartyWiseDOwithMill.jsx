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

// const PartyWiseDoWithMill = () => {
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

//     const API_URL = `${apikey}/PartyWiseDO`;

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

//                 const data = Array.isArray(response.data) ? response.data : [];
//                 setReportData(data);

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
//     }, [fromDate, toDate, companyCode, Year_Code, acCode]);

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
//             'DoNo', 'Date', 'Mill', 'Grade', 'Quantal',
//             'M Rate', 'Lorry No', 'SRate', 'Dispatch To', 'SB No'
//         ]);

//         Object.entries(groupedReportData).forEach(([partyKey, mills]) => {
//             wsData.push([`${partyKey}`]);

//             Object.entries(mills).forEach(([millKey, { millName, items }]) => {
//                 wsData.push([`Mill: ${millName}`]);

//                 let millTotalQty = 0;

//                 items.forEach(item => {
//                     const qty = parseFloat(item.DI_Qty) || 0;
//                     millTotalQty += qty;

//                     wsData.push([
//                         item.detail_id,
//                         item.DI_Date,
//                         item.millshortname,
//                         item.grade,
//                         qty,
//                         item.mill_rate,
//                         item.truck_no,
//                         item.sale_rate,
//                         item.getpassname,
//                         item.SB_No
//                     ]);
//                 });

//                 wsData.push([
//                     '', '', '', 'Mill Total',
//                     millTotalQty.toFixed(2), '', '', '', '', ''
//                 ]);

//                 wsData.push([]);
//             });

//             wsData.push([]);
//         });

//         const ws = XLSX.utils.aoa_to_sheet(wsData);
//         XLSX.utils.book_append_sheet(wb, ws, 'PartyWiseDOWithMill');
//         XLSX.writeFile(wb, 'PartyWiseDOWithMill.xlsx');
//     };

//     const handleVoucherClick = (doc_no) => {
//         const url = `${window.location.origin}/delivery-order`;
//         const params = new URLSearchParams({ navigatedRecord: doc_no });
//         window.open(`${url}?${params.toString()}`, '_blank');
//     };

//     const handleSBNoClick = (doc_no) => {
//         const url = `${window.location.origin}/sale-bill`;
//         const params = new URLSearchParams({ navigatedRecord: doc_no });
//         window.open(`${url}?${params.toString()}`, '_blank');
//     };

//     const groupedReportData = Array.isArray(reportData)
//         ? reportData.reduce((acc, item) => {
//             const partyKey = `${item.voucher_by}-${item.voucherbyshortname}`;
//             const millKey = `${item.mill_code}-${item.millshortname}`;

//             if (!acc[partyKey]) {
//                 acc[partyKey] = {};
//             }

//             if (!acc[partyKey][millKey]) {
//                 acc[partyKey][millKey] = {
//                     millName: item.millshortname,
//                     items: [],
//                 };
//             }

//             acc[partyKey][millKey].items.push(item);

//             return acc;
//         }, {})
//         : {};

//     return (
//         <div style={{ marginTop: '-80px' }}>
//             {/* <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold" }}>{Company_Name}</Typography>
//             <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", textDecoration: 'underline', fontWeight: "550" }}>GSTN : {Company_GSTNO}</Typography>
//     */}
//             <div className="d-flex justify-content-between align-items-center">
//                 <div style={{ flex: 1, textAlign: 'center', marginLeft: "280px" }}>
//                     <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>Party Wise DO with Mill</Typography>
//                     <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px" }}>{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>
//                 </div>

//                 <div className="d-flex justify-content-end ">
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
//                                 <th>Do No.</th>
//                                 <th>Date</th>
//                                 <th>Mill Name</th>
//                                 <th>Grade</th>
//                                 <th>Quintal</th>
//                                 <th>Mill Rate</th>
//                                 <th>Sale Rate</th>
//                                 <th>Lorry No</th>
//                                 <th>Dispatch To</th>
//                                 <th>Sale Bill No.</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {Object.entries(groupedReportData).map(([partyKey, mills]) => (
//                                 <React.Fragment key={partyKey}>
//                                     <tr>
//                                         <td colSpan={10} align="left" className="table-primary" style={{ color: 'blue', fontWeight: 'bold' }}>
//                                             {partyKey}
//                                         </td>
//                                     </tr>

//                                     {Object.entries(mills).map(([millKey, { millName, items }]) => {
//                                         const totalQty = items.reduce((sum, item) => sum + parseFloat(item.DI_Qty || 0), 0);

//                                         return (
//                                             <React.Fragment key={millKey}>
//                                                 <tr>
//                                                     <td colSpan={10} align="left" className="table-secondary" style={{ fontWeight: 'bold' }}>
//                                                         Mill Name : <span style={{ fontWeight: 'bold', color: 'blue', }}>{millName}</span>
//                                                     </td>
//                                                 </tr>
//                                                 {items.map((item, index) => (
//                                                     <tr key={index}>
//                                                         <td
//                                                             align="center"
//                                                             style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
//                                                             onClick={() => handleVoucherClick(item.detail_id)}
//                                                         >
//                                                             {item.detail_id}
//                                                         </td>
//                                                         <td align="center" style={{ fontWeight: 'bold' }}>{item.DI_Date}</td>
//                                                         <td align="left">{item.millshortname}</td>
//                                                         <td align="left">{item.grade}</td>
//                                                         <td align="right">{item.DI_Qty}</td>
//                                                         <td align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(item.mill_rate)}</td>
//                                                         <td align="right">{formatReadableAmount(item.sale_rate)}</td>
//                                                         <td align="center">{item.truck_no}</td>
//                                                         <td align="left">{item.getpassname}</td>
//                                                         <td
//                                                             align="center"
//                                                             style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
//                                                             onClick={() => handleSBNoClick(item.SB_No)}
//                                                         >
//                                                             {item.SB_No}
//                                                         </td>
//                                                     </tr>
//                                                 ))}
//                                                 <tr style={{ fontWeight: 'bold', backgroundColor: '#f0f8ff' }}>
//                                                     <td colSpan={4} align="right">Mill Total</td>
//                                                     <td align="right">{formatReadableAmount(totalQty.toFixed(2))}</td>
//                                                     <td colSpan={5}></td>
//                                                 </tr>
//                                             </React.Fragment>
//                                         );
//                                     })}
//                                 </React.Fragment>
//                             ))}
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

// export default PartyWiseDoWithMill;





































// import React, { useState, useEffect, useMemo } from 'react';
// import axios from 'axios';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import * as XLSX from 'xlsx';
// import { useLocation } from 'react-router-dom';
// import { formatReadableAmount } from '../../../../Common/FormatFunctions/FormatAmount';
// import { ScaleLoader } from 'react-spinners';
// import {
//     Table, TableBody, TableCell, TableContainer, TableHead,
//     TableRow, Paper, Typography, Box
// } from '@mui/material';
// import { FormaDateBalanceSheet } from '../../../../Common/FormatFunctions/FormatDate';
// import PdfPreview from '../../../../Common/PDFPreview';
// import HeaderJK from '../../../../Assets/HeaderJK.png';
// import FooterJK from '../../../../Assets/FooterJK.png';
// import { generateReportPDF } from '../../../../Common/ReportCommon/CommonPDFGenerator';

// const apikey = process.env.REACT_APP_API;

// const COLUMNS = [
//     { label: 'Do No.', key: 'detail_id', width: '8%' },
//     { label: 'Date', key: 'DI_Date', width: '10%' },
//     { label: 'Mill Name', key: 'millshortname', width: '15%' },
//     { label: 'Grade', key: 'grade', width: '8%' },
//     { label: 'Quintal', key: 'DI_Qty', width: '10%', numeric: true },
//     { label: 'Mill Rate', key: 'mill_rate', width: '10%', numeric: true },
//     { label: 'Sale Rate', key: 'sale_rate', width: '10%', numeric: true },
//     { label: 'Lorry No', key: 'truck_no', width: '10%' },
//     { label: 'Dispatch To', key: 'getpassname', width: '12%' },
//     { label: 'SB No.', key: 'SB_No', width: '7%' },
// ];

// const PartyWiseDoWithMill = () => {
//     const location = useLocation();
//     const searchParams = new URLSearchParams(location.search);
//     const fromDate = searchParams.get('fromDate');
//     const toDate = searchParams.get('toDate');
//     const acCode = searchParams.get('acCode');

//     const companyCode = sessionStorage.getItem('Company_Code');
//     const Year_Code = sessionStorage.getItem('Year_Code');
//     const Company_Name = sessionStorage.getItem("Company_Name");

//     const [reportData, setReportData] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [isPrinting, setIsPrinting] = useState(false);
//     const [error, setError] = useState('');
//     const [pdfPreview, setPdfPreview] = useState(null);

//     const API_URL = `${apikey}/PartyWiseDO`;

//     useEffect(() => {
//         const fetchData = async () => {
//             setLoading(true);
//             try {
//                 const res = await axios.get(API_URL, {
//                     params: { fromDT: fromDate, toDT: toDate, Company_Code: companyCode, Year_Code: Year_Code, acCode: acCode },
//                 });
//                 setReportData(Array.isArray(res.data) ? res.data : []);
//             } catch (err) { setError('Error fetching report'); }
//             finally { setLoading(false); }
//         };
//         if (fromDate && toDate) fetchData();
//     }, [fromDate, toDate, companyCode, Year_Code, acCode]);

//     // Nested Grouping Logic: Party -> Mill
//     const groupedData = useMemo(() => {
//         return reportData.reduce((acc, item) => {
//             const partyKey = `${item.voucher_by}-${item.voucherbyshortname}`;
//             const millKey = `${item.mill_code}-${item.millshortname}`;

//             if (!acc[partyKey]) acc[partyKey] = {};
//             if (!acc[partyKey][millKey]) {
//                 acc[partyKey][millKey] = {
//                     millName: item.millshortname,
//                     items: [],
//                     millTotal: 0
//                 };
//             }
//             acc[partyKey][millKey].items.push(item);
//             acc[partyKey][millKey].millTotal += parseFloat(item.DI_Qty || 0);
//             return acc;
//         }, {});
//     }, [reportData]);

//     const handleNavigation = (path, doc_no) => {
//         if (doc_no) window.open(`${window.location.origin}/${path}?navigatedRecord=${doc_no}`, '_blank');
//     };

//     const handleExportToExcel = () => {
//         const wb = XLSX.utils.book_new();
//         const wsData = [[Company_Name?.toUpperCase()], ["Party Wise DO With Mill"], []];
        
//         Object.entries(groupedData).forEach(([party, mills]) => {
//             wsData.push([party]);
//             Object.entries(mills).forEach(([millKey, millObj]) => {
//                 wsData.push([`   Mill: ${millObj.millName}`]);
//                 wsData.push(COLUMNS.map(c => c.label));
//                 millObj.items.forEach(item => {
//                     wsData.push(COLUMNS.map(c => item[c.key]));
//                 });
//                 wsData.push(['', '', '', 'Mill Total:', millObj.millTotal.toFixed(2)]);
//                 wsData.push([]);
//             });
//         });

//         const ws = XLSX.utils.aoa_to_sheet(wsData);
//         XLSX.utils.book_append_sheet(wb, ws, 'Report');
//         XLSX.writeFile(wb, `PartyWiseMillDO.xlsx`);
//     };

//     const handleGeneratePDF = () => {
//         setIsPrinting(true);
//         const rows = [];
//         Object.entries(groupedData).forEach(([party, mills]) => {
//             rows.push([{ content: party, colSpan: COLUMNS.length, styles: { fillColor: [26, 35, 126], textColor: [255, 255, 255], fontStyle: 'bold' } }]);
//             Object.entries(mills).forEach(([millKey, millObj]) => {
//                 rows.push([{ content: `Mill: ${millObj.millName}`, colSpan: COLUMNS.length, styles: { fillColor: [232, 234, 246], fontStyle: 'bold' } }]);
//                 millObj.items.forEach(item => {
//                     rows.push(COLUMNS.map(col => col.numeric ? formatReadableAmount(item[col.key]) : item[col.key]));
//                 });
//                 rows.push(COLUMNS.map(col => col.key === 'DI_Qty' ? formatReadableAmount(millObj.millTotal) : col.key === 'grade' ? 'Mill Total:' : ''));
//             });
//               rows.push([{ 
//                     content: '---------------------------------------------------------------------------------------------------------------------------------', 
//                     colSpan: COLUMNS.length, 
//                     styles: { halign: 'center', textColor: [150, 150, 150], fontSize: 7 } 
//                 }]);
//         });

//         generateReportPDF({
//             title: 'Party Wise DO With Mill',
//             subtitle: `Period: ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`,
//             columns: COLUMNS.map(c => c.label),
//             rows,
//             headerImgSrc: HeaderJK,
//             footerImgSrc: FooterJK,
//             onComplete: (url) => { setPdfPreview(url); setIsPrinting(false); }
//         });
//     };

//     return (
//         <Box sx={{ padding: '15px',marginTop: '-80px' }}>
//             <Box sx={{ textAlign: 'center' }}>
//                 <Typography variant="h6" sx={{ fontWeight: 'bold', textDecoration: 'underline' }}>Party Wise DO with Mill</Typography>
//                 <Typography variant="subtitle1">{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>
//             </Box>

//             <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
//                 <button className="btn btn-danger btn-sm" onClick={handleGeneratePDF} disabled={isPrinting}>Print PDF</button>
//                 <button className="btn btn-success btn-sm" onClick={handleExportToExcel}>Excel</button>
//             </Box>

//             <TableContainer component={Paper} sx={{ maxHeight: '700px' }}>
//                 <Table stickyHeader size="small">
//                     <TableHead>
//                         <TableRow>
//                             {COLUMNS.map(col => (
//                                 <TableCell key={col.key} align={col.numeric ? 'right' : 'left'} sx={{ backgroundColor: '#1a237e', color: '#fff', fontWeight: 'bold' }}>
//                                     {col.label}
//                                 </TableCell>
//                             ))}
//                         </TableRow>
//                     </TableHead>
//                     <TableBody>
//                         {Object.entries(groupedData).map(([party, mills]) => (
//                             <React.Fragment key={party}>
//                                 <TableRow>
//                                     <TableCell colSpan={COLUMNS.length} sx={{ fontWeight: 'bold', backgroundColor: '#e8eaf6', color: '#1a237e' }}>{party}</TableCell>
//                                 </TableRow>
//                                 {Object.entries(mills).map(([millKey, millObj]) => (
//                                     <React.Fragment key={millKey}>
//                                         <TableRow>
//                                             <TableCell colSpan={COLUMNS.length} sx={{ fontWeight: 'bold', pl: 4, fontStyle: 'italic' }}>Mill: {millObj.millName}</TableCell>
//                                         </TableRow>
//                                         {millObj.items.map((item, idx) => (
//                                             <TableRow key={idx} hover>
//                                                 {COLUMNS.map(col => (
//                                                     <TableCell 
//                                                         key={col.key} 
//                                                         align={col.numeric ? 'right' : 'left'}
//                                                         onClick={col.key === 'detail_id' ? () => handleNavigation('delivery-order', item.detail_id) : col.key === 'SB_No' ? () => handleNavigation('sale-bill', item.SB_No) : undefined}
//                                                         sx={col.key === 'detail_id' || col.key === 'SB_No' ? { cursor: 'pointer', color: 'blue', textDecoration: 'underline' } : {}}
//                                                     >
//                                                         {col.numeric ? formatReadableAmount(item[col.key]) : item[col.key]}
//                                                     </TableCell>
//                                                 ))}
//                                             </TableRow>
//                                         ))}
//                                         <TableRow sx={{ backgroundColor: '#fafafa' }}>
//                                             <TableCell colSpan={4} sx={{ fontWeight: 'bold', textAlign: 'right' }}>Mill Total:</TableCell>
//                                             <TableCell align="right" sx={{ fontWeight: 'bold', borderTop: '1px solid black' }}>{formatReadableAmount(millObj.millTotal)}</TableCell>
//                                             <TableCell colSpan={5}></TableCell>
//                                         </TableRow>
//                                     </React.Fragment>
//                                 ))}
//                             </React.Fragment>
//                         ))}
//                     </TableBody>
//                 </Table>
//             </TableContainer>

//             {pdfPreview && <PdfPreview pdfData={pdfPreview} label="PartyWiseDoWithMill" />}

//               {(loading || isPrinting) && (
//                            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
//                                <Box sx={{ textAlign: 'center' }}>
//                                    <ScaleLoader color="#1a237e" height={40} margin={2} />
//                                    <Typography sx={{ mt: 2, fontWeight: 'bold', color: '#1a237e' }}>
//                                        {isPrinting ? "Generating PDF..." : "Loading Data..."}
//                                    </Typography>
//                                </Box>
//                            </div>
//                        )}
//         </Box>
//     );
// };

// export default PartyWiseDoWithMill;





























import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as XLSX from 'xlsx';
import { useLocation } from 'react-router-dom';
import { formatReadableAmount } from '../../../../Common/FormatFunctions/FormatAmount';
import { ScaleLoader } from 'react-spinners';
import {
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, Typography, Box
} from '@mui/material';
import { FormaDateBalanceSheet } from '../../../../Common/FormatFunctions/FormatDate';
import PdfPreview from '../../../../Common/PDFPreview';
import HeaderJK from '../../../../Assets/HeaderJK.png';
import FooterJK from '../../../../Assets/FooterJK.png';
import { generateReportPDF } from '../../../../Common/ReportCommon/CommonPDFGenerator';
import CommonSearchBar from '../../../../Common/SearchBar/ReportSearchBar';

const apikey = process.env.REACT_APP_API;

const COLUMNS = [
    { label: 'Do No.', key: 'detail_id', width: '8%' },
    { label: 'Date', key: 'DI_Date', width: '10%' },
    { label: 'Mill Name', key: 'millshortname', width: '15%' },
    { label: 'Grade', key: 'grade', width: '8%' },
    { label: 'Quintal', key: 'DI_Qty', width: '10%', numeric: true },
    { label: 'Mill Rate', key: 'mill_rate', width: '10%', numeric: true },
    { label: 'Sale Rate', key: 'sale_rate', width: '10%', numeric: true },
    { label: 'Lorry No', key: 'truck_no', width: '10%' },
    { label: 'Dispatch To', key: 'getpassname', width: '12%' },
    { label: 'SB No.', key: 'SB_No', width: '7%' },
];

const PartyWiseDoWithMill = () => {
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

    const API_URL = `${apikey}/PartyWiseDO`;

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await axios.get(API_URL, {
                    params: { fromDT: fromDate, toDT: toDate, Company_Code: companyCode, Year_Code: Year_Code, acCode: acCode },
                });
                setReportData(Array.isArray(res.data) ? res.data : []);
            } catch (err) { setError('Error fetching report'); }
            finally { setLoading(false); }
        };
        if (fromDate && toDate) fetchData();
    }, [fromDate, toDate, companyCode, Year_Code, acCode]);

    // Filter data based on search term
    const filteredData = useMemo(() => {
        if (!searchTerm) return reportData;
        return reportData.filter((item) =>
            Object.values(item).some((val) =>
                String(val).toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [reportData, searchTerm]);

    // Nested Grouping Logic: Party -> Mill (using filteredData)
    const groupedData = useMemo(() => {
        return filteredData.reduce((acc, item) => {
            const partyKey = `${item.voucher_by}-${item.voucherbyshortname}`;
            const millKey = `${item.mill_code}-${item.millshortname}`;

            if (!acc[partyKey]) acc[partyKey] = {};
            if (!acc[partyKey][millKey]) {
                acc[partyKey][millKey] = {
                    millName: item.millshortname,
                    items: [],
                    millTotal: 0
                };
            }
            acc[partyKey][millKey].items.push(item);
            acc[partyKey][millKey].millTotal += parseFloat(item.DI_Qty || 0);
            return acc;
        }, {});
    }, [filteredData]);

    const handleNavigation = (path, doc_no) => {
        if (doc_no) window.open(`${window.location.origin}/${path}?navigatedRecord=${doc_no}`, '_blank');
    };

    const handleExportToExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [[Company_Name?.toUpperCase()], ["Party Wise DO With Mill"], []];
        
        Object.entries(groupedData).forEach(([party, mills]) => {
            wsData.push([party]);
            Object.entries(mills).forEach(([millKey, millObj]) => {
                wsData.push([`   Mill: ${millObj.millName}`]);
                wsData.push(COLUMNS.map(c => c.label));
                millObj.items.forEach(item => {
                    wsData.push(COLUMNS.map(c => item[c.key]));
                });
                wsData.push(['', '', '', 'Mill Total:', millObj.millTotal.toFixed(2)]);
                wsData.push([]);
            });
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Report');
        XLSX.writeFile(wb, `PartyWiseMillDO.xlsx`);
    };

    const handleGeneratePDF = () => {
        setIsPrinting(true);
        const rows = [];
        Object.entries(groupedData).forEach(([party, mills]) => {
            rows.push([{ content: party, colSpan: COLUMNS.length, styles: { fillColor: [26, 35, 126], textColor: [255, 255, 255], fontStyle: 'bold' } }]);
            Object.entries(mills).forEach(([millKey, millObj]) => {
                rows.push([{ content: `Mill: ${millObj.millName}`, colSpan: COLUMNS.length, styles: { fillColor: [232, 234, 246], fontStyle: 'bold' } }]);
                millObj.items.forEach(item => {
                    rows.push(COLUMNS.map(col => col.numeric ? formatReadableAmount(item[col.key]) : item[col.key]));
                });
                rows.push(COLUMNS.map(col => col.key === 'DI_Qty' ? formatReadableAmount(millObj.millTotal) : col.key === 'grade' ? 'Mill Total:' : ''));
            });
              rows.push([{ 
                    content: '---------------------------------------------------------------------------------------------------------------------------------', 
                    colSpan: COLUMNS.length, 
                    styles: { halign: 'center', textColor: [150, 150, 150], fontSize: 7 } 
                }]);
        });

        generateReportPDF({
            title: 'Party Wise DO With Mill',
            subtitle: `Period: ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`,
            columns: COLUMNS.map(c => c.label),
            rows,
            headerImgSrc: HeaderJK,
            footerImgSrc: FooterJK,
            onComplete: (url) => { setPdfPreview(url); setIsPrinting(false); }
        });
    };

    return (
        <Box sx={{ padding: '15px', marginTop: '-80px' }}>
            <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', textDecoration: 'underline' }}>Party Wise DO with Mill</Typography>
                <Typography variant="subtitle1">{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center'}} className="no-print">
                <CommonSearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search Party, Mill, Truck..." />
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <button className="btn btn-danger btn-sm" onClick={handleGeneratePDF} disabled={isPrinting}>Print PDF</button>
                    <button className="btn btn-success btn-sm" onClick={handleExportToExcel}>Export Excel</button>
                </Box>
            </Box>

            <TableContainer component={Paper} sx={{ maxHeight: '700px' }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {COLUMNS.map(col => (
                                <TableCell key={col.key} align={col.numeric ? 'right' : 'left'} sx={{ backgroundColor: '#1a237e', color: '#fff', fontWeight: 'bold' }}>
                                    {col.label}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Object.entries(groupedData).map(([party, mills]) => (
                            <React.Fragment key={party}>
                                <TableRow>
                                    <TableCell colSpan={COLUMNS.length} sx={{ fontWeight: 'bold', backgroundColor: '#e8eaf6', color: '#1a237e' }}>{party}</TableCell>
                                </TableRow>
                                {Object.entries(mills).map(([millKey, millObj]) => (
                                    <React.Fragment key={millKey}>
                                        <TableRow>
                                            <TableCell colSpan={COLUMNS.length} sx={{ fontWeight: 'bold', pl: 4, fontStyle: 'italic' }}>Mill: {millObj.millName}</TableCell>
                                        </TableRow>
                                        {millObj.items.map((item, idx) => (
                                            <TableRow key={idx} hover>
                                                {COLUMNS.map(col => (
                                                    <TableCell 
                                                        key={col.key} 
                                                        align={col.numeric ? 'right' : 'left'}
                                                        onClick={col.key === 'detail_id' ? () => handleNavigation('delivery-order', item.detail_id) : col.key === 'SB_No' ? () => handleNavigation('sale-bill', item.SB_No) : undefined}
                                                        sx={col.key === 'detail_id' || col.key === 'SB_No' ? { cursor: 'pointer', color: 'blue', textDecoration: 'underline' } : {}}
                                                    >
                                                        {col.numeric ? formatReadableAmount(item[col.key]) : item[col.key]}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                        <TableRow sx={{ backgroundColor: '#fafafa' }}>
                                            <TableCell colSpan={4} sx={{ fontWeight: 'bold', textAlign: 'right' }}>Mill Total:</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold', borderTop: '1px solid black' }}>{formatReadableAmount(millObj.millTotal)}</TableCell>
                                            <TableCell colSpan={5}></TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                ))}
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {pdfPreview && <PdfPreview pdfData={pdfPreview} label="PartyWiseDoWithMill" />}

            {(loading || isPrinting) && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <ScaleLoader color="#1a237e" height={40} margin={2} />
                        <Typography sx={{ mt: 2, fontWeight: 'bold', color: '#1a237e' }}>
                            {isPrinting ? "Generating PDF..." : "Loading Data..."}
                        </Typography>
                    </Box>
                </div>
            )}
            {error && <div className="alert alert-danger mt-3">{error}</div>}
        </Box>
    );
};

export default PartyWiseDoWithMill;
