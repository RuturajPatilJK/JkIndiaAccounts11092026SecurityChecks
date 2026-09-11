// import React, { useState, useEffect, useMemo } from 'react';
// import axios from 'axios';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import * as XLSX from 'xlsx';
// import { jsPDF } from 'jspdf';
// import 'jspdf-autotable';
// import { useLocation } from 'react-router-dom';
// import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
// import { Table, TableBody, TableCell, TableHead, TableRow, Typography, Paper, TableFooter } from '@mui/material';
// import { RingLoader } from 'react-spinners';
// import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate"

// const apikey = process.env.REACT_APP_API;

// const SaleTDSRegister = () => {
//   const location = useLocation();
//   const Company_Name = sessionStorage.getItem('Company_Name')
//   const Company_GSTNO = sessionStorage.getItem('Company_GSTNO')
//   const searchParams = new URLSearchParams(location.search);
//   const fromDate = searchParams.get('fromDate');
//   const toDate = searchParams.get('toDate');
//   const company_Code = searchParams.get('companyCode');
//   const YearCode = searchParams.get('yearCode');
//   const acCode = searchParams.get('acCode');
//   const [reportData, setReportData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   let [grandTotals, setGrandTotals] = useState({
//     TotalTaxable_Amt: 0,
//     CGSTAmt: 0,
//     SGSTAmt: 0,
//     IGSTAmt: 0,
//     BillamountAmt: 0,
//     TDSAmt: 0
//   });

//   const API_URL = `${apikey}/SaleTDS_Register`;

//   useEffect(() => {
//     const fetchReportData = async () => {
//       setLoading(true);
//       setError('');
//       try {
//         const response = await axios.get(API_URL, {
//           params: {
//             from_date: fromDate,
//             toDate: toDate,
//             companyCode: company_Code,
//             YearCode: YearCode,
//             acCode: acCode
//           },
//         });
//         setReportData(response.data);
//       } catch (error) {
//         console.error('Error fetching report:', error);
//         setError('Error fetching report');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchReportData();
//   }, [API_URL]);


//   const handleExportToExcel = () => {
//     const wb = XLSX.utils.book_new();
//     const headers = [
//       "PAN", "Party Name", "Taxable Amount", "CGST", "SGST", "IGST", "Bill Amount", "TDS Amount"
//     ];

//     const partyTotals = {};

//     reportData.forEach(item => {
//       const party = item.Name_Of_Party;
//       if (!partyTotals[party]) {
//         partyTotals[party] = {
//           PAN: item.Pan,
//           "Party Name": item.Name_Of_Party,
//           "Taxable Amount": 0,
//           "CGST": 0,
//           "SGST": 0,
//           "IGST": 0,
//           "Bill Amount": 0,
//           "TDS Amount": 0,
//         };
//       }

//       partyTotals[party]["Taxable Amount"] += Number(item.Taxable_Amt) || 0;
//       partyTotals[party]["CGST"] += Number(item.CGST) || 0;
//       partyTotals[party]["SGST"] += Number(item.SGST) || 0;
//       partyTotals[party]["IGST"] += Number(item.IGST) || 0;
//       partyTotals[party]["Bill Amount"] += Number(item.Bill_Amount) || 0;
//       partyTotals[party]["TDS Amount"] += Number(item.TDS_Amt) || 0;
//     });

//     const formattedData = Object.values(partyTotals).map(entry => ({
//       PAN: entry.PAN,
//       "Party Name": entry["Party Name"],
//       "Taxable Amount": entry["Taxable Amount"],
//       "CGST": entry["CGST"],
//       "SGST": entry["SGST"],
//       "IGST": entry["IGST"],
//       "Bill Amount": entry["Bill Amount"],
//       "TDS Amount": entry["TDS Amount"]
//     }));

//     const ws = XLSX.utils.json_to_sheet(formattedData, { header: headers });
//     const wsCols = [
//       { wch: 15 },
//       { wch: 30 },
//       { wch: 15 },
//       { wch: 10 },
//       { wch: 10 },
//       { wch: 10 },
//       { wch: 15 },
//       { wch: 12 },
//     ];
//     ws["!cols"] = wsCols;

//     XLSX.utils.book_append_sheet(wb, ws, 'SaleTDSRegister');
//     XLSX.writeFile(wb, 'SaleTDSRegister.xlsx');
//   };

