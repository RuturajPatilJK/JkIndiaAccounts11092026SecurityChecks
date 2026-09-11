// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import * as XLSX from 'xlsx';
// import { jsPDF } from 'jspdf';
// import 'jspdf-autotable';
// import { useLocation } from 'react-router-dom';
// import {
//     Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography
// } from '@mui/material';
// import { RingLoader } from 'react-spinners';
// import PdfPreview from '../../../Common/PDFPreview'
// import { formatReadableAmount } from '../../../Common/FormatFunctions/FormatAmount';
// import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate"

// const apikey = process.env.REACT_APP_API;

// const PendingReports = () => {

//     const location = useLocation();

//     const Company_Name = sessionStorage.getItem('Company_Name')
//     const Company_GSTNO = sessionStorage.getItem('Company_GSTNO')

//     const searchParams = new URLSearchParams(location.search);
//     const fromDate = searchParams.get('fromDate');
//     const toDate = searchParams.get('toDate');
//     const [reportData, setReportData] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');
//     const [pdfPreview, setPdfPreview] = useState(null);


//     const API_URL = `${apikey}/pendingreport-tenderwisesauda`;

//     const formatDate = (dateString) => {
//         const date = new Date(dateString);
//         const day = String(date.getDate()).padStart(2, '0');
//         const month = String(date.getMonth() + 1).padStart(2, '0');
//         const year = String(date.getFullYear());
//         return `${day}/${month}/${year}`;
//     };

//     useEffect(() => {
//         const fetchReportData = async () => {
//             setLoading(true);
//             setError('');
//             try {
//                 const response = await axios.get(API_URL, {
//                     params: {
//                         from_date: fromDate,
//                         to_date: toDate,
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

//         fetchReportData();
//     }, [API_URL]);

//     const handleExportToExcel = () => {
//         const wb = XLSX.utils.book_new();
//         const ws = XLSX.utils.json_to_sheet(reportData);
//         XLSX.utils.book_append_sheet(wb, ws, 'Pending Reports');
//         XLSX.writeFile(wb, 'PendingReports.xlsx');
//     };


//     const handlePrint = () => {
//         const groupedData = groupReportData(reportData);

//         let printWindow = window.open('', '', 'height=900,width=1200');

//         const formatRow = (cells, isHeader = false) => {
//             return `<tr>
//                 ${cells.map((cell, index) => {
//                 let align = 'left';
//                 if ([0, 1, 2, 4, 10, 11].includes(index)) align = 'center';
//                 else if ([6, 7, 9].includes(index)) align = 'right';

//                 const style = isHeader
//                     ? `background-color:#b4b4b4;font-weight:bold;text-align:${align};padding:4px;border:1px solid #ccc;`
//                     : `text-align:${align};padding:4px;border:1px solid #ccc;`;

//                 return `<td style="${style}">${cell ?? ''}</td>`;
//             }).join('')}
//             </tr>`;
//         };

//         let content = `
//             <html>
//             <head>
//                 <style>
//                     body { font-family: Arial, sans-serif; font-size: 12px; color: #000; }
//                     h2, h4 { text-align: center; margin: 4px 0; }
//                     table { width: 100%; border-collapse: collapse; margin-top: 10px; }
//                     th, td { border: 1px solid #ccc; padding: 4px; font-size: 11px; }
//                     .group-header { background-color: #dce6f1; font-weight: bold; color: #000; text-align: center; padding: 6px; }
//                     .total-row td { font-weight: bold; background-color: #eaeaea; }
//                 </style>
//             </head>
//             <body>
//                 <h2>${Company_Name}</h2>
//                 <h4>Tender Wise Sauda - From Date: ${formatDate(fromDate)} To Date: ${formatDate(toDate)}</h4>
//         `;

//         Object.entries(groupedData).forEach(([key, group]) => {
//             const [mc, millName] = key.split('-');
//             content += `<div class="group-header">${mc} - ${millName}</div>`;
//             content += `<table>
//                 <thead>
//                     ${formatRow([
//                 'Sauda Date', 'Tender No', 'ID', 'Customer Name', 'Season', 'Grade',
//                 'Sale Rate', 'Mill Rate', 'Party Name', 'Quantity', 'Dispatch Type', 'Payment Date'
//             ], true)}
//                 </thead>
//                 <tbody>`;

