// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import * as XLSX from 'xlsx';
// import { jsPDF } from 'jspdf';
// import 'jspdf-autotable';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
// import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Paper } from '@mui/material';
// import { RingLoader } from 'react-spinners';
// import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate";

// const apikey = process.env.REACT_APP_API;

// const SaleTDSPartyWiseRegister = () => {
//     const navigate = useNavigate();
//     const location = useLocation();
//     // const { fromDate, toDate } = location.state || { fromDate: '', toDate: '' ,companyCode : '',Year_Code : ''};
//     const searchParams = new URLSearchParams(location.search);
//     const fromDate = searchParams.get('fromDate');
//     const toDate = searchParams.get('toDate');
//     const company_Code = searchParams.get('companyCode');
//     const YearCode = searchParams.get('yearCode');
//     const acCode = searchParams.get('acCode');
//     const Company_Name = sessionStorage.getItem('Company_Name')
//     const Company_GSTNO = sessionStorage.getItem('Company_GSTNO')

//     const [reportData, setReportData] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');
//     const [emailId, setEmailId] = useState('');

//     const [grandTotals, setGrandTotals] = useState({
//         TotalTaxable_Amt: 0,
//         CGSTAmt: 0,
//         SGSTAmt: 0,
//         IGSTAmt: 0,
//         BillamountAmt: 0,
//         TDSAmt: 0
//     });

//     const API_URL = `${apikey}/SaleTDS_Register`;

//     useEffect(() => {
//         const fetchReportData = async () => {
//             setLoading(true);
//             setError('');
//             try {
//                 const response = await axios.get(API_URL, {
//                     params: {
//                         from_date: fromDate,
//                         toDate: toDate,
//                         companyCode: company_Code,
//                         YearCode: YearCode,
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

//         fetchReportData();
//     }, [API_URL]);

//     const handleExportToExcel = () => {
//         const wb = XLSX.utils.book_new();
//         const headers = [
//             "PAN", "Party Name", "Taxable Amount", "CGST", "SGST", "IGST", "Bill Amount", "TDS Amount"
//         ];
//         const formattedData = reportData.map(item => ({
//             PAN: item.Pan,
//             "Party Name": item.Name_Of_Party,
//             "Taxable Amount": Number(item.Taxable_Amt) || 0,
//             "CGST": Number(item.CGST) || 0,
//             "SGST": Number(item.SGST) || 0,
//             "IGST": Number(item.IGST) || 0,
//             "Bill Amount": Number(item.Bill_Amount) || 0,
//             "TDS Amount": Number(item.TDS_Amt) || 0
//         }));
//         const ws = XLSX.utils.json_to_sheet(formattedData, { header: headers });
//         const wsCols = [
//             { wch: 15 },
//             { wch: 30 },
//             { wch: 15, alignment: { horizontal: "right" } },
//             { wch: 10, alignment: { horizontal: "right" } },
//             { wch: 10, alignment: { horizontal: "right" } },
//             { wch: 10, alignment: { horizontal: "right" } },
//             { wch: 15, alignment: { horizontal: "right" } },
//             { wch: 12, alignment: { horizontal: "right" } }
//         ];
//         ws["!cols"] = wsCols;
//         XLSX.utils.book_append_sheet(wb, ws, 'SaleTDSRegister');
//         XLSX.writeFile(wb, 'SaleTDSRegister.xlsx');
//     };

//     const handleSendEmail = async () => {
//         if (!emailId) {
//             setError('Please enter an email address');
//             return;
//         }

//         const pdfBlob = await generatePDF();
//         const pdfFileToSend = new File([pdfBlob], 'report.pdf');

//         const formData = new FormData();
//         formData.append('email', emailId);
//         formData.append('pdf', pdfFileToSend);

//         try {
//             const response = await axios.post(`${apikey}/send-pdf-email`, formData, {
//                 headers: {
//                     'Content-Type': 'multipart/form-data',
//                 },
//             });
//             alert(response.data.message || 'Email sent successfully');
//         } catch (error) {
//             console.error('Error sending email:', error);
//             setError('Failed to send email');
//         }
//     };