//   const handlePrint = async () => {
//     try {
//       const companyName = Company_Name;
//       const fromDate = searchParams.get('fromDate');
//       const toDate = searchParams.get('toDate');

//       if (!reportData || reportData.length === 0) {
//         console.error("Error: reportData is empty or undefined");
//         return;
//       }

//       const pdfBlob = await generatePDF(companyName, fromDate, toDate, reportData);

//       if (!pdfBlob || !(pdfBlob instanceof Blob)) {
//         console.error("Error: Invalid PDF Blob", pdfBlob);
//         return;
//       }

//       const pdfUrl = URL.createObjectURL(pdfBlob);
//       const win = window.open(pdfUrl);

//       if (!win) {
//         console.error("Popup blocked! Allow popups to print the PDF.");
//         return;
//       }

//       setTimeout(() => win.print(), 1000);
//     } catch (error) {
//       console.error("Error in handlePrint:", error);
//     }
//   };

//   const generatePDF = async (companyName, fromDate, toDate, reportData) => {
//     if (!Array.isArray(reportData) || reportData.length === 0) {
//       console.error("Error: reportData is invalid", reportData);
//       return;
//     }
//     const doc = new jsPDF();
//     const pageWidth = doc.internal.pageSize.getWidth();

//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(12);
//     doc.text(companyName || "Company Name", pageWidth / 2, 10, { align: 'center' });

//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(10);
//     doc.text(`GSTN : ${Company_GSTNO || ""}`, pageWidth / 2, 17, { align: 'center' });

//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(10);
//     doc.text("Sale TDS Summary", pageWidth / 2, 24, { align: 'center' });

//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(10);
//     doc.text(`${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`, pageWidth / 2, 30, { align: 'center' });

//     const groupedData = groupReportData(reportData) || {};
//     const tableData = [];

//     tableData.push(['SBill No', 'Customer Name', 'Taxable Amt', 'CGST Amt', 'SGST Amt', 'IGST Amt', 'Bill Amount', 'TDS']);

//     const grandTotals1 = {
//       TotalTaxable_Amt: 0,
//       CGSTAmt: 0,
//       SGSTAmt: 0,
//       IGSTAmt: 0,
//       BillamountAmt: 0,
//       TDSAmt: 0
//     };

//     Object.entries(groupedData).forEach(([key, totals]) => {
//       if (!totals.TotalTaxable_Amt) return;

//       const parts = key.split('-');
//       const pan = parts[parts.length - 1];
//       const PartyName = parts.slice(1, -1).join('-');

//       tableData.push([
//         pan,
//         PartyName,
//         formatReadableAmount(totals.TotalTaxable_Amt),
//         formatReadableAmount(totals.CGSTAmt),
//         formatReadableAmount(totals.SGSTAmt),
//         formatReadableAmount(totals.IGSTAmt),
//         formatReadableAmount(totals.BillamountAmt),
//         formatReadableAmount(totals.TDSAmt),
//       ]);

//       grandTotals1.TotalTaxable_Amt += totals.TotalTaxable_Amt;
//       grandTotals1.CGSTAmt += totals.CGSTAmt;
//       grandTotals1.SGSTAmt += totals.SGSTAmt;
//       grandTotals1.IGSTAmt += totals.IGSTAmt;
//       grandTotals1.BillamountAmt += totals.BillamountAmt;
//       grandTotals1.TDSAmt += totals.TDSAmt;
//     });

//     tableData.push([
//       '', 'Total',
//       formatReadableAmount(grandTotals1.TotalTaxable_Amt),
//       formatReadableAmount(grandTotals1.CGSTAmt),
//       formatReadableAmount(grandTotals1.SGSTAmt),
//       formatReadableAmount(grandTotals1.IGSTAmt),
//       formatReadableAmount(grandTotals1.BillamountAmt),
//       formatReadableAmount(grandTotals1.TDSAmt)
//     ]);

//     doc.autoTable({
//       headStyles: {
//         fillColor: [255, 0, 0],
//         fontStyle: 'bold',
//       },
//       body: tableData,
//       startY: 35,
//       styles: {
//         fontSize: 6,
//         cellPadding: 1,
//         halign: 'center',
//       },
//       columnStyles: {
//         0: { halign: 'left' },
//         1: { halign: 'left' },
//         2: { halign: 'right' },
//         3: { halign: 'right' },
//         4: { halign: 'right' },
//         5: { halign: 'right' },
//         6: { halign: 'right' },
//         7: { halign: 'right' },
//       },
//       theme: 'grid',
//     });

