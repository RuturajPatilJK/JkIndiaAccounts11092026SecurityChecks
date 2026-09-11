// import React, { useState } from "react";
// import axios from "axios";
// import jsPDF from "jspdf";
// import "jspdf-autotable";
// import QRCode from "qrcode";
// import logo from "../../../Assets/jklogo.png";
// import logo1 from "../../../Assets/jk.png"
// import Sign from "../../../Assets/DirectorSign.png";
// import Sign1 from "../../../Assets/DirectorSign1.png";
// import HeaderJK from "../../../Assets/HeaderJK.png";
// import ServiceBillNewHeader from "../../../Assets/ServiceBillNewHeader.png";
// import FooterJK from "../../../Assets/FooterJK.png";
// import RBFooter1 from "../../../Assets/RBFooter.png";
// import FooterJK1 from "../../../Assets/FooterJK1.png";
// import PdfPreview from "../../../Common/PDFPreview";
// import PrintButton from "../../../Common/Buttons/PrintPDF";
// import { ConvertNumberToWord } from "../../../Common/FormatFunctions/ConvertNumberToWord";
// import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
// import "../../../Common/Fonts/Signika-Regular-normal";
// import "../../../Common/Fonts/Signika-Bold-normal";
// import "../../../Common/Fonts/Signika-Medium-normal";

// const ProformaServiceBillReportSEIC = ({ companyCode, yearCode, docNo, disabledFeild }) => {
//   const [pdfData, setPdfData] = useState(null);
//   const [apiData, setApiData] = useState(null);

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


//   const fetchBillData = async () => {
//     try {
//       const response = await axios.get(`${process.env.REACT_APP_API}/generating_proformaServiceBill_report`, {
//         params: { Company_Code: companyCode, Year_Code: yearCode, doc_no: docNo },
//       });

//       const billData = response.data?.all_data?.[0];
//       if (billData) {
//         generatePdf(billData);
//         setApiData(billData);
//       }
//     } catch (error) {
//       console.error("Fetch Error:", error);
//     }
//   };

//   const generatePdf = async (data) => {
//     const pdf = new jsPDF({ orientation: "portrait" });
//     pdf.setFont("Signika-Regular");
//     pdf.setFontSize(8);

//     let displayCompanyName = data.Company_Name_E;
//     let formerlyKnownAs = data.AL1;
//     let logoToUse = logo1;
//     let SignToUse = Sign;
//     let shouldUseImage = 'N'

//     if (data.Date && CompanyNameUpdatedDate) {
//       const [day, month, year] = data.Date.split('/');
//       const docDate = new Date(`${year}-${month}-${day}`);
//       const cnameUpdatedDate = new Date(CompanyNameUpdatedDate);

//       if (!isNaN(docDate) && !isNaN(cnameUpdatedDate)) {
//         if (docDate < cnameUpdatedDate) {
//           displayCompanyName = newCompanyName;
//           formerlyKnownAs = oldFormerlyName;
//           logoToUse = logo;
//           SignToUse = Sign1;
//           shouldUseImage =
//             docDate >= cnameUpdatedDate
//         }
//       }
//     }

//     const qrData = `
// GSTN of Supplier: ${data.GST || ""}
// GSTIN of Buyer: ${data.Gst_No || ""}
// Document No.: RB${formattedYear}-${data.Doc_No}
// Document Type: PROFORMA INVOICE
// Date: ${data.Date || ""}
//     `.trim();
//     const qrCodeDataUrl = await QRCode.toDataURL(qrData);

//     const logoImg = new Image();
//     logoImg.src = logoToUse;
//     const signImg = new Image();
//     signImg.src = SignToUse;
//     const footerImg = new Image();
//     footerImg.src = RBFooter1;
//     const headerImg = new Image();
//     const footerImg1 = new Image();
//     headerImg.src = ServiceBillNewHeader;
//     footerImg1.src = RBFooter1
//     logoImg.onload = () => {
//       if (shouldUseImage) {

//         pdf.addImage(headerImg, "PNG", 10, 6, 180, 34);
//       } else {
//         pdf.addImage(logoImg, "PNG", 10, 9, 30, 30);
//         pdf.setFont("Signika-Bold");
//         pdf.setFontSize(14);
//         pdf.text(displayCompanyName, 45, 14);

