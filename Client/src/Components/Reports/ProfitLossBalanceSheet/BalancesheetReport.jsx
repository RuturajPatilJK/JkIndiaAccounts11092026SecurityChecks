// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import "../../Reports/TrialBalance/TrialBalance.css";
// import * as XLSX from "xlsx";
// import "jspdf-autotable";
// import { useNavigate, useLocation } from "react-router-dom";
// import PdfPreview from "../../../Common/PDFPreview";
// import { jsPDF } from "jspdf";
// import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
// import { RingLoader } from 'react-spinners';
// import { Typography } from '@mui/material';
// import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate"
// import PrintButton from '../../../Common/Buttons/PrintPDF';

// const apikey = process.env.REACT_APP_API;

// const BalancesheetReport = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   // const { fromDate, toDate } = location.state || { fromDate: "", toDate: "" };
//   const searchParams = new URLSearchParams(location.search);
//   const fromDate = searchParams.get('fromDate');
//   const toDate = searchParams.get('toDate');

//   const companyCode = sessionStorage.getItem("Company_Code");
//   const Year_Code = sessionStorage.getItem("Year_Code");
//   const Company_Name = sessionStorage.getItem("Company_Name")
//   const Company_GSTNO = sessionStorage.getItem('Company_GSTNO')
//   const CompanyNameUpdatedDate = sessionStorage.getItem("CompanyNameUpdatedDate")
//   const newCompanyName = sessionStorage.getItem("newCompanyName")

//   const [reportData, setReportData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [emailId, setEmailId] = useState("");
//   const [pdfPreview, setPdfPreview] = useState([]);
//   const [groupedReportData, setGroupedReportData] = useState({});
//   const [groupedReportDataRightside, setGroupedReportDataRightside] = useState(
//     {}
//   );

//   const API_URL = `${apikey}/Balancesheet_Report`;

//   const docDate = new Date(fromDate);
//   const cnameUpdatedDate = new Date(CompanyNameUpdatedDate);

//   const displayCompanyName =
//     docDate < cnameUpdatedDate
//       ? newCompanyName
//       : Company_Name;

//   useEffect(() => {
//     const fetchReportData = async () => {
//       setLoading(true);
//       setError("");
//       try {
//         const response = await axios.get(API_URL, {
//           params: {
//             to_date: toDate,
//             Company_Code: companyCode,
//             Year_Code: Year_Code,
//           },
//         });
//         setReportData(response.data);
//       } catch (error) {
//         console.error("Error fetching report:", error);
//         setError("Error fetching report");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchReportData();
//   }, [API_URL]);

//   const handleExportToExcel = () => {
//     const wb = XLSX.utils.book_new();
//     const titleRow = [`${displayCompanyName} - Balance Sheet Report`];
//     const dateRow = [`As on ${toDate}`];
//     const headers = [["Liabilities (Group Code & Name)", "", "", "Amount", "Assets (Group Code & Name)", "", "", "Amount"]];

//     const ws_data = [titleRow, dateRow, [], ...headers];

//     const leftEntries = Object.entries(groupedReportData);
//     const rightEntries = Object.entries(groupedReportDataRightside);
//     const maxLen = Math.max(leftEntries.length, rightEntries.length);

//     for (let i = 0; i < maxLen; i++) {
//       const leftGroup = leftEntries[i] ? leftEntries[i][1] : undefined;
//       const rightGroup = rightEntries[i] ? rightEntries[i][1] : undefined;

//       ws_data.push([
//         leftGroup ? leftEntries[i][0] : "", // **Left Group Code & Name**
//         "",
//         "",
//         leftGroup ? Math.abs(parseFloat(leftGroup.totalBalance).toFixed(2)) : "",
//         rightGroup ? rightEntries[i][0] : "", // **Right Group Code & Name**
//         "",
//         "",
//         rightGroup ? Math.abs(parseFloat(rightGroup.totalBalance).toFixed(2)) : ""
//       ]);

//       const maxItems = Math.max(leftGroup ? leftGroup.items.length : 0, rightGroup ? rightGroup.items.length : 0);
//       for (let j = 0; j < maxItems; j++) {
//         const leftItem = leftGroup && leftGroup.items[j] ? leftGroup.items[j] : undefined;
//         const rightItem = rightGroup && rightGroup.items[j] ? rightGroup.items[j] : undefined;

//         ws_data.push([
//           leftItem ? `  ${leftItem.Ac_Code} - ${leftItem.Ac_Name_E.toUpperCase()}` : "",
//           "",
//           leftItem
//             ? (leftItem.BalanceDrCr === "D"
//               ? -Math.abs(Number(parseFloat(leftItem.Balance).toFixed(2)))
//               : Math.abs(Number(parseFloat(leftItem.Balance).toFixed(2))))
//             : ""
//           ,
//           "",
//           rightItem ? `  ${rightItem.Ac_Code} - ${rightItem.Ac_Name_E.toUpperCase()}` : "",
//           "",
//           rightItem
//             ? (rightItem.BalanceDrCr === "C"
//               ? -Math.abs(Number(parseFloat(rightItem.Balance).toFixed(2)))
//               : Math.abs(Number(parseFloat(rightItem.Balance).toFixed(2))))
//             : ""

//         ]);
//       }
//     }

//     ws_data.push(["", "", "", "", "", "", ""]);

//     ws_data.push([
//       "Total Liabilities", "", "", Math.abs(parseFloat(totalLeftSide).toFixed(2)),
//       "Total Assets", "", "", Math.abs(parseFloat(totalRightSide).toFixed(2))
//     ]);

//     ws_data.push([
//       "Net Profit", "", "", Math.abs(parseFloat(netProfit).toFixed(2)),
//       "", "", "", ""
//     ]);

//     const ws = XLSX.utils.aoa_to_sheet(ws_data);
//     ws['!cols'] = [
//       { wch: 50 }, { wch: 5 }, { wch: 5 }, { wch: 20 },
//       { wch: 50 }, { wch: 5 }, { wch: 5 }, { wch: 20 }
//     ];

//     XLSX.utils.book_append_sheet(wb, ws, "BalanceSheet Reports");
//     XLSX.writeFile(wb, "BalanceSheetReport.xlsx");
//   };

//   // const handleRowClick = (acCode, acname) => {
//   //   setLoading(true);
//   //   setTimeout(() => {
//   //     const url = `/getAllledger-report?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&acCode=${encodeURIComponent(acCode)}`;
//   //     window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
//   //     setLoading(false);
//   //   }, 500);
//   // };

//   const handleRowClick = (acCode, acname) => {
//     setLoading(true);
//     setTimeout(() => {
//       const url = `/ledger-report?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&acCode=${encodeURIComponent(acCode)}&acname=${encodeURIComponent(acname)}`;
//       window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
//       setLoading(false);
//     }, 500);
//   };

//   const handleGroupClick = (groupKey) => {
//     if (!groupKey) return;

//     const parts = groupKey.split(" - ");
//     const groupCode = parseInt(parts[0], 10);

//     setLoading(true);

//     setTimeout(() => {
//       const url = `/TrialBalance-reports?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&groupType=${encodeURIComponent(groupCode)}`;
//       window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
//       setLoading(false);
//     }, 500);
//   };

//   useEffect(() => {
//     if (reportData.length > 0) {
//       const { groupedDataleft, groupedReportDataRightside } =
//         convertData(reportData);
//       setGroupedReportData(groupedDataleft);
//       setGroupedReportDataRightside(groupedReportDataRightside);
//     }
//   }, [reportData]);

//   const convertData = (data) => {
//     const groupedDataleft = {};
//     const groupedReportDataRightside = {};

//     let groupTotals = {};

//     data.forEach((item) => {
//       const balance = parseFloat(item.Balance) || 0;
//       const groupKey = `${item.Group_Code} - ${item.groupname}`;

//       if (!groupTotals[groupKey]) {
//         groupTotals[groupKey] = 0;
//       }
//       groupTotals[groupKey] += balance;
//     });

//     data.forEach((item) => {
//       const balance = parseFloat(item.Balance) || 0;
//       const groupKey = `${item.Group_Code} - ${item.groupname}`;
//       const totalBalance = groupTotals[groupKey];

//       if (totalBalance === 0) return;

//       let target =
//         totalBalance < 0 ? groupedDataleft : groupedReportDataRightside;

//       if (!target[groupKey]) {
//         target[groupKey] = {
//           groupname: item.groupname,
//           items: [],
//           totalBalance: totalBalance,
//           showOnlyTotal: false,
//         };
//       }

//       if (item.summary === "Y") {
//         target[groupKey].showOnlyTotal = true;
//       } else {
//         target[groupKey].items.push({
//           Ac_Code: item.AC_CODE,
//           Ac_Name_E: item.Ac_Name_E,
//           Balance: balance.toFixed(2),
//           BalanceDrCr: item.BalanceDrCr
//         });
//       }
//     });

//     return { groupedDataleft, groupedReportDataRightside };
//   };

//   const totalDebit = Object.values(groupedReportDataRightside)
//     .reduce((acc, { totalBalance }) => acc + Math.abs(totalBalance), 0)
//     .toFixed(2);

//   const totalFromGroupedData = Object.values(groupedReportData)
//     .reduce((acc, { totalBalance }) => acc + Math.abs(totalBalance), 0);

//   const totalFromRightsideData = Object.values(groupedReportDataRightside)
//     .reduce((acc, { totalBalance }) => acc + Math.abs(totalBalance), 0);

//   const difference = totalFromRightsideData - totalFromGroupedData;

//   const totalCredit = totalFromGroupedData + Math.abs(difference);

//   const formattedTotalCredit = totalCredit.toFixed(2);

//   const totalCreditRightSide = Object.values(groupedReportDataRightside)
//     .reduce(
//       (acc, { totalBalance }) => acc + Math.abs(totalBalance),
//       0
//     )
//     .toFixed(2)

//   const netProfit = Math.abs(
//     Object.values(groupedReportDataRightside).reduce(
//       (acc, { totalBalance }) => acc + Math.abs(totalBalance),
//       0
//     ) -
//     Object.values(groupedReportData).reduce(
//       (acc, { totalBalance }) => acc + Math.abs(totalBalance),
//       0
//     )
//   ).toFixed(2)

//   const totalRightSide = Object.values(groupedReportDataRightside)
//     .reduce(
//       (acc, { totalBalance }) => acc + Math.abs(totalBalance),
//       0
//     )
//     .toFixed(2)

//   const totalLeftSide = Object.values(groupedReportData)
//     .reduce(
//       (acc, { totalBalance }) => acc + Math.abs(totalBalance),
//       0
//     )
//     .toFixed(2)


//   const renderPdf = (outputType = "blob") => {
//     const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

//     const pageWidth = doc.internal.pageSize.width;
//     const pageHeight = doc.internal.pageSize.height;
//     const margin = 40;
//     const centerX = pageWidth / 2;

//     const fontSize = 9;
//     const lineHeight = 14;
//     const labelWidth = 140;

//     const leftTextX = margin + 10;
//     const leftAmtX = centerX - 40;

//     const rightTextX = centerX + 30;
//     const rightAmtX = pageWidth - margin;

//     let leftY = 0;
//     let rightY = 0;

//     const drawDivider = (endY = Math.max(leftY, rightY)) => {
//       const startY = 76;
//       doc.setLineWidth(0.5);
//       doc.line(centerX, startY, centerX, endY + 3);
//     };