//     return doc.output('blob');
//   };


//   const groupReportData = (data) => {
//     const groupedData = {};
//     data.forEach((item) => {
//       const key = `${item.Party_Code}-${item.Name_Of_Party}-${item.Pan}`;
//       if (!groupedData[key]) {
//         groupedData[key] = {
//           items: [],
//           TotalTaxable_Amt: 0,
//           CGSTAmt: 0,
//           SGSTAmt: 0,
//           IGSTAmt: 0,
//           BillamountAmt: 0,
//           TDSAmt: 0,

//         };
//       }
//       groupedData[key].items.push(item);
//       groupedData[key].TotalTaxable_Amt += parseFloat(item.Taxable_Amt) || 0;
//       groupedData[key].CGSTAmt += parseFloat(item.CGST) || 0;
//       groupedData[key].SGSTAmt += parseFloat(item.SGST) || 0;
//       groupedData[key].IGSTAmt += parseFloat(item.IGST) || 0;
//       groupedData[key].BillamountAmt += parseFloat(item.Bill_Amount) || 0;
//       groupedData[key].TDSAmt += parseFloat(item.TDS_Amt) || 0;

//     });
//     return groupedData;
//   };

//   const groupedReportData = groupReportData(reportData);

//   grandTotals = useMemo(() => {
//     return Object.values(groupedReportData).reduce(
//       (totals, { TotalTaxable_Amt, CGSTAmt, SGSTAmt, IGSTAmt, BillamountAmt, TDSAmt }) => {
//         totals.TotalTaxable_Amt += TotalTaxable_Amt || 0;
//         totals.CGSTAmt += CGSTAmt || 0;
//         totals.SGSTAmt += SGSTAmt || 0;
//         totals.IGSTAmt += IGSTAmt || 0;
//         totals.BillamountAmt += BillamountAmt || 0;
//         totals.TDSAmt += TDSAmt || 0;
//         return totals;
//       },
//       { TotalTaxable_Amt: 0, CGSTAmt: 0, SGSTAmt: 0, IGSTAmt: 0, BillamountAmt: 0, TDSAmt: 0 }
//     );
//   }, [groupedReportData]);
//   return (
//     <div style={{marginTop:"-80px"}}>

//       <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold" }}>{Company_Name}</Typography>
//       <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", textDecoration: 'underline', fontWeight: "550" }}>GSTN : {Company_GSTNO}</Typography>
//       <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>Sale TDS Summary</Typography>
//       <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px" }}>{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>

//       <div className="mb-3 row align-items-center"></div>

//       <div className="mb-3 row align-items-center">
//         <div className="col-auto">
//           <button className="btn btn-secondary me-2" onClick={handlePrint}>
//             Print
//           </button>
//           <button className="btn btn-success" onClick={handleExportToExcel}>
//             Export to Excel
//           </button>
//         </div>
//       </div>

//       <div style={{
//         maxHeight: 'calc(100vh - 200px)',
//         overflow: 'auto',
//         position: 'relative',
//         border: '1px solid #e0e0e0',
//         marginBottom: '60px'
//       }} id="reportTable">
//         <Table striped bordered mt={4}>
//           <TableHead sx={{
//             position: 'sticky',
//             top: 0,
//             zIndex: 1,
//             backgroundColor: '#f5f5f5'
//           }}>
//             <TableRow>
//               <TableCell style={{ textAlign: "center", fontWeight: "bold", backgroundColor: '#f5f5f5' }}>SBill No</TableCell>
//               <TableCell style={{ textAlign: "center", fontWeight: "bold", backgroundColor: '#f5f5f5' }}>Customer Name / Party Name</TableCell>
//               <TableCell style={{ textAlign: "right", fontWeight: "bold", backgroundColor: '#f5f5f5' }}>Taxable Amount</TableCell>
//               <TableCell style={{ textAlign: "right", fontWeight: "bold", backgroundColor: '#f5f5f5' }}>CGST Amount</TableCell>
//               <TableCell style={{ textAlign: "right", fontWeight: "bold", backgroundColor: '#f5f5f5' }}>SGST Amount</TableCell>
//               <TableCell style={{ textAlign: "right", fontWeight: "bold", backgroundColor: '#f5f5f5' }}>IGST Amount</TableCell>
//               <TableCell style={{ textAlign: "right", fontWeight: "bold", backgroundColor: '#f5f5f5' }}>Bill Amount</TableCell>
//               <TableCell style={{ textAlign: "right", fontWeight: "bold", backgroundColor: '#f5f5f5' }}>TDS</TableCell>
//             </TableRow>
//           </TableHead>

