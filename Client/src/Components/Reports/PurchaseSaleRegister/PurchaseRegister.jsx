// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import * as XLSX from 'xlsx';
// import { jsPDF } from 'jspdf';
// import 'jspdf-autotable';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
// import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from "@mui/material";
// import { RingLoader } from 'react-spinners';
// import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate"

// const apikey = process.env.REACT_APP_API;

// const PurchaseRegister = () => {
//     const navigate = useNavigate();
//     const location = useLocation();
//     // const { fromDate, toDate } = location.state || { fromDate: '', toDate: '' ,companyCode : '',Year_Code : ''};
//     const searchParams = new URLSearchParams(location.search);
//     const Company_Name = sessionStorage.getItem('Company_Name')
//     const Company_GSTNO = sessionStorage.getItem('Company_GSTNO')
//     const fromDate = searchParams.get('fromDate');
//     const toDate = searchParams.get('toDate');
//     const company_Code = searchParams.get('companyCode');
//     const YearCode = searchParams.get('yearCode');
//     const acCode = searchParams.get('acCode');

//     const [reportData, setReportData] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');

//     const [grandTotals, setGrandTotals] = useState({
//         TotalTaxable_Amt: 0,
//         CGSTAmt: 0,
//         SGSTAmt: 0,
//         IGSTAmt: 0,
//         BillamountAmt: 0,
//         netqntl: 0
//     });

//     const API_URL = `${apikey}/Purchase_Register`;

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
//                         Company_Code: company_Code,
//                         Year_code: YearCode,
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

//     useEffect(() => {
//         if (reportData.length > 0) {
//             const totals = reportData.reduce(
//                 (acc, item) => {
//                     acc.TotalTaxable_Amt += Number(item.subTotal) || 0;
//                     acc.CGSTAmt += Number(item.CGSTAmount) || 0;
//                     acc.SGSTAmt += Number(item.SGSTAmount) || 0;
//                     acc.IGSTAmt += Number(item.IGSTAmount) || 0;
//                     acc.BillamountAmt += Number(item.Bill_Amount) || 0;
//                     acc.netqntl += Number(item.NETQNTL) || 0;
//                     return acc;
//                 },
//                 { TotalTaxable_Amt: 0, CGSTAmt: 0, SGSTAmt: 0, IGSTAmt: 0, BillamountAmt: 0, netqntl: 0 }
//             );

//             setGrandTotals(totals);
//         }
//     }, [reportData]);

//     const handleExportToExcel = () => {
//         const wb = XLSX.utils.book_new();

//         const headers = [
//             "Our No", "Date", "Bill No", "Supplier Name", "Supplier GSTNo", "NetQntl", "GST Rate", "Taxable Amount", "CGST Amt", "SGST Amt", "IGST Amt", "Bill Amount"
//         ];

//         const formattedData = reportData.map(item => ({

//             "Our No": item.doc_no,
//             "Date": formatDate(item.doc_date),
//             "Bill No": item.Bill_No,
//             "Supplier Name": item.suppliername,
//             "Supplier GSTNo": item.suppliergstno,
//             "NetQntl": Number(item.NETQNTL) || 0,
//             "GST Rate": item.gstrate,
//             "Taxable Amount": Number(item.subTotal) || 0,
//             "CGST Amt": Number(item.CGSTAmount) || 0,
//             "SGST Amt": Number(item.SGSTAmount) || 0,
//             "IGST Amt": Number(item.IGSTAmount) || 0,
//             "Bill Amount": Number(item.Bill_Amount) || 0,

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

//         XLSX.utils.book_append_sheet(wb, ws, 'PurchaseRegister');
//         XLSX.writeFile(wb, 'PurchaseRegister.xlsx');
//     };

//     const handlePrint = async () => {
//         const companyName = Company_Name;
//         const fromDate = searchParams.get('fromDate');
//         const toDate = searchParams.get('toDate');
//         const pdfBlob = await generatePDF(companyName, fromDate, toDate);
//         const pdfUrl = URL.createObjectURL(pdfBlob);
//         const win = window.open(pdfUrl, '',);
//         win.document.close();
//         win.print();
//     };


