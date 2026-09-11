
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

// const AgingAnalysisReport = () => {
//   const navigate = useNavigate();
//   const location = useLocation();

//   const searchParams = new URLSearchParams(location.search);
//   const fromDate = searchParams.get("fromDate");
//   const toDate = searchParams.get("toDT");
//   const acCode = searchParams.get("acCode");
//   const lotNo = searchParams.get("lotNo");
//   const accountType = searchParams.get("accountType");
//   const Group_code = searchParams.get("Group_code");

//   const companyCode = sessionStorage.getItem("Company_Code");
//   const Year_Code = sessionStorage.getItem("Year_Code");
//   const Company_Name = sessionStorage.getItem("Company_Name");
//   const Company_GSTNO = sessionStorage.getItem("Company_GSTNO");

//   const [reportData, setReportData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [pdfPreview, setPdfPreview] = useState(null);

//   // --- SORTING STATE ---
//   const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

//   const API_URL = `${apikey}/AgingAnalysis-Report-Debtors`;

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
//             Group_code: Group_code
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
//   }, [toDate, companyCode, Year_Code, API_URL, Group_code]);

//   const requestSort = (key) => {
//     let direction = 'asc';
//     if (sortConfig.key === key && sortConfig.direction === 'asc') {
//       direction = 'desc';
//     }
//     setSortConfig({ key, direction });
//   };

//   // Helper for UI Sort Icons
//   const renderSortIcon = (columnKey) => {
//     if (sortConfig.key === columnKey) {
//       return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
//     }
//     return ' ↕';
//   };

//   const groupReportData = (data) => {
//     const map = new Map();
//     data.forEach((item) => {
//       const key = String(item.Ac_code ?? "");
//       if (!map.has(key)) map.set(key, []);
//       map.get(key).push(item);
//     });

//     let groupedArr = Array.from(map.entries()).map(([key, items]) => {
//       return { key, items };
//     });

//     if (sortConfig.key !== null) {
//       groupedArr.sort((a, b) => {
//         let valA, valB;
//         if (['Ac_code', 'Ac_name', 'City_name'].includes(sortConfig.key)) {
//           valA = (a.items[0][sortConfig.key] || "").toString().toLowerCase();
//           valB = (b.items[0][sortConfig.key] || "").toString().toLowerCase();
//         } else {
//           // Sort by the sum of values in that bucket for the group
//           valA = a.items.reduce((sum, it) => sum + getNum(it[sortConfig.key]), 0);
//           valB = b.items.reduce((sum, it) => sum + getNum(it[sortConfig.key]), 0);
//         }
//         if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
//         if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
//         return 0;
//       });
//     }
//     return groupedArr;
//   };

//   const sortedGroupedData = useMemo(
//     () => groupReportData(reportData),
//     [reportData, sortConfig]
//   );

//   const grandTotals = useMemo(() => {
//     const base = { balance: 0 };
//     BUCKETS.forEach((b) => (base[b.key] = 0));
//     return reportData.reduce((acc, item) => {
//       acc.balance += getNum(item.Balance);
//       BUCKETS.forEach((b) => { acc[b.key] += getNum(item[b.key]); });
//       return acc;
//     }, base);
//   }, [reportData, BUCKETS]);

//   // Handle Print - Uses the table as rendered in UI (which is already sorted)
//   const handlePrint = () => {
//     const tableEl = document.getElementById("reportTable");
//     if (!tableEl) return;
//     const win = window.open("", "", "height=700,width=1000");
//     const asOnDate = `As On: ${toDate ? FormaDateBalanceSheet(toDate) : ""}`;

//     win.document.write(`
//       <html>
//         <head>
//           <title>Aging Analysis</title>
//           <style>
//             body { font-family: Arial; padding: 20px; }
//             table { width: 100%; border-collapse: collapse; font-size: 10px; }
//             th, td { border: 1px solid black; padding: 5px; text-align: left; }
//             th { background-color: #f2f2f2; }
//             .num { text-align: right; }
//             .company-header { text-align: center; font-weight: bold; font-size: 16px; }
//           </style>
//         </head>
//         <body>
//           <div class="company-header">${Company_Name}</div>
//           <div style="text-align:center;">Aging Analysis - Debtors</div>
//           <div style="text-align:right;">${asOnDate}</div>
//           ${tableEl.outerHTML}
//         </body>
//       </html>
//     `);
//     win.document.close();
//     win.print();
//   };

