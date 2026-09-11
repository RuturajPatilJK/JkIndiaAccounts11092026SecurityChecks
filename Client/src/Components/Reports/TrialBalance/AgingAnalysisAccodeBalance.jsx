import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useLocation } from 'react-router-dom';
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import { RingLoader } from 'react-spinners';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, TableFooter } from "@mui/material";
import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate"
import PdfPreview from '../../../Common/PDFPreview';

const apikey = process.env.REACT_APP_API;

const AgingAnalysAccodeBlance = () => {
  const location = useLocation();
  const Company_Name = sessionStorage.getItem('Company_Name')
  const Company_GSTNO = sessionStorage.getItem('Company_GSTNO')
  const searchParams = new URLSearchParams(location.search);
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');
  const company_Code = searchParams.get('Company_Code');
  const YearCode = searchParams.get('yearCode');
  const acCode = searchParams.get('acCode');
  const [pdfPreview, setPdfPreview] = useState(null);

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [grandTotals, setGrandTotals] = useState({
    TotalTaxable_Amt: 0,
    CGSTAmt: 0,
    SGSTAmt: 0,
    IGSTAmt: 0,
    BillamountAmt: 0,
    netqntl: 0
  });

  const API_URL = `${apikey}/AgingAnalysisBalanceReport`;


  useEffect(() => {
 

  if (!acCode || !fromDate || !toDate) return;

  const fetchReportData = async () => {
    try {
      setLoading(true);

      const response = await axios.get(API_URL, {
        params: {
          from_date: fromDate,
          to_date: toDate,
          Company_Code: company_Code,
          
          acCode: acCode
        }
      });

      setReportData(response.data);

    } catch (error) {
      console.error(error);
      setError("Error fetching report");
    } finally {
      setLoading(false);
    }
  };

  fetchReportData();

}, [fromDate, toDate, company_Code, acCode]);

  useEffect(() => {
    if (reportData.length > 0) {
      const totals = reportData.reduce(
        (acc, item) => {
          
          acc.BillamountAmt += Number(item.Balance) || 0;
         
          return acc;
        },
        {  BillamountAmt: 0 }
      );

      setGrandTotals(totals);
    }
  }, [reportData]);
   const handleExportToExcel = () => {

  const wb = XLSX.utils.book_new();

  // 🔹 Format data
  const formattedData = reportData.map(item => ({
    "Ac Code": item.AC_CODE,
    "Ac Name": item.Ac_Name_E,
    "Balance": Number(item.Balance) || 0,
  }));

  // 🔹 Calculate Total
  const totalBalance = formattedData.reduce(
    (sum, row) => sum + Number(row["Balance"] || 0),
    0
  );

  // 🔹 Add Total Row
  formattedData.push({
    "Ac Code": "",
    "Ac Name": "TOTAL",
    "Balance": totalBalance
  });

  // 🔹 Create worksheet
  const ws = XLSX.utils.json_to_sheet(formattedData);

  ws["!cols"] = [
    { wch: 15 },
    { wch: 30 },
    { wch: 15 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Aging Analysis Balance Report");

  XLSX.writeFile(wb, "AgingAnalysisBalanceReport.xlsx");
};
  const handlePrint = () => {
     const tableEl = document.getElementById("reportTable");
     if (!tableEl) return;
     const win = window.open("", "", "height=700,width=1000");
     const asOnDate = `As On: ${toDate ? FormaDateBalanceSheet(toDate) : ""}`;
 
     win.document.write(`
       <html>
         <head>
           <title>Aging Analysis Balance Report</title>
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
           <div style="text-align:center;">Aging Analysis Balance Report </div>
           <div style="text-align:right;">Aging Analysis Balance Report upto ${toDate}</div>
           ${tableEl.outerHTML}
         </body>
       </html>
     `);
     win.document.close();
     win.print();
   };

const generatePDFDocument = (companyName, fromDate, toDate) => {
  const doc = new jsPDF();

  // Add header information
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text(companyName, doc.internal.pageSize.width / 2, 15, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`GSTN : ${Company_GSTNO}`, doc.internal.pageSize.width / 2, 23, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text("Aging Analysis Balance Report", doc.internal.pageSize.width / 2, 32, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  

  const startY = 45;

  // Prepare table data
  const tableData = [
    [
      'Ac Code', 'Ac name', 'Balance'
    ],
    ...reportData.map(item => [
      item.AC_CODE,
      item.Ac_Name_E,
    
      formatReadableAmount(item.Balance),
     
    ]),
    [
      '', 'Total',    
      formatReadableAmount(grandTotals.BillamountAmt)
    ]
  ];

  // Add table to PDF
  doc.autoTable({
    head: [tableData[0]],
    body: tableData.slice(1, -1),
    foot: [tableData[tableData.length - 1]],
    startY: startY,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      halign: 'center',
    },
    headStyles: {
      fillColor: [255, 0, 0],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    footStyles: {
      fillColor: [255, 255, 0],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
    },
    columnStyles: {
      1: { halign: 'left' },
      2: { halign: 'left' },
      3: { halign: 'right' },
      
    },
    margin: { top: startY },
  });

  const pdfBlob = doc.output('blob');
const pdfUrl = URL.createObjectURL(pdfBlob);
setPdfPreview(pdfUrl); 
return pdfBlob;
};

  const groupReportData = (data) => {
    const groupedData = {};
    data.forEach((item) => {
      const key = `${item.AC_CODE}`;
      if (!groupedData[key]) {
        groupedData[key] = {
          items: [],
          totalQty: 0,
        };
      }
      groupedData[key].items.push(item);
      groupedData[key].totalQty += parseFloat(item.Balance) || 0;
    });
    return groupedData;
  };

  const groupedReportData = groupReportData(reportData);

  return (
    <div style={{marginTop:"-80px"}}>
      <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold" }}>{Company_Name}</Typography>
      <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", textDecoration: 'underline', fontWeight: "550" }}>GSTN : {Company_GSTNO}</Typography>
      <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>Aging Analysis Balance Report</Typography>
      

      <div className="mb-3 row align-items-center">
        <div className="col-auto">
          <button className="btn btn-secondary me-2" onClick={handlePrint}>
            Print
          </button>
          <button className="btn btn-success" onClick={handleExportToExcel}>
            Export to Excel
          </button>
          {/* <button className="btn btn-secondary me-2" onClick={() => generatePDFDocument(Company_Name, fromDate, toDate)}>
            Preview PDF
          </button> */}
          {pdfPreview && (
            <PdfPreview
              pdfData={pdfPreview}
              apiData={reportData[0]}
              label={"AgingAnalysisBalanceReport"}
            />
          )}
        </div>
      </div>

      <div style={{
        maxHeight: 'calc(100vh - 200px)',
        overflow: 'auto',
        position: 'relative',
        border: '1px solid #e0e0e0',
        marginBottom: '60px'
      }} id="reportTable">
        <Table sx={{ minWidth: 450 }} aria-label="simple table">
          <TableHead sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1,
            backgroundColor: 'white'
          }}>
            <TableRow>
              <TableCell style={{ textAlign: "left", fontWeight: "bold", backgroundColor: 'white' }}>Ac COde</TableCell>
              <TableCell style={{ textAlign: "left", fontWeight: "bold", backgroundColor: 'white' }}>Ac Name</TableCell>
              <TableCell style={{ textAlign: "right", fontWeight: "bold", backgroundColor: 'white' }}>Balance</TableCell>
             
            </TableRow>
          </TableHead>

          <TableBody>
            {Object.entries(groupedReportData).map(([key, { items, totalQty }]) => {
              return (
                <React.Fragment key={key}>
                  {items.map((item, index) => (
                    <TableRow
                      key={index}
                      sx={{
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: "#fdfd96",
                        },
                      }}
                    >
                      <TableCell style={{ textAlign: "left" }}>{item.AC_CODE}</TableCell>
                      
                      <TableCell style={{ textAlign: "left" }}>{item.Ac_Name_E}</TableCell>
                     
                      <TableCell style={{ textAlign: "right" }}>
                        {formatReadableAmount(item.Balance)}
                      </TableCell>
                     
                    </TableRow>
                  ))}
                </React.Fragment>
              );
            })}
          </TableBody>

          <TableFooter style={{ position: 'sticky', bottom: 0, backgroundColor: 'white', zIndex: 1 }}>
            <TableRow style={{ backgroundColor: "yellow" }}>
              <TableCell colSpan={2} className="fw-bold" style={{ fontWeight: "bold", fontSize: "14px" ,textAlign: "right" }}>Total</TableCell>
              <TableCell style={{ textAlign: "right", fontWeight: "bold", fontSize: "20px" }}>{formatReadableAmount(grandTotals.BillamountAmt)}</TableCell>
             
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {loading && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999
        }}>
          <RingLoader size={80} />
        </div>
      )}
      {error && <div className="alert alert-danger">{error}</div>}
    </div>
  );
};

export default AgingAnalysAccodeBlance;
