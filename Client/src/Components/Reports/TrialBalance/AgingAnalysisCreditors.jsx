// import React, { useState, useEffect, useMemo } from "react";
// import axios from "axios";
// import * as XLSX from "xlsx";
// import { jsPDF } from "jspdf";
// import "jspdf-autotable";
// import { useNavigate, useLocation } from "react-router-dom";
// import PdfPreview from "../../../Common/PDFPreview";
// import { RingLoader } from "react-spinners";
// import { Typography } from "@mui/material";
// import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate";
// import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
// import PrintButton from "../../../Common/Buttons/PrintPDF";

// const apikey = process.env.REACT_APP_API;

// const AgingAnalysisReportCreditors = () => {
//   const navigate = useNavigate();
//   const location = useLocation();

//   const searchParams = new URLSearchParams(location.search);
//   const fromDate = searchParams.get("fromDate");
//   const toDate = searchParams.get("toDate");
//   const acCode = searchParams.get("acCode");
//   const lotNo = searchParams.get("lotNo");
//   const accountType = searchParams.get("accountType");

//   const companyCode = sessionStorage.getItem("Company_Code");
//   const Year_Code = sessionStorage.getItem("Year_Code");
//   const Company_Name = sessionStorage.getItem("Company_Name");
//   const Company_GSTNO = sessionStorage.getItem("Company_GSTNO");

//   const [reportData, setReportData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [pdfPreview, setPdfPreview] = useState(null);

//   // ✅ Change endpoint for Creditors
//   const API_URL = `${apikey}/AgingAnalysis-Report-Creditors`;

//   // ✅ Must match SP aliases exactly
//   const BUCKETS = useMemo(
//     () => [
//       { key: "0_30", label: "0-30" },
//       { key: "31_45", label: "31-45" },
//       { key: "46_90", label: "46-90" },
//       { key: "91_180", label: "91-180" },
//       { key: "181_1yr", label: "181-1yr" },
//       { key: "1yr_3yr", label: "1yr-3yr" },
//       { key: "3y_Above", label: "3yr & Above" },
//     ],
//     []
//   );

//   const getNum = (v) => {
//     const n = parseFloat(v);
//     return Number.isFinite(n) ? n : 0;
//   };

//   useEffect(() => {
//     const fetchReportData = async () => {
//       setLoading(true);
//       setError("");
//       try {
//         const response = await axios.get(API_URL, {
//           params: {
//             toDT: toDate,
//             Company_Code: companyCode,
//             // optional filters if you add backend support later:
//             // fromDT: fromDate,
//             // acCode,
//             // lotNo,
//             // accountType,
//           },
//         });