//     const handlePrint = async () => {
//         try {
//             const companyName = Company_Name;
//             const fromDate = searchParams.get('fromDate');
//             const toDate = searchParams.get('toDate');

//             if (!reportData || reportData.length === 0) {
//                 console.error("Error: reportData is empty or undefined");
//                 return;
//             }

//             const pdfBlob = await generatePDF(companyName, fromDate, toDate, reportData);

//             if (!pdfBlob || !(pdfBlob instanceof Blob)) {
//                 console.error("Error: Invalid PDF Blob", pdfBlob);
//                 return;
//             }

//             const pdfUrl = URL.createObjectURL(pdfBlob);
//             const win = window.open(pdfUrl);

//             if (!win) {
//                 console.error("Popup blocked! Allow popups to print the PDF.");
//                 return;
//             }

//             setTimeout(() => win.print(), 1000);
//         } catch (error) {
//             console.error("Error in handlePrint:", error);
//         }
//     };


//     const generatePDF = async (companyName, fromDate, toDate, reportData) => {
//         const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

//         // Header
//         doc.setFont("helvetica", "bold");
//         doc.setFontSize(16);
//         doc.text(companyName || "Company Name", 105, 15, { align: "center" });

//         doc.setFontSize(12);
//         doc.setFont("helvetica", "normal");
//         doc.text(`GSTN : ${Company_GSTNO || ""}`, 105, 22, { align: "center" });

//         doc.setFontSize(14);
//         doc.setFont("helvetica", "bold");
//         doc.text("Sale TDS Summary Party Wise", 105, 30, { align: "center" });

//         doc.setFontSize(12);
//         doc.setFont("helvetica", "normal");
//         doc.text(`${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`, 105, 37, { align: "center" });

//         const groupedData = groupReportData(reportData);
//         let currentY = 45;

//         let grandTotals = {
//             TotalTaxable_Amt: 0,
//             CGSTAmt: 0,
//             SGSTAmt: 0,
//             IGSTAmt: 0,
//             BillamountAmt: 0,
//             TDSAmt: 0,
//         };

//         for (const [key, group] of Object.entries(groupedData)) {
//             if (!group.items || group.items.length === 0) continue;

//             const parts = key.split("-");
//             const pan = parts[parts.length - 1];
//             const partyName = parts.slice(1, -1).join("-");

//             doc.setFont("helvetica", "bold");
//             doc.setFontSize(10);
//             doc.text(`PAN: ${pan}`, 10, currentY);
//             doc.text(`Party: ${partyName}`, 60, currentY);
//             currentY += 6;

//             const bodyRows = group.items.map(item => [
//                 item.InvoiceNo || "",
//                 item.Inv_date || "",
//                 formatReadableAmount(item.Taxable_Amt),
//                 formatReadableAmount(item.CGST),
//                 formatReadableAmount(item.SGST),
//                 formatReadableAmount(item.IGST),
//                 formatReadableAmount(item.Bill_Amount),
//                 formatReadableAmount(item.TDS_Amt),
//             ]);

//             // Append subtotal row
//             bodyRows.push([
//                 'Sub Total',
//                 '',
//                 formatReadableAmount(group.TotalTaxable_Amt),
//                 formatReadableAmount(group.CGSTAmt),
//                 formatReadableAmount(group.SGSTAmt),
//                 formatReadableAmount(group.IGSTAmt),
//                 formatReadableAmount(group.BillamountAmt),
//                 formatReadableAmount(group.TDSAmt),
//             ]);

//             doc.autoTable({
//                 head: [[
//                     "Inv No",
//                     "Date",
//                     "Taxable Amt",
//                     "CGST",
//                     "SGST",
//                     "IGST",
//                     "Bill Amt",
//                     "TDS Amt"
//                 ]],
//                 body: bodyRows,
//                 startY: currentY,
//                 theme: "grid",
//                 margin: { left: 5, right: 5 },
//                 styles: { fontSize: 8 },
//                 columnStyles: {
//                     0: { cellWidth: 15 },
//                     1: { cellWidth: 20 },
//                     2: { cellWidth: 25, halign: "right" },
//                     3: { cellWidth: 20, halign: "right" },
//                     4: { cellWidth: 20, halign: "right" },
//                     5: { cellWidth: 20, halign: "right" },
//                     6: { cellWidth: 25, halign: "right" },
//                     7: { cellWidth: 25, halign: "right" }
//                 },
//                 headStyles: {
//                     fillColor: [0, 0, 0],
//                     textColor: [255, 255, 255],
//                     fontStyle: "bold"
//                 },
//                 didDrawPage: data => {
//                     currentY = data.cursor.y + 10;
//                 }
//             });

