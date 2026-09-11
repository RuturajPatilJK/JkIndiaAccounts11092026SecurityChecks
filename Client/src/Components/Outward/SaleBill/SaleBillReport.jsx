import React, { useState, useEffect, useRef } from "react";
import "./invoice.css";
import logo from "../../../Assets/jklogo.png";
import Sign from "../../../Assets/jksign.png";
import jsPDF from "jspdf";
import "jspdf-autotable";
import QRCode from "qrcode";
import PdfPreview from '../../../Common/PDFPreview'
import { ConvertNumberToWord } from "../../../Common/FormatFunctions/ConvertNumberToWord";
import PrintButton from "../../../Common/Buttons/PrintPDF";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";

const API_URL = process.env.REACT_APP_API;

const SaleBillReport = ({ doc_no, disabledFeild }) => {
  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");
  const TCSApplicable = sessionStorage.getItem("TCSApplicable");
  const [invoiceData, setInvoiceData] = useState([]);
  const [pdfPreview, setPdfPreview] = useState(null);

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
    const logoImg = new Image();

    if (allData.einvoiceno || allData.EWay_Bill_No) {
      let qrCodeData = ` GSTN of Supplier: ${allData.companyGSTNo || ""}\n
      GSTIN of Buyer: ${allData.billtogstno || ""}\n
      Document No: ${allData.doc_no || ""}\n
      Document Type: Tax Invoice\n
      Date Of Creation Of Invoice: ${allData.doc_date || ""}\n
      HSN Code: ${allData.HSN || ""}\n
      IRN: ${allData.einvoiceno || ""}\n
      Receipt Number:`;

      try {
        const qrCodeDataUrl = await QRCode.toDataURL(qrCodeData.trim(), {
          width: 300,
          height: 300,
        });
        pdf.addImage(qrCodeDataUrl, "PNG", 170, 0, 30, 30);
      } catch (error) {
        console.error("Error generating QR code:", error);
      }
    }


    logoImg.src = logo;
    logoImg.onload = () => {
      pdf.addImage(logoImg, "PNG", 5, 5, 30, 30);
      pdf.setFontSize(14);
      pdf.text(`${allData.Company_Name_E}`, 40, 10);
      pdf.setFontSize(8);
      pdf.text(`${allData.AL1}`, 40, 15);
      pdf.text(`${allData.AL2}`, 40, 20);
      pdf.text(`${allData.AL3}`, 40, 25);
      pdf.text(`${allData.AL4}`, 40, 30);
      pdf.text(`${allData.Other}`, 40, 35);

      pdf.setFontSize(12);
      pdf.setLineWidth(0.3);
      pdf.line(10, 38, 200, 38);

      pdf.setFontSize(12);
      pdf.text("TAX INVOICE", 90, 43);

      pdf.setFontSize(12);
      pdf.setLineWidth(0.3);
      pdf.line(10, 45, 200, 45);


      const totalAmount = parseFloat(allData.TCS_Net_Payable);
      const totalAmountWords = ConvertNumberToWord(totalAmount);

      const isRegular =
        allData.carporateSaleDoc !== 0 &&
        allData.carporateSaleDoc !== "" &&
        allData.selling_type === "P" &&
        allData.Delivery_type === "C";

      const truncateText = (text, maxLength = 50) => {
        if (typeof text !== 'string') return text;

        const words = text.split(/(\s+)/);
        let currentLine = '';
        let lines = [];

        words.forEach((word) => {
          if (currentLine.length + word.length <= maxLength) {
            currentLine += word;
          } else {
            if (currentLine.trim()) lines.push(currentLine.trim());
            currentLine = word;
          }
        });

        if (currentLine.trim()) lines.push(currentLine.trim());
        return lines.join('\n');
      };

      const tableData = [
        ["Reverse Charge", "No"],
        ["Invoice No:", `SB${allData.year}-${allData.doc_no}`],
        ["Invoice Date:", allData.doc_dateConverted],
        ["DO No:", allData.DO_No],
        ["State:", truncateText(allData.companyStateName)],
        ["State Code:", allData.companyGSTStateCode],
        ["Buyer,"],
        [truncateText(isRegular ? allData.billtoname : allData.CarporateBillTo_Name || allData.billtoname)],
        [truncateText(isRegular
          ? `${allData.billtoaddress}, ${allData.billtocitystate} ${allData.billtopincode}`
          : `${allData.Carporate_Address}, ${allData.carporateBillToStateName}, ${allData.carporateBillToPincode}` ||
          `${allData.billtoaddress}, ${allData.billtocitystate} ${allData.billtopincode}`
        )],
        ["Bill To:", truncateText(isRegular ? allData.billtomobileto : allData.carporateBillToMobileNo || allData.billtomobileto)],
        ["City:", truncateText(isRegular ? allData.billtopin : allData.carporateBillToCityName || allData.billtopin)],
        ["State:", truncateText(isRegular ? allData.billtocitystate : allData.carporateBillToStateName || allData.billtocitystate)],
        ["Gst NO:", truncateText(isRegular ? allData.billtogstno : allData.CarporateBillToGst_No || allData.billtogstno)],
        ["State Code:", isRegular ? allData.billtogststatecode : allData.CarporateState_Code || allData.billtogststatecode],
        ["PAN No:", truncateText(isRegular ? allData.billtopanno : allData.Carporate_Pan || allData.billtopanno)],
        ["FSSAI No:", truncateText(isRegular ? allData.FSSAI_BillTo : allData.carporateBillToFSSAI || allData.FSSAI_BillTo)],
        ["TAN No:", truncateText(isRegular ? allData.BillToTanNo : allData.Carporate_Tanno || allData.BillToTanNo)],
      ];

      const buyerData = [
        ["Our GST No:", truncateText(allData.companyGSTNo)],
        ["Transport Mode:", "Road"],
        ["Date Of Supply:", allData.doc_dateConverted],
        ["Place Of Supply:", truncateText(allData.shiptocityname)],
        ["State:", truncateText(allData.shiptocitystate)],
        ["Consigned To,"],
        [truncateText(`${allData.shiptoname}`)],
        [truncateText(`${allData.shiptoaddress}, ${allData.shiptocitystate} ${allData.shiptocitypincode}`)],
        ["Ship To,", truncateText(allData.shiptomobileno)],
        ["City:", truncateText(allData.shiptocityname)],
        ["State:", truncateText(allData.shiptocitystate)],
        ["Gst NO:", truncateText(allData.shiptogstno)],
        ["State Code:", allData.shiptogststatecode],
        ["PAN No:", truncateText(allData.shiptopanno)],
        ["FSSAI No:", truncateText(allData.FSSAI_ShipTo)],
        ["TAN No:", truncateText(allData.ShipToTanNo)],
      ];

      if (tableData && tableData.length > 0) {
        pdf.autoTable({
          startY: 45,
          margin: { left: 10, right: pdf.internal.pageSize.width / 2 + 10 },
          body: tableData,
          theme: "plain",
          styles: {
            cellPadding: 0.5,
            fontSize: 8,
            halign: "left",
            valign: "middle",
            overflow: 'visible', 
            whiteSpace: 'nowrap'
          },
          columnStyles: {
            1: { fontStyle: 'bold', cellWidth: -250 },
          },
          didDrawCell: function (data) {
            if (data.row.index === 3) {
              pdf.setLineWidth(0.3);
              pdf.setDrawColor(0);
              const startX = 10;
              const endX = pdf.internal.pageSize.width / 2;
              const y = data.cell.y + data.cell.height + 7.9;
              pdf.line(startX, y, endX, y);
            }
          }
        });
      }
      pdf.setLineWidth(0.3);
      pdf.line(pdf.internal.pageSize.width / 2, 45, pdf.internal.pageSize.width / 2, 128);

      if (buyerData && buyerData.length > 0) {
        pdf.autoTable({
          startY: 48,
          margin: { left: pdf.internal.pageSize.width / 2 + 4 },
          body: buyerData,
          theme: "plain",
          styles: {
            cellPadding: 0.6,
            fontSize: 8,
            halign: "left",
            valign: "middle",
            overflow: 'visible',
            whiteSpace: 'nowrap'
          },
          columnStyles: {
            1: { fontStyle: 'bold' },
          },
          didDrawCell: function (data) {
            if (data.row.index === 3) {
              pdf.setLineWidth(0.3);
              pdf.setDrawColor(0);
              const startX = pdf.internal.pageSize.width / 2;
              const endX = pdf.internal.pageSize.width - 10;
              const y = data.cell.y + data.cell.height + 4;
              pdf.line(startX, y, endX, y);
            }
          }
        });
      }

      pdf.setFontSize(8);
      pdf.setLineWidth(0.3);
      pdf.line(10, 128, 200, 128);

      pdf.text(`Mill Name : ${allData.millshortname}`, 10, 135);
      pdf.text(`Driver No : ${allData.driver_no}`, 130, 135);

      pdf.text(`FSSAI No : ${allData.MillFSSAI_No}`, 10, 139);

      pdf.text(`Ref By : ${allData.shiptoshortname}`, 10, 142);
      pdf.text(`Season : ${allData.season}`, 80, 142);

      pdf.text(`Dispatched From : ${allData.millshortname}`, 10, 146);
      pdf.text(`Lorry No : ${allData.LORRYNO}`, 80, 146);
      pdf.text(`To : ${allData.shiptocityname}`, 130, 146);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);

      const value = allData.TaxableAmount - (allData.carporateSaleDoc ? 0 : allData.LESS_FRT_RATE || 0);
      const saleRate = allData.Quantal ? (value / allData.Quantal).toFixed(2) : 0;

      const particulars = [
        [
          "Particulars",
          "Brand Name",
          "HSN/ACS",
          "Quintal",
          "Packing (kg)",
          "Bags",
          "Rate",
          "Value"
        ],
        [
          allData.itemname,
          allData.Brand_Name,
          allData.HSN,
          allData.Quantal,
          allData.packing,
          allData.bags,
          formatReadableAmount(saleRate) || 0,
          formatReadableAmount(value)
        ],
      ];

      pdf.autoTable({
        startY: pdf.lastAutoTable.finalY + 30,
        head: [particulars[0]],
        body: particulars.slice(1),
        styles: {
          cellPadding: 1,
          fontSize: 8,
          valign: "middle",
          halign: "right",
          overflow: "linebreak"
        },
        headStyles: {
          fillColor: false,
          textColor: 'black',
          halign: "center",
        },
        bodyStyles: {
          halign: "right",
        },
        tableWidth: "auto",
        pageBreak: "auto",
        didDrawCell: function (data) {
          pdf.setLineDash([2, 2]);
          pdf.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height);
          pdf.setLineDash([]);
        }
      });

      const eInvoiceData = [
        [
          "Sale Rate:",
          allData.Delivery_type === "C" ?
            `${allData.DOSalerate} + ${allData.Tender_Commission} Commission` :
            allData.Delivery_type === "N" ?
              `${allData.DOSalerate} F.O.R. with GST` :
              allData.Delivery_type === "A" ?
                `${allData.DOSalerate} F.O.R. without GST` :
                `${allData.DOSalerate}`
        ],

        ["Grade:", allData.grade],
        ...((allData.carporateSaleDoc !== 0 && allData.carporateSaleDoc !== "" && allData.carporateSaleDoc != null) ? [["ASN/GRN:", allData.ASN_No]] : []),
        ["Eway Bill No:", allData.EWay_Bill_No],
        ["EwayBill ValidDate:", allData.EwayBillValidDate],
        ["eInvoiceNo:", allData.einvoiceno],
        ["Ack:", allData.ackno],
        ...((allData.carporateSaleDoc !== 0 && allData.carporateSaleDoc !== "" && allData.carporateSaleDoc !== null && allData.carporateSaleDoc !== undefined) ? [["Podetail:", allData.pono]] : []),

      ];

      pdf.autoTable({
        startY: pdf.lastAutoTable.finalY + 8,
        margin: { left: 10, right: pdf.internal.pageSize.width / 2 },
        body: eInvoiceData,
        theme: "plain",
        styles: {
          cellPadding: 0.5,
          fontSize: 8,
          halign: "left",
          valign: "middle",
          whiteSpace: "nowrap",
        },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { fontStyle: 'bold' },
        }
      });

      pdf.setLineWidth(0.3);

      const summaryData = [
        // ...((allData.carporateSaleDoc === 0 || allData.carporateSaleDoc === "" || allData.carporateSaleDoc === null) ? [["Freight:", allData.LESS_FRT_RATE, allData.freight]] : []),
        ["Taxable Amount:", "", formatReadableAmount(value)],
        ["CGST:", allData.CGSTRate, formatReadableAmount(allData.CGSTAmount)],
        ["SGST:", allData.SGSTRate, formatReadableAmount(allData.SGSTAmount)],
        ["IGST:", allData.IGSTRate, formatReadableAmount(allData.IGSTAmount)],
        ["Rate Diff:/Qntl:", "", allData.RateDiff],
        ["Other Expense:", "", allData.OTHER_AMT],
        ["Round Off:", "", allData.RoundOff],
        ["Total Amount:", "", formatReadableAmount(allData.TCS_Net_Payable)],
        ...(TCSApplicable === 'N'
          ? [
            // ["TDS:", allData.TDS_Rate, formatReadableAmount(allData.TDS_Amt)]
          ]
          : [
            ["TCS:", allData.TCS_Rate, formatReadableAmount(allData.TCS_Amt)],
            ["TCS Net Payable:", "", formatReadableAmount(allData.TCS_Net_Payable)]
          ]),
      ];

      pdf.autoTable({
        startY: 168,
        margin: { left: pdf.internal.pageSize.width / 2 },
        body: summaryData,
        theme: "plain",
        styles: {
          cellPadding: 1,
          fontSize: 8,
          halign: "left",
          valign: "middle",
        },
        columnStyles: {
          2: { halign: "right", fontStyle: 'bold' },
        }
      });

      pdf.setFontSize(8);
      const lineY = pdf.lastAutoTable.finalY + 10;
      pdf.line(10, lineY - 4, 200, lineY - 4);
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "bold");
      pdf.text(`Bank Details:${allData.bankdetail}`, 10, lineY - 1);
      pdf.setLineWidth(0.3);
      pdf.line(10, lineY + 3, 200, lineY + 3);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");

      pdf.text(`${totalAmountWords}.`, 12, lineY + 7);

      pdf.line(10, lineY + 9, 200, lineY + 9);

      pdf.setFontSize(8);
      pdf.text(`Our Tan No: ${allData.companyTIN}`, 10, pdf.lastAutoTable.finalY + 24);
      pdf.text(`FSSAI No: ${allData.companyFSSAI}`, 60, pdf.lastAutoTable.finalY + 24);
      pdf.text(`PAN No:  ${allData.companyPan}`, 110, pdf.lastAutoTable.finalY + 24);

      const signImg = new Image();
      signImg.src = Sign;
      signImg.onload = () => {
        pdf.setFontSize(8);
        pdf.setTextColor(255, 0, 0);
        pdf.text("Note:", 6, pdf.lastAutoTable.finalY + 28);
        pdf.setTextColor(0, 0, 0);
        pdf.text(
          "- After Dispatch of the goods we are not responsible for non delivery or any kind of damage.",
          6,
          pdf.lastAutoTable.finalY + 32
        );
        pdf.text(
          "- Certified that the particulars given above are true and correct.",
          6,
          pdf.lastAutoTable.finalY + 36
        );
        pdf.text(
          "- Please credit the amount in our account and send the amount by RTGS immediately.",
          6,
          pdf.lastAutoTable.finalY + 40
        );
        pdf.text(
          "- If the amount is not sent before the due date payment Interest 24% will be charged.",
          6,
          pdf.lastAutoTable.finalY + 44
        );
        pdf.text(
          "- I/We hereby certify that food/foods mentioned in this invoice is/are warranted to be of ",
          6,
          pdf.lastAutoTable.finalY + 48
        );
        pdf.text(
          "- the nature and quality which it/these purports/purported to be",
          6,
          pdf.lastAutoTable.finalY + 52
        );
        pdf.text(
          `${allData.SBNarration}`,
          8,
          pdf.lastAutoTable.finalY + 58
        );
        pdf.addImage(signImg, "PNG", 160, pdf.lastAutoTable.finalY + 25, 30, 20);
        pdf.text(
          `For, ${allData.Company_Name_E}`,
          145,
          pdf.lastAutoTable.finalY + 50
        );
        pdf.text("Authorised Signatory", 160, pdf.lastAutoTable.finalY + 55);
        const pdfBlob = pdf.output("blob");
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPdfPreview(pdfUrl);
      };
    };
  };

  return (
    <div id="pdf-content">
      {pdfPreview && <PdfPreview pdfData={pdfPreview} apiData={invoiceData[0]} label={"accounts_sale_bill_2"} />}
      <PrintButton disabledFeild={disabledFeild} fetchData={fetchData} />
    </div>
  );
};
export default SaleBillReport;