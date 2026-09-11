import React, { useState, useEffect, useRef } from "react";
import "./invoice.css";
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

const CustomizeSBReport = ({ doc_no, disabledFeild }) => {
  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");
  const [invoiceData, setInvoiceData] = useState([]);
  const [pdfPreview, setPdfPreview] = useState(null);
  const TCSApplicable = sessionStorage.getItem("TCSApplicable");
  const CompanyNameUpdatedDate = sessionStorage.getItem("CompanyNameUpdatedDate")
  const newCompanyName = sessionStorage.getItem("newCompanyName")
  const oldFormerlyName = sessionStorage.getItem("oldFormerlyName")


  const fetchData = async () => {
    try {
      const response = await fetch(
        `${API_URL}/generating_saleBill_report?Company_Code=${companyCode}&Year_Code=${Year_Code}&doc_no=${doc_no}`
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
    const foormerlyName = docDate < cnameUpdatedDate ? oldFormerlyName : allData.AL1;

    pdf.setFont("Signika-Regular");
    pdf.setFontSize(8);

    const logoImg = new Image();
    const signImg = new Image();
    const headerImg = new Image();
    const footerImg = new Image();
    const footerImg1 = new Image();
    logoImg.src = logo;
    signImg.src = SignToUse;
    headerImg.src = HeaderJK;
    footerImg.src = FooterJK;
    footerImg1.src = FooterJK1

    const qrCodeData = `
    GSTN of Supplier : ${allData.companyGSTNo || ""}
    GSTIN of Buyer : ${allData.billtogstno || ""}
    Document No. : ${allData.doc_no || ""}
    Document Type : Tax Invoice
    Date : ${allData.doc_date || ""}
    HSN : ${allData.HSN || ""}
    IRN : ${allData.einvoiceno || ""}
    `;
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeData.trim());

    logoImg.src = logoToUse;
    logoImg.onload = () => {

const shouldUseImage =
  docDate >= cnameUpdatedDate

    //   pdf.addImage(logoImg, "PNG", 10, 9, 30, 30);
    //   pdf.setFont("Signika-Bold");
    //   pdf.setFontSize(14);
    //   pdf.text(displayCompanyName, 45, 14);
    //   pdf.setFont("Signika-Regular");
    //   pdf.setFontSize(9);
    // pdf.setFont("Signika-Regular"); 
    //   pdf.setFontSize(9);
    //   pdf.text(`${foormerlyName}`, 45, 18);
    //   pdf.text(`${allData.AL2}`, 45, 22);
    //   pdf.text(`${allData.AL3}`, 45, 26);
    //   pdf.text(`${allData.AL4}`, 45, 30);
    //   pdf.text(`${allData.Other}`, 45, 34);
    //   pdf.text(`${allData.BillFooter}`,45,38)
    if (shouldUseImage) {
    // Use header image across top (new template)
    pdf.addImage(headerImg, "PNG", 0, 6, 180, 34); // full width
  } else {
    // Old layout: logo + company name + address lines
    pdf.addImage(logoImg, "PNG", 10, 9, 30, 30);
    pdf.setFont("Signika-Bold");
    pdf.setFontSize(14);
    pdf.text(displayCompanyName, 45, 14);
    pdf.setFont("Signika-Regular");
    pdf.setFontSize(9);
    pdf.text(`${foormerlyName}`, 45, 18);
    pdf.text(`${allData.AL2}`, 45, 22);
    pdf.text(`${allData.AL3}`, 45, 26);
    pdf.text(`${allData.AL4}`, 45, 30);
    pdf.text(`${allData.Other}`, 45, 34);
    pdf.text(`${allData.BillFooter}`, 45, 38);
  }
      pdf.addImage(qrCodeDataUrl, "PNG", 170, 9, 30, 30);

      pdf.setFontSize(10);
      pdf.setFont("Signika-Bold");
      pdf.setDrawColor(80, 80, 80);
      pdf.line(10, 44, 200, 44);
      pdf.setTextColor(41, 122, 14);
      pdf.text("TAX INVOICE", 95, 49);
      pdf.setLineWidth(0.3);
      pdf.setDrawColor(80, 80, 80);
      pdf.line(10, 52, 200, 52);
      pdf.setTextColor(0, 0, 0);

      let y = 45;
 pdf.setFontSize(9);

      const fieldPairs = [
        [
          `Invoice No. :  SB${allData.year}-${allData.doc_no}`,
          `Invoice Date : ${allData.doc_dateConverted}`,
          "Lorry No.",
          allData.LORRYNO,
        ],
        [
          `DO No. : ${allData.DO_No}`,
          `Date of Supply : ${allData.doc_dateConverted}`,
          "Transport Mode",
          "Road",
        ],
        [
          `E-Way Bill No.: ${allData.EWay_Bill_No}`,
          `EwayBill ValidDate: ${allData.EwayBillValidDate}`,
          "From",
          `${allData.millshortname} (${allData.millstatename} - ${allData.millstatecode})`,
        ],
        [
          `Acknowledge: ${allData.ackno}`,
          "",
          "Place Of Supply",
          `${allData.shiptocityname} (${allData.shiptocitystate} - ${allData.shiptogststatecode})`,
        ],
        [
          `E-Invoice No.: ${allData.einvoiceno}`,
          "",
          "Ref By",
          allData.shiptoshortname,
        ],
        ["", "", "Reverse Charge", "No"],
      ];

      fieldPairs.forEach(([left1, left2, rightLabel, rightValue]) => {
        const leftX = 12;
        const middleX = 60;
        const rightX = 110;
        const wrapWidth = 85;
        const lineHeight = 4;

        const [rawLeftLabel, ...rawLeftValParts] = (left1 ?? "").split(":");
        const leftLabel = rawLeftLabel?.trim() ? `${rawLeftLabel.trim()}:` : "";
        const leftValue = rawLeftValParts.join(":").trim();
        const leftValueLines = pdf.splitTextToSize(leftValue, wrapWidth - pdf.getTextWidth(leftLabel));

        const left2Lines = pdf.splitTextToSize(left2 ?? "", wrapWidth);

        const rightLabelText = rightLabel?.trim() ? `${rightLabel.trim()}:` : "";
        const rightValueText = rightValue?.toString().trim() ?? "";
        const rightValueLines = pdf.splitTextToSize(rightValueText, wrapWidth - pdf.getTextWidth(rightLabelText));

        const maxLines = Math.max(leftValueLines.length, left2Lines.length, rightValueLines.length);

        for (let i = 0; i < maxLines; i++) {
          const yOffset = y + i * lineHeight + 17;

          if (i === 0 && leftLabel) {
            pdf.setFont("Signika-Medium");
            pdf.text(leftLabel, leftX, yOffset);
            pdf.setFont("Signika-Regular");
            pdf.text(leftValueLines[i] ?? "", leftX + pdf.getTextWidth(leftLabel) + 1, yOffset);
          } else if (leftValueLines[i]) {
            pdf.setFont("Signika-Regular");
            pdf.text(leftValueLines[i], leftX, yOffset);
          }


          if (left2Lines[i]) {
            pdf.setFont("Signika-Regular");
            pdf.text(left2Lines[i], middleX, yOffset);
          }

          if (i === 0 && rightLabelText) {
            pdf.setFont("Signika-Medium");
            pdf.text(rightLabelText, rightX, yOffset);
            pdf.setFont("Signika-Regular");
            pdf.text(rightValueLines[i] ?? "", rightX + pdf.getTextWidth(rightLabelText) + 1, yOffset);
          } else if (rightValueLines[i]) {
            pdf.setFont("Signika-Regular");
            pdf.text(rightValueLines[i], rightX, yOffset);
          }
        }

        y += maxLines * lineHeight;
      });

      const verticalX = 105;
      const topOfFieldPairs = 59;
      const bottomOfFieldPairs = y + 12;

      pdf.setDrawColor(80, 80, 80);
      pdf.setLineWidth(0.3);
      pdf.setDrawColor(80, 80, 80);
      pdf.line(verticalX, topOfFieldPairs, verticalX, bottomOfFieldPairs);

      // const addressBlock = (x, yStart, title, lines) => {
      //   let y = yStart;
      //   let lineHeight = 4;
      //   pdf.setFont("Signika-Regular");
      //   pdf.setTextColor(41, 122, 14);
      //   pdf.text(title, x, y);
      //   y += lineHeight;

      //   lines.forEach((line, index) => {
      //     const wrapped = pdf.splitTextToSize(String(line ?? ""), 85);
      //     pdf.setFont(index === 0 ? "Signika-Bold" : "Signika-Regular");
      //     if (index === 0) {
      //       pdf.setTextColor(41, 122, 14);
      //     } else {
      //       pdf.setTextColor(0, 0, 0);
      //     }

      //     pdf.text(wrapped, x, y);
      //     y += wrapped.length * lineHeight;
      //   });
      //   return y;
      // };

      //uniform Spacing
      const addressBlock = (x, yStart, title, lines) => {
        let y = yStart;
        const lineHeight = 4; // same as other blocks

        // Title
        pdf.setFont("Signika-Medium");
        pdf.setTextColor(0, 0, 0);
        pdf.text(title, x, y + 10);
        y += lineHeight;

        // Body lines
        lines.forEach((line, index) => {
          const wrapped = pdf.splitTextToSize(String(line ?? ""), 85);

          // First line: bold and green, rest normal
          pdf.setFont(index === 0 ? "Signika-Bold" : "Signika-Regular");
          pdf.setTextColor(index === 0 ? 41 : 0, index === 0 ? 122 : 0, index === 0 ? 14 : 0);

          // Loop through each wrapped line to draw and increment y
          wrapped.forEach((wLine) => {
            pdf.text(wLine, x, y + 10);
            y += lineHeight; // uniform spacing
          });
        });

        return y; // returns new y-position to continue below this block
      };


      const isRegular =
        allData.carporateSaleDoc !== 0 &&
        allData.carporateSaleDoc !== "" &&
        allData.selling_type === "P" &&
        allData.Delivery_type === "C";

      const fssaiNo = isRegular
        ? allData.FSSAI_BillTo
        : allData.carporateBillToFSSAI || allData.FSSAI_BillTo;

      const tanNo = isRegular
        ? allData.BillToTanNo
        : allData.Carporate_Tanno || allData.BillToTanNo;

      const billToLines = [
        isRegular
          ? allData.billtoname
          : allData.CarporateBillTo_Name || allData.billtoname,

        isRegular
          ? `${allData.billtoaddress}, ${allData.billtocitystate} ${allData.billtopincode}`
          : `${allData.Carporate_Address}, ${allData.carporateBillToStateName} ${allData.carporateBillToPincode}` ||
          `${allData.billtoaddress}, ${allData.billtocitystate} ${allData.billtopincode}`,

        `City: ${isRegular
          ? `${allData.billtopin} (${allData.billtocitystate} - ${allData.billtogststatecode})`
          : allData.carporateBillToCityName
            ? `${allData.carporateBillToCityName}  (${allData.carporateBillToStateName} - ${allData.CarporateState_Code})`
            : `${allData.billtopin} (${allData.billtocitystate} - ${allData.billtogststatecode})`
        }`,
        `GST: ${isRegular
          ? allData.billtogstno
          : allData.CarporateBillToGst_No || allData.billtogstno
        }`,

        `PAN: ${isRegular
          ? allData.billtopanno
          : allData.Carporate_Pan || allData.billtopanno
        }`,

        fssaiNo ? `FSSAI: ${fssaiNo}` : null,
        tanNo ? `TAN: ${tanNo}` : null,
      ].filter(Boolean);

      const fssaiShipTo = allData.FSSAI_ShipTo;
      const tanShipTo = allData.ShipToTanNo;

      const shipToLines = [
        allData.shiptoname,
        allData.shiptoaddress,
        `City: ${allData.shiptocityname} (${allData.shiptocitystate} - ${allData.shiptogststatecode})`,
        `GST: ${allData.shiptogstno}`,
        `PAN: ${allData.shiptopanno}`,
        fssaiShipTo ? `FSSAI: ${fssaiShipTo}` : null,
        tanShipTo ? `TAN: ${tanShipTo}` : null,
      ].filter(Boolean); // removes null/undefined/empty


      pdf.setLineWidth(0.3);
      pdf.setDrawColor(80, 80, 80);
      pdf.line(10, y + 18, 200, y + 18);

      const addressStartY = y + 17;
      // setTextColor(0, 0, 0)
      const endYBill = addressBlock(12, addressStartY, "Buyer (Bill to):", billToLines);
      const endYShip = addressBlock(110, addressStartY, "Consignee (Ship to):", shipToLines);
      pdf.setDrawColor(80, 80, 80);
      pdf.line(105, addressStartY + 6, 105, Math.max(endYBill, endYShip) + 7);
      pdf.setDrawColor(80, 80, 80);
      pdf.line(
        10,
        Math.max(endYBill, endYShip) + 13,
        200,
        Math.max(endYBill, endYShip) + 13
      );
      y = Math.max(endYBill, endYShip) + 11;

      const verticalStartAfterGap = addressStartY + 15;
      const verticalEnd = Math.max(endYBill, endYShip);
      pdf.setDrawColor(80, 80, 80);
      // pdf.line(105, verticalStartAfterGap + 50, 105, verticalEnd + 8);


      pdf.setLineWidth(0.3);
      pdf.setDrawColor(80, 80, 80);

      pdf.setFont("Signika-Medium");
      pdf.setTextColor(41, 122, 14);
      pdf.text("Particulars", 12, y + 7);
      pdf.text("Short Name", 50, y + 7, { align: "left" });
      pdf.text("HSN", 80, y + 7);
      pdf.text("Grade", 100, y + 7);
      pdf.text("Season", 120, y + 7);
      pdf.text("Quintal", 140, y + 7);
      pdf.text("Rate", 160, y + 7);
      pdf.text("Value", 182, y + 7);
      y += 5;

      pdf.setLineWidth(0.3);
      pdf.setDrawColor(80, 80, 80);
      pdf.line(10, y + 5, 200, y + 5);


      pdf.setFont("Signika-Medium");
      pdf.setTextColor(0, 0, 0);
      pdf.text(String(allData.itemname ?? "Sugar"), 12, y + 9);
      pdf.setFont("Signika-Regular");
      pdf.text(String(allData.millshortname ?? ""), 50, y + 9);
      pdf.text(String(allData.HSN ?? ""), 80, y + 9);
      pdf.text(String(allData.grade ?? ""), 100, y + 9);
      pdf.text(String(allData.season ?? ""), 120, y + 9);
      const value = parseFloat(allData.TaxableAmount || 0);
      const rate = parseFloat(allData.Quantal)
        ? (value / parseFloat(allData.Quantal)).toFixed(2)
        : 0;

      const formattedQty = Number(allData.Quantal || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
      });
      const formattedRate = Number(rate).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
      });
      const formattedValue = Number(value).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
      });
      const amountX = 197;
      const rateX = 170;
      const labelX = 140;

      pdf.text(`${formattedQty} Qntl`, labelX, y + 9);
      pdf.text(formattedRate, rateX, y + 9, { align: "right" });
      pdf.text(formattedValue, amountX, y + 9, { align: "right" });

      y += 8;
      pdf.setFont("Signika-Regular");

      const wrappedMillName = pdf.splitTextToSize(String(allData.millname ?? "-"), 90);
      pdf.text("Mill Name:", 12, y + 11);
      pdf.text(wrappedMillName, 28, y + 11);

      const millNameHeight = (wrappedMillName.length - 1) * 5;
      let currentY = y + 16 + millNameHeight;


      let fssai = String(allData.MillFSSAI_No ?? "").trim();
      if (fssai !== "") {
        // Manually insert breakable characters every 15 chars if needed
        if (fssai.length > 25 && !fssai.includes(" ")) {
          fssai = fssai.match(/.{1,20}/g).join(" ");
        }

        const wrappedFSSAI = pdf.splitTextToSize(fssai, 100);
        pdf.text("Mill FSSAI:", 12, currentY);
        pdf.text(wrappedFSSAI, 28, currentY);
      }



      y += 8;

      // 1. Parse out your rates / amounts
      const igstRate = parseFloat(allData.IGSTRate) || 0;
      const igstAmt = parseFloat(allData.IGSTAmount) || 0;

      const cgstRate = parseFloat(allData.CGSTRate) || 0;
      const cgstAmt = parseFloat(allData.CGSTAmount) || 0;

      const sgstRate = parseFloat(allData.SGSTRate) || 0;
      const sgstAmt = parseFloat(allData.SGSTAmount) || 0;

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

      const summaryFields = [
        ...(allData.carporateSaleDoc === 0 ||
          allData.carporateSaleDoc === "" ||
          allData.carporateSaleDoc === null
          ? [["Freight", allData.LESS_FRT_RATE, allData.freight]]
          : []),

        ["Taxable Amount", "", allData.TaxableAmount],
        ...taxRows,
        ["Rate Diff/Qntl", "", allData.RateDiff],
        ["Other Expense", "", allData.OTHER_AMT],
        ["Round Off", "", allData.RoundOff],

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
        pdf.text(`${label}:`, 130, y + 3);

        // Rate, if available
        if (rate !== null && rate !== undefined && rate !== "") {
          pdf.text(`${formatReadableAmount(rate)}%`, 165, y + 3, { align: "center" });
        }

        // Format amount safely
        const formattedAmount = formatReadableAmount(amount);
        pdf.text(formattedAmount, 197, y + 3, { align: "right" });

        y += 5;
      });


      pdf.setLineWidth(0.3);
      pdf.setDrawColor(80, 80, 80);
      pdf.line(10, y + 4, 200, y + 4);


      const totalInWords = ConvertNumberToWord(
        parseFloat(allData.TCS_Net_Payable)
      );
      pdf.text(`Rs: ${totalInWords}.`, 12, y + 9);
      const formattedTotal = Number(allData.TCS_Net_Payable || 0).toLocaleString(
        "en-IN",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      );

      pdf.setFont("Signika-Bold");
      pdf.setTextColor(41, 122, 14);
      pdf.text("Total Amount:", 150, y + 9);
      pdf.text(`₹ ${formattedTotal}`, amountX, y + 9, { align: "right" });

      y += 5;
      pdf.setLineWidth(0.3);
      pdf.line(10, y + 7, 200, y + 7);

      pdf.setFont("Signika-Bold");
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(8);
      pdf.text("Terms & Conditions:", 12, y + 12);
      pdf.setFont("Signika-Regular");
      const notes = [
        "- If there is no insurance of the goods, after dispatch from the destination,",
        "   we are not responsible for non delivery, damage or any kind of loss.",
        "- Buyer must inspect and confirm quality & quantity of the goods before dispatch from godown.",
        "   Once loaded and truck leaves godown, Said all responsibilities will be transfer to buyers account.",
        "- Please send the full amount in our account through RTGS before despatch the goods.",
        "   If the amount is not received in our account, Interest of 24% P.A. will be charged to the buyer.",
         `- Subject to ${allData.companyCity} jurisdiction.`
      ];
      notes.forEach((n, i) => pdf.text(n, 12, y + 13 + (i + 1) * 3));

      y += 25;
      if (allData.SBNarration) {
        pdf.text(`${allData.SBNarration}`, 12, y + 12)
      }
      const signY = y - 10;
      pdf.setFont("Signika-Bold");
      pdf.setFontSize(9);
      pdf.setTextColor(0, 0, 0);
      const forText = `For. ${String(displayCompanyName ?? "")}`;
      const textWidth = pdf.getTextWidth(forText);
      const rightMargin = 197;
      const forTextX = rightMargin - textWidth;

      pdf.text(forText, forTextX, signY);
      const signWidth = 240;
      const signHeight = signWidth / 5;

      y -= 20;

      pdf.addImage(signImg, "PNG", 157, y + 11, signWidth, signHeight);
      pdf.text("Authorised Signatory", 168, y + 28);

      const footerY = 252;
      const footerHeight = 37;
      const poweredByY = footerY + footerHeight + 3;

      if(shouldUseImage){
      pdf.addImage(footerImg, "PNG", 0, footerY, 260, footerHeight);
      }else{
         pdf.addImage(footerImg1, "PNG", 0, footerY, 210, footerHeight);
      }

      pdf.setFont("Signika-Medium");
      pdf.setFontSize(7);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Powered by: Sugarian.app", 12, poweredByY);

      const pdfBlob = pdf.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
       setPdfPreview({
  url: pdfUrl,
  data: {
    ...allData,
    sale_rate: rate, 
   Doc_No: `SB${allData?.year || ""}-${allData?.doc_no || ""}`,
   CompanyName: displayCompanyName
  }
});
    };
  }

  const gstNo = sessionStorage.getItem("Company_GSTNO") || "";

  
  const jkGSTs = [
    "27AAECJ8332R1ZV",
    "27AEJPS9860D1Z0",
    "27ARCPS1606H1ZW",
    "27AAMFJ4182A1ZG",
  ];

  const isJK = jkGSTs.includes(gstNo.toUpperCase());

  let label = ''
  if(isJK){
label = "accounts_sale_bill_2"
  }
else
{
  label = "SaleBill"
}
  return (
    <div id="pdf-content">
      {pdfPreview && (
        <PdfPreview
  pdfData={pdfPreview.url}
  apiData={pdfPreview.data}
  label={label}
/>
      )}
      <PrintButton disabledFeild={disabledFeild} fetchData={fetchData} label={"Sale Bill Print"} />
    </div>
  );
};
export default CustomizeSBReport;



