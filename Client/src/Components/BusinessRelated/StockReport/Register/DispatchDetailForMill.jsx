// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import * as XLSX from 'xlsx';
// import { jsPDF } from 'jspdf';
// import 'jspdf-autotable';
// import { useNavigate, useLocation } from 'react-router-dom';
// import PdfPreview from "../../../../Common/PDFPreview";
// import { RingLoader } from 'react-spinners';
// import { Typography } from '@mui/material';
// import './Register.css';
// import { FormaDateBalanceSheet } from "../../../../Common/FormatFunctions/FormatDate"
// import { formatReadableAmount } from "../../../../Common/FormatFunctions/FormatAmount";
// import PrintButton from '../../../../Common/Buttons/PrintPDF';
// import Swal from 'sweetalert2';

// const apikey = process.env.REACT_APP_API;

// const DispatchDetailsForMilllRegister = () => {
//     const navigate = useNavigate();
//     const location = useLocation();
//     const searchParams = new URLSearchParams(location.search);
//     //const { acCode, fromDate, toDate, lotNo, srNo } = location.state;
//     const fromDate = searchParams.get('fromDate');
//     const acCode = searchParams.get('acCode');
//     const toDate = searchParams.get('toDate');
//     const lotNo = searchParams.get('lotNo');
//     const srNo = searchParams.get('srNo');

//     const companyCode = sessionStorage.getItem("Company_Code");
//     const yearCode = sessionStorage.getItem("Year_Code");
//     const Company_Name = sessionStorage.getItem("Company_Name");
//     const Company_GSTNO = sessionStorage.getItem('Company_GSTNO')

//     const [reportData, setReportData] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');
//     const [pdfPreview, setPdfPreview] = useState([]);
//     const [doResults, setDoResults] = useState([]);
//     const [tenderResults, setTenderResults] = useState([]);
//     const API_URL = `${apikey}/dispatch-detailsForMill`;

//     useEffect(() => {
//         const fetchReportData = async () => {
//             setLoading(true);
//             setError('');

//             try {
//                 const response = await axios.get(API_URL, {
//                     params: {
//                         Mill_Code: acCode || '',
//                         fromDate: fromDate || '',
//                         toDate: toDate || '',
//                         lotNo: lotNo || '',
//                         srNo: srNo || '',
//                         Company_Code: companyCode,
//                         Year_Code: yearCode,
//                     },
//                 });

//                 setDoResults(response.data.do_results || []);
//                 setTenderResults(response.data.tender_results || []);
//                 if ((response.data.tender_results || []).length === 0) {
//                     Swal.fire({
//                         icon: 'info',
//                         title: 'No Tender Found',
//                         text: 'The mill you selected has no tender on the selected date range.',
//                         confirmButtonText: 'OK'
//                     });
//                 }
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
//     }, [acCode, fromDate, toDate, lotNo, srNo, companyCode, yearCode]);


//     const handleExportToExcel = () => {
//         const wb = XLSX.utils.book_new();
//         const wsData = [];

//         wsData.push([Company_Name]);
//         wsData.push([]);

//         wsData.push([
//             'No.', 'Date', 'Mill', 'Grade', 'Mill Rate', 'Qty', 'Despatch', 'Balance', 'Lifting Date', 'D.O'
//         ]);

//         Object.entries(groupedReportData).forEach(([_, { items }]) => {
//             const firstItem = items[0];
//             const balance = parseFloat(firstItem.Quantal || 0) - parseFloat(firstItem.Dispatched || 0);
//             wsData.push([
//                 firstItem.Tender_No,
//                 firstItem.Tender_Date,
//                 firstItem.Mill,
//                 firstItem.Grade,
//                 parseFloat(firstItem.Mill_Rate || 0),
//                 parseFloat(firstItem.Quantal || 0),
//                 parseFloat(firstItem.Dispatched || 0),
//                 balance.toFixed(2),
//                 firstItem.Lifting_Date,
//                 firstItem.Tender_DO
//             ]);

//             items.forEach(item => {
//                 wsData.push([
//                     item.ID,
//                     '',
//                     item.Buyer,
//                     '', '',
//                     parseFloat(item.Qty || 0),
//                     '', '', '', ''
//                 ]);

