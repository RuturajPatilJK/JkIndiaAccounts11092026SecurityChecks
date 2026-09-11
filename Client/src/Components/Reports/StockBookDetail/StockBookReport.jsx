// import React, { useEffect, useState, useRef } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { jsPDF } from 'jspdf';
// import 'jspdf-autotable';
// import * as XLSX from 'xlsx';
// import PdfPreview from "../../../Common/PDFPreview";
// import { ScaleLoader } from 'react-spinners';
// import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount"
// import BackButton from "../../../Common/Buttons/BackButton";

// const API_URL = process.env.REACT_APP_API;

// const StockBookReport = () => {
//   const location = useLocation();
//   const companyCode = sessionStorage.getItem("Company_Code");
//   const Year_Code = sessionStorage.getItem("Year_Code");
//   const companyName = sessionStorage.getItem('Company_Name')

//   const searchParams = new URLSearchParams(location.search);
//   const itemCode = searchParams.get('itemCode');
//   const toDate = searchParams.get('toDate');
//   const fromDate = searchParams.get('fromDate');

//   const [groupedData, setGroupedData] = useState({});
//   const [sortedData, setSortedData] = useState({});
//   const [loading, setLoading] = useState(true);
//   const [pdfPreview, setPdfPreview] = useState([])
//   const [showPreview, setShowPreview] = useState(false);
//   const [sortConfig, setSortConfig] = useState({});
//   const reportRef = useRef();

//   const navigate = useNavigate();

//   const groupBy = (array, key) => {
//     const grouped = array.reduce((result, currentItem) => {
//       const groupKey = currentItem[key];
//       if (!result[groupKey]) {
//         result[groupKey] = [];
//       }
//       result[groupKey].push(currentItem);
//       return result;
//     }, {});

//     const sortedKeys = Object.keys(grouped).sort((a, b) =>
//       a.localeCompare(b)
//     );

//     const sortedGrouped = {};
//     sortedKeys.forEach((key) => {
//       sortedGrouped[key] = grouped[key];
//     });

//     return sortedGrouped;
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return "";
//     const date = new Date(dateString);
//     return `${String(date.getDate()).padStart(2, "0")}/${String(
//       date.getMonth() + 1
//     ).padStart(2, "0")}/${date.getFullYear()}`;
//   };

//   const sortData = (data, column, direction) => {
//     if (!data || !Array.isArray(data)) return [];

//     const sorted = [...data];

//     sorted.sort((a, b) => {
//       let aValue, bValue;

//       switch (column) {
//         case 'date':
//           aValue = new Date(a.doc_date).getTime();
//           bValue = new Date(b.doc_date).getTime();
//           break;
//         case 'opening_qty':
//           aValue = parseFloat(a.op_qty) || 0;
//           bValue = parseFloat(b.op_qty) || 0;
//           break;
//         case 'opening_value':
//           aValue = parseFloat(a.op_value) || 0;
//           bValue = parseFloat(b.op_value) || 0;
//           break;
//         case 'purchase_qty':
//           aValue = parseFloat(a.purc_qty) || 0;
//           bValue = parseFloat(b.purc_qty) || 0;
//           break;
//         case 'purchase_value':
//           aValue = parseFloat(a.purc_value) || 0;
//           bValue = parseFloat(b.purc_value) || 0;
//           break;
//         case 'sale_qty':
//           aValue = parseFloat(a.sale_qty) || 0;
//           bValue = parseFloat(b.sale_qty) || 0;
//           break;
//         case 'sale_value':
//           aValue = parseFloat(a.sale_val) || 0;
//           bValue = parseFloat(b.sale_val) || 0;
//           break;
//         case 'closing_qty':
//           aValue = parseFloat(a.close_qty) || 0;
//           bValue = parseFloat(b.close_qty) || 0;
//           break;
//         case 'closing_value':
//           aValue = parseFloat(a.close_val) || 0;
//           bValue = parseFloat(b.close_val) || 0;
//           break;
//         case 'day_diff':
//           aValue = (parseFloat(a.purc_qty) || 0) - (parseFloat(a.sale_qty) || 0);
//           bValue = (parseFloat(b.purc_qty) || 0) - (parseFloat(b.sale_qty) || 0);
//           break;
//         default:
//           aValue = a[column];
//           bValue = b[column];
//       }

//       if (direction === 'asc') {
//         if (aValue < bValue) return -1;
//         if (aValue > bValue) return 1;
//         return 0;
//       } else {
//         if (aValue > bValue) return -1;
//         if (aValue < bValue) return 1;
//         return 0;
//       }
//     });

//     return sorted;
//   };

//   const handleSort = (groupKey, column) => {
//     setSortConfig(prevConfig => {
//       const currentConfig = prevConfig[groupKey];

//       let newDirection;

//       if (!currentConfig || currentConfig.column !== column) {
//         newDirection = 'asc';
//       } else if (currentConfig.column === column && currentConfig.direction === 'asc') {
//         newDirection = 'desc';
//       } else if (currentConfig.column === column && currentConfig.direction === 'desc') {
//         newDirection = null;
//       } else {
//         newDirection = 'asc';
//       }

//       const newConfig = { ...prevConfig };

//       if (newDirection) {
//         newConfig[groupKey] = { column, direction: newDirection };
//         const sortedGroupData = sortData(groupedData[groupKey], column, newDirection);

//         setSortedData(prev => ({
//           ...prev,
//           [groupKey]: sortedGroupData
//         }));
//       } else {
//         delete newConfig[groupKey];
//         setSortedData(prev => ({
//           ...prev,
//           [groupKey]: [...groupedData[groupKey]]
//         }));
//       }

//       return newConfig;
//     });
//   };

//   const getSortIcon = (groupKey, column) => {
//     const config = sortConfig[groupKey];
//     if (config && config.column === column) {
//       return config.direction === 'asc' ? ' ↑' : ' ↓';
//     }
//     return ' ⇅';
//   };

//   useEffect(() => {
//     const fetchStockBookReport = async () => {
//       try {
//         const response = await fetch(
//           `${API_URL}/report-stock-book?fromDate=${fromDate}&company_code=${companyCode}&Item_Code=${itemCode}&ToDate=${toDate}&Year_Code=${Year_Code} `
//         );
//         const result = await response.json();
//         const filteredData = result.data.filter((item) => {
//           const docDate = new Date(item.doc_date);
//           const from = new Date(fromDate);
//           const to = new Date(toDate);
//           return docDate >= from && docDate <= to;
//         });