//             group.items.forEach(item => {
//                 content += formatRow([
//                     formatDate(item.Sauda_Date),
//                     item.Tender_No,
//                     item.ID,
//                     item.CustomerName,
//                     item.season,
//                     item.Grade,
//                     formatReadableAmount(item.Sale_Rate),
//                     formatReadableAmount(item.Mill_Rate),
//                     item.PartyName,
//                     formatReadableAmount(item.Qty),
//                     item.DispatchType || '',
//                     formatDate(item.PaymentDate),
//                 ]);
//             });

//             content += `
//                 <tr class="total-row">
//                     <td colspan="9"></td>
//                     <td style="text-align:right;">${group.totalQty.toFixed(2)}</td>
//                     <td colspan="2"></td>
//                 </tr>
//                 </tbody>
//             </table>`;
//         });

//         content += `
//             </body>
//             </html>
//         `;

//         printWindow.document.write(content);
//         printWindow.document.close();
//         printWindow.print();
//     };


//     const generatePDF = async () => {
//         const doc = new jsPDF('l');
//         doc.setFontSize(10);
//         const topMargin = 10;
//         let currentY = topMargin;

//         const pageWidth = doc.internal.pageSize.width;
//         const companyX = pageWidth / 2;

//         doc.text(`${Company_Name}`, companyX, currentY, null, null, "center");
//         currentY += 5;

//         doc.setFontSize(8);
//         const reportTitle = `Tender Wise Sauda - From Date : ${formatDate(fromDate)} To Date : ${formatDate(toDate)}`;
//         const titleWidth = doc.getStringUnitWidth(reportTitle) * doc.internal.getFontSize() / doc.internal.scaleFactor;
//         doc.text(reportTitle, (pageWidth - titleWidth) / 2, currentY);
//         currentY += 4;

//         const groupedData = groupReportData(reportData);
//         const tableBody = [];

//         Object.entries(groupedData).forEach(([key, group]) => {
//             const [mc, millName] = key.split('-');

//             tableBody.push([{
//                 content: `${mc} - ${millName}`,
//                 colSpan: 12,
//                 styles: {
//                     halign: 'center',
//                     fontStyle: 'bold',
//                     textColor: [0, 0, 0],
//                     fillColor: [220, 230, 241],
//                     fontSize: 7
//                 }
//             }]);

//             group.items.forEach(item => {
//                 tableBody.push([
//                     { content: formatDate(item.Sauda_Date), styles: { halign: 'center' } },
//                     { content: item.Tender_No || "", styles: { halign: 'center' } },
//                     { content: item.ID || "", styles: { halign: 'center' } },
//                     { content: item.CustomerName || "", styles: { halign: 'left' } },
//                     { content: item.season || "", styles: { halign: 'center' } },
//                     { content: item.Grade || "", styles: { halign: 'left' } },
//                     { content: formatReadableAmount(item.Sale_Rate) || "", styles: { halign: 'right' } },
//                     { content: formatReadableAmount(item.Mill_Rate) || "", styles: { halign: 'right' } },
//                     { content: item.PartyName || "", styles: { halign: 'left' } },
//                     { content: formatReadableAmount(item.Qty) || "", styles: { halign: 'right' } },
//                     { content: item.DispatchType || "", styles: { halign: 'center' } },
//                     { content: formatDate(item.PaymentDate), styles: { halign: 'center' } },
//                 ]);
//             });

//             tableBody.push([
//                 { content: '', colSpan: 9 },
//                 { content: group.totalQty.toFixed(2), styles: { halign: 'right', fontStyle: 'bold' } },
//                 { content: '', colSpan: 2 }
//             ]);
//         });