//                 const relatedDOs = doResults.filter(
//                     (doItem) => doItem.purc_no === item.Tender_No && doItem.purc_order === item.ID
//                 );

//                 relatedDOs.forEach(doItem => {
//                     wsData.push([
//                         doItem.detail_id,
//                         doItem.DI_Date,
//                         doItem.Getpass,
//                         '', '', '', doItem.truck_no,
//                         doItem.DI_Qty,
//                         doItem.ShippedTo,
//                         ''
//                     ]);
//                 });
//             });

//             wsData.push([]);
//         });

//         // Export to Excel
//         const ws = XLSX.utils.aoa_to_sheet(wsData);
//         XLSX.utils.book_append_sheet(wb, ws, 'DispatchDetails');
//         XLSX.writeFile(wb, 'DispatchDetailsRegister.xlsx');
//     };


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

//     const groupReportData = (data) => {
//         const grouped = {};
//         data.forEach(item => {
//             const key = `${item.Tender_No}`;
//             if (!grouped[key]) {
//                 grouped[key] = { items: [] };
//             }
//             grouped[key].items.push(item);
//         });
//         return grouped;
//     };

//     const groupedReportData = groupReportData(tenderResults);

//     return (
//         <div style={{ marginTop: '-80px' }}>
//             {/* <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold" }}>{Company_Name}</Typography>
//             <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", textDecoration: 'underline', fontWeight: "550" }}>GSTN : {Company_GSTNO}</Typography> */}

//             <div className="d-flex justify-content-between align-items-center">
//                 <div style={{ flex: 1, textAlign: 'center',marginLeft:"280px"  }}>
//                     <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>Dispatch Detail For Mill</Typography>
//                     <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px" }}>{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>
//                 </div>

//                 <div className="d-flex justify-content-end gap-2">
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
//                     <table className="table table-bordered mt-4" id="reportTable" style={{ marginBottom: "60px", width: "100%" }}>
//                         <thead className="table-light" style={{ position: "sticky", top: 0, backgroundColor: "#fff", zIndex: 1, whiteSpace: "nowrap" }}>
//                             <tr>
//                                 <th style={{ width: "5%" }}>No.</th>
//                                 <th style={{ width: "10%" }}>Date</th>
//                                 <th style={{ width: "15%" }}>Mill Name</th>
//                                 <th style={{ width: "10%" }}>Grade</th>
//                                 <th style={{ width: "10%", textAlign: 'right' }}>Mill Rate</th>
//                                 <th style={{ width: "10%", textAlign: 'right' }}>Quintal</th>
//                                 <th style={{ width: "10%", textAlign: 'right' }}>Disptched</th>
//                                 <th style={{ width: "10%" }}>Balance</th>
//                                 <th style={{ width: "10%" }}>Lifting Date</th>
//                                 <th style={{ width: "10%" }}>D.O</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {Object.entries(groupedReportData).map(([key, { items }]) => {
//                                 const firstItem = items[0];
//                                 const totalQty = items.reduce((sum, item) => sum + (parseFloat(item.Qty) || 0), 0);
//                                 const balance = parseFloat(firstItem.Quantal) - parseFloat(firstItem.Dispatched);

//                                 return (
//                                     <React.Fragment key={key}>
//                                         <tr
//                                             style={{
//                                                 backgroundColor: balance === 0 ? "#c8e6c9" : "#d3d3d3",
//                                                 color: "blue",
//                                                 fontWeight: "bold"
//                                             }}
//                                         >
//                                             <td>{firstItem.Tender_No}</td>
//                                             <td>{firstItem.Tender_Date}</td>
//                                             <td align="left">{firstItem.Mill}</td>
//                                             <td align="left" style={{ whiteSpace: "nowrap" }}>{firstItem.Grade}</td>
//                                             <td align="right">{formatReadableAmount(firstItem.Mill_Rate)}</td>
//                                             <td align="right">{formatReadableAmount(firstItem.Quantal)}</td>
//                                             <td align="right">{formatReadableAmount(firstItem.Dispatched)}</td>
//                                             <td align="right">{formatReadableAmount(balance.toFixed(2))}</td>
//                                             <td>{firstItem.Lifting_Date}</td>
//                                             <td align="left" style={{ whiteSpace: "nowrap" }}>{firstItem.Tender_DO}</td>
//                                         </tr>