//         const grouped = groupBy(filteredData, "item_name");
//         setGroupedData(grouped);
//         const initialSorted = {};
//         Object.keys(grouped).forEach(key => {
//           initialSorted[key] = [...grouped[key]];
//         });
//         setSortedData(initialSorted);
//       } catch (error) {
//         console.error("Error fetching stock book report:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchStockBookReport();
//   }, [toDate, fromDate, companyCode, Year_Code, itemCode]);

//   const handleBack = () => {
//     navigate('/stock-book')
//   }

//   // Fixed Print Function - Landscape with better scaling
//   const handlePrint = () => {
//     const printContent = reportRef.current.cloneNode(true);

//     // Create a new window for printing
//     const printWindow = window.open('', '_blank', 'width=1200,height=800');

//     printWindow.document.write(`
//       <!DOCTYPE html>
//       <html>
//         <head>
//           <title>Stock Book Report - ${companyName}</title>
//           <meta charset="utf-8" />
//           <style>
//             * {
//               margin: 0;
//               padding: 0;
//               box-sizing: border-box;
//             }

//             body {
//               font-family: 'Arial', 'Helvetica', sans-serif;
//               margin: 0;
//               padding: 20px;
//               background: white;
//               font-size: 11px;
//             }

//             @page {
//               size: landscape;
//               margin: 15mm 10mm;
//             }

//             .print-container {
//               max-width: 100%;
//               margin: 0 auto;
//             }

//             .header {
//               text-align: center;
//               margin-bottom: 25px;
//               page-break-after: avoid;
//             }

//             .company-name {
//               font-size: 22px;
//               font-weight: bold;
//               margin-bottom: 8px;
//               color: #000;
//             }

//             .report-title {
//               font-size: 18px;
//               font-weight: bold;
//               margin-bottom: 8px;
//               color: #000;
//             }

//             .date-range {
//               font-size: 12px;
//               margin-bottom: 15px;
//               color: #333;
//             }

//             .item-section {
//               margin-bottom: 30px;
//               page-break-inside: avoid;
//               break-inside: avoid;
//             }

//             .item-header {
//               background-color: #f0f0f0;
//               padding: 8px 12px;
//               margin: 15px 0 10px 0;
//               font-weight: bold;
//               font-size: 13px;
//               border-left: 4px solid #2196F3;
//               page-break-after: avoid;
//             }

//             table {
//               width: 100%;
//               border-collapse: collapse;
//               font-size: 10px;
//               margin-bottom: 20px;
//               page-break-inside: avoid;
//               break-inside: avoid;
//             }

//             th, td {
//               border: 1px solid #000;
//               padding: 6px 4px;
//               text-align: right;
//             }

//             th:first-child, td:first-child {
//               text-align: center;
//             }

//             th {
//               background-color: #e0e0e0;
//               font-weight: bold;
//               font-size: 10px;
//             }

//             tbody tr:nth-child(even) {
//               background-color: #f9f9f9;
//             }

//             tfoot td {
//               background-color: #e0e0e0;
//               font-weight: bold;
//             }

//             .opening-header {
//               background-color: #e8f4f8;
//             }

//             .purchase-header {
//               background-color: #d4edda;
//             }

//             .sale-header {
//               background-color: #f8d7da;
//             }

//             .closing-header {
//               background-color: #fff3cd;
//             }

//             .daydiff-header {
//               background-color: #d1ecf1;
//             }

//             /* Ensure tables don't break across pages badly */
//             tr {
//               page-break-inside: avoid;
//               break-inside: avoid;
//             }

//             /* Responsive table container */
//             .table-wrapper {
//               overflow-x: auto;
//               width: 100%;
//               margin-bottom: 20px;
//             }

//             @media print {
//               body {
//                 padding: 0;
//                 margin: 0;
//               }

//               button, .no-print {
//                 display: none !important;
//               }

//               table {
//                 font-size: 9px;
//               }

//               th, td {
//                 padding: 4px 3px;
//               }

//               .item-section {
//                 page-break-after: avoid;
//                 break-after: avoid;
//               }
//             }
//           </style>
//         </head>
//         <body>
//           <div class="print-container">
//             ${printContent.innerHTML}
//           </div>
//           <script>
//             window.onload = function() {
//               window.print();
//               window.onafterprint = function() {
//                 window.close();
//               };
//             };
//           <\/script>
//         </body>
//       </html>
//     `);

//     printWindow.document.close();
//   };

//   const exportToExcel = () => {
//     const excelData = [];

//     excelData.push(['Company Name', companyName]);
//     excelData.push(['Report', 'Stock Book Report']);
//     excelData.push(['From Date', formatDate(fromDate)]);
//     excelData.push(['To Date', formatDate(toDate)]);
//     excelData.push([]);

//     Object.keys(sortedData).forEach((group) => {
//       excelData.push([`Item: ${group.toUpperCase()}`]);
//       excelData.push([]);

//       excelData.push([
//         'Date',
//         'Opening Qty (Quintals)',
//         'Opening Value',
//         'Purchase Qty (Quintals)',
//         'Purchase Value',
//         'Sale Qty (Quintals)',
//         'Sale Value',
//         'Closing Qty (Quintals)',
//         'Closing Value',
//         'Day Diff'
//       ]);

//       sortedData[group].forEach((row) => {
//         excelData.push([
//           formatDate(row.doc_date),
//           formatReadableAmount((parseFloat(row.op_qty) || 0).toFixed(2)),
//           formatReadableAmount((parseFloat(row.op_value) || 0).toFixed(2)),
//           formatReadableAmount((parseFloat(row.purc_qty) || 0).toFixed(2)),
//           formatReadableAmount((parseFloat(row.purc_value) || 0).toFixed(2)),
//           formatReadableAmount((parseFloat(row.sale_qty) || 0).toFixed(2)),
//           formatReadableAmount((parseFloat(row.sale_val) || 0).toFixed(2)),
//           formatReadableAmount((parseFloat(row.close_qty) || 0).toFixed(2)),
//           formatReadableAmount((parseFloat(row.close_val) || 0).toFixed(2)),
//           formatReadableAmount(
//             ((parseFloat(row.purc_qty) || 0) - (parseFloat(row.sale_qty) || 0)).toFixed(2)
//           )
//         ]);
//       });

