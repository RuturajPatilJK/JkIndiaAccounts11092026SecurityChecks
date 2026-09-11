import React, { useEffect, useState } from "react";
import logo from "../../../Assets/jklogo.png";
import logo1 from "../../../Assets/jk.png"
import Sign from "../../../Assets/DirectorSign.png";
import Sign1 from "../../../Assets/DirectorSign1.png";
import jsPDF from "jspdf";
import "jspdf-autotable";
import PdfPreview from "./../../../Common/PDFPreview";
import QRCode from "qrcode";
import HeaderJK from "../../../Assets/HeaderJK.png";
import FooterJK from "../../../Assets/FooterJK.png";
import FooterJK1 from "../../../Assets/FooterJK1.png";
import { ConvertNumberToWord } from "../../../Common/FormatFunctions/ConvertNumberToWord";
import PrintButton from "../../../Common/Buttons/PrintPDF";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";

const API_URL = process.env.REACT_APP_API;

const VoucherReport = ({
  doc_no,
  Company_Code,
  Year_Code,
  tran_type,
  disabledFeild,
}) => {
  const [invoiceData, setInvoiceData] = useState([]);
  const [pdfPreview, setPdfPreview] = useState(null);
  const companyCode = sessionStorage.getItem("Company_Code");
  const YearCode = sessionStorage.getItem("Year_Code");
  const TCSApplicable = sessionStorage.getItem("TCSApplicable");
  const CompanyNameUpdatedDate = sessionStorage.getItem("CompanyNameUpdatedDate")
  const newCompanyName = sessionStorage.getItem("newCompanyName")
  const oldFormerlyName = sessionStorage.getItem("oldFormerlyName")

  const fetchData = async () => {
    try {
      const response = await fetch(
        `${API_URL}/generating_voucherbill_report?Company_Code=${Company_Code}&doc_no=${doc_no}&Year_Code=${Year_Code}&Tran_Type=${tran_type}`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setInvoiceData(data.all_data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    if (invoiceData.length > 0) {
      generatePdf(invoiceData);
    }
  }, [invoiceData]);

  
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

     
      const verticalX = 105;
      const topOfFieldPairs = 20;
      const bottomOfFieldPairs = y - 2;

      pdf.setDrawColor(80, 80, 80);
      pdf.setLineWidth(0.3);
      pdf.setDrawColor(80, 80, 80);
      const shorterTop = Math.max(topOfFieldPairs, verticalX) - 5;
      pdf.line(105, bottomOfFieldPairs + 10, 105, shorterTop);


     
      //uniform Spacing
      const addressBlock = (x, yStart, title, lines) => {
        let y = yStart;
        const lineHeight = 4; // same as other blocks

        // Title
        pdf.setFont("Signika-Medium");
        pdf.setTextColor(0, 0, 0);
        pdf.text(title, x, y - 4);
        y += lineHeight;

        // Body lines
        lines.forEach((line, index) => {
          const wrapped = pdf.splitTextToSize(String(line ?? ""), 85);

          // First line: bold and green, rest normal
          pdf.setFont(index === 0 ? "Signika-Bold" : "Signika-Regular");
          pdf.setTextColor(index === 0 ? 41 : 0, index === 0 ? 122 : 0, index === 0 ? 14 : 0);

          // Loop through each wrapped line to draw and increment y
          wrapped.forEach((wLine) => {
            pdf.text(wLine, x, y - 4);
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
        ? allData.FSSAI
        : allData.carporateBillToFSSAI || allData.FSSAI_BillTo;

      const tanNo = isRegular
        ? allData.BillToTanNo
        : allData.Carporate_Tanno || allData.BillToTanNo;

      const billToLines = [
        isRegular
          ? allData.Ac_Name_E
          : allData.Ac_Name_E || allData.Ac_Name_E,

        isRegular
          ? allData.Address_E
          : allData.Address_E || allData.Address_E,

        `City:  ${isRegular
          ? allData.cityname
          : allData.cityname || allData.cityname
        }`,
        `Our GST Number: ${isRegular
          ? allData.GST
          : allData.GST || allData.GST
        }`,

        `GST : ${isRegular
          ? allData.Gst_No
          : allData.Gst_No || allData.Gst_No
        }`,

        `PAN: ${isRegular
          ? allData.CompanyPan
          : allData.CompanyPan || allData.CompanyPan
        }`,

        fssaiNo ? `FSSAI: ${fssaiNo}` : null,
        tanNo ? `TAN: ${tanNo}` : null,
      ].filter(Boolean);

      const fssaiShipTo = allData.MillFSSAI_No;
      const tanShipTo = allData.FSSAI;

      const shipToLines = [
        allData.shiptoname,
        allData.shiptoaddress,
        `Date Of Supply: ${allData.doc_dateConverted}`,
        `Place Of Supply: ${allData.State_E}`,
        fssaiShipTo ? `FSSAI: ${fssaiShipTo}` : null || "",
        tanShipTo ? `FSSAI: ${tanShipTo}` : null || "",
      ].filter(Boolean); // removes null/undefined/empty


      const addressStartY = y + 17;
      const endYBill = addressBlock(12, addressStartY, "Buyer (Bill to):", billToLines);
      const endYShip = addressBlock(110, addressStartY, "Transport Mode: Road", shipToLines);
      pdf.setDrawColor(80, 80, 80);
      // pdf.line(105, addressStartY + 2, 105, Math.max(endYBill, endYShip) + 7);
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
   


      pdf.setLineWidth(0.3);
      pdf.setDrawColor(80, 80, 80);

      pdf.setFont("Signika-Medium");
      pdf.setTextColor(41, 122, 14);
      pdf.text("Particulars", 12, y + 7);
      pdf.text("Bags", 60, y + 7, { align: "left" });
      pdf.text("HSN", 80, y + 7);
      pdf.text("Grade", 100, y + 7);
      pdf.text("Frieght", 120, y + 7);
      pdf.text("Quintal", 140, y + 7);
      pdf.text("Rate", 162, y + 7);
      pdf.text("Value", 182, y + 7);
      y += 5;

      pdf.setLineWidth(0.3);
      pdf.setDrawColor(80, 80, 80);
      pdf.line(10, y + 5, 200, y + 5);


      pdf.setFont("Signika-Medium");
      pdf.setTextColor(0, 0, 0);
      const particularsText = String(allData.System_Name_E ?? "Sugar").trim();
      const wrappedParticulars = pdf.splitTextToSize(particularsText, 45); // 45 width fits the column
      pdf.setFont("Signika-Medium");
      pdf.setTextColor(0, 0, 0);
      pdf.text(wrappedParticulars, 12, y + 9);
      pdf.setFont("Signika-Regular");
      pdf.text(String(allData.bags ?? ""), 60, y + 9);
      pdf.text(String(allData.HSN ?? ""), 80, y + 9);
      pdf.text(String(allData.grade ?? ""), 100, y + 9);
      pdf.text(String(allData.Freight_Rate ?? ""), 120, y + 9);
      const value = parseFloat(allData.TaxableAmount || 0);
      const rate = parseFloat(allData.qntl)
        ? (value / parseFloat(allData.qntl)).toFixed(2)
        : 0;

      const formattedQty = Number(allData.qntl || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
      });
      const formattedRate = Number(rate).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
      });
      const formattedValue = Number(value).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
      });
      const amountX = 187;
      const rateX = 168;
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

      const summaryFields = [
        ...(allData.carporateSaleDoc === 0 ||
          allData.carporateSaleDoc === "" ||
          allData.carporateSaleDoc === null
          ? [["Freight", allData.LESS_FRT_RATE, allData.freight]]
          : []),

        ["Taxable Amount", "", allData.texable_amount],
        ...taxRows,
        ["Rate Diff/Qntl", "", allData.commission_amount],
        ["Commission", "", allData.resale_commission],
        ["Bank Commission", "", allData.BANK_COMMISSION],
        // ["Frieght", "", allData.Freight_amt],
        ["Mill Rate", "", allData.mill_rate],
        ["Sale Rate", "", allData.sale_rate],
        ["Other Expense", "", allData.misc_amount],
        // ["Round Off", "", allData.RoundOff],

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
        parseFloat(allData.bill_amount)
      );
      pdf.text(`Rs: ${totalInWords}.`, 12, y + 9);
      const formattedTotal = Number(allData.bill_amount || 0).toLocaleString(
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
    };
  }

  return (
    <div id="pdf-content">
      {pdfPreview && (
        <PdfPreview
          pdfData={pdfPreview}
          apiData={invoiceData[0]}
          label={"PurchaseBill"}
        />
      )}
      <PrintButton disabledFeild={disabledFeild} fetchData={fetchData} />
    </div>
  );
};

export default VoucherReport;