//           <TableBody>
//             {Object.entries(groupedReportData).map(([key, { items, TotalTaxable_Amt, CGSTAmt, SGSTAmt, IGSTAmt, BillamountAmt, TDSAmt }]) => {
//               const parts = key.split('-');
//               const mc = parts[0];
//               const pan = parts[parts.length - 1];
//               const PartyName = parts.slice(1, -1).join('-');

//               const filteredItems = items.filter(item => false);

//               return (
//                 <React.Fragment key={key}>
//                   {filteredItems.map((item, index) => (
//                     <TableRow
//                       key={index}
//                       sx={{
//                         cursor: "pointer",
//                         "&:hover": {
//                           backgroundColor: "#fdfd96",
//                         },
//                       }}
//                     >
//                       <TableCell>{item.Pan}</TableCell>
//                       <TableCell>{item.Name_Of_Party}</TableCell>
//                       <TableCell>{item.Taxable_Amt}</TableCell>
//                       <TableCell>{item.CGST}</TableCell>
//                       <TableCell>{item.SGST}</TableCell>
//                       <TableCell>{item.IGST}</TableCell>
//                       <TableCell>{item.Bill_Amount}</TableCell>
//                       <TableCell>{item.TDS_Amt}</TableCell>
//                     </TableRow>
//                   ))}
//                   <TableRow sx={{
//                     cursor: "pointer",
//                     "&:hover": {
//                       backgroundColor: "#fdfd96",
//                     },
//                   }}>
//                     <TableCell className="text-start">{pan}</TableCell>
//                     <TableCell className="text-start">{PartyName}</TableCell>
//                     <TableCell className="text-end">
//                       {formatReadableAmount(TotalTaxable_Amt.toFixed(2))}
//                     </TableCell>
//                     <TableCell className="text-end">
//                       {formatReadableAmount(CGSTAmt.toFixed(2))}
//                     </TableCell>
//                     <TableCell className="text-end">
//                       {formatReadableAmount(SGSTAmt.toFixed(2))}
//                     </TableCell>
//                     <TableCell className="text-end">
//                       {formatReadableAmount(IGSTAmt.toFixed(2))}
//                     </TableCell>
//                     <TableCell className="text-end">
//                       {formatReadableAmount(BillamountAmt.toFixed(2))}
//                     </TableCell>
//                     <TableCell className="text-end">
//                       {formatReadableAmount(TDSAmt.toFixed(2))}
//                     </TableCell>
//                   </TableRow>
//                 </React.Fragment>
//               );
//             })}
//           </TableBody>

//           <TableFooter style={{ position: 'sticky', bottom: 0, backgroundColor: 'yellow', zIndex: 1 }}>
//             <TableRow>
//               <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>Total</TableCell>
//               <TableCell sx={{ fontWeight: 'bold', textAlign: 'right', fontSize: "14px" }}>
//                 {formatReadableAmount(grandTotals.TotalTaxable_Amt.toFixed(2))}
//               </TableCell>
//               <TableCell sx={{ fontWeight: 'bold', textAlign: 'right', fontSize: "14px" }}>
//                 {formatReadableAmount(grandTotals.CGSTAmt.toFixed(2))}
//               </TableCell>
//               <TableCell sx={{ fontWeight: 'bold', textAlign: 'right', fontSize: "14px" }}>
//                 {formatReadableAmount(grandTotals.SGSTAmt.toFixed(2))}
//               </TableCell>
//               <TableCell sx={{ fontWeight: 'bold', textAlign: 'right', fontSize: "14px" }}>
//                 {formatReadableAmount(grandTotals.IGSTAmt.toFixed(2))}
//               </TableCell>
//               <TableCell sx={{ fontWeight: 'bold', textAlign: 'right', fontSize: "14px" }}>
//                 {formatReadableAmount(grandTotals.BillamountAmt.toFixed(2))}
//               </TableCell>
//               <TableCell sx={{ fontWeight: 'bold', textAlign: 'right', fontSize: "14px" }}>
//                 {formatReadableAmount(grandTotals.TDSAmt.toFixed(2))}
//               </TableCell>
//             </TableRow>
//           </TableFooter>
//         </Table>
//       </div>