//       excelData.push([
//         'TOTAL',
//         '',
//         '',
//         formatReadableAmount(sortedData[group]
//           .reduce((sum, item) => sum + (parseFloat(item.purc_qty) || 0), 0)
//           .toFixed(2)),
//         formatReadableAmount(sortedData[group]
//           .reduce((sum, item) => sum + (parseFloat(item.purc_value) || 0), 0)
//           .toFixed(2)),
//         formatReadableAmount(sortedData[group]
//           .reduce((sum, item) => sum + (parseFloat(item.sale_qty) || 0), 0)
//           .toFixed(2)),
//         formatReadableAmount(sortedData[group]
//           .reduce((sum, item) => sum + (parseFloat(item.sale_val) || 0), 0)
//           .toFixed(2)),
//         '',
//         '',
//         ''
//       ]);

//       excelData.push([]);
//       excelData.push([]);
//     });

//     const ws = XLSX.utils.aoa_to_sheet(excelData);

//     // Set column widths
//     ws['!cols'] = [
//       { wch: 12 },  // Date
//       { wch: 18 },  // Opening Qty
//       { wch: 15 },  // Opening Value
//       { wch: 18 },  // Purchase Qty
//       { wch: 15 },  // Purchase Value
//       { wch: 15 },  // Sale Qty
//       { wch: 15 },  // Sale Value
//       { wch: 18 },  // Closing Qty
//       { wch: 15 },  // Closing Value
//       { wch: 12 }   // Day Diff
//     ];

//     // Apply right alignment to all amount columns (all except Date column)
//     const range = XLSX.utils.decode_range(ws['!ref']);
//     for (let row = range.s.r; row <= range.e.r; row++) {
//       for (let col = range.s.c; col <= range.e.c; col++) {
//         const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
//         if (!ws[cellAddress]) continue;

//         // Right align all amount columns (columns 1-9, excluding Date column 0)
//         if (col >= 1 && col <= 9) {
//           if (!ws[cellAddress].s) ws[cellAddress].s = {};
//           ws[cellAddress].s.alignment = { horizontal: 'right' };
//         }
//         // Center align Date column (column 0)
//         if (col === 0) {
//           if (!ws[cellAddress].s) ws[cellAddress].s = {};
//           ws[cellAddress].s.alignment = { horizontal: 'center' };
//         }
//       }
//     }

//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, 'Stock Book Report');

//     const fileName = `Stock_Book_Report_${formatDate(fromDate)}_to_${formatDate(toDate)}.xlsx`;
//     XLSX.writeFile(wb, fileName);
//   };

//   const generatePDF = () => {
//     const doc = new jsPDF("landscape", "mm", "a4");
//     const pageHeight = doc.internal.pageSize.height;
//     const margin = 10;
//     const pageWidth = doc.internal.pageSize.width;

//     doc.setFontSize(14);
//     doc.setFont("helvetica", "bold");
//     const companyNameWidth = doc.getTextWidth(companyName || "Company Name");
//     const companyNameX = (pageWidth - companyNameWidth) / 2;
//     doc.text(companyName, companyNameX, 10);

//     doc.setFontSize(12);
//     doc.setFont("helvetica", "normal");
//     const titleWidth = doc.getTextWidth("Stock Book Report");
//     const titleX = (pageWidth - titleWidth) / 2;
//     doc.text("Stock Book Report", titleX, 18);

//     doc.setFontSize(10);
//     const dateRangeText = `From Date: ${formatDate(fromDate)} | To Date: ${formatDate(toDate)}`;
//     const dateRangeWidth = doc.getTextWidth(dateRangeText);
//     const dateRangeX = (pageWidth - dateRangeWidth) / 2;
//     doc.text(dateRangeText, dateRangeX, 24);

//     let currentY = 34;
//     Object.keys(sortedData).forEach((group, groupIndex) => {
//       if (currentY + 20 > pageHeight - margin) {
//         doc.addPage();
//         currentY = margin;
//       }

//       doc.setFontSize(11);
//       doc.setTextColor(40);
//       doc.setFont("helvetica", "bold");
//       const itemText = `Item Name: ${group.toUpperCase()}`;
//       const itemTextWidth = doc.getTextWidth(itemText);
//       const itemTextX = (pageWidth - itemTextWidth) / 2;
//       doc.text(itemText, itemTextX, currentY);
//       currentY += 8;

//       const tableData = sortedData[group].map((row) => [
//         formatDate(row.doc_date),
//         formatReadableAmount((parseFloat(row.op_qty) || 0).toFixed(2)),
//         formatReadableAmount((parseFloat(row.op_value) || 0).toFixed(2)),
//         formatReadableAmount((parseFloat(row.purc_qty) || 0).toFixed(2)),
//         formatReadableAmount((parseFloat(row.purc_value) || 0).toFixed(2)),
//         formatReadableAmount((parseFloat(row.sale_qty) || 0).toFixed(2)),
//         formatReadableAmount((parseFloat(row.sale_val) || 0).toFixed(2)),
//         formatReadableAmount((parseFloat(row.close_qty) || 0).toFixed(2)),
//         formatReadableAmount((parseFloat(row.close_val) || 0).toFixed(2)),
//         formatReadableAmount(((parseFloat(row.purc_qty) || 0) - (parseFloat(row.sale_qty) || 0)).toFixed(2)),
//       ]);

//       const totalRow = [
//         "Total",
//         formatReadableAmount(sortedData[group]
//           .reduce((sum, item) => sum + (parseFloat(item.op_qty) || 0), 0)
//           .toFixed(2)),
//         formatReadableAmount(sortedData[group]
//           .reduce((sum, item) => sum + (parseFloat(item.op_value) || 0), 0)
//           .toFixed(2)),
//         formatReadableAmount(sortedData[group]
//           .reduce((sum, item) => sum + (parseFloat(item.purc_qty) || 0), 0)
//           .toFixed(2)),
//         formatReadableAmount(sortedData[group]
//           .reduce((sum, item) => sum + (parseFloat(item.purc_value) || 0), 0)
//           .toFixed(2)),
//         formatReadableAmount(sortedData[group]
//           .reduce((sum, item) => sum + (parseFloat(item.sale_qty) || 0), 0)
//           .toFixed(2)),
//         formatReadableAmount(sortedData[group]
//           .reduce((sum, item) => sum + (parseFloat(item.sale_val) || 0), 0)
//           .toFixed(2)),
//         formatReadableAmount(sortedData[group]
//           .reduce((sum, item) => sum + (parseFloat(item.close_qty) || 0), 0)
//           .toFixed(2)),
//         formatReadableAmount(sortedData[group]
//           .reduce((sum, item) => sum + (parseFloat(item.close_val) || 0), 0)
//           .toFixed(2)),
//         "",
//       ];

