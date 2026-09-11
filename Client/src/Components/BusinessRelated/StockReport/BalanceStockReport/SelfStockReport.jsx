import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import * as XLSX from "xlsx";
import PdfPreview from '../../../../Common/PDFPreview';
import { ScaleLoader } from 'react-spinners';
import { Typography, Button,Box } from '@mui/material';
import PrintButton from "../../../../Common/Buttons/PrintPDF";
import { formatReadableAmount } from "../../../../Common/FormatFunctions/FormatAmount";
import SearchBar from "../../../../Common/UtilityCommon/SearchBar";
import BackButton from "../../../../Common/Buttons/BackButton";

// Common PDF Utilities (As used in Sale Register)
import { generateReportPDF } from "../../../../Common/ReportCommon/CommonPDFGenerator";
import { FormaDateBalanceSheet } from "../../../../Common/FormatFunctions/FormatDate";
import { ConvertNumberToWord } from "../../../../Common/FormatFunctions/ConvertNumberToWord";

// Assets
import HeaderJK from '../../../../Assets/HeaderJK.png';
import FooterJK from '../../../../Assets/FooterJK.png';

const API_URL = process.env.REACT_APP_API;

const SelfStockReport = () => {
  const companyName = sessionStorage.getItem("Company_Name");
  const Company_GSTNO = sessionStorage.getItem('Company_GSTNO');
  const AccountYear = sessionStorage.getItem('Accounting_Year');

  const [groupedData, setGroupedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pdfPreview, setPdfPreview] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [dueData, setDueData] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectType, setSelectType] = useState('Mill Wise');
  const [receiptPaymentType, setReceiptPaymentType] = useState('Against Sauda');
  const [millPendingRows, setMillPendingRows] = useState([]);
  const [sundryDebtorsTotals, setSundryDebtorsTotals] = useState(null);
  const [sundryCreditorsTotals, setSundryCreditorsTotals] = useState(null);
  const [sbLoading, setSbLoading] = useState(false);
  const [dailyDispatch, setDailyDispatch] = useState([]);
  const [ddLoading, setDdLoading] = useState(false);
  const [selectedSections, setSelectedSections] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [stockRes, dueRes] = await Promise.all([
          axios.get(`${API_URL}/self-stock-report`, {
            params: {
              Company_Code: sessionStorage.getItem("Company_Code"),
              Year_Code: sessionStorage.getItem("Year_Code"),
            },
          }),
          axios.get(`${API_URL}/mill_lot_due_summary`, {
            params: { Company_Code: sessionStorage.getItem("Company_Code") },
          })
        ]);

        groupByBuyerName(stockRes.data);
        setDueData(dueRes.data.data || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  

  useEffect(() => {
    if (AccountYear) {
      const dates = AccountYear.split(' - ');
      if (dates.length === 2) {
        setFromDate(dates[0]);
        setToDate(dates[1]);
      }
    }
  }, [AccountYear]);

  
  const calculateGrandTotals = (data) => {
    const totals = {
      totalQuintal: 0,
      totalDispatch: 0,
      totalBalance: 0,
    };
    data.forEach(group => {
      group.details.forEach(record => {
        totals.totalQuintal += parseFloat(record.Buyer_Quantal || 0);
        totals.totalDispatch += parseFloat(record.DESPATCH || 0);
        totals.totalBalance += parseFloat(record.BALANCE || 0);
      });
    });
    return totals;
  };

  const groupByBuyerName = (data) => {
    const grouped = data.reduce((acc, curr) => {
      if (parseFloat(curr.BALANCE) !== 0) {
        if (!acc[curr.buyername]) {
          acc[curr.buyername] = { buyername: curr.buyername, details: [], totalBalance: 0 };
        }
        acc[curr.buyername].details.push(curr);
        acc[curr.buyername].totalBalance += parseFloat(curr.BALANCE);
      }
      return acc;
    }, {});
    setGroupedData(Object.values(grouped));
  };

  const sortData = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    const sortedData = [...groupedData];
    sortedData.forEach(group => {
      group.details.sort((a, b) => {
        if (key === "Tender_No" || key === "Grade") {
          if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
          if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
          return 0;
        } else {
          if (parseFloat(a[key] || 0) < parseFloat(b[key] || 0)) return direction === 'asc' ? -1 : 1;
          if (parseFloat(a[key] || 0) > parseFloat(b[key] || 0)) return direction === 'asc' ? 1 : -1;
          return 0;
        }
      });
    });
    setGroupedData(sortedData);
    setSortConfig({ key, direction });
  };

  const filteredData = groupedData
    .map(group => {
      const filteredDetails = group.details.filter(record =>
        Object.values(record).join(' ').toLowerCase().includes(searchQuery.toLowerCase())
      );
      return { ...group, details: filteredDetails };
    })
    .filter(group => group.details.length > 0);