//         pdf.setFont("Signika-Regular");
//         pdf.setFontSize(9);
//         pdf.text(`${formerlyKnownAs}`, 45, 18);
//         pdf.text(data.AL2, 45, 22);
//         pdf.text(data.AL3, 45, 26);
//         pdf.text(data.AL4, 45, 30);
//         pdf.text(data.Other, 45, 34);
//         pdf.text(`GST:  27AAECJ8332R1ZV | PAN: AAECJ8332R | FSSAI: 11522042000027`, 45, 38);
//       }

//       pdf.setDrawColor(80, 80, 80);
//       pdf.line(10, 44, 200, 44);
//       pdf.setFontSize(10);
//       pdf.setFont("Signika-Bold");
//       pdf.setTextColor(41, 122, 14);
//       pdf.text("PROFORMA INVOICE", 89, 49);
//       pdf.setTextColor(0, 0, 0);
//       pdf.line(10, 52, 200, 52);
//       pdf.setFontSize(9);

//       let y = 55;
//       const addressBlock = (x, yStart, title, lines) => {
//         let y = yStart;
//         const lineHeight = 4;


//         pdf.setFont("Signika-Medium");
//         pdf.setTextColor(0, 0, 0);
//         pdf.text(title, x, y);
//         y += lineHeight;

//         // Body lines
//         lines.forEach((line, index) => {
//           const wrapped = pdf.splitTextToSize(String(line ?? ""), 85);
//           const isFirst = index === 0;

//           pdf.setFont(isFirst ? "Signika-Bold" : "Signika-Regular");
//           pdf.setTextColor(isFirst ? 41 : 0, isFirst ? 122 : 0, isFirst ? 14 : 0);

//           wrapped.forEach((wLine) => {
//             pdf.text(wLine, x, y);
//             y += lineHeight;
//           });
//         });

//         return y + 2; 
//       };

//       const buyerLines = [
//         data.Ac_Name_E,
//         data.Address_E,
//         `City: ${data.cityname} (${data.billtostatename} - ${data.GSTStateCode})`,
//         `GSTIN: ${data.Gst_No}`,
//         data.Pan_No ? `PAN: ${data.Pan_No}` : "",
//         data.FSSAI_No ? `FSSAI: ${data.FSSAI_No}` : "",
//         data.TAN_No && data.TAN_No.toLowerCase() !== "undefined" ? `TAN: ${data.TAN_No}` : "",
//         data.Mobile_No ? `Contact: ${data.Mobile_No}` : "",
//         data.Email_Id ? `Email: ${data.Email_Id}` : "",
//       ].filter(Boolean);


//       const invoiceLines = [
//         [`Proforma Invoice No:`, `RB${formattedYear}-${data.Doc_No}`],
//         [`Invoice Date:`, data.DateConverted],
//         // [`IRN:`, data.einvoiceno],
//         // [`Ack No:`, data.ackno],
//         // [`HSN Code:`, data.HSN],
//         [`Place of Supply:`, data.cityname],
//         [`Reverse Charge:`, "No"],
//       ];

//       const startY = y + 5;
//       const leftY = addressBlock(12, startY, "Buyer (Bill to):", buyerLines);

//       let rightY = startY;
//       const lineHeight = 4;

//       invoiceLines.forEach(([label, value]) => {
//         const labelWidth = pdf.getTextWidth(label);
//         const wrapped = pdf.splitTextToSize(value || "-", 85 - labelWidth - 2);

//         wrapped.forEach((line, idx) => {
//           if (idx === 0) {
//             pdf.setFont("Signika-Medium");
//             pdf.text(label, 110, rightY);
//             pdf.setFont("Signika-Regular");
//             pdf.text(line, 110 + labelWidth + 2, rightY);
//           } else {
//             pdf.text(line, 110, rightY);
//           }
//           rightY += lineHeight;
//         });
//       });


//       y = Math.max(leftY, rightY);
//       const verticalLineTop = startY - 2;  
//       const verticalLineBottom = y - 4; 
//       pdf.setDrawColor(80, 80, 80);
//       pdf.setLineWidth(0.3);
//       pdf.line(105, verticalLineTop, 105, verticalLineBottom);

//       pdf.line(10, y, 200, y);
//       y += 5;