//       doc.autoTable({
//         startY: currentY,
//         head: [
//           [
//             "Date",
//             "Opening Qty",
//             "Opening Value",
//             "Purchase Qty",
//             "Purchase Value",
//             "Sale Qty",
//             "Sale Value",
//             "Closing Qty",
//             "Closing Value",
//             "Day Diff",
//           ],
//         ],
//         body: [...tableData, totalRow],
//         styles: { fontSize: 7, cellPadding: 2, halign: "right" },
//         headStyles: { fillColor: [240, 240, 240], textColor: 0, halign: "center", fontSize: 7 },
//         columnStyles: {
//           0: { halign: "center", cellWidth: 25 },
//           1: { cellWidth: 22 },
//           2: { cellWidth: 25 },
//           3: { cellWidth: 22 },
//           4: { cellWidth: 25 },
//           5: { cellWidth: 22 },
//           6: { cellWidth: 25 },
//           7: { cellWidth: 22 },
//           8: { cellWidth: 25 },
//           9: { halign: "right", cellWidth: 20 }
//         },
//         margin: { left: 10, right: 10 },
//         didDrawPage: (data) => {
//           currentY = data.cursor.y;
//         },
//       });

//       currentY = doc.lastAutoTable.finalY + 8;
//     });

//     const pdfBlob = doc.output("blob");
//     const pdfUrl = URL.createObjectURL(pdfBlob);
//     setPdfPreview(pdfUrl);
//     setShowPreview(true);
//   };

//   const TableHeader = ({ groupKey, column, label, style }) => (
//     <th
//       style={{
//         textAlign: "right",
//         padding: "8px",
//         cursor: "pointer",
//         userSelect: "none",
//         position: "relative",
//         transition: "background-color 0.2s",
//         ...style
//       }}
//       onClick={() => handleSort(groupKey, column)}
//       onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e0e0e0"}
//       onMouseLeave={(e) => e.currentTarget.style.backgroundColor = style?.backgroundColor || "#f0f0f0"}
//       title={`Click to sort`}
//     >
//       {label}
//       <span style={{ marginLeft: "8px", fontSize: "11px", fontWeight: "normal" }}>
//         {getSortIcon(groupKey, column)}
//       </span>
//     </th>
//   );

//   if (loading) return (
//     <div style={{
//       display: "flex",
//       justifyContent: "center",
//       alignItems: "center",
//       height: "100vh",
//     }}>
//       <ScaleLoader color="#36d7b7" height={35} width={4} radius={2} margin={2} />
//     </div>
//   );

//   return (
//     <div style={{ padding: "10px", fontFamily: "Arial, sans-serif" }}>


//       <div className="header" style={{ textAlign: "center", marginBottom: "25px" }}>
//         <div style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "8px" }}>
//           {companyName}
//         </div>
//         <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>
//           Stock Book Report
//         </div>
//         <div style={{ fontSize: "12px", marginBottom: "15px" }}>
//           <strong>From Date:</strong> {formatDate(fromDate)} |{" "}
//           <strong>To Date:</strong> {formatDate(toDate)}
//         </div>
//       </div>

//       <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }} className="no-print">
//         <BackButton onClick={handleBack} />
//         {showPreview && pdfPreview && (
//           <PdfPreview pdfData={pdfPreview} apiData={sortedData} label={"Stock-Report"} />
//         )}
//         <button
//           onClick={handlePrint}
//           style={{ fontSize: "14px", padding: "10px 20px", height: "50px", cursor: "pointer", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "4px" }}
//         >
//           Print
//         </button>
//         <button
//           onClick={exportToExcel}
//           style={{ fontSize: "14px", padding: "10px 20px", height: "50px", cursor: "pointer", backgroundColor: "#2196F3", color: "white", border: "none", borderRadius: "4px" }}
//         >
//           Export to Excel
//         </button>
//       </div>

//       {/* Print Content */}
//       <div ref={reportRef}>