//                                         {items.map((item, index) => {
//                                             const relatedDOs = doResults.filter(
//                                                 (doItem) => doItem.purc_no === item.Tender_No && doItem.purc_order === item.ID
//                                             );

//                                             return (
//                                                 <React.Fragment key={index}>
//                                                     <tr style={{ backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#ffffff" }}>
//                                                         <td>{item.ID}</td>
//                                                         <td colSpan={4} align="left">{item.Buyer}</td>
//                                                         <td align="right">{item.Qty}</td>
//                                                         <td colSpan={3}></td>
//                                                     </tr>

//                                                     {relatedDOs.map((doItem, doIndex) => (
//                                                         <tr key={`do-${doIndex}`} style={{ backgroundColor: "#e3f2fd" }}>
//                                                             <td>{doItem.detail_id}</td>
//                                                             <td>{doItem.DI_Date}</td>
//                                                             <td colSpan={2}>{doItem.Getpass}</td>
//                                                             <td colSpan={2}>{doItem.ShippedTo}</td>
//                                                             <td>{doItem.truck_no}</td>
//                                                             <td>{doItem.DI_Qty}</td>
//                                                             <td colSpan={2} align='right'></td>
//                                                             <td></td>
//                                                         </tr>
//                                                     ))}


//                                                 </React.Fragment>
//                                             );
//                                         })}
//                                         <tr>
//                                             <td colSpan={10}>
//                                                 <hr style={{ borderTop: '2px solid #000', margin: '4px 0' }} />
//                                             </td>
//                                         </tr>
//                                     </React.Fragment>
//                                 );
//                             })}
//                         </tbody>
//                     </table>
//                 </div>
//             )}

//             {pdfPreview && pdfPreview.length > 0 && (
//                 <div className="centered-container">
//                     <PdfPreview pdfData={pdfPreview} apiData={reportData} label={"NewDispatchRegister"} />
//                 </div>
//             )}
//         </div>
//     );
// };

// export default DispatchDetailsForMilllRegister;


import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useNavigate, useLocation } from 'react-router-dom';
import PdfPreview from "../../../../Common/PDFPreview";
import { RingLoader } from 'react-spinners';
import { Typography } from '@mui/material';
import './Register.css';
import { FormaDateBalanceSheet } from "../../../../Common/FormatFunctions/FormatDate"
import { formatReadableAmount } from "../../../../Common/FormatFunctions/FormatAmount";
import PrintButton from '../../../../Common/Buttons/PrintPDF';
import Swal from 'sweetalert2';

const apikey = process.env.REACT_APP_API;