//       pdf.setFont("Signika-Medium");
//       pdf.setTextColor(41, 122, 14);
//       pdf.text("Particulars", 12, y);
//       pdf.text("Item Name", 80, y);
//       pdf.text("HSN", 130, y);
//       // pdf.text("Qty", 140, y, { align: "right" });
//       pdf.text("GST Rate", 160, y, { align: "right" });
//       pdf.text("Value", 195, y, { align: "right" });

//       y += 3;
//       pdf.setDrawColor(80, 80, 80);
//       pdf.setLineWidth(0.3);
//       pdf.line(10, y, 200, y);
//       y += 6;

//       // 🟩 Item Row
//       pdf.setFont("Signika-Regular");
//       pdf.setTextColor(0, 0, 0);

//       const itemDescLines = pdf.splitTextToSize(data.itemdesc || "-", 50);
//       const itemNameLines = pdf.splitTextToSize(data.itemname || "-", 35);
//       const maxLines = Math.max(itemDescLines.length, itemNameLines.length);
//       const itemLineHeight = 4;

//       for (let i = 0; i < maxLines; i++) {
//         const lineY = y + i * itemLineHeight;
//         if (i < itemDescLines.length) pdf.text(itemDescLines[i], 12, lineY);
//         if (i < itemNameLines.length) pdf.text(itemNameLines[i], 80, lineY);
//         if (i === 0) {
//           pdf.text(data.HSN || "-", 130, lineY);
//           // pdf.text(formatReadableAmount(data.Rate || "0.00"), 140, lineY, { align: "right" });
//           const gstRate = Number(data.IGSTRate) > 0
//             ? Number(data.IGSTRate)
//             : Number(data.CGSTRate || 0) + Number(data.SGSTRate || 0);

//           pdf.text(`${gstRate.toFixed(2)}%`, 160, lineY, { align: "right" });

//           pdf.text(formatReadableAmount(data.Amount || "0.00"), 195, lineY, { align: "right" });
//         }
//       }

//       y += maxLines * itemLineHeight + 68;

//       // 🟩 Tax Summary
//       let taxLines = [
//         ["IGST", data.IGSTRate, data.IGSTAmount],
//         ["CGST", data.CGSTRate, data.CGSTAmount],
//         ["SGST", data.SGSTRate, data.SGSTAmount],
//         ["TCS", data.TCSRate, "0.00"],
//       ];

//       const igstRate = parseFloat(data.IGSTRate) || 0;

//       if (igstRate > 0) {
//         taxLines = taxLines.filter(
//           ([label, rate]) => label === "IGST" || (label === "TCS" && parseFloat(rate) > 0)
//         );
//       } else {
//         taxLines = taxLines.filter(
//           ([label, rate]) => label !== "IGST" && parseFloat(rate) > 0
//         );
//       }

//       pdf.setFont("Signika-Regular");
//       pdf.setTextColor(0, 0, 0);

//       taxLines.forEach(([label, rate, amount]) => {
//         pdf.setFont("Signika-Regular");
//         pdf.text(`${label}`, 130, y);
//         pdf.text(`${Number(rate || 0).toFixed(2)}%`, 160, y, { align: "right" });
//         pdf.text(formatReadableAmount(amount || 0), 195, y, { align: "right" });
//         y += 5;
//       });



//       const totalPayable = Number(data.TCS_Net_Payable || 0);

//       // Line before Net Payable
//       pdf.setDrawColor(80, 80, 80);
//       pdf.setLineWidth(0.3);
//       pdf.line(10, y - 3, 200, y - 3);

//       // Net Payable Text
//       pdf.setFont("Signika-Regular");
//       pdf.setTextColor(0, 0, 0);
//       const words = ConvertNumberToWord(totalPayable);
//       const lines = pdf.splitTextToSize(`Rs: ${words}`, 180);
//       lines.forEach((line, i) => pdf.text(line, 12, y + i + 2));
//       // y += lines.length * 4;
//       pdf.setFont("Signika-Bold");
//       pdf.setTextColor(41, 122, 14);
//       pdf.text("Net Payable:", 130, y + 2);
//       pdf.text(`₹ ${formatReadableAmount(totalPayable.toFixed(2))}`, 195, y + 2, { align: "right" });

//       // Line after Net Payable
//       y += 5;
//       pdf.line(10, y, 200, y);

//       y += 4;