//       {loading && (
//         <div style={{
//           position: 'fixed',
//           top: '50%',
//           left: '50%',
//           transform: 'translate(-50%, -50%)',
//           zIndex: 9999
//         }}>
//           <RingLoader size={80} />
//         </div>
//       )}
//       {error && <div className="alert alert-danger">{error}</div>}
//     </div>
//   );
// };

// export default SaleTDSRegister;
















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
import CommonPrintView from '../../../Common/ReportCommon/CommonPrintView';
import { generateReportPDF } from '../../../Common/ReportCommon/CommonPDFGenerator';

const apikey = process.env.REACT_APP_API;

// Adjusted widths to total 100% and prevent overflow
const SCREEN_COLUMNS = [
    { label: 'PAN', key: 'pan', width: '12%' },
    { label: 'Customer Name', key: 'PartyName', width: '28%' },
    { label: 'Taxable Amt', key: 'TotalTaxable_Amt', width: '10%', numeric: true },
    { label: 'CGST', key: 'CGSTAmt', width: '10%', numeric: true },
    { label: 'SGST', key: 'SGSTAmt', width: '10%', numeric: true },
    { label: 'IGST', key: 'IGSTAmt', width: '10%', numeric: true },
    { label: 'Bill Amt', key: 'BillamountAmt', width: '10%', numeric: true },
    { label: 'TDS', key: 'TDSAmt', width: '10%', numeric: true },
];

const PRINT_COLUMNS = [
    { label: 'PAN', key: 'pan', printWidth: '25mm' },
    { label: 'Customer Name', key: 'PartyName', printWidth: '60mm' },
    { label: 'Taxable Amt', key: 'TotalTaxable_Amt', printWidth: '20mm', numeric: true },
    { label: 'CGST', key: 'CGSTAmt', printWidth: '17mm', numeric: true },
    { label: 'SGST', key: 'SGSTAmt', printWidth: '17mm', numeric: true },
    { label: 'IGST', key: 'IGSTAmt', printWidth: '17mm', numeric: true },
    { label: 'Bill Amt', key: 'BillamountAmt', printWidth: '20mm', numeric: true },
    { label: 'TDS', key: 'TDSAmt', printWidth: '17mm', numeric: true },
];

