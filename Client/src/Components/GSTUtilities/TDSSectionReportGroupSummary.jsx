// import React, { useState } from 'react';
// import axios from 'axios';
// import * as XLSX from 'xlsx';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import { formatReadableAmount } from "../../Common/FormatFunctions/FormatAmount"
// import { CircularProgress } from '@mui/material';
// import Swal from 'sweetalert2';

// const API_URL = process.env.REACT_APP_API;

// const TDSSectionwiseReport = ({ fromDate, toDate, companyCode, yearCode,accode, Section_Id,sectionName }) => {
//     const [data, setData] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');
//     const [isDataFetched, setIsDataFetched] = useState(false);

//     const fetchOtherPurchaseSummary = async () => {
//         try {
//             setLoading(true);
//             setError('');
//             const response = await axios.get(`${API_URL}/OtherPurchase-summary-TDSSectionwise`, {
//                 params: {
//                     from_date: fromDate,
//                     to_date: toDate,
//                     Company_Code: companyCode,
//                     Year_Code: yearCode,
//                     accode: accode,
//                     Section_Id:Section_Id
//                 },
//             });
//              if (response.data.length === 0) {
//                             Swal.fire({
//                                 icon: 'error',
//                                 title: 'Data Not Found.!',
//                                 text: 'No Other Purchase data found for the selected date range.',
//                             });
//                             return;
//                         }
//             setData(response.data);
//             setIsDataFetched(true);
//             openInNewTab(response.data);
//         } catch (err) {
//             setError('Failed to fetch data');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const openInNewTab = (data) => {
//         const newWindow = window.open('', '_blank');
//         if (!newWindow) return;

//         const columns = [
//             'SR_No',
//             'Invoice_No',
//             'Section_Code',
//             'Nature_of_Payment',
//             'PartyGSTNo',
//             'PartyCode',
//             'PartyName',
//             'PartyStateCode',
//             'Invoice_Date',
//             'TaxableAmount',
//             'CGST',
//             'SGST',
//             'IGST',
//             'Bill_Amount',
//             'BillNo',
//             'TDSAmount',
//             'Narration',

//         ];

//         const totals = calculateTotals(data);

//         newWindow.document.write(`
//             <html>
//                 <head>
//                     <title>Other Purchase Summary</title>
//                     <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
//                    <style>
//                     body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
//                     h2 { text-align: center; margin-top: 0; }
//                     .table-container {
//                         max-height: 500px;
//                         overflow-y: auto;
//                         margin: 20px auto;
//                         width: 90%;
//                     }
//                     table {
//                         width: 100%;
//                         border-collapse: collapse;
//                     }
//                     th, td {
//                         border: 1px solid #ddd;
//                         padding: 6px 8px;
//                         text-align: left;
//                         white-space: nowrap;
//                     }
//                     th {
//                         background-color:rgb(206, 200, 243);
//                         position: sticky;
//                         top: 0;
//                         z-index: 2;
//                         font-weight: bold;
//                         font-size: 20px;
//                         height: 50px;
//                         text-align: center;
//                     }
//                     .export-btn {
//                         padding: 10px 20px;
//                         font-size: 16px;
//                         background-color: green;
//                         color: white;
//                         border: none;
//                         cursor: pointer;
//                         margin-bottom: 20px;
//                         margin-top: 20px;
//                     }
//                     .total-row {
//                         background-color: yellow;
//                         font-weight: bold;
//                     }
//                 </style>
//                 </head>
//                 <body>
//                 <h2>Other Purchase Summary Report - ${ sectionName }</h2>
//                     <div class="container">
//                         <button class="export-btn" onclick="window.exportToXlsx()">Export to XLSX</button>
//                     </div>
//                     <table>
//                         <thead>
//                             <tr>
//                                 ${columns.map((column) => `<th style="text-align: center;">${column}</th>`).join('')}
//                             </tr>
//                         </thead>
//                         <tbody>
//                             ${data.map(row => {
//             return `
//                                     <tr>
//                                          ${columns.map(column => {
//                 if (['TaxableAmount', 'CGST', 'SGST', 'IGST', 'TDSAmount', 'Bill_Amount'].includes(column)) {
//                     return `<td style="text-align: right;">${formatReadableAmount(row[column] || 0)}</td>`;
//                 } else {
//                     return `<td>${row[column] || ''}</td>`;
//                 }
//                             }).join('')}
//                                                     </tr>
//                                                 `;
//                         }).join('')}
//                         </tbody>
//                         <tfoot>
//                             <tr>
//                                 <td colspan="6" style="font-weight: bold; background-color: yellow;"></td>
//                                 <td style="font-weight: bold; background-color: yellow; text-align: right;"></td>
//                                 <td style="font-weight: bold; background-color: yellow; text-align: right;">${formatReadableAmount(totals.TaxableAmount.toFixed(2))}</td>
//                                 <td style="font-weight: bold; background-color: yellow; text-align: right;">${formatReadableAmount(totals.CGST.toFixed(2))}</td>
//                                 <td style="font-weight: bold; background-color: yellow; text-align: right;">${formatReadableAmount(totals.SGST.toFixed(2))}</td>
//                                 <td style="font-weight: bold; background-color: yellow; text-align: right;">${formatReadableAmount(totals.IGST.toFixed(2))}</td>
//                                 <td style="font-weight: bold; background-color: yellow; text-align: right;">${formatReadableAmount(totals.Bill_Amount.toFixed(2))}</td>
//                                 <td style="font-weight: bold; background-color: yellow; text-align: right;"></td>
//                             </tr>
//                         </tfoot>
//                     </table>
//                     <script>