//     const drawHeaders = () => {
//       let y = 36;
//       doc.setFontSize(10);
//       doc.setFont("Arial", "bold");
//       doc.text(displayCompanyName.trim(), centerX, y, { align: "center" });

//       y += 12;
//       doc.setFontSize(8);
//       doc.setFont("Arial", "normal");
//       const gstnText = `GSTN : ${Company_GSTNO}`;
//       doc.text(gstnText, centerX, y, { align: "center" });

//       const textWidth = doc.getTextWidth(gstnText);
//       const underlineStartX = centerX - textWidth / 2;
//       const underlineY = y + 1.5;

//       doc.setLineWidth(0.3);
//       doc.line(underlineStartX, underlineY, underlineStartX + textWidth, underlineY);

//       y += 12;
//       doc.setFont("Arial", "bold");
//       doc.text("Balance Sheet", centerX, y, { align: "center" });

//       y += 10;
//       doc.setFontSize(8);
//       doc.setFont("Arial", "normal");
//       doc.text(
//         `From ${fromDate.split("-").reverse().join("-")} to ${toDate
//           .split("-")
//           .reverse()
//           .join("-")}`,
//         centerX,
//         y,
//         { align: "center" }
//       );

//       y += 14;
//       doc.setLineWidth(0.5);
//       doc.line(margin - 10, y - 8, pageWidth - margin + 20, y - 8);

//       doc.setFontSize(fontSize + 1);
//       doc.setFont("Arial", "bold");
//       doc.text("Liabilities", margin, y);
//       doc.text("Amount", leftAmtX, y, { align: "right" });
//       doc.text("Assets", centerX + 20, y);
//       doc.text("Amount", rightAmtX, y, { align: "right" });

//       doc.line(margin - 10, y + 5, pageWidth - margin + 20, y + 5);

//       leftY = rightY = y + 10;
//       drawDivider();
//     };

//     const checkPageBreak = () => {
//       if (leftY > pageHeight - 60 || rightY > pageHeight - 60) {
//         doc.addPage();
//         leftY = rightY = 60;
//         drawDivider();
//       }
//     };

//     drawHeaders();
//     doc.setFontSize(fontSize);

//     const leftEntries = Object.entries(groupedReportData);
//     const rightEntries = Object.entries(groupedReportDataRightside);
//     const maxLen = Math.max(leftEntries.length, rightEntries.length);

//     for (let i = 0; i < maxLen; i++) {
//       const left = leftEntries[i];
//       const right = rightEntries[i];

//       const leftHasItems = left && left[1].items.length > 0;
//       const rightHasItems = right && right[1].items.length > 0;
//       if (!leftHasItems && !rightHasItems) continue;

//       // LEFT SIDE
//       if (leftHasItems) {
//         const [, group] = left;
//         doc.setFont("Arial", "bold");
//         doc.text(group.groupname.trim().toUpperCase(), margin - 10, leftY + 10);
//         doc.text(
//           formatReadableAmount(Math.abs(group.totalBalance)),
//           leftAmtX + 35,
//           leftY + 10,
//           { align: "right" }
//         );
//         leftY += lineHeight;

//         doc.setFont("Arial", "italic");

//         let lastItemBottomY = leftY;
//         for (let j = 0; j < group.items.length; j++) {
//           checkPageBreak();
//           const item = group.items[j];
//           const lines = doc.splitTextToSize(item.Ac_Name_E.trim().toUpperCase(), labelWidth);
//           doc.text(lines, leftTextX - 10, leftY + 10);
//           doc.text(
//             item.BalanceDrCr === "D"
//               ? `-${formatReadableAmount(Math.abs(item.Balance))}`
//               : formatReadableAmount(Math.abs(item.Balance)),
//             leftAmtX - 5,
//             leftY + 10,
//             { align: "right" }
//           );

//           if (j === group.items.length - 1) {
//             lastItemBottomY = leftY + (lineHeight * (lines.length));
//           }

//           leftY += lineHeight * lines.length;
//         }

//         doc.setLineWidth(0.5);
//         doc.line(leftAmtX - 50, lastItemBottomY, leftAmtX, lastItemBottomY);
//         leftY += 6;
//       }

//       // RIGHT SIDE
//       if (rightHasItems) {
//         const [, group] = right;
//         doc.setFont("Arial", "bold");
//         doc.text(group.groupname.trim().toUpperCase(), centerX + 2, rightY + 10);
//         doc.text(
//           formatReadableAmount(Math.abs(group.totalBalance)),
//           rightAmtX + 25,
//           rightY + 10,
//           { align: "right" }
//         );
//         rightY += lineHeight;

//         doc.setFont("Arial", "italic");

//         let lastItemBottomY = rightY;
//         for (let j = 0; j < group.items.length; j++) {
//           checkPageBreak();
//           const item = group.items[j];
//           const lines = doc.splitTextToSize(item.Ac_Name_E.trim().toUpperCase(), labelWidth);
//           doc.text(lines, rightTextX - 25, rightY + 10);
//           doc.text(item.BalanceDrCr === "C"
//             ? `-${formatReadableAmount(Math.abs(item.Balance))}`
//             : formatReadableAmount(Math.abs(item.Balance)), rightAmtX - 20, rightY + 10, {
//             align: "right",
//           });

//           if (j === group.items.length - 1) {
//             lastItemBottomY = rightY + (lineHeight * (lines.length));
//           }

//           rightY += lineHeight * lines.length;
//         }

//         doc.setLineWidth(0.5);
//         doc.line(rightAmtX - 50, lastItemBottomY, rightAmtX, lastItemBottomY);
//         rightY += 6;
//       }

//       drawDivider();
//     }

//     const finalY = Math.max(leftY, rightY) + 10;
//     doc.setFont("Arial", "bold");
//     doc.setLineWidth(0.75);
//     doc.line(margin, finalY - 10, pageWidth - margin, finalY - 10);

//     doc.text("Total Liabilities", margin, finalY);
//     doc.text(formatReadableAmount(totalLeftSide), leftAmtX + 38, finalY, { align: "right" });

//     doc.line(margin, finalY + 4, pageWidth - margin, finalY + 4);

//     doc.text("Total Assets", centerX, finalY + lineHeight);
//     doc.text(formatReadableAmount(totalRightSide), rightAmtX + 32, finalY + lineHeight, {
//       align: "right",
//     });

//     doc.line(margin, finalY + lineHeight + 4, pageWidth - margin, finalY + lineHeight + 4);

//     doc.text("Net Profit", margin, finalY + lineHeight);
//     doc.text(formatReadableAmount(netProfit), leftAmtX + 38, finalY + lineHeight, {
//       align: "right",
//     });

//     doc.text("Total Credit", margin, finalY + lineHeight * 2);
//     doc.text(formatReadableAmount(formattedTotalCredit), leftAmtX + 38, finalY + lineHeight * 2, {
//       align: "right",
//     });

//     doc.line(margin, finalY + lineHeight * 2 + 6, pageWidth - margin, finalY + lineHeight * 2 + 6);

//     drawDivider(finalY + lineHeight * 2 + 6);

//     if (outputType === "blob") {
//       const pdfBlob = doc.output("blob");
//       const url = URL.createObjectURL(pdfBlob);
//       setPdfPreview(url);
//     } else if (outputType === "print") {
//       const dataUri = doc.output("datauristring");
//       const printWindow = window.open();
//       if (printWindow) {
//         printWindow.document.write(`<iframe width='100%' height='100%' src='${dataUri}' frameborder='0'></iframe>`);
//         printWindow.document.close();
//       }
//     }
//   };

//   const generatePdf = () => renderPdf("blob");
//   const handlePrint = () => renderPdf("print");

//   return (
//     <div style={{ marginTop: "-90px" }}>
//       <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold" }}>{displayCompanyName}</Typography>
//       <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", textDecoration: 'underline', fontWeight: "550" }}>GSTN : {Company_GSTNO}</Typography>
//       <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>Balance Sheet</Typography>
//       <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px" }}>{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>

//       <div className="d-flex justify-content-end" style={{ marginTop: "-60px" }}>
//         <PrintButton disabledFeild={""} fetchData={handlePrint} />
//         <button className="btn btn-success" onClick={handleExportToExcel}>
//           Export to Excel
//         </button>
//         <button onClick={generatePdf} className="btn btn-secondary">
//           PDF
//         </button>
//       </div>

//       <div className="table-responsive">
//         <table
//           className="table table-striped table-bordered mt-4"
//           id="reportTable"
//           style={{ marginBottom: "50px", backgroundColor: "#D0E9C6", }}
//         >
//           <thead className="table-light">
//             <tr>
//               <th colSpan={2} style={{ textAlign: "left", backgroundColor: "#D0E9C6" }}>
//                 Liabilities
//               </th>
//               <th colSpan={2} style={{ textAlign: "right", backgroundColor: "#D0E9C6" }}>
//                 Amount
//               </th>
//               <th colSpan={2} style={{ textAlign: "left", backgroundColor: "#D0E9C6" }}>
//                 Assets
//               </th>
//               <th colSpan={2} style={{ textAlign: "right", backgroundColor: "#D0E9C6" }}>
//                 Amount
//               </th>
//             </tr>
//           </thead>

//           <tbody>
//             <tr>
//               <td
//                 align="left"
//                 colSpan={4}
//                 style={{ verticalAlign: "top", width: "50%", backgroundColor: "#D0E9C6", }}
//               >
//                 <table style={{ width: "100%", backgroundColor: "#D0E9C6", }}>
//                   {Object.entries(groupedReportData).map(
//                     ([key, { items, totalBalance, showOnlyTotal }]) => (
//                       <React.Fragment key={key}>
//                         <tr className="table-primary" onClick={() => handleGroupClick(key)}>
//                           <td
//                             colSpan={2}
//                             style={{ color: "black", fontWeight: "bold", fontFamily: "Arial" }}
//                           >
//                             {key.toUpperCase()}
//                           </td>
//                           <td
//                             align="right"
//                             style={{ color: "black", fontWeight: "bold", fontFamily: "Arial" }}
//                           >
//                             {formatReadableAmount(Math.abs(totalBalance.toFixed(2)))}
//                           </td>
//                         </tr>
//                         {!showOnlyTotal &&
//                           items.map((item, index) => {
//                             const isLast = index === items.length - 1;
//                             return (
//                               <tr key={item.Ac_Code}>
//                                 <td onClick={() => handleRowClick(item.Ac_Code, item.Ac_Name_E)} style={{ cursor: "pointer", fontStyle: "italic" }}>{item.Ac_Code}</td>
//                                 <td style={{ cursor: "pointer", fontStyle: "italic" }}>{item.Ac_Name_E}</td>
//                                 <td
//                                   align="right"
//                                   style={{
//                                     paddingRight: "80px",
//                                     textAlign: "right",
//                                   }}
//                                 >
//                                   <span
//                                     style={{
//                                       display: "inline-block",
//                                       fontStyle: "italic",
//                                       fontWeight: 450,
//                                       marginRight: 120,
//                                       borderBottom: isLast ? "2px solid black" : "none",
//                                       paddingBottom: "2px",
//                                       marginTop: "2px",
//                                     }}
//                                   >
//                                     {item.BalanceDrCr === 'D'
//                                       ? `-${formatReadableAmount(Math.abs(item.Balance))}`
//                                       : formatReadableAmount(Math.abs(item.Balance))}