//             grandTotals.TotalTaxable_Amt += group.TotalTaxable_Amt;
//             grandTotals.CGSTAmt += group.CGSTAmt;
//             grandTotals.SGSTAmt += group.SGSTAmt;
//             grandTotals.IGSTAmt += group.IGSTAmt;
//             grandTotals.BillamountAmt += group.BillamountAmt;
//             grandTotals.TDSAmt += group.TDSAmt;
//         }

//         // Grand Total
//         doc.setFont("helvetica", "bold");
//         doc.setFontSize(10);
//         doc.text("Grand Total:", 10, currentY);

//         doc.autoTable({
//             head: [[]],
//             body: [[
//                 '',
//                 '',
//                 formatReadableAmount(grandTotals.TotalTaxable_Amt),
//                 formatReadableAmount(grandTotals.CGSTAmt),
//                 formatReadableAmount(grandTotals.SGSTAmt),
//                 formatReadableAmount(grandTotals.IGSTAmt),
//                 formatReadableAmount(grandTotals.BillamountAmt),
//                 formatReadableAmount(grandTotals.TDSAmt)
//             ]],
//             startY: currentY + 5,
//             theme: "grid",
//             margin: { left: 5, right: 5 },
//             styles: { fontSize: 8 },
//             columnStyles: {
//                 0: { cellWidth: 15 },
//                 1: { cellWidth: 20 },
//                 2: { cellWidth: 25, halign: "right" },
//                 3: { cellWidth: 20, halign: "right" },
//                 4: { cellWidth: 20, halign: "right" },
//                 5: { cellWidth: 20, halign: "right" },
//                 6: { cellWidth: 25, halign: "right" },
//                 7: { cellWidth: 25, halign: "right" }
//             },
//             margin: { left: 5, right: 5 }
//         });

//         return doc.output("blob");
//     };

//     const groupReportData = (data) => {
//         const groupedData = {};
//         data.forEach((item) => {
//             const key = `${item.Party_Code}-${item.Name_Of_Party}-${item.Pan}`;
//             if (!groupedData[key]) {
//                 groupedData[key] = {
//                     items: [],
//                     TotalTaxable_Amt: 0,
//                     CGSTAmt: 0,
//                     SGSTAmt: 0,
//                     IGSTAmt: 0,
//                     BillamountAmt: 0,
//                     TDSAmt: 0,
//                 };
//             }
//             groupedData[key].items.push(item);
//             groupedData[key].TotalTaxable_Amt += parseFloat(item.Taxable_Amt) || 0;
//             groupedData[key].CGSTAmt += parseFloat(item.CGST) || 0;
//             groupedData[key].SGSTAmt += parseFloat(item.SGST) || 0;
//             groupedData[key].IGSTAmt += parseFloat(item.IGST) || 0;
//             groupedData[key].BillamountAmt += parseFloat(item.Bill_Amount) || 0;
//             groupedData[key].TDSAmt += parseFloat(item.TDS_Amt) || 0;
//         });
//         return groupedData;
//     };

//     const groupedReportData = groupReportData(reportData);