//         setReportData(Array.isArray(response.data) ? response.data : []);
//       } catch (err) {
//         console.error("Error fetching report:", err);
//         setError("Error fetching report");
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (toDate && companyCode) {
//       fetchReportData();
//     }
//   }, [toDate, companyCode, Year_Code, API_URL]);

//   // ✅ Group into ARRAY and sort by 3y_Above DESC
//   const groupReportData = (data) => {
//     const map = new Map();

//     data.forEach((item) => {
//       const key = String(item.Ac_code ?? "");
//       if (!map.has(key)) map.set(key, []);
//       map.get(key).push(item);
//     });

//     const groupedArr = Array.from(map.entries()).map(([key, items]) => {
//     const sortValue = items.reduce((s, it) => {
//       return (
//         s +
//         getNum(it["3y_Above"]) +
//         getNum(it["1yr_3yr"]) +
//         getNum(it["181_1yr"])
//       );
//     }, 0);

//     return { key, items, sortValue };
//   });


//     groupedArr.sort((a, b) => b.sortValue - a.sortValue);
//     return groupedArr;
//   };

//   const groupedReportData = useMemo(
//     () => groupReportData(reportData),
//     [reportData]
//   );

//   // ✅ Grand totals for buckets + balance only
//   const grandTotals = useMemo(() => {
//     const base = { balance: 0 };
//     BUCKETS.forEach((b) => (base[b.key] = 0));

//     return reportData.reduce((acc, item) => {
//       acc.balance += getNum(item.Balance);
//       BUCKETS.forEach((b) => {
//         acc[b.key] += getNum(item[b.key]);
//       });
//       return acc;
//     }, base);
//   }, [reportData, BUCKETS]);

//   // ✅ Improved print for clean layout
//   const handlePrint = () => {
//     const tableEl = document.getElementById("reportTable");
//     if (!tableEl) return;

//     const printContent = tableEl.outerHTML;
//     const win = window.open("", "", "height=700,width=1000");

//     win.document.write(`
//       <html>
//         <head>
//           <title>Aging Analysis - Creditors</title>
//           <style>
//             body { font-family: Arial, sans-serif; margin: 12px; color: #000; }
//             .company-name { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 4px; }
//             .report-title { text-align: center; font-size: 13px; font-weight: 600; margin-bottom: 12px; }
//             table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 10.5px; }
//             th, td { border: 1px solid #000; padding: 4px 6px; vertical-align: top; word-wrap: break-word; }
//             th { background: #f2f2f2; font-weight: bold; white-space: nowrap; }
//             td.num, th.num { text-align: right; }
//             thead { position: static !important; }
//             .total-row { font-weight: bold; background: #eaeaea; }

//             @media print {
//               @page { size: A4 landscape; margin: 8mm; }
//               body { margin: 0; }
//               table { font-size: 10px; }
//               th, td { padding: 3px 5px; }
//             }
//           </style>
//         </head>
//         <body>
//           <div class="company-name">${Company_Name || ""}</div>
//           <div class="report-title">Aging Analysis - Creditors</div>
//           ${printContent}

//           <script>
//             (function() {
//               const table = document.querySelector("table");
//               if (!table) return;

//               const headers = Array.from(table.querySelectorAll("thead th"));
//               const numericHeaderIndexes = [];

//               headers.forEach((th, i) => {
//                 const txt = (th.innerText || "").toLowerCase();
//                 if (
//                   txt.includes("0-30") ||
//                   txt.includes("31-45") ||
//                   txt.includes("46-90") ||
//                   txt.includes("91-180") ||
//                   txt.includes("181-1yr") ||
//                   txt.includes("1yr-3yr") ||
//                   txt.includes("3yr") ||
//                   txt.includes("above") ||
//                   txt.includes("balance")
//                 ) {
//                   numericHeaderIndexes.push(i);
//                   th.classList.add("num");
//                 }
//               });

//               const rows = Array.from(table.querySelectorAll("tbody tr"));
//               rows.forEach(tr => {
//                 const cells = Array.from(tr.children);
//                 numericHeaderIndexes.forEach(idx => {
//                   if (cells[idx]) cells[idx].classList.add("num");
//                 });
//               });
//             })();
//           </script>
//         </body>
//       </html>
//     `);

//     win.document.close();
//     win.focus();
//     win.print();
//   };

//   const generatePdf = () => {
//     const doc = new jsPDF();
//     const pageWidth = doc.internal.pageSize.getWidth();

//     const title = "Aging Analysis - Creditors";
//     const company = Company_Name || "";

//     const companyTextWidth = doc.getTextWidth(company);
//     const titleTextWidth = doc.getTextWidth(title);

//     doc.text(company, (pageWidth - companyTextWidth) / 2, 10);
//     doc.setFontSize(11);
//     doc.text(title, (pageWidth - titleTextWidth) / 2, 16);
//     doc.setFontSize(10);

//     doc.autoTable({
//       html: "#reportTable",
//       startY: 22,
//     });

//     const pdfBlob = doc.output("blob");
//     const url = URL.createObjectURL(pdfBlob);
//     setPdfPreview(url);
//   };

//   const handleExportToExcel = () => {
//     const wb = XLSX.utils.book_new();
//     const wsData = [];

//     wsData.push([Company_Name || ""]);
//     wsData.push([
//       `From: ${fromDate ? FormaDateBalanceSheet(fromDate) : ""} To: ${
//         toDate ? FormaDateBalanceSheet(toDate) : ""
//       }`,
//     ]);
//     wsData.push([]);
//     wsData.push(["Aging Analysis Report - Creditors"]);
//     wsData.push([]);

//     wsData.push([
//       "A/c Code",
//       "A/c Name",
//       "City Name",
//       ...BUCKETS.map((b) => b.label),
//       "Balance",
//     ]);

//     groupedReportData.forEach(({ items }) => {
//       items.forEach((item) => {
//         wsData.push([
//           item.Ac_code ?? "",
//           item.Ac_name ?? "",
//           item.City_name ?? "",
//           ...BUCKETS.map((b) => getNum(item[b.key])),
//           getNum(item.Balance),
//         ]);
//       });
//       wsData.push([]);
//     });

//     wsData.push([
//       "",
//       "",
//       "Grand Total",
//       ...BUCKETS.map((b) => grandTotals[b.key].toFixed(2)),
//       grandTotals.balance.toFixed(2),
//     ]);

//     const ws = XLSX.utils.aoa_to_sheet(wsData);

//     ws["!cols"] = [
//       { wch: 10 },
//       { wch: 25 },
//       { wch: 20 },
//       ...BUCKETS.map(() => ({ wch: 12 })),
//       { wch: 15 },
//     ];

//     XLSX.utils.book_append_sheet(wb, ws, "AgingAnalysisCreditors");
//     XLSX.writeFile(wb, "AgingAnalysis_Creditors.xlsx");
//   };

//   return (
//     <div style={{ marginTop: "-10px" }}>
//       <div className="d-flex justify-content-between align-items-center">
//         <div style={{ flex: 1, textAlign: "center", marginLeft: "280px" }}>
//           <Typography
//             variant="h6"
//             style={{ textAlign: "center", fontSize: "20px", fontWeight: "bold" }}
//           >
//             Aging Analysis - Creditors
//           </Typography>
//         </div>

//         <div className="d-flex justify-content-end">
//           <PrintButton disabledFeild={""} fetchData={handlePrint} />
//           <button className="btn btn-success me-2" onClick={handleExportToExcel}>
//             Export to Excel
//           </button>
//           <button className="btn btn-secondary" onClick={generatePdf}>
//             PDF
//           </button>
//         </div>
//       </div>

//       {loading ? (
//         <div
//           className="d-flex justify-content-center align-items-center"
//           style={{ height: "50vh" }}
//         >
//           <RingLoader />
//         </div>
//       ) : error ? (
//         <div className="alert alert-danger">{error}</div>
//       ) : (
//         <div style={{ maxHeight: "800px", overflowY: "auto" }}>
//           <table
//             className="table table-striped table-bordered mt-4"
//             id="reportTable"
//             style={{ marginBottom: "60px", width: "100%" }}
//           >
//             <thead
//               className="table-light"
//               style={{
//                 position: "sticky",
//                 top: 0,
//                 backgroundColor: "#fff",
//                 zIndex: 1,
//                 whiteSpace: "nowrap",
//               }}
//             >
//               <tr>
//                 <th>A/c Code</th>
//                 <th>A/c Name</th>
//                 <th>City Name</th>
//                 {BUCKETS.map((b) => (
//                   <th key={b.key}>{b.label}</th>
//                 ))}
//                 <th>Balance</th>
//               </tr>
//             </thead>

//             <tbody>
//               {groupedReportData.map(({ key, items }) => (
//                 <React.Fragment key={key}>
//                   {items.map((item, index) => (
//                     <tr key={index}>
//                       <td>{item.Ac_code}</td>
//                       <td align="left">{item.Ac_name}</td>
//                       <td>{item.City_name}</td>

//                       {BUCKETS.map((b) => (
//                         <td key={b.key} align="right">
//                           {formatReadableAmount(getNum(item[b.key]).toFixed(2))}
//                         </td>
//                       ))}

//                       <td style={{ fontWeight: "bold" }} align="right">
//                         {formatReadableAmount(getNum(item.Balance).toFixed(2))}
//                       </td>
//                     </tr>
//                   ))}
//                 </React.Fragment>
//               ))}

//               <tr className="total-row">
//                 <td colSpan={3} align="right">
//                   Grand Total:
//                 </td>

//                 {BUCKETS.map((b) => (
//                   <td key={b.key} align="right">
//                     {formatReadableAmount(grandTotals[b.key].toFixed(2))}
//                   </td>
//                 ))}

//                 <td align="right">
//                   {formatReadableAmount(grandTotals.balance.toFixed(2))}
//                 </td>
//               </tr>
//             </tbody>
//           </table>
//         </div>
//       )}

//       {pdfPreview && (
//         <div className="centered-container">
//           <PdfPreview
//             pdfData={pdfPreview}
//             apiData={reportData}
//             label={"AgingAnalysisCreditors"}
//           />
//         </div>
//       )}
//     </div>
//   );
// };

// export default AgingAnalysisReportCreditors;









import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { useNavigate, useLocation } from "react-router-dom";
import PdfPreview from "../../../Common/PDFPreview";
import { RingLoader } from "react-spinners";
import { Typography } from "@mui/material";
import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import PrintButton from "../../../Common/Buttons/PrintPDF";

const apikey = process.env.REACT_APP_API;

const AgingAnalysisReportCreditors = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDT");
  const acCode = searchParams.get("acCode");
  const lotNo = searchParams.get("lotNo");
  const accountType = searchParams.get("accountType");
  const Group_code = searchParams.get("Group_code");
  const Groupname = searchParams.get("Groupname");


  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");
  const Company_Name = sessionStorage.getItem("Company_Name");
  const Company_GSTNO = sessionStorage.getItem("Company_GSTNO");

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pdfPreview, setPdfPreview] = useState(null);

  // --- SORTING STATE ---
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const API_URL = `${apikey}/AgingAnalysis-Report-Creditors`;

  const BUCKETS = useMemo(
    () => [
      { key: "0_30", label: "0-30" },
      { key: "31_45", label: "31-45" },
      { key: "46_90", label: "46-90" },
      { key: "91_180", label: "91-180" },
      { key: "181_1yr", label: "181-1yr" },
      { key: "1yr_3yr", label: "1yr-3yr" },
      { key: "3y_Above", label: "3yr & Above" },

    ],
    []
  );

  const getNum = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(API_URL, {
          params: {
            toDT: toDate,
            Company_Code: companyCode,
            Group_code: Group_code
          },
        });
        setReportData(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error("Error fetching report:", err);
        setError("Error fetching report");
      } finally {
        setLoading(false);
      }
    };

    if (toDate && companyCode) {
      fetchReportData();
    }
  }, [toDate, companyCode, Year_Code, API_URL, Group_code]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Helper for UI Sort Icons
  const renderSortIcon = (columnKey) => {
    if (sortConfig.key === columnKey) {
      return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
    }
    return ' ↕';
  };

  const groupReportData = (data) => {
    const map = new Map();
    data.forEach((item) => {
      const key = String(item.Ac_code ?? "");
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });

    let groupedArr = Array.from(map.entries()).map(([key, items]) => {
      return { key, items };
    });

    if (sortConfig.key !== null) {
      groupedArr.sort((a, b) => {
        let valA, valB;
        if (['Ac_code', 'Ac_name', 'City_name'].includes(sortConfig.key)) {
          valA = (a.items[0][sortConfig.key] || "").toString().toLowerCase();
          valB = (b.items[0][sortConfig.key] || "").toString().toLowerCase();
        } else {
          // Sort by the sum of values in that bucket for the group
          valA = a.items.reduce((sum, it) => sum + getNum(it[sortConfig.key]), 0);
          valB = b.items.reduce((sum, it) => sum + getNum(it[sortConfig.key]), 0);
        }
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return groupedArr;
  };

  const sortedGroupedData = useMemo(
    () => groupReportData(reportData),
    [reportData, sortConfig]
  );

  const grandTotals = useMemo(() => {

    const base = { balance: 0, misc: 0, };
    BUCKETS.forEach((b) => (base[b.key] = 0));
    return reportData.reduce((acc, item) => {
      const bal = getNum(item.Balance);   // 👈 define variable properly

      acc.balance += bal;

      if (bal < 0) {
        acc.misc += bal;
      }

      BUCKETS.forEach((b) => { acc[b.key] += getNum(item[b.key]); });
      return acc;
    }, base);
  }, [reportData, BUCKETS]);

  // Handle Print - Uses the table as rendered in UI (which is already sorted)
  const handlePrint = () => {
    const tableEl = document.getElementById("reportTable");
    if (!tableEl) return;
    const win = window.open("", "", "height=700,width=1000");
    const asOnDate = `As On: ${toDate ? FormaDateBalanceSheet(toDate) : ""}`;

    win.document.write(`
      <html>
        <head>
          <title>Aging Analysis Creditors</title>
          <style>
            body { font-family: Arial; padding: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 10px; }
            th, td { border: 1px solid black; padding: 5px; text-align: left; }
            th { background-color: #f2f2f2; }
            .num { text-align: right; }
            .company-header { text-align: center; font-weight: bold; font-size: 16px; }
          </style>
        </head>
        <body>
          <div class="company-header">${Company_Name}</div>
          <div style="text-align:center;">Aging Analysis - Debtors</div>
           <div style="text-align:right;">Aging Analysis ${Groupname} upto ${asOnDate}</div>
          ${tableEl.outerHTML}
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  // Generate PDF - Uses sortedGroupedData for correct sequence
  const generatePdf = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.text(Company_Name, 14, 10);
    doc.setFontSize(10);
    doc.text(`Aging Analysis - Creditors | As On: ${toDate}`, 14, 16);

    doc.autoTable({
      html: "#reportTable",
      startY: 20,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] }
    });

    const pdfBlob = doc.output("blob");
    setPdfPreview(URL.createObjectURL(pdfBlob));
  };

  // Export to Excel - Uses sortedGroupedData for correct sequence
  const handleExportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const wsData = [];

    wsData.push([Company_Name]);
    wsData.push([`Aging Analysis - Creditors (As On: ${toDate})`]);
    wsData.push([]);
    wsData.push(["A/c Code", "A/c Name", "City Name", ...BUCKETS.map(b => b.label), "Misc", "Balance"]);

    // Iterate through the SORTED sequence
    sortedGroupedData.forEach(({ items }) => {
      items.forEach(item => {
        wsData.push([
          item.Ac_code,
          item.Ac_name,
          item.City_name,
          ...BUCKETS.map(b => getNum(item[b.key])),
          item.Balance < 0 ? item.Balance : 0,
          getNum(item.Balance)
        ]);
      });
    });

    wsData.push([]);
    wsData.push(["", "", "Grand Total", ...BUCKETS.map(b => grandTotals[b.key]), grandTotals.misc, grandTotals.balance]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Sorted Aging");
    XLSX.writeFile(wb, "Aging_Creditors_Sorted.xlsx");
  };

  return (
    <div style={{ marginTop: "-60px" }}>
      <div className="d-flex justify-content-between align-items-center">
        <div style={{ flex: 1, textAlign: "center", marginLeft: "280px" }}>
          <Typography variant="h6" align="center" sx={{ fontWeight: 'bold', fontSize: '22px' }}>
            {Company_Name}
          </Typography>
          <Typography variant="h6" style={{ fontSize: "18px", fontWeight: "bold" }}>
            Aging Analysis - Creditors
          </Typography>
        </div>
        <div className="d-flex justify-content-end">
          <PrintButton disabledFeild={""} fetchData={handlePrint} />
          <button className="btn btn-success me-2" onClick={handleExportToExcel}>Export to Excel</button>
        </div>
      </div>
      <div className="d-flex justify-content-between align-items-center">
        <Typography variant="h6" style={{ fontSize: "18px", fontWeight: "bold" }}>
          Aging Analysis {Groupname} upto  {toDate ? FormaDateBalanceSheet(toDate) : ""}
        </Typography>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}><RingLoader /></div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <div style={{ maxHeight: "800px", overflowY: "auto" }}>
          <table className="table table-striped table-bordered mt-4" id="reportTable" style={{ marginBottom: "60px", width: "100%" }}>
            <thead className="table-light" style={{ position: "sticky", top: 0, backgroundColor: "#fff", zIndex: 1 }}>
              <tr style={{ cursor: 'pointer' }}>
                <th onClick={() => requestSort('Ac_code')}>
                  A/c Code <span style={{ color: '#aaa' }}>{renderSortIcon('Ac_code')}</span>
                </th>
                <th onClick={() => requestSort('Ac_name')}>
                  A/c Name <span style={{ color: '#aaa' }}>{renderSortIcon('Ac_name')}</span>
                </th>
                <th onClick={() => requestSort('City_name')}>
                  City Name <span style={{ color: '#aaa' }}>{renderSortIcon('City_name')}</span>
                </th>
                {BUCKETS.map((b) => (
                  <th key={b.key} onClick={() => requestSort(b.key)}>
                    {b.label} <span style={{ color: '#aaa' }}>{renderSortIcon(b.key)}</span>
                  </th>
                ))}
                <th onClick={() => requestSort('Misc')}>
                  Misc <span style={{ color: '#aaa' }}>{renderSortIcon('Misc')}</span>
                </th>
                <th onClick={() => requestSort('Balance')}>
                  Balance <span style={{ color: '#aaa' }}>{renderSortIcon('Balance')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedGroupedData.map(({ key, items }) => (
                <React.Fragment key={key}>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.Ac_code}</td>
                      <td align="left">{item.Ac_name}</td>
                      <td align="left">{item.City_name}</td>
                      {BUCKETS.map((b) => (
                        <td key={b.key} align="right">{formatReadableAmount(getNum(item[b.key]).toFixed(2))}</td>
                      ))}

                      <td style={{ fontWeight: "bold" }} align="right">
                        {formatReadableAmount(getNum(item.Balance) < 0
                          ? getNum(item.Balance)
                          : "0.00")}
                      </td>
                      <td style={{ fontWeight: "bold" }} align="right">
                        {formatReadableAmount(getNum(item.Balance).toFixed(2))}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
              <tr className="total-row" style={{ fontWeight: "bold", background: "#f8f9fa" }}>
                <td colSpan={3} align="right">Grand Total:</td>
                {BUCKETS.map((b) => (
                  <td key={b.key} align="right">{formatReadableAmount(grandTotals[b.key].toFixed(2))}</td>
                ))}
                <td align="right">{formatReadableAmount(grandTotals.misc.toFixed(2))}</td>
                <td align="right">{formatReadableAmount(grandTotals.balance.toFixed(2))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {pdfPreview && (
        <div className="centered-container">
          <PdfPreview pdfData={pdfPreview} apiData={reportData} label={"AgingAnalysis"} />
        </div>
      )}
    </div>
  );
};

export default AgingAnalysisReportCreditors;


