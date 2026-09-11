import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "../../Outward/SaleBill/invoice.css";
import logo from "../../../Assets/jklogo.png";
import logo1 from "../../../Assets/jk.png";
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

const MultipleSBReport = () => {
  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");
  const [invoiceData, setInvoiceData] = useState([]);
  const [pdfPreview, setPdfPreview] = useState(null);
  const TCSApplicable = sessionStorage.getItem("TCSApplicable");
  const CompanyNameUpdatedDate = sessionStorage.getItem("CompanyNameUpdatedDate");
  const newCompanyName = sessionStorage.getItem("newCompanyName");
  const oldFormerlyName = sessionStorage.getItem("oldFormerlyName");


  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const acCode = searchParams.get('acCode');
  const acname = searchParams.get('acname');
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');

  const fetchData = async () => {
    try {
      const params = new URLSearchParams({ Company_Code: companyCode, Year_Code });
      if (acCode) params.set('Ac_code', acCode);
      if (fromDate) params.set('from_date', fromDate);
      if (toDate) params.set('to_date', toDate);
      const response = await fetch(
        `${API_URL}/generating_MultiplesaleBill_report?${params.toString()}`
      );
      if (!response.ok) throw new Error("Network error");
      const data = await response.json()

      setInvoiceData(data.all_data);
      generatePdf(data.all_data);
    } catch (err) {
      console.error("Error fetching:", err);
    }
  };


  useEffect(() => {
    fetchData();
  }, []);

  const loadImage = (src) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = src;
    });

  const generatePdf = async (allBills) => {
    if (!Array.isArray(allBills) || allBills.length === 0) return;

    const [
      logoImgOld,
      logoImgNew,
      signOld,
      signNew,
      headerImgLoaded,
      footerNewLoaded,
      footerOldLoaded
    ] = await Promise.all([
      loadImage(logo),
      loadImage(logo1),
      loadImage(Sign),
      loadImage(Sign1),
      loadImage(HeaderJK),
      loadImage(FooterJK),
      loadImage(FooterJK1)
    ]);

    const pdf = new jsPDF({ orientation: "portrait" });

    let isFirstPage = true;

    for (const bill of allBills) {
      const allData = bill;   // FIX: data → bill

      if (!isFirstPage) pdf.addPage();
      isFirstPage = false;


      const docDate = new Date(allData.doc_date);
      const cnameUpdatedDate = new Date(CompanyNameUpdatedDate);

      const displayCompanyName =
        docDate < cnameUpdatedDate ? newCompanyName : allData.Company_Name_E;

      const logoToUse = docDate < cnameUpdatedDate ? logoImgNew : logoImgOld;
      const signToUse = docDate < cnameUpdatedDate ? signNew : signOld;
      const footerToUse = docDate >= cnameUpdatedDate ? footerNewLoaded : footerOldLoaded;

      const previouslyName = docDate < cnameUpdatedDate ? oldFormerlyName : allData.AL1;

      pdf.setFont("Signika-Regular");
      pdf.setFontSize(8);

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

      const shouldUseHeaderImage = docDate >= cnameUpdatedDate;


      console.log('shouldUseHeaderImage', shouldUseHeaderImage)

      if (shouldUseHeaderImage) {
        pdf.addImage(headerImgLoaded, "PNG", 0, 6, 180, 34);
      } else {
        pdf.addImage(logoToUse, "PNG", 10, 9, 30, 30);
        pdf.setFont("Signika-Bold");
        pdf.setFontSize(14);
        pdf.text(displayCompanyName, 45, 14);

        pdf.setFont("Signika-Regular");
        pdf.setFontSize(9);
        pdf.text(`${previouslyName}`, 45, 18);
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
      pdf.line(10, 52, 200, 52);
      pdf.setTextColor(0, 0, 0);

      let y = 45;
      pdf.setFontSize(9);

      const fieldPairs = [
        [
          `Invoice No. :  SB${allData.year}-${allData.doc_no}`,
          `Invoice Date : ${allData.doc_dateConverted}`,
          "Lorry No.",
          allData.LORRYNO
        ],
        [
          `DO No. : ${allData.DO_No}`,
          `Date of Supply : ${allData.doc_dateConverted}`,
          "Transport Mode",
          "Road"
        ],
        [
          `E-Way Bill No.: ${allData.EWay_Bill_No}`,
          `EwayBill ValidDate: ${allData.EwayBillValidDate}`,
          "From",
          `${allData.millshortname} (${allData.millstatename} - ${allData.millstatecode})`
        ],
        [
          `Acknowledge: ${allData.ackno}`,
          "",
          "Place Of Supply",
          `${allData.shiptocityname} (${allData.shiptocitystate} - ${allData.shiptogststatecode})`
        ],
        [
          `E-Invoice No.: ${allData.einvoiceno}`,
          "",
          "Ref By",
          allData.shiptoshortname
        ],
        ["", "", "Reverse Charge", "No"]
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
            pdf.text(leftValueLines[i], leftX, yOffset);
          }

          if (left2Lines[i]) pdf.text(left2Lines[i], middleX, yOffset);

          if (i === 0 && rightLabelText) {
            pdf.setFont("Signika-Medium");
            pdf.text(rightLabelText, rightX, yOffset);
            pdf.setFont("Signika-Regular");
            pdf.text(rightValueLines[i] ?? "", rightX + pdf.getTextWidth(rightLabelText) + 1, yOffset);
          } else if (rightValueLines[i]) {
            pdf.text(rightValueLines[i], rightX, yOffset);
          }
        }

        y += maxLines * lineHeight;
      });

      pdf.line(105, 59, 105, y + 12);

      const addressBlock = (x, yStart, title, lines) => {
        let yy = yStart;
        const lh = 4;

        pdf.setFont("Signika-Medium");
        pdf.text(title, x, yy + 10);
        yy += lh;

        lines.forEach((line, idx) => {
          const wrapped = pdf.splitTextToSize(String(line ?? ""), 85);
          pdf.setFont(idx === 0 ? "Signika-Bold" : "Signika-Regular");
          pdf.setTextColor(idx === 0 ? 41 : 0, idx === 0 ? 122 : 0, idx === 0 ? 14 : 0);

          wrapped.forEach((w) => {
            pdf.text(w, x, yy + 10);
            yy += lh;
          });
        });

        pdf.setTextColor(0, 0, 0);
        return yy;
      };

      const isRegular =
        allData.carporateSaleDoc !== 0 &&
        allData.carporateSaleDoc !== "" &&
        allData.selling_type === "P" &&
        allData.Delivery_type === "C";

      const fssaiNo = isRegular ? allData.FSSAI_BillTo : allData.carporateBillToFSSAI || allData.FSSAI_BillTo;
      const tanNo = isRegular ? allData.BillToTanNo : allData.Carporate_Tanno || allData.BillToTanNo;

      const billToLines = [
        isRegular ? allData.billtoname : allData.CarporateBillTo_Name || allData.billtoname,
        isRegular
          ? `${allData.billtoaddress}, ${allData.billtocitystate} ${allData.billtopincode}`
          : `${allData.Carporate_Address}, ${allData.carporateBillToStateName} ${allData.carporateBillToPincode}`,
        `City: ${isRegular
          ? `${allData.billtopin} (${allData.billtocitystate} - ${allData.billtogststatecode})`
          : `${allData.carporateBillToCityName} (${allData.carporateBillToStateName} - ${allData.CarporateState_Code})`
        }`,
        `GST: ${isRegular ? allData.billtogstno : allData.CarporateBillToGst_No}`,
        `PAN: ${isRegular ? allData.billtopanno : allData.Carporate_Pan}`,
        fssaiNo ? `FSSAI: ${fssaiNo}` : null,
        tanNo ? `TAN: ${tanNo}` : null
      ].filter(Boolean);

      const shipToLines = [
        allData.shiptoname,
        allData.shiptoaddress,
        `City: ${allData.shiptocityname} (${allData.shiptocitystate} - ${allData.shiptogststatecode})`,
        `GST: ${allData.shiptogstno}`,
        `PAN: ${allData.shiptopanno}`,
        allData.FSSAI_ShipTo ? `FSSAI: ${allData.FSSAI_ShipTo}` : null,
        allData.ShipToTanNo ? `TAN: ${allData.ShipToTanNo}` : null
      ].filter(Boolean);

      pdf.line(10, y + 18, 200, y + 18);

      const addressStart = y + 17;
      const endBill = addressBlock(12, addressStart, "Buyer (Bill to):", billToLines);
      const endShip = addressBlock(110, addressStart, "Consignee (Ship to):", shipToLines);

      pdf.line(105, addressStart + 6, 105, Math.max(endBill, endShip) + 7);
      pdf.line(10, Math.max(endBill, endShip) + 13, 200, Math.max(endBill, endShip) + 13);

      y = Math.max(endBill, endShip) + 11;

      pdf.setFont("Signika-Medium");
      pdf.setTextColor(41, 122, 14);
      pdf.text("Particulars", 12, y + 7);
      pdf.text("Short Name", 50, y + 7);
      pdf.text("HSN", 80, y + 7);
      pdf.text("Grade", 100, y + 7);
      pdf.text("Season", 120, y + 7);
      pdf.text("Quintal", 140, y + 7);
      pdf.text("Rate", 160, y + 7);
      pdf.text("Value", 182, y + 7);

      y += 5;
      pdf.line(10, y + 5, 200, y + 5);

      pdf.setFont("Signika-Medium");
      pdf.setTextColor(0, 0, 0);
      pdf.text(String(allData.itemname ?? "Sugar"), 12, y + 9);
      pdf.setFont("Signika-Regular");
      pdf.text(String(allData.millshortname ?? ""), 50, y + 9);
      pdf.text(String(allData.HSN ?? ""), 80, y + 9);
      pdf.text(String(allData.grade ?? ""), 100, y + 9);
      pdf.text(String(allData.season ?? ""), 120, y + 9);

      const value = Number(allData.TaxableAmount || 0);
      const rateVal =
        parseFloat(allData.Quantal) > 0 ? (value / parseFloat(allData.Quantal)).toFixed(2) : 0;

      pdf.text(`${Number(allData.Quantal).toFixed(2)} Qntl`, 140, y + 9);
      pdf.text(String(rateVal), 170, y + 9, { align: "right" });
      pdf.text(String(value.toFixed(2)), 197, y + 9, { align: "right" });

      y += 12;

      const wrappedMillName = pdf.splitTextToSize(String(allData.millname ?? "-"), 90);
      pdf.text("Mill Name:", 12, y + 6);
      pdf.text(wrappedMillName, 28, y + 6);

      y += wrappedMillName.length * 5 + 5;

      if (allData.MillFSSAI_No) {
        const wrapped = pdf.splitTextToSize(allData.MillFSSAI_No, 90);
        pdf.text("Mill FSSAI:", 12, y + 6);
        pdf.text(wrapped, 28, y + 6);
        y += wrapped.length * 5 + 5;
      }

      const igstRate = parseFloat(allData.IGSTRate) || 0;
      const igstAmt = parseFloat(allData.IGSTAmount) || 0;
      const cgstRate = parseFloat(allData.CGSTRate) || 0;
      const cgstAmt = parseFloat(allData.CGSTAmount) || 0;
      const sgstRate = parseFloat(allData.SGSTRate) || 0;
      const sgstAmt = parseFloat(allData.SGSTAmount) || 0;

      const taxRows = igstRate > 0
        ? [["IGST", igstRate, igstAmt]]
        : [["CGST", cgstRate, cgstAmt], ["SGST", sgstRate, sgstAmt]];

      const summaryFields = [
        ...(
          (allData.carporateSaleDoc === 0 ||
            allData.carporateSaleDoc === "" ||
            allData.carporateSaleDoc === null) &&
            parseFloat(allData.freight) !== 0
            ? [["Freight", allData.LESS_FRT_RATE, allData.freight]]
            : []
        ),

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
        pdf.text(`${label}:`, 130, y + 3);

        let rateLabel = "";

        // GST rows
        if (label === "IGST" || label === "CGST" || label === "SGST") {
          rateLabel = "%";
        }

        // Other rows (Freight, RateDiff, Other Expense, TCS, etc.)
        else {
          rateLabel = "/Qntl";
        }

        // Print rate only if exists
        if (rate !== null && rate !== undefined && rate !== "") {
          pdf.text(`${formatReadableAmount(rate)}${rateLabel}`, 165, y + 3, { align: "center" });
        }


        pdf.text(formatReadableAmount(amount), 197, y + 3, { align: "right" });
        y += 5;
      });

      pdf.line(10, y + 4, 200, y + 4);

      const totalInWords = ConvertNumberToWord(parseFloat(allData.TCS_Net_Payable));
      pdf.text(`Rs: ${totalInWords}.`, 12, y + 9);

      pdf.setFont("Signika-Bold");
      pdf.setTextColor(41, 122, 14);
      pdf.text("Total Amount:", 150, y + 9);
      pdf.text(`₹ ${formatReadableAmount(allData.TCS_Net_Payable)}`, 197, y + 9, {
        align: "right"
      });

      y += 12;

      pdf.line(10, y + 7, 200, y + 7);

      pdf.setFont("Signika-Bold");
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(8);
      pdf.text("Terms & Conditions:", 12, y + 12);

      const notes = [
        "- If there is no insurance of the goods, after dispatch from destination,",
        "   we are not responsible for non‑delivery, damage or loss.",
        "- Buyer must inspect quality & quantity before dispatch.",
        "- Once loaded & truck leaves godown, responsibility shifts to buyer.",
        "- Full amount via RTGS required before dispatch.",
        "   Interest 24% P.A. will be charged if delay.",
        `- Subject to ${allData.companyCity} jurisdiction.`
      ];

      notes.forEach((n, i) => pdf.text(n, 12, y + 13 + (i + 1) * 3));

      y += 25;

      if (allData.SBNarration) pdf.text(String(allData.SBNarration), 12, y + 12);

      const signY = y;
      pdf.setFont("Signika-Bold");
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(9);

      const forText = `For. ${displayCompanyName}`;
      const tw = pdf.getTextWidth(forText);
      pdf.text(forText, 197 - tw, signY - 12);

      pdf.addImage(signToUse, "PNG", 157, signY - 10, 240, 48);
      pdf.text("Authorised Signatory", 168, signY + 15);

      const footerY = 252;
      const footerHeight = 37;
      pdf.addImage(footerToUse, "PNG", 0, footerY, 210, footerHeight);

      pdf.setFontSize(7);
      pdf.text("Powered by: Sugarian.app", 12, footerY + footerHeight + 3);
    }

    const pdfBlob = pdf.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);

    const first = allBills[0];
    const rate =
      parseFloat(first?.Quantal) && first?.subTotal
        ? (first.subTotal / first.Quantal).toFixed(2)
        : "0";

    setPdfPreview({
      url: pdfUrl,
      data: {
        ...first,
        sale_rate: rate,
        Doc_No: `SB${first?.year}-${first?.doc_no}`,
        CompanyName:
          new Date(first.doc_date) < new Date(CompanyNameUpdatedDate)
            ? newCompanyName
            : first.Company_Name_E
      }
    });
  };

  const gstNo = sessionStorage.getItem("Company_GSTNO") || "";
  const jkGSTs = [
    "27AAECJ8332R1ZV",
    "27AEJPS9860D1Z0",
    "27ARCPS1606H1ZW",
    "27AAMFJ4182A1ZG"
  ];
  const isJK = jkGSTs.includes(gstNo.toUpperCase());
  const label = isJK ? "accounts_sale_bill_2" : "SaleBill";

  return (
    <div id="pdf-content">
      {pdfPreview && (
        <PdfPreview
          pdfData={pdfPreview.url}
          apiData={pdfPreview.data}
          label={label}
        />
      )}

      {/* {!pdfPreview && (
        <div style={{ padding: "20px", fontSize: "14px" }}>
          Loading report…
        </div>
      )} */}
    </div>
  );
};

export default MultipleSBReport;