//       // In Words
//       pdf.setTextColor(0, 0, 0);
//       pdf.setFont("Signika-Regular");


//       pdf.setDrawColor(80, 80, 80);
//       pdf.setLineWidth(0.3);
//       y += 2


//       const terms = [
//         "A/c Name: JK India eAgritech Limited Division ChiniMandi",
//         "A/c No: 9240200 6938 7859",
//         "Bank Name: Axis Bank",
//         "Branch: New Mahadwar Road, Kolhapur",
//         "IFSC Code: UTIB0001196",
//       ];
//       pdf.setFont("Signika-Bold");
//       pdf.text("Bank Details:", 12, 226);
//       pdf.setFont("Signika-Regular");
//       pdf.setFontSize(8);
//       terms.forEach((t, i) => {
//         const tLines = pdf.splitTextToSize(t, 180);
//         tLines.forEach((l, j) => {
//           pdf.text(l, 12, 226 + 5 + (i * 4) + j * 4);
//         });
//       });

//       y += 50;

//       pdf.setFont("Signika-Bold");
//       pdf.setFontSize(9);
//       const signY = y + 2;
//       console.log('SignY', signY)
//       const forText = `For. ${String(displayCompanyName ?? "")}`;
//       const textWidth = pdf.getTextWidth(forText);
//       const rightMargin = 197;
//       const forTextX = rightMargin - textWidth;

//       pdf.text(forText, forTextX, 225);
//       const signWidth = 240;
//       const signHeight = signWidth / 5;

//       y -= 20;

//       pdf.addImage(signImg, "PNG", 158, 226, signWidth, signHeight);
//       console.log('SignYForImage', y)

//       pdf.text("Authorised Signatory", 168, 245);
//       console.log('SignYForImage Authorised Signatory', y)

//       const footerY = 252;
//       const footerHeight = 60;
//       const poweredByY = footerY + footerHeight - 21;
//       if (shouldUseImage) {
//         pdf.addImage(footerImg, "PNG", 10, footerY + 5, 370, footerHeight);
//       } else {
//         pdf.addImage(footerImg1, "PNG", 0, footerY + 5, 210, footerHeight);
//       }

//       pdf.setFont("Signika-Medium");
//       pdf.setFontSize(7);
//       pdf.setTextColor(0, 0, 0);
//       pdf.text("Powered by: Sugarian.app", 12, poweredByY);

//       const blob = pdf.output("blob");
//       setPdfData(URL.createObjectURL(blob));
//     };
//   };

//   return (
//     <div id="pdf-content">
//       <PrintButton disabledFeild={disabledFeild} fetchData={fetchBillData} />
//       {pdfData && (
//         <PdfPreview
//           pdfData={pdfData}
//           apiData={apiData}
//           label={"ServiceBill"}
//         />
//       )}
//     </div>
//   );
// };

// export default ProformaServiceBillReportSEIC;