//         doc.autoTable({
//             head: [[
//                 'Sauda Date', 'Tender No', 'ID', 'Customer Name', 'Season', 'Grade',
//                 'Sale Rate', 'Mill Rate', 'Party Name', 'Quantity', 'Dispatch Type', 'Payment Date'
//             ]],
//             body: tableBody,
//             startY: currentY + 2,
//             theme: 'grid',
//             styles: {
//                 fontSize: 5,
//                 cellPadding: 0.6,
//                 overflow: 'visible',
//                 lineWidth: 0.1
//             },
//             columnStyles: {
//                 0: { halign: 'center' },
//                 1: { halign: 'center', fontSize: 6 },
//                 2: { halign: 'center', fontSize: 6 },
//                 3: { halign: 'left' },
//                 4: { halign: 'center' },
//                 5: { halign: 'left' },
//                 6: { halign: 'right' },
//                 7: { halign: 'right' },
//                 8: { halign: 'left' },
//                 9: { halign: 'right' },
//                 10: { halign: 'center' },
//                 11: { halign: 'center' },
//             },
//             headStyles: {
//                 fillColor: [180, 180, 180],
//                 textColor: [0, 0, 0],
//                 fontStyle: 'bold',
//                 lineWidth: 0.1
//             },
//             bodyStyles: {
//                 textColor: [0, 0, 0],
//                 lineColor: [0, 0, 0],
//                 lineWidth: 0.1
//             },
//             footStyles: {
//                 fillColor: [200, 200, 200],
//                 textColor: [0, 0, 0],
//                 fontStyle: 'bold',
//                 fontSize: 6
//             }
//         });

//         const pdfBlob = doc.output("blob");
//         const pdfUrl = URL.createObjectURL(pdfBlob);
//         setPdfPreview(pdfUrl);
//     };


//     const groupReportData = (data) => {
//         const groupedData = {};
//         data.forEach((item) => {
//             const key = `${item.mc}-${item.MillName}`;
//             if (!groupedData[key]) {
//                 groupedData[key] = {
//                     items: [],
//                     totalQty: 0,
//                 };
//             }
//             groupedData[key].items.push(item);
//             groupedData[key].totalQty += parseFloat(item.Qty) || 0;
//         });
//         return groupedData;
//     };

//     const groupedReportData = groupReportData(reportData);

//     return (
//         <div style={{marginTop:"-80px"}}>
//             <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold" }}>{Company_Name}</Typography>
//             <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", textDecoration: 'underline', fontWeight: "550" }}>GSTN : {Company_GSTNO}</Typography>
//             <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>Tender Wise Sauda</Typography>
//             <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px" }}>{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>

//             <div className="mb-3 row align-items-center">
//                 <div className="col-auto">
//                     <button className="btn btn-secondary me-2" onClick={handlePrint}>Print</button>
//                     <button className="btn btn-success me-2" onClick={handleExportToExcel}>Export to Excel</button>
//                     {pdfPreview && <PdfPreview pdfData={pdfPreview} apiData={reportData[0]} label={"TenderWiseSauda"} />}
//                     <button className="btn btn-success" onClick={generatePDF}>PDF Preview</button>
//                 </div>
//             </div>

//             <TableContainer component={Paper} style={{ maxHeight: '70vh', overflow: 'auto' }}>
//                 <Table stickyHeader size="small" aria-label="Tender Wise Sauda Table">
//                     <TableHead>
//                         <TableRow>
//                             {[
//                                 "Sauda Date", "Tender No", "ID", "Customer Name", "Season", "Grade",
//                                 "Sale Rate", "Mill Rate", "Party Name", "Quintal", "Dispatch Type", "Payment Date"
//                             ].map((header, i) => (
//                                 <TableCell
//                                     key={i}
//                                     sx={{
//                                         position: 'sticky',
//                                         top: 0,
//                                         backgroundColor: '#f5f5f5',
//                                         fontWeight: 'bold',
//                                         whiteSpace: header.includes("Tender") ? "nowrap" : "normal",
//                                         textAlign: i === 2 || i === 0 ? 'center' : i > 5 && i <= 9 ? 'right' : 'left',
//                                         whiteSpace: "nowrap"
//                                     }}
//                                 >
//                                     {header}
//                                 </TableCell>
//                             ))}
//                         </TableRow>
//                     </TableHead>