//   // Generate PDF - Uses sortedGroupedData for correct sequence
//   const generatePdf = () => {
//     const doc = new jsPDF('l', 'mm', 'a4');
//     doc.text(Company_Name, 14, 10);
//     doc.setFontSize(10);
//     doc.text(`Aging Analysis - Debtors | As On: ${toDate}`, 14, 16);

//     doc.autoTable({
//       html: "#reportTable",
//       startY: 20,
//       styles: { fontSize: 7 },
//       headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] }
//     });

//     const pdfBlob = doc.output("blob");
//     setPdfPreview(URL.createObjectURL(pdfBlob));
//   };

//   // Export to Excel - Uses sortedGroupedData for correct sequence
//   const handleExportToExcel = () => {
//     const wb = XLSX.utils.book_new();
//     const wsData = [];

//     wsData.push([Company_Name]);
//     wsData.push([`Aging Analysis - Debtors (As On: ${toDate})`]);
//     wsData.push([]);
//     wsData.push(["A/c Code", "A/c Name", "City Name", ...BUCKETS.map(b => b.label), "Balance"]);

//     // Iterate through the SORTED sequence
//     sortedGroupedData.forEach(({ items }) => {
//       items.forEach(item => {
//         wsData.push([
//           item.Ac_code,
//           item.Ac_name,
//           item.City_name,
//           ...BUCKETS.map(b => getNum(item[b.key])),
//           getNum(item.Balance)
//         ]);
//       });
//     });

//     wsData.push([]);
//     wsData.push(["", "", "Grand Total", ...BUCKETS.map(b => grandTotals[b.key]), grandTotals.balance]);

//     const ws = XLSX.utils.aoa_to_sheet(wsData);
//     XLSX.utils.book_append_sheet(wb, ws, "Sorted Aging");
//     XLSX.writeFile(wb, "Aging_Debtors_Sorted.xlsx");
//   };

//   return (
//     <div style={{ marginTop: "-10px" }}>
//       <div className="d-flex justify-content-between align-items-center">
//         <div style={{ flex: 1, textAlign: "center", marginLeft: "280px" }}>
//           <Typography variant="h6" style={{ fontSize: "20px", fontWeight: "bold" }}>
//             Aging Analysis - Debtors
//           </Typography>
//         </div>
//         <div className="d-flex justify-content-end">
//           <PrintButton disabledFeild={""} fetchData={handlePrint} />
//           <button className="btn btn-success me-2" onClick={handleExportToExcel}>Export to Excel</button>
//         </div>
//       </div>