//         {Object.keys(sortedData).map((group, index) => (
//           <div key={index} className="item-section" style={{ marginBottom: "30px" }}>
//             <div className="item-header" style={{
//               backgroundColor: "#f4f4f4",
//               padding: "8px 12px",
//               marginBottom: "10px",
//               fontWeight: "bold",
//               fontSize: "14px"
//             }}>
//               {group.toUpperCase()}
//             </div>
//             <div className="table-wrapper">
//               <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
//                 <thead>
//                   <tr>
//                     <th rowSpan="2" style={{ textAlign: "center", padding: "6px", verticalAlign: "middle", backgroundColor: "#f0f0f0", fontSize: "11px" }}>
//                       Date
//                     </th>
//                     <th colSpan="2" style={{ textAlign: "center", padding: "6px", backgroundColor: "#e8f4f8", fontSize: "11px" }}>
//                       Opening
//                     </th>
//                     <th colSpan="2" style={{ textAlign: "center", padding: "6px", backgroundColor: "#d4edda", fontSize: "11px" }}>
//                       Purchase
//                     </th>
//                     <th colSpan="2" style={{ textAlign: "center", padding: "6px", backgroundColor: "#f8d7da", fontSize: "11px" }}>
//                       Sale
//                     </th>
//                     <th colSpan="2" style={{ textAlign: "center", padding: "6px", backgroundColor: "#fff3cd", fontSize: "11px" }}>
//                       Closing
//                     </th>
//                     <th rowSpan="2" style={{ textAlign: "center", padding: "6px", verticalAlign: "middle", backgroundColor: "#d1ecf1", fontSize: "11px" }}>
//                       Day Diff
//                     </th>
//                   </tr>
//                   <tr>
//                     <th style={{ textAlign: "right", padding: "6px", fontSize: "11px" }}>Qty</th>
//                     <th style={{ textAlign: "right", padding: "6px", fontSize: "11px" }}>Value</th>
//                     <th style={{ textAlign: "right", padding: "6px", fontSize: "11px" }}>Qty</th>
//                     <th style={{ textAlign: "right", padding: "6px", fontSize: "11px" }}>Value</th>
//                     <th style={{ textAlign: "right", padding: "6px", fontSize: "11px" }}>Qty</th>
//                     <th style={{ textAlign: "right", padding: "6px", fontSize: "11px" }}>Value</th>
//                     <th style={{ textAlign: "right", padding: "6px", fontSize: "11px" }}>Qty</th>
//                     <th style={{ textAlign: "right", padding: "6px", fontSize: "11px" }}>Value</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {sortedData[group].map((row, rowIndex) => (
//                     <tr key={rowIndex}>
//                       <td style={{ textAlign: "center", padding: "4px", fontSize: "11px" }}>
//                         {formatDate(row.doc_date)}
//                       </td>
//                       <td style={{ textAlign: "right", padding: "4px", fontSize: "11px" }}>
//                         {formatReadableAmount((parseFloat(row.op_qty) || 0).toFixed(2))}
//                       </td>
//                       <td style={{ textAlign: "right", padding: "4px", fontSize: "11px" }}>
//                         {formatReadableAmount((parseFloat(row.op_value) || 0).toFixed(2))}
//                       </td>
//                       <td style={{ textAlign: "right", padding: "4px", fontSize: "11px" }}>
//                         {formatReadableAmount((parseFloat(row.purc_qty) || 0).toFixed(2))}
//                       </td>
//                       <td style={{ textAlign: "right", padding: "4px", fontSize: "11px" }}>
//                         {formatReadableAmount((parseFloat(row.purc_value) || 0).toFixed(2))}
//                       </td>
//                       <td style={{ textAlign: "right", padding: "4px", fontSize: "11px" }}>
//                         {formatReadableAmount((parseFloat(row.sale_qty) || 0).toFixed(2))}
//                       </td>
//                       <td style={{ textAlign: "right", padding: "4px", fontSize: "11px" }}>
//                         {formatReadableAmount((parseFloat(row.sale_val) || 0).toFixed(2))}
//                       </td>
//                       <td style={{ textAlign: "right", padding: "4px", fontSize: "11px" }}>
//                         {formatReadableAmount((parseFloat(row.close_qty) || 0).toFixed(2))}
//                       </td>
//                       <td style={{ textAlign: "right", padding: "4px", fontSize: "11px" }}>
//                         {formatReadableAmount((parseFloat(row.close_val) || 0).toFixed(2))}
//                       </td>
//                       <td style={{ textAlign: "center", padding: "4px", fontSize: "11px" }}>
//                         {formatReadableAmount(
//                           ((parseFloat(row.purc_qty) || 0) - (parseFloat(row.sale_qty) || 0)).toFixed(2)
//                         )}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//                 <tfoot style={{ backgroundColor: "#e0e0e0", fontWeight: "bold" }}>
//                   <tr>
//                     <td style={{ textAlign: "center", padding: "6px", fontSize: "11px" }}>Total</td>
//                     <td style={{ textAlign: "right", padding: "6px", fontSize: "11px" }}>-</td>
//                     <td style={{ textAlign: "right", padding: "6px", fontSize: "11px" }}>-</td>
//                     <td style={{ textAlign: "right", padding: "6px", fontSize: "11px" }}>
//                       {formatReadableAmount(sortedData[group]
//                         .reduce((sum, item) => sum + (parseFloat(item.purc_qty) || 0), 0)
//                         .toFixed(2))}
//                     </td>
//                     <td style={{ textAlign: "right", padding: "6px", fontSize: "11px" }}>
//                       {formatReadableAmount(sortedData[group]
//                         .reduce((sum, item) => sum + (parseFloat(item.purc_value) || 0), 0)
//                         .toFixed(2))}
//                     </td>
//                     <td style={{ textAlign: "right", padding: "6px", fontSize: "11px" }}>
//                       {formatReadableAmount(sortedData[group]
//                         .reduce((sum, item) => sum + (parseFloat(item.sale_qty) || 0), 0)
//                         .toFixed(2))}
//                     </td>
//                     <td style={{ textAlign: "right", padding: "6px", fontSize: "11px" }}>
//                       {formatReadableAmount(sortedData[group]
//                         .reduce((sum, item) => sum + (parseFloat(item.sale_val) || 0), 0)
//                         .toFixed(2))}
//                     </td>
//                     <td style={{ textAlign: "right", padding: "6px", fontSize: "11px" }}>-</td>
//                     <td style={{ textAlign: "right", padding: "6px", fontSize: "11px" }}>-</td>
//                     <td style={{ textAlign: "center", padding: "6px", fontSize: "11px" }}>-</td>
//                   </tr>
//                 </tfoot>
//               </table>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default StockBookReport;



























import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';
import { ScaleLoader } from 'react-spinners';
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import { FormaDateBalanceSheet } from '../../../Common/FormatFunctions/FormatDate';
import { ConvertNumberToWord } from '../../../Common/FormatFunctions/ConvertNumberToWord';
import PdfPreview from "../../../Common/PDFPreview";
import BackButton from "../../../Common/Buttons/BackButton";
import CommonPrintView from '../../../Common/ReportCommon/CommonPrintView';
import { generateReportPDF } from '../../../Common/ReportCommon/CommonPDFGenerator';
import HeaderJK from '../../../Assets/HeaderJK.png';
import FooterJK from '../../../Assets/FooterJK.png';

import '../../../Common/Fonts/Signika-Bold-normal';
import '../../../Common/Fonts/Signika-Regular-normal';

import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Typography, TableFooter, TableSortLabel,
} from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';

const API_URL = process.env.REACT_APP_API;

// ─── Column definitions ────────────────────────────────────────────────────────