//     const generatePDF = async (companyName, fromDate, toDate) => {
//         const doc = new jsPDF();

//         const groupedData = groupReportData(reportData);
//         const tableData = [];

//         doc.setFontSize(16);
//         doc.text(companyName, doc.internal.pageSize.width / 2, 10, { align: 'center' });

//         doc.setFontSize(10);
//         doc.text(`Sale Register From: ${formatDate(fromDate)} To ${formatDate(toDate)}`, 10, 20);

//         tableData.push(["Our No", "Date", "Bill No", "Supplier Name", "Supplier GSTNo", "NetQntl", "GST Rate", "Taxable Amount", "CGST Amt", "SGST Amt", "IGST Amt", "Bill Amount"]);

//         Object.entries(groupedData).forEach(([key, group]) => {
//             group.items.forEach((item) => {
//                 tableData.push([
//                     item.doc_no,
//                     formatDate(item.doc_date),
//                     item.Bill_No,
//                     item.suppliername,
//                     item.suppliergstno,
//                     formatReadableAmount(item.NETQNTL),
//                     item.gstrate,
//                     formatReadableAmount(item.subTotal),
//                     formatReadableAmount(item.CGSTAmount),
//                     formatReadableAmount(item.SGSTAmount),
//                     formatReadableAmount(item.IGSTAmount),
//                     formatReadableAmount(item.Bill_Amount),
//                 ]);
//             });
//         });

//         const totalRow = [
//             '', '', '', 'Total', '',
//             formatReadableAmount(grandTotals.netqntl),
//             '',
//             formatReadableAmount(grandTotals.TotalTaxable_Amt),
//             formatReadableAmount(grandTotals.CGSTAmt),
//             formatReadableAmount(grandTotals.SGSTAmt),
//             formatReadableAmount(grandTotals.IGSTAmt),
//             formatReadableAmount(grandTotals.BillamountAmt)
//         ];

//         tableData.push(totalRow);

//         doc.autoTable({
//             headStyles: {
//                 fillColor: [255, 0, 0],
//                 fontStyle: 'bold',
//             },
//             body: tableData,
//             margin: { top: 25 },
//             styles: {
//                 fontSize: 5,
//                 cellPadding: 1,
//                 halign: 'center',
//             },
//             columnStyles: {
//                 2: { halign: 'left' },
//                 4: { halign: 'right' },
//                 5: { halign: 'right' },
//                 6: { halign: 'right' },
//                 7: { halign: 'right' },
//                 8: { halign: 'right' },
//                 9: { halign: 'right' },
//                 10: { halign: 'right' },
//             },
//             theme: 'grid',
//         });

//         return doc.output('blob');
//     };

//     const groupReportData = (data) => {
//         const groupedData = {};
//         data.forEach((item) => {
//             const key = `${item.purchaseid}`;
//             if (!groupedData[key]) {
//                 groupedData[key] = {
//                     items: [],
//                     totalQty: 0,
//                 };
//             }
//             groupedData[key].items.push(item);
//             groupedData[key].totalQty += parseFloat(item.Bill_Amount) || 0;
//         });
//         return groupedData;
//     };

//     const groupedReportData = groupReportData(reportData);
// return (
//     <div style={{marginTop:"-80px"}}>

//     <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold" }}>{Company_Name}</Typography>
//             <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", textDecoration: 'underline', fontWeight: "550" }}>GSTN : {Company_GSTNO}</Typography>
//             <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>Purchase Register</Typography>
//             <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px" }}>{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>

//         <div className="mb-3 row align-items-center">
//             <div className="col-auto">
//                 <button className="btn btn-secondary me-2" onClick={handlePrint}>Print</button>
//                 <button className="btn btn-success" onClick={handleExportToExcel}>Export to Excel</button>
//             </div>
//         </div>