//     useEffect(() => {
//         const totals = Object.values(groupedReportData).reduce(
//             (totals, { TotalTaxable_Amt, CGSTAmt, SGSTAmt, IGSTAmt, BillamountAmt, TDSAmt }) => {
//                 totals.TotalTaxable_Amt += TotalTaxable_Amt || 0;
//                 totals.CGSTAmt += CGSTAmt || 0;
//                 totals.SGSTAmt += SGSTAmt || 0;
//                 totals.IGSTAmt += IGSTAmt || 0;
//                 totals.BillamountAmt += BillamountAmt || 0;
//                 totals.TDSAmt += TDSAmt || 0;
//                 return totals;
//             },
//             { TotalTaxable_Amt: 0, CGSTAmt: 0, SGSTAmt: 0, IGSTAmt: 0, BillamountAmt: 0, TDSAmt: 0 }
//         );
//         setGrandTotals(totals);
//     }, [groupedReportData]);
//     return (
//         <div style={{marginTop:"-80px"}}>
//             <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold" }}>{Company_Name}</Typography>
//             <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", textDecoration: 'underline', fontWeight: "550" }}>GSTN : {Company_GSTNO}</Typography>
//             <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>Sale TDS Summary Party Wise</Typography>
//             <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px" }}>{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>

//             <div className="mb-3 row align-items-center">
//                 <div className="col-auto">
//                     <button className="btn btn-secondary me-2" onClick={handlePrint}>Print</button>
//                     <button className="btn btn-success" onClick={handleExportToExcel}>Export to Excel</button>
//                 </div>
//             </div>

//             <div style={{ maxHeight: 'calc(100vh - 250px)', overflow: 'auto', border: '1px solid #ccc' }}>
//                 <Table stickyHeader>
//                     <TableHead>
//                         <TableRow style={{ backgroundColor: '#f5f5f5', position: 'sticky', top: 0, zIndex: 2 }}>
//                             <TableCell style={{ textAlign: "center", fontWeight: "bold" }}>SBill No</TableCell>
//                             <TableCell style={{ textAlign: "left", fontWeight: "bold" }}>Inv Date</TableCell>
//                             <TableCell style={{ textAlign: "right", fontWeight: "bold" }}>Taxable Amount</TableCell>
//                             <TableCell style={{ textAlign: "right", fontWeight: "bold" }}>CGST Amount</TableCell>
//                             <TableCell style={{ textAlign: "right", fontWeight: "bold" }}>SGST Amount</TableCell>
//                             <TableCell style={{ textAlign: "right", fontWeight: "bold" }}>IGST Amount</TableCell>
//                             <TableCell style={{ textAlign: "right", fontWeight: "bold" }}>Bill Amount</TableCell>
//                             <TableCell style={{ textAlign: "right", fontWeight: "bold" }}>TDS</TableCell>
//                         </TableRow>
//                     </TableHead>
//                     <TableBody>
//                         {Object.entries(groupedReportData).map(([key, { items, TotalTaxable_Amt, CGSTAmt, SGSTAmt, IGSTAmt, BillamountAmt, TDSAmt }]) => {
//                             const parts = key.split('-');
//                             const mc = parts[0];
//                             const pan = parts[parts.length - 1];
//                             const PartyName = parts.slice(1, -1).join('-');

//                             return (
//                                 <React.Fragment key={key}>
//                                     <TableRow >
//                                         <TableCell align="center" sx={{ fontWeight: 'bold', color: 'blue' }}>{pan}</TableCell>
//                                         <TableCell align="left" sx={{ fontWeight: 'bold', color: 'blue' }}>{PartyName}</TableCell>
//                                         <TableCell align="right">{formatReadableAmount(TotalTaxable_Amt.toFixed(2))}</TableCell>
//                                         <TableCell align="right">{formatReadableAmount(CGSTAmt.toFixed(2))}</TableCell>
//                                         <TableCell align="right">{formatReadableAmount(SGSTAmt.toFixed(2))}</TableCell>
//                                         <TableCell align="right">{formatReadableAmount(IGSTAmt.toFixed(2))}</TableCell>
//                                         <TableCell align="right">{formatReadableAmount(BillamountAmt.toFixed(2))}</TableCell>
//                                         <TableCell align="right">{formatReadableAmount(TDSAmt.toFixed(2))}</TableCell>
//                                     </TableRow>