const SCREEN_COLUMNS = [
  { label: 'Date', key: 'doc_date', width: '8%', center: true },
  { label: 'Item Name', key: 'item_name', width: '18%' },
  { label: 'Open Qty', key: 'op_qty', width: '8%', numeric: true },
  { label: 'Open Value', key: 'op_value', width: '9%', numeric: true },
  { label: 'Purchase Qty', key: 'purc_qty', width: '8%', numeric: true },
  { label: 'Purchase Value', key: 'purc_value', width: '9%', numeric: true },
  { label: 'Sale Qty', key: 'sale_qty', width: '8%', numeric: true },
  { label: 'Sale Value', key: 'sale_val', width: '9%', numeric: true },
  { label: 'Close Qty', key: 'close_qty', width: '8%', numeric: true },
  { label: 'Close Value', key: 'close_val', width: '9%', numeric: true },
  { label: 'Day Diff', key: 'day_diff', width: '6%', numeric: true },
];

const PRINT_COLUMNS = [
  { label: 'Date', key: 'doc_date', printWidth: '20mm', center: true },
  { label: 'Item Name', key: 'item_name', printWidth: '32mm' },
  { label: 'Open Qty', key: 'op_qty', printWidth: '18mm', numeric: true },
  { label: 'Open Value', key: 'op_value', printWidth: '20mm', numeric: true },
  { label: 'Purchase Qty', key: 'purc_qty', printWidth: '18mm', numeric: true },
  { label: 'Purchase Value', key: 'purc_value', printWidth: '20mm', numeric: true },
  { label: 'Sale Qty', key: 'sale_qty', printWidth: '18mm', numeric: true },
  { label: 'Sale Value', key: 'sale_val', printWidth: '20mm', numeric: true },
  { label: 'Close Qty', key: 'close_qty', printWidth: '18mm', numeric: true },
  { label: 'Close Value', key: 'close_val', printWidth: '20mm', numeric: true },
  { label: 'Day Diff', key: 'day_diff', printWidth: '16mm', numeric: true },
];

const PRINT_NUMERIC_COLS = PRINT_COLUMNS
  .map((c, i) => (c.numeric ? i : null))
  .filter(i => i !== null);

const PRINT_CENTER_COLS = PRINT_COLUMNS
  .map((c, i) => (c.center ? i : null))
  .filter(i => i !== null);

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return [
    String(d.getDate()).padStart(2, '0'),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getFullYear()),
  ].join('/');
};

const num = (v) => parseFloat(v) || 0;

// ─── Component ─────────────────────────────────────────────────────────────────