//                                   </span>
//                                 </td>
//                               </tr>
//                             );
//                           })}
//                       </React.Fragment>
//                     )
//                   )}
//                 </table>
//               </td>
//               <td
//                 align="center"
//                 colSpan={4}
//                 style={{ verticalAlign: "top", width: "50%", backgroundColor: "#D0E9C6", }}
//               >
//                 <table style={{ width: "100%", backgroundColor: "#D0E9C6" }}>
//                   {Object.entries(groupedReportDataRightside).map(
//                     ([key, { items, totalBalance, showOnlyTotal }]) => (
//                       <React.Fragment key={key}>
//                         <tr className="table-primary" onClick={() => handleGroupClick(key)}>
//                           <td
//                             colSpan={2}
//                             style={{ color: "black", fontWeight: "bold", fontFamily: "Arial" }}
//                           >
//                             {key.toUpperCase()}
//                           </td>
//                           <td
//                             align="right"
//                             style={{ color: "black", fontWeight: "bold", fontFamily: "Arial" }}
//                           >
//                             {formatReadableAmount(Math.abs(totalBalance.toFixed(2)))}
//                           </td>
//                         </tr>
//                         {!showOnlyTotal &&
//                           items.map((item, index) => {
//                             const isLast = index === items.length - 1;
//                             return (
//                               <tr key={item.Ac_Code}>
//                                 <td
//                                   onClick={() => handleRowClick(item.Ac_Code, item.Ac_Name_E)}
//                                   style={{ cursor: "pointer", fontStyle: "italic" }}
//                                 >
//                                   {item.Ac_Code}
//                                 </td>
//                                 <td style={{ cursor: "pointer", fontStyle: "italic" }}>
//                                   {item.Ac_Name_E}
//                                 </td>
//                                 <td
//                                   align="right"
//                                   style={{
//                                     paddingRight: "160px",
//                                     paddingLeft: "20px",
//                                   }}
//                                 >
//                                   <span
//                                     style={{
//                                       display: "inline-block",
//                                       fontStyle: "italic",
//                                       fontWeight: 450,
//                                       marginRight: 30,
//                                       borderBottom: isLast ? "2px solid black" : "none",
//                                       paddingBottom: "2px",
//                                       marginTop: "2px",
//                                     }}
//                                   >
//                                     {item.BalanceDrCr === 'C'
//                                       ? `-${formatReadableAmount(Math.abs(item.Balance))}`
//                                       : formatReadableAmount(Math.abs(item.Balance))}

//                                   </span>
//                                 </td>
//                               </tr>
//                             );
//                           })}
//                       </React.Fragment>
//                     )
//                   )}
//                 </table>
//               </td>
//             </tr>
//             <tr >
//               <td
//                 colSpan={3}
//                 className="fw-bold text-end"
//                 style={{ color: "black", backgroundColor: "#D0E9C6" }}
//               >
//                 Total
//               </td>
//               <td align="right" className="fw-bold" style={{ backgroundColor: "#D0E9C6", }}>
//                 {formatReadableAmount(totalLeftSide)}
//               </td>

//               <td
//                 colSpan={3}
//                 className="fw-bold text-end"
//                 style={{ backgroundColor: "#D0E9C6" }}
//               >
//                 Total
//               </td>
//               <td align="right" className="fw-bold" style={{ backgroundColor: "#D0E9C6", }}>
//                 {formatReadableAmount(totalRightSide)}
//               </td>
//             </tr>

//             <tr>
//               <td
//                 colSpan={3}
//                 className="fw-bold text-end"
//                 style={{ backgroundColor: "#D0E9C6", }}
//               >
//                 Net Profit
//               </td>
//               <td align="right" className="fw-bold" style={{ backgroundColor: "#D0E9C6", }}>
//                 {formatReadableAmount(netProfit)}
//               </td>

//               <td
//                 colSpan={3}
//                 className="fw-bold text-end"
//                 style={{ backgroundColor: "#D0E9C6", }}
//               >
//               </td>
//               <td align="right" className="fw-bold" style={{ backgroundColor: "#D0E9C6", }}>
//                 {/* {formatReadableAmount(totalCreditRightSide)} */}
//               </td>
//             </tr>

//             <tr>
//               <td
//                 colSpan={3}
//                 className="fw-bold text-end"
//                 style={{ backgroundColor: "#D0E9C6", }}
//               >
//                 Total Credit
//               </td>
//               <td align="right" className="fw-bold" style={{ backgroundColor: "#D0E9C6", }}>
//                 {formatReadableAmount(formattedTotalCredit)}
//               </td>

//               <td
//                 colSpan={3}
//                 className="fw-bold text-end"
//                 style={{ backgroundColor: "#D0E9C6", }}
//               >
//                 Total Debit
//               </td>
//               <td align="right" className="fw-bold" style={{ backgroundColor: "#D0E9C6", }}>
//                 {formatReadableAmount(totalDebit)}
//               </td>
//             </tr>
//           </tbody>
//         </table>

//         <div className="centered-container">
//           {pdfPreview && pdfPreview.length > 0 && (
//             <PdfPreview
//               pdfData={pdfPreview}
//               apiData={reportData}
//               label={"BalanceSheet"}
//             />
//           )}
//         </div>
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

// export default BalancesheetReport;
























// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import "../../Reports/TrialBalance/TrialBalance.css";
// import * as XLSX from "xlsx";
// import "jspdf-autotable";
// import { useNavigate, useLocation } from "react-router-dom";
// import PdfPreview from "../../../Common/PDFPreview";
// import { jsPDF } from "jspdf";
// import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
// import { RingLoader } from 'react-spinners';
// import { Typography } from '@mui/material';
// import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate";
// import PrintButton from '../../../Common/Buttons/PrintPDF';

// const apikey = process.env.REACT_APP_API;

// const BalancesheetReport = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const searchParams = new URLSearchParams(location.search);
//   const fromDate = searchParams.get('fromDate');
//   const toDate = searchParams.get('toDate');

//   const companyCode = sessionStorage.getItem("Company_Code");
//   const Year_Code = sessionStorage.getItem("Year_Code");
//   const Company_Name = sessionStorage.getItem("Company_Name");
//   const Company_GSTNO = sessionStorage.getItem('Company_GSTNO');
//   const CompanyNameUpdatedDate = sessionStorage.getItem("CompanyNameUpdatedDate");
//   const newCompanyName = sessionStorage.getItem("newCompanyName");

//   const [reportData, setReportData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [pdfPreview, setPdfPreview] = useState([]);
//   const [groupedReportData, setGroupedReportData] = useState({});
//   const [groupedReportDataRightside, setGroupedReportDataRightside] = useState({});

//   const API_URL = `${apikey}/Balancesheet_Report`;

//   const docDate = new Date(fromDate);
//   const cnameUpdatedDate = new Date(CompanyNameUpdatedDate);
//   const displayCompanyName = docDate < cnameUpdatedDate ? newCompanyName : Company_Name;

//   useEffect(() => {
//     const fetchReportData = async () => {
//       setLoading(true);
//       setError("");
//       try {
//         const response = await axios.get(API_URL, {
//           params: { to_date: toDate, Company_Code: companyCode, Year_Code: Year_Code },
//         });
//         setReportData(response.data);
//       } catch (error) {
//         console.error("Error fetching report:", error);
//         setError("Error fetching report");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchReportData();
//   }, [API_URL]);

//   const handleExportToExcel = () => {
//     const wb = XLSX.utils.book_new();
//     const ws_data = [
//       [`${displayCompanyName} - Balance Sheet Report`],
//       [`As on ${toDate}`],
//       [],
//       ["Liabilities (Group Code & Name)", "", "", "Amount", "Assets (Group Code & Name)", "", "", "Amount"],
//     ];
//     const leftEntries = Object.entries(groupedReportData);
//     const rightEntries = Object.entries(groupedReportDataRightside);
//     const maxLen = Math.max(leftEntries.length, rightEntries.length);
//     for (let i = 0; i < maxLen; i++) {
//       const lg = leftEntries[i] ? leftEntries[i][1] : undefined;
//       const rg = rightEntries[i] ? rightEntries[i][1] : undefined;
//       ws_data.push([
//         lg ? leftEntries[i][0] : "", "", "",
//         lg ? Math.abs(parseFloat(lg.totalBalance).toFixed(2)) : "",
//         rg ? rightEntries[i][0] : "", "", "",
//         rg ? Math.abs(parseFloat(rg.totalBalance).toFixed(2)) : ""
//       ]);
//       const maxItems = Math.max(lg ? lg.items.length : 0, rg ? rg.items.length : 0);
//       for (let j = 0; j < maxItems; j++) {
//         const li = lg && lg.items[j];
//         const ri = rg && rg.items[j];
//         ws_data.push([
//           li ? `  ${li.Ac_Code} - ${li.Ac_Name_E.toUpperCase()}` : "", "",
//           li ? (li.BalanceDrCr === "D" ? -Math.abs(+parseFloat(li.Balance).toFixed(2)) : Math.abs(+parseFloat(li.Balance).toFixed(2))) : "",
//           "",
//           ri ? `  ${ri.Ac_Code} - ${ri.Ac_Name_E.toUpperCase()}` : "", "",
//           ri ? (ri.BalanceDrCr === "C" ? -Math.abs(+parseFloat(ri.Balance).toFixed(2)) : Math.abs(+parseFloat(ri.Balance).toFixed(2))) : ""
//         ]);
//       }
//     }
//     ws_data.push(["", "", "", "", "", "", ""]);
//     ws_data.push(["Total Liabilities", "", "", Math.abs(parseFloat(totalLeftSide).toFixed(2)), "Total Assets", "", "", Math.abs(parseFloat(totalRightSide).toFixed(2))]);
//     ws_data.push(["Net Profit", "", "", Math.abs(parseFloat(netProfit).toFixed(2)), "", "", "", ""]);
//     const ws = XLSX.utils.aoa_to_sheet(ws_data);
//     ws['!cols'] = [{ wch: 50 }, { wch: 5 }, { wch: 5 }, { wch: 20 }, { wch: 50 }, { wch: 5 }, { wch: 5 }, { wch: 20 }];
//     XLSX.utils.book_append_sheet(wb, ws, "BalanceSheet Reports");
//     XLSX.writeFile(wb, "BalanceSheetReport.xlsx");
//   };

//   const handleRowClick = (acCode, acname) => {
//     setLoading(true);
//     setTimeout(() => {
//       const url = `/ledger-report?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&acCode=${encodeURIComponent(acCode)}&acname=${encodeURIComponent(acname)}`;
//       window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
//       setLoading(false);
//     }, 500);
//   };

//   const handleGroupClick = (groupKey) => {
//     if (!groupKey) return;
//     const groupCode = parseInt(groupKey.split(" - ")[0], 10);
//     setLoading(true);
//     setTimeout(() => {
//       const url = `/TrialBalance-reports?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&groupType=${encodeURIComponent(groupCode)}`;
//       window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
//       setLoading(false);
//     }, 500);
//   };

//   useEffect(() => {
//     if (reportData.length > 0) {
//       const { groupedDataleft, groupedReportDataRightside } = convertData(reportData);
//       setGroupedReportData(groupedDataleft);
//       setGroupedReportDataRightside(groupedReportDataRightside);
//     }
//   }, [reportData]);

