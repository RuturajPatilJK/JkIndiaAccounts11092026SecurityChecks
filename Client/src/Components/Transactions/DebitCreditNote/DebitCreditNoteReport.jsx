import React, { useState, useEffect, useRef } from "react";
import "../../Outward/SaleBill/invoice.css";
import logo from "../../../Assets/jklogo.png";
import logo1 from "../../../Assets/jk.png"
import Sign from "../../../Assets/DirectorSign.png";
import Sign1 from "../../../Assets/DirectorSign1.png";
import jsPDF from "jspdf";
import "jspdf-autotable";
import QRCode from "qrcode";
import PdfPreview from "../../../Common/PDFPreview";
import { ConvertNumberToWord } from "../../../Common/FormatFunctions/ConvertNumberToWord";
import PrintButton from "../../../Common/Buttons/PrintPDF";
import HeaderJK from "../../../Assets/HeaderJK.png";
import FooterJK from "../../../Assets/FooterJK.png";
import FooterJK1 from "../../../Assets/FooterJK1.png";
import "../../../Common/Fonts/Signika-Bold-normal";
import "../../../Common/Fonts/Signika-Regular-normal";
import "../../../Common/Fonts/Signika-Medium-normal";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";

const API_URL = process.env.REACT_APP_API;

const DebitCreditNoteReport = ({ doc_no, tran_type, disabledFeild }) => {
  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");
  const [invoiceData, setInvoiceData] = useState([]);
  const [pdfPreview, setPdfPreview] = useState(null);

  const TCSApplicable = sessionStorage.getItem("TCSApplicable");
  const AccountYear = sessionStorage.getItem("Accounting_Year");
  const CompanyNameUpdatedDate = sessionStorage.getItem("CompanyNameUpdatedDate")
  const newCompanyName = sessionStorage.getItem("newCompanyName")
  const oldFormerlyName = sessionStorage.getItem("oldFormerlyName")
  let formattedYear = "";

  if (AccountYear) {
    const years = AccountYear.split(" - ");
    if (years.length === 2) {
      const startYear = years[0].slice(0, 4);
      const endYear = years[1].slice(2, 4);
      formattedYear = `${startYear}-${endYear}`;
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());
    return `${day}/${month}/${year}`;
  };

  const fetchData = async () => {
    try {
      const response = await fetch(
        `${API_URL}/generating_DebitCredit_report?Company_Code=${companyCode}&Year_Code=${Year_Code}&doc_no=${doc_no}&tran_type=${tran_type}`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();

      setInvoiceData(data.all_data);
      generatePdf(data.all_data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const generatePdf = async (data) => {
    const pdf = new jsPDF({ orientation: "portrait" });
    const allData = data?.[0] || {};
    const docDate = new Date(allData.doc_date);
    const cnameUpdatedDate = new Date(CompanyNameUpdatedDate);

    const displayCompanyName =
      docDate < cnameUpdatedDate
        ? newCompanyName
        : allData.Company_Name_E;


    const logoToUse = docDate < cnameUpdatedDate ? logo : logo1;
    const SignToUse = docDate < cnameUpdatedDate ? Sign1 : Sign;
    const foormerlyName = docDate < cnameUpdatedDate ? oldFormerlyName : allData.AL1

    const logoImg = new Image();
    const signImg = new Image();
    const headerImg = new Image();
    const footerImg = new Image();
    const footerImg1 = new Image();
    logoImg.src = logo;
    signImg.src = SignToUse;
    headerImg.src = HeaderJK;
    footerImg.src = FooterJK;
    footerImg1.src = FooterJK1;
    const shouldUseImage =
      docDate >= cnameUpdatedDate

    let qrCodeData = "";
    qrCodeData = ` GSTN of Supplier: ${allData.GST || ""}\n
    GSTIN of Buyer: ${allData.ShipToGSTNo || ""}\n
    Document No: ${allData.doc_no || ""}\n
    Document Type:  ${allData.tran_type || ""}\n\n
    Date Of Creation Of Invoice: ${allData.doc_date || ""}\n
    HSN Code: ${allData.HSN || ""}\n
    IRN: ${allData.Ewaybillno || ""}\n
    Receipt Number:`;

    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeData.trim(), {
      width: 300,
      height: 300,
    });

    logoImg.src = logoToUse;
    logoImg.onload = () => {
      if (shouldUseImage) {
        // Use header image across top (new template)
        pdf.addImage(headerImg, "PNG", 0, 6, 180, 34); // full width
      } else {
        pdf.addImage(logoImg, "PNG", 10, 9, 30, 30);
        pdf.setFont("Signika-Bold");
        pdf.setFontSize(14);
        pdf.text(displayCompanyName, 45, 14);
        pdf.setFont("Signika-Regular");
        pdf.setFontSize(9);
        pdf.setFont("Signika-Regular");
        pdf.setFontSize(9);
        pdf.text(`${foormerlyName}`, 45, 18);
        pdf.text(`${allData.AL2}`, 45, 22);
        pdf.text(`${allData.AL3}`, 45, 26);
        pdf.text(`${allData.AL4}`, 45, 30);
        pdf.text(`${allData.Other}`, 45, 34);
        pdf.text(`${allData.BillFooter}`, 45, 38)
      }
      pdf.addImage(qrCodeDataUrl, "PNG", 170, 9, 30, 30);




      let invoiceText = "";
      if (tran_type === "DN") invoiceText = "DEBIT NOTE";
      else if (tran_type === "DS") invoiceText = "DEBIT NOTE";
      else if (tran_type === "CN") invoiceText = "CREDIT NOTE";
      else invoiceText = "CREDIT NOTE";

      // Set font to bold
      pdf.setFontSize(10);
      pdf.setFont("Signika-Bold");
      pdf.setDrawColor(80, 80, 80);
      pdf.line(10, 44, 200, 44);
      pdf.setTextColor(41, 122, 14);
      pdf.text(invoiceText, 95, 49);
      pdf.setLineWidth(0.3);
      pdf.setDrawColor(80, 80, 80);
      pdf.line(10, 52, 200, 52);
      pdf.setTextColor(0, 0, 0);


      let y = 45;
      pdf.setFontSize(9);

      const addressBlock = (
        x,
        yStart,
        title,
        lines,
        styleCondition = () => ({ color: "black", font: "Signika-Regular" })
      ) => {
        let y = yStart;
        const lineHeight = 4;

        if (title) {
          pdf.setFont("Signika-Medium");
          pdf.setTextColor(0, 0, 0);
          pdf.text(title, x, y + 10);
          y += lineHeight;
        }

        lines.forEach((line, index) => {
          const wrapped = pdf.splitTextToSize(String(line ?? ""), 85);
          const style = styleCondition(index, line);

          // Set font
          pdf.setFont(style.font || "Signika-Regular");

          // Set color
          if (style.color === "green") {
            pdf.setTextColor(41, 122, 14);
          } else {
            pdf.setTextColor(0, 0, 0);
          }

          wrapped.forEach((wLine) => {
            pdf.text(wLine, x, y + 10);
            y += lineHeight;
          });
        });

        return y;
      };


      const toManagingDirectorData = [
        allData.ShopTo_Name,
        allData.ShipToAddress,
        `City: ${allData.ShipToCity} (${allData.shiptostatename} - ${allData.ShipToStateCode})`,
        `GST: ${allData.ShipToGSTNo}`,
        `PAN: ${allData.CompanyPan}`,
        ...(allData.billtoFSSAI ? [`FSSAI: ${allData.billtoFSSAI}`] : []),
        ...(allData.billtoTAN && String(allData.billtoTAN).trim() !== "" && String(allData.billtoTAN).toLowerCase() !== "undefined"
          ? [`TAN: ${allData.billtoTAN}`]
          : []),

      ];

      let label = "";
      if (tran_type === "DN") label = "Debit Note";
      else if (tran_type === "DS") label = "Debit Note";
      else if (tran_type === "CN") label = "Credit Note";
      else label = "Credit Note";

      const transportDetail = [
        `Date: ${formatDate(allData.doc_date)}`,
        `${label ? label + " " : ""}No: ${tran_type}${formattedYear}-${allData.doc_no || ""}`,
        ...(allData.bill_no ? [`Bill No: ${allData.bill_no}`] : []),
        "",
        `E-Invoice No.: ${allData.Ewaybillno || ""}`,
        `Acknowledge: ${allData.ackno || ""}`,
      ];

      const addressStartY = y + 7;
      // setTextColor(0, 0, 0)
      const endYBill = addressBlock(
        12,
        addressStartY,
        "Buyer (Bill to), ",
        toManagingDirectorData,
        (index) =>
          index === 0
            ? { color: "green", font: "Signika-Bold" }
            : { color: "black", font: "Signika-Regular" }
      );


      const endYShip = addressBlock(
        110,
        addressStartY,
        "",
        transportDetail,
        () => ({ color: "black", font: "Signika-Regular" })
      );

      pdf.setDrawColor(80, 80, 80);
      pdf.line(105, addressStartY + 8, 105, Math.max(endYBill, endYShip) + 10);
      pdf.setDrawColor(80, 80, 80);
      pdf.line(
        10,
        Math.max(endYBill, endYShip) + 13,
        200,
        Math.max(endYBill, endYShip) + 13
      );
      y = Math.max(endYBill, endYShip) + 11;






      pdf.setLineWidth(0.3);
      pdf.setDrawColor(80, 80, 80);

      pdf.setFont("Signika-Medium");
      pdf.setTextColor(41, 122, 14);
      pdf.text("Particulars", 12, y + 7);
      // pdf.text("Short Name", 60, y + 7, { align: "left" });
      pdf.text("HSN", 130, y + 7);
      pdf.text("Value", 185, y + 7);
      y += 5;

      pdf.setLineWidth(0.3);
      pdf.setDrawColor(80, 80, 80);
      pdf.line(10, y + 5, 200, y + 5);

      pdf.setFont("Signika-Medium");
      pdf.setTextColor(0, 0, 0);
      // pdf.text(String(allData.Narration), 12, y + 9);


      const itemDescLines = pdf.splitTextToSize(allData.Narration || "-", 100);
      const maxLines = Math.max(itemDescLines.length);
      const itemLineHeight = 4;

      for (let i = 0; i < maxLines; i++) {
        const lineY = y + 9 + i * itemLineHeight;
        if (i < itemDescLines.length) pdf.text(itemDescLines[i], 12, lineY);
        if (i === 0) {
          pdf.text(allData.HSN || "-", 130, lineY);

        }
      }


    
      const value = parseFloat(allData.value || 0);

      const formattedValue = Number(value).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
      });
      const amountX = 197;
      const rateX = 170;
      const labelX = 140;


      pdf.text(formattedValue, amountX, y + 9, { align: "right" });

      y += 8;
      pdf.setFont("Signika-Regular");



      y += 8;

      // 1. Parse out your rates / amounts
      const igstRate = parseFloat(allData.igst_rate) || 0;
      const igstAmt = parseFloat(allData.igst_amount) || 0;

      const cgstRate = parseFloat(allData.cgst_rate) || 0;
      const cgstAmt = parseFloat(allData.cgst_amount) || 0;

      const sgstRate = parseFloat(allData.sgst_rate) || 0;
      const sgstAmt = parseFloat(allData.sgst_amount) || 0;



      const taxRows = [];

      if (igstRate > 0) {
        // only IGST
        taxRows.push(["IGST", igstRate, igstAmt]);
      } else {
        taxRows.push(
          ["CGST", cgstRate, cgstAmt],
          ["SGST", sgstRate, sgstAmt]
        );
      }
      const showMisc = parseFloat(allData.misc_amount) !== 0;
      const summaryFields = [
        ...(allData.carporateSaleDoc === 0 ||
          allData.carporateSaleDoc === "" ||
          allData.carporateSaleDoc === null
          ? [["Freight", allData.LESS_FRT_RATE, allData.freight]]
          : []),

        ["Taxable Amount", "", allData.texable_amount],
        ...taxRows,
        ...(showMisc ? [["MISC", "", allData.misc_amount]] : []),

        ...(TCSApplicable === "N"
          ? []
          : [
            ["TCS:", allData.TCS_Rate, allData.TCS_Amt],
            ["TCS Net Payable:", "", allData.TCS_Net_Payable],
          ]),
      ];

      summaryFields.forEach(([label, rate, amount]) => {
        pdf.setFont("Signika-Regular");

        // Label
        pdf.text(`${label}:`, 130, y + 55);

        // Rate, if available
        if (rate !== null && rate !== undefined && rate !== "") {
          pdf.text(`${formatReadableAmount(rate)}%`, 165, y + 55, { align: "center" });
        }

        // Format amount safely
        const formattedAmount = formatReadableAmount(amount);
        pdf.text(formattedAmount, 197, y + 55, { align: "right" });

        y += 5;
      });


      pdf.setLineWidth(0.3);
      pdf.setDrawColor(80, 80, 80);
      pdf.line(10, y + 70, 200, y + 70);


      const totalInWords = ConvertNumberToWord(
        parseFloat(allData.TCS_Net_Payable)
      );
      pdf.text(`Rs: ${totalInWords}.`, 12, y + 65);
      const formattedTotal = Number(allData.TCS_Net_Payable || 0).toLocaleString(
        "en-IN",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      );

      pdf.setFont("Signika-Bold");
      pdf.setTextColor(41, 122, 14);
      pdf.text("Total Amount:", 150, y + 65);
      pdf.text(`₹ ${formattedTotal}`, amountX, y + 65, { align: "right" });

      y += 5;
      pdf.setLineWidth(0.3);
      pdf.line(10, y + 55, 200, y + 55);

      pdf.setFont("Signika-Bold");
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(8);
      pdf.text("Terms & Conditions:", 12, 224);
      pdf.setFont("Signika-Regular");
      const notes = [
        "- If there is no insurance of the goods, after dispatch from the destination,",
        "   we are not responsible for non delivery, damage or any kind of loss.",
        "- Buyer must inspect and confirm quality & quantity of the goods before dispatch from godown.",
        "   Once loaded and truck leaves godown, Said all responsibilities will be transfer to buyers account.",
        "- Please send the full amount in our account through RTGS before despatch the goods.",
        "   If the amount is not received in our account, Interest of 24% P.A. will be charged to the buyer.",
        `- Subject to ${allData.City_E} jurisdiction.`
      ];
      notes.forEach((n, i) => pdf.text(n, 12, 224 + (i + 1) * 3));

      y += 25;

      // if (allData.Narration && allData.Narration.trim() !== "") {
      //   const narrationLabel = "Narration:";
      //   const narrationText = allData.Narration.trim();
      //   const wrapWidth = 110;
      //   const lineHeight = 3;

      //   pdf.setFont("Signika-Medium");
      //   pdf.setTextColor(0, 0, 0);
      //   pdf.text(narrationLabel, 12, y + 15);

      //   pdf.setFont("Signika-Regular");
      //   const wrappedNarration = pdf.splitTextToSize(narrationText, wrapWidth);
      //   wrappedNarration.forEach((line) => {
      //     pdf.text(line, 25, y + 15);
      //     y += lineHeight;
      //   });
      // }

      const signY = y - 10;
      pdf.setFont("Signika-Bold");
      pdf.setFontSize(9);
      pdf.setTextColor(0, 0, 0);
      const forText = `For. ${String(displayCompanyName ?? "")}`;
      const textWidth = pdf.getTextWidth(forText);
      const rightMargin = 197;
      const forTextX = rightMargin - textWidth;

      pdf.text(forText, forTextX, 224);
      const signWidth = 240;
      const signHeight = signWidth / 5;

      y -= 20;

      pdf.addImage(signImg, "PNG", 157, 225, signWidth, signHeight);
      pdf.text("Authorised Signatory", 168, 243);

      const footerY = 252;
      const footerHeight = 37;
      const poweredByY = footerY + footerHeight + 3;

      if (shouldUseImage) {
        pdf.addImage(footerImg, "PNG", 0, footerY, 260, footerHeight);
      } else {
        pdf.addImage(footerImg1, "PNG", 0, footerY, 210, footerHeight);
      }

      pdf.setFont("Signika-Medium");
      pdf.setFontSize(7);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Powered by: Sugarian.app", 12, poweredByY);


      const pdfBlob = pdf.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setPdfPreview(pdfUrl);
    }
  };

  return (
    <div id="pdf-content" >
      {pdfPreview && <PdfPreview pdfData={pdfPreview} apiData={invoiceData[0]} label={"DebitCredit"} />}
      <PrintButton disabledFeild={disabledFeild} fetchData={fetchData} />
    </div>
  );
};
export default DebitCreditNoteReport;






// import React, { useState } from "react";
// import "../../Outward/SaleBill/invoice.css";
// import logo from "../../../Assets/jklogo.png";
// import logo1 from "../../../Assets/jk.png"
// import Sign from "../../../Assets/DirectorSign.png";
// import Sign1 from "../../../Assets/DirectorSign1.png";
// import jsPDF from "jspdf";
// import "jspdf-autotable";
// import QRCode from "qrcode";
// import PdfPreview from "../../../Common/PDFPreview";
// import { ConvertNumberToWord } from "../../../Common/FormatFunctions/ConvertNumberToWord";
// import PrintButton from "../../../Common/Buttons/PrintPDF";
// import HeaderJK from "../../../Assets/HeaderJK.png";
// import FooterJK from "../../../Assets/FooterJK.png";
// import "../../../Common/Fonts/Signika-Bold-normal";
// import "../../../Common/Fonts/Signika-Regular-normal";
// import "../../../Common/Fonts/Signika-Medium-normal";
// import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";

// const API_URL = process.env.REACT_APP_API;

// const DebitCreditNoteReport = ({ doc_no, tran_type, disabledFeild }) => {
//   const companyCode = sessionStorage.getItem("Company_Code");
//   const Year_Code = sessionStorage.getItem("Year_Code");
//   const [invoiceData, setInvoiceData] = useState([]);
//   const [pdfPreview, setPdfPreview] = useState(null);

//   const TCSApplicable = sessionStorage.getItem("TCSApplicable");
//   const AccountYear = sessionStorage.getItem("Accounting_Year");
//   const CompanyNameUpdatedDate = sessionStorage.getItem("CompanyNameUpdatedDate")
//   const newCompanyName = sessionStorage.getItem("newCompanyName")
//   const oldFormerlyName = sessionStorage.getItem("oldFormerlyName")
//   let formattedYear = "";

//   if (AccountYear) {
//     const years = AccountYear.split(" - ");
//     if (years.length === 2) {
//       const startYear = years[0].slice(0, 4);
//       const endYear = years[1].slice(2, 4);
//       formattedYear = `${startYear}-${endYear}`;
//     }
//   }

//   const formatDate = (dateString) => {
//     const date = new Date(dateString);
//     const day = String(date.getDate()).padStart(2, '0');
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const year = String(date.getFullYear());
//     return `${day}/${month}/${year}`;
//   };

//   const fetchData = async () => {
//     try {
//       const response = await fetch(
//         `${API_URL}/generating_DebitCredit_report?Company_Code=${companyCode}&Year_Code=${Year_Code}&doc_no=${doc_no}&tran_type=${tran_type}`
//       );
//       if (!response.ok) {
//         throw new Error("Network response was not ok");
//       }
//       const data = await response.json();

//       setInvoiceData(data.all_data);
//       generatePdf(data.all_data);
//     } catch (error) {
//       console.error("Error fetching data:", error);
//     }
//   };

//   const generatePdf = async (data) => {
//     const pdf = new jsPDF({ orientation: "portrait" });
//     const allData = data?.[0] || {};
//     const docDate = new Date(allData.doc_date);
//     const cnameUpdatedDate = new Date(CompanyNameUpdatedDate);

//     const displayCompanyName =
//       docDate < cnameUpdatedDate
//         ? newCompanyName
//         : allData.Company_Name_E;


//     const logoToUse = docDate < cnameUpdatedDate ? logo : logo1;
//     const SignToUse = docDate < cnameUpdatedDate ? Sign1 : Sign;
//     const foormerlyName = docDate < cnameUpdatedDate ? oldFormerlyName : allData.AL1

//     const logoImg = new Image();
//     const signImg = new Image();
//     const headerImg = new Image();
//     const footerImg = new Image();
//     logoImg.src = logo;
//     signImg.src = SignToUse;
//     headerImg.src = HeaderJK;
//     footerImg.src = FooterJK;

//     let qrCodeData = "";
//     qrCodeData = ` GSTN of Supplier: ${allData.GST || ""}\n
//     GSTIN of Buyer: ${allData.ShipToGSTNo || ""}\n
//     Document No: ${allData.doc_no || ""}\n
//     Document Type:  ${allData.tran_type || ""}\n\n
//     Date Of Creation Of Invoice: ${allData.doc_date || ""}\n
//     HSN Code: ${allData.HSN || ""}\n
//     IRN: ${allData.Ewaybillno || ""}\n
//     Receipt Number:`;

//     const qrCodeDataUrl = await QRCode.toDataURL(qrCodeData.trim(), {
//       width: 300,
//       height: 300,
//     });

//     logoImg.src = logoToUse;
//     logoImg.onload = () => {
//       pdf.addImage(logoImg, "PNG", 10, 9, 30, 30);
//       pdf.setFont("Signika-Bold");
//       pdf.setFontSize(14);
//       pdf.text(displayCompanyName, 45, 14);
//       pdf.setFont("Signika-Regular");
//       pdf.setFontSize(9);
//       pdf.setFont("Signika-Regular");
//       pdf.setFontSize(9);
//       pdf.text(`${foormerlyName}`, 45, 18);
//       pdf.text(`${allData.AL2}`, 45, 22);
//       pdf.text(`${allData.AL3}`, 45, 26);
//       pdf.text(`${allData.AL4}`, 45, 30);
//       pdf.text(`${allData.Other}`, 45, 34);
//       pdf.text(`${allData.BillFooter}`, 45, 38)
//       pdf.addImage(qrCodeDataUrl, "PNG", 170, 9, 30, 30);

//       let invoiceText = "";
//       if (tran_type === "DN") invoiceText = "DEBIT NOTE";
//       else if (tran_type === "DS") invoiceText = "DEBIT NOTE";
//       else if (tran_type === "CN") invoiceText = "CREDIT NOTE";
//       else invoiceText = "CREDIT NOTE";

//       // Set font to bold
//       pdf.setFontSize(10);
//       pdf.setFont("Signika-Bold");
//       pdf.setDrawColor(80, 80, 80);
//       pdf.line(10, 44, 200, 44);
//       pdf.setTextColor(41, 122, 14);
//       pdf.text(invoiceText, 95, 49);
//       pdf.setLineWidth(0.3);
//       pdf.setDrawColor(80, 80, 80);
//       pdf.line(10, 52, 200, 52);
//       pdf.setTextColor(0, 0, 0);

//       let y = 45;
//       pdf.setFontSize(9);

//       const addressBlock = (
//         x,
//         yStart,
//         title,
//         lines,
//         styleCondition = () => ({ color: "black", font: "Signika-Regular" })
//       ) => {
//         let y = yStart;
//         const lineHeight = 4;

//         if (title) {
//           pdf.setFont("Signika-Medium");
//           pdf.setTextColor(0, 0, 0);
//           pdf.text(title, x, y + 10);
//           y += lineHeight;
//         }

//         lines.forEach((line, index) => {
//           const wrapped = pdf.splitTextToSize(String(line ?? ""), 85);
//           const style = styleCondition(index, line);

//           pdf.setFont(style.font || "Signika-Regular");

//           if (style.color === "green") {
//             pdf.setTextColor(41, 122, 14);
//           } else {
//             pdf.setTextColor(0, 0, 0);
//           }

//           wrapped.forEach((wLine) => {
//             pdf.text(wLine, x, y + 10);
//             y += lineHeight;
//           });
//         });

//         return y;
//       };

//       const toManagingDirectorData = [
//         allData.ShopTo_Name,
//         allData.ShipToAddress,
//         `City: ${allData.ShipToCity} (${allData.shiptostatename} - ${allData.ShipToStateCode})`,
//         `GST: ${allData.ShipToGSTNo}`,
//         `PAN: ${allData.CompanyPan}`,
//         ...(allData.billtoFSSAI ? [`FSSAI: ${allData.billtoFSSAI}`] : []),
//         ...(allData.billtoTAN ? [`TAN: ${allData.billtoTAN}`] : []),
//       ];

//       const transportDetail = [
//         `Note No: ${tran_type}${formattedYear}-${allData.doc_no || ""}  Date:${formatDate(allData.doc_date)}`,
//         `Bill No: ${allData.bill_no || ""}`,
//         `E-Invoice No.: ${allData.Ewaybillno || ""}`,
//         `Acknowledge: ${allData.ackno || ""}`,
//       ];

//       const addressStartY = y + 7;
//       // setTextColor(0, 0, 0)
//       const endYBill = addressBlock(
//         12,
//         addressStartY,
//         "Buyer (Bill to), ",
//         toManagingDirectorData,
//         (index) =>
//           index === 0
//             ? { color: "green", font: "Signika-Bold" }
//             : { color: "black", font: "Signika-Regular" }
//       );

//       const endYShip = addressBlock(
//         110,
//         addressStartY,
//         "",
//         transportDetail,
//         () => ({ color: "black", font: "Signika-Regular" })
//       );

//       pdf.setDrawColor(80, 80, 80);
//       pdf.line(105, addressStartY + 8, 105, Math.max(endYBill, endYShip) + 10);
//       pdf.setDrawColor(80, 80, 80);
//       pdf.line(
//         10,
//         Math.max(endYBill, endYShip) + 13,
//         200,
//         Math.max(endYBill, endYShip) + 13
//       );
//       y = Math.max(endYBill, endYShip) + 11;

//       pdf.setLineWidth(0.3);
//       pdf.setDrawColor(80, 80, 80);

//       pdf.setFont("Signika-Medium");
//       pdf.setTextColor(41, 122, 14);
//       pdf.text("Particulars", 12, y + 7);
//       pdf.text("Short Name", 60, y + 7, { align: "left" });
//       pdf.text("HSN", 130, y + 7);
//       pdf.text("Value", 182, y + 7);
//       y += 5;

//       pdf.setLineWidth(0.3);
//       pdf.setDrawColor(80, 80, 80);
//       pdf.line(10, y + 5, 200, y + 5);

//       pdf.setFont("Signika-Medium");
//       pdf.setTextColor(0, 0, 0);
//       pdf.text(String(allData.Item_Name ?? "Sugar"), 12, y + 9);
//       pdf.setFont("Signika-Regular");
//       pdf.text(String(allData.millshortname ?? ""), 60, y + 9);
//       pdf.text(String(allData.HSN ?? ""), 130, y + 9);
//       const value = parseFloat(allData.value || 0);

//       const formattedValue = Number(value).toLocaleString("en-IN", {
//         minimumFractionDigits: 2,
//       });
//       const amountX = 197;
//       const rateX = 170;
//       const labelX = 140;

//       pdf.text(formattedValue, amountX, y + 9, { align: "right" });

//       y += 8;
//       pdf.setFont("Signika-Regular");

//       const wrappedMillName = pdf.splitTextToSize(String(allData.Mill_Name ?? "-"), 90);
//       pdf.text("Mill Name:", 12, y + 11);
//       pdf.text(wrappedMillName, 28, y + 11);

//       const millNameHeight = (wrappedMillName.length - 1) * 5;
//       let currentY = y + 16 + millNameHeight;

//       let fssai = String(allData.MillFSSAI_No ?? "").trim();
//       if (fssai !== "") {
//         if (fssai.length > 25 && !fssai.includes(" ")) {
//           fssai = fssai.match(/.{1,20}/g).join(" ");
//         }

//         const wrappedFSSAI = pdf.splitTextToSize(fssai, 100);
//         pdf.text("Mill FSSAI:", 12, currentY);
//         pdf.text(wrappedFSSAI, 28, currentY);
//       }

//       y += 8;

//       const igstRate = parseFloat(allData.igst_rate) || 0;
//       const igstAmt = parseFloat(allData.igst_amount) || 0;

//       const cgstRate = parseFloat(allData.cgst_rate) || 0;
//       const cgstAmt = parseFloat(allData.cgst_amount) || 0;

//       const sgstRate = parseFloat(allData.sgst_rate) || 0;
//       const sgstAmt = parseFloat(allData.sgst_amount) || 0;

//       const taxRows = [];

//       if (igstRate > 0) {
//         taxRows.push(["IGST", igstRate, igstAmt]);
//       } else {
//         taxRows.push(
//           ["CGST", cgstRate, cgstAmt],
//           ["SGST", sgstRate, sgstAmt]
//         );
//       }
//       const showMisc = parseFloat(allData.misc_amount) !== 0;
//       const summaryFields = [
//         ...(allData.carporateSaleDoc === 0 ||
//           allData.carporateSaleDoc === "" ||
//           allData.carporateSaleDoc === null
//           ? [["Freight", allData.LESS_FRT_RATE, allData.freight]]
//           : []),

//         ["Taxable Amount", "", allData.texable_amount],
//         ...taxRows,
//         ...(showMisc ? [["MISC", "", allData.misc_amount]] : []),

//         ...(TCSApplicable === "N"
//           ? []
//           : [
//             ["TCS:", allData.TCS_Rate, allData.TCS_Amt],
//             ["TCS Net Payable:", "", allData.TCS_Net_Payable],
//           ]),
//       ];

//       summaryFields.forEach(([label, rate, amount]) => {
//         pdf.setFont("Signika-Regular");
//         pdf.text(`${label}:`, 130, y + 3);
//         if (rate !== null && rate !== undefined && rate !== "") {
//           pdf.text(`${formatReadableAmount(rate)}%`, 165, y + 3, { align: "center" });
//         }

//         const formattedAmount = formatReadableAmount(amount);
//         pdf.text(formattedAmount, 197, y + 3, { align: "right" });

//         y += 5;
//       });


//       pdf.setLineWidth(0.3);
//       pdf.setDrawColor(80, 80, 80);
//       pdf.line(10, y + 4, 200, y + 4);

//       const totalInWords = ConvertNumberToWord(
//         parseFloat(allData.TCS_Net_Payable)
//       );
//       pdf.text(`Rs: ${totalInWords}.`, 12, y + 9);
//       const formattedTotal = Number(allData.TCS_Net_Payable || 0).toLocaleString(
//         "en-IN",
//         {
//           minimumFractionDigits: 2,
//           maximumFractionDigits: 2,
//         }
//       );

//       pdf.setFont("Signika-Bold");
//       pdf.setTextColor(41, 122, 14);
//       pdf.text("Total Amount:", 150, y + 9);
//       pdf.text(`₹ ${formattedTotal}`, amountX, y + 9, { align: "right" });

//       y += 5;
//       pdf.setLineWidth(0.3);
//       pdf.line(10, y + 7, 200, y + 7);

//       pdf.setFont("Signika-Bold");
//       pdf.setTextColor(0, 0, 0);
//       pdf.setFontSize(8);
//       pdf.text("Terms & Conditions:", 12, y + 12);
//       pdf.setFont("Signika-Regular");
//       const notes = [
//         "- If there is no insurance of the goods, after dispatch from the destination,",
//         "   we are not responsible for non delivery, damage or any kind of loss.",
//         "- Buyer must inspect and confirm quality & quantity of the goods before dispatch from godown.",
//         "   Once loaded and truck leaves godown, Said all responsibilities will be transfer to buyers account.",
//         "- Please send the full amount in our account through RTGS before despatch the goods.",
//         "   If the amount is not received in our account, Interest of 24% P.A. will be charged to the buyer.",
//         "- Subject to Kolhapur jurisdiction."
//       ];
//       notes.forEach((n, i) => pdf.text(n, 12, y + 13 + (i + 1) * 3));

//       y += 25;

//       if (allData.Narration && allData.Narration.trim() !== "") {
//         const narrationLabel = "Narration:";
//         const narrationText = allData.Narration.trim();
//         const wrapWidth = 110;
//         const lineHeight = 3;

//         pdf.setFont("Signika-Medium");
//         pdf.setTextColor(0, 0, 0);
//         pdf.text(narrationLabel, 12, y + 15);

//         pdf.setFont("Signika-Regular");
//         const wrappedNarration = pdf.splitTextToSize(narrationText, wrapWidth);
//         wrappedNarration.forEach((line) => {
//           pdf.text(line, 25, y + 15);
//           y += lineHeight;
//         });
//       }

//       const signY = y - 10;
//       pdf.setFont("Signika-Bold");
//       pdf.setFontSize(9);
//       pdf.setTextColor(0, 0, 0);
//       const forText = `For. ${String(displayCompanyName ?? "")}`;
//       const textWidth = pdf.getTextWidth(forText);
//       const rightMargin = 197;
//       const forTextX = rightMargin - textWidth;

//       pdf.text(forText, forTextX, signY);
//       const signWidth = 240;
//       const signHeight = signWidth / 5;

//       y -= 20;

//       pdf.addImage(signImg, "PNG", 157, y + 11, signWidth, signHeight);
//       pdf.text("Authorised Signatory", 168, y + 28);

//       const footerY = 252;
//       const footerHeight = 37;
//       const poweredByY = footerY + footerHeight + 3;

//       pdf.addImage(footerImg, "PNG", 10, footerY, 190, footerHeight);

//       pdf.setFont("Signika-Medium");
//       pdf.setFontSize(7);
//       pdf.setTextColor(0, 0, 0);
//       pdf.text("Powered by: Sugarian.app", 12, poweredByY);

//       const pdfBlob = pdf.output("blob");
//       const pdfUrl = URL.createObjectURL(pdfBlob);
//       setPdfPreview(pdfUrl);
//     }
//   };

//   return (
//     <div id="pdf-content" >
//       {pdfPreview && <PdfPreview pdfData={pdfPreview} apiData={invoiceData[0]} label={"DebitCredit"} />}
//       <PrintButton disabledFeild={disabledFeild} fetchData={fetchData} />
//     </div>
//   );
// };
// export default DebitCreditNoteReport;