//                                     {items.map((item, index) => (
//                                         <TableRow key={index} >
//                                             <TableCell align="center">{item.InvoiceNo}</TableCell>
//                                             <TableCell align="left">{item.Inv_date}</TableCell>
//                                             <TableCell align="right">{formatReadableAmount(item.Taxable_Amt)}</TableCell>
//                                             <TableCell align="right">{formatReadableAmount(item.CGST)}</TableCell>
//                                             <TableCell align="right">{formatReadableAmount(item.SGST)}</TableCell>
//                                             <TableCell align="right">{formatReadableAmount(item.IGST)}</TableCell>
//                                             <TableCell align="right">{formatReadableAmount(item.Bill_Amount)}</TableCell>
//                                             <TableCell align="right">{formatReadableAmount(item.TDS_Amt)}</TableCell>
//                                         </TableRow>
//                                     ))}
//                                 </React.Fragment>
//                             );
//                         })}
//                     </TableBody>

//                     {/* Sticky Footer Row */}
//                     <tfoot>
//                         <TableRow style={{ position: 'sticky', bottom: 0, backgroundColor: 'yellow', zIndex: 1 }}>
//                             <TableCell colSpan={2} sx={{ fontWeight: 'bold', textAlign: 'right' }}>Grand Total</TableCell>
//                             <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>{formatReadableAmount(grandTotals.TotalTaxable_Amt.toFixed(2))}</TableCell>
//                             <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>{formatReadableAmount(grandTotals.CGSTAmt.toFixed(2))}</TableCell>
//                             <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>{formatReadableAmount(grandTotals.SGSTAmt.toFixed(2))}</TableCell>
//                             <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>{formatReadableAmount(grandTotals.IGSTAmt.toFixed(2))}</TableCell>
//                             <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>{formatReadableAmount(grandTotals.BillamountAmt.toFixed(2))}</TableCell>
//                             <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>{formatReadableAmount(grandTotals.TDSAmt.toFixed(2))}</TableCell>
//                         </TableRow>
//                     </tfoot>
//                 </Table>
//             </div>

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

// export default SaleTDSPartyWiseRegister;

















import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as XLSX from 'xlsx';
import { useLocation } from 'react-router-dom';
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import {
    Table, TableBody, TableCell, TableHead, TableRow,
    Typography, Paper, TableFooter, TableContainer, TableSortLabel
} from '@mui/material';
import { ScaleLoader } from 'react-spinners';
import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate";
import PdfPreview from '../../../Common/PDFPreview';
import HeaderJK from '../../../Assets/HeaderJK.png';
import FooterJK from '../../../Assets/FooterJK.png';
import { ConvertNumberToWord } from '../../../Common/FormatFunctions/ConvertNumberToWord';
import { generateReportPDF } from '../../../Common/ReportCommon/CommonPDFGenerator';

const apikey = process.env.REACT_APP_API;

const SCREEN_COLUMNS = [
    { label: 'Inv No', key: 'InvoiceNo', width: '10%' },
    { label: 'Date', key: 'Inv_date', width: '12%' },
    { label: 'Taxable Amt', key: 'Taxable_Amt', width: '13%', numeric: true },
    { label: 'CGST', key: 'CGST', width: '11%', numeric: true },
    { label: 'SGST', key: 'SGST', width: '11%', numeric: true },
    { label: 'IGST', key: 'IGST', width: '11%', numeric: true },
    { label: 'Bill Amt', key: 'Bill_Amount', width: '13%', numeric: true },
    { label: 'TDS', key: 'TDS_Amt', width: '11%', numeric: true },
];