//   const convertData = (data) => {
//     const groupedDataleft = {};
//     const groupedReportDataRightside = {};
//     const groupTotals = {};
//     data.forEach((item) => {
//       const balance = parseFloat(item.Balance) || 0;
//       const key = `${item.Group_Code} - ${item.groupname}`;
//       if (!groupTotals[key]) groupTotals[key] = 0;
//       groupTotals[key] += balance;
//     });
//     data.forEach((item) => {
//       const balance = parseFloat(item.Balance) || 0;
//       const key = `${item.Group_Code} - ${item.groupname}`;
//       const totalBalance = groupTotals[key];
//       if (totalBalance === 0) return;
//       const target = totalBalance < 0 ? groupedDataleft : groupedReportDataRightside;
//       if (!target[key]) target[key] = { groupname: item.groupname, items: [], totalBalance, showOnlyTotal: false };
//       if (item.summary === "Y") {
//         target[key].showOnlyTotal = true;
//       } else {
//         target[key].items.push({ Ac_Code: item.AC_CODE, Ac_Name_E: item.Ac_Name_E, Balance: balance.toFixed(2), BalanceDrCr: item.BalanceDrCr });
//       }
//     });

//     // Sort groups for consistent ordering
//     const sortGroups = (groups) => {
//       const sorted = {};
//       Object.keys(groups).sort((a, b) => {
//         const codeA = parseInt(a.split(" - ")[0]);
//         const codeB = parseInt(b.split(" - ")[0]);
//         return codeA - codeB;
//       }).forEach(key => {
//         sorted[key] = groups[key];
//       });
//       return sorted;
//     };

//     return { 
//       groupedDataleft: sortGroups(groupedDataleft), 
//       groupedReportDataRightside: sortGroups(groupedReportDataRightside) 
//     };
//   };

//   const totalDebit = Object.values(groupedReportDataRightside).reduce((a, { totalBalance }) => a + Math.abs(totalBalance), 0).toFixed(2);
//   const totalFromGroupedData = Object.values(groupedReportData).reduce((a, { totalBalance }) => a + Math.abs(totalBalance), 0);
//   const totalFromRightsideData = Object.values(groupedReportDataRightside).reduce((a, { totalBalance }) => a + Math.abs(totalBalance), 0);
//   const formattedTotalCredit = (totalFromGroupedData + Math.abs(totalFromRightsideData - totalFromGroupedData)).toFixed(2);
//   const netProfit = Math.abs(totalFromRightsideData - totalFromGroupedData).toFixed(2);
//   const totalRightSide = totalFromRightsideData.toFixed(2);
//   const totalLeftSide = totalFromGroupedData.toFixed(2);

//   const fmtAmt = (val) => {
//     const n = parseFloat(val);
//     if (isNaN(n)) return "0.00";
//     if (n < 0) return `-${formatReadableAmount(Math.abs(n).toFixed(2))}`;
//     return formatReadableAmount(Math.abs(n).toFixed(2));
//   };

//   const buildRows = (groupedData) => {
//     const rows = [];
//     for (const [key, { items, totalBalance, showOnlyTotal }] of Object.entries(groupedData)) {
//       rows.push({ type: 'group', key, totalBalance });
//       if (!showOnlyTotal) {
//         items.forEach((item, idx) => {
//           rows.push({ type: 'item', item, isLast: idx === items.length - 1 });
//         });
//       }
//     }
//     return rows;
//   };


// const renderPdf = (outputType = "blob") => {
//   const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
//   const PW = doc.internal.pageSize.width;    // 595 for portrait
//   const PH = doc.internal.pageSize.height;   // 842 for portrait
//   const M = 25; // Reduced left/right margin
//   const MID = PW / 2;
//   const LH = 14;

//   // Calculate available widths - INCREASE name width significantly
//   const leftNameMaxWidth = (MID - M - 100); // Increased from 80 to 100
//   const rightNameMaxWidth = (PW - MID - M - 100); // Increased from 80 to 100
//   const leftGroupMaxWidth = (MID - M - 80); // Increased from 60 to 80
//   const rightGroupMaxWidth = (PW - MID - M - 80); // Increased from 60 to 80

//   // Adjusted column positions - Move amount column further right
//   const L = { 
//     groupX: M, 
//     codeX: M + 5, 
//     nameX: M + 38, // Adjusted for better alignment
//     amtX: MID - 10, // Move amount closer to center
//     groupMaxW: leftGroupMaxWidth,
//     nameMaxW: leftNameMaxWidth
//   };
//   const R = { 
//     groupX: MID + 8, // Reduced gap between columns
//     codeX: MID + 13, 
//     nameX: MID + 40, 
//     amtX: PW - M - 10, // Keep amount at right edge
//     groupMaxW: rightGroupMaxWidth,
//     nameMaxW: rightNameMaxWidth
//   };

//   let curY = 0;
//   let pageStartY = 0;

//   const drawHorizontalLine = (y, lineWidth = 0.5) => {
//     doc.setLineWidth(lineWidth);
//     doc.line(M, y, PW - M, y);
//   };

//   const drawCenterLine = (fromY, toY) => {
//     doc.setDrawColor(200, 200, 200);
//     doc.setLineWidth(0.3);
//     doc.line(MID, fromY, MID, toY);
//     doc.setDrawColor(0, 0, 0);
//   };

//   // Improved wrapText function with better word breaking
//   const wrapText = (text, maxWidth, fontSize) => {
//     if (!text || text === '') return [''];

//     doc.setFontSize(fontSize);
//     const words = text.split(' ');
//     const lines = [];
//     let currentLine = '';

//     for (let i = 0; i < words.length; i++) {
//       const word = words[i];
//       const testLine = currentLine ? `${currentLine} ${word}` : word;
//       const testWidth = doc.getTextWidth(testLine);

//       if (testWidth > maxWidth) {
//         if (currentLine) {
//           lines.push(currentLine);
//           currentLine = word;
//         } else {
//           // Single word too long - break it
//           let partialWord = '';
//           for (let char of word) {
//             const testPartial = partialWord + char;
//             if (doc.getTextWidth(testPartial) > maxWidth) {
//               if (partialWord) lines.push(partialWord);
//               partialWord = char;
//             } else {
//               partialWord = testPartial;
//             }
//           }
//           if (partialWord) lines.push(partialWord);
//           currentLine = '';
//         }
//       } else {
//         currentLine = testLine;
//       }
//     }

//     if (currentLine) {
//       lines.push(currentLine);
//     }

//     return lines;
//   };

//   const drawHeader = () => {
//     let y = 30;
//     doc.setFontSize(12);
//     doc.setFont("helvetica", "bold");
//     doc.text((displayCompanyName || "").trim(), MID, y, { align: "center" });

//     y += 14;
//     doc.setFontSize(8);
//     doc.setFont("helvetica", "normal");
//     const gstn = `GSTN : ${Company_GSTNO}`;
//     doc.text(gstn, MID, y, { align: "center" });
//     const gw = doc.getTextWidth(gstn);
//     doc.setLineWidth(0.3);
//     doc.line(MID - gw / 2, y + 2, MID + gw / 2, y + 2);

//     y += 14;
//     doc.setFontSize(11);
//     doc.setFont("helvetica", "bold");
//     doc.text("Balance Sheet", MID, y, { align: "center" });

//     y += 12;
//     doc.setFontSize(8);
//     doc.setFont("helvetica", "normal");
//     const fmt = (d) => (d || "").split("-").reverse().join("-");
//     doc.text(`As on ${fmt(toDate)}`, MID, y, { align: "center" });

//     y += 12;
//     drawHorizontalLine(y, 0.7);
//     y += 10;

//     doc.setFontSize(9);
//     doc.setFont("helvetica", "bold");
//     doc.text("Liabilities", L.groupX, y);
//     doc.text("Amount", L.amtX, y, { align: "right" });
//     doc.text("Assets", R.groupX, y);
//     doc.text("Amount", R.amtX, y, { align: "right" });

//     y += 5;
//     drawHorizontalLine(y, 0.5);

//     curY = y + 10;
//     pageStartY = curY;
//   };

//   drawHeader();

//   const leftRows = buildRows(groupedReportData);
//   const rightRows = buildRows(groupedReportDataRightside);
//   const maxLen = Math.max(leftRows.length, rightRows.length);

//   for (let i = 0; i < maxLen; i++) {
//     const lRow = leftRows[i] || null;
//     const rRow = rightRows[i] || null;

//     // Calculate required height for this row
//     let leftHeight = LH;
//     let rightHeight = LH;
//     let leftLines = [];
//     let rightLines = [];

//     if (lRow) {
//       if (lRow.type === 'group') {
//         const groupText = lRow.key.toUpperCase();
//         leftLines = wrapText(groupText, L.groupMaxW, 8.5);
//         leftHeight = Math.max(LH, leftLines.length * LH);
//       } else {
//         const nameText = lRow.item.Ac_Name_E.trim().toUpperCase();
//         leftLines = wrapText(nameText, L.nameMaxW, 7.5);
//         leftHeight = Math.max(LH, leftLines.length * LH);
//       }
//     }

//     if (rRow) {
//       if (rRow.type === 'group') {
//         const groupText = rRow.key.toUpperCase();
//         rightLines = wrapText(groupText, R.groupMaxW, 8.5);
//         rightHeight = Math.max(LH, rightLines.length * LH);
//       } else {
//         const nameText = rRow.item.Ac_Name_E.trim().toUpperCase();
//         rightLines = wrapText(nameText, R.nameMaxW, 7.5);
//         rightHeight = Math.max(LH, rightLines.length * LH);
//       }
//     }

//     const rowHeight = Math.max(leftHeight, rightHeight);

//     // Check for page break
//     if (curY + rowHeight > PH - 100) {
//       drawCenterLine(pageStartY, curY + 2);
//       doc.addPage();
//       drawHeader();
//     }

//     // Draw LEFT side (Liabilities)
//     if (lRow) {
//       if (lRow.type === 'group') {
//         doc.setFontSize(8.5);
//         doc.setFont("helvetica", "bold");

//         let textY = curY;
//         for (let j = 0; j < leftLines.length; j++) {
//           doc.text(leftLines[j], L.groupX, textY);
//           textY += LH;
//         }

//         const amountY = curY + (leftLines.length * LH) / 2 - 3;
//         // GROUP TOTAL: Always show as POSITIVE (absolute value)
//         doc.text(formatReadableAmount(Math.abs(lRow.totalBalance)), L.amtX, amountY, { align: "right" });
//       } else {
//         doc.setFontSize(7.5);
//         doc.setFont("helvetica", "italic");
//         const { item, isLast } = lRow;

//         // Draw account code
//         doc.text(String(item.Ac_Code), L.codeX, curY + 5);

//         // Draw wrapped account name with proper alignment
//         let textY = curY;
//         for (let j = 0; j < leftLines.length; j++) {
//           doc.text(leftLines[j], L.nameX, textY + 5);
//           textY += LH;
//         }

//         // INDIVIDUAL ITEMS: Show with sign based on BalanceDrCr
//         const amt = item.BalanceDrCr === 'D'
//           ? `-${formatReadableAmount(Math.abs(item.Balance))}`
//           : formatReadableAmount(Math.abs(item.Balance));
//         doc.text(amt, L.amtX, curY + 5, { align: "right" });

//         // Draw underline for last item
//         if (isLast) {
//           const underlineX = L.amtX - doc.getTextWidth(amt) - 8;
//           doc.setLineWidth(0.3);
//           doc.line(underlineX, curY + 7, L.amtX, curY + 7);
//         }
//       }
//     }