const SaleTDSRegister = () => {
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
    const [error, setError] = useState('');
    const [pdfPreview, setPdfPreview] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const API_URL = `${apikey}/SaleTDS_Register`;

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(API_URL, {
                    params: { from_date: fromDate, toDate, companyCode: company_Code, YearCode, acCode },
                });
                setReportData(response.data);
            } catch (error) {
                setError('Error fetching report');
            } finally {
                setLoading(false);
            }
        };
        fetchReportData();
    }, [API_URL]);

    const groupedData = useMemo(() => {
        const grouped = {};
        reportData.forEach((item) => {
            const key = `${item.Party_Code}-${item.Name_Of_Party}-${item.Pan}`;
            if (!grouped[key]) {
                grouped[key] = {
                    pan: item.Pan || '',
                    PartyName: item.Name_Of_Party || '',
                    TotalTaxable_Amt: 0,
                    CGSTAmt: 0,
                    SGSTAmt: 0,
                    IGSTAmt: 0,
                    BillamountAmt: 0,
                    TDSAmt: 0,
                };
            }
            grouped[key].TotalTaxable_Amt += parseFloat(item.Taxable_Amt) || 0;
            grouped[key].CGSTAmt += parseFloat(item.CGST) || 0;
            grouped[key].SGSTAmt += parseFloat(item.SGST) || 0;
            grouped[key].IGSTAmt += parseFloat(item.IGST) || 0;
            grouped[key].BillamountAmt += parseFloat(item.Bill_Amount) || 0;
            grouped[key].TDSAmt += parseFloat(item.TDS_Amt) || 0;
        });
        return Object.values(grouped);
    }, [reportData]);

    const sortedData = useMemo(() => {
        let sortableItems = [...groupedData];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [groupedData, sortConfig]);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const grandTotals = useMemo(() => {
        return groupedData.reduce((acc, curr) => ({
            TotalTaxable_Amt: acc.TotalTaxable_Amt + curr.TotalTaxable_Amt,
            CGSTAmt: acc.CGSTAmt + curr.CGSTAmt,
            SGSTAmt: acc.SGSTAmt + curr.SGSTAmt,
            IGSTAmt: acc.IGSTAmt + curr.IGSTAmt,
            BillamountAmt: acc.BillamountAmt + curr.BillamountAmt,
            TDSAmt: acc.TDSAmt + curr.TDSAmt,
        }), { TotalTaxable_Amt: 0, CGSTAmt: 0, SGSTAmt: 0, IGSTAmt: 0, BillamountAmt: 0, TDSAmt: 0 });
    }, [groupedData]);

    const reportSubtitle = `${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`;

    const handleExportToExcel = () => {
        const worksheetData = [
            [Company_Name.toUpperCase()],
            [`GST No: ${Company_GSTNO}`],
            [`Sale TDS Summary: ${reportSubtitle}`],
            [],
            SCREEN_COLUMNS.map(c => c.label),
            ...sortedData.map(item => [
                item.pan, item.PartyName, item.TotalTaxable_Amt, item.CGSTAmt, 
                item.SGSTAmt, item.IGSTAmt, item.BillamountAmt, item.TDSAmt
            ]),
            ['', 'GRAND TOTAL', grandTotals.TotalTaxable_Amt, grandTotals.CGSTAmt, 
             grandTotals.SGSTAmt, grandTotals.IGSTAmt, grandTotals.BillamountAmt, grandTotals.TDSAmt]
        ];
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(worksheetData);
        XLSX.utils.book_append_sheet(wb, ws, 'SaleTDSRegister');
        XLSX.writeFile(wb, `SaleTDSRegister_${fromDate}.xlsx`);
    };



    const handleGeneratePDF = () => {
    // Define the common footer style for consistency
    const footerStyle = { 
        fillColor: [255, 249, 196], 
        fontStyle: 'bold' 
    };

    generateReportPDF({
        title: 'Sale TDS Summary',
        subtitle: reportSubtitle,
        columns: PRINT_COLUMNS.map(c => c.label),
        columnWidths: [25, 60, 20, 17, 17, 17, 20, 17],
        rows: sortedData.map(item => [
            item.pan, 
            item.PartyName, 
            // Keep existing row alignment logic
            { content: formatReadableAmount(item.TotalTaxable_Amt), alignment: 'right' },
            { content: formatReadableAmount(item.CGSTAmt), alignment: 'right' },
            { content: formatReadableAmount(item.SGSTAmt), alignment: 'right' },
            { content: formatReadableAmount(item.IGSTAmt), alignment: 'right' },
            { content: formatReadableAmount(item.BillamountAmt), alignment: 'right' },
            { content: formatReadableAmount(item.TDSAmt), alignment: 'right' }
        ]),
        
        // Updated Footer with Yellow Background and Right Alignment for amounts
        footerRow: [
            { content: '', styles: footerStyle }, 
            { content: 'GRAND TOTAL', styles: footerStyle }, 
            { content: formatReadableAmount(grandTotals.TotalTaxable_Amt), styles: { ...footerStyle, halign: 'right' } }, 
            { content: formatReadableAmount(grandTotals.CGSTAmt), styles: { ...footerStyle, halign: 'right' } }, 
            { content: formatReadableAmount(grandTotals.SGSTAmt), styles: { ...footerStyle, halign: 'right' } }, 
            { content: formatReadableAmount(grandTotals.IGSTAmt), styles: { ...footerStyle, halign: 'right' } }, 
            { content: formatReadableAmount(grandTotals.BillamountAmt), styles: { ...footerStyle, halign: 'right' } }, 
            { content: formatReadableAmount(grandTotals.TDSAmt), styles: { ...footerStyle, halign: 'right' } }
        ],

        numericCols: [2, 3, 4, 5, 6, 7],
        headerImgSrc: HeaderJK,
        footerImgSrc: FooterJK,
        orientation: 'landscape',
        onComplete: (url) => setPdfPreview(url),
    });
};

    return (
        <div style={{ marginTop: '-40px', padding: '20px' }}>
            <CommonPrintView
                title="Sale TDS Summary"
                subtitle={reportSubtitle}
                companyName={Company_Name}
                companyGST={Company_GSTNO}
                columns={PRINT_COLUMNS}
                rows={sortedData}
                rowRenderer={(item) => [
                    item.pan, item.PartyName, 
                    formatReadableAmount(item.TotalTaxable_Amt),
                    formatReadableAmount(item.CGSTAmt),
                    formatReadableAmount(item.SGSTAmt),
                    formatReadableAmount(item.IGSTAmt),
                    formatReadableAmount(item.BillamountAmt),
                    formatReadableAmount(item.TDSAmt)
                ]}
                footerValues={['', 'GRAND TOTAL', formatReadableAmount(grandTotals.TotalTaxable_Amt), formatReadableAmount(grandTotals.CGSTAmt), formatReadableAmount(grandTotals.SGSTAmt), formatReadableAmount(grandTotals.IGSTAmt), formatReadableAmount(grandTotals.BillamountAmt), formatReadableAmount(grandTotals.TDSAmt)]}
                amountInWords={ConvertNumberToWord(grandTotals.BillamountAmt)}
                headerImg={HeaderJK}
                footerImg={FooterJK}
            />

            <Typography variant="h5" align="center" style={{ fontWeight: 'bold', marginTop: '-50px' }}>{Company_Name}</Typography>
            <Typography variant="subtitle1" align="center">GSTN: {Company_GSTNO}</Typography>
            <Typography variant="h6" align="center">Sale TDS Summary</Typography>
            <Typography variant="subtitle2" align="center" color="textSecondary" style={{ marginBottom: '15px' }}>{reportSubtitle}</Typography>

            <div className="my-3 no-print d-flex justify-content-end">
                <button className="btn btn-danger me-2" onClick={handleGeneratePDF}>Print PDF</button>
                <button className="btn btn-success" onClick={handleExportToExcel}>Export Excel</button>
            </div>

            {pdfPreview && <PdfPreview pdfData={pdfPreview} label="SaleTDSRegister" />}

            <TableContainer component={Paper} style={{ maxHeight: '700px', overflowX: 'hidden' }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {SCREEN_COLUMNS.map(col => (
                                <TableCell 
                                    key={col.label} 
                                    align={col.numeric ? 'right' : 'left'} 
                                    style={{ 
                                        backgroundColor: '#5557df', 
                                        color: '#fff', 
                                        fontWeight: 'bold',
                                        width: col.width,
                                        padding: '8px'
                                    }}
                                >
                                    <TableSortLabel
                                        active={sortConfig.key === col.key}
                                        direction={sortConfig.key === col.key ? sortConfig.direction : 'asc'}
                                        onClick={() => requestSort(col.key)}
                                        sx={{
                                            '&.MuiTableSortLabel-root': { color: '#fff' },
                                            '&.MuiTableSortLabel-root:hover': { color: '#cce0ff' },
                                            '&.Mui-active': { color: '#fff' },
                                            '& .MuiTableSortLabel-icon': { color: '#fff !important' },
                                        }}
                                    >
                                        {col.label}
                                    </TableSortLabel>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedData.map((row, index) => (
                            <TableRow key={index} hover style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f5f8ff' }}>
                                <TableCell style={{ whiteSpace: 'nowrap' }}>{row.pan}</TableCell>
                                <TableCell style={{ wordBreak: 'break-word' }}>{row.PartyName}</TableCell>
                                <TableCell align="right">{formatReadableAmount(row.TotalTaxable_Amt)}</TableCell>
                                <TableCell align="right">{formatReadableAmount(row.CGSTAmt)}</TableCell>
                                <TableCell align="right">{formatReadableAmount(row.SGSTAmt)}</TableCell>
                                <TableCell align="right">{formatReadableAmount(row.IGSTAmt)}</TableCell>
                                <TableCell align="right">{formatReadableAmount(row.BillamountAmt)}</TableCell>
                                <TableCell align="right">{formatReadableAmount(row.TDSAmt)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter style={{ position: 'sticky', bottom: 0, zIndex: 2 }}>
                        <TableRow style={{ backgroundColor: '#ffffcc' }}>
                            <TableCell colSpan={2} style={{ fontWeight: 'bold' }}>GRAND TOTAL</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.TotalTaxable_Amt)}</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.CGSTAmt)}</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.SGSTAmt)}</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.IGSTAmt)}</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.BillamountAmt)}</TableCell>
                            <TableCell align="right" style={{ fontWeight: 'bold' }}>{formatReadableAmount(grandTotals.TDSAmt)}</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </TableContainer>

            {loading && (
                <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999 }}>
                    <ScaleLoader color="#36d7b7" height={35} width={4} radius={2} margin={2} />
                </div>
            )}
        </div>
    );
};

export default SaleTDSRegister;