//                     <TableBody>
//                         {Object.entries(groupedReportData).map(([key, { items, totalQty }]) => {
//                             const [mc, millName] = key.split('-');
//                             return (
//                                 <React.Fragment key={key}>
//                                     <TableRow>
//                                         <TableCell colSpan={12} sx={{ color: 'blue', fontWeight: 'bold' }}>
//                                             {mc} - {millName}
//                                         </TableCell>
//                                     </TableRow>

//                                     {items.map((item, index) => (
//                                         <TableRow key={index}>
//                                             <TableCell>{formatDate(item.Sauda_Date)}</TableCell>
//                                             <TableCell>{item.Tender_No}</TableCell>
//                                             <TableCell align="center">{item.ID}</TableCell>
//                                             <TableCell align="left">{item.CustomerName}</TableCell>
//                                             <TableCell>{item.season}</TableCell>
//                                             <TableCell>{item.Grade}</TableCell>
//                                             <TableCell align="right">{formatReadableAmount(item.Sale_Rate)}</TableCell>
//                                             <TableCell align="right">{formatReadableAmount(item.Mill_Rate)}</TableCell>
//                                             <TableCell align="left">{item.PartyName}</TableCell>
//                                             <TableCell align="right">{formatReadableAmount(item.Qty)}</TableCell>
//                                             <TableCell align="center">{item.DispatchType}</TableCell>
//                                             <TableCell>{formatDate(item.PaymentDate)}</TableCell>
//                                         </TableRow>
//                                     ))}

//                                     <TableRow>
//                                         <TableCell colSpan={9} align="right" sx={{ fontWeight: 'bold' }}></TableCell>
//                                         <TableCell align="right" sx={{ fontWeight: 'bold' }}>
//                                             {formatReadableAmount(totalQty)}
//                                         </TableCell>
//                                         <TableCell colSpan={2}></TableCell>
//                                     </TableRow>
//                                 </React.Fragment>
//                             );
//                         })}
//                     </TableBody>
//                 </Table>
//             </TableContainer>

//             {loading && (
//                 <div style={{
//                     position: 'fixed',
//                     top: '50%',
//                     left: '50%',
//                     transform: 'translate(-50%, -50%)',
//                     zIndex: 9999
//                 }}>
//                     <RingLoader size={80} />
//                 </div>
//             )}

//             {error && <div className="alert alert-danger">{error}</div>}
//         </div>
//     );
// };

// export default PendingReports;




















import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useLocation } from 'react-router-dom';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography,Box
} from '@mui/material';
import { RingLoader } from 'react-spinners';
import PdfPreview from '../../../Common/PDFPreview'
import { formatReadableAmount } from '../../../Common/FormatFunctions/FormatAmount';
import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate"

const apikey = process.env.REACT_APP_API;