//                       window.exportToXlsx = function() {
//                     const data = ${JSON.stringify(data)};
//                      const columnOrder = ['SR_No','Invoice_No','Section_Code','Nature_of_Payment','PartyGSTNo','PartyCode','PartyName','PartyStateCode','Invoice_Date','TaxableAmount','CGST','SGST','IGST','Bill_Amount','BillNo','TDSAmount','Narration'];

//                     const formattedData = data.map(row => {
//                         return {
//                             ...row,
//                             TaxableAmount: parseFloat(row.TaxableAmount || 0),
//                             CGST: parseFloat(row.CGST || 0),
//                             SGST: parseFloat(row.SGST || 0),
//                             IGST: parseFloat(row.IGST || 0),
//                             Bill_Amount: parseFloat(row.Bill_Amount || 0),
//                             TDSAmount: parseFloat(row.TDSAmount || 0),
//                             Quintal: parseFloat(row.Quintal || 0),
//                             Rate: parseFloat(row.Rate || 0)
//                         };
//                     });

//                     const totals = formattedData.reduce((acc, row) => {
//                         acc.Quintal += row.Quintal || 0;
//                         acc.TaxableAmount += row.TaxableAmount || 0;
//                         acc.CGST += row.CGST || 0;
//                         acc.SGST += row.SGST || 0;
//                         acc.IGST += row.IGST || 0;
//                         acc.Bill_Amount += row.Bill_Amount || 0;
//                         acc.TDSAmount += row.TDSAmount || 0;
//                         return acc;
//                     }, {
//                         Quintal: 0,
//                         TaxableAmount: 0,
//                         CGST: 0,
//                         SGST: 0,
//                         IGST: 0,
//                         Bill_Amount: 0,
//                         TDSAmount: 0
//                     });

//                     formattedData.push({
//                         SR_No: 'Totals',
//                         Quintal: totals.Quintal.toFixed(2),
//                         TaxableAmount: totals.TaxableAmount.toFixed(2),
//                         CGST: totals.CGST.toFixed(2),
//                         SGST: totals.SGST.toFixed(2),
//                         IGST: totals.IGST.toFixed(2),
//                         Bill_Amount: totals.Bill_Amount.toFixed(2),
//                         TDSAmount: totals.TDSAmount.toFixed(2)
//                     });