const handleGeneratePDF = () => {
    const columns = ['Tender No', 'Mill Name', 'Grade', 'Mill Rate', 'Sale Rate', 'Quintal', 'Desp', 'Balance', 'Lifting', 'DO'];
    const rows = [];
    
    // Style for the Yellow Footer
    const yellowFooterStyle = { 
        fillColor: [255, 249, 196], 
        fontStyle: 'bold' 
    };

    filteredData.forEach((group) => {
      // Group Header Row (Light Gray)
      rows.push([
        { 
            content: `${group.buyername} (Total Bal: ${formatReadableAmount(group.totalBalance)})`, 
            colSpan: 10, // Updated to 10 to cover all columns
            styles: { fillColor: [240, 240, 240], fontStyle: 'bold' } 
        }
      ]);

      // Items Rows
      group.details.forEach(r => {
        rows.push([
          r.Tender_No,
          r.millshortname,
          r.Grade,
          { content: formatReadableAmount(r.Mill_Rate), styles: { halign: 'right' } },
          { content: formatReadableAmount(r.Sale_Rate), styles: { halign: 'right' } },
          { content: formatReadableAmount(r.Buyer_Quantal), styles: { halign: 'right' } },
          { content: formatReadableAmount(r.DESPATCH), styles: { halign: 'right' } },
          { content: formatReadableAmount(r.BALANCE), styles: { halign: 'right' } },
          r.Tender_Date,
          r.tenderdoshortname
        ]);
      });
    });

    const totals = calculateGrandTotals(filteredData);

    generateReportPDF({
      title: 'Self Stock Report',
      columns: columns,
      rows: rows,
      // Updated Footer with Yellow Background and Alignment
      footerRow: [
        { content: 'GRAND TOTAL', styles: yellowFooterStyle },
        { content: '', styles: yellowFooterStyle },
        { content: '', styles: yellowFooterStyle },
        { content: '', styles: yellowFooterStyle },
        { content: '', styles: yellowFooterStyle },
        { 
            content: formatReadableAmount(totals.totalQuintal), 
            styles: { ...yellowFooterStyle, halign: 'right' } 
        },
        { 
            content: formatReadableAmount(totals.totalDispatch), 
            styles: { ...yellowFooterStyle, halign: 'right' } 
        },
        { 
            content: formatReadableAmount(totals.totalBalance), 
            styles: { ...yellowFooterStyle, halign: 'right' } 
        },
        { content: '', styles: yellowFooterStyle },
        { content: '', styles: yellowFooterStyle }
      ],
      numericCols: [3, 4, 5, 6, 7],
      amountInWords: ConvertNumberToWord(totals.totalBalance),
      headerImgSrc: HeaderJK,
      footerImgSrc: FooterJK,
      orientation: 'landscape',
      onComplete: (url) => setPdfPreview(url),
    });
};

  const handleExportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const selfStockData = [["Buyer", "Tender No", "Mill", "Grade", "Mill Rate", "Sale Rate", "Quintal", "Desp", "Balance", "Lifting"]];

    filteredData.forEach(group => {
      group.details.forEach(r => {
        selfStockData.push([group.buyername, r.Tender_No, r.millshortname, r.Grade, r.Mill_Rate, r.Sale_Rate, r.Buyer_Quantal, r.DESPATCH, r.BALANCE, r.Tender_Date]);
      });
    });

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(selfStockData), "Self Stock");
    XLSX.writeFile(wb, "SelfStock_Report.xlsx");
  };

  return (
    <>
      <div style={{ position: 'relative', marginTop: "-60px" }}>
        <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", fontWeight: "bold" }}>Self Stock Report</Typography>

        <div className="d-flex justify-content-between align-items-center flex-wrap" style={{ gap: "10px" }}>
          <div style={{ flex: 1, minWidth: "250px", maxWidth: "1100px" }}>
            <SearchBar value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          <div className="d-flex flex-wrap align-items-center" style={{ gap: "8px" }}>
            {pdfPreview && <PdfPreview pdfData={pdfPreview} label={"Self Stock Report"} />}
            <PrintButton disabledFeild={""} fetchData={handleGeneratePDF} />
            <Button variant="outlined" color="secondary" onClick={handleExportToExcel}>
              Export to Excel
            </Button>
            <BackButton onClick={() => navigate('/dashboard')} />
          </div>
        </div>

        {error && <p className="text-danger">{error}</p>}

        <div id="reportContent" style={{ maxHeight: 'calc(100vh - 200px)', overflow: 'auto', border: '1px solid #e0e0e0' }}>
          <div id="selfStockSection">
            <table className="table" style={{ borderCollapse: "collapse", width: "100%", marginBottom: "50px" }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                <tr style={{ backgroundColor: "black", color: "white", textAlign: "center" }}>
                  {[{ label: "Tender No", key: "Tender_No" }, { label: "Mill Name", key: "millshortname" }, { label: "Grade", key: "Grade" }, { label: "Mill Rate", key: "Mill_Rate" }, { label: "Sale Rate", key: "Sale_Rate" }, { label: "Quintal", key: "Buyer_Quantal" }, { label: "Desp", key: "DESPATCH" }].map(col => (
                    <th key={col.key} onClick={() => sortData(col.key)} style={{ border: "1px solid white", padding: '8px', cursor: 'pointer' }}>
                      {col.label} {sortConfig.key === col.key ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </th>
                  ))}
                                <th style={{ border: "1px solid white", padding: '8px' }}>Balance</th>
                  <th style={{ border: "1px solid white", padding: '8px' }}>Lifting Date</th>
                     <th style={{ border: "1px solid white", padding: '8px' }}>DO</th>
    
                </tr>
              </thead>
              <tbody>
                {filteredData.map((group, groupIndex) => (
                  <React.Fragment key={groupIndex}>
                    <tr style={{ backgroundColor: "#f0f0f0", fontWeight: "bold" }}>
                      <td colSpan="9" style={{ textAlign: "left", padding: '8px' }}>
                        {group.buyername} (Total Balance: {formatReadableAmount(group.totalBalance.toFixed(2))})
                      </td>
                    </tr>
                    {group.details.map((record, recordIndex) => (
                      <tr key={recordIndex} style={{ textAlign: "center" }}>
                        <td style={{ border: "1px dashed black", padding: '8px' }}>{record.Tender_No}</td>
                        <td align="left" style={{ border: "1px dashed black", padding: '8px' }}>{record.millshortname}</td>
                        <td align="left" style={{ border: "1px dashed black", padding: '8px' }}>{record.Grade}</td>
                        <td align="right" style={{ border: "1px dashed black", padding: '8px' }}>{formatReadableAmount(record.Mill_Rate)}</td>
                        <td align="right" style={{ border: "1px dashed black", padding: '8px' }}>{formatReadableAmount(record.Sale_Rate)}</td>
                        <td align="right" style={{ border: "1px dashed black", padding: '8px' }}>{formatReadableAmount(record.Buyer_Quantal)}</td>
                        <td align="right" style={{ border: "1px dashed black", padding: '8px' }}>{record.DESPATCH}</td>
                                    <td align="right" style={{ border: "1px dashed black", padding: '8px' }}>{formatReadableAmount(record.BALANCE)}</td>
                        <td style={{ border: "1px dashed black", padding: '8px' }}>{record.Tender_Date}</td>
                        
                              <td align="left" style={{ border: "1px dashed black", padding: '8px' }}>{record.tenderdoshortname}</td>
            
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
                <tr style={{ backgroundColor: "#f0f0f0", fontWeight: "bold" }}>
                  <td colSpan="5" style={{ textAlign: "center", padding: '8px' }}>Grand Totals</td>
                  <td align="right" style={{ border: "1px dashed black", padding: '8px' }}>{formatReadableAmount(calculateGrandTotals(filteredData).totalQuintal.toFixed(2))}</td>
                  <td align="right" style={{ border: "1px dashed black", padding: '8px' }}>{formatReadableAmount(calculateGrandTotals(filteredData).totalDispatch.toFixed(2))}</td>
                  <td align="right" style={{ border: "1px dashed black", padding: '8px' }}>{formatReadableAmount(calculateGrandTotals(filteredData).totalBalance.toFixed(2))}</td>
                </tr>
              </tbody>
            </table>
          </div>
       {loading && (
        <Box style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: 'absolute', // Positioned relative to the parent Box
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.7)', // Semi-transparent overlay
            zIndex: 10 // Higher than sticky header (which is usually 2)
        }}>
            <ScaleLoader color="#36d7b7" height={35} width={4} radius={2} margin={2} />
        </Box>
    )}
        </div>
      </div>
    </>
  );
};

export default SelfStockReport;

























// import React, { useState, useEffect, useMemo } from "react";
// import { useNavigate } from 'react-router-dom';
// import axios from "axios";
// import * as XLSX from "xlsx";
// import PdfPreview from '../../../../Common/PDFPreview';
// import { jsPDF } from 'jspdf';
// import 'jspdf-autotable';
// import { RingLoader } from 'react-spinners';
// import { Typography, Button } from '@mui/material';
// import PrintButton from "../../../../Common/Buttons/PrintPDF";
// import { formatReadableAmount } from "../../../../Common/FormatFunctions/FormatAmount";
// import SearchBar from "../../../../Common/UtilityCommon/SearchBar";

// const API_URL = process.env.REACT_APP_API;

// const SelfStockReport = () => {
//   const companyName = sessionStorage.getItem("Company_Name");
//   const Company_GSTNO = sessionStorage.getItem('Company_GSTNO');
//   const AccountYear = sessionStorage.getItem('Accounting_Year');

//   const [groupedData, setGroupedData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [pdfPreview, setPdfPreview] = useState(null);
//   const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
//   const [searchQuery, setSearchQuery] = useState('');
//   const [dueData, setDueData] = useState([]);
//   const [fromDate, setFromDate] = useState('');
//   const [toDate, setToDate] = useState('');
//   const [selectType, setSelectType] = useState('Mill Wise');
//   const [receiptPaymentType, setReceiptPaymentType] = useState('Against Sauda');
//   const [millPendingRows, setMillPendingRows] = useState([]);
//   const [sundryDebtorsTotals, setSundryDebtorsTotals] = useState(null);
//   const [sundryCreditorsTotals, setSundryCreditorsTotals] = useState(null);
//   const [sbLoading, setSbLoading] = useState(false);
//   const [dailyDispatch, setDailyDispatch] = useState([]);
//   const [ddLoading, setDdLoading] = useState(false);
//   const [selectedSections, setSelectedSections] = useState([]);


//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       try {
//         const [stockRes, dueRes] = await Promise.all([
//           axios.get(`${API_URL}/self-stock-report`, {
//             params: {
//               Company_Code: sessionStorage.getItem("Company_Code"),
//               Year_Code: sessionStorage.getItem("Year_Code"),
//             },
//           }),
//           axios.get(`${API_URL}/mill_lot_due_summary`, {
//             params: { Company_Code: sessionStorage.getItem("Company_Code") },
//           })
//         ]);

//         groupByBuyerName(stockRes.data);
//         setDueData(dueRes.data.data || []);
//       } catch (err) {
//         console.error("Error fetching data:", err);
//         setError("Failed to load data.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   useEffect(() => {
//     const fetchMillPendingRows = async () => {
//       if (!fromDate || !toDate) return;
//       try {
//         const res = await axios.get(`${API_URL}/pendingreport-MillPendingPayment-Summary`, {
//           params: { from_date: fromDate, to_date: toDate }
//         });
//         setMillPendingRows(res.data || []);
//       } catch (e) {
//         console.error("pendingreport-MillPayment-Summary failed:", e);
//         setMillPendingRows([]);
//       }
//     };
//     fetchMillPendingRows();
//   }, [fromDate, toDate]);

//   useEffect(() => {
//     if (AccountYear) {
//       const dates = AccountYear.split(' - ');
//       if (dates.length === 2) {
//         setFromDate(dates[0]);
//         setToDate(dates[1]);
//       }
//     }
//   }, [AccountYear]);

//   const fetchSundrySummary = async (groupCode) => {
//     const params = {
//       from_date: fromDate,
//       to_date: toDate,
//       Company_Code: sessionStorage.getItem("Company_Code"),
//       Year_Code: sessionStorage.getItem("Year_Code"),
//       Group_Code: groupCode
//     };
//     const res = await axios.get(`${API_URL}/TrialBalance-SundrySummary`, { params });
//     // API shape: { summary_by_group: [...], totals: { Debtors, Creditors, Net } }
//     const totals = res.data?.totals || { Debtors: 0, Creditors: 0, Net: 0 };
//     return {
//       Debtors: +totals.Debtors || 0,
//       Creditors: +totals.Creditors || 0,
//       Net: +totals.Net || 0
//     };
//   };

//   useEffect(() => {
//     if (!fromDate || !toDate) return;
//     (async () => {
//       try {
//         setSbLoading(true);
//         const [deb, cred] = await Promise.all([
//           fetchSundrySummary(10),
//           fetchSundrySummary(4),
//         ]);
//         setSundryDebtorsTotals(deb);
//         setSundryCreditorsTotals(cred);
//       } catch (e) {
//         console.error("Sundry summaries failed:", e);
//         setSundryDebtorsTotals({ Debtors: 0, Creditors: 0, Net: 0 });
//         setSundryCreditorsTotals({ Debtors: 0, Creditors: 0, Net: 0 });
//       } finally {
//         setSbLoading(false);
//       }
//     })();
//   }, [fromDate, toDate]);


//   useEffect(() => {
//     const fetchDailyDispatch = async () => {
//       try {
//         setDdLoading(true);
//         const res = await axios.get(`${API_URL}/daily_dispatch`, {
//           params: {
//             Company_Code: sessionStorage.getItem("Company_Code"),
//             Year_Code: sessionStorage.getItem("Year_Code"),
//           }
//         });
//         setDailyDispatch(res.data?.all_data || []);
//       } catch (e) {
//         console.error("daily_dispatch failed:", e);
//         setDailyDispatch([]);
//       } finally {
//         setDdLoading(false);
//       }
//     };

//     fetchDailyDispatch();
//   }, []);

//   const printOrPreviewSelectedSections = (preview = false) => {
//     if (!selectedSections.length) return;

//     let combinedHTML = "";

//     selectedSections.forEach(id => {
//       const el = document.getElementById(id);
//       if (el) {
//         combinedHTML += `
//         <div style="margin-bottom:40px">
//           ${el.innerHTML}
//         </div>
//       `;
//       }
//     });

//     const win = window.open("", "_blank");
//     win.document.write(`
//     <html>
//       <head>
//         <title>Report</title>
//         <style>
//           body { font-family: Arial; padding: 12px; }
//           table { width: 100%; border-collapse: collapse; }
//           th, td { border: 1px solid #000; padding: 6px; }
//           th { background: #f0f0f0; }
//           @media print {
//             table { page-break-inside: avoid; }
//           }
//         </style>
//       </head>
//       <body>
//         ${combinedHTML}
//       </body>
//     </html>
//   `);

//     win.document.close();

//     if (!preview) {
//       win.focus();
//       win.print();
//       win.close();
//     }
//   };



//   const calculateGrandTotals = (data) => {
//     const totals = {
//       totalQuintal: 0,
//       totalDispatch: 0,
//       totalBalance: 0,
//     };

//     data.forEach(group => {
//       group.details.forEach(record => {
//         totals.totalQuintal += parseFloat(record.Buyer_Quantal || 0);
//         totals.totalDispatch += parseFloat(record.DESPATCH || 0);
//         totals.totalBalance += parseFloat(record.BALANCE || 0);
//       });
//     });

//     return totals;
//   };

//   const groupedDue = dueData.reduce((acc, item) => {
//     if (!acc[item.mill_code]) {
//       acc[item.mill_code] = { millname: item.mill_name, rows: [] };
//     }
//     acc[item.mill_code].rows.push(item);
//     return acc;
//   }, {});

//   const groupByBuyerName = (data) => {
//     const grouped = data.reduce((acc, curr) => {
//       if (parseFloat(curr.BALANCE) !== 0) {
//         if (!acc[curr.buyername]) {
//           acc[curr.buyername] = { buyername: curr.buyername, details: [], totalBalance: 0 };
//         }
//         acc[curr.buyername].details.push(curr);
//         acc[curr.buyername].totalBalance += parseFloat(curr.BALANCE);
//       }
//       return acc;
//     }, {});
//     setGroupedData(Object.values(grouped));
//   };

//   const sortData = (key) => {
//     let direction = 'asc';
//     if (sortConfig.key === key && sortConfig.direction === 'asc') {
//       direction = 'desc';
//     }

//     const sortedData = [...groupedData];
//     sortedData.forEach(group => {
//       group.details.sort((a, b) => {
//         if (key === "Tender_No" || key === "Grade") {
//           if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
//           if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
//           return 0;
//         } else {
//           if (parseFloat(a[key] || 0) < parseFloat(b[key] || 0)) return direction === 'asc' ? -1 : 1;
//           if (parseFloat(a[key] || 0) > parseFloat(b[key] || 0)) return direction === 'asc' ? 1 : -1;
//           return 0;
//         }
//       });
//     });

//     setGroupedData(sortedData);
//     setSortConfig({ key, direction });
//   };

//   const filteredData = groupedData
//     .map(group => {
//       const filteredDetails = group.details.filter(record =>
//         Object.values(record).join(' ').toLowerCase().includes(searchQuery.toLowerCase())
//       );
//       return { ...group, details: filteredDetails };
//     })
//     .filter(group => group.details.length > 0);



//   // const handleExportToExcel = () => {
//   //   const workbook = XLSX.utils.book_new();
//   //   const sheetData = [["Buyer Name", "Tender No", "Mill Name", "Grade", "MR", "SR", "Qntl", "Desp", "Bal", "Lift", "DO"]];

//   //   filteredData.forEach((group) => {
//   //     sheetData.push([group.buyername, "", "", "", "", "", "", "", group.totalBalance]);
//   //     group.details.forEach((record) => {
//   //       sheetData.push(["", record.Tender_No, record.millshortname, record.Grade, record.Mill_Rate, record.Sale_Rate, record.Buyer_Quantal, record.DESPATCH, record.BALANCE, record.Lifting_Date, record.tenderdoshortname]);
//   //     });
//   //   });

//   //   const sheet = XLSX.utils.aoa_to_sheet(sheetData);
//   //   XLSX.utils.book_append_sheet(workbook, sheet, "Self Stock Report");
//   //   XLSX.writeFile(workbook, "SelfStockReport.xlsx");
//   // };

//   const handleExportToExcel = () => {
//     const wb = XLSX.utils.book_new();

//     /* ===============================
//        1️⃣ Self Stock Report
//     =============================== */
//     const selfStockData = [];
//     selfStockData.push([
//       "Buyer", "Tender No", "Mill", "Grade",
//       "Mill Rate", "Sale Rate", "Quintal",
//       "Desp", "Balance", "Lifting", "DO"
//     ]);

//     filteredData.forEach(group => {
//       group.details.forEach(r => {
//         selfStockData.push([
//           group.buyername,
//           r.Tender_No,
//           r.millshortname,
//           r.Grade,
//           r.Mill_Rate,
//           r.Sale_Rate,
//           r.Buyer_Quantal,
//           r.DESPATCH,
//           r.BALANCE,
//           r.Tender_Date,
//           r.tenderdoshortname
//         ]);
//       });
//     });

//     XLSX.utils.book_append_sheet(
//       wb,
//       XLSX.utils.aoa_to_sheet(selfStockData),
//       "Self Stock"
//     );

//     /* ===============================
//        2️⃣ Daily Dispatch (P&L)
//     =============================== */
//     const dailyData = [];
//     dailyData.push([
//       "Tender No", "Tender Date", "Mill", "DO",
//       "Season", "Buyer", "Grade", "Qntl",
//       "Sale Rate", "Mill Rate", "Profit"
//     ]);

//     dailyDispatch.forEach(r => {
//       dailyData.push([
//         r.Tender_No,
//         r.Tender_Date,
//         r.Mill,
//         r.DO,
//         r.season,
//         r.buyerName,
//         r.Grade,
//         r.Qntl,
//         r.Sale_Rate,
//         r.Mill_Rate,
//         calcProfit(r)
//       ]);
//     });

//     dailyData.push([]);
//     dailyData.push([
//       "GRAND TOTAL", "", "", "", "", "", "",
//       dailyTotals.totalQntl, "", "", dailyTotals.totalProfit
//     ]);

//     XLSX.utils.book_append_sheet(
//       wb,
//       XLSX.utils.aoa_to_sheet(dailyData),
//       "Daily Dispatch P&L"
//     );


//     /* ===============================
//      5️⃣ Mill Lot-wise Payment Due
//   =============================== */
//     const lotWiseData = [];
//     lotWiseData.push(["Mill", "Lot No", "UTR Amount", "DO Amount", "Due Payment"]);

//     Object.entries(groupedDue || {}).forEach(([millCode, group]) => {
//       const validRows = group.rows.filter(r => parseFloat(r.duePayment || 0) !== 0);
//       if (validRows.length === 0) return;

//       validRows.forEach(r => {
//         lotWiseData.push([
//           group.millname,
//           r.lot_no,
//           r.utrAmount,
//           r.doAmount,
//           r.duePayment
//         ]);
//       });
//     });

//     if (lotWiseData.length > 1) {
//       XLSX.utils.book_append_sheet(
//         wb,
//         XLSX.utils.aoa_to_sheet(lotWiseData),
//         "Mill Lot-wise Due"
//       );
//     }

//     /* ===============================
//        3️⃣ Mill Pending Payment
//     =============================== */
//     const pendingData = [];
//     pendingData.push(["Mill", "Lot", "Mill Amt", "Paid", "Pending"]);

//     Object.values(millGroups).forEach(m => {
//       m.rows.forEach(r => {
//         pendingData.push([
//           m.millname,
//           r.lot,
//           r.millAmount,
//           r.paidAmount,
//           r.pendingAmount
//         ]);
//       });
//     });

//     XLSX.utils.book_append_sheet(
//       wb,
//       XLSX.utils.aoa_to_sheet(pendingData),
//       "Mill Pending Payment"
//     );

//     /* ===============================
//        4️⃣ Sundry Summary
//     =============================== */
//     const sundryData = [
//       ["Group", "Total", "Net Balance"],
//       ["Sundry Debtors", sundryDebtorsTotals?.Debtors, sundryDebtorsTotals?.Net],
//       ["Sundry Creditors", sundryCreditorsTotals?.Creditors, sundryCreditorsTotals?.Net],
//     ];

//     XLSX.utils.book_append_sheet(
//       wb,
//       XLSX.utils.aoa_to_sheet(sundryData),
//       "Sundry Summary"
//     );

//     XLSX.writeFile(wb, "SelfStock_Full_Report.xlsx");
//   };



//   const generatePDF = () => {
//     const doc = new jsPDF('landscape', 'mm', 'a4');
//     const pageWidth = doc.internal.pageSize.getWidth();
//     let yOffset = 10;

//     doc.setFontSize(14);
//     doc.setTextColor(0, 0, 255);
//     doc.setFont("helvetica", "bold");
//     const companyNameWidth = doc.getTextWidth(companyName);
//     doc.text(companyName, (pageWidth - companyNameWidth) / 2, yOffset);

//     yOffset += 7;
//     doc.setFontSize(12);
//     doc.setTextColor(0, 0, 0);
//     const title = "Self Stock Report";
//     const titleWidth = doc.getTextWidth(title);
//     doc.text(title, (pageWidth - titleWidth) / 2, yOffset);

//     yOffset += 8;

//     filteredData.forEach((group) => {
//       doc.setFontSize(10);
//       doc.setFont("helvetica", "bold");
//       doc.text(`Buyer: ${group.buyername} (Total Balance: ${group.totalBalance.toFixed(2)})`, 10, yOffset);
//       yOffset += 5;

//       const tableBody = group.details.map((record) => [
//         record.Tender_No,
//         record.millshortname,
//         record.Grade,
//         formatReadableAmount(record.Mill_Rate),
//         formatReadableAmount(record.Sale_Rate),
//         formatReadableAmount(record.Buyer_Quantal),
//         formatReadableAmount(record.DESPATCH),
//         formatReadableAmount(record.BALANCE),
//         record.Tender_Date,
//         record.tenderdoshortname,
//       ]);
//       doc.autoTable({
//         startY: yOffset,
//         head: [["Tender No", "Mill Name", "Grade", "Mill Rate", "Sale Rate", "Quintal", "Desp", "Balance", "Liftting", "DO"]],
//         body: tableBody,
//         theme: "grid",
//         headStyles: { fillColor: [0, 0, 120], textColor: [255, 255, 255] },
//         margin: { left: 10, right: 10 },
//         columnStyles: {
//           3: { halign: 'right' },
//           4: { halign: 'right' },
//           5: { halign: 'right' },
//           6: { halign: 'right' },
//           7: { halign: 'right' },
//         },
//         didDrawPage: (data) => {
//           yOffset = data.cursor.y + 10;
//         },
//       });
//     });

//     const totals = calculateGrandTotals(filteredData);
//     doc.setFontSize(10);
//     doc.setFont("helvetica", "normal");
//     doc.text(
//       `Grand Totals : Quintal = ${formatReadableAmount(totals.totalQuintal.toFixed(2))}, Dispatched = ${formatReadableAmount(totals.totalDispatch.toFixed(2))}, Balance = ${formatReadableAmount(totals.totalBalance.toFixed(2))}`,
//       10,
//       yOffset
//     );

//     const pdfBlob = doc.output("blob");
//     setPdfPreview(URL.createObjectURL(pdfBlob));

//   };

//   const handleUTRReportSummary = (lotNo) => {
//     if (!fromDate || !toDate) {
//       setError('Please select both From Date and To Date.');
//       return;
//     }
//     setError('');
//     setLoading(true);
//     setTimeout(() => {
//       let url = `/UTRReportSummary-reports?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&selectType=${encodeURIComponent(selectType)}&receiptPaymentType=${encodeURIComponent(receiptPaymentType)}`;

//       if (lotNo) {
//         url += `&lotNo=${encodeURIComponent(lotNo)}`;
//       }

//       window.open(
//         url,
//         '_blank',
//         'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600'
//       );
//       setLoading(false);
//     }, 500);
//   };

//   const handleMillPaymentSummary = (lotNo) => {
//     if (!fromDate || !toDate) {
//       setError('Please select both From Date and To Date.');
//       return;
//     }
//     setError('');
//     setLoading(true);
//     setTimeout(() => {
//       let url = `/MillPaymentSummary-reports?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&selectType=${encodeURIComponent(selectType)}&receiptPaymentType=${encodeURIComponent(receiptPaymentType)}`;

//       window.open(
//         url,
//         '_blank',
//         'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600'
//       );
//       setLoading(false);
//     }, 500);
//   };

//   const num = (x) => parseFloat(x ?? 0) || 0;

//   // mill -> { millname, rows:[{lot, millAmount, paidAmount, pendingAmount}], totals:{...} }
//   const { millGroups, grandTotals } = useMemo(() => {
//     const groups = {};
//     const seen = new Set(); // avoid duplicate tenders per mill if present

//     (millPendingRows || []).forEach(r => {
//       const millCode = String(r.Mill_Code);
//       const lot = String(r.Tender_No);     // use Tender_No as "lot"
//       const key = `${millCode}::${lot}`;
//       if (seen.has(key)) return;
//       seen.add(key);

//       const millAmount = num(r.MillTotal);
//       const paidAmount = num(r.UsedTotal);
//       const pendingAmount = num(r.PendingAmount);

//       if (!groups[millCode]) {
//         groups[millCode] = {
//           millname: r.millname,
//           rows: [],
//           totals: { millAmount: 0, paidAmount: 0, pendingAmount: 0 }
//         };
//       }

//       groups[millCode].rows.push({ lot, millAmount, paidAmount, pendingAmount });

//       groups[millCode].totals.millAmount += millAmount;
//       groups[millCode].totals.paidAmount += paidAmount;
//       groups[millCode].totals.pendingAmount += pendingAmount;
//     });

//     const grand = Object.values(groups).reduce((g, m) => {
//       g.millAmount += m.totals.millAmount;
//       g.paidAmount += m.totals.paidAmount;
//       g.pendingAmount += m.totals.pendingAmount;
//       return g;
//     }, { millAmount: 0, paidAmount: 0, pendingAmount: 0 });

//     return { millGroups: groups, grandTotals: grand };
//   }, [millPendingRows]);

//   const fmtDrCr = (net) => {
//     const val = Math.abs(net || 0);
//     return net >= 0 ? `${formatReadableAmount(val)} Dr` : `${formatReadableAmount(val)} Cr`;
//   };

//   // Debtors (Group 10)
//   const openDebtorsDetails = () => {
//     const url = `/SundryDetailsReport?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&groupCode=10`;
//     window.open(url, "_blank", "toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=1100,height=700");
//   };

//   // Creditors (Group 4)
//   const openCreditorsDetails = () => {
//     const url = `/SundryDetailsReport?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&groupCode=4`;
//     window.open(url, "_blank", "toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=1100,height=700");
//   };

//   const calcProfit = (row) => {
//     const qntl = parseFloat(row.Qntl || 0);
//     const sale = parseFloat(row.Sale_Rate || 0);
//     const mill = parseFloat(row.Mill_Rate || 0);
//     return (sale - mill) * qntl;
//   };

//   const dailyTotals = dailyDispatch.reduce(
//     (acc, row) => {
//       acc.totalQntl += parseFloat(row.Qntl || 0);
//       acc.totalProfit += calcProfit(row);
//       return acc;
//     },
//     { totalQntl: 0, totalProfit: 0 }
//   );




//   return (
//     <>
//       <div style={{ position: 'relative', marginTop: "-90px" }}>
//         <Typography variant="h6" style={{ textAlign: 'center', fontSize: "18px", fontWeight: "bold", color: "blue" }}>Self Stock Report</Typography>

//         <div className="d-flex justify-content-between align-items-center flex-wrap" style={{ gap: "10px" }}>
//           <div style={{ flex: 1, minWidth: "250px", maxWidth: "1100px" }}>
//             <SearchBar value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
//           </div>
 
//           <div className="d-flex flex-wrap align-items-center" style={{ gap: "8px" }}>
//             {pdfPreview && <PdfPreview pdfData={pdfPreview} apiData={filteredData} label={"Self Stock Report"} />}
//             <PrintButton disabledFeild={""} fetchData={generatePDF} />


//             <Button variant="outlined" color="secondary" onClick={handleExportToExcel}>
//               Export to Excel
//             </Button>

//           </div>
//         </div>

//         {error && <p className="text-danger">{error}</p>}

//         <div id="reportContent" style={{
//           maxHeight: 'calc(100vh - 200px)',
//           overflow: 'auto',
//           border: '1px solid #e0e0e0',
//           position: 'relative'
//         }}>
//           <div id="selfStockSection">
//             <table className="table" style={{
//               borderCollapse: "collapse",
//               width: "100%",
//               marginBottom: "50px",
//               position: 'relative'
//             }}>
//               <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
//                 <tr style={{ backgroundColor: "black", color: "white", textAlign: "center" }}>
//                   {[
//                     { label: "Tender No", key: "Tender_No" },
//                     { label: "Mill Name", key: "millshortname" },
//                     { label: "Grade", key: "Grade" },
//                     { label: "Mill Rate", key: "Mill_Rate" },
//                     { label: "Sale Rate", key: "Sale_Rate" },
//                     { label: "Quintal", key: "Buyer_Quantal" },
//                     { label: "Desp", key: "DESPATCH" },
//                     // { label: "Balance", key: "BALANCE" },
//                   ].map(col => (
//                     <th key={col.key} onClick={() => sortData(col.key)} style={{ border: "1px solid white", padding: '8px', cursor: 'pointer' }}>
//                       {col.label} {sortConfig.key === col.key ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
//                     </th>
//                   ))}
//                   <th style={{ border: "1px solid white", padding: '8px' }}>Liftting Date</th>
//                   <th style={{ border: "1px solid white", padding: '8px' }}>DO</th>
//                   <th style={{ border: "1px solid white", padding: '8px' }}>Mill Balance</th>

//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredData.map((group, groupIndex) => (
//                   <React.Fragment key={groupIndex}>
//                     <tr style={{ backgroundColor: "#f0f0f0", fontWeight: "bold" }}>
//                       <td colSpan="10" style={{ textAlign: "left", padding: '8px' }}>
//                         {group.buyername} (Total Balance: {formatReadableAmount(group.totalBalance.toFixed(2))})
//                       </td>
//                     </tr>
//                     {group.details.map((record, recordIndex) => (
//                       <tr key={recordIndex} style={{ textAlign: "center" }}>
//                         <td style={{ border: "1px dashed black", padding: '8px' }}>{record.Tender_No}</td>
//                         <td align="left" style={{ border: "1px dashed black", padding: '8px' }}>{record.millshortname}</td>
//                         <td align="left" style={{ border: "1px dashed black", padding: '8px' }}>{record.Grade}</td>
//                         <td align="right" style={{ border: "1px dashed black", padding: '8px' }}>{formatReadableAmount(record.Mill_Rate)}</td>
//                         <td align="right" style={{ border: "1px dashed black", padding: '8px' }}>{formatReadableAmount(record.Sale_Rate)}</td>
//                         <td align="right" style={{ border: "1px dashed black", padding: '8px' }}>{formatReadableAmount(record.Buyer_Quantal)}</td>
//                         <td align="right" style={{ border: "1px dashed black", padding: '8px' }}>{record.DESPATCH}</td>
//                         <td align="right" style={{ border: "1px dashed black", padding: '8px' }}>{formatReadableAmount(record.BALANCE)}</td>
//                         <td style={{ border: "1px dashed black", padding: '8px' }}>{record.Tender_Date}</td>
//                         <td align="left" style={{ border: "1px dashed black", padding: '8px' }}>{record.tenderdoshortname}</td>
//                         {/* <td align="right" style={{ border: "1px dashed black", padding: '8px' }}>{record.mill_balance === 0
//                           ? formatReadableAmount(record.mill_balance)
//                           : `${formatReadableAmount(record.mill_balance)} ${record.mill_balance > 0 ? "Dr." : "Cr."
//                           }`}</td> */}
//                         {/* <td align="right" style={{ border: "1px dashed black", padding: '8px' }}>{record.mill_balance === 0 ? "" : record.mill_balance > 0 ? "DR" : "CR"}</td> */}

//                       </tr>
//                     ))}
//                   </React.Fragment>
//                 ))}
//                 <tr style={{ backgroundColor: "#f0f0f0", fontWeight: "bold" }}>
//                   <td colSpan="5" style={{ textAlign: "center", padding: '8px' }}>Grand Totals</td>
//                   <td align="right" style={{ border: "1px dashed black", padding: '8px' }}>{formatReadableAmount(calculateGrandTotals(filteredData).totalQuintal.toFixed(2))}</td>
//                   <td align="right" style={{ border: "1px dashed black", padding: '8px' }}>{formatReadableAmount(calculateGrandTotals(filteredData).totalDispatch.toFixed(2))}</td>
//                   <td align="right" style={{ border: "1px dashed black", padding: '8px' }}>{formatReadableAmount(calculateGrandTotals(filteredData).totalBalance.toFixed(2))}</td>
//                   <td colSpan="2" style={{ border: "1px dashed black", padding: '8px' }}></td>
//                 </tr>
//               </tbody>
//             </table>
//           </div>
          
//           {loading && (
//             <div style={{
//               display: "flex", justifyContent: "center", alignItems: "center", height: "100%",
//               position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
//               backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 3
//             }}>
//               <RingLoader />
//             </div>
//           )}
//         </div>
//       </div>
//     </>
//   );
// };

// export default SelfStockReport;
































// import React, { useState, useEffect, useMemo } from "react";
// import { useNavigate } from 'react-router-dom';
// import axios from "axios";
// import * as XLSX from "xlsx";
// import PdfPreview from '../../../../Common/PDFPreview';
// import { jsPDF } from 'jspdf';
// import 'jspdf-autotable';
// import { RingLoader } from 'react-spinners';
// import { Typography, Button } from '@mui/material';
// import PrintButton from "../../../../Common/Buttons/PrintPDF";
// import { formatReadableAmount } from "../../../../Common/FormatFunctions/FormatAmount";
// import SearchBar from "../../../../Common/UtilityCommon/SearchBar";

// const API_URL = process.env.REACT_APP_API;

// const SelfStockReport = () => {
//   const companyName = sessionStorage.getItem("Company_Name");
//   const Company_GSTNO = sessionStorage.getItem('Company_GSTNO');
//   const AccountYear = sessionStorage.getItem('Accounting_Year');

//   const [groupedData, setGroupedData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [pdfPreview, setPdfPreview] = useState(null);
//   const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
//   const [searchQuery, setSearchQuery] = useState('');
//   const [dueData, setDueData] = useState([]);
//   const [fromDate, setFromDate] = useState('');
//   const [toDate, setToDate] = useState('');
//   const [selectType, setSelectType] = useState('Mill Wise');
//   const [receiptPaymentType, setReceiptPaymentType] = useState('Against Sauda');
//   const [millPendingRows, setMillPendingRows] = useState([]);
//   const [sundryDebtorsTotals, setSundryDebtorsTotals] = useState(null);
//   const [sundryCreditorsTotals, setSundryCreditorsTotals] = useState(null);
//   const [sbLoading, setSbLoading] = useState(false);


//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       try {
//         const [stockRes, dueRes] = await Promise.all([
//           axios.get(`${API_URL}/self-stock-report`, {
//             params: {
//               Company_Code: sessionStorage.getItem("Company_Code"),
//               Year_Code: sessionStorage.getItem("Year_Code"),
//             },
//           }),
//           axios.get(`${API_URL}/mill_lot_due_summary`, {
//             params: { Company_Code: sessionStorage.getItem("Company_Code") },
//           })
//         ]);

//         groupByBuyerName(stockRes.data);
//         setDueData(dueRes.data.data || []);
//       } catch (err) {
//         console.error("Error fetching data:", err);
//         setError("Failed to load data.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   useEffect(() => {
//     const fetchMillPendingRows = async () => {
//       if (!fromDate || !toDate) return;
//       try {
//         const res = await axios.get(`${API_URL}/pendingreport-MillPendingPayment-Summary`, {
//           params: { from_date: fromDate, to_date: toDate }
//         });
//         setMillPendingRows(res.data || []);
//       } catch (e) {
//         console.error("pendingreport-MillPayment-Summary failed:", e);
//         setMillPendingRows([]);
//       }
//     };
//     fetchMillPendingRows();
//   }, [fromDate, toDate]);

//   useEffect(() => {
//     if (AccountYear) {
//       const dates = AccountYear.split(' - ');
//       if (dates.length === 2) {
//         setFromDate(dates[0]);
//         setToDate(dates[1]);
//       }
//     }
//   }, [AccountYear]);

//   const fetchSundrySummary = async (groupCode) => {
//     const params = {
//       from_date: fromDate,
//       to_date: toDate,
//       Company_Code: sessionStorage.getItem("Company_Code"),
//       Year_Code: sessionStorage.getItem("Year_Code"),
//       Group_Code: groupCode
//     };
//     const res = await axios.get(`${API_URL}/TrialBalance-SundrySummary`, { params });
//     // API shape: { summary_by_group: [...], totals: { Debtors, Creditors, Net } }
//     const totals = res.data?.totals || { Debtors: 0, Creditors: 0, Net: 0 };
//     return {
//       Debtors: +totals.Debtors || 0,
//       Creditors: +totals.Creditors || 0,
//       Net: +totals.Net || 0
//     };
//   };

//   useEffect(() => {
//     if (!fromDate || !toDate) return;
//     (async () => {
//       try {
//         setSbLoading(true);
//         const [deb, cred] = await Promise.all([
//           fetchSundrySummary(10), // Sundry Debtors
//           fetchSundrySummary(4),  // Sundry Creditors
//         ]);
//         setSundryDebtorsTotals(deb);
//         setSundryCreditorsTotals(cred);
//       } catch (e) {
//         console.error("Sundry summaries failed:", e);
//         setSundryDebtorsTotals({ Debtors: 0, Creditors: 0, Net: 0 });
//         setSundryCreditorsTotals({ Debtors: 0, Creditors: 0, Net: 0 });
//       } finally {
//         setSbLoading(false);
//       }
//     })();
//   }, [fromDate, toDate]);


//   const calculateGrandTotals = (data) => {
//     const totals = {
//       totalQuintal: 0,
//       totalDispatch: 0,
//       totalBalance: 0,
//     };

//     data.forEach(group => {
//       group.details.forEach(record => {
//         totals.totalQuintal += parseFloat(record.Buyer_Quantal || 0);
//         totals.totalDispatch += parseFloat(record.DESPATCH || 0);
//         totals.totalBalance += parseFloat(record.BALANCE || 0);
//       });
//     });

//     return totals;
//   };

//   const groupedDue = dueData.reduce((acc, item) => {
//     if (!acc[item.mill_code]) {
//       acc[item.mill_code] = { millname: item.mill_name, rows: [] };
//     }
//     acc[item.mill_code].rows.push(item);
//     return acc;
//   }, {});

//   const groupByBuyerName = (data) => {
//     const grouped = data.reduce((acc, curr) => {
//       if (parseFloat(curr.BALANCE) !== 0) {
//         if (!acc[curr.buyername]) {
//           acc[curr.buyername] = { buyername: curr.buyername, details: [], totalBalance: 0 };
//         }
//         acc[curr.buyername].details.push(curr);
//         acc[curr.buyername].totalBalance += parseFloat(curr.BALANCE);
//       }
//       return acc;
//     }, {});
//     setGroupedData(Object.values(grouped));
//   };

//   const sortData = (key) => {
//     let direction = 'asc';
//     if (sortConfig.key === key && sortConfig.direction === 'asc') {
//       direction = 'desc';
//     }

//     const sortedData = [...groupedData];
//     sortedData.forEach(group => {
//       group.details.sort((a, b) => {
//         if (key === "Tender_No" || key === "Grade") {
//           if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
//           if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
//           return 0;
//         } else {
//           if (parseFloat(a[key] || 0) < parseFloat(b[key] || 0)) return direction === 'asc' ? -1 : 1;
//           if (parseFloat(a[key] || 0) > parseFloat(b[key] || 0)) return direction === 'asc' ? 1 : -1;
//           return 0;
//         }
//       });
//     });

//     setGroupedData(sortedData);
//     setSortConfig({ key, direction });
//   };

//   const filteredData = groupedData
//     .map(group => {
//       const filteredDetails = group.details.filter(record =>
//         Object.values(record).join(' ').toLowerCase().includes(searchQuery.toLowerCase())
//       );
//       return { ...group, details: filteredDetails };
//     })
//     .filter(group => group.details.length > 0);



//   const handleExportToExcel = () => {
//     const workbook = XLSX.utils.book_new();
//     const sheetData = [["Buyer Name", "Tender No", "Mill Name", "Grade", "MR", "SR", "Qntl", "Desp", "Bal", "Lift", "DO"]];

//     filteredData.forEach((group) => {
//       sheetData.push([group.buyername, "", "", "", "", "", "", "", group.totalBalance]);
//       group.details.forEach((record) => {
//         sheetData.push(["", record.Tender_No, record.millshortname, record.Grade, record.Mill_Rate, record.Sale_Rate, record.Buyer_Quantal, record.DESPATCH, record.BALANCE, record.Lifting_Date, record.tenderdoshortname]);
//       });
//     });

//     const sheet = XLSX.utils.aoa_to_sheet(sheetData);
//     XLSX.utils.book_append_sheet(workbook, sheet, "Self Stock Report");
//     XLSX.writeFile(workbook, "SelfStockReport.xlsx");
//   };


//   const generatePDF = () => {
//     const doc = new jsPDF('landscape', 'mm', 'a4');
//     const pageWidth = doc.internal.pageSize.getWidth();
//     let yOffset = 10;

//     doc.setFontSize(14);
//     doc.setTextColor(0, 0, 255);
//     doc.setFont("helvetica", "bold");
//     const companyNameWidth = doc.getTextWidth(companyName);
//     doc.text(companyName, (pageWidth - companyNameWidth) / 2, yOffset);

//     yOffset += 7;
//     doc.setFontSize(12);
//     doc.setTextColor(0, 0, 0);
//     const title = "Self Stock Report";
//     const titleWidth = doc.getTextWidth(title);
//     doc.text(title, (pageWidth - titleWidth) / 2, yOffset);

//     yOffset += 8;

//     filteredData.forEach((group) => {
//       doc.setFontSize(10);
//       doc.setFont("helvetica", "bold");
//       doc.text(`Buyer: ${group.buyername} (Total Balance: ${group.totalBalance.toFixed(2)})`, 10, yOffset);
//       yOffset += 5;

//       const tableBody = group.details.map((record) => [
//         record.Tender_No,
//         record.millshortname,
//         record.Grade,
//         formatReadableAmount(record.Mill_Rate),
//         formatReadableAmount(record.Sale_Rate),
//         formatReadableAmount(record.Buyer_Quantal),
//         formatReadableAmount(record.DESPATCH),
//         formatReadableAmount(record.BALANCE),
//         record.Tender_Date,
//         record.tenderdoshortname,
//       ]);
//       doc.autoTable({
//         startY: yOffset,
//         head: [["Tender No", "Mill Name", "Grade", "Mill Rate", "Sale Rate", "Quintal", "Desp", "Balance", "Liftting", "DO"]],
//         body: tableBody,
//         theme: "grid",
//         headStyles: { fillColor: [0, 0, 120], textColor: [255, 255, 255] },
//         margin: { left: 10, right: 10 },
//         columnStyles: {
//           3: { halign: 'right' },
//           4: { halign: 'right' },
//           5: { halign: 'right' },
//           6: { halign: 'right' },
//           7: { halign: 'right' },
//         },
//         didDrawPage: (data) => {
//           yOffset = data.cursor.y + 10;
//         },
//       });
//     });

//     const totals = calculateGrandTotals(filteredData);
//     doc.setFontSize(10);
//     doc.setFont("helvetica", "normal");
//     doc.text(
//       `Grand Totals : Quintal = ${formatReadableAmount(totals.totalQuintal.toFixed(2))}, Dispatched = ${formatReadableAmount(totals.totalDispatch.toFixed(2))}, Balance = ${formatReadableAmount(totals.totalBalance.toFixed(2))}`,
//       10,
//       yOffset
//     );

//     const pdfBlob = doc.output("blob");
//     setPdfPreview(URL.createObjectURL(pdfBlob));

//   };

//   const handleUTRReportSummary = (lotNo) => {
//     if (!fromDate || !toDate) {
//       setError('Please select both From Date and To Date.');
//       return;
//     }
//     setError('');
//     setLoading(true);
//     setTimeout(() => {
//       let url = `/UTRReportSummary-reports?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&selectType=${encodeURIComponent(selectType)}&receiptPaymentType=${encodeURIComponent(receiptPaymentType)}`;

//       if (lotNo) {
//         url += `&lotNo=${encodeURIComponent(lotNo)}`;
//       }

//       window.open(
//         url,
//         '_blank',
//         'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600'
//       );
//       setLoading(false);
//     }, 500);
//   };

//   const handleMillPaymentSummary = (lotNo) => {
//     if (!fromDate || !toDate) {
//       setError('Please select both From Date and To Date.');
//       return;
//     }
//     setError('');
//     setLoading(true);
//     setTimeout(() => {
//       let url = `/MillPaymentSummary-reports?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&selectType=${encodeURIComponent(selectType)}&receiptPaymentType=${encodeURIComponent(receiptPaymentType)}`;

//       window.open(
//         url,
//         '_blank',
//         'toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=800,height=600'
//       );
//       setLoading(false);
//     }, 500);
//   };

//   const num = (x) => parseFloat(x ?? 0) || 0;

//   // mill -> { millname, rows:[{lot, millAmount, paidAmount, pendingAmount}], totals:{...} }
//   const { millGroups, grandTotals } = useMemo(() => {
//     const groups = {};
//     const seen = new Set(); // avoid duplicate tenders per mill if present

//     (millPendingRows || []).forEach(r => {
//       const millCode = String(r.Mill_Code);
//       const lot = String(r.Tender_No);     // use Tender_No as "lot"
//       const key = `${millCode}::${lot}`;
//       if (seen.has(key)) return;
//       seen.add(key);

//       const millAmount = num(r.MillTotal);
//       const paidAmount = num(r.UsedTotal);
//       const pendingAmount = num(r.PendingAmount);

//       if (!groups[millCode]) {
//         groups[millCode] = {
//           millname: r.millname,
//           rows: [],
//           totals: { millAmount: 0, paidAmount: 0, pendingAmount: 0 }
//         };
//       }

//       groups[millCode].rows.push({ lot, millAmount, paidAmount, pendingAmount });

//       groups[millCode].totals.millAmount += millAmount;
//       groups[millCode].totals.paidAmount += paidAmount;
//       groups[millCode].totals.pendingAmount += pendingAmount;
//     });

//     const grand = Object.values(groups).reduce((g, m) => {
//       g.millAmount += m.totals.millAmount;
//       g.paidAmount += m.totals.paidAmount;
//       g.pendingAmount += m.totals.pendingAmount;
//       return g;
//     }, { millAmount: 0, paidAmount: 0, pendingAmount: 0 });

//     return { millGroups: groups, grandTotals: grand };
//   }, [millPendingRows]);

//   const fmtDrCr = (net) => {
//     const val = Math.abs(net || 0);
//     return net >= 0 ? `${formatReadableAmount(val)} Dr` : `${formatReadableAmount(val)} Cr`;
//   };

//   // Debtors (Group 10)
//   const openDebtorsDetails = () => {
//     const url = `/SundryDetailsReport?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&groupCode=10`;
//     window.open(url, "_blank", "toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=1100,height=700");
//   };

//   // Creditors (Group 4)
//   const openCreditorsDetails = () => {
//     const url = `/SundryDetailsReport?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&groupCode=4`;
//     window.open(url, "_blank", "toolbar=yes,location=yes,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=1100,height=700");
//   };


//   return (
//     <>
//       <div style={{ position: 'relative', marginTop: "-90px" }}>
//         <Typography variant="h6" style={{ textAlign: 'center', fontSize: "18px", fontWeight: "bold", color: "blue" }}>Self Stock Report</Typography>

//         <div className="d-flex justify-content-between align-items-center flex-wrap" style={{ gap: "10px" }}>
//           <div style={{ flex: 1, minWidth: "250px", maxWidth: "1100px" }}>
//             <SearchBar value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
//           </div>
//           <div className="d-flex flex-wrap align-items-center" style={{ gap: "8px" }}>
//             {pdfPreview && <PdfPreview pdfData={pdfPreview} apiData={filteredData} label={"Self Stock Report"} />}
//             <PrintButton disabledFeild={""} fetchData={generatePDF} />
//             <Button variant="outlined" color="secondary" onClick={handleExportToExcel}>
//               Export to Excel
//             </Button>
//           </div>
//         </div>

//         {error && <p className="text-danger">{error}</p>}

//         <div id="reportContent" style={{
//           maxHeight: 'calc(100vh - 200px)',
//           overflow: 'auto',
//           border: '1px solid #e0e0e0',
//           position: 'relative'
//         }}>
//           <table className="table" style={{
//             borderCollapse: "collapse",
//             width: "100%",
//             marginBottom: "50px",
//             position: 'relative'
//           }}>
//             <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
//               <tr style={{ backgroundColor: "black", color: "white", textAlign: "center" }}>
//                 {[
//                   { label: "Tender No", key: "Tender_No" },
//                   { label: "Mill Name", key: "millshortname" },
//                   { label: "Grade", key: "Grade" },
//                   { label: "Mill Rate", key: "Mill_Rate" },
//                   { label: "Sale Rate", key: "Sale_Rate" },
//                   { label: "Quintal", key: "Buyer_Quantal" },
//                   { label: "Desp", key: "DESPATCH" },
//                   { label: "Balance", key: "BALANCE" },
//                 ].map(col => (
//                   <th key={col.key} onClick={() => sortData(col.key)} style={{ border: "1px solid white", padding: '8px', cursor: 'pointer' }}>
//                     {col.label} {sortConfig.key === col.key ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
//                   </th>
//                 ))}
//                 <th style={{ border: "1px solid white", padding: '8px' }}>Liftting Date</th>
//                 <th style={{ border: "1px solid white", padding: '8px' }}>DO</th>
//               </tr>
//             </thead>
//             <tbody>
//               {filteredData.map((group, groupIndex) => (
//                 <React.Fragment key={groupIndex}>
//                   <tr style={{ backgroundColor: "#f0f0f0", fontWeight: "bold" }}>
//                     <td colSpan="10" style={{ textAlign: "left", padding: '8px' }}>
//                       {group.buyername} (Total Balance: {formatReadableAmount(group.totalBalance.toFixed(2))})
//                     </td>
//                   </tr>
//                   {group.details.map((record, recordIndex) => (
//                     <tr key={recordIndex} style={{ textAlign: "center" }}>
//                       <td style={{ border: "1px dashed black", padding: '8px' }}>{record.Tender_No}</td>
//                       <td align="left" style={{ border: "1px dashed black", padding: '8px' }}>{record.millshortname}</td>
//                       <td align="left" style={{ border: "1px dashed black", padding: '8px' }}>{record.Grade}</td>
//                       <td align="right" style={{ border: "1px dashed black", padding: '8px' }}>{formatReadableAmount(record.Mill_Rate)}</td>
//                       <td align="right" style={{ border: "1px dashed black", padding: '8px' }}>{formatReadableAmount(record.Sale_Rate)}</td>
//                       <td align="right" style={{ border: "1px dashed black", padding: '8px' }}>{formatReadableAmount(record.Buyer_Quantal)}</td>
//                       <td align="right" style={{ border: "1px dashed black", padding: '8px' }}>{record.DESPATCH}</td>
//                       <td align="right" style={{ border: "1px dashed black", padding: '8px' }}>{formatReadableAmount(record.BALANCE)}</td>
//                       <td style={{ border: "1px dashed black", padding: '8px' }}>{record.Tender_Date}</td>
//                       <td align="left" style={{ border: "1px dashed black", padding: '8px' }}>{record.tenderdoshortname}</td>
//                     </tr>
//                   ))}
//                 </React.Fragment>
//               ))}
//               <tr style={{ backgroundColor: "#f0f0f0", fontWeight: "bold" }}>
//                 <td colSpan="5" style={{ textAlign: "center", padding: '8px' }}>Grand Totals</td>
//                 <td align="right" style={{ border: "1px dashed black", padding: '8px' }}>{formatReadableAmount(calculateGrandTotals(filteredData).totalQuintal.toFixed(2))}</td>
//                 <td align="right" style={{ border: "1px dashed black", padding: '8px' }}>{formatReadableAmount(calculateGrandTotals(filteredData).totalDispatch.toFixed(2))}</td>
//                 <td align="right" style={{ border: "1px dashed black", padding: '8px' }}>{formatReadableAmount(calculateGrandTotals(filteredData).totalBalance.toFixed(2))}</td>
//                 <td colSpan="2" style={{ border: "1px dashed black", padding: '8px' }}></td>
//               </tr>
//             </tbody>
//           </table>
//           <div style={{ marginTop: "40px" }}>
//             <Typography variant="h6" style={{ textAlign: 'center', fontSize: "18px", fontWeight: "bold", color: "green" }}>
//               Mill Lot-wise Payment Due
//             </Typography>

//             <table className="table" style={{
//               borderCollapse: "collapse", width: "100%", marginTop: "10px", marginBottom: "50px"
//             }}>
//               <thead>
//                 <tr style={{ backgroundColor: "#343a40", color: "white", textAlign: "center" }}>
//                   <th style={{ border: "1px solid white", padding: '8px' }}>Lot No</th>
//                   <th style={{ border: "1px solid white", padding: '8px' }}>UTR Amount</th>
//                   <th style={{ border: "1px solid white", padding: '8px' }}>DO Amount</th>
//                   <th style={{ border: "1px solid white", padding: '8px' }}>Due Payment</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {Object.entries(groupedDue).map(([millCode, group], idx) => {
//                   // Only keep rows with due > 0
//                   const filteredRows = group.rows.filter(r => parseFloat(r.duePayment) !== 0);
//                   if (filteredRows.length === 0) return null; // don't render this mill group at all

//                   return (
//                     <React.Fragment key={idx}>
//                       <tr style={{ backgroundColor: "#e0f7fa", fontWeight: "bold" }}>
//                         <td colSpan="4" style={{ textAlign: "center", padding: '8px' }}>
//                           {group.millname} ({millCode})
//                         </td>
//                       </tr>
//                       {filteredRows.map((row, rIdx) => (
//                         <tr key={rIdx} style={{ textAlign: "center" }}>
//                           <td
//                             style={{ border: "1px dashed gray", padding: '8px', cursor: 'pointer', color: 'blue' }}
//                             onClick={() => handleUTRReportSummary(row.lot_no)}
//                           >{row.lot_no}</td>
//                           <td style={{ border: "1px dashed gray", padding: '8px' }}>{formatReadableAmount(row.utrAmount)}</td>
//                           <td style={{ border: "1px dashed gray", padding: '8px' }}>{formatReadableAmount(row.doAmount)}</td>
//                           <td style={{ border: "1px dashed gray", padding: '8px' }}>{formatReadableAmount(row.duePayment)}</td>
//                         </tr>
//                       ))}
//                     </React.Fragment>
//                   );
//                 })}
//               </tbody>

//             </table>
//           </div>
//           <div style={{ marginTop: "40px" }}>
//             <Typography variant="h6" style={{ textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: "green" }}>
//               Mill Pending Payment Summary
//             </Typography>

//             <table className="table" style={{ borderCollapse: "collapse", width: "100%", marginTop: 10, marginBottom: 50 }}>
//               <thead>
//                 <tr style={{ backgroundColor: "#343a40", color: "white", textAlign: "center" }}>
//                   <th style={{ border: "1px solid white", padding: 8 }}>Lot (Tender No)</th>
//                   <th style={{ border: "1px solid white", padding: 8 }}>Mill Amount</th>
//                   <th style={{ border: "1px solid white", padding: 8 }}>Paid (UsedTotal)</th>
//                   <th style={{ border: "1px solid white", padding: 8 }}>Pending</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {Object.entries(millGroups).map(([millCode, group]) => (
//                   <React.Fragment key={millCode}>
//                     {/* Mill header */}
//                     <tr style={{ backgroundColor: "#e0f7fa", fontWeight: "bold" }}>
//                       <td colSpan={4} style={{ textAlign: "center", padding: 8 }}>
//                         {group.millname} ({millCode})
//                       </td>
//                     </tr>

//                     {/* Lot rows */}
//                     {group.rows.map((row, idx) => (
//                       <tr key={idx} style={{ textAlign: "center" }}>
//                         <td
//                           style={{ border: "1px dashed gray", padding: 8, cursor: 'pointer', color: 'blue' }}
//                           onClick={() => handleMillPaymentSummary(row.lot)}  // opens UTR summary using Tender_No
//                           title="Open UTR Report Summary"
//                         >
//                           {row.lot}
//                         </td>
//                         <td style={{ border: "1px dashed gray", padding: 8 }}>{formatReadableAmount(row.millAmount)}</td>
//                         <td style={{ border: "1px dashed gray", padding: 8 }}>{formatReadableAmount(row.paidAmount)}</td>
//                         <td style={{ border: "1px dashed gray", padding: 8 }}>{formatReadableAmount(row.pendingAmount)}</td>
//                       </tr>
//                     ))}

//                     {/* Mill subtotal */}
//                     <tr style={{ backgroundColor: "#f9f9f9", fontWeight: "bold" }}>
//                       <td style={{ borderTop: "2px solid #ddd", padding: 8, textAlign: 'right' }}>Subtotal:</td>
//                       <td style={{ borderTop: "2px solid #ddd", padding: 8 }}>{formatReadableAmount(group.totals.millAmount)}</td>
//                       <td style={{ borderTop: "2px solid #ddd", padding: 8 }}>{formatReadableAmount(group.totals.paidAmount)}</td>
//                       <td style={{ borderTop: "2px solid #ddd", padding: 8 }}>{formatReadableAmount(group.totals.pendingAmount)}</td>
//                     </tr>
//                   </React.Fragment>
//                 ))}

//                 {/* Grand total */}
//                 <tr style={{ backgroundColor: "#fff0f0", fontWeight: "bold", color: "red" }}>
//                   <td style={{ padding: 8, textAlign: 'right' }}>Grand Total:</td>
//                   <td style={{ padding: 8 }}>{formatReadableAmount(grandTotals.millAmount)}</td>
//                   <td style={{ padding: 8 }}>{formatReadableAmount(grandTotals.paidAmount)}</td>
//                   <td style={{ padding: 8 }}>{formatReadableAmount(grandTotals.pendingAmount)}</td>
//                 </tr>
//               </tbody>
//             </table>
//           </div>

//           <div style={{ marginTop: 20 }}>
//             <Typography
//               variant="h6"
//               style={{ textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#6f42c1' }}
//             >
//               Sundry Balances (as per Trial Balance)
//             </Typography>

//             {sbLoading ? (
//               <div className="text-center" style={{ padding: 12 }}>Loading…</div>
//             ) : (
//               <div className="row" style={{ marginTop: 10 }}>
//                 {/* Sundry Debtors card */}
//                 <div className="col-md-6" style={{ marginBottom: 10 }}>
//                   <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 12 }}>
//                     <div
//                       style={{ fontWeight: 'bold', color: '#0d6efd', cursor: 'pointer' }}
//                       title="Click to refresh Debtors (Group 10)"
//                       onClick={openDebtorsDetails}
//                     >
//                       Sundry Debtors (Group 10)
//                     </div>
//                     <div style={{ marginTop: 8 }}>
//                       <div>Debtors Total: <b>{formatReadableAmount(sundryDebtorsTotals?.Debtors || 0)}</b></div>
//                       <div>Net Balance: <b>{fmtDrCr(sundryDebtorsTotals?.Net || 0)}</b></div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Sundry Creditors card */}
//                 <div className="col-md-6" style={{ marginBottom: 10 }}>
//                   <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 12 }}>
//                     <div
//                       style={{ fontWeight: 'bold', color: '#dc3545', cursor: 'pointer' }}
//                       title="Click to refresh Creditors (Group 4)"
//                       onClick={openCreditorsDetails}
//                     >
//                       Sundry Creditors (Group 4)
//                     </div>
//                     <div style={{ marginTop: 8 }}>
//                       <div>Creditors Total: <b>{formatReadableAmount(sundryCreditorsTotals?.Creditors || 0)}</b></div>
//                       <div>Net Balance: <b>{fmtDrCr(sundryCreditorsTotals?.Net || 0)}</b></div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>


//           {loading && (
//             <div style={{
//               display: "flex", justifyContent: "center", alignItems: "center", height: "100%",
//               position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
//               backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 3
//             }}>
//               <RingLoader />
//             </div>
//           )}
//         </div>
//       </div>
//     </>
//   );
// };

// export default SelfStockReport;