const PendingReports = () => {

    const location = useLocation();

    const Company_Name = sessionStorage.getItem('Company_Name')
    const Company_GSTNO = sessionStorage.getItem('Company_GSTNO')

    const searchParams = new URLSearchParams(location.search);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pdfPreview, setPdfPreview] = useState(null);


    const API_URL = `${apikey}/pendingreport-tenderwisesauda`;

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
        const ws = XLSX.utils.json_to_sheet(reportData);
        XLSX.utils.book_append_sheet(wb, ws, 'Pending Reports');
        XLSX.writeFile(wb, 'PendingReports.xlsx');
    };

    const handlePrint = () => {
        const groupedData = groupReportData(reportData);

        let printWindow = window.open('', '', 'height=900,width=1200');

        const formatRow = (cells, isHeader = false) => {
            return `<tr>
                ${cells.map((cell, index) => {
                let align = 'left';
                if ([0, 1, 2, 4, 10, 11].includes(index)) align = 'center';
                else if ([6, 7, 9].includes(index)) align = 'right';

                const style = isHeader
                    ? `background-color:#b4b4b4;font-weight:bold;text-align:${align};padding:4px;border:1px solid #ccc;`
                    : `text-align:${align};padding:4px;border:1px solid #ccc;`;

                return `<td style="${style}">${cell ?? ''}</td>`;
            }).join('')}
            </tr>`;
        };

        let content = `
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; font-size: 12px; color: #000; }
                    h2, h4 { text-align: center; margin: 4px 0; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { border: 1px solid #ccc; padding: 4px; font-size: 11px; }
                    .mill-header { background-color: #dce6f1; font-weight: bold; color: #000; text-align: left; padding: 6px; }
                    .grade-header { background-color: #f0f8ff; font-weight: bold; color: #000; text-align: left; padding: 6px; }
                    .grade-total { background-color: #f5f5f5; font-weight: bold; }
                    .mill-total { background-color: #e8e8e8; font-weight: bold; }
                </style>
            </head>
            <body>
                <h2>${Company_Name}</h2>
                <h4>Tender Wise Sauda - From Date: ${formatDate(fromDate)} To Date: ${formatDate(toDate)}</h4>
        `;

        // Group by Mill and then by Grade
        const millGroups = {};
        reportData.forEach(item => {
            const millKey = `${item.mc}-${item.MillName}`;
            if (!millGroups[millKey]) {
                millGroups[millKey] = {
                    millName: `${item.mc} - ${item.MillName}`,
                    grades: {},
                    totalQty: 0
                };
            }
            
            const gradeKey = item.Grade || 'No Grade';
            if (!millGroups[millKey].grades[gradeKey]) {
                millGroups[millKey].grades[gradeKey] = {
                    gradeName: gradeKey,
                    items: [],
                    totalQty: 0
                };
            }
            
            millGroups[millKey].grades[gradeKey].items.push(item);
            millGroups[millKey].grades[gradeKey].totalQty += parseFloat(item.Qty) || 0;
            millGroups[millKey].totalQty += parseFloat(item.Qty) || 0;
        });

        Object.values(millGroups).forEach(millGroup => {
            content += `<div class="mill-header">${millGroup.millName}</div>`;
            
            Object.values(millGroup.grades).forEach(gradeGroup => {
                content += `<div class="grade-header">Grade: ${gradeGroup.gradeName}</div>`;
                content += `<table>
                    <thead>
                        ${formatRow([
                            'Sauda Date', 'Tender No', 'ID', 'Customer Name', 'Season', 'Grade',
                            'Sale Rate', 'Mill Rate', 'Party Name', 'Quantity', 'Dispatch Type', 'Payment Date'
                        ], true)}
                    </thead>
                    <tbody>`;

                gradeGroup.items.forEach(item => {
                    content += formatRow([
                        formatDate(item.Sauda_Date),
                        item.Tender_No,
                        item.ID,
                        item.CustomerName,
                        item.season,
                        item.Grade,
                        formatReadableAmount(item.Sale_Rate),
                        formatReadableAmount(item.Mill_Rate),
                        item.PartyName,
                        formatReadableAmount(item.Qty),
                        item.DispatchType || '',
                        formatDate(item.PaymentDate),
                    ]);
                });

                // Grade total row
                content += `
                    <tr class="grade-total">
                        <td colspan="9" style="text-align:right;">Grade ${gradeGroup.gradeName} Total:</td>
                        <td style="text-align:right;">${gradeGroup.totalQty.toFixed(2)}</td>
                        <td colspan="2"></td>
                    </tr>
                    </tbody>
                </table>`;
            });

            // Mill total row
            content += `
                <div style="text-align:right; padding: 4px; font-weight: bold; background-color: #e8e8e8;">
                    Mill ${millGroup.millName} Total: ${millGroup.totalQty.toFixed(2)}
                </div>
            `;
        });

        // Grand total
        const grandTotal = Object.values(millGroups).reduce((sum, mill) => sum + mill.totalQty, 0);
        content += `
            <div style="text-align:right; padding: 8px; font-weight: bold; font-size: 14px; background-color: #d4d4d4; margin-top: 10px;">
                GRAND TOTAL: ${grandTotal.toFixed(2)}
            </div>
        `;

        content += `
            </body>
            </html>
        `;

        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.print();
    };

    const generatePDF = async () => {
        const doc = new jsPDF('l');
        doc.setFontSize(10);
        const topMargin = 10;
        let currentY = topMargin;

        const pageWidth = doc.internal.pageSize.width;
        const companyX = pageWidth / 2;

        doc.text(`${Company_Name}`, companyX, currentY, null, null, "center");
        currentY += 5;

        doc.setFontSize(8);
        const reportTitle = `Tender Wise Sauda - From Date : ${formatDate(fromDate)} To Date : ${formatDate(toDate)}`;
        const titleWidth = doc.getStringUnitWidth(reportTitle) * doc.internal.getFontSize() / doc.internal.scaleFactor;
        doc.text(reportTitle, (pageWidth - titleWidth) / 2, currentY);
        currentY += 4;

        // Group data for PDF
        const millGroups = {};
        reportData.forEach(item => {
            const millKey = `${item.mc}-${item.MillName}`;
            if (!millGroups[millKey]) {
                millGroups[millKey] = {
                    millName: `${item.mc} - ${item.MillName}`,
                    grades: {},
                    totalQty: 0
                };
            }
            
            const gradeKey = item.Grade || 'No Grade';
            if (!millGroups[millKey].grades[gradeKey]) {
                millGroups[millKey].grades[gradeKey] = {
                    gradeName: gradeKey,
                    items: [],
                    totalQty: 0
                };
            }
            
            millGroups[millKey].grades[gradeKey].items.push(item);
            millGroups[millKey].grades[gradeKey].totalQty += parseFloat(item.Qty) || 0;
            millGroups[millKey].totalQty += parseFloat(item.Qty) || 0;
        });

        const tableBody = [];
        let grandTotal = 0;

        Object.values(millGroups).forEach(millGroup => {
            // Mill header
            tableBody.push([{
                content: millGroup.millName,
                colSpan: 12,
                styles: {
                    halign: 'left',
                    fontStyle: 'bold',
                    textColor: [0, 0, 0],
                    fillColor: [220, 230, 241],
                    fontSize: 7
                }
            }]);

            Object.values(millGroup.grades).forEach(gradeGroup => {
                // Grade header
                tableBody.push([{
                    content: `Grade: ${gradeGroup.gradeName}`,
                    colSpan: 12,
                    styles: {
                        halign: 'left',
                        fontStyle: 'bold',
                        textColor: [0, 0, 0],
                        fillColor: [240, 248, 255],
                        fontSize: 7
                    }
                }]);

                // Grade items
                gradeGroup.items.forEach(item => {
                    tableBody.push([
                        { content: formatDate(item.Sauda_Date), styles: { halign: 'center' } },
                        { content: item.Tender_No || "", styles: { halign: 'center' } },
                        { content: item.ID || "", styles: { halign: 'center' } },
                        { content: item.CustomerName || "", styles: { halign: 'left' } },
                        { content: item.season || "", styles: { halign: 'center' } },
                        { content: item.Grade || "", styles: { halign: 'left' } },
                        { content: formatReadableAmount(item.Sale_Rate) || "", styles: { halign: 'right' } },
                        { content: formatReadableAmount(item.Mill_Rate) || "", styles: { halign: 'right' } },
                        { content: item.PartyName || "", styles: { halign: 'left' } },
                        { content: formatReadableAmount(item.Qty) || "", styles: { halign: 'right' } },
                        { content: item.DispatchType || "", styles: { halign: 'center' } },
                        { content: formatDate(item.PaymentDate), styles: { halign: 'center' } },
                    ]);
                });

                // Grade total
                tableBody.push([
                    { content: `Grade ${gradeGroup.gradeName} Total:`, colSpan: 9, styles: { halign: 'right', fontStyle: 'bold' } },
                    { content: gradeGroup.totalQty.toFixed(2), styles: { halign: 'right', fontStyle: 'bold', fillColor: [245, 245, 245] } },
                    { content: '', colSpan: 2 }
                ]);
            });

            // Mill total
            tableBody.push([
                { content: `Mill ${millGroup.millName} Total:`, colSpan: 9, styles: { halign: 'right', fontStyle: 'bold' } },
                { content: millGroup.totalQty.toFixed(2), styles: { halign: 'right', fontStyle: 'bold', fillColor: [232, 232, 232] } },
                { content: '', colSpan: 2 }
            ]);

            grandTotal += millGroup.totalQty;
        });

        // Grand total
        tableBody.push([
            { content: 'GRAND TOTAL:', colSpan: 9, styles: { halign: 'right', fontStyle: 'bold', fontSize: 8 } },
            { content: grandTotal.toFixed(2), styles: { halign: 'right', fontStyle: 'bold', fontSize: 8, fillColor: [212, 212, 212] } },
            { content: '', colSpan: 2 }
        ]);

        doc.autoTable({
            head: [[
                'Sauda Date', 'Tender No', 'ID', 'Customer Name', 'Season', 'Grade',
                'Sale Rate', 'Mill Rate', 'Party Name', 'Quantity', 'Dispatch Type', 'Payment Date'
            ]],
            body: tableBody,
            startY: currentY + 2,
            theme: 'grid',
            styles: {
                fontSize: 5,
                cellPadding: 0.6,
                overflow: 'visible',
                lineWidth: 0.1
            },
            columnStyles: {
                0: { halign: 'center' },
                1: { halign: 'center', fontSize: 6 },
                2: { halign: 'center', fontSize: 6 },
                3: { halign: 'left' },
                4: { halign: 'center' },
                5: { halign: 'left' },
                6: { halign: 'right' },
                7: { halign: 'right' },
                8: { halign: 'left' },
                9: { halign: 'right' },
                10: { halign: 'center' },
                11: { halign: 'center' },
            },
            headStyles: {
                fillColor: [180, 180, 180],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                lineWidth: 0.1
            },
            bodyStyles: {
                textColor: [0, 0, 0],
                lineColor: [0, 0, 0],
                lineWidth: 0.1
            }
        });

        const pdfBlob = doc.output("blob");
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPdfPreview(pdfUrl);
    };

    // Group data for table display
    const groupReportData = (data) => {
        const millGroups = {};
        
        data.forEach((item) => {
            const millKey = `${item.mc}-${item.MillName}`;
            if (!millGroups[millKey]) {
                millGroups[millKey] = {
                    millName: `${item.mc} - ${item.MillName}`,
                    grades: {},
                    totalQty: 0
                };
            }
            
            const gradeKey = item.Grade || '';
            if (!millGroups[millKey].grades[gradeKey]) {
                millGroups[millKey].grades[gradeKey] = {
                    gradeName: gradeKey,
                    items: [],
                    totalQty: 0
                };
            }
            
            millGroups[millKey].grades[gradeKey].items.push(item);
            millGroups[millKey].grades[gradeKey].totalQty += parseFloat(item.Qty) || 0;
            millGroups[millKey].totalQty += parseFloat(item.Qty) || 0;
        });
        
        return millGroups;
    };

    const groupedReportData = groupReportData(reportData);
    const grandTotal = Object.values(groupedReportData).reduce((sum, mill) => sum + mill.totalQty, 0);

    return (
        <div style={{marginTop:"-80px"}}>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold" }}>{Company_Name}</Typography>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", textDecoration: 'underline', fontWeight: "550" }}>GSTN : {Company_GSTNO}</Typography>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>Tender Wise Sauda</Typography>
            <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px" }}>{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>

            <div className="mb-3 row align-items-center">
                <div className="col-auto">
                    <button className="btn btn-secondary me-2" onClick={handlePrint}>Print</button>
                    <button className="btn btn-success me-2" onClick={handleExportToExcel}>Export to Excel</button>
                    {pdfPreview && <PdfPreview pdfData={pdfPreview} apiData={reportData[0]} label={"TenderWiseSauda"} />}
                    <button className="btn btn-success" onClick={generatePDF}>PDF Preview</button>
                </div>
            </div>

            <TableContainer component={Paper} style={{ maxHeight: '80vh', overflow: 'auto' }}>
                <Table stickyHeader size="small" aria-label="Tender Wise Sauda Table">
                    <TableHead>
                        <TableRow>
                            {[
                                "Sauda Date", "Tender No", "ID", "Customer Name", "Season", "Grade",
                                "Sale Rate", "Mill Rate", "Party Name", "Quintal", "Dispatch Type", "Payment Date"
                            ].map((header, i) => (
                                <TableCell
                                    key={i}
                                    sx={{
                                        position: 'sticky',
                                        top: 0,
                                        backgroundColor: '#f5f5f5',
                                        fontWeight: 'bold',
                                        textAlign: i === 2 || i === 0 ? 'center' : i > 5 && i <= 9 ? 'right' : 'left',
                                        whiteSpace: "nowrap"
                                    }}
                                >
                                    {header}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {Object.entries(groupedReportData).map(([millKey, millGroup]) => (
                            <React.Fragment key={millKey}>
                                <TableRow>
                                    <TableCell colSpan={12} sx={{ color: 'blue', fontWeight: 'bold' }}>
                                        {millGroup.millName}
                                    </TableCell>
                                </TableRow>

                                {Object.entries(millGroup.grades).map(([gradeKey, gradeGroup]) => (
                                    <React.Fragment key={gradeKey}>
                                        <TableRow>
                                            <TableCell colSpan={12} sx={{ color: 'black', fontWeight: 'bold' }}>
                                                Grade: {gradeGroup.gradeName}
                                            </TableCell>
                                        </TableRow>

                                        {/* Grade Items */}
                                        {gradeGroup.items.map((item, index) => (
                                            <TableRow key={`${gradeKey}-${index}`}>
                                                <TableCell>{formatDate(item.Sauda_Date)}</TableCell>
                                                <TableCell>{item.Tender_No}</TableCell>
                                                <TableCell align="center">{item.ID}</TableCell>
                                                <TableCell align="left">{item.CustomerName}</TableCell>
                                                <TableCell>{item.season}</TableCell>
                                                <TableCell>{item.Grade}</TableCell>
                                                <TableCell align="right">{formatReadableAmount(item.Sale_Rate)}</TableCell>
                                                <TableCell align="right">{formatReadableAmount(item.Mill_Rate)}</TableCell>
                                                <TableCell align="left">{item.PartyName}</TableCell>
                                                <TableCell align="right">{formatReadableAmount(item.Qty)}</TableCell>
                                                <TableCell align="center">{item.DispatchType}</TableCell>
                                                <TableCell>{formatDate(item.PaymentDate)}</TableCell>
                                            </TableRow>
                                        ))}

                                        {/* Grade Total */}
                                        <TableRow>
                                            <TableCell colSpan={9} align="right" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                                                Grade {gradeGroup.gradeName} Total:
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                                                {formatReadableAmount(gradeGroup.totalQty)}
                                            </TableCell>
                                            <TableCell colSpan={2} sx={{ backgroundColor: '#f5f5f5' }}></TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                ))}

                                <TableRow>
                                    <TableCell colSpan={9} align="right" sx={{ color: 'blue', fontWeight: 'bold' }}>
                                        Mill {millGroup.millName} Total:
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: '#e8e8e8' }}>
                                        {formatReadableAmount(millGroup.totalQty)}
                                    </TableCell>
                                    <TableCell colSpan={2} sx={{ backgroundColor: '#e8e8e8' }}></TableCell>
                                </TableRow>

                                      <Box  colSpan={12} sx={{ borderBottom: '1px dotted #000000ff', width: '100%', my: 2 }} />
                            </React.Fragment>
                        ))}

                        <TableRow>
                            <TableCell colSpan={9} align="right" sx={{ fontWeight: 'bold', backgroundColor: '#d4d4d4', fontSize: '14px' }}>
                                GRAND TOTAL:
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: '#d4d4d4', fontSize: '14px' }}>
                                {formatReadableAmount(grandTotal)}
                            </TableCell>
                            <TableCell colSpan={2} sx={{ backgroundColor: '#d4d4d4' }}></TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

            {loading && (
                <div style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 9999
                }}>
                    <RingLoader size={80} />
                </div>
            )}

            {error && <div className="alert alert-danger">{error}</div>}
        </div>
    );
};

export default PendingReports;