//                     const ws = XLSX.utils.json_to_sheet(formattedData, { header: columnOrder, skipHeader: false });
//                     const wb = XLSX.utils.book_new();
//                     XLSX.utils.book_append_sheet(wb, ws, 'OtherPurchaseSummary');

//                     XLSX.writeFile(wb, 'OtherPurchaseSummary.xlsx');
//                 };

//                     </script>
//                 </body>
//             </html>
//         `);
//         newWindow.document.close();
//     };

//     const calculateTotals = (data) => {
//         let totals = {
//             TaxableAmount: 0,
//             CGST: 0,
//             SGST: 0,
//             IGST: 0,
//             Bill_Amount: 0,
//         };

//         data.forEach(row => {
//             totals.TaxableAmount += parseFloat(row.TaxableAmount || 0);
//             totals.CGST += parseFloat(row.CGST || 0);
//             totals.SGST += parseFloat(row.SGST || 0);
//             totals.IGST += parseFloat(row.IGST || 0);
//             totals.Bill_Amount += parseFloat(row.Bill_Amount || 0);
//         });

//         return totals;
//     };

//     return (
//         <div className="d-flex flex-column align-items-center" style={{ marginTop: '5px' }}>
//             <button
//                 variant="contained"
//                 color="primary"
//                 onClick={fetchOtherPurchaseSummary}
//                 disabled={loading}
//                 style={{
//                     width: '20%',  
//                     height: '60px',  
//                 }}
//             >
//                 {loading ? <CircularProgress size={24} /> : 'TDS Sectionwise Report'}
//             </button>

//             {error && <div className="alert alert-danger">{error}</div>}
//         </div>
//     );
// };

// export default TDSSectionwiseReport;




















import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { CircularProgress, Alert, Typography } from '@mui/material';
import { formatReadableAmount } from "../../Common/FormatFunctions/FormatAmount";
import { FormaDateBalanceSheet } from '../../Common/FormatFunctions/FormatDate';
import { generateReportPDF } from '../../Common/ReportCommon/CommonPDFGenerator';
import PdfPreview from '../../Common/PDFPreview';
import Swal from 'sweetalert2';
import { ScaleLoader } from 'react-spinners';
import HeaderJK from '../../Assets/HeaderJK.png';
import FooterJK from '../../Assets/FooterJK.png';
import './TDSSectionCode.css';

const API_URL = process.env.REACT_APP_API;

// ─── Column Definitions ──────────────────────────────────────────────────────
const SCREEN_COLUMNS = [
    { label: 'SR No', key: 'SR_No', numeric: false, isTotal: false },
    { label: 'Invoice No', key: 'Invoice_No', numeric: false, isTotal: false },
    { label: 'Section_Code', key: 'Section_Code', numeric: false, isTotal: false },
    { label: 'Party Code', key: 'PartyCode', numeric: false, isTotal: false },
    { label: 'Party Name', key: 'PartyName', numeric: false, isTotal: false },
    { label: 'Party Pan No.', key: 'CompanyPan', numeric: false, isTotal: false },
    { label: 'TDS Section Code', key: 'TDS_Section_Code', numeric: false },
    { label: 'Invoice Date', key: 'Invoice_Date', numeric: false, isTotal: false },
    { label: 'Taxable Amount', key: 'TaxableAmount', numeric: true, isTotal: true },
    { label: 'CGST', key: 'CGST', numeric: true, isTotal: true },
    { label: 'SGST', key: 'SGST', numeric: true, isTotal: true },
    { label: 'IGST', key: 'IGST', numeric: true, isTotal: true },
    { label: 'Bill Amount', key: 'Bill_Amount', numeric: true, isTotal: true },
    { label: 'TDS Amount', key: 'TDSAmount', numeric: true, isTotal: true },
];

