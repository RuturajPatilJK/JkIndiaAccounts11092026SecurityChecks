import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import '../../Reports/Ledger/GledgerReport.css'
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import PdfPreview from "../../../Common/PDFPreview"
import { Typography } from '@mui/material';
import { RingLoader } from 'react-spinners';
import { formatDate } from '../../../Common/FormatFunctions/FormatDate'
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount"
import { validateDocumentDate } from "../../../Common/ValidateDateRange/ValidateDateRange"
import "../../../Common/Fonts/Signika-Bold-normal";
import "../../../Common/Fonts/Signika-Regular-normal";
import "../../../Common/Fonts/Signika-Medium-normal";
import logo from "../../../Assets/jklogo.png";
import FooterJK from "../../../Assets/FooterJK.png";
import HeaderJK from "../../../Assets/HeaderJK.png";
import FooterJK1 from "../../../Assets/FooterJK1.png";
import Swal from "sweetalert2";

const GledgerReportForCA = () => {
  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");
  const Company_Name = sessionStorage.getItem("Company_Name");
  const Company_Address = sessionStorage.getItem("Company_Address");
  const Company_GSTNo = sessionStorage.getItem("Company_GSTNO")
  const Company_PanNo = sessionStorage.getItem("Company_PanNo")
  //const [displayCompanyName, setDisplayCompanyName] = useState(Company_Name);

  const CompanyNameUpdatedDate = sessionStorage.getItem("CompanyNameUpdatedDate")
  const newCompanyName = sessionStorage.getItem("newCompanyName")
   const oldFormerlyName = sessionStorage.getItem("oldFormerlyName")


  const API_URL = process.env.REACT_APP_API;
  const [ledgerData, setLedgerData] = useState([]);
  const [ledgerDataExcel, setLedgerDataExcel] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pdfPreview, setPdfPreview] = useState([])

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');
  const acCode = searchParams.get('acCode');
  const acname = searchParams.get('acname');
  const transType = searchParams.get('Trans_Type');
  const [totals, setTotals] = useState({ debit: 0, credit: 0 });
  const [filteredData, setFilteredData] = useState([]);
  

  const calculateTotals = (data) => {
    const totals = data.reduce(
      (acc, item) => {
        acc.debit += parseFloat(item.debit || 0);
        acc.credit += parseFloat(item.credit || 0);
        return acc;
      },
      { debit: 0, credit: 0 }
    );
    return totals;
  };

  useEffect(() => {
    const fetchGLedgerReport = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${process.env.REACT_APP_API}/get_gLedgerReport_AcWise_CA`,
          {
            params: {
              from_date: fromDate,
              to_date: toDate,
              Company_Code: companyCode,
              Accode: acCode
            },
          }
        );

        const data = response.data.all_data || [];
        const BalanceData = await handleCalculateBalance(response);

        let filteredData = BalanceData;
        if (transType && transType !== "All") {
          filteredData = BalanceData.filter(item =>
            item.TRAN_TYPE?.toUpperCase() === transType.toUpperCase()
          );
        }

        setLedgerData(BalanceData);
        setFilteredData(filteredData);
        setTotals(calculateTotals(filteredData));

      } catch (err) {
        setError("Error fetching report data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGLedgerReport();
  }, [acCode, fromDate, toDate, transType]);


  // useEffect(() => {
  //   if (fromDate && CompanyNameUpdatedDate) {
  //     const [day, month, year] = fromDate.split('/');
  //     const parsedFromDate = new Date(`${year}-${month}-${day}`);
  //     const cnameUpdatedDate = new Date(CompanyNameUpdatedDate);


  //     if (!isNaN(parsedFromDate) && !isNaN(cnameUpdatedDate)) {
  //       if (parsedFromDate < cnameUpdatedDate) {
  //         setDisplayCompanyName(newCompanyName);
  //       } else {
  //         setDisplayCompanyName(Company_Name);
  //       }
  //     }
  //   }
  // }, [fromDate, CompanyNameUpdatedDate, newCompanyName, Company_Name]);

   const docDate = new Date(toDate);
      const cnameUpdatedDate = new Date(CompanyNameUpdatedDate);
  
      const displayCompanyName =
        docDate < cnameUpdatedDate
          ? newCompanyName
          : Company_Name
  
  
  const mergeOpeningBalanceToAllData = (openingBalance, allData) => {
    let openingBalanceData = []
    if (openingBalance.length === 0) {
      openingBalanceData.push({
        AC_CODE: 0,
        Ac_Name_E: "Opening Balance",
        Balance: 0,
        DOC_DATE: "",
        DOC_NO: "",
        CA_NARRATION: "Opening balance",
        TRAN_TYPE: "OP",
        credit: 0,
        debit: 0,
        DRCR: ""
      })
    }
    else {
      openingBalanceData = openingBalance.map((balance) => ({
        AC_CODE: balance.AC_CODE,
        Ac_Name_E: "Opening Balance",
        Balance: balance.OpBal ? Math.abs(parseFloat(balance.OpBal)) : 0,
        DOC_DATE: "",
        DOC_NO: "",
        CA_NARRATION: "Opening balance",
        TRAN_TYPE: "OP",
        credit: balance.OpBal < 0 ? Math.abs(parseFloat(balance.OpBal)) : 0,
        debit: balance.OpBal > 0 ? Math.abs(parseFloat(balance.OpBal)) : 0,
        DRCR: balance.OpBal > 0 ? "D" : "C",
      }))
    };
    return [...openingBalanceData, ...allData];
  };

  const handleCalculateBalance = async (details) => {
    const LedgerData = details.data.all_data;
    const OpBalData = details.data.Opening_Balance ? details.data.Opening_Balance : "";
    let opBal = OpBalData.length > 0 ? OpBalData[0].OpBal : 0;
    let netdebit = 0;
    let netcredit = 0;
    if (opBal > 0) {
      netdebit = opBal;
    }
    else {
      netcredit = -opBal;
    }
    const mergedData = mergeOpeningBalanceToAllData(OpBalData, LedgerData);
    mergedData.forEach((entry) => {
      if (entry.drcr === "D") {
        opBal = opBal + Math.abs(parseFloat(entry.AMOUNT || 0).toFixed(2));
        netdebit += parseFloat(entry.AMOUNT || 0);
      } else {
        opBal = opBal - Math.abs(parseFloat(entry.AMOUNT || 0).toFixed(2));
        netcredit += parseFloat(entry.AMOUNT || 0).toFixed(2);
      }
      entry.Balance = opBal ? Math.abs(opBal).toFixed(2) : 0;
      entry.drcr = opBal > 0 ? "Dr" : "Cr";
    });
    return mergedData;
  }

 
  const handlePrint = async () => {
    const doc = new jsPDF('portrait');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let currentY = 9;

    const response = await axios.get(`${process.env.REACT_APP_API}/accountmaster-address`, {
     params: { ac_code: acCode, Company_Code: companyCode }
    });
    const headerData = response.data?.[0] || {};

    const foormerlyName = fromDate < CompanyNameUpdatedDate ? oldFormerlyName : headerData.AL1

    // Logo
    const logoImg = new Image();
    logoImg.src = logo;
    const headerImg = new Image();
    const footerImg1 = new Image();
    headerImg.src = HeaderJK;
        footerImg1.src = FooterJK1
        const shouldUseImage =
  docDate >= cnameUpdatedDate
    await new Promise(resolve => {
  logoImg.onload = () => {
    if (shouldUseImage) {
      // Use header image across top (new template)
      doc.addImage(headerImg, "PNG", 0, 6, 180, 34); // full width
    } else {
      // Use logo + address details
      doc.addImage(logoImg, "PNG", 10, currentY, 30, 30);

      // Header text
      doc.setFont("Signika-Bold");
      doc.setFontSize(14);
      doc.text(displayCompanyName, 45, currentY + 5);

      doc.setFont("Signika-Regular");
      doc.setFontSize(9);
      doc.text(`${foormerlyName}`, 45, currentY + 9);
      doc.text(headerData.AL2 || "", 45, currentY + 13);
      doc.text(headerData.AL3 || "", 45, currentY + 17);
      doc.text(headerData.AL4 || "", 45, currentY + 21);
      doc.text(headerData.Other || "", 45, currentY + 25);
      if (headerData.BillFooter) {
        doc.text(headerData.BillFooter, 45, currentY + 29);
      }
    }

    resolve();
  };
});
    doc.setDrawColor(80, 80, 80);
    doc.line(10, 44, 200, 44);
    currentY += 40;

    // Section title
    doc.setFont("Signika-Bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 128, 0);
    doc.text("LEDGER ACCOUNT", pageWidth / 2, 49, { align: "center" });
    doc.setTextColor(0, 0, 0);
    doc.line(10, 52, 200, 52);
    currentY += 2;

    // "To" Block
    // let leftY = currentY;
    // doc.setFont("Signika-Regular");
    // doc.setFontSize(8);
    // doc.text("To,", 12, leftY + 5);
    // doc.setFont("Signika-Bold");
    // doc.setTextColor(0, 128, 0);
    // doc.text(`${headerData.Ac_Name_E} (${acCode}) `, 12, leftY + 10);
    // doc.setFont("Signika-Regular");
    // doc.setTextColor(0, 0, 0);
    // doc.text(headerData.Address_E || "", 12, leftY + 15);
    // doc.text(`City: ${headerData.cityname} (${headerData.State_Name} - ${headerData.GSTStateCode})`, 12, leftY + 20);
    // doc.text(`GST: ${headerData.Gst_No}`, 12, leftY + 25);
    // if (headerData.Email) {
    //   doc.text(`Email: ${headerData.Email}`, 12, leftY + 30);
    // }


    let leftY = currentY;
doc.setFont("Signika-Regular");
doc.setFontSize(8);
doc.text("To,", 12, leftY + 5);

doc.setFont("Signika-Bold");
doc.setTextColor(0, 128, 0);
doc.text(`${headerData.Ac_Name_E} (${acCode})`, 12, leftY + 10);

doc.setFont("Signika-Regular");
doc.setTextColor(0, 0, 0);

let addressLines = doc.splitTextToSize(headerData.Address_E || "", 100); 
for (let i = 0; i < addressLines.length; i++) {
  doc.text(addressLines[i], 12, leftY + 15 + i * 5); 
}

let addressBlockHeight = addressLines.length * 5;
let nextY = leftY + 15 + addressBlockHeight;

doc.text(`City: ${headerData.cityname} (${headerData.State_Name} - ${headerData.GSTStateCode})`, 12, nextY);
nextY += 5;

doc.text(`GST: ${headerData.Gst_No}`, 12, nextY);
nextY += 5;

if (headerData.Email) {
  doc.text(`Email: ${headerData.Email}`, 12, nextY);
}

    // Summary
    const summaryX = 135;
    let rightY = currentY;
    const openingBalance = ledgerData[0]?.TRAN_TYPE === "OP" ? parseFloat(ledgerData[0]?.Balance) : 0;
    const net = parseFloat(totals.debit - totals.credit);

    doc.setFont("Signika-Regular");
    doc.text(`Ledger from ${formatDate(fromDate)} to ${formatDate(toDate)}`, summaryX, rightY + 5);
    rightY += 5;

    doc.setFont("Signika-Bold");
    doc.text("SUMMARY", summaryX, rightY + 5);
    rightY += 5;

    doc.setFont("Signika-Regular");
    doc.text("Opening Balance", summaryX, rightY + 5);
    doc.text(`${formatReadableAmount(openingBalance || 0)} Cr.`, summaryX + 60, rightY + 5, { align: "right" });

    rightY += 5;
    doc.text("Credited Amount", summaryX, rightY + 5);
    doc.text(`${formatReadableAmount(totals.credit)} Cr.`, summaryX + 60, rightY + 5, { align: "right" });

    rightY += 5;
    doc.text("Debited Amount", summaryX, rightY + 5);
    doc.text(`${formatReadableAmount(totals.debit)} Dr.`, summaryX + 60, rightY + 5, { align: "right" });

    rightY += 5;
    doc.text("Closing Balance", summaryX, rightY + 5);
    doc.line(summaryX, rightY + 2, 195, rightY +2);
    doc.setFont("Signika-Bold"); // Balance in bold
    doc.text(`${formatReadableAmount(Math.abs(net))} ${net > 0 ? "Dr." : "Cr."}`, summaryX + 60, rightY + 5, { align: "right" });
    doc.line(summaryX, rightY + 7, 195, rightY + 7);

    currentY = Math.max(leftY + 40, rightY + 8);

    // Table Header
    const drawTableHeader = () => {
      doc.setFont("Signika-Bold");
      doc.line(10, currentY - 4, 200, currentY - 4);
      doc.text("Date", 12, currentY);
      doc.text("Particulars", 35, currentY);
      doc.text("Vch Type", 95, currentY, { align: "center" });
      doc.text("Vch No.", 113, currentY, { align: "center" });
      doc.text("Debit", 140, currentY, { align: "right" });
      doc.text("Credit", 165, currentY, { align: "right" });
      doc.text("Balance", 190, currentY, { align: "right" });
      //doc.text("Dr/Cr", 195, currentY, { align: "left" });
      doc.line(10, currentY + 2, 200, currentY + 2);
      currentY += 5;
    };

    // Footer
    const drawFooter = (pageNum, totalPages, showFullFooter = false) => {
      const footerImageHeight = 28;
      const footerImageY = pageHeight - footerImageHeight - 12;
      const pageNumberY = pageHeight - 5;

      if (showFullFooter) {
        doc.setDrawColor(160);
        doc.setLineWidth(0.5);
        if(shouldUseImage)
        {
        doc.addImage(FooterJK, "PNG", 0, footerImageY, 260, footerImageHeight);
        }else{
            doc.addImage(footerImg1, "PNG", 0, footerImageY, 210, footerImageHeight);
        }
      }

      doc.setFont("Signika-Regular");
      doc.setFontSize(8);
      doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, pageNumberY, { align: "center" });
    };


    // Body Rendering
    doc.setFont("Signika-Regular");
    drawTableHeader();

    const footerHeight = 35; // full footer height (image + spacing)
    const marginBottom = 10;
    const usablePageHeight = pageHeight - footerHeight;

    for (let i = 0; i < filteredData.length; i++) {
      const item = filteredData[i];
      const narrationX = 35;
      const narrationMaxWidth = 55;
      const lineHeight = 5;
      const narrationLines = doc.splitTextToSize(item.CA_NARRATION  || "", narrationMaxWidth);
      const requiredHeight = narrationLines.length * lineHeight;

    if (currentY + 10 > usablePageHeight) {
  doc.addPage();
  currentY = 10;
  drawTableHeader();
}

      doc.setFont("Signika-Regular");
      const drcrText = item.drcr;

      doc.text(item.DOC_DATE || "", 12, currentY + 1);
      doc.text(item.TRAN_TYPE || "", 95, currentY + 1, { align: "center" });
      doc.text(String(item.DOC_NO), 113, currentY + 1, { align: "center" });
      doc.text(formatReadableAmount(item.debit || 0), 140, currentY + 1, { align: "right" });
      doc.text(formatReadableAmount(item.credit || 0), 165, currentY + 1, { align: "right" });
      doc.text(formatReadableAmount(Math.abs(item.Balance || 0)), 190, currentY + 1, { align: "right" });
      doc.text(drcrText, 191, currentY + 1, { align: "left" });

      narrationLines.forEach((line, index) => {
        doc.text(line, narrationX, currentY + 1 + index * lineHeight);
      });

      currentY += requiredHeight;
    }


    // Totals Row
    if (currentY + 10 > usablePageHeight) {
      doc.addPage();
      currentY = 10;
      drawTableHeader();
    }

    doc.setFont("Signika-Bold");
    doc.line(10, currentY - 2, 200, currentY - 2);
    doc.text(formatReadableAmount(totals.debit.toFixed(2)), 140, currentY + 2, { align: "right" });
    doc.text(formatReadableAmount(totals.credit.toFixed(2)), 165, currentY + 2, { align: "right" });
    doc.text(formatReadableAmount(Math.abs(net).toFixed(2)), 190, currentY + 2, { align: "right" });
    doc.text(net > 0 ? "Dr." : "Cr.", 191, currentY + 2, { align: "left" });
    doc.line(10, currentY + 4, 200, currentY + 4);
    doc.setFont("Signika-Regular");
    doc.text("***END OF LEDGER*** ", 90, currentY + 8)

    const totalPages = doc.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const isLastPage = i === totalPages;
      const isSinglePage = totalPages === 1;

      // Show page number always, full footer only on last page or if single page
      drawFooter(i, totalPages, isLastPage || isSinglePage);
    }

    doc.autoPrint();
    const printWindow = window.open(doc.output("bloburl"), "_blank");
    printWindow.print();
  };


  // const handleExportToExcel = () => {
  //   const wb = XLSX.utils.book_new();

  //   const headers = [
  //     [displayCompanyName],
  //     [`Account Statement of: (${acCode || ""}) ${acname || ""}`],
  //     [`From Date: ${formatDate(fromDate) || ""} To Date: ${formatDate(toDate) || ""}`],
  //     [],
  //     ["Trans Type", "Doc No", "Date", "Narration", "Debit", "Credit", "Balance", "DR/CR", "Do No"]
  //   ];

  //   const dataRows = filteredData.map(item => {
  //     let formattedDate = "";
  //     if (item.DOC_DATE) {
  //       const dateParts = item.DOC_DATE.split(/[-/]/);
  //       if (dateParts.length === 3) {
  //         formattedDate = `${dateParts[0].padStart(2, '0')}/${dateParts[1].padStart(2, '0')}/${dateParts[2]}`;
  //       } else {
  //         formattedDate = item.DOC_DATE;
  //       }
  //     }

  //     return [
  //       item.TRAN_TYPE,
  //       item.DOC_NO,
  //       formattedDate,
  //       item.NARRATION,
  //       parseFloat(item.debit || 0),
  //       parseFloat(item.credit || 0),
  //       parseFloat(item.Balance || 0),
  //       item.drcr,
  //       item.do_no
  //     ];
  //   });
  //   const wsData = [...headers, ...dataRows];
  //   const ws = XLSX.utils.aoa_to_sheet(wsData);
  //   ws["!cols"] = [
  //     { wch: 10 },
  //     { wch: 8 },
  //     { wch: 10 },
  //     { wch: 30 },
  //     { wch: 15 },
  //     { wch: 15 },
  //     { wch: 15 },
  //     { wch: 8 },
  //     { wch: 8 },
  //   ];

  //   const range = XLSX.utils.decode_range(ws["!ref"]);

  //   for (let R = 0; R <= range.e.r; R++) {
  //     for (let C = 0; C <= range.e.c; C++) {
  //       const cellRef = XLSX.utils.encode_cell({ r: R, c: C });

  //       if (!ws[cellRef]) continue;

  //       if (R < 4) {
  //         ws[cellRef].s = {
  //           font: { bold: true },
  //           alignment: { horizontal: 'center' }
  //         };
  //         continue;
  //       }

  //       if (R === 4) {
  //         ws[cellRef].s = {
  //           font: { bold: true },
  //           fill: { fgColor: { rgb: "D3D3D3" } }
  //         };
  //         continue;
  //       }

  //       if ([4, 5, 6].includes(C)) {
  //         ws[cellRef].t = 'n';
  //         ws[cellRef].z = '#,##0.00';
  //         ws[cellRef].s = { alignment: { horizontal: 'right' } };
  //       }

  //       if (C === 2 && R > 4) {
  //         ws[cellRef].t = 's';
  //         ws[cellRef].s = { alignment: { horizontal: 'left' } };
  //       }
  //     }
  //   }

  //   XLSX.utils.book_append_sheet(wb, ws, "Ledger Report");
  //   XLSX.writeFile(wb, `Account Statement of ${acname || "Ledger"}.xlsx`);
  // };

  const handleExportToExcel = () => {
  const wb = XLSX.utils.book_new();

  const headers = [
    [displayCompanyName],
    [`Account Statement of: (${acCode || ""}) ${acname || ""}`],
    [`From Date: ${formatDate(fromDate) || ""} To Date: ${formatDate(toDate) || ""}`],
    [],
    ["Trans Type", "Doc No", "Date", "Narration", "Debit", "Credit", "Balance", "DR/CR", "Do No"]
  ];

  const dataRows = filteredData.map(item => {
    let formattedDate = "";
    if (item.DOC_DATE) {
      const dateParts = item.DOC_DATE.split(/[-/]/);
      if (dateParts.length === 3) {
        formattedDate = `${dateParts[0].padStart(2, '0')}/${dateParts[1].padStart(2, '0')}/${dateParts[2]}`;
      } else {
        formattedDate = item.DOC_DATE;
      }
    }

    return [
      item.TRAN_TYPE,
      item.DOC_NO,
      formattedDate,
      item.CA_NARRATION ,
      parseFloat(item.debit || 0),
      parseFloat(item.credit || 0),
      parseFloat(item.Balance || 0),
      item.drcr,
      item.do_no
    ];
  });


  const totalDebit = filteredData.reduce((sum, item) => sum + parseFloat(item.debit || 0), 0);
  const totalCredit = filteredData.reduce((sum, item) => sum + parseFloat(item.credit || 0), 0);
  const totalBalance = Math.abs(totalDebit - totalCredit);
  const drCr = totalDebit > totalCredit ? 'Dr' : 'Cr';


  const totalsRow = [
    "",
    "",
    "",
    "Totals",
    totalDebit,
    totalCredit,
    totalBalance,
    drCr,
    ""
  ];

  const wsData = [...headers, ...dataRows, totalsRow];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  ws["!cols"] = [
    { wch: 10 },
    { wch: 8 },
    { wch: 10 },
    { wch: 30 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 8 },
    { wch: 8 },
  ];

  const range = XLSX.utils.decode_range(ws["!ref"]);

  for (let R = 0; R <= range.e.r; R++) {
    for (let C = 0; C <= range.e.c; C++) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });

      if (!ws[cellRef]) continue;


      if (R < 4) {
        ws[cellRef].s = {
          font: { bold: true },
          alignment: { horizontal: 'center' }
        };
        continue;
      }


      if (R === 4) {
        ws[cellRef].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "D3D3D3" } }
        };
        continue;
      }


      if (R === range.e.r) {
        ws[cellRef].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "FFFF00" } }, 
          alignment: { horizontal: C >= 4 && C <= 6 ? 'right' : 'left' }
        };
        continue;
      }

      if ([4, 5, 6].includes(C)) {
        ws[cellRef].t = 'n';
        ws[cellRef].z = '#,##0.00';
        ws[cellRef].s = { alignment: { horizontal: 'right' } };
      }

      if (C === 2 && R > 4) {
        ws[cellRef].t = 's';
        ws[cellRef].s = { alignment: { horizontal: 'left' } };
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, "Ledger Report");
  XLSX.writeFile(wb, `Account Statement of ${acname || "Ledger"}.xlsx`);
};


  const convertDateToISO = (dateStr) => {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parts[0];
      const month = parts[1];
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    return null;
  };

  const handleRowClick = (doc_no, tran_type, DOC_DATE) => {

    if (doc_no === 0) {
      Swal.fire({
        title: "Invalid Document Number",
        text: "The document number is invalid",
        icon: "error",
        confirmButtonText: "OK"
      });
      return;
    }
    const accountingYearData = sessionStorage.getItem('Accounting_Year');
    const formattedEntryDate = convertDateToISO(DOC_DATE);

    const isValid = validateDocumentDate(formattedEntryDate, accountingYearData);

    if (!isValid) {
      return
    }

    if (tran_type === 'CV' || tran_type === 'LV') {
      const url = `${window.location.origin}/commission-bill`
      const params = new URLSearchParams({
        selectedVoucherNo: doc_no,
        selectedVoucherType: tran_type
      });
      window.open(`${url}?${params.toString()}`, '_blank');
    }
    if (tran_type === 'CR' || tran_type === 'BR' || tran_type === 'BP' || tran_type === 'CP') {
      const url = `${window.location.origin}/receipt-payment`;
      const params = new URLSearchParams({
        navigatedRecord: doc_no,
        navigatedTranType: tran_type
      });
      window.open(`${url}?${params.toString()}`, '_blank');
    }

    if (tran_type === 'UI') {
      const url = `${window.location.origin}/utr-entry`;
      const params = new URLSearchParams({
        navigatedRecord: doc_no,
      });
      window.open(`${url}?${params.toString()}`, '_blank');
    }

    if (tran_type === 'JV') {
      const url = `${window.location.origin}/journal-voucher`;
      const params = new URLSearchParams({
        navigatedRecord: doc_no,
        navigatedTranType: tran_type
      });
      window.open(`${url}?${params.toString()}`, '_blank');
    }

    if (
      tran_type === "DN" ||
      tran_type === "DS" ||
      tran_type === "CN" ||
      tran_type === "CS"
    ) {
      const url = `${window.location.origin}/debitcreditnote`;
      const params = new URLSearchParams({
        navigatedRecord: doc_no,
        navigatedTranType: tran_type,
      });
      window.open(`${url}?${params.toString()}`, "_blank");
    }

    if (tran_type === "XP") {
      const url = `${window.location.origin}/other-purchase`;
      const params = new URLSearchParams({
        navigatedRecord: doc_no,
        navigatedTranType: tran_type,
      });
      window.open(`${url}?${params.toString()}`, "_blank");
    }

    if (tran_type === "RB") {
      const url = `${window.location.origin}/service-bill`;
      const params = new URLSearchParams({
        navigatedRecord: doc_no,
      });
      window.open(`${url}?${params.toString()}`, "_blank");
    }
    if (tran_type === "SB") {
      const url = `${window.location.origin}/sale-bill`;
      const params = new URLSearchParams({
        navigatedRecord: doc_no,
      });
      window.open(`${url}?${params.toString()}`, "_blank");
    }
    if (tran_type === "PS") {
      const url = `${window.location.origin}/sugarpurchasebill`;
      const params = new URLSearchParams({
        navigatedRecord: doc_no,
      });
      window.open(`${url}?${params.toString()}`, "_blank");
    }

    if (tran_type === "PR") {
      const url = `${window.location.origin}/sugar-sale-return-purchase`;
      const params = new URLSearchParams({
        navigatedRecord: doc_no,
      });
      window.open(`${url}?${params.toString()}`, "_blank");
    }
    if (tran_type === "RS") {
      const url = `${window.location.origin}/sugar-sale-return-sale`;
      const params = new URLSearchParams({
        navigatedRecord: doc_no,
      });
      window.open(`${url}?${params.toString()}`, "_blank");
    }

    if (
      tran_type === "LV" ||
      tran_type === "CV"
    ) {
      const url = `${window.location.origin}/commission-bill`;
      const params = new URLSearchParams({
        selectedVoucherNo: doc_no,
        selectedVoucherType: tran_type,
      });
      window.open(`${url}?${params.toString()}`, "_blank");
    }

    if (tran_type === 'DO') {
      const url = `${window.location.origin}/delivery-order`;
      const params = new URLSearchParams({
        navigatedRecord: doc_no
      });
      window.open(`${url}?${params.toString()}`, '_blank');
    }
  };


  const generatePdf = async () => {
       const doc = new jsPDF('portrait');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let currentY = 9;

     const response = await axios.get(`${process.env.REACT_APP_API}/accountmaster-address`, {
     params: { ac_code: acCode, Company_Code: companyCode }
    });
    const headerData = response.data?.[0] || {};

     const foormerlyName = fromDate < CompanyNameUpdatedDate ? oldFormerlyName : headerData.AL1

   const logoImg = new Image();
    logoImg.src = logo;
    const headerImg = new Image();
    const footerImg1 = new Image();
    headerImg.src = HeaderJK;
        footerImg1.src = FooterJK1
        const shouldUseImage =
  docDate >= cnameUpdatedDate
    await new Promise(resolve => {
  logoImg.onload = () => {
    if (shouldUseImage) {
      // Use header image across top (new template)
      doc.addImage(headerImg, "PNG", 0, 6, 190, 33); // full width
    } else {
      // Use logo + address details
      doc.addImage(logoImg, "PNG", 10, currentY, 30, 30);

      // Header text
      doc.setFont("Signika-Bold");
      doc.setFontSize(14);
      doc.text(displayCompanyName, 45, currentY + 5);

      doc.setFont("Signika-Regular");
      doc.setFontSize(9);
      doc.text(`${foormerlyName}`, 45, currentY + 9);
      doc.text(headerData.AL2 || "", 45, currentY + 13);
      doc.text(headerData.AL3 || "", 45, currentY + 17);
      doc.text(headerData.AL4 || "", 45, currentY + 21);
      doc.text(headerData.Other || "", 45, currentY + 25);
      if (headerData.BillFooter) {
        doc.text(headerData.BillFooter, 45, currentY + 29);
      }
    }

    resolve();
  };
});
    doc.setDrawColor(80, 80, 80);
    doc.line(10, 44, 200, 44);
    currentY += 40;


    // Section title
    doc.setFont("Signika-Bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 128, 0);
    doc.text("LEDGER ACCOUNT", pageWidth / 2, 49, { align: "center" });
    doc.setTextColor(0, 0, 0);
    doc.line(10, 52, 200, 52);
    currentY += 2;

    // "To" Block
    // let leftY = currentY;
    // doc.setFont("Signika-Regular");
    // doc.setFontSize(8);
    // doc.text("To,", 12, leftY + 5);
    // doc.setFont("Signika-Bold");
    // doc.setTextColor(0, 128, 0);
    // doc.text(`(${acCode}) ${headerData.Ac_Name_E}`, 12, leftY + 10);
    // doc.setFont("Signika-Regular");
    // doc.setTextColor(0, 0, 0);
    // doc.text(headerData.Address_E || "", 12, leftY + 15);
    // doc.text(`City: ${headerData.cityname} (${headerData.State_Name} - ${headerData.GSTStateCode})`, 12, leftY + 20);
    // doc.text(`GST: ${headerData.Gst_No}`, 12, leftY + 25);
    // if (headerData.Email) {
    //   doc.text(`Email: ${headerData.Email}`, 12, leftY + 30);
    // }



    // "To" Block
let leftY = currentY;
doc.setFont("Signika-Regular");
doc.setFontSize(8);
doc.text("To,", 12, leftY + 5);

doc.setFont("Signika-Bold");
doc.setTextColor(0, 128, 0);
doc.text(`${headerData.Ac_Name_E} (${acCode})`, 12, leftY + 10);

doc.setFont("Signika-Regular");
doc.setTextColor(0, 0, 0);

// Split the address into multiple lines (e.g. 100 chars per line or fit to page width)
let addressLines = doc.splitTextToSize(headerData.Address_E || "", 100); // Adjust 180 to fit your page width
for (let i = 0; i < addressLines.length; i++) {
  doc.text(addressLines[i], 12, leftY + 15 + i * 5); // Add lines with spacing
}

// After address, update vertical position accordingly
let addressBlockHeight = addressLines.length * 5;
let nextY = leftY + 15 + addressBlockHeight;

doc.text(`City: ${headerData.cityname} (${headerData.State_Name} - ${headerData.GSTStateCode})`, 12, nextY);
nextY += 5;

doc.text(`GST: ${headerData.Gst_No}`, 12, nextY);
nextY += 5;

if (headerData.Email) {
  doc.text(`Email: ${headerData.Email}`, 12, nextY);
}


    // Summary
    const summaryX = 135;
    let rightY = currentY;
    const openingBalance = ledgerData[0]?.TRAN_TYPE === "OP" ? parseFloat(ledgerData[0]?.Balance) : 0;
    const net = parseFloat(totals.debit - totals.credit);

    doc.setFont("Signika-Regular");
    doc.text(`Ledger from ${formatDate(fromDate)} to ${formatDate(toDate)}`, summaryX, rightY + 5);
    rightY += 5;

    doc.setFont("Signika-Bold");
    doc.text("SUMMARY", summaryX, rightY + 5);
    rightY += 5;

    doc.setFont("Signika-Regular");
    doc.text("Opening Balance", summaryX, rightY + 5);
    doc.text(`${formatReadableAmount(openingBalance || 0)} Cr.`, summaryX + 60, rightY + 5, { align: "right" });

    rightY += 5;
    doc.text("Credited Amount", summaryX, rightY + 5);
    doc.text(`${formatReadableAmount(totals.credit)} Cr.`, summaryX + 60, rightY + 5, { align: "right" });

    rightY += 5;
    doc.text("Debited Amount", summaryX, rightY + 5);
    doc.text(`${formatReadableAmount(totals.debit)} Dr.`, summaryX + 60, rightY + 5, { align: "right" });

    rightY += 5;
    doc.text("Closing Balance", summaryX, rightY + 5);
    doc.line(summaryX, rightY + 2, 195, rightY +2);
    doc.setFont("Signika-Bold"); // Balance in bold
    doc.text(`${formatReadableAmount(Math.abs(net))} ${net > 0 ? "Dr." : "Cr."}`, summaryX + 60, rightY + 5, { align: "right" });
    doc.line(summaryX, rightY + 7, 195, rightY + 7);

    currentY = Math.max(leftY + 40, rightY + 8);

    // Table Header
    const drawTableHeader = () => {
      doc.setFont("Signika-Bold");
      doc.line(10, currentY - 4, 200, currentY - 4);
      doc.text("Date", 12, currentY);
      doc.text("Particulars", 35, currentY);
      doc.text("Vch Type", 95, currentY, { align: "center" });
      doc.text("Vch No.", 113, currentY, { align: "center" });
      doc.text("Debit", 140, currentY, { align: "right" });
      doc.text("Credit", 165, currentY, { align: "right" });
      doc.text("Balance", 190, currentY, { align: "right" });
      //doc.text("Dr/Cr", 195, currentY, { align: "left" });
      doc.line(10, currentY + 2, 200, currentY + 2);
      currentY += 5;
    };

    // Footer
    const drawFooter = (pageNum, totalPages, showFullFooter = false) => {
      const footerImageHeight = 28;
      const footerImageY = pageHeight - footerImageHeight - 12;
      const pageNumberY = pageHeight - 5;

      if (showFullFooter) {
        doc.setDrawColor(160);
        doc.setLineWidth(0.5);
        if(shouldUseImage){
        doc.addImage(FooterJK, "PNG", 0, footerImageY, 260, footerImageHeight);
        }else{
          doc.addImage(footerImg1, "PNG", 0, footerImageY, 210, footerImageHeight);
        }
      }

      doc.setFont("Signika-Regular");
      doc.setFontSize(8);
      doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, pageNumberY, { align: "center" });
    };


    // Body Rendering
    doc.setFont("Signika-Regular");
    drawTableHeader();

    const footerHeight = 35; // full footer height (image + spacing)
    const marginBottom = 10;
    const usablePageHeight = pageHeight - footerHeight;

    for (let i = 0; i < filteredData.length; i++) {
      const item = filteredData[i];
      const narrationX = 35;
      const narrationMaxWidth = 55;
      const lineHeight = 5;
      const narrationLines = doc.splitTextToSize(item.CA_NARRATION  || "", narrationMaxWidth);
      const requiredHeight = narrationLines.length * lineHeight;

      if (currentY + 10 > usablePageHeight) {
  doc.addPage();
  currentY = 10;
  drawTableHeader();
}

      doc.setFont("Signika-Regular");
      const drcrText = item.drcr;

      doc.text(item.DOC_DATE || "", 12, currentY + 1);
      doc.text(item.TRAN_TYPE || "", 95, currentY + 1, { align: "center" });
      doc.text(String(item.DOC_NO), 113, currentY + 1, { align: "center" });
      doc.text(formatReadableAmount(item.debit || 0), 140, currentY + 1, { align: "right" });
      doc.text(formatReadableAmount(item.credit || 0), 165, currentY + 1, { align: "right" });
      doc.text(formatReadableAmount(Math.abs(item.Balance || 0)), 190, currentY + 1, { align: "right" });
      doc.text(drcrText, 191, currentY + 1, { align: "left" });

      narrationLines.forEach((line, index) => {
        doc.text(line, narrationX, currentY + 1 + index * lineHeight);
      });

      currentY += requiredHeight;
    }


    // Totals Row
    if (currentY + 10 > usablePageHeight) {
      doc.addPage();
      currentY = 10;
      drawTableHeader();
    }

    doc.setFont("Signika-Bold");
    doc.line(10, currentY - 2, 200, currentY - 2);
    doc.text(formatReadableAmount(totals.debit.toFixed(2)), 140, currentY + 2, { align: "right" });
    doc.text(formatReadableAmount(totals.credit.toFixed(2)), 165, currentY + 2, { align: "right" });
    doc.text(formatReadableAmount(Math.abs(net).toFixed(2)), 190, currentY + 2, { align: "right" });
    doc.text(net > 0 ? "Dr." : "Cr.", 191, currentY + 2, { align: "left" });
    doc.line(10, currentY + 4, 200, currentY + 4);
    doc.setFont("Signika-Regular");
    doc.text("***END OF LEDGER*** ", 90, currentY + 8)

    const totalPages = doc.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const isLastPage = i === totalPages;
      const isSinglePage = totalPages === 1;

      // Show page number always, full footer only on last page or if single page
      drawFooter(i, totalPages, isLastPage || isSinglePage);
    }
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    setPdfPreview(url);

  };

  return (
    <div className="ledger-report-container">
      <div className="col-auto">
        <button className="btn btn-secondary me-2" onClick={handlePrint}>
          Print Report
        </button>
        <button className="btn btn-success" onClick={handleExportToExcel}>
          Export to Excel
        </button>
        {pdfPreview && pdfPreview.length > 0 && (
          <PdfPreview pdfData={pdfPreview} apiData={ledgerData[0]} label={"GLedger"} />
        )}
        <button onClick={generatePdf} className="btn btn-secondary">PDF</button>
      </div>
      <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold", marginTop: "10px" }}>{displayCompanyName}</Typography>
      <div>
        <p><strong> {" "}
          ({acCode || ""}) {" "}
          {acname || ""} {" "}
          From Date: {fromDate ? formatDate(fromDate) : "N/A"} {" "}
          To Date: {toDate ? formatDate(toDate) : "N/A"} </strong>
          {transType && ` | Transaction Type: ${transType}`}
        </p>
      </div>

      {loading && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          <RingLoader />
        </div>
      )}
      {error && <p className="error-message">{error}</p>}

      {filteredData.length > 0 && (
        <>
          <div style={{ maxHeight: "800px", overflowY: "auto" }}>
            <table id="reportTable" style={{ marginBottom: "60px", width: "100%" }}>
              <thead style={{ position: "sticky", top: 0, backgroundColor: "#fff", zIndex: 1, whiteSpace: "nowrap" }}>
                <tr>
                  <th>Trans Type</th>
                  <th>Doc No</th>
                  <th>Date</th>
                  <th>Narration</th>
                  <th style={{ textAlign: "right" }}>Debit</th>
                  <th style={{ textAlign: "right" }}>Credit</th>
                  <th style={{ textAlign: "right" }}>Balance</th>
                  <th>DR/CR</th>
                  <th>Do No</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={index}>
                    <td>{item.TRAN_TYPE}</td>
                    <td onClick={() => handleRowClick(item.DOC_NO, item.TRAN_TYPE, item.DOC_DATE)} style={{
                      cursor: "pointer",
                      fontWeight: "bold",
                      color: "darkslategray",
                      textDecoration: "none"
                    }}
                      onMouseOver={(e) => {
                        e.target.style.color = 'black';
                        e.target.style.textDecoration = 'underline';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.color = 'darkslategray';
                        e.target.style.textDecoration = 'none';
                      }}>{item.DOC_NO}</td>
                    <td>{item.DOC_DATE}</td>
                    <td>{item.CA_NARRATION}</td>
                    <td style={{ textAlign: "right" }}>{formatReadableAmount(parseFloat(item.debit).toFixed(2) || 0.00)}</td>
                    <td style={{ textAlign: "right" }}>{formatReadableAmount(parseFloat(item.credit).toFixed(2) || 0.00)}</td>
                    <td style={{ textAlign: "right" }}>{formatReadableAmount(parseFloat(item.Balance).toFixed(2) || 0.00)}</td>
                    <td>{item.drcr}</td>
                    <td onClick={() => handleRowClick(item.do_no, "DO", item.DOC_DATE)} style={{
                      cursor: "pointer",
                      fontWeight: "bold",
                      color: "darkslategray",
                      textDecoration: "none"
                    }}
                      onMouseOver={(e) => {
                        e.target.style.color = 'black';
                        e.target.style.textDecoration = 'underline';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.color = 'darkslategray';
                        e.target.style.textDecoration = 'none';
                      }}>{item.do_no}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: "yellow" }}>
                  <td colSpan="4" align="right"><strong>Totals</strong></td>
                  <td style={{ textAlign: "right" }}><strong>{formatReadableAmount(totals.debit.toFixed(2))}</strong></td>
                  <td style={{ textAlign: "right" }}><strong>{formatReadableAmount(totals.credit.toFixed(2))}</strong></td>
                  <td style={{ textAlign: "right" }}><strong>{formatReadableAmount(Math.abs(parseFloat(totals.debit - totals.credit)).toFixed(2))}</strong></td>
                  <td ><strong>{(totals.debit.toFixed(2) - totals.credit.toFixed(2)) > 0 ? 'Dr' : 'Cr'}</strong></td>
                  <td ></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="centered-container">
          </div>
        </>
      )}
    </div>
  );

};

export default GledgerReportForCA;