//     // Draw RIGHT side (Assets)
//     if (rRow) {
//       if (rRow.type === 'group') {
//         doc.setFontSize(8.5);
//         doc.setFont("helvetica", "bold");

//         let textY = curY;
//         for (let j = 0; j < rightLines.length; j++) {
//           doc.text(rightLines[j], R.groupX, textY);
//           textY += LH;
//         }

//         const amountY = curY + (rightLines.length * LH) / 2 - 3;
//         // GROUP TOTAL: Always show as POSITIVE (absolute value)
//         doc.text(formatReadableAmount(Math.abs(rRow.totalBalance)), R.amtX, amountY, { align: "right" });
//       } else {
//         doc.setFontSize(7.5);
//         doc.setFont("helvetica", "italic");
//         const { item, isLast } = rRow;

//         // Draw account code
//         doc.text(String(item.Ac_Code), R.codeX, curY + 5);

//         // Draw wrapped account name
//         let textY = curY;
//         for (let j = 0; j < rightLines.length; j++) {
//           doc.text(rightLines[j], R.nameX, textY + 5);
//           textY += LH;
//         }

//         // INDIVIDUAL ITEMS: Show with sign based on BalanceDrCr
//         const amt = item.BalanceDrCr === 'C'
//           ? `-${formatReadableAmount(Math.abs(item.Balance))}`
//           : formatReadableAmount(Math.abs(item.Balance));
//         doc.text(amt, R.amtX, curY + 5, { align: "right" });

//         // Draw underline for last item
//         if (isLast) {
//           const underlineX = R.amtX - doc.getTextWidth(amt) - 8;
//           doc.setLineWidth(0.3);
//           doc.line(underlineX, curY + 7, R.amtX, curY + 7);
//         }
//       }
//     }

//     curY += rowHeight + 3;
//   }

//   // Draw Totals Section
//   curY += 12;

//   if (curY + 80 > PH - 70) {
//     drawCenterLine(pageStartY, curY);
//     doc.addPage();
//     drawHeader();
//     curY = pageStartY + 10;
//   }

//   drawHorizontalLine(curY, 0.7);
//   curY += 12;

//   doc.setFontSize(8.5);
//   doc.setFont("helvetica", "bold");

//   // Show totals as positive values (absolute)
//   doc.text("Total Liabilities", L.groupX, curY);
//   doc.text(formatReadableAmount(Math.abs(totalLeftSide)), L.amtX, curY, { align: "right" });

//   doc.text("Total Assets", R.groupX, curY);
//   doc.text(formatReadableAmount(Math.abs(totalRightSide)), R.amtX, curY, { align: "right" });

//   curY += LH + 3;
//   drawHorizontalLine(curY - 9, 0.3);

//   // Show Net Profit as positive (absolute)
//   doc.text("Net Profit", L.groupX, curY);
//   doc.text(formatReadableAmount(Math.abs(netProfit)), L.amtX, curY, { align: "right" });

//   curY += LH + 3;
//   drawHorizontalLine(curY - 9, 0.3);

//   // Show totals as positive (absolute)
//   doc.text("Total Credit", L.groupX, curY);
//   doc.text(formatReadableAmount(Math.abs(formattedTotalCredit)), L.amtX, curY, { align: "right" });

//   doc.text("Total Debit", R.groupX, curY);
//   doc.text(formatReadableAmount(Math.abs(totalDebit)), R.amtX, curY, { align: "right" });

//   curY += LH + 3;
//   drawHorizontalLine(curY - 2, 0.7);

//   drawCenterLine(pageStartY, curY);

//   if (outputType === "blob") {
//     setPdfPreview(URL.createObjectURL(doc.output("blob")));
//  } else if (outputType === "print") {
//   const pdfBlob = doc.output("blob");
//   const blobUrl = URL.createObjectURL(pdfBlob);
//   const printWindow = window.open(blobUrl, "_blank");
//   if (printWindow) {
//     printWindow.addEventListener("load", () => {
//       printWindow.focus();
//       printWindow.print();
//     });
//   } else {
//     // fallback if popup is blocked
//     const a = document.createElement("a");
//     a.href = blobUrl;
//     a.target = "_blank";
//     a.click();
//   }
// }
// };





//   const generatePdf = () => renderPdf("blob");
//   const handlePrint = () => renderPdf("print");

//     return (
//     <div style={{ marginTop: "-90px" }}>
//       <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold" }}>{displayCompanyName}</Typography>
//       <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", textDecoration: 'underline', fontWeight: "550" }}>GSTN : {Company_GSTNO}</Typography>
//       <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>Balance Sheet</Typography>
//       <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px" }}>{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>

//       <div className="d-flex justify-content-end" style={{ marginTop: "-60px" }}>
//         <PrintButton disabledFeild={""} fetchData={handlePrint} />
//         <button className="btn btn-success" onClick={handleExportToExcel}>
//           Export to Excel
//         </button>
//         <button onClick={generatePdf} className="btn btn-secondary">
//           PDF
//         </button>
//       </div>

//       <div className="table-responsive">
//         <table
//           className="table table-striped table-bordered mt-4"
//           id="reportTable"
//           style={{ marginBottom: "50px", backgroundColor: "#D0E9C6", }}
//         >
//           <thead className="table-light">
//             <tr>
//               <th colSpan={2} style={{ textAlign: "left", backgroundColor: "#D0E9C6" }}>
//                 Liabilities
//               </th>
//               <th colSpan={2} style={{ textAlign: "right", backgroundColor: "#D0E9C6" }}>
//                 Amount
//               </th>
//               <th colSpan={2} style={{ textAlign: "left", backgroundColor: "#D0E9C6" }}>
//                 Assets
//               </th>
//               <th colSpan={2} style={{ textAlign: "right", backgroundColor: "#D0E9C6" }}>
//                 Amount
//               </th>
//             </tr>
//           </thead>

//           <tbody>
//             <tr>
//               <td
//                 align="left"
//                 colSpan={4}
//                 style={{ verticalAlign: "top", width: "50%", backgroundColor: "#D0E9C6", }}
//               >
//                 <table style={{ width: "100%", backgroundColor: "#D0E9C6", }}>
//                   {Object.entries(groupedReportData).map(
//                     ([key, { items, totalBalance, showOnlyTotal }]) => (
//                       <React.Fragment key={key}>
//                         <tr className="table-primary" onClick={() => handleGroupClick(key)}>
//                           <td
//                             colSpan={2}
//                             style={{ color: "black", fontWeight: "bold", fontFamily: "Arial" }}
//                           >
//                             {key.toUpperCase()}
//                           </td>
//                           <td
//                             align="right"
//                             style={{ color: "black", fontWeight: "bold", fontFamily: "Arial" }}
//                           >
//                             {formatReadableAmount(Math.abs(totalBalance.toFixed(2)))}
//                           </td>
//                         </tr>
//                         {!showOnlyTotal &&
//                           items.map((item, index) => {
//                             const isLast = index === items.length - 1;
//                             return (
//                               <tr key={item.Ac_Code}>
//                                 <td onClick={() => handleRowClick(item.Ac_Code, item.Ac_Name_E)} style={{ cursor: "pointer", fontStyle: "italic" }}>{item.Ac_Code}</td>
//                                 <td style={{ cursor: "pointer", fontStyle: "italic" }}>{item.Ac_Name_E}</td>
//                                 <td
//                                   align="right"
//                                   style={{
//                                     paddingRight: "80px",
//                                     textAlign: "right",
//                                   }}
//                                 >
//                                   <span
//                                     style={{
//                                       display: "inline-block",
//                                       fontStyle: "italic",
//                                       fontWeight: 450,
//                                       marginRight: 120,
//                                       borderBottom: isLast ? "2px solid black" : "none",
//                                       paddingBottom: "2px",
//                                       marginTop: "2px",
//                                     }}
//                                   >
//                                     {item.BalanceDrCr === 'D'
//                                       ? `-${formatReadableAmount(Math.abs(item.Balance))}`
//                                       : formatReadableAmount(Math.abs(item.Balance))}

//                                   </span>
//                                 </td>
//                               </tr>
//                             );
//                           })}
//                       </React.Fragment>
//                     )
//                   )}
//                 </table>
//               </td>
//               <td
//                 align="center"
//                 colSpan={4}
//                 style={{ verticalAlign: "top", width: "50%", backgroundColor: "#D0E9C6", }}
//               >
//                 <table style={{ width: "100%", backgroundColor: "#D0E9C6" }}>
//                   {Object.entries(groupedReportDataRightside).map(
//                     ([key, { items, totalBalance, showOnlyTotal }]) => (
//                       <React.Fragment key={key}>
//                         <tr className="table-primary" onClick={() => handleGroupClick(key)}>
//                           <td
//                             colSpan={2}
//                             style={{ color: "black", fontWeight: "bold", fontFamily: "Arial" }}
//                           >
//                             {key.toUpperCase()}
//                           </td>
//                           <td
//                             align="right"
//                             style={{ color: "black", fontWeight: "bold", fontFamily: "Arial" }}
//                           >
//                             {formatReadableAmount(Math.abs(totalBalance.toFixed(2)))}
//                           </td>
//                         </tr>
//                         {!showOnlyTotal &&
//                           items.map((item, index) => {
//                             const isLast = index === items.length - 1;
//                             return (
//                               <tr key={item.Ac_Code}>
//                                 <td
//                                   onClick={() => handleRowClick(item.Ac_Code, item.Ac_Name_E)}
//                                   style={{ cursor: "pointer", fontStyle: "italic" }}
//                                 >
//                                   {item.Ac_Code}
//                                 </td>
//                                 <td style={{ cursor: "pointer", fontStyle: "italic" }}>
//                                   {item.Ac_Name_E}
//                                 </td>
//                                 <td
//                                   align="right"
//                                   style={{
//                                     paddingRight: "160px",
//                                     paddingLeft: "20px",
//                                   }}
//                                 >
//                                   <span
//                                     style={{
//                                       display: "inline-block",
//                                       fontStyle: "italic",
//                                       fontWeight: 450,
//                                       marginRight: 30,
//                                       borderBottom: isLast ? "2px solid black" : "none",
//                                       paddingBottom: "2px",
//                                       marginTop: "2px",
//                                     }}
//                                   >
//                                     {item.BalanceDrCr === 'C'
//                                       ? `-${formatReadableAmount(Math.abs(item.Balance))}`
//                                       : formatReadableAmount(Math.abs(item.Balance))}

//                                   </span>
//                                 </td>
//                               </tr>
//                             );
//                           })}
//                       </React.Fragment>
//                     )
//                   )}
//                 </table>
//               </td>
//             </tr>
//             <tr >
//               <td
//                 colSpan={3}
//                 className="fw-bold text-end"
//                 style={{ color: "black", backgroundColor: "#D0E9C6" }}
//               >
//                 Total
//               </td>
//               <td align="right" className="fw-bold" style={{ backgroundColor: "#D0E9C6", }}>
//                 {formatReadableAmount(totalLeftSide)}
//               </td>

//               <td
//                 colSpan={3}
//                 className="fw-bold text-end"
//                 style={{ backgroundColor: "#D0E9C6" }}
//               >
//                 Total
//               </td>
//               <td align="right" className="fw-bold" style={{ backgroundColor: "#D0E9C6", }}>
//                 {formatReadableAmount(totalRightSide)}
//               </td>
//             </tr>