const PRINT_COLUMNS = [
    { label: 'Inv No', key: 'Invoice_No', printWidth: 25 },
    { label: 'Date', key: 'Invoice_Date', printWidth: 25 },
    { label: 'Party Code', key: 'PartyCode', printWidth: 25 },
    { label: 'Party Name', key: 'PartyName', printWidth: 60 },
    { label: 'Party Pan No.', key: 'CompanyPan', printWidth: 60 },
    { label: 'TDS Section Code', key: 'TDS_Section_Code', printWidth: 30 },
    { label: 'Taxable Amt', key: 'TaxableAmount', printWidth: 35, numeric: true, isTotal: true },
    { label: 'CGST', key: 'CGST', printWidth: 25, numeric: true, isTotal: true },
    { label: 'SGST', key: 'SGST', printWidth: 25, numeric: true, isTotal: true },
    { label: 'IGST', key: 'IGST', printWidth: 25, numeric: true, isTotal: true },
    { label: 'Bill Amt', key: 'Bill_Amount', printWidth: 35, numeric: true, isTotal: true },
    { label: 'TDS', key: 'TDSAmount', printWidth: 25, numeric: true, isTotal: true },
];

const TDSSectionGroupwiseReport = ({ fromDate, toDate, companyCode, yearCode, accode, Section_Id, sectionName }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [error, setError] = useState('');
    const [pdfPreview, setPdfPreview] = useState(null);

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data === 'TRIGGER_TDS_PRINT') handleGeneratePDF();
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [data]);

    const grandTotals = useMemo(() => {
        const t = { TaxableAmount: 0, CGST: 0, SGST: 0, IGST: 0, Bill_Amount: 0, TDSAmount: 0 };
        data.forEach(row => {
            Object.keys(t).forEach(k => { t[k] += parseFloat(row[k] || 0); });
        });
        return t;
    }, [data]);

    const fetchOtherPurchaseSummary = async () => {
        try {
            setLoading(true);
            setError('');
            setPdfPreview(null);
            const response = await axios.get(`${API_URL}/OtherPurchase-summary-TDSSectionwise`, {
                params: {
                    from_date: fromDate, to_date: toDate, Company_Code: companyCode,
                    Year_Code: yearCode, accode: accode, Section_Id: Section_Id
                },
            });
            if (!response.data || response.data.length === 0) {
                Swal.fire({ icon: 'error', title: 'Data Not Found!', text: 'No TDS records found.' });
                return;
            }
            setData(response.data);
            openInNewWindow(response.data);
        } catch (err) {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };


const handleGeneratePDF = () => {

    if (data.length === 0) {
        return;
    }

    setIsPrinting(true);

    // --------------------------------------------------
    // GROUP DATA BY SECTION CODE
    // --------------------------------------------------

    const groupedData = {};

    data.forEach(row => {

        const sectionCode =
            row.Section_Code || 'Without Section';

        if (!groupedData[sectionCode]) {
            groupedData[sectionCode] = [];
        }

        groupedData[sectionCode].push(row);

    });


    // --------------------------------------------------
    // HELPER : SECTION TOTAL
    // --------------------------------------------------

    const getSectionTotal = (rows, key) => {

        return rows.reduce(
            (total, row) =>
                total + parseFloat(row[key] || 0),
            0
        );

    };


    // --------------------------------------------------
    // PDF ROWS
    // --------------------------------------------------

    const pdfRows = [];


    // --------------------------------------------------
    // SECTION CODE WISE ROWS
    // --------------------------------------------------

    Object.keys(groupedData)
        .sort()
        .forEach(sectionCode => {

            const sectionRows =
                groupedData[sectionCode];


            // ------------------------------------------
            // SECTION HEADER
            // ------------------------------------------

            pdfRows.push([
                {
                    content:
                        'TDS SECTION CODE : ' +
                        sectionCode,

                    colSpan: PRINT_COLUMNS.length,

                    styles: {
                        fontStyle: 'bold',
                        fillColor: [225, 218, 245],
                        textColor: [26, 35, 126],
                        halign: 'left',
                        fontSize: 9
                    }
                }
            ]);


            // ------------------------------------------
            // DETAIL ROWS
            // ------------------------------------------

            sectionRows.forEach(row => {

                pdfRows.push(
                    PRINT_COLUMNS.map(col => {

                        if (col.numeric) {

                            return formatReadableAmount(
                                row[col.key] || 0
                            );

                        }

                        return row[col.key] || '';

                    })
                );

            });


            // ------------------------------------------
            // SECTION TOTAL
            // ------------------------------------------

            pdfRows.push(
                PRINT_COLUMNS.map((col, index) => {

                    if (index === 0) {

                        return {
                            content:
                                'SECTION ' +
                                sectionCode +
                                ' TOTAL',

                            styles: {
                                fontStyle: 'bold',
                                fillColor: [255, 243, 205],
                                halign: 'left'
                            }
                        };

                    }


                    if (col.isTotal) {

                        return {
                            content:
                                formatReadableAmount(
                                    getSectionTotal(
                                        sectionRows,
                                        col.key
                                    )
                                ),

                            styles: {
                                fontStyle: 'bold',
                                fillColor: [255, 243, 205],
                                halign: 'right'
                            }
                        };

                    }


                    return {
                        content: '',
                        styles: {
                            fillColor: [255, 243, 205]
                        }
                    };

                })
            );

        });


    // --------------------------------------------------
    // GRAND TOTAL
    // --------------------------------------------------

    pdfRows.push(
        PRINT_COLUMNS.map((col, index) => {

            if (index === 0) {

                return {
                    content: 'GRAND TOTAL',

                    styles: {
                        fontStyle: 'bold',
                        fillColor: [255, 249, 196],
                        halign: 'left'
                    }
                };

            }


            if (col.isTotal) {

                return {
                    content:
                        formatReadableAmount(
                            grandTotals[col.key] || 0
                        ),

                    styles: {
                        fontStyle: 'bold',
                        fillColor: [255, 249, 196],
                        halign: 'right'
                    }
                };

            }


            return {
                content: '',
                styles: {
                    fillColor: [255, 249, 196]
                }
            };

        })
    );


    // --------------------------------------------------
    // GENERATE PDF
    // --------------------------------------------------

    generateReportPDF({

        title: 'TDS Section Code Wise Report',

        subtitle:
            FormaDateBalanceSheet(fromDate) +
            ' to ' +
            FormaDateBalanceSheet(toDate),

        columns:
            PRINT_COLUMNS.map(c => c.label),

        rows: pdfRows,

        footerRow: [],

        headerImgSrc: HeaderJK,

        footerImgSrc: FooterJK,

        numericCols:
            PRINT_COLUMNS
                .map((c, i) =>
                    c.numeric ? i : null
                )
                .filter(i => i !== null),

        orientation: 'landscape',

        onComplete: (url) => {

            setPdfPreview(url);

            setIsPrinting(false);

        }

    });

};


    const openInNewWindow = (reportData) => {
        const newWindow = window.open('', '_blank');
        if (!newWindow) return;

        newWindow.document.write(`<!DOCTYPE html>
<html><head><title>TDS Section Group Summary</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',sans-serif;padding:20px;background:#f0f2ff}
  h2{text-align:center;color:#1a237e;margin-bottom:4px;font-size:20px}
  .sub{text-align:center; color: #333;font-size:13px;margin-bottom:14px}
  .toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:8px}
  .search{border:1px solid #c5cae9;border-radius:6px;padding:8px 12px;font-size:13px;width:300px;outline:none}
  .btn{padding:8px 16px;border-radius:6px;border:none;font-size:13px;font-weight:600;cursor:pointer;color:#fff;transition:0.2s}
  .btn-green{background:#2e7d32}.btn-red{background:#c62828}
  .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-bottom:12px}
  .card{background:#fff;border:1px solid #c5cae9;border-radius:8px;padding:10px;text-align:center}
  .card-label{font-size:10px;color:#5c6bc0;font-weight:600;text-transform:uppercase}
  .card-value{font-size:15px;font-weight:700;color:#1a237e}
  .wrap{max-height:650px;overflow:auto;border:1px solid #c5cae9;border-radius:8px;box-shadow:0 4px 18px rgba(26,35,126,.1)}
  table{width:100%;border-collapse:collapse;font-size:11px}
  th{background:#1a237e;color:#fff;padding:12px 10px;position:sticky;top:0;z-index:2;text-align:left;cursor:pointer;user-select:none}
  th.num{text-align:right}
  .sort-icon{font-size:14px;margin-left:5px;opacity:0.3}
  .sort-active{opacity:1;color:#ffeb3b}
  td{padding:8px 10px;border-bottom:1px solid #e8eaf6;white-space:nowrap}
  td.num{text-align:right}
  tr:nth-child(even) td{background:#f7f8fd}
  tr:hover td{background:#e8eaf6}
  tfoot tr td{background:#fff9c4;font-weight:700;border-top:2px solid #fbc02d;position:sticky;bottom:0}
.section-header td {
    background: #d1c4e9 !important;
    color: #1a237e !important;
    font-weight: 700 !important;
    font-size: 14px !important;
    padding: 10px !important;

    white-space: normal !important;
    overflow: visible !important;
    text-overflow: unset !important;

    word-break: break-word !important;
    overflow-wrap: anywhere !important;

    text-align: left !important;
    width: 100% !important;

    border-top: 2px solid #7e57c2 !important;
}

.section-total td {
    background: #fff3cd !important;
    font-weight: 700 !important;
    white-space: nowrap !important;
}
  </style></head><body>
<h2>TDS Sectionwise Summary</h2>
<div class="sub">${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}</div>
<div class="cards" id="cards"></div>
<div class="toolbar">
  <input class="search" id="searchBox" placeholder="Search data..." oninput="filterTable()">
  <div style="display:flex;gap:8px">
    <button class="btn btn-red" onclick="window.opener.postMessage('TRIGGER_TDS_PRINT', '*')">Print</button>
    <button class="btn btn-green" onclick="exportXlsx()">Export Excel</button>
  </div>
</div>
<div class="wrap"><table id="tbl">
  <thead><tr id="hdr"></tr></thead>
  <tbody id="tbody"></tbody>
  <tfoot><tr id="tfoot"></tr></tfoot>
</table></div>
<script>
const RAW = ${JSON.stringify(reportData)};
const COLS = ${JSON.stringify(SCREEN_COLUMNS)};
let filtered = [...RAW];
let currentSort = { key: 'SR_No', dir: 'asc' };

function fmt(v){ return v == null || v === '' ? '' : Number(v).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2}); }


function render(data) {

    const groupedData = {};

    // Group data by Section_Code
    data.forEach(function (row) {

        const sectionCode = row.Section_Code || 'Without Section';

        if (!groupedData[sectionCode]) {
            groupedData[sectionCode] = [];
        }

        groupedData[sectionCode].push(row);
    });


    // Calculate total
    function sum(rows, key) {

        return rows.reduce(function (total, row) {
            return total + parseFloat(row[key] || 0);
        }, 0);
    }


    // --------------------------------------------------
    // SUMMARY CARDS
    // --------------------------------------------------

    document.getElementById('cards').innerHTML =
        ['TaxableAmount', 'Bill_Amount', 'TDSAmount']
            .map(function (key) {

                return '<div class="card">' +
                    '<div class="card-label">' +
                    key.replace('_', ' ') +
                    '</div>' +

                    '<div class="card-value">' +
                    fmt(sum(data, key)) +
                    '</div>' +

                    '</div>';

            })
            .join('');


    // --------------------------------------------------
    // TABLE HEADER
    // --------------------------------------------------

    document.getElementById('hdr').innerHTML =
        COLS.map(function (c) {

            return '<th class="' +
                (c.numeric ? 'num' : '') +
                '">' +
                c.label +
                '</th>';

        }).join('');


    // --------------------------------------------------
    // TABLE BODY - SECTION CODE WISE
    // --------------------------------------------------

    let html = '';

    Object.keys(groupedData)
        .sort()
        .forEach(function (sectionCode) {

            const sectionRows = groupedData[sectionCode];


            // Section heading
          html += '<tr class="section-header">' + '<td colspan="' + COLS.length + '">' + 'TDS SECTION : ' + sectionCode + ' CODE: ' + (sectionRows[0].TDS_Section_Code || '') + '</td>' + '</tr>';

            // Detail rows
            sectionRows.forEach(function (row) {

                html += '<tr>';

                COLS.forEach(function (c) {

                    html +=
                        '<td class="' +
                        (c.numeric ? 'num' : '') +
                        '">' +

                        (
                            c.numeric
                                ? fmt(row[c.key] || 0)
                                : (row[c.key] || '')
                        ) +

                        '</td>';

                });

                html += '</tr>';

            });


            // Section total
            html += '<tr class="section-total">';

            COLS.forEach(function (c, index) {

                if (index === 0) {

                    html +=
                        '<td>' +
                        'TOTAL' +
                        '</td>';

                }
                else if (c.isTotal) {

                    html +=
                        '<td class="num">' +
                        fmt(sum(sectionRows, c.key)) +
                        '</td>';

                }
                else {

                    html += '<td></td>';

                }

            });

            html += '</tr>';

        });


    document.getElementById('tbody').innerHTML = html;


    // --------------------------------------------------
    // GRAND TOTAL
    // --------------------------------------------------

    let footerHtml = '';

    COLS.forEach(function (c, index) {

        if (index === 0) {

            footerHtml += '<td>GRAND TOTAL</td>';

        }
        else if (c.isTotal) {

            footerHtml +=
                '<td class="num">' +
                fmt(sum(data, c.key)) +
                '</td>';

        }
        else {

            footerHtml += '<td></td>';

        }

    });

    document.getElementById('tfoot').innerHTML = footerHtml;
}

        
function handleSort(key) {
  if (currentSort.key === key) { currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc'; } 
  else { currentSort.key = key; currentSort.dir = 'asc'; }
  
  filtered.sort((a, b) => {
    let valA = a[key] ?? ''; let valB = b[key] ?? '';
    if(!isNaN(valA) && !isNaN(valB) && valA !== '' && valB !== '') {
       return currentSort.dir === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
    }
    valA = String(valA).toLowerCase(); valB = String(valB).toLowerCase();
    return currentSort.dir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });
  render(filtered);
}

function filterTable(){
  const q = document.getElementById('searchBox').value.toLowerCase();
  filtered = RAW.filter(r=>Object.values(r).some(v=>String(v).toLowerCase().includes(q)));
  render(filtered);
}


function exportXlsx() {

    const wb = XLSX.utils.book_new();

    const groupedData = {};

    // ---------------------------------------------
    // GROUP DATA BY SECTION CODE
    // ---------------------------------------------

    filtered.forEach(function (row) {

        const sectionCode =
            row.Section_Code || 'Without Section';

        if (!groupedData[sectionCode]) {
            groupedData[sectionCode] = [];
        }

        groupedData[sectionCode].push(row);
    });


    // ---------------------------------------------
    // EXCEL HEADERS
    // ---------------------------------------------

    const headers = COLS.map(function (c) {
        return c.label;
    });


    const excelData = [];


    // ---------------------------------------------
    // REPORT TITLE
    // ---------------------------------------------

    excelData.push([
        'TDS Section Code Wise Report'
    ]);

    excelData.push([
        '${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}'
    ]);

    excelData.push([]);


    // ---------------------------------------------
    // SECTION-WISE DATA
    // ---------------------------------------------

    Object.keys(groupedData)
        .sort()
        .forEach(function (sectionCode) {

            const sectionRows =
                groupedData[sectionCode];


            // Section heading
            excelData.push([
                'TDS SECTION CODE : ' + sectionCode
            ]);

            // Column headers
            excelData.push(headers);


            // Detail rows
            sectionRows.forEach(function (row) {

                excelData.push(
                    COLS.map(function (c) {

                        if (c.numeric) {
                            return parseFloat(
                                row[c.key] || 0
                            );
                        }

                        return row[c.key] || '';
                    })
                );

            });


            // ---------------------------------------------
            // SECTION TOTAL
            // ---------------------------------------------

            excelData.push(
                COLS.map(function (c, index) {

                    if (index === 0) {
                        return 'SECTION ' +
                            sectionCode +
                            ' TOTAL';
                    }

                    if (c.isTotal) {

                        return sectionRows.reduce(
                            function (total, row) {

                                return total +
                                    parseFloat(
                                        row[c.key] || 0
                                    );

                            },
                            0
                        );

                    }

                    return '';

                })
            );


            // Blank row between sections
            excelData.push([]);

        });


    // ---------------------------------------------
    // GRAND TOTAL
    // ---------------------------------------------

    excelData.push(
        COLS.map(function (c, index) {

            if (index === 0) {
                return 'GRAND TOTAL';
            }

            if (c.isTotal) {

                return filtered.reduce(
                    function (total, row) {

                        return total +
                            parseFloat(
                                row[c.key] || 0
                            );

                    },
                    0
                );

            }

            return '';

        })
    );


    // ---------------------------------------------
    // CREATE WORKSHEET
    // ---------------------------------------------

    const ws =
        XLSX.utils.aoa_to_sheet(excelData);


    // ---------------------------------------------
    // COLUMN WIDTH
    // ---------------------------------------------

    ws['!cols'] = COLS.map(function (c) {

        let width = c.label.length + 5;

        if (width < 15) {
            width = 15;
        }

        if (width > 35) {
            width = 35;
        }

        return {
            wch: width
        };

    });


    // ---------------------------------------------
    // MERGE SECTION HEADINGS
    // ---------------------------------------------

    const merges = [];

    let currentRow = 3;

    Object.keys(groupedData)
        .sort()
        .forEach(function (sectionCode) {

            // Section heading row
            merges.push({
                s: {
                    r: currentRow,
                    c: 0
                },
                e: {
                    r: currentRow,
                    c: COLS.length - 1
                }
            });

            // Move to next section
            currentRow +=
                1 +                         // Section heading
                1 +                         // Header
                groupedData[sectionCode].length +
                1 +                         // Section total
                1;                          // Blank row
        });


    ws['!merges'] = merges;


    // ---------------------------------------------
    // FREEZE HEADER
    // ---------------------------------------------

    ws['!freeze'] = {
        xSplit: 0,
        ySplit: 4
    };


    // ---------------------------------------------
    // CREATE EXCEL FILE
    // ---------------------------------------------

    XLSX.utils.book_append_sheet(
        wb,
        ws,
        'TDS Section Wise'
    );


    XLSX.writeFile(
        wb,
        'TDSSectionCodeWiseReport.xlsx'
    );
}


render(RAW);
</script></body></html>`);
        newWindow.document.close();
    };

    const groupBySectionCode = (rows) => {
    return rows.reduce((groups, row) => {
        const sectionCode = row.Section_Code || 'Without Section';

        if (!groups[sectionCode]) {
            groups[sectionCode] = [];
        }

        groups[sectionCode].push(row);

        return groups;
    }, {});
};

    return (
        <div style={{ padding: '5px', textAlign: 'center' }}>
            <button style={{
                marginTop: '5px', background: '#007bff', color: '#fff', border: 'none',
                borderRadius: '8px', padding: '12px 10px', fontWeight: 600, cursor: 'pointer',
                width: '20%', height: '60px'
            }} onClick={fetchOtherPurchaseSummary} disabled={loading}>
                {loading ? <CircularProgress size={24} color="inherit" /> : "TDS Section Group wise Report"}
            </button>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            {pdfPreview && <PdfPreview pdfData={pdfPreview} label="GSTTdsSection" />}
            {(loading || isPrinting) && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(255,255,255,0.8)', zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <ScaleLoader color="#1a237e" height={40} />
                    <Typography sx={{ mt: 2, fontWeight: 700, color: '#1a237e' }}>
                        {isPrinting ? 'Generating Premium Report...' : 'Fetching TDS Data...'}
                    </Typography>
                </div>
            )}
        </div>
    );
};

export default TDSSectionGroupwiseReport;
