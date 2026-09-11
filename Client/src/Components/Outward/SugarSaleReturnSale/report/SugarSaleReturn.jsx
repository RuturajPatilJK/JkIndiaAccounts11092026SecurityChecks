import React, { useState, useEffect, useRef } from "react";
import "./../../../Outward/SaleBill/invoice.css";
import logo from "../../../../Assets/jklogo.png";
import Sign from "../../../../Assets/jksign.png";
import jsPDF from "jspdf";
import "jspdf-autotable";
import QRCode from "qrcode";
import PdfPreview from '../../../../Common/PDFPreview'
import { ConvertNumberToWord } from "../../../../Common/FormatFunctions/ConvertNumberToWord";
import PrintButton from "../../../../Common/Buttons/PrintPDF";

const API_URL = process.env.REACT_APP_API;

const ReturnSaleReport = ({ doc_no, disabledFeild }) => {
  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");
  const [invoiceData, setInvoiceData] = useState([]);
  const [pdfPreview, setPdfPreview] = useState(null);

  const fetchData = async () => {
    try {
      const response = await fetch(
        `${API_URL}/generating_return_sale_report?Company_Code=${companyCode}&Year_Code=${Year_Code}&doc_no=${doc_no}`
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
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.error("No data available to generate PDF");
      return;
    }
  
    const pdf = new jsPDF({ orientation: "portrait" });
    const allData = data[0] || {};
    const safe = (val) => val || "-";
  
    const logoImg = new Image();
  
    let qrCodeData = `
      GSTN of Supplier: ${safe(allData.GST)}
      GSTIN of Buyer: ${safe(allData.billtogstno)}
      Document No: RS${safe(allData.year)}-${safe(allData.doc_no)}
      Document Type: Tax Invoice
      Date Of Creation Of Invoice: ${safe(allData.doc_dateConverted)}
      HSN Code: ${safe(allData.HSN)}
      IRN: ${safe(allData.einvoiceno)}
      Receipt Number:
    `;
  
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeData.trim(), { width: 300, height: 300 });
    pdf.addImage(qrCodeDataUrl, "PNG", 170, 0, 30, 30);
  
    logoImg.src = logo;
    logoImg.onload = () => {
      pdf.addImage(logoImg, "PNG", 5, 5, 30, 30);
      pdf.setFontSize(14);
      pdf.text(safe(allData.Company_Name_E), 40, 10);
      pdf.setFontSize(8);
      pdf.text(safe(allData.AL1), 40, 15);
      pdf.text(safe(allData.AL2), 40, 20);
      pdf.text(safe(allData.AL3), 40, 25);
      pdf.text(safe(allData.AL4), 40, 30);
      pdf.text(safe(allData.Other), 40, 35);
  
      pdf.setFontSize(12);
      pdf.setLineWidth(0.3);
      pdf.line(10, 38, 200, 38);
  
      pdf.text("TAX INVOICE", 90, 43);
      pdf.line(10, 45, 200, 45);
  
      const totalAmount = parseFloat(safe(allData.TCS_Net_Payable));
      const totalAmountWords = ConvertNumberToWord(totalAmount);
  
      const tableData = [
        ["Reverse Charge", "No"],
        ["Invoice No:", `RS${safe(allData.year)}-${safe(allData.doc_no)}`],
        ["Invoice Date:", safe(allData.doc_dateConverted)],
        ["State:", safe(allData.companyStateName)],
        ["State Code:", safe(allData.companyGSTStateCode)],
        ["Buyer,"],
        [safe(allData.FromAcName)],
        // [`${safe(allData.billaddress)}, ${safe(allData.billtostatename)}`],
        ["Bill To:"],
        ["City:", safe(allData.billtocityname)],
        ["State:", safe(allData.BillToState)],
        ["Gst No:", safe(allData.billtogstno)],
        ["State", safe(allData.billtostatename)],
        ["FSSAI No", safe(allData.BillToFSSAI)],
        ["TAN No:", safe(allData.BillToTAN)],
      ];
  
      const buyerData = [
        ["Our GST No:", safe(allData.GST)],
        ["Transport Mode:", "Road"],
        ["Date Of Supply:", safe(allData.doc_dateConverted)],
        ["Place Of Supply:", safe(allData.ShipToCity)],
        ["Consigned To,"],
        [safe(allData.unitname)],
        [safe(allData.ShipToAddress)],
        ["Ship To,"],
        ["City:", safe(allData.ShipToCity)],
        // ["State:", safe(allData.UnitState)],
        ["Gst No:", safe(allData.Gst_No)],
        ["State Code:", safe(allData.ShipToGSTStateCode)],
        ["FSSAI No", safe(allData.ShipToFSSAI)],
        ["TAN No:", safe(allData.ShipToTAN)],
      ];
  
      if (tableData && tableData.length > 0) {
        pdf.autoTable({
          startY: 45,
          margin: { left: 10, right: pdf.internal.pageSize.width / 2 + 10 },
          body: tableData,
          theme: "plain",
          styles: { cellPadding: 0.5, fontSize: 8 },
          columnStyles: { 1: { fontStyle: 'bold', cellWidth: -250 } },
          didDrawCell: function (data) {
            if (data.row.index === 3) {
              pdf.setLineWidth(0.3);
              pdf.setDrawColor(0);
              const startX = 10;
              const endX = pdf.internal.pageSize.width / 2;
              const y = data.cell.y + data.cell.height + 4;
              pdf.line(startX, y, endX, y);
            }
          }
        });
      }
      pdf.setLineWidth(0.3);
      pdf.line(pdf.internal.pageSize.width / 2, 45, pdf.internal.pageSize.width / 2, 125);
  
      if (buyerData && buyerData.length > 0) {
        pdf.autoTable({
          startY: 48,
          margin: { left: pdf.internal.pageSize.width / 2 + 10, right: 10 },
          body: buyerData,
          theme: "plain",
          styles: { cellPadding: 0.6, fontSize: 8 },
          columnStyles: { 1: { fontStyle: 'bold' } },
          didDrawCell: function (data) {
            if (data.row.index === 3) {
              pdf.setLineWidth(0.3);
              pdf.setDrawColor(0);
              const startX = pdf.internal.pageSize.width / 2;
              const endX = pdf.internal.pageSize.width - 10;
              const y = data.cell.y + data.cell.height;
              pdf.line(startX, y, endX, y);
            }
          }
        });
      }
  
      pdf.line(10, 125, 200, 125);
      pdf.setFontSize(8);
  
      pdf.text(`Mill Name : ${safe(allData.millshortname)}`, 10, 135);
      pdf.text(`Mill Name : ${safe(allData.MillFSSAI)}`, 10, 135);
      pdf.text(`Dispatched From : ${safe(allData.FROM_STATION)}`, 10, 140);
      pdf.text(`Lorry No : ${safe(allData.LORRYNO)}`, 80, 140);
  
      const particulars = [
        ["Particulars", "Narration", "HSN/ACS", "Quintal", "Packing (kg)", "Bags", "Rate", "Value"],
        [safe(allData.itemname), safe(allData.narration), safe(allData.HSN), safe(allData.Quantal), safe(allData.packing), safe(allData.bags), safe(allData.rate), safe(allData.item_Amount)],
      ];
  
      pdf.autoTable({
        startY: pdf.lastAutoTable.finalY + 25,
        head: [particulars[0]],
        body: particulars.slice(1),
        styles: { cellPadding: 1, fontSize: 8, valign: "middle", halign: "right", overflow: "linebreak" },
        headStyles: { fillColor: false, textColor: 'black', halign: "center" },
        bodyStyles: { halign: "right" },
        tableWidth: "auto",
        pageBreak: "auto",
        didDrawCell: function (data) {
          pdf.setLineDash([2, 2]);
          pdf.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height);
          pdf.setLineDash([]);
        }
      });
  
      const eInvoiceData = [
        ["EwayBill:",safe(allData.Eway_Bill_No)],
        ["eInvoiceNo:", safe(allData.einvoiceno)],
        ["Ack:", safe(allData.ackno)],
        ["ASN No:",safe(allData.ASN_No)],
        ["PO Details:", safe(allData.PO_Details)]
      ];
  
      pdf.autoTable({
        startY: pdf.lastAutoTable.finalY + 15,
        margin: { left: 10, right: pdf.internal.pageSize.width / 2 },
        body: eInvoiceData,
        theme: "plain",
        styles: { cellPadding: 0.5, fontSize: 8, halign: "left", valign: "middle", whiteSpace: "nowrap" },
        columnStyles: { 0: { cellWidth: 'auto' }, 1: { fontStyle: 'bold' } }
      });
  
      const summaryData = [
        ["SubTotal:", "", safe(allData.item_Amount)],
        ["CGST:", safe(allData.CGSTRate), safe(allData.CGSTAmount)],
        ["SGST:", safe(allData.SGSTRate), safe(allData.SGSTAmount)],
        ["IGST:", safe(allData.IGSTRate), safe(allData.IGSTAmount)],
        ["Vat","0%",""],
        ["Freight:", "", safe(allData.freight)],
        ["Bank Commission", "", safe(allData.bank_commission)],
        ["Other Expense:", "", safe(allData.OTHER_AMT)],
        ["Cash Advance:", "", safe(allData.cash_advance)],
        ["Total Amount:", "", safe(allData.Bill_Amount)],
        ["TCS:", safe(allData.TCS_Rate), safe(allData.TCS_Amt)],
        ["TDS:", safe(allData.TDS_Rate), safe(allData.TDS_Amt)],
        ["TCS Net Payable:", "", safe(allData.TCS_Net_Payable)],
      ];
  
      pdf.autoTable({
        startY: 165,
        margin: { left: pdf.internal.pageSize.width / 2 },
        body: summaryData,
        theme: "plain",
        styles: { cellPadding: 1, fontSize: 8, halign: "left", valign: "middle" },
        columnStyles: { 2: { halign: "right", fontStyle: 'bold' } }
      });
  
      pdf.line(10, pdf.lastAutoTable.finalY + 6, 200, pdf.lastAutoTable.finalY + 6);
      pdf.setFont("helvetica", "bold");
      pdf.text(`Bank Details: ${safe(allData.bankdetail)}`, 10, pdf.lastAutoTable.finalY + 10);
      pdf.line(10, pdf.lastAutoTable.finalY + 14, 200, pdf.lastAutoTable.finalY + 14);
      pdf.text(`${totalAmountWords}.`, 12, pdf.lastAutoTable.finalY + 18);
      pdf.line(10, pdf.lastAutoTable.finalY + 20, 200, pdf.lastAutoTable.finalY + 20);
  
      pdf.setFontSize(8);
      pdf.text(`Our Tan No: ${safe(allData.companyTIN)}`, 10, pdf.lastAutoTable.finalY + 24);
      pdf.text(`FSSAI No: ${safe(allData.companyFSSAI)}`, 60, pdf.lastAutoTable.finalY + 24);
      pdf.text(`PAN No: ${safe(allData.companyPan)}`, 110, pdf.lastAutoTable.finalY + 24);
  
      const signImg = new Image();
      signImg.src = Sign;
      
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7);
        pdf.setTextColor(255, 0, 0);
        pdf.text("Note:", 6, pdf.lastAutoTable.finalY + 28);
        pdf.setTextColor(0, 0, 0);
        pdf.text("- After Dispatch of the goods we are not responsible for non delivery or any kind of damage.", 6, pdf.lastAutoTable.finalY + 32);
        pdf.text("- Certified that the particulars given above are true and correct.", 6, pdf.lastAutoTable.finalY + 36);
        pdf.text("- Please credit the amount in our account and send the amount by RTGS immediately.", 6, pdf.lastAutoTable.finalY + 40);
        pdf.text("- If the amount is not sent before the due date payment Interest 24% will be charged.", 6, pdf.lastAutoTable.finalY + 44);
        pdf.text("- I/We hereby certify that food/foods mentioned in this invoice is/are warranted to be of ", 6, pdf.lastAutoTable.finalY + 48);
        pdf.text("- the nature and quality which it/these purports/purported to be", 6, pdf.lastAutoTable.finalY + 52);
        pdf.addImage(signImg, "PNG", 160, pdf.lastAutoTable.finalY + 25, 30, 20);
        pdf.text(`For, ${safe(allData.Company_Name_E)}`, 145, pdf.lastAutoTable.finalY + 50);
        pdf.text("Authorised Signatory", 160, pdf.lastAutoTable.finalY + 55);
  
        const pdfBlob = pdf.output("blob");
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPdfPreview(pdfUrl);
    };
  };
  
  return (
    <div id="pdf-content">
      {pdfPreview && <PdfPreview pdfData={pdfPreview} apiData={invoiceData[0]} label={"SaleBill"} />}
      <PrintButton disabledFeild={disabledFeild} fetchData={fetchData} />
    </div>
  );
};
export default ReturnSaleReport;