const SaleTDSPartyWiseRegister = () => {
    const location = useLocation();
    const Company_Name = sessionStorage.getItem('Company_Name');
    const Company_GSTNO = sessionStorage.getItem('Company_GSTNO');
    const searchParams = new URLSearchParams(location.search);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const company_Code = searchParams.get('companyCode');
    const YearCode = searchParams.get('yearCode');
    const acCode = searchParams.get('acCode');

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pdfPreview, setPdfPreview] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'InvoiceNo', direction: 'asc' });

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${apikey}/SaleTDS_Register`, {
                    params: { from_date: fromDate, toDate, companyCode: company_Code, YearCode, acCode },
                });
                setReportData(response.data);
            } catch (error) {
                console.error('Error fetching report:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchReportData();
    }, [fromDate, toDate, company_Code, YearCode, acCode]);

    const sortedAndGroupedData = useMemo(() => {
        let items = [...reportData];

        if (sortConfig.key) {
            items.sort((a, b) => {
                const aVal = sortConfig.key.includes('Amt') || sortConfig.key.includes('GST') || sortConfig.key.includes('Amount')
                    ? parseFloat(a[sortConfig.key]) || 0
                    : a[sortConfig.key];
                const bVal = sortConfig.key.includes('Amt') || sortConfig.key.includes('GST') || sortConfig.key.includes('Amount')
                    ? parseFloat(b[sortConfig.key]) || 0
                    : b[sortConfig.key];
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        const grouped = {};
        items.forEach((item) => {
            const key = `${item.Party_Code}-${item.Name_Of_Party}`;
            if (!grouped[key]) {
                grouped[key] = {
                    partyInfo: { pan: item.Pan || 'N/A', name: item.Name_Of_Party },
                    items: [],
                    totals: { taxable: 0, cgst: 0, sgst: 0, igst: 0, bill: 0, tds: 0 }
                };
            }
            grouped[key].items.push(item);
            grouped[key].totals.taxable += parseFloat(item.Taxable_Amt) || 0;
            grouped[key].totals.cgst += parseFloat(item.CGST) || 0;
            grouped[key].totals.sgst += parseFloat(item.SGST) || 0;
            grouped[key].totals.igst += parseFloat(item.IGST) || 0;
            grouped[key].totals.bill += parseFloat(item.Bill_Amount) || 0;
            grouped[key].totals.tds += parseFloat(item.TDS_Amt) || 0;
        });
        return grouped;
    }, [reportData, sortConfig]);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const grandTotals = useMemo(() => {
        return Object.values(sortedAndGroupedData).reduce((acc, curr) => ({
            taxable: acc.taxable + curr.totals.taxable,
            cgst: acc.cgst + curr.totals.cgst,
            sgst: acc.sgst + curr.totals.sgst,
            igst: acc.igst + curr.totals.igst,
            bill: acc.bill + curr.totals.bill,
            tds: acc.tds + curr.totals.tds,
        }), { taxable: 0, cgst: 0, sgst: 0, igst: 0, bill: 0, tds: 0 });
    }, [sortedAndGroupedData]);

    const reportSubtitle = `${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`;

    // Excel Export with Grouping and Formatting
    const handleExportExcel = () => {
        const excelData = [];

        Object.values(sortedAndGroupedData).forEach(group => {
            // Party Header Row
            excelData.push({
                "Inv No": `PARTY: ${group.partyInfo.name} | PAN: ${group.partyInfo.pan}`,
                "Date": "", "Taxable Amt": "", "CGST": "", "SGST": "", "IGST": "", "Bill Amt": "", "TDS": ""
            });

            // Data Rows
            group.items.forEach(item => {
                excelData.push({
                    "Inv No": item.InvoiceNo,
                    "Date": item.Inv_date,
                    "Taxable Amt": parseFloat(item.Taxable_Amt || 0),
                    "CGST": parseFloat(item.CGST || 0),
                    "SGST": parseFloat(item.SGST || 0),
                    "IGST": parseFloat(item.IGST || 0),
                    "Bill Amt": parseFloat(item.Bill_Amount || 0),
                    "TDS": parseFloat(item.TDS_Amt || 0)
                });
            });

            // Sub Total Row for the Group
            excelData.push({
                "Inv No": "GROUP TOTAL",
                "Date": "",
                "Taxable Amt": group.totals.taxable,
                "CGST": group.totals.cgst,
                "SGST": group.totals.sgst,
                "IGST": group.totals.igst,
                "Bill Amt": group.totals.bill,
                "TDS": group.totals.tds
            });

            // Empty spacer row
            excelData.push({});
        });

        // Grand Total Row
        excelData.push({
            "Inv No": "GRAND TOTAL",
            "Taxable Amt": grandTotals.taxable,
            "CGST": grandTotals.cgst,
            "SGST": grandTotals.sgst,
            "IGST": grandTotals.igst,
            "Bill Amt": grandTotals.bill,
            "TDS": grandTotals.tds
        });

        const worksheet = XLSX.utils.json_to_sheet(excelData);

        // Auto-size columns and set number formats
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSX.utils.encode_col(C) + "1";
            if (!worksheet[address]) continue;

            // For columns with "Amt", "GST", or "TDS", apply number format
            if (C >= 2) {
                for (let R = range.s.r + 1; R <= range.e.r; ++R) {
                    const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: C })];
                    if (cell && typeof cell.v === 'number') {
                        cell.z = '#,##0.00'; // Excel number format
                    }
                }
            }
        }

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "SaleTDS_Report");
        XLSX.writeFile(workbook, `SaleTDS_Register_${fromDate}_to_${toDate}.xlsx`);
    };

   const handleGeneratePDF = () => {
    const pdfRows = [];
    const yellowFooterStyle = { fillColor: [255, 249, 196], fontStyle: 'bold' };
    
    Object.values(sortedAndGroupedData).forEach((group) => {
        // Group Header (Grey background)
        pdfRows.push([{ 
            content: `PAN: ${group.partyInfo.pan}  |  Party: ${group.partyInfo.name}`, 
            colSpan: 8, 
            styles: { fillColor: [240, 240, 240], fontStyle: 'bold', fontSize: 9 } 
        }]);

        // Data Rows
        group.items.forEach(item => {
            pdfRows.push([
                item.InvoiceNo, 
                item.Inv_date,
                formatReadableAmount(item.Taxable_Amt), 
                formatReadableAmount(item.CGST),
                formatReadableAmount(item.SGST), 
                formatReadableAmount(item.IGST),
                formatReadableAmount(item.Bill_Amount), 
                formatReadableAmount(item.TDS_Amt)
            ]);
        });

        // Sub Total Row (Making it bold for clarity)
        pdfRows.push([
            { content: 'SUB TOTAL', colSpan: 2, styles: { fontStyle: 'bold' } },
            { content: formatReadableAmount(group.totals.taxable), styles: { fontStyle: 'bold', halign: 'right' } },
            { content: formatReadableAmount(group.totals.cgst), styles: { fontStyle: 'bold', halign: 'right' } },
            { content: formatReadableAmount(group.totals.sgst), styles: { fontStyle: 'bold', halign: 'right' } },
            { content: formatReadableAmount(group.totals.igst), styles: { fontStyle: 'bold', halign: 'right' } },
            { content: formatReadableAmount(group.totals.bill), styles: { fontStyle: 'bold', halign: 'right' } },
            { content: formatReadableAmount(group.totals.tds), styles: { fontStyle: 'bold', halign: 'right' } }
        ]);
    });

    generateReportPDF({
        title: 'Sale TDS Summary Party Wise',
        subtitle: reportSubtitle,
        columns: SCREEN_COLUMNS.map(c => c.label),
        columnWidths: [15, 20, 28, 20, 20, 20, 28, 20],
        rows: pdfRows,
        
        // Final Grand Total Row with Yellow Background and Right Alignment
        footerRow: [
            { content: 'GRAND TOTAL', colSpan: 2, styles: yellowFooterStyle },
            { content: formatReadableAmount(grandTotals.taxable), styles: { ...yellowFooterStyle, halign: 'right' } },
            { content: formatReadableAmount(grandTotals.cgst), styles: { ...yellowFooterStyle, halign: 'right' } },
            { content: formatReadableAmount(grandTotals.sgst), styles: { ...yellowFooterStyle, halign: 'right' } },
            { content: formatReadableAmount(grandTotals.igst), styles: { ...yellowFooterStyle, halign: 'right' } },
            { content: formatReadableAmount(grandTotals.bill), styles: { ...yellowFooterStyle, halign: 'right' } },
            { content: formatReadableAmount(grandTotals.tds), styles: { ...yellowFooterStyle, halign: 'right' } }
        ],

        numericCols: [2, 3, 4, 5, 6, 7],
        headerImgSrc: HeaderJK,
        footerImgSrc: FooterJK,
        orientation: 'landscape',
        onComplete: (url) => setPdfPreview(url),
    });
};

    return (
        <div style={{ padding: '20px',marginTop: '-90px'  }}>
            <Typography variant="h5" align="center" style={{ fontWeight: 'bold' }}>{Company_Name}</Typography>
            <Typography variant="subtitle1" align="center">GSTN: {Company_GSTNO}</Typography>
            <Typography variant="h6" align="center" style={{ fontWeight: 'bold', }}>Sale TDS Summary Party Wise</Typography>
            <Typography variant="subtitle2" align="center" color="textSecondary" style={{ marginBottom: '20px' }}>{reportSubtitle}</Typography>

            <div className="mb-3 d-flex justify-content-end no-print">
                <button className="btn btn-danger me-2" onClick={handleGeneratePDF}>Print PDF</button>
                <button className="btn btn-success" onClick={handleExportExcel}>Export Excel</button>
            </div>

            {pdfPreview && <PdfPreview pdfData={pdfPreview} label="SaleTDSRegisterPartywise" />}

            <TableContainer component={Paper} elevation={3} style={{ maxHeight: '70vh' }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {SCREEN_COLUMNS.map(col => (
                                <TableCell
                                    key={col.label}
                                    align={col.numeric ? 'right' : 'left'}
                                    style={{ backgroundColor: '#5557df', color: '#fff', fontWeight: 'bold' }}
                                >
                                    <TableSortLabel
                                        active={sortConfig.key === col.key}
                                        direction={sortConfig.key === col.key ? sortConfig.direction : 'asc'}
                                        onClick={() => requestSort(col.key)}
                                        sx={{
                                            '&.MuiTableSortLabel-root, &.Mui-active, & .MuiTableSortLabel-icon': { color: '#fff !important' },
                                        }}
                                    >
                                        {col.label}
                                    </TableSortLabel>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Object.entries(sortedAndGroupedData).map(([key, group]) => (
                            <React.Fragment key={key}>
                                <TableRow style={{ backgroundColor: '#f0f2ff' }}>
                                    <TableCell colSpan={8} style={{ fontWeight: 'bold', borderLeft: '5px solid #5557df' }}>
                                        PAN: {group.partyInfo.pan} | Party: {group.partyInfo.name}
                                    </TableCell>
                                </TableRow>
                                {group.items.map((item, idx) => (
                                    <TableRow key={idx} hover>
                                        <TableCell>{item.InvoiceNo}</TableCell>
                                        <TableCell>{item.Inv_date}</TableCell>
                                        <TableCell align="right">{formatReadableAmount(item.Taxable_Amt)}</TableCell>
                                        <TableCell align="right">{formatReadableAmount(item.CGST)}</TableCell>
                                        <TableCell align="right">{formatReadableAmount(item.SGST)}</TableCell>
                                        <TableCell align="right">{formatReadableAmount(item.IGST)}</TableCell>
                                        <TableCell align="right">{formatReadableAmount(item.Bill_Amount)}</TableCell>
                                        <TableCell align="right">{formatReadableAmount(item.TDS_Amt)}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow style={{ backgroundColor: '#fafafa' }}>
                                    <TableCell colSpan={2} style={{ fontWeight: 'bold', textAlign: 'center' }}>SUB TOTAL</TableCell>
                                    <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(group.totals.taxable)}</TableCell>
                                    <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(group.totals.cgst)}</TableCell>
                                    <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(group.totals.sgst)}</TableCell>
                                    <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(group.totals.igst)}</TableCell>
                                    <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(group.totals.bill)}</TableCell>
                                    <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(group.totals.tds)}</TableCell>
                                </TableRow>
                            </React.Fragment>
                        ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow style={{ backgroundColor: '#fff9c4' }}>
                            <TableCell colSpan={2} style={{ fontWeight: 'bold', fontSize: '1rem' }}>GRAND TOTAL</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.taxable)}</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.cgst)}</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.sgst)}</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.igst)}</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.bill)}</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.tds)}</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </TableContainer>

            {loading && (
                <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                    <ScaleLoader color="#36d7b7" height={35} width={4} radius={2} margin={2} />
                </div>
            )}
        </div>
    );
};

export default SaleTDSPartyWiseRegister;