const StockBookReport = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const companyCode = sessionStorage.getItem('Company_Code');
  const Year_Code = sessionStorage.getItem('Year_Code');
  const companyName = sessionStorage.getItem('Company_Name');
  const companyGST = sessionStorage.getItem('Company_GSTNO');

  const searchParams = new URLSearchParams(location.search);
  const itemCode = searchParams.get('itemCode');
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfPreview, setPdfPreview] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(
          `${API_URL}/report-stock-book?fromDate=${fromDate}&company_code=${companyCode}&Item_Code=${itemCode}&ToDate=${toDate}&Year_Code=${Year_Code}`
        );
        const json = await res.json();

        // Filter by date range and flatten with computed day_diff
        const filtered = (json.data || [])
          .filter((item) => {
            const d = new Date(item.doc_date);
            return d >= new Date(fromDate) && d <= new Date(toDate);
          })
          .map((item) => ({
            ...item,
            day_diff: num(item.purc_qty) - num(item.sale_qty),
          }));

        setReportData(filtered);
      } catch (err) {
        console.error(err);
        setError('Error fetching stock book report');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [fromDate, toDate, companyCode, Year_Code, itemCode]);

  // ── Sorting ────────────────────────────────────────────────────────────────
  const requestSort = (key) =>
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));

  const sortedData = useMemo(() => {
    const items = [...reportData];
    if (sortConfig.key) {
      items.sort((a, b) => {
        const va = a[sortConfig.key];
        const vb = b[sortConfig.key];
        const na = Number(va), nb = Number(vb);
        const compare = isNaN(na) || isNaN(nb)
          ? String(va).localeCompare(String(vb))
          : na - nb;
        return sortConfig.direction === 'asc' ? compare : -compare;
      });
    }
    return items;
  }, [reportData, sortConfig]);

  // ── Grand Totals ──────────────────────────────────────────────────────────
  const grandTotals = useMemo(() =>
    reportData.reduce((acc, item) => {
      acc.op_qty += num(item.op_qty);
      acc.op_value += num(item.op_value);
      acc.purc_qty += num(item.purc_qty);
      acc.purc_value += num(item.purc_value);
      acc.sale_qty += num(item.sale_qty);
      acc.sale_val += num(item.sale_val);
      acc.close_qty += num(item.close_qty);
      acc.close_val += num(item.close_val);
      return acc;
    }, { op_qty: 0, op_value: 0, purc_qty: 0, purc_value: 0, sale_qty: 0, sale_val: 0, close_qty: 0, close_val: 0 }),
    [reportData]
  );

  // ── Row renderers ─────────────────────────────────────────────────────────
  const renderScreenRow = (item) => [
    formatDate(item.doc_date),
    item.item_name,
    formatReadableAmount(num(item.op_qty).toFixed(2)),
    formatReadableAmount(num(item.op_value).toFixed(2)),
    formatReadableAmount(num(item.purc_qty).toFixed(2)),
    formatReadableAmount(num(item.purc_value).toFixed(2)),
    formatReadableAmount(num(item.sale_qty).toFixed(2)),
    formatReadableAmount(num(item.sale_val).toFixed(2)),
    formatReadableAmount(num(item.close_qty).toFixed(2)),
    formatReadableAmount(num(item.close_val).toFixed(2)),
    formatReadableAmount(num(item.day_diff).toFixed(2)),
  ];

  const renderPrintRow = (item) => [
    formatDate(item.doc_date),
    item.item_name,
    formatReadableAmount(num(item.op_qty).toFixed(2)),
    formatReadableAmount(num(item.op_value).toFixed(2)),
    formatReadableAmount(num(item.purc_qty).toFixed(2)),
    formatReadableAmount(num(item.purc_value).toFixed(2)),
    formatReadableAmount(num(item.sale_qty).toFixed(2)),
    formatReadableAmount(num(item.sale_val).toFixed(2)),
    formatReadableAmount(num(item.close_qty).toFixed(2)),
    formatReadableAmount(num(item.close_val).toFixed(2)),
    formatReadableAmount(num(item.day_diff).toFixed(2)),
  ];

  const printFooterValues = [
    '', 'GRAND TOTAL',
    formatReadableAmount(grandTotals.op_qty.toFixed(2)),
    formatReadableAmount(grandTotals.op_value.toFixed(2)),
    formatReadableAmount(grandTotals.purc_qty.toFixed(2)),
    formatReadableAmount(grandTotals.purc_value.toFixed(2)),
    formatReadableAmount(grandTotals.sale_qty.toFixed(2)),
    formatReadableAmount(grandTotals.sale_val.toFixed(2)),
    formatReadableAmount(grandTotals.close_qty.toFixed(2)),
    formatReadableAmount(grandTotals.close_val.toFixed(2)),
    '',
  ];

  const reportSubtitle = `${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`;

  // ── Excel Export ───────────────────────────────────────────────────────────
  const handleExportToExcel = () => {
    const headers = SCREEN_COLUMNS.map(c => c.label);

    const companyNameRow = [companyName?.toUpperCase()];
    const gstRow = [`GST No: ${companyGST}`];
    const periodRow = [`Period: ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`];
    const emptyRow = [];

    const tableData = sortedData.map((item) =>
      SCREEN_COLUMNS.map((col) => {
        if (col.numeric) return Number(item[col.key]) || 0;
        if (col.key === 'doc_date') return formatDate(item[col.key]);
        return item[col.key];
      })
    );

    const totalRow = [
      'GRAND TOTAL', '',
      grandTotals.op_qty,
      grandTotals.op_value,
      grandTotals.purc_qty,
      grandTotals.purc_value,
      grandTotals.sale_qty,
      grandTotals.sale_val,
      grandTotals.close_qty,
      grandTotals.close_val,
      '',
    ];

    const worksheetData = [companyNameRow, gstRow, periodRow, emptyRow, headers, ...tableData, totalRow];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
    ];

    // Column widths + right-align numeric columns for every data row
    ws['!cols'] = SCREEN_COLUMNS.map(c => ({ wch: c.numeric ? 16 : 22 }));

    const range = XLSX.utils.decode_range(ws['!ref']);
    const headerRowIndex = 4; // 0-based row index of the header row

    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[addr]) continue;

        const colDef = SCREEN_COLUMNS[C];
        if (!colDef) continue;

        if (!ws[addr].s) ws[addr].s = {};

        if (R >= headerRowIndex && colDef.numeric) {
          // Right-align amounts (including header for that column)
          ws[addr].s.alignment = { horizontal: 'right' };
        } else if (colDef.center) {
          ws[addr].s.alignment = { horizontal: 'center' };
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, 'StockBook');
    XLSX.writeFile(wb, `StockBook_${fromDate}_to_${toDate}.xlsx`);
  };

  // ── PDF (via generateReportPDF — same pattern as SaleRegister) ────────────
  const handleGeneratePDF = () => {
    generateReportPDF({
      title: 'Stock Book Report',
      subtitle: reportSubtitle,
      columns: PRINT_COLUMNS.map(c => c.label),
      columnWidths: [16, 16, 18, 20, 18, 20, 18, 20, 18, 20, 16],
      rows: sortedData.map(renderPrintRow),
      footerRow: printFooterValues,
      numericCols: PRINT_NUMERIC_COLS,
      centerCols: PRINT_CENTER_COLS,
      headerImgSrc: HeaderJK,
      footerImgSrc: FooterJK,
      onComplete: (url) => setPdfPreview(url),
    });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ marginTop: '-40px', padding: '20px' }}>

      {/* Print view (hidden on screen, shown @media print) */}
      <CommonPrintView
        title="Stock Book Report"
        subtitle={reportSubtitle}
        companyName={companyName}
        companyGST={companyGST}
        columns={PRINT_COLUMNS}
        rows={sortedData}
        rowRenderer={renderPrintRow}
        footerValues={printFooterValues}
        amountInWords={ConvertNumberToWord(grandTotals.close_val)}
        headerImg={HeaderJK}
        footerImg={FooterJK}
      />

      {/* Screen header */}
      <Typography variant="h5" align="center" style={{ fontWeight: 'bold', marginTop: '-50px' }}>
        {companyName}
      </Typography>
      <Typography variant="subtitle1" align="center">GSTN: {companyGST}</Typography>
      <Typography variant="h6" align="center">Stock Book Report</Typography>
      <Typography variant="subtitle2" align="center" color="textSecondary">
        {reportSubtitle}
      </Typography>

      {/* Action buttons */}
      <div className="my-2 no-print d-flex justify-content-end gap-1 align-items-center">
        <BackButton onClick={() => navigate('/stock-book')} />
        <button className="btn btn-danger" onClick={handleGeneratePDF}>
          Print
        </button>
        <button className="btn btn-success" onClick={handleExportToExcel}>
          Export Excel
        </button>
      </div>

      {pdfPreview && <PdfPreview pdfData={pdfPreview} label="StockdetailReport" />}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Screen table */}
      <TableContainer component={Paper} style={{ maxHeight: '700px', position: 'relative' }}>
        <Table size="small" style={{ borderCollapse: 'separate' }}>
          <TableHead>
            {/* ── Row 1: group labels (sticky at top: 0) ── */}
            <TableRow>
              {/* Date */}
              <TableCell rowSpan={2} align="center" style={{ fontWeight: 'bold', backgroundColor: '#494cf1', color: '#000000', whiteSpace: 'nowrap', verticalAlign: 'middle', borderRight: '1px solid #7779e8', position: 'sticky', top: 0, zIndex: 4 }}>
                <TableSortLabel active={sortConfig.key === 'doc_date'} direction={sortConfig.direction} onClick={() => requestSort('doc_date')} sx={{ '&.MuiTableSortLabel-root': { color: '#fff' }, '&.MuiTableSortLabel-root:hover': { color: '#cce0ff' }, '&.Mui-active': { color: '#fff' }, '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}>
                  Date
                </TableSortLabel>
              </TableCell>
              {/* Item Name */}
              <TableCell rowSpan={2} align="left" style={{ fontWeight: 'bold', backgroundColor: '#494cf1', color: '#000000', whiteSpace: 'nowrap', verticalAlign: 'middle', borderRight: '1px solid #7779e8', position: 'sticky', top: 0, zIndex: 4 }}>
                <TableSortLabel active={sortConfig.key === 'item_name'} direction={sortConfig.direction} onClick={() => requestSort('item_name')} sx={{ '&.MuiTableSortLabel-root': { color: '#fff' }, '&.MuiTableSortLabel-root:hover': { color: '#cce0ff' }, '&.Mui-active': { color: '#fff' }, '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}>
                  Item Name
                </TableSortLabel>
              </TableCell>
              {/* Opening group */}
              <TableCell colSpan={2} align="center" style={{ fontWeight: 'bold', backgroundColor: '#6ea3ee', color: '#000000', borderRight: '1px solid #7779e8', borderBottom: '1px solid #7779e8', position: 'sticky', top: 0, zIndex: 3 }}>
                Opening
              </TableCell>
              {/* Purchase group */}
              <TableCell colSpan={2} align="center" style={{ fontWeight: 'bold', backgroundColor: '#94ceac', color: '#000000', borderRight: '1px solid #7779e8', borderBottom: '1px solid #7779e8', position: 'sticky', top: 0, zIndex: 3 }}>
                Purchase
              </TableCell>
              {/* Sale group */}
              <TableCell colSpan={2} align="center" style={{ fontWeight: 'bold', backgroundColor: '#c26a60', color: '#000000', borderRight: '1px solid #7779e8', borderBottom: '1px solid #7779e8', position: 'sticky', top: 0, zIndex: 3 }}>
                Sale
              </TableCell>
              {/* Closing group */}
              <TableCell colSpan={2} align="center" style={{ fontWeight: 'bold', backgroundColor: '#e09859', color: '#000000', borderRight: '1px solid #7779e8', borderBottom: '1px solid #7779e8', position: 'sticky', top: 0, zIndex: 3 }}>
                Closing
              </TableCell>
              {/* Day Diff */}
              <TableCell rowSpan={2} align="right" style={{ fontWeight: 'bold', backgroundColor: '#494cf1', color: '#000000', whiteSpace: 'nowrap', verticalAlign: 'middle', position: 'sticky', top: 0, zIndex: 4 }}>
                <TableSortLabel active={sortConfig.key === 'day_diff'} direction={sortConfig.direction} onClick={() => requestSort('day_diff')} sx={{ '&.MuiTableSortLabel-root': { color: '#fff' }, '&.MuiTableSortLabel-root:hover': { color: '#cce0ff' }, '&.Mui-active': { color: '#fff' }, '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}>
                  Day Diff
                </TableSortLabel>
              </TableCell>
            </TableRow>

            {/* ── Row 2: Qty / Value sub-headers (sticky at top: 33px = row1 height) ── */}
            <TableRow>
              {[
                { key: 'op_qty', label: 'Quintal', bg: '#6ea3ee' },
                { key: 'op_value', label: 'Value', bg: '#6ea3ee', borderRight: true },
                { key: 'purc_qty', label: 'Quintal', bg: '#94ceac' },
                { key: 'purc_value', label: 'Value', bg: '#94ceac', borderRight: true },
                { key: 'sale_qty', label: 'Quintal', bg: '#c26a60' },
                { key: 'sale_val', label: 'Value', bg: '#c26a60', borderRight: true },
                { key: 'close_qty', label: 'Quintal', bg: '#e09859' },
                { key: 'close_val', label: 'Value', bg: '#e09859', borderRight: true },
              ].map(col => (
                <TableCell key={col.key} align="right"
                  style={{ fontWeight: 'bold', backgroundColor: col.bg, color: '#000000', whiteSpace: 'nowrap', borderRight: col.borderRight ? '1px solid #7779e8' : undefined, position: 'sticky', top: 33, zIndex: 3 }}
                >
                  <TableSortLabel active={sortConfig.key === col.key} direction={sortConfig.direction} onClick={() => requestSort(col.key)}
                    sx={{ '&.MuiTableSortLabel-root': { color: '#000000' }, '&.MuiTableSortLabel-root:hover': { color: '#ffffff' }, '&.Mui-active': { color: '#fff' }, '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}
                  >
                    {col.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {sortedData.map((item, index) => (
              <TableRow
                key={index}
                hover
                style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f5f8ff' }}
              >
                {renderScreenRow(item).map((cell, ci) => (
                  <TableCell
                    key={ci}
                    align={
                      SCREEN_COLUMNS[ci]?.numeric ? 'right'
                        : SCREEN_COLUMNS[ci]?.center ? 'center'
                          : 'left'
                    }
                    style={{ fontSize: '0.78rem', whiteSpace: ci === 0 ? 'nowrap' : 'normal' }}
                  >
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>

          <TableFooter style={{ position: 'sticky', bottom: 0, zIndex: 2 }}>
            <TableRow style={{ backgroundColor: '#ffffcc' }}>
              {/* Date */}
              <TableCell style={{ fontWeight: 'bold', fontSize: '0.78rem' }} />
              {/* Item Name */}
              <TableCell style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>GRAND TOTAL</TableCell>
              {/* Open Qty */}
              <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
                {formatReadableAmount(grandTotals.op_qty.toFixed(2))}
              </TableCell>
              {/* Open Value */}
              <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
                {formatReadableAmount(grandTotals.op_value.toFixed(2))}
              </TableCell>
              {/* Purchase Qty */}
              <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
                {formatReadableAmount(grandTotals.purc_qty.toFixed(2))}
              </TableCell>
              {/* Purchase Value */}
              <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
                {formatReadableAmount(grandTotals.purc_value.toFixed(2))}
              </TableCell>
              {/* Sale Qty */}
              <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
                {formatReadableAmount(grandTotals.sale_qty.toFixed(2))}
              </TableCell>
              {/* Sale Value */}
              <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
                {formatReadableAmount(grandTotals.sale_val.toFixed(2))}
              </TableCell>
              {/* Close Qty */}
              <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
                {formatReadableAmount(grandTotals.close_qty.toFixed(2))}
              </TableCell>
              {/* Close Value */}
              <TableCell align="right" style={{ fontWeight: 'bold', fontSize: '0.78rem' }}>
                {formatReadableAmount(grandTotals.close_val.toFixed(2))}
              </TableCell>
              {/* Day Diff */}
              <TableCell style={{ fontWeight: 'bold', fontSize: '0.78rem' }} />
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

export default StockBookReport;