const DispatchDetailsForMilllRegister = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    //const { acCode, fromDate, toDate, lotNo, srNo } = location.state;
    const fromDate = searchParams.get('fromDate');
    const acCode = searchParams.get('acCode');
    const toDate = searchParams.get('toDate');
    const lotNo = searchParams.get('lotNo');
    const srNo = searchParams.get('srNo');

    const companyCode = sessionStorage.getItem("Company_Code");
    const yearCode = sessionStorage.getItem("Year_Code");
    const Company_Name = sessionStorage.getItem("Company_Name");
    const Company_GSTNO = sessionStorage.getItem('Company_GSTNO')

    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pdfPreview, setPdfPreview] = useState([]);
    const [doResults, setDoResults] = useState([]);
    const [tenderResults, setTenderResults] = useState([]);
    const API_URL = `${apikey}/dispatch-detailsForMill`;

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            setError('');

            try {
                const response = await axios.get(API_URL, {
                    params: {
                        Mill_Code: acCode || '',
                        fromDate: fromDate || '',
                        toDate: toDate || '',
                        lotNo: lotNo || '',
                        srNo: srNo || '',
                        Company_Code: companyCode,
                        Year_Code: yearCode,
                    },
                });

                setDoResults(response.data.do_results || []);
                setTenderResults(response.data.tender_results || []);
                if ((response.data.tender_results || []).length === 0) {
                    Swal.fire({
                        icon: 'info',
                        title: 'No Tender Found',
                        text: 'The mill you selected has no tender on the selected date range.',
                        confirmButtonText: 'OK'
                    });
                }
            } catch (error) {
                console.error('Error fetching report:', error);
                setError('Error fetching report');
            } finally {
                setLoading(false);
            }
        };

        if (fromDate && toDate) {
            fetchReportData();
        }
    }, [acCode, fromDate, toDate, lotNo, srNo, companyCode, yearCode]);


    const handleExportToExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [];

        wsData.push([Company_Name]);
        wsData.push([]);

        wsData.push([
            'No.', 'Date', 'Mill', 'Grade', 'Mill Rate', 'Qty', 'Despatch', 'Balance', 'Lifting Date', 'D.O'
        ]);

        Object.entries(groupedReportData).forEach(([_, { items }]) => {
            const firstItem = items[0];
            const balance = parseFloat(firstItem.Quantal || 0) - parseFloat(firstItem.Dispatched || 0);
            wsData.push([
                firstItem.Tender_No,
                firstItem.Tender_Date,
                firstItem.Mill,
                firstItem.Grade,
                parseFloat(firstItem.Mill_Rate || 0),
                parseFloat(firstItem.Quantal || 0),
                parseFloat(firstItem.Dispatched || 0),
                balance.toFixed(2),
                firstItem.Lifting_Date,
                firstItem.Tender_DO
            ]);

            items.forEach(item => {
                wsData.push([
                    item.ID,
                    '',
                    item.Buyer,
                    '', '',
                    parseFloat(item.Qty || 0),
                    '', '', '', ''
                ]);

                const relatedDOs = doResults.filter(
                    (doItem) => doItem.purc_no === item.Tender_No && doItem.purc_order === item.ID
                );

                relatedDOs.forEach(doItem => {
                    wsData.push([
                        doItem.detail_id,
                        doItem.DI_Date,
                        doItem.Getpass,
                        doItem.Grade, '', '', doItem.truck_no,
                        doItem.DI_Qty,
                        doItem.ShippedTo,
                        ''
                    ]);
                });
            });

            wsData.push([]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'DispatchDetails');
        XLSX.writeFile(wb, 'DispatchDetailsRegister.xlsx');
    };


    const handlePrint = () => {
        let printContent = document.getElementById('reportTable').outerHTML;

        printContent = printContent.replaceAll(
            /<tr style="[^"]*?color:\s*blue[^"]*?">([\s\S]*?)<\/tr>/g,
            (match) => {
                return match.replaceAll(
                    /<td(.*?)>/g,
                    `<td$1 style="background-color:#fff2cc;color:blue;font-weight:bold;">`
                );
            }
        );

        printContent = printContent.replaceAll(
            /<tr><td style="background-color:#ffffff"/g,
            `<tr><td style="background-color:#ffffff;font-weight:500;"`
        );

        // Force background for Dispatch rows
        printContent = printContent.replaceAll(
            /<tr><td style="background-color:#d9f0ff/g,
            `<tr><td style="background-color:#d9f0ff;font-style:italic;font-size:13px`
        );

        const win = window.open('', '', 'height=700,width=900');

        win.document.write(`
    <html>
      <head>
        <title>Print Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
          }
          .company-name {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #333;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="company-name">${Company_Name}</div>
        ${printContent}
      </body>
    </html>
  `);
        win.document.close();
        win.print();
    };



    const generatePdf = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const textWidth = doc.getTextWidth(Company_Name);
        const xPosition = (pageWidth - textWidth) / 2;

        doc.setFontSize(14);
        doc.text(Company_Name, xPosition, 14);

        let startY = 20;

        Object.entries(groupedReportData).forEach(([_, { items }]) => {
            const first = items[0];
            const balance = parseFloat(first.Quantal || 0) - parseFloat(first.Dispatched || 0);

            // 🟡 Tender row
            doc.setFillColor(255, 242, 204); 
            doc.setTextColor(0, 0, 255);
            doc.setFont('helvetica', 'bold');
            doc.autoTable({
                startY,
                theme: 'plain',
                head: [['No.', 'Date', 'Mill', 'Grade', 'Mill Rate', 'Qty', 'Dispatch', 'Balance', 'Lifting', 'D.O']],
                body: [[
                    first.Tender_No,
                    first.Tender_Date,
                    first.Mill,
                    first.Grade,
                    formatReadableAmount(first.Mill_Rate),
                    formatReadableAmount(first.Quantal),
                    formatReadableAmount(first.Dispatched),
                    formatReadableAmount(balance.toFixed(2)),
                    first.Lifting_Date,
                    first.Tender_DO
                ]],
                styles: { fillColor: [255, 242, 204] },
                headStyles: { fillColor: [240, 240, 240] },
                margin: { left: 10 },
            });

            startY = doc.previousAutoTable.finalY;

            items.forEach(item => {
          
                doc.setTextColor(0, 0, 0);
                doc.setFont('helvetica', 'normal');
                doc.autoTable({
                    startY,
                    theme: 'plain',
                    body: [[item.ID, '', item.Buyer, '', '', item.Qty, '', '', '', '']],
                    styles: { fillColor: [255, 255, 255] },
                    margin: { left: 10 }
                });

                startY = doc.previousAutoTable.finalY;

                const relatedDOs = doResults.filter(d =>
                    d.purc_no === item.Tender_No && d.purc_order === item.ID
                );

                relatedDOs.forEach(d => {
                    doc.setFont('helvetica', 'italic');
                    doc.autoTable({
                        startY,
                        theme: 'plain',
                        body: [[
                            d.detail_id,
                            d.DI_Date,
                            d.Getpass,
                            d.Grade,
                            '',
                            '',
                            d.truck_no,
                            d.DI_Qty,
                            d.ShippedTo,
                            ''
                        ]],
                        styles: { fillColor: [217, 240, 255], fontStyle: 'italic' },
                        margin: { left: 10 }
                    });

                    startY = doc.previousAutoTable.finalY;
                });

                doc.setDrawColor(0);
                doc.line(10, startY + 1, 200, startY + 1);
                startY += 4;
            });
        });

        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        setPdfPreview(url);
    };

    const groupReportData = (data) => {
        const grouped = {};
        data.forEach(item => {
            const key = `${item.Tender_No}`;
            if (!grouped[key]) {
                grouped[key] = { items: [] };
            }
            grouped[key].items.push(item);
        });
        return grouped;
    };

    const groupedReportData = groupReportData(tenderResults);


    return (
        <div style={{ marginTop: '-80px' }}>
            <div className="d-flex justify-content-between align-items-center">
                <div style={{ flex: 1, textAlign: 'center', marginLeft: "280px" }}>
                    <Typography variant="h6" style={{ fontSize: "20px", fontWeight: "bold" }}>
                        Dispatch Details Report
                    </Typography>
                    <Typography variant="h6" style={{ fontSize: "16px" }}>
                        {FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}
                    </Typography>
                </div>

                <div className="d-flex justify-content-end gap-2">
                    <PrintButton disabledFeild={""} fetchData={handlePrint} />
                    <button className="btn btn-success me-2" onClick={handleExportToExcel}>Export to Excel</button>
                    <button className="btn btn-secondary" onClick={generatePdf}>PDF</button>
                </div>
            </div>

            {loading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                    <RingLoader />
                </div>
            ) : error ? (
                <div className="alert alert-danger">{error}</div>
            ) : (
                <div style={{ maxHeight: "800px", overflowY: "auto" }}>
                    <table className="table table-bordered mt-4" id="reportTable" style={{ marginBottom: "60px", width: "100%" }}>
                        <thead className="table-light" style={{ position: "sticky", top: 0, backgroundColor: "#fff", zIndex: 1, whiteSpace: "nowrap" }}>
                            <tr>
                                <th style={{ width: "5%" }}>No.</th>
                                <th style={{ width: "10%" }}>Date</th>
                                <th style={{ width: "15%" }}>Mill</th>
                                <th style={{ width: "10%" }}>Grade</th>
                                <th style={{ width: "10%", textAlign: 'right' }}>Mill Rate</th>
                                <th style={{ width: "10%", textAlign: 'right' }}>Quintal</th>
                                <th style={{ width: "10%", textAlign: 'right' }}>Dispatched</th>
                                <th style={{ width: "10%" }}>Balance</th>
                                <th style={{ width: "10%" }}>Lifting Date</th>
                                <th style={{ width: "10%" }}>D.O</th>
                            </tr>
                            <tr>
                                <td colSpan={10} style={{ borderBottom: "double 2px black" }}></td>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(groupedReportData).map(([key, { items }]) => {
                                const firstItem = items[0];
                                const balance = parseFloat(firstItem.Quantal || 0) - parseFloat(firstItem.Dispatched || 0);

                                return (
                                    <React.Fragment key={key}>
                                        <tr style={{ fontWeight: "bold", color: "blue", borderBottom: "2px double black" }}>
                                            <td style={{ backgroundColor: "#fff2cc" }}>{firstItem.Tender_No}</td>
                                            <td style={{ backgroundColor: "#fff2cc" }}>{firstItem.Tender_Date}</td>
                                            <td style={{ backgroundColor: "#fff2cc" }}>{firstItem.Mill}</td>
                                            <td style={{ backgroundColor: "#fff2cc" }}>{firstItem.Grade}</td>
                                            <td style={{ backgroundColor: "#fff2cc", textAlign: "right" }}>{formatReadableAmount(firstItem.Mill_Rate)}</td>
                                            <td style={{ backgroundColor: "#fff2cc", textAlign: "right" }}>{formatReadableAmount(firstItem.Quantal)}</td>
                                            <td style={{ backgroundColor: "#fff2cc", textAlign: "right" }}>{formatReadableAmount(firstItem.Dispatched)}</td>
                                            <td style={{ backgroundColor: "#fff2cc", textAlign: "right" }}>{formatReadableAmount(balance.toFixed(2))}</td>
                                            <td style={{ backgroundColor: "#fff2cc" }}>{firstItem.Lifting_Date}</td>
                                            <td style={{ backgroundColor: "#fff2cc" }}>{firstItem.Tender_DO}</td>
                                        </tr>

                                        {items.map((item, index) => {
                                            const relatedDOs = doResults.filter(
                                                (doItem) => doItem.purc_no === item.Tender_No && doItem.purc_order === item.ID
                                            );

                                            return (
                                                <React.Fragment key={index}>
                                                    <tr>
                                                        <td style={{ backgroundColor: "#ffffff" }}>{item.ID}</td>
                                                        <td style={{ backgroundColor: "#ffffff" }}></td>
                                                        <td style={{ backgroundColor: "#ffffff", textAlign: "left" }} colSpan={2}>{item.Buyer}</td>
                                                        <td style={{ backgroundColor: "#ffffff" }}></td>
                                                        <td style={{ backgroundColor: "#ffffff", textAlign: "right" }}>{item.Qty}</td>
                                                        <td style={{ backgroundColor: "#ffffff" }} colSpan={4}></td>
                                                    </tr>

                                                    {relatedDOs.map((doItem, doIndex) => (
                                                        <tr key={`do-${doIndex}`}>
                                                            <td style={{ backgroundColor: "#d9f0ff", fontStyle: "italic", fontSize: "13px" }}>{doItem.detail_id}</td>
                                                            <td style={{ backgroundColor: "#d9f0ff", fontStyle: "italic", fontSize: "13px" }}>{doItem.DI_Date}</td>
                                                            <td style={{ backgroundColor: "#d9f0ff", fontStyle: "italic", fontSize: "13px", textAlign: "left" }} colSpan={1}>{doItem.Getpass}</td>
                                                            <td style={{ backgroundColor: "#d9f0ff", fontStyle: "italic", fontSize: "13px" }}>{doItem.Grade}</td>
                                                            <td style={{ backgroundColor: "#d9f0ff", fontStyle: "italic", fontSize: "13px" }} colSpan={2}>{doItem.ShippedTo}</td>
                                                            <td style={{ backgroundColor: "#d9f0ff", fontStyle: "italic", fontSize: "13px" }}>{doItem.truck_no}</td>
                                                            <td style={{ backgroundColor: "#d9f0ff", fontStyle: "italic", fontSize: "13px" }}>{doItem.DI_Qty}</td>
                                                            <td style={{ backgroundColor: "#d9f0ff", fontStyle: "italic", fontSize: "13px" }} colSpan={2}></td>
                                                        </tr>
                                                    ))}

                                                    <tr><td colSpan={10} style={{ borderBottom: "dashed 2px black" }}></td></tr>
                                                </React.Fragment>
                                            );
                                        })}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {pdfPreview && pdfPreview.length > 0 && (
                <div className="centered-container">
                    <PdfPreview pdfData={pdfPreview} apiData={reportData} label={"NewDispatchRegister"} />
                </div>
            )}
        </div>
    );
};

export default DispatchDetailsForMilllRegister;