//       {loading ? (
//         <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}><RingLoader /></div>
//       ) : error ? (
//         <div className="alert alert-danger">{error}</div>
//       ) : (
//         <div style={{ maxHeight: "800px", overflowY: "auto" }}>
//           <table className="table table-striped table-bordered mt-4" id="reportTable" style={{ marginBottom: "60px", width: "100%" }}>
//             <thead className="table-light" style={{ position: "sticky", top: 0, backgroundColor: "#fff", zIndex: 1 }}>
//               <tr style={{ cursor: 'pointer' }}>
//                 <th onClick={() => requestSort('Ac_code')}>
//                   A/c Code <span style={{ color: '#aaa' }}>{renderSortIcon('Ac_code')}</span>
//                 </th>
//                 <th onClick={() => requestSort('Ac_name')}>
//                   A/c Name <span style={{ color: '#aaa' }}>{renderSortIcon('Ac_name')}</span>
//                 </th>
//                 <th onClick={() => requestSort('City_name')}>
//                   City Name <span style={{ color: '#aaa' }}>{renderSortIcon('City_name')}</span>
//                 </th>
//                 {BUCKETS.map((b) => (
//                   <th key={b.key} onClick={() => requestSort(b.key)}>
//                     {b.label} <span style={{ color: '#aaa' }}>{renderSortIcon(b.key)}</span>
//                   </th>
//                 ))}
//                 <th onClick={() => requestSort('Balance')}>
//                   Balance <span style={{ color: '#aaa' }}>{renderSortIcon('Balance')}</span>
//                 </th>
//               </tr>
//             </thead>
//             <tbody>
//               {sortedGroupedData.map(({ key, items }) => (
//                 <React.Fragment key={key}>
//                   {items.map((item, index) => (
//                     <tr key={index}>
//                       <td>{item.Ac_code}</td>
//                       <td align="left">{item.Ac_name}</td>
//                       <td align="left">{item.City_name}</td>
//                       {BUCKETS.map((b) => (
//                         <td key={b.key} align="right">{formatReadableAmount(getNum(item[b.key]).toFixed(2))}</td>
//                       ))}
//                       <td style={{ fontWeight: "bold" }} align="right">
//                         {formatReadableAmount(getNum(item.Balance).toFixed(2))}
//                       </td>
//                     </tr>
//                   ))}
//                 </React.Fragment>
//               ))}
//               <tr className="total-row" style={{ fontWeight: "bold", background: "#f8f9fa" }}>
//                 <td colSpan={3} align="right">Grand Total:</td>
//                 {BUCKETS.map((b) => (
//                   <td key={b.key} align="right">{formatReadableAmount(grandTotals[b.key].toFixed(2))}</td>
//                 ))}
//                 <td align="right">{formatReadableAmount(grandTotals.balance.toFixed(2))}</td>
//               </tr>
//             </tbody>
//           </table>
//         </div>
//       )}

//       {pdfPreview && (
//         <div className="centered-container">
//           <PdfPreview pdfData={pdfPreview} apiData={reportData} label={"AgingAnalysis"} />
//         </div>
//       )}
//     </div>
//   );
// };

// export default AgingAnalysisReport;












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

const AgingAnalysisReport = () => {
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

  const API_URL = `${apikey}/AgingAnalysis-Report-Debtors`;

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

    const base = { balance: 0,misc: 0, };
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
          <title>Aging Analysis</title>
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
    doc.text(`Aging Analysis - Debtors | As On: ${toDate}`, 14, 16);

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
    wsData.push([`Aging Analysis - Debtors (As On: ${toDate})`]);
    wsData.push([]);
    wsData.push(["A/c Code", "A/c Name", "City Name", ...BUCKETS.map(b => b.label), "Misc","Balance"]);

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
    wsData.push(["", "", "Grand Total", ...BUCKETS.map(b => grandTotals[b.key]), grandTotals.misc,grandTotals.balance]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Sorted Aging");
    XLSX.writeFile(wb, "Aging_Debtors_Sorted.xlsx");
  };


  const handleRowClick = (acCode) => {
        setLoading(true);
        setTimeout(() => {
            const url = `/AgingAnalysisBalance-Report?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&acCode=${encodeURIComponent(acCode)}&Company_Code=${companyCode}`;
            window.open(url, '_blank', 'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600');
            setLoading(false);
        }, 500);
    };

  return (
    <div style={{ marginTop: "-10px" }}>
      <div className="d-flex justify-content-between align-items-center">
        <div style={{ flex: 1, textAlign: "center", marginLeft: "280px" }}>
          <Typography variant="h6" style={{ fontSize: "20px", fontWeight: "bold" }}>
            Aging Analysis - Debtors
          </Typography>
        </div>
        <div className="d-flex justify-content-end">
          <PrintButton disabledFeild={""} fetchData={handlePrint} />
          <button className="btn btn-success me-2" onClick={handleExportToExcel}>Export to Excel</button>
        </div>
      </div>
       <div className="d-flex justify-content-between align-items-center">
          <Typography variant="h6" style={{ fontSize: "20px", fontWeight: "bold" }}>
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
                      <td onClick={() => handleRowClick(item.Ac_code)} style={{ cursor: "pointer", verticalAlign: "top", backgroundColor: "#D0E9C6", fontStyle: "italic" }}>{item.Ac_code}</td>
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

export default AgingAnalysisReport;