import React, { useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import QRCode from "qrcode";
import logo from "../../../Assets/jklogo.png";
import logo1 from "../../../Assets/jk.png"
import Sign from "../../../Assets/DirectorSign.png";
import Sign1 from "../../../Assets/DirectorSign1.png";
import HeaderJK from "../../../Assets/HeaderJK.png";
import ServiceBillNewHeader from "../../../Assets/ServiceBillNewHeader.png";
import FooterJK from "../../../Assets/FooterJK.png";
import RBFooter1 from "../../../Assets/RBFooter.png";
import FooterJK1 from "../../../Assets/FooterJK1.png";
import PdfPreview from "../../../Common/PDFPreview";
import PrintButton from "../../../Common/Buttons/PrintPDF";
import { ConvertNumberToWord } from "../../../Common/FormatFunctions/ConvertNumberToWord";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import "../../../Common/Fonts/Signika-Regular-normal";
import "../../../Common/Fonts/Signika-Bold-normal";
import "../../../Common/Fonts/Signika-Medium-normal";

const ProformaServiceBillReportSEIC = ({ companyCode, yearCode, docNo, disabledFeild }) => {
  const [pdfData, setPdfData] = useState(null);
  const [apiData, setApiData] = useState(null);

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


  const fetchBillData = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/generating_proformaServiceBill_report`, {
        params: { Company_Code: companyCode, Year_Code: yearCode, doc_no: docNo },
      });

      const billData = response.data?.all_data;
      if (billData && billData.length > 0) {
        generatePdf(billData);
        setApiData(billData);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    }
  };

  const generatePdf = async (allItems) => {
    const pdf = new jsPDF({ orientation: "portrait" });
    pdf.setFont("Signika-Regular");
    pdf.setFontSize(8);

    // Use first item for header/footer data
    const data = allItems[0];

    let displayCompanyName = data.Company_Name_E;
    let formerlyKnownAs = data.AL1;
    let logoToUse = logo1;
    let SignToUse = Sign;
    let shouldUseImage = 'N'

    if (data.Date && CompanyNameUpdatedDate) {
      const [day, month, year] = data.Date.split('/');
      const docDate = new Date(`${year}-${month}-${day}`);
      const cnameUpdatedDate = new Date(CompanyNameUpdatedDate);

      if (!isNaN(docDate) && !isNaN(cnameUpdatedDate)) {
        if (docDate < cnameUpdatedDate) {
          displayCompanyName = newCompanyName;
          formerlyKnownAs = oldFormerlyName;
          logoToUse = logo;
          SignToUse = Sign1;
          shouldUseImage =
            docDate >= cnameUpdatedDate
        }
      }
    }

    const qrData = `
GSTN of Supplier: ${data.GST || ""}
GSTIN of Buyer: ${data.Gst_No || ""}
Document No.: RB${formattedYear}-${data.Doc_No}
Document Type: PROFORMA INVOICE
Date: ${data.Date || ""}
    `.trim();
    const qrCodeDataUrl = await QRCode.toDataURL(qrData);

    const logoImg = new Image();
    logoImg.src = logoToUse;
    const signImg = new Image();
    signImg.src = SignToUse;
    const footerImg = new Image();
    footerImg.src = RBFooter1;
    const headerImg = new Image();
    const footerImg1 = new Image();
    headerImg.src = ServiceBillNewHeader;
    footerImg1.src = RBFooter1
    logoImg.onload = () => {
      if (shouldUseImage) {
        // Use header image across top (new template)
        pdf.addImage(headerImg, "PNG", 10, 6, 180, 34); // full width
      } else {
        pdf.addImage(logoImg, "PNG", 10, 9, 30, 30);
        pdf.setFont("Signika-Bold");
        pdf.setFontSize(14);
        pdf.text(displayCompanyName, 45, 14);

        pdf.setFont("Signika-Regular");
        pdf.setFontSize(9);
        pdf.text(`${formerlyKnownAs}`, 45, 18);
        pdf.text(data.AL2, 45, 22);
        pdf.text(data.AL3, 45, 26);
        pdf.text(data.AL4, 45, 30);
        pdf.text(data.Other, 45, 34);
        pdf.text(`GST:  27AAECJ8332R1ZV | PAN: AAECJ8332R | FSSAI: 11522042000027`, 45, 38);
      }
      //   pdf.addImage(qrCodeDataUrl, "PNG", 170, 9, 30, 30);

      pdf.setDrawColor(80, 80, 80);
      pdf.line(10, 44, 200, 44);
      pdf.setFontSize(10);
      pdf.setFont("Signika-Bold");
      pdf.setTextColor(41, 122, 14);
      pdf.text("PROFORMA INVOICE", 89, 49);
      pdf.setTextColor(0, 0, 0);
      pdf.line(10, 52, 200, 52);
      pdf.setFontSize(9);
      // Buyer + Invoice blocks
      let y = 55;
      const addressBlock = (x, yStart, title, lines) => {
        let y = yStart;
        const lineHeight = 4;

        // Title (always black)
        pdf.setFont("Signika-Medium");
        pdf.setTextColor(0, 0, 0);
        pdf.text(title, x, y);
        y += lineHeight;

        // Body lines
        lines.forEach((line, index) => {
          const wrapped = pdf.splitTextToSize(String(line ?? ""), 85);
          const isFirst = index === 0;

          pdf.setFont(isFirst ? "Signika-Bold" : "Signika-Regular");
          pdf.setTextColor(isFirst ? 41 : 0, isFirst ? 122 : 0, isFirst ? 14 : 0);

          wrapped.forEach((wLine) => {
            pdf.text(wLine, x, y);
            y += lineHeight;
          });
        });

        return y + 2; // small gap after block
      };

      const buyerLines = [
        data.Ac_Name_E,
        data.Address_E,
        `City: ${data.cityname} (${data.billtostatename} - ${data.GSTStateCode})`,
        `GSTIN: ${data.Gst_No}`,
        data.Pan_No ? `PAN: ${data.Pan_No}` : "",
        data.FSSAI_No ? `FSSAI: ${data.FSSAI_No}` : "",
        data.TAN_No && data.TAN_No.toLowerCase() !== "undefined" ? `TAN: ${data.TAN_No}` : "",
        data.Mobile_No ? `Contact: ${data.Mobile_No}` : "",
        data.Email_Id ? `Email: ${data.Email_Id}` : "",
      ].filter(Boolean);


      const invoiceLines = [
        [`Proforma Invoice No:`, `RB${formattedYear}-${data.Doc_No}`],
        [`Invoice Date:`, data.DateConverted],
        // [`IRN:`, data.einvoiceno],
        // [`Ack No:`, data.ackno],
        // [`HSN Code:`, data.HSN],
        [`Place of Supply:`, data.cityname],
        [`Reverse Charge:`, "No"],
      ];

      const startY = y + 5;
      const leftY = addressBlock(12, startY, "Buyer (Bill to):", buyerLines);

      let rightY = startY;
      const lineHeight = 4;

      invoiceLines.forEach(([label, value]) => {
        const labelWidth = pdf.getTextWidth(label);
        const wrapped = pdf.splitTextToSize(value || "-", 85 - labelWidth - 2);

        wrapped.forEach((line, idx) => {
          if (idx === 0) {
            pdf.setFont("Signika-Medium");
            pdf.text(label, 110, rightY);
            pdf.setFont("Signika-Regular");
            pdf.text(line, 110 + labelWidth + 2, rightY);
          } else {
            pdf.text(line, 110, rightY);
          }
          rightY += lineHeight;
        });
      });


      y = Math.max(leftY, rightY);
      const verticalLineTop = startY - 2;  // just below "Buyer (Bill to):"
      const verticalLineBottom = y - 4;   // just above the next horizontal line
      pdf.setDrawColor(80, 80, 80);
      pdf.setLineWidth(0.3);
      pdf.line(105, verticalLineTop, 105, verticalLineBottom);

      pdf.line(10, y, 200, y);
      y += 5;

      // 🟩 Table Headers
      pdf.setFont("Signika-Medium");
      pdf.setTextColor(41, 122, 14);
      pdf.text("Particulars", 12, y);
      pdf.text("Item Name", 80, y);
      pdf.text("HSN", 130, y);
      // pdf.text("Qty", 140, y, { align: "right" });
      pdf.text("GST Rate", 160, y, { align: "right" });
      pdf.text("Value", 195, y, { align: "right" });

      y += 3;
      pdf.setDrawColor(80, 80, 80);
      pdf.setLineWidth(0.3);
      pdf.line(10, y, 200, y);
      y += 6;

      // 🟩 Item Rows - LOOP THROUGH ALL ITEMS
      pdf.setFont("Signika-Regular");
      pdf.setTextColor(0, 0, 0);

      allItems.forEach((item, idx) => {
        const itemDescLines = pdf.splitTextToSize(item.itemdesc || "-", 50);
        const itemNameLines = pdf.splitTextToSize(item.itemname || "-", 35);
        const maxLines = Math.max(itemDescLines.length, itemNameLines.length);
        const itemLineHeight = 4;

        for (let i = 0; i < maxLines; i++) {
          const lineY = y + i * itemLineHeight;
          if (i < itemDescLines.length) pdf.text(itemDescLines[i], 12, lineY);
          if (i < itemNameLines.length) pdf.text(itemNameLines[i], 80, lineY);
          if (i === 0) {
            pdf.text(item.HSN || "-", 130, lineY);
            const gstRate = Number(item.IGSTRate) > 0
              ? Number(item.IGSTRate)
              : Number(item.CGSTRate || 0) + Number(item.SGSTRate || 0);

            pdf.text(`${gstRate.toFixed(2)}%`, 160, lineY, { align: "right" });
            pdf.text(formatReadableAmount(item.Amount || "0.00"), 195, lineY, { align: "right" });
          }
        }
        y += maxLines * itemLineHeight + 2;
      });

      y += 5;

      // 🟩 Tax Summary
      // let taxLines = [
      //   ["IGST", data.IGSTRate, data.IGSTAmount],
      //   ["CGST", data.CGSTRate, data.CGSTAmount],
      //   ["SGST", data.SGSTRate, data.SGSTAmount],
      //   ["TCS", data.TCSRate, "0.00"],
      // ];

      // const igstRate = parseFloat(data.IGSTRate) || 0;

      // if (igstRate > 0) {
      //   taxLines = taxLines.filter(
      //     ([label, rate]) => label === "IGST" || (label === "TCS" && parseFloat(rate) > 0)
      //   );
      // } else {
      //   taxLines = taxLines.filter(
      //     ([label, rate]) => label !== "IGST" && parseFloat(rate) > 0
      //   );
      // }

      // pdf.setFont("Signika-Regular");
      // pdf.setTextColor(0, 0, 0);

      // taxLines.forEach(([label, rate, amount]) => {
      //   pdf.setFont("Signika-Regular");
      //   pdf.text(`${label}`, 130, y);
      //   pdf.text(`${Number(rate || 0).toFixed(2)}%`, 160, y, { align: "right" });
      //   pdf.text(formatReadableAmount(amount || 0), 195, y, { align: "right" });
      //   y += 5;
      // });



      // 🟩 Tax Summary
      const igstRate = parseFloat(data.IGSTRate) || 0;
      const discountAmt = parseFloat(data.Discount_Amount) || 0;
      const discountRate = parseFloat(data.Discount_Rate) || 0;
      const taxableAmt = parseFloat(data.Taxable_Amount) || 0;
      const hasDiscount = discountAmt > 0;

      // ── Subtotal row ──
      // pdf.setFont("Signika-Regular");
      // pdf.setTextColor(0, 0, 0);
      // pdf.text("Subtotal", 130, y);
      // pdf.text(formatReadableAmount(data.Subtotal || "0.00"), 195, y, { align: "right" });
      // y += 5;

      // ── Discount + Taxable Amount (only when discount exists) ──
      if (hasDiscount) {
        // thin separator above discount

        // Discount row
        pdf.setFont("Signika-Regular");
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Discount`, 130, y);
        pdf.text(`${discountRate.toFixed(2)}%`, 160, y, { align: "right" });
        pdf.text(`- ${formatReadableAmount(data.Discount_Amount)}`, 195, y, { align: "right" });
        y += 5;

        // thin separator above taxable
        pdf.setDrawColor(180, 180, 180);
        pdf.setLineWidth(0.2);
        pdf.line(125, y - 4, 200, y - 4);

        // Taxable Amount row
        pdf.setFont("Signika-Medium");
        pdf.setTextColor(0, 0, 0);
        pdf.text("Total", 130, y);
        pdf.text(formatReadableAmount(data.Taxable_Amount || "0.00"), 195, y, { align: "right" });
        y += 5;

        // thin separator below taxable
        pdf.setDrawColor(180, 180, 180);
        pdf.setLineWidth(0.2);
        pdf.line(125, y - 4, 200, y - 4);

        // reset draw color back
        pdf.setDrawColor(80, 80, 80);
        pdf.setLineWidth(0.3);
      }

      // ── GST / TCS rows ──
      let taxLines = [
        ["IGST", data.IGSTRate, data.IGSTAmount],
        ["CGST", data.CGSTRate, data.CGSTAmount],
        ["SGST", data.SGSTRate, data.SGSTAmount],
        ["TCS", data.TCS_Rate, data.TCS_Amt],
      ];

      if (igstRate > 0) {
        taxLines = taxLines.filter(
          ([label, rate]) => label === "IGST" || (label === "TCS" && parseFloat(rate) > 0)
        );
      } else {
        taxLines = taxLines.filter(
          ([label, rate]) => label !== "IGST" && parseFloat(rate) > 0
        );
      }

      pdf.setFont("Signika-Regular");
      pdf.setTextColor(0, 0, 0);

      taxLines.forEach(([label, rate, amount]) => {
        pdf.text(`${label}`, 130, y);
        pdf.text(`${Number(rate || 0).toFixed(2)}%`, 160, y, { align: "right" });
        pdf.text(formatReadableAmount(amount || 0), 195, y, { align: "right" });
        y += 5;
      });



      const totalPayable = Number(data.TCS_Net_Payable || 0);

      // Line before Net Payable
      pdf.setDrawColor(80, 80, 80);
      pdf.setLineWidth(0.3);
      pdf.line(10, y - 3, 200, y - 3);

      // Net Payable Text
      pdf.setFont("Signika-Regular");
      pdf.setTextColor(0, 0, 0);
      const words = ConvertNumberToWord(totalPayable);
      const lines = pdf.splitTextToSize(`Rs: ${words}`, 180);
      lines.forEach((line, i) => pdf.text(line, 12, y + i + 2));
      // y += lines.length * 4;
      pdf.setFont("Signika-Bold");
      pdf.setTextColor(41, 122, 14);
      pdf.text("Net Payable:", 130, y + 2);
      pdf.text(`₹ ${formatReadableAmount(totalPayable.toFixed(2))}`, 195, y + 2, { align: "right" });

      // Line after Net Payable
      y += 5;
      pdf.line(10, y, 200, y);

      y += 4;


      // In Words
      pdf.setTextColor(0, 0, 0);
      pdf.setFont("Signika-Regular");


      // const words = ConvertNumberToWord(totalPayable);
      // const lines = pdf.splitTextToSize(`Amount: Rs. ${words}`, 180);
      // lines.forEach((line, i) => pdf.text(line, 12, y + i+1));
      // y += lines.length * 4;

      pdf.setDrawColor(80, 80, 80);
      pdf.setLineWidth(0.3);
      y += 2


      const terms = [
        "A/c Name: JK India eAgritech Limited Division ChiniMandi",
        "A/c No: 9240200 6938 7859",
        "Bank Name: Axis Bank",
        "Branch: New Mahadwar Road, Kolhapur",
        "IFSC Code: UTIB0001196",
        // `EInvoice No: ${data.einvoiceno || ""}`,
        // `Ack No: ${data.ackno || ""}`,

        // // original terms
        // "- All creative content (images, videos, captions, ad copy) to be provided by the client unless specified.",
        // "ChiniMandi.com is not liable for factual accuracy or copyright issues in client-submitted material.",
        // `- Subject to ${data.City_E} jurisdiction.`
      ];

      // Dynamic positioning for bank details based on y position
      const bankY = y + 5;
      pdf.setFont("Signika-Bold");
      pdf.text("Bank Details:", 12, bankY);
      pdf.setFont("Signika-Regular");
      pdf.setFontSize(8);
      terms.forEach((t, i) => {
        const tLines = pdf.splitTextToSize(t, 180);
        tLines.forEach((l, j) => {
          pdf.text(l, 12, bankY + 5 + (i * 4) + j * 4);
        });
      });

      // Calculate new y position after bank details
      const afterBankY = bankY + (terms.length * 4) + 10;

      pdf.setFont("Signika-Bold");
      pdf.setFontSize(9);
      const signY = afterBankY;
      const forText = `For. ${String(displayCompanyName ?? "")}`;
      const textWidth = pdf.getTextWidth(forText);
      const rightMargin = 197;
      const forTextX = rightMargin - textWidth;

      pdf.text(forText, forTextX, signY);
      const signWidth = 240;
      const signHeight = signWidth / 5;

      pdf.addImage(signImg, "PNG", 158, signY + 2, signWidth, signHeight);

      pdf.text("Authorised Signatory", 168, signY + 20);

      const footerY = 252;
      const footerHeight = 60;
      const poweredByY = footerY + footerHeight - 21;
      if (shouldUseImage) {
        pdf.addImage(footerImg, "PNG", 10, footerY + 5, 370, footerHeight);
      } else {
        pdf.addImage(footerImg1, "PNG", 0, footerY + 5, 210, footerHeight);
      }

      pdf.setFont("Signika-Medium");
      pdf.setFontSize(7);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Powered by: Sugarian.app", 12, poweredByY);

      const blob = pdf.output("blob");
      setPdfData(URL.createObjectURL(blob));
    };
  };

  return (
    <div id="pdf-content">
      <PrintButton disabledFeild={disabledFeild} fetchData={fetchBillData} />
      {pdfData && (
        <PdfPreview
          pdfData={pdfData}
          apiData={apiData}
          label={"ServiceBill"}
        />
      )}
    </div>
  );
};

export default ProformaServiceBillReportSEIC;