//             <tr>
//               <td
//                 colSpan={3}
//                 className="fw-bold text-end"
//                 style={{ backgroundColor: "#D0E9C6", }}
//               >
//                 Net Profit
//               </td>
//               <td align="right" className="fw-bold" style={{ backgroundColor: "#D0E9C6", }}>
//                 {formatReadableAmount(netProfit)}
//               </td>

//               <td
//                 colSpan={3}
//                 className="fw-bold text-end"
//                 style={{ backgroundColor: "#D0E9C6", }}
//               >
//               </td>
//               <td align="right" className="fw-bold" style={{ backgroundColor: "#D0E9C6", }}>
//                 {/* {formatReadableAmount(totalCreditRightSide)} */}
//               </td>
//             </tr>

//             <tr>
//               <td
//                 colSpan={3}
//                 className="fw-bold text-end"
//                 style={{ backgroundColor: "#D0E9C6", }}
//               >
//                 Total Credit
//               </td>
//               <td align="right" className="fw-bold" style={{ backgroundColor: "#D0E9C6", }}>
//                 {formatReadableAmount(formattedTotalCredit)}
//               </td>

//               <td
//                 colSpan={3}
//                 className="fw-bold text-end"
//                 style={{ backgroundColor: "#D0E9C6", }}
//               >
//                 Total Debit
//               </td>
//               <td align="right" className="fw-bold" style={{ backgroundColor: "#D0E9C6", }}>
//                 {formatReadableAmount(totalDebit)}
//               </td>
//             </tr>
//           </tbody>
//         </table>

//         <div className="centered-container">
//           {pdfPreview && pdfPreview.length > 0 && (
//             <PdfPreview
//               pdfData={pdfPreview}
//               apiData={reportData}
//               label={"BalanceSheet"}
//             />
//           )}
//         </div>
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

// export default BalancesheetReport;












































import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../Reports/TrialBalance/TrialBalance.css";
import * as XLSX from "xlsx";
import "jspdf-autotable";
import { useNavigate, useLocation } from "react-router-dom";
import PdfPreview from "../../../Common/PDFPreview";
import { jsPDF } from "jspdf";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import { ScaleLoader } from 'react-spinners';
import { Typography } from '@mui/material';
import { KeyboardArrowRight, KeyboardArrowDown } from '@mui/icons-material';
import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate";
import PrintButton from '../../../Common/Buttons/PrintPDF';

const apikey = process.env.REACT_APP_API;