//         <TableContainer component={Paper} style={{ maxHeight: '80vh', overflow: 'auto' }} id="reportTable">
//             <Table stickyHeader>
//                 <TableHead>
//                     <TableRow>
//                         {[
//                             "Our No", "Date", "Bill No", "Supplier Name", "Supplier GST No",
//                             "Net Quintal", "GST Rate", "Taxable Amount", "CGST Amount",
//                             "SGST Amount", "IGST Amount", "Bill Amount"
//                         ].map((label, i) => (
//                             <TableCell
//                                 key={i}
//                                 sx={{
//                                     position: 'sticky',
//                                     top: 0,
//                                     backgroundColor: '#f5f5f5',
//                                     fontWeight: 'bold',
//                                     zIndex: 2,
//                                     textAlign: i < 3 ? 'center' : (i === 3 ? 'left' : 'right'),
//                                     whiteSpace:"nowrap"
//                                 }}
//                             >
//                                 {label}
//                             </TableCell>
//                         ))}
//                     </TableRow>
//                 </TableHead>

//                 <TableBody>
//                     {Object.entries(groupedReportData).map(([key, { items }]) => (
//                         <React.Fragment key={key}>
//                             {items.map((item, index) => (
//                                 <TableRow key={index}>
//                                     <TableCell align="center">{item.doc_no}</TableCell>
//                                     <TableCell align="center">{formatDate(item.doc_date)}</TableCell>
//                                     <TableCell align="center">{item.Bill_No}</TableCell>
//                                     <TableCell align="left">{item.suppliername}</TableCell>
//                                     <TableCell align="center">{item.suppliergstno}</TableCell>
//                                     <TableCell align="right">{formatReadableAmount(item.NETQNTL)}</TableCell>
//                                     <TableCell align="right">{item.gstrate}</TableCell>
//                                     <TableCell align="right">{formatReadableAmount(item.subTotal)}</TableCell>
//                                     <TableCell align="right">{formatReadableAmount(item.CGSTAmount)}</TableCell>
//                                     <TableCell align="right">{formatReadableAmount(item.SGSTAmount)}</TableCell>
//                                     <TableCell align="right">{formatReadableAmount(item.IGSTAmount)}</TableCell>
//                                     <TableCell align="right">{formatReadableAmount(item.Bill_Amount)}</TableCell>
//                                 </TableRow>
//                             ))}
//                         </React.Fragment>
//                     ))}

//                     <TableRow>
//                         <TableCell
//                             colSpan={5}
//                             sx={{
//                                 position: 'sticky',
//                                 bottom: 0,
//                                 backgroundColor: 'yellow',
//                                 fontWeight: 'bold',
//                                 zIndex: 1
//                             }}
//                         >

//                         </TableCell>
//                         <TableCell
//                             align="right"
//                             sx={{
//                                 position: 'sticky',
//                                 bottom: 0,
//                                 backgroundColor: 'yellow',
//                                 fontWeight: 'bold',
//                                 zIndex: 1
//                             }}
//                         >
//                             {formatReadableAmount(grandTotals?.netqntl || 0)}
//                         </TableCell>
//                         <TableCell
//                             sx={{
//                                 position: 'sticky',
//                                 bottom: 0,
//                                 backgroundColor: 'yellow',
//                                 fontWeight: 'bold',
//                                 zIndex: 1
//                             }}
//                         >

//                         </TableCell>
//                         {[grandTotals?.TotalTaxable_Amt, grandTotals?.CGSTAmt, grandTotals?.SGSTAmt, grandTotals?.IGSTAmt, grandTotals?.BillamountAmt].map((val, i) => (
//                             <TableCell
//                                 key={i}
//                                 align="right"
//                                 sx={{
//                                     position: 'sticky',
//                                     bottom: 0,
//                                     backgroundColor: 'yellow',
//                                     fontWeight: 'bold',
//                                     zIndex: 1
//                                 }}
//                             >
//                                 {formatReadableAmount(val || 0)}
//                             </TableCell>
//                         ))}
//                     </TableRow>
//                 </TableBody>
//             </Table>
//         </TableContainer>

//         {loading && (
//             <div style={{
//                 position: 'fixed',
//                 top: '50%',
//                 left: '50%',
//                 transform: 'translate(-50%, -50%)',
//                 zIndex: 9999
//             }}>
//                 <RingLoader size={80} />
//             </div>
//         )}