const BalancesheetReport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');

  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");
  const Company_Name = sessionStorage.getItem("Company_Name");
  const Company_GSTNO = sessionStorage.getItem('Company_GSTNO');
  const CompanyNameUpdatedDate = sessionStorage.getItem("CompanyNameUpdatedDate");
  const newCompanyName = sessionStorage.getItem("newCompanyName");

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pdfPreview, setPdfPreview] = useState([]);
  const [groupedReportData, setGroupedReportData] = useState({});
  const [groupedReportDataRightside, setGroupedReportDataRightside] = useState({});

  // ─── ACCORDION STATE ─────────────────────────────────────────────────────────
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [allExpanded, setAllExpanded] = useState(true);

  const API_URL = `${apikey}/Balancesheet_Report`;

  const docDate = new Date(fromDate);
  const cnameUpdatedDate = new Date(CompanyNameUpdatedDate);
  const displayCompanyName = docDate < cnameUpdatedDate ? newCompanyName : Company_Name;

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(API_URL, {
          params: { to_date: toDate, Company_Code: companyCode, Year_Code: Year_Code },
        });
        setReportData(response.data);
      } catch (error) {
        console.error("Error fetching report:", error);
        setError("Error fetching report");
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [API_URL]);

  useEffect(() => {
    if (reportData.length > 0) {
      const { groupedDataleft, groupedReportDataRightside } = convertData(reportData);
      setGroupedReportData(groupedDataleft);
      setGroupedReportDataRightside(groupedReportDataRightside);
    }
  }, [reportData]);

  // ─── When data loads, expand all groups by default ───────────────────────────
  useEffect(() => {
    if (
      Object.keys(groupedReportData).length === 0 &&
      Object.keys(groupedReportDataRightside).length === 0
    ) return;
    const allKeys = collectAllGroupKeys(groupedReportData, groupedReportDataRightside);
    setExpandedGroups(new Set(allKeys));
    setAllExpanded(true);
  }, [groupedReportData, groupedReportDataRightside]);

  // ─── ACCORDION HELPERS ───────────────────────────────────────────────────────

  const collectAllGroupKeys = (leftData, rightData) => {
    const keys = new Set();
    Object.keys(leftData).forEach(k => keys.add(k));
    Object.keys(rightData).forEach(k => keys.add(k));
    return [...keys];
  };

  const toggleGroup = (key) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      const allKeys = collectAllGroupKeys(groupedReportData, groupedReportDataRightside);
      setAllExpanded(allKeys.every(k => next.has(k)));
      return next;
    });
  };

  const handleToggleAll = (checked) => {
    setAllExpanded(checked);
    if (checked) {
      const allKeys = collectAllGroupKeys(groupedReportData, groupedReportDataRightside);
      setExpandedGroups(new Set(allKeys));
    } else {
      setExpandedGroups(new Set());
    }
  };

  const isExpanded = (key) => expandedGroups.has(key);

  // ─── DATA CONVERSION (unchanged) ─────────────────────────────────────────────

  const convertData = (data) => {
    const groupedDataleft = {};
    const groupedReportDataRightside = {};
    const groupTotals = {};
    data.forEach((item) => {
      const balance = parseFloat(item.Balance) || 0;
      const key = `${item.Group_Code} - ${item.groupname}`;
      if (!groupTotals[key]) groupTotals[key] = 0;
      groupTotals[key] += balance;
    });
    data.forEach((item) => {
      const balance = parseFloat(item.Balance) || 0;
      const key = `${item.Group_Code} - ${item.groupname}`;
      const totalBalance = groupTotals[key];
      if (totalBalance === 0) return;
      const target = totalBalance < 0 ? groupedDataleft : groupedReportDataRightside;
      if (!target[key]) target[key] = { groupname: item.groupname, items: [], totalBalance, showOnlyTotal: false };
      if (item.summary === "Y") {
        target[key].showOnlyTotal = true;
      } else {
        target[key].items.push({ Ac_Code: item.AC_CODE, Ac_Name_E: item.Ac_Name_E, Balance: balance.toFixed(2), BalanceDrCr: item.BalanceDrCr });
      }
    });

    const sortGroups = (groups) => {
      const sorted = {};
      Object.keys(groups).sort((a, b) => {
        const codeA = parseInt(a.split(" - ")[0]);
        const codeB = parseInt(b.split(" - ")[0]);
        return codeA - codeB;
      }).forEach(key => {
        sorted[key] = groups[key];
      });
      return sorted;
    };

    return {
      groupedDataleft: sortGroups(groupedDataleft),
      groupedReportDataRightside: sortGroups(groupedReportDataRightside)
    };
  };

  // ─── TOTALS (unchanged) ───────────────────────────────────────────────────────

  const totalDebit = Object.values(groupedReportDataRightside).reduce((a, { totalBalance }) => a + Math.abs(totalBalance), 0).toFixed(2);
  const totalFromGroupedData = Object.values(groupedReportData).reduce((a, { totalBalance }) => a + Math.abs(totalBalance), 0);
  const totalFromRightsideData = Object.values(groupedReportDataRightside).reduce((a, { totalBalance }) => a + Math.abs(totalBalance), 0);
  const formattedTotalCredit = (totalFromGroupedData + Math.abs(totalFromRightsideData - totalFromGroupedData)).toFixed(2);
  const netProfit = Math.abs(totalFromRightsideData - totalFromGroupedData).toFixed(2);
  const totalRightSide = totalFromRightsideData.toFixed(2);
  const totalLeftSide = totalFromGroupedData.toFixed(2);

  const fmtAmt = (val) => {
    const n = parseFloat(val);
    if (isNaN(n)) return "0.00";
    if (n < 0) return `-${formatReadableAmount(Math.abs(n).toFixed(2))}`;
    return formatReadableAmount(Math.abs(n).toFixed(2));
  };

  // ─── CLICK HANDLERS (unchanged) ──────────────────────────────────────────────

  const handleRowClick = (acCode, acname) => {
    setLoading(true);
    setTimeout(() => {
      const url = `/ledger-report?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&acCode=${encodeURIComponent(acCode)}&acname=${encodeURIComponent(acname)}`;
      window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
      setLoading(false);
    }, 500);
  };

  const handleGroupClick = (groupKey) => {
    if (!groupKey) return;
    const groupCode = parseInt(groupKey.split(" - ")[0], 10);
    setLoading(true);
    setTimeout(() => {
      const url = `/TrialBalance-reports?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&groupType=${encodeURIComponent(groupCode)}`;
      window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
      setLoading(false);
    }, 500);
  };

  // ─── EXCEL EXPORT (respects expanded/collapsed state) ────────────────────────

  const handleExportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws_data = [
      [`${displayCompanyName} - Balance Sheet Report`],
      [`As on ${toDate}`],
      [],
      ["Liabilities (Group Code & Name)", "", "", "Amount", "Assets (Group Code & Name)", "", "", "Amount"],
    ];

    const leftEntries = Object.entries(groupedReportData);
    const rightEntries = Object.entries(groupedReportDataRightside);
    const maxLen = Math.max(leftEntries.length, rightEntries.length);

    for (let i = 0; i < maxLen; i++) {
      const lg = leftEntries[i] ? leftEntries[i][1] : undefined;
      const rg = rightEntries[i] ? rightEntries[i][1] : undefined;
      const leftKey = leftEntries[i] ? leftEntries[i][0] : null;
      const rightKey = rightEntries[i] ? rightEntries[i][0] : null;

      ws_data.push([
        lg ? leftKey : "", "", "",
        lg ? Math.abs(parseFloat(lg.totalBalance).toFixed(2)) : "",
        rg ? rightKey : "", "", "",
        rg ? Math.abs(parseFloat(rg.totalBalance).toFixed(2)) : ""
      ]);

      const leftExpanded = leftKey ? isExpanded(leftKey) : false;
      const rightExpanded = rightKey ? isExpanded(rightKey) : false;

      const maxItems = Math.max(
        (leftExpanded && !lg?.showOnlyTotal) ? (lg?.items?.length || 0) : 0,
        (rightExpanded && !rg?.showOnlyTotal) ? (rg?.items?.length || 0) : 0
      );

      for (let j = 0; j < maxItems; j++) {
        const li = (leftExpanded && !lg?.showOnlyTotal) ? lg?.items[j] : undefined;
        const ri = (rightExpanded && !rg?.showOnlyTotal) ? rg?.items[j] : undefined;
        ws_data.push([
          li ? `  ${li.Ac_Code} - ${li.Ac_Name_E.toUpperCase()}` : "", "",
          li ? (li.BalanceDrCr === "D" ? -Math.abs(+parseFloat(li.Balance).toFixed(2)) : Math.abs(+parseFloat(li.Balance).toFixed(2))) : "",
          "",
          ri ? `  ${ri.Ac_Code} - ${ri.Ac_Name_E.toUpperCase()}` : "", "",
          ri ? (ri.BalanceDrCr === "C" ? -Math.abs(+parseFloat(ri.Balance).toFixed(2)) : Math.abs(+parseFloat(ri.Balance).toFixed(2))) : ""
        ]);
      }
    }

    ws_data.push(["", "", "", "", "", "", ""]);
    ws_data.push(["Total Liabilities", "", "", Math.abs(parseFloat(totalLeftSide).toFixed(2)), "Total Assets", "", "", Math.abs(parseFloat(totalRightSide).toFixed(2))]);
    ws_data.push(["Net Profit", "", "", Math.abs(parseFloat(netProfit).toFixed(2)), "", "", "", ""]);

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!cols'] = [{ wch: 50 }, { wch: 5 }, { wch: 5 }, { wch: 20 }, { wch: 50 }, { wch: 5 }, { wch: 5 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws, "BalanceSheet Reports");
    XLSX.writeFile(wb, "BalanceSheetReport.xlsx");
  };

  // ─── PDF buildRows (respects expanded/collapsed state) ───────────────────────

  const buildRows = (groupedData) => {
    const rows = [];
    for (const [key, { items, totalBalance, showOnlyTotal }] of Object.entries(groupedData)) {
      rows.push({ type: 'group', key, totalBalance });
      if (!showOnlyTotal && isExpanded(key)) {
        items.forEach((item, idx) => {
          rows.push({ type: 'item', item, isLast: idx === items.length - 1 });
        });
      }
    }
    return rows;
  };

  // ─── PDF / PRINT (unchanged logic, uses buildRows which respects state) ───────

  const renderPdf = (outputType = "blob") => {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const PW = doc.internal.pageSize.width;
    const PH = doc.internal.pageSize.height;
    const M = 25;
    const MID = PW / 2;
    const LH = 14;

    const leftNameMaxWidth = (MID - M - 100);
    const rightNameMaxWidth = (PW - MID - M - 100);
    const leftGroupMaxWidth = (MID - M - 80);
    const rightGroupMaxWidth = (PW - MID - M - 80);

    const L = {
      groupX: M,
      codeX: M + 5,
      nameX: M + 38,
      amtX: MID - 10,
      groupMaxW: leftGroupMaxWidth,
      nameMaxW: leftNameMaxWidth
    };
    const R = {
      groupX: MID + 8,
      codeX: MID + 13,
      nameX: MID + 40,
      amtX: PW - M - 10,
      groupMaxW: rightGroupMaxWidth,
      nameMaxW: rightNameMaxWidth
    };

    let curY = 0;
    let pageStartY = 0;

    const drawHorizontalLine = (y, lineWidth = 0.5) => {
      doc.setLineWidth(lineWidth);
      doc.line(M, y, PW - M, y);
    };

    const drawCenterLine = (fromY, toY) => {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(MID, fromY, MID, toY);
      doc.setDrawColor(0, 0, 0);
    };

    const wrapText = (text, maxWidth, fontSize) => {
      if (!text || text === '') return [''];
      doc.setFontSize(fontSize);
      const words = text.split(' ');
      const lines = [];
      let currentLine = '';
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = doc.getTextWidth(testLine);
        if (testWidth > maxWidth) {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            let partialWord = '';
            for (let char of word) {
              const testPartial = partialWord + char;
              if (doc.getTextWidth(testPartial) > maxWidth) {
                if (partialWord) lines.push(partialWord);
                partialWord = char;
              } else {
                partialWord = testPartial;
              }
            }
            if (partialWord) lines.push(partialWord);
            currentLine = '';
          }
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines;
    };

    const drawHeader = () => {
      let y = 30;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text((displayCompanyName || "").trim(), MID, y, { align: "center" });

      // --- ADDED PRINT DATE AT TOP RIGHT ---
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      const printDate = `Print Date: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
      doc.text(printDate, PW - M, y - 10, { align: "right" });

      y += 14;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const gstn = `GSTN : ${Company_GSTNO}`;
      doc.text(gstn, MID, y, { align: "center" });
      const gw = doc.getTextWidth(gstn);
      doc.setLineWidth(0.3);
      doc.line(MID - gw / 2, y + 2, MID + gw / 2, y + 2);

      y += 14;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Balance Sheet", MID, y, { align: "center" });

      y += 12;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const fmt = (d) => (d || "").split("-").reverse().join("-");
      doc.text(`As on ${fmt(toDate)}`, MID, y, { align: "center" });

      y += 12;
      drawHorizontalLine(y, 0.7);
      y += 10;

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Liabilities", L.groupX, y);
      doc.text("Amount", L.amtX, y, { align: "right" });
      doc.text("Assets", R.groupX, y);
      doc.text("Amount", R.amtX, y, { align: "right" });

      y += 5;
      drawHorizontalLine(y, 0.5);

      curY = y + 10;
      pageStartY = curY;
    };

    drawHeader();

    const leftRows = buildRows(groupedReportData);
    const rightRows = buildRows(groupedReportDataRightside);
    const maxLen = Math.max(leftRows.length, rightRows.length);

    for (let i = 0; i < maxLen; i++) {
      const lRow = leftRows[i] || null;
      const rRow = rightRows[i] || null;

      let leftHeight = LH;
      let rightHeight = LH;
      let leftLines = [];
      let rightLines = [];

      if (lRow) {
        if (lRow.type === 'group') {
          leftLines = wrapText(lRow.key.toUpperCase(), L.groupMaxW, 8.5);
          leftHeight = Math.max(LH, leftLines.length * LH);
        } else {
          leftLines = wrapText(lRow.item.Ac_Name_E.trim().toUpperCase(), L.nameMaxW, 7.5);
          leftHeight = Math.max(LH, leftLines.length * LH);
        }
      }

      if (rRow) {
        if (rRow.type === 'group') {
          rightLines = wrapText(rRow.key.toUpperCase(), R.groupMaxW, 8.5);
          rightHeight = Math.max(LH, rightLines.length * LH);
        } else {
          rightLines = wrapText(rRow.item.Ac_Name_E.trim().toUpperCase(), R.nameMaxW, 7.5);
          rightHeight = Math.max(LH, rightLines.length * LH);
        }
      }

      const rowHeight = Math.max(leftHeight, rightHeight);

      if (curY + rowHeight > PH - 100) {
        drawCenterLine(pageStartY, curY + 2);
        doc.addPage();
        drawHeader();
      }

      // Draw LEFT side (Liabilities)
      if (lRow) {
        if (lRow.type === 'group') {
          doc.setFontSize(8.5);
          doc.setFont("helvetica", "bold");
          let textY = curY;
          for (let j = 0; j < leftLines.length; j++) {
            doc.text(leftLines[j], L.groupX, textY);
            textY += LH;
          }
          const amountY = curY + (leftLines.length * LH) / 2 - 3;
          doc.text(formatReadableAmount(Math.abs(lRow.totalBalance)), L.amtX, amountY, { align: "right" });
        } else {
          doc.setFontSize(7.5);
          doc.setFont("helvetica", "italic");
          const { item, isLast } = lRow;
          doc.text(String(item.Ac_Code), L.codeX, curY + 5);
          let textY = curY;
          for (let j = 0; j < leftLines.length; j++) {
            doc.text(leftLines[j], L.nameX, textY + 5);
            textY += LH;
          }
          const amt = item.BalanceDrCr === 'D'
            ? `-${formatReadableAmount(Math.abs(item.Balance))}`
            : formatReadableAmount(Math.abs(item.Balance));
          doc.text(amt, L.amtX, curY + 5, { align: "right" });
          if (isLast) {
            const underlineX = L.amtX - doc.getTextWidth(amt) - 8;
            doc.setLineWidth(0.3);
            doc.line(underlineX, curY + 7, L.amtX, curY + 7);
          }
        }
      }

      // Draw RIGHT side (Assets)
      if (rRow) {
        if (rRow.type === 'group') {
          doc.setFontSize(8.5);
          doc.setFont("helvetica", "bold");
          let textY = curY;
          for (let j = 0; j < rightLines.length; j++) {
            doc.text(rightLines[j], R.groupX, textY);
            textY += LH;
          }
          const amountY = curY + (rightLines.length * LH) / 2 - 3;
          doc.text(formatReadableAmount(Math.abs(rRow.totalBalance)), R.amtX, amountY, { align: "right" });
        } else {
          doc.setFontSize(7.5);
          doc.setFont("helvetica", "italic");
          const { item, isLast } = rRow;
          doc.text(String(item.Ac_Code), R.codeX, curY + 5);
          let textY = curY;
          for (let j = 0; j < rightLines.length; j++) {
            doc.text(rightLines[j], R.nameX, textY + 5);
            textY += LH;
          }
          const amt = item.BalanceDrCr === 'C'
            ? `-${formatReadableAmount(Math.abs(item.Balance))}`
            : formatReadableAmount(Math.abs(item.Balance));
          doc.text(amt, R.amtX, curY + 5, { align: "right" });
          if (isLast) {
            const underlineX = R.amtX - doc.getTextWidth(amt) - 8;
            doc.setLineWidth(0.3);
            doc.line(underlineX, curY + 7, R.amtX, curY + 7);
          }
        }
      }

      curY += rowHeight + 3;
    }

    // Draw Totals Section
    curY += 12;

    if (curY + 80 > PH - 70) {
      drawCenterLine(pageStartY, curY);
      doc.addPage();
      drawHeader();
      curY = pageStartY + 10;
    }

    drawHorizontalLine(curY, 0.7);
    curY += 12;

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");

    doc.text("Total Liabilities", L.groupX, curY);
    doc.text(formatReadableAmount(Math.abs(totalLeftSide)), L.amtX, curY, { align: "right" });
    doc.text("Total Assets", R.groupX, curY);
    doc.text(formatReadableAmount(Math.abs(totalRightSide)), R.amtX, curY, { align: "right" });

    curY += LH + 3;
    drawHorizontalLine(curY - 9, 0.3);

    doc.text("Net Profit", L.groupX, curY);
    doc.text(formatReadableAmount(Math.abs(netProfit)), L.amtX, curY, { align: "right" });

    curY += LH + 3;
    drawHorizontalLine(curY - 9, 0.3);

    doc.text("Total Credit", L.groupX, curY);
    doc.text(formatReadableAmount(Math.abs(formattedTotalCredit)), L.amtX, curY, { align: "right" });
    doc.text("Total Debit", R.groupX, curY);
    doc.text(formatReadableAmount(Math.abs(totalDebit)), R.amtX, curY, { align: "right" });

    curY += LH + 3;
    drawHorizontalLine(curY - 2, 0.7);
    drawCenterLine(pageStartY, curY);

    if (outputType === "blob") {
      setPdfPreview(URL.createObjectURL(doc.output("blob")));
    } else if (outputType === "print") {
      const pdfBlob = doc.output("blob");
      const blobUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(blobUrl, "_blank");
      if (printWindow) {
        printWindow.addEventListener("load", () => {
          printWindow.focus();
          printWindow.print();
        });
      } else {
        const a = document.createElement("a");
        a.href = blobUrl;
        a.target = "_blank";
        a.click();
      }
    }
  };

  const generatePdf = () => renderPdf("blob");
  const handlePrint = () => renderPdf("print");

  // ─── RENDER ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ marginTop: "-90px" }}>
      <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold" }}>{displayCompanyName}</Typography>
      <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", textDecoration: 'underline', fontWeight: "550" }}>GSTN : {Company_GSTNO}</Typography>
      <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>Balance Sheet</Typography>
      <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px" }}>{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>

      <div className="d-flex justify-content-end align-items-center" style={{ marginTop: "-60px", gap: "8px", flexWrap: "wrap" }}>

        <div
          onClick={() => handleToggleAll(!allExpanded)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            cursor: "pointer",
            userSelect: "none",
            border: "1px solid #ccc",
            borderRadius: "6px",
            padding: "5px 12px",
            height: "32px",
            backgroundColor: "#fff",
          }}
        >
          {/* Switch track */}
          <div
            style={{
              width: "34px",
              height: "18px",
              borderRadius: "9px",
              backgroundColor: allExpanded ? "#378ADD" : "#ccc",
              position: "relative",
              transition: "background 0.2s",
              flexShrink: 0,
            }}
          >
            {/* Switch thumb */}
            <div
              style={{
                width: "13px",
                height: "13px",
                borderRadius: "50%",
                backgroundColor: "#fff",
                position: "absolute",
                top: "2.5px",
                left: allExpanded ? "18.5px" : "2.5px",
                transition: "left 0.2s",
              }}
            />
          </div>

          {/* Label */}
          <span style={{ fontSize: "13px", fontWeight: "500", color: "#333", minWidth: "74px" }}>
            {allExpanded ? "Collapse all" : "Expand all"}
          </span>
        </div>

        <PrintButton disabledFeild={""} fetchData={handlePrint} />
        <button className="btn btn-success" onClick={handleExportToExcel}>
          Export to Excel
        </button>
        <button onClick={generatePdf} className="btn btn-secondary">
          PDF
        </button>
      </div>

      <div className="table-responsive">
        <table
          className="table table-striped table-bordered mt-4"
          id="reportTable"
          style={{ marginBottom: "50px", backgroundColor: "#D0E9C6" }}
        >
          <thead className="table-light">
            <tr>
              <th colSpan={2} style={{ textAlign: "left", backgroundColor: "#D0E9C6" }}>Liabilities</th>
              <th colSpan={2} style={{ textAlign: "right", backgroundColor: "#D0E9C6" }}>Amount</th>
              <th colSpan={2} style={{ textAlign: "left", backgroundColor: "#D0E9C6" }}>Assets</th>
              <th colSpan={2} style={{ textAlign: "right", backgroundColor: "#D0E9C6" }}>Amount</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              {/* LEFT — Liabilities */}
              <td align="left" colSpan={4} style={{ verticalAlign: "top", width: "50%", backgroundColor: "#D0E9C6" }}>
                <table style={{ width: "100%", backgroundColor: "#D0E9C6" }}>
                  {Object.entries(groupedReportData).map(([key, { items, totalBalance, showOnlyTotal }]) => (
                    <React.Fragment key={key}>
                      {/* ── Group header row ── */}
                      <tr
                        className="table-primary"
                        // style={{ cursor: "pointer", userSelect: "none" }}
                        // onClick={() => toggleGroup(key)}
                        style={{ userSelect: "none" }}
                      >
                        <td
                          colSpan={2}
                          style={{
                            color: "black",
                            fontWeight: "bold",
                            fontFamily: "Arial",
                            // display: "flex",
                            // alignItems: "center",
                            // gap: "6px"
                          }}
                        >
                          {/* <span style={{
                            display: "inline-block",
                            transition: "transform 0.2s ease",
                            transform: isExpanded(key) ? "rotate(90deg)" : "rotate(0deg)",
                            fontSize: "10px",
                            color: "#555",
                            minWidth: "12px"
                          }}>
                            ▶
                          </span> */}

                          <span
                            onClick={() => toggleGroup(key)}
                            style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", marginRight: "6px" }}
                          >
                            {isExpanded
                              ? <KeyboardArrowDown style={{ fontSize: "18px", color: "#000000" }} />
                              : <KeyboardArrowRight style={{ fontSize: "18px", color: "#000000" }} />
                            }
                          </span>

                          {key.toUpperCase()}
                        </td>
                        <td align="right" style={{ color: "black", fontWeight: "bold", fontFamily: "Arial", cursor: "text" }}>
                          {formatReadableAmount(Math.abs(totalBalance.toFixed(2)))}
                        </td>
                      </tr>

                      {/* ── Sub-item rows ── */}
                      {isExpanded(key) && !showOnlyTotal &&
                        items.map((item, index) => {
                          const isLast = index === items.length - 1;
                          return (
                            <tr key={item.Ac_Code}>
                              {/* <td onClick={() => handleRowClick(item.Ac_Code, item.Ac_Name_E)} style={{ cursor: "pointer", fontStyle: "italic" }}>{item.Ac_Code}</td> */}
                              <td style={{ fontStyle: "italic" }}>
                                <span onClick={() => handleRowClick(item.Ac_Code, item.Ac_Name_E)} style={{ cursor: "pointer" }}>
                                  {item.Ac_Code}
                                </span>
                                {" - "}
                                <span style={{ cursor: "text" }}>{item.Ac_Name_E}</span>
                              </td>
                              <td style={{ cursor: "pointer", fontStyle: "italic", cursor: "text" }}></td>
                              <td align="right" style={{ paddingRight: "80px", textAlign: "right" }}>
                                <span style={{
                                  display: "inline-block",
                                  fontStyle: "italic",
                                  fontWeight: 450,
                                  marginRight: 120,
                                  borderBottom: isLast ? "2px solid black" : "none",
                                  paddingBottom: "2px",
                                  marginTop: "2px",
                                }}>
                                  {item.BalanceDrCr === 'D'
                                    ? `-${formatReadableAmount(Math.abs(item.Balance))}`
                                    : formatReadableAmount(Math.abs(item.Balance))}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      }
                    </React.Fragment>
                  ))}
                </table>
              </td>

              {/* RIGHT — Assets */}
              <td align="center" colSpan={4} style={{ verticalAlign: "top", width: "50%", backgroundColor: "#D0E9C6" }}>
                <table style={{ width: "100%", backgroundColor: "#D0E9C6" }}>
                  {Object.entries(groupedReportDataRightside).map(([key, { items, totalBalance, showOnlyTotal }]) => (
                    <React.Fragment key={key}>
                      {/* ── Group header row ── */}
                      <tr
                        className="table-primary"
                        // style={{ cursor: "pointer", userSelect: "none" }}
                        // onClick={() => toggleGroup(key)}
                        style={{ userSelect: "none" }}
                      >
                        <td
                          colSpan={2}
                          style={{
                            color: "black",
                            fontWeight: "bold",
                            fontFamily: "Arial",
                            // display: "flex",
                            // alignItems: "center",
                            // gap: "6px"
                          }}
                        >
                          {/* <span style={{
                            display: "inline-block",
                            transition: "transform 0.2s ease",
                            transform: isExpanded(key) ? "rotate(90deg)" : "rotate(0deg)",
                            fontSize: "10px",
                            color: "#555",
                            minWidth: "12px"
                          }}>
                            ▶
                          </span> */}
                          <span
                            onClick={() => toggleGroup(key)}
                            style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", marginRight: "6px" }}
                          >
                            {isExpanded
                              ? <KeyboardArrowDown style={{ fontSize: "18px", color: "#000000" }} />
                              : <KeyboardArrowRight style={{ fontSize: "18px", color: "#000000" }} />
                            }
                          </span>

                          {key.toUpperCase()}
                        </td>
                        <td align="right" style={{ color: "black", fontWeight: "bold", fontFamily: "Arial", cursor: "text" }}>
                          {formatReadableAmount(Math.abs(totalBalance.toFixed(2)))}
                        </td>
                      </tr>

                      {/* ── Sub-item rows ── */}
                      {isExpanded(key) && !showOnlyTotal &&
                        items.map((item, index) => {
                          const isLast = index === items.length - 1;
                          return (
                            <tr key={item.Ac_Code}>
                              {/* <td onClick={() => handleRowClick(item.Ac_Code, item.Ac_Name_E)} style={{ cursor: "pointer", fontStyle: "italic" }}>{item.Ac_Code}</td> */}
                              <td style={{ fontStyle: "italic" }}>
                                <span onClick={() => handleRowClick(item.Ac_Code, item.Ac_Name_E)} style={{ cursor: "pointer" }}>
                                  {item.Ac_Code}
                                </span>
                                {" - "}
                                <span style={{ cursor: "text" }}>{item.Ac_Name_E}</span>
                              </td>
                              <td style={{ cursor: "pointer", fontStyle: "italic", cursor: "text" }}></td>
                              <td align="right" style={{ paddingRight: "160px", paddingLeft: "20px" }}>
                                <span style={{
                                  display: "inline-block",
                                  fontStyle: "italic",
                                  fontWeight: 450,
                                  marginRight: 30,
                                  borderBottom: isLast ? "2px solid black" : "none",
                                  paddingBottom: "2px",
                                  marginTop: "2px",
                                }}>
                                  {item.BalanceDrCr === 'C'
                                    ? `-${formatReadableAmount(Math.abs(item.Balance))}`
                                    : formatReadableAmount(Math.abs(item.Balance))}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      }
                    </React.Fragment>
                  ))}
                </table>
              </td>
            </tr>

            {/* Total row (unchanged) */}
            <tr>
              <td colSpan={3} className="fw-bold text-end" style={{ color: "black", backgroundColor: "#D0E9C6" }}>Total</td>
              <td align="right" className="fw-bold" style={{ backgroundColor: "#D0E9C6" }}>{formatReadableAmount(totalLeftSide)}</td>
              <td colSpan={3} className="fw-bold text-end" style={{ backgroundColor: "#D0E9C6" }}>Total</td>
              <td align="right" className="fw-bold" style={{ backgroundColor: "#D0E9C6" }}>{formatReadableAmount(totalRightSide)}</td>
            </tr>

            {/* Net Profit row (unchanged) */}
            <tr>
              <td colSpan={3} className="fw-bold text-end" style={{ backgroundColor: "#D0E9C6" }}>Net Profit</td>
              <td align="right" className="fw-bold" style={{ backgroundColor: "#D0E9C6" }}>{formatReadableAmount(netProfit)}</td>
              <td colSpan={3} className="fw-bold text-end" style={{ backgroundColor: "#D0E9C6" }}></td>
              <td align="right" className="fw-bold" style={{ backgroundColor: "#D0E9C6" }}></td>
            </tr>

            {/* Total Credit / Total Debit row (unchanged) */}
            <tr>
              <td colSpan={3} className="fw-bold text-end" style={{ backgroundColor: "#D0E9C6" }}>Total Credit</td>
              <td align="right" className="fw-bold" style={{ backgroundColor: "#D0E9C6" }}>{formatReadableAmount(formattedTotalCredit)}</td>
              <td colSpan={3} className="fw-bold text-end" style={{ backgroundColor: "#D0E9C6" }}>Total Debit</td>
              <td align="right" className="fw-bold" style={{ backgroundColor: "#D0E9C6" }}>{formatReadableAmount(totalDebit)}</td>
            </tr>
          </tbody>
        </table>

        <div className="centered-container">
          {pdfPreview && pdfPreview.length > 0 && (
            <PdfPreview pdfData={pdfPreview} apiData={reportData} label={"BalanceSheet"} />
          )}
        </div>
      </div>

      {loading && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999 }}>
          {/* <RingLoader size={80} /> */}
          <ScaleLoader color="#1005ad" height={35} width={4} radius={2} margin={2} />
        </div>
      )}
      {error && <div className="alert alert-danger">{error}</div>}
    </div>
  );
};

export default BalancesheetReport;