//         {error && <div className="alert alert-danger">{error}</div>}
//     </div>
// );

// };

// export default PurchaseRegister;
















import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as XLSX from 'xlsx';
import { useLocation } from 'react-router-dom';
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import {
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, Typography, TableSortLabel, TableFooter
} from "@mui/material";
import { ScaleLoader } from 'react-spinners';
import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate";
import PdfPreview from '../../../Common/PDFPreview';
import HeaderJK from '../../../Assets/HeaderJK.png';
import FooterJK from '../../../Assets/FooterJK.png';
import { ConvertNumberToWord } from '../../../Common/FormatFunctions/ConvertNumberToWord';
import { generateReportPDF } from '../../../Common/ReportCommon/CommonPDFGenerator';

const apikey = process.env.REACT_APP_API;

// All columns for Screen and Excel
const SCREEN_COLUMNS = [
    { label: "Our No", key: "doc_no", width: '5%' },
    { label: "Date", key: "doc_date", width: '8%', center: true },
    { label: "Bill No", key: "Bill_No", width: '7%' },
    { label: "Supplier Name", key: "suppliername", width: '20%' },
    { label: "GST No", key: "suppliergstno", width: '12%' },
    { label: "Net Qntl", key: "NETQNTL", width: '8%', numeric: true },
    { label: "GST Rate", key: "gstrate", width: '6%', numeric: true },
    { label: "Taxable", key: "subTotal", width: '8%', numeric: true },
    { label: "CGST", key: "CGSTAmount", width: '6%', numeric: true },
    { label: "SGST", key: "SGSTAmount", width: '6%', numeric: true },
    { label: "IGST", key: "IGSTAmount", width: '6%', numeric: true },
    { label: "Bill Amount", key: "Bill_Amount", width: '8%', numeric: true },
];

// Limited columns for PDF Print (Removed GST No and GST Rate)
const PRINT_COLUMNS = [
    { label: 'Our No', key: 'doc_no', printWidth: '12mm' },
    { label: 'Date', key: 'doc_date', printWidth: '18mm', center: true },
    { label: 'Bill No', key: 'Bill_No', printWidth: '15mm' },
    { label: 'Supplier Name', key: 'suppliername', printWidth: '45mm' },
    { label: 'Net Qntl', key: 'NETQNTL', printWidth: '18mm', numeric: true },
    { label: 'Taxable', key: 'subTotal', printWidth: '22mm', numeric: true },
    { label: 'CGST', key: 'CGSTAmount', printWidth: '18mm', numeric: true },
    { label: 'SGST', key: 'SGSTAmount', printWidth: '18mm', numeric: true },
    { label: 'IGST', key: 'IGSTAmount', printWidth: '15mm', numeric: true },
    { label: 'Bill Amount', key: 'Bill_Amount', printWidth: '20mm', numeric: true },
];

const PRINT_NUMERIC_COLS = PRINT_COLUMNS.map((c, i) => (c.numeric ? i : null)).filter(i => i !== null);
const PRINT_CENTER_COLS = PRINT_COLUMNS.map((c, i) => (c.center ? i : null)).filter(i => i !== null);

const PurchaseRegister = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const Company_Name = sessionStorage.getItem('Company_Name');
    const Company_GSTNO = sessionStorage.getItem('Company_GSTNO');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const company_Code = searchParams.get('companyCode');
    const YearCode = searchParams.get('yearCode');
    const acCode = searchParams.get('acCode');

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pdfPreview, setPdfPreview] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'doc_no', direction: 'asc' });

    // Date formatter for DD/MM/YYYY
    const formatDate = (dateString) => {
        if (!dateString) return "";
        const d = new Date(dateString);
        return [
            String(d.getDate()).padStart(2, '0'),
            String(d.getMonth() + 1).padStart(2, '0'),
            String(d.getFullYear()),
        ].join('/');
    };

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${apikey}/Purchase_Register`, {
                    params: { from_date: fromDate, to_date: toDate, Company_Code: company_Code, Year_code: YearCode, acCode }
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

    const sortedData = useMemo(() => {
        let items = [...reportData];
        if (sortConfig.key) {
            items.sort((a, b) => {
                const aVal = isNaN(a[sortConfig.key]) ? a[sortConfig.key] : parseFloat(a[sortConfig.key]);
                const bVal = isNaN(b[sortConfig.key]) ? b[sortConfig.key] : parseFloat(b[sortConfig.key]);
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return items;
    }, [reportData, sortConfig]);

    const grandTotals = useMemo(() => {
        return sortedData.reduce((acc, item) => ({
            netqntl: acc.netqntl + (parseFloat(item.NETQNTL) || 0),
            taxable: acc.taxable + (parseFloat(item.subTotal) || 0),
            cgst: acc.cgst + (parseFloat(item.CGSTAmount) || 0),
            sgst: acc.sgst + (parseFloat(item.SGSTAmount) || 0),
            igst: acc.igst + (parseFloat(item.IGSTAmount) || 0),
            bill: acc.bill + (parseFloat(item.Bill_Amount) || 0),
        }), { netqntl: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, bill: 0 });
    }, [sortedData]);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const handleExportExcel = () => {
        const worksheetData = sortedData.map(item => ({
            "Our No": item.doc_no,
            "Date": formatDate(item.doc_date),
            "Bill No": item.Bill_No,
            "Supplier": item.suppliername,
            "GST No": item.suppliergstno,
            "Net Qntl": parseFloat(item.NETQNTL || 0),
            "GST Rate": parseFloat(item.gstrate || 0),
            "Taxable": parseFloat(item.subTotal || 0),
            "CGST": parseFloat(item.CGSTAmount || 0),
            "SGST": parseFloat(item.SGSTAmount || 0),
            "IGST": parseFloat(item.IGSTAmount || 0),
            "Bill Amount": parseFloat(item.Bill_Amount || 0),
        }));

        worksheetData.push({
            "Supplier": "GRAND TOTAL",
            "Net Qntl": grandTotals.netqntl,
            "Taxable": grandTotals.taxable,
            "CGST": grandTotals.cgst,
            "SGST": grandTotals.sgst,
            "IGST": grandTotals.igst,
            "Bill Amount": grandTotals.bill,
        });

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Purchase_Register");
        XLSX.writeFile(workbook, `PurchaseRegister_${fromDate}_to_${toDate}.xlsx`);
    };

    // Data specifically for PDF Print (Matches PRINT_COLUMNS)
    const renderPrintRow = (item) => [
        item.doc_no,
        formatDate(item.doc_date),
        item.Bill_No,
        item.suppliername,
        formatReadableAmount(item.NETQNTL),
        formatReadableAmount(item.subTotal),
        formatReadableAmount(item.CGSTAmount),
        formatReadableAmount(item.SGSTAmount),
        formatReadableAmount(item.IGSTAmount),
        formatReadableAmount(item.Bill_Amount)
    ];

const handleGeneratePDF = () => {
    const yellowFooterStyle = { 
        fillColor: [255, 249, 196], 
        fontStyle: 'bold' 
    };

    generateReportPDF({
        title: 'Purchase Register',
        subtitle: `${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`,
        columns: PRINT_COLUMNS.map(c => c.label),
        columnWidths: PRINT_COLUMNS.map(c => parseInt(c.printWidth)),
        rows: sortedData.map(renderPrintRow),
        
        // Styled footer with yellow background and correct alignment
        footerRow: [
            { content: 'TOTAL', styles: yellowFooterStyle },
            { content: '', styles: yellowFooterStyle },
            { content: '', styles: yellowFooterStyle },
            { content: '', styles: yellowFooterStyle },
            { content: formatReadableAmount(grandTotals.netqntl), styles: { ...yellowFooterStyle, halign: 'right' } },
            { content: formatReadableAmount(grandTotals.taxable), styles: { ...yellowFooterStyle, halign: 'right' } },
            { content: formatReadableAmount(grandTotals.cgst), styles: { ...yellowFooterStyle, halign: 'right' } },
            { content: formatReadableAmount(grandTotals.sgst), styles: { ...yellowFooterStyle, halign: 'right' } },
            { content: formatReadableAmount(grandTotals.igst), styles: { ...yellowFooterStyle, halign: 'right' } },
            { content: formatReadableAmount(grandTotals.bill), styles: { ...yellowFooterStyle, halign: 'right' } }
        ],

        numericCols: PRINT_NUMERIC_COLS,
        centerCols: PRINT_CENTER_COLS,
        amountInWords: ConvertNumberToWord(grandTotals.bill),
        headerImgSrc: HeaderJK,
        footerImgSrc: FooterJK,
        orientation: 'landscape',
        onComplete: (url) => setPdfPreview(url),
    });
};

    return (
        <div style={{ padding: '10px',marginTop: '-80px'}}>
            <Typography variant="h5" align="center" style={{ fontWeight: 'bold'  }}>{Company_Name}</Typography>
            <Typography variant="subtitle1" align="center">GSTN: {Company_GSTNO}</Typography>
            <Typography variant="h6" align="center" style={{ fontWeight: 'bold'}}>Purchase Register</Typography>
            <Typography variant="subtitle2" align="center" color="textSecondary">
                {FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}
            </Typography>

            <div className="my-1 d-flex justify-content-end no-print">
                <button className="btn btn-danger me-2" onClick={handleGeneratePDF}>Print</button>
                <button className="btn btn-success" onClick={handleExportExcel}>Export Excel</button>
            </div>

            {pdfPreview && <PdfPreview pdfData={pdfPreview} label="PurchaseRegister" />}

            <TableContainer component={Paper} elevation={3} style={{ maxHeight: '70vh' }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {SCREEN_COLUMNS.map(col => (
                                <TableCell
                                    key={col.label}
                                    align={col.numeric ? 'right' : col.center ? 'center' : 'left'}
                                    style={{ backgroundColor: '#5557df', color: '#fff', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                                >
                                    <TableSortLabel
                                        active={sortConfig.key === col.key}
                                        direction={sortConfig.key === col.key ? sortConfig.direction : 'asc'}
                                        onClick={() => requestSort(col.key)}
                                        sx={{ '&.MuiTableSortLabel-root, &.Mui-active, & .MuiTableSortLabel-icon': { color: '#fff !important' } }}
                                    >
                                        {col.label}
                                    </TableSortLabel>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedData.map((item, idx) => (
                            <TableRow key={idx} hover>
                                <TableCell>{item.doc_no}</TableCell>
                                <TableCell align="center">{formatDate(item.doc_date)}</TableCell>
                                <TableCell>{item.Bill_No}</TableCell>
                                <TableCell>{item.suppliername}</TableCell>
                                <TableCell>{item.suppliergstno}</TableCell>
                                <TableCell align="right">{formatReadableAmount(item.NETQNTL)}</TableCell>
                                <TableCell align="right">{item.gstrate}</TableCell>
                                <TableCell align="right">{formatReadableAmount(item.subTotal)}</TableCell>
                                <TableCell align="right">{formatReadableAmount(item.CGSTAmount)}</TableCell>
                                <TableCell align="right">{formatReadableAmount(item.SGSTAmount)}</TableCell>
                                <TableCell align="right">{formatReadableAmount(item.IGSTAmount)}</TableCell>
                                <TableCell align="right">{formatReadableAmount(item.Bill_Amount)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter style={{ position: 'sticky', bottom: 0, zIndex: 5 }}>
                        <TableRow style={{ backgroundColor: '#ffffcc' }}>
                            <TableCell colSpan={5} style={{ fontWeight: 'bold' }}>GRAND TOTAL</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.netqntl)}</TableCell>
                            <TableCell />
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.taxable)}</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.cgst)}</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.sgst)}</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.igst)}</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.bill)}</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </TableContainer>

            {loading && (
                <div style={{
                    position: 'fixed', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)', zIndex: 9999,
                }}>
                    <ScaleLoader color="#36d7b7" height={35} width={4} radius={2} margin={2} />
                </div>
            )}
        </div>
    );
};

export default PurchaseRegister;
