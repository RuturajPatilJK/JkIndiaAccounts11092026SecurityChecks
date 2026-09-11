import React, { useState } from "react";
import logo from "../../../Assets/jklogo.png";
import jsPDF from "jspdf";
import "jspdf-autotable";
import PdfPreview from '../../../Common/PDFPreview'
import PrintButton from "../../../Common/Buttons/PrintPDF";
import { ConvertNumberToWord } from "../../../Common/FormatFunctions/ConvertNumberToWord";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";

const API_URL = process.env.REACT_APP_API;


const ShetkariPurchaseReport = ({ doc_no, Tran_Type, disabledFeild }) => {
    const companyCode = sessionStorage.getItem("Company_Code");
    const Year_Code = sessionStorage.getItem("Year_Code");
    const [invoiceData, setInvoiceData] = useState([]);
    const [pdfPreview, setPdfPreview] = useState(null);

    const fetchData = async () => {
        try {
            const response = await fetch(
                `${API_URL}/generating_ShetkariPurchase_report?Company_Code=${companyCode}&Year_Code=${Year_Code}&doc_no=${doc_no}&TranType=${Tran_Type}`
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
        const other = ""; // define Other field

        logoImg.src = logo;
        logoImg.onload = () => {
            // === Header ===
            pdf.addImage(logoImg, "PNG", 5, 5, 30, 30);
            pdf.setFontSize(14);
            pdf.text(`${allData.Company_Name_E || ""}`, 40, 10);
            pdf.setFontSize(8);
            pdf.setFont("helvetica", "bold");
            pdf.text(`${allData.AL1 || ""}`, 40, 15);
            pdf.text(`${allData.AL2 || ""}`, 40, 20);
            pdf.text(`${allData.AL3 || ""}`, 40, 25);
            pdf.text(`${allData.AL4 || ""}`, 40, 30);
            pdf.text(`${allData.Other || ""}`, 40, 35);

            pdf.setFontSize(12);
            pdf.setLineWidth(0.3);
            pdf.line(10, 38, 200, 38);

            pdf.setFontSize(10);
            pdf.text("Shetkari Purchase", 90, 43);
            pdf.line(10, 45, 200, 45);

            // === Prepare Table Data ===
            const tableData = [
                ["Party Name", allData.PartyName || ""],
                ["Address", allData.Address_E || ""],
                ["Adhar No", allData.adhar_no || ""],
                ["Bill No", allData.Doc_No || ""],
            ];

            const buyerData = [
                ["Date Of Supply", allData.doc_dateConverted || ""],
                ["PAN No", allData.CompanyPan || ""],
                ["Lorry No", allData.LR_No || ""],
            ];

            const buyerData1 = [
                ["Katta Date", allData.doc_dateConverted || ""],
                ["Item Name", allData.itemname || ""],
            ];

            // === LEFT TABLE ===
            pdf.autoTable({
                startY: 48,
                margin: { left: 10 },
                body: tableData,
                theme: "plain",
                styles: { cellPadding: 1, fontSize: 8, halign: "left", valign: "middle", overflow: "linebreak" },
                columnStyles: { 0: { cellWidth: 25, fontStyle: "bold" }, 1: { cellWidth: 65 } },
            });
            const leftEndY = pdf.lastAutoTable.finalY;

            // === RIGHT TABLE 1 ===
            pdf.autoTable({
                startY: 48,
                margin: { left: pdf.internal.pageSize.width / 2 + 5 },
                body: buyerData,
                theme: "plain",
                styles: { cellPadding: 1, fontSize: 8, halign: "left", valign: "middle", overflow: "linebreak" },
                columnStyles: { 0: { cellWidth: 30, fontStyle: "bold" }, 1: { cellWidth: 50 } },
            });
            const rightEndY = pdf.lastAutoTable.finalY;

            // === RIGHT TABLE 2 ===
            pdf.autoTable({
                startY: rightEndY + 2,
                margin: { left: pdf.internal.pageSize.width / 2 + 5 },
                body: buyerData1,
                theme: "plain",
                styles: { cellPadding: 1, fontSize: 8, halign: "left", valign: "middle", overflow: "linebreak" },
                columnStyles: { 0: { cellWidth: 30, fontStyle: "bold" }, 1: { cellWidth: 50 } },
            });
            const bottomY = Math.max(pdf.lastAutoTable?.finalY || 0, leftEndY || 0);
pdf.setLineWidth(0.2);
pdf.line(10, bottomY, 200, bottomY); // top border of summary box

// === layout constants ===
const leftX = 10;
const labelEndX = 40;           // left label/value divider
const middleX = 80;             // divider between left & right columns
const rightLabelEnd = 130;      // right label/value divider
const pageRight = 200;          // page right border

const leftLabelX = leftX + 5;
const leftValueX = labelEndX + 5;
const rightLabelX = middleX + 5;
const rightValueX = rightLabelEnd + 5;

// === data ===
const leftData = [
  ["Weight", allData.Qty || ""],
  ["Kadta", allData.Kadta || ""],
  ["Water", allData.Water || ""],
  ["Other", other || ""],
  ["Net Weight", allData.Wt_Qty || ""],
];

const rightData = [
  ["Account Number", allData.bankdetail || ""],
  ["Bank IFSC Code", allData.IFSC_Code || ""],
  ["Mobile No", allData.Mobile_No || ""],
  ["Rate", allData.Rate || ""],
  ["Amount", allData.Amount || ""],
  ["Hamali", allData.Hamali || ""],
  ["Advance", allData.Advance || ""],
  ["RTGS/NEFT", allData.RTGS_NEFT || ""],
];

// === style and setup ===
pdf.setFontSize(8);
pdf.setFont("helvetica", "normal");
pdf.setLineWidth(0.1);

const rowHeight = 8;
let y = bottomY;
const startY = y;
const maxRows = Math.max(leftData.length, rightData.length);

for (let i = 0; i < maxRows; i++) {
  const leftLabel = leftData[i]?.[0] || "";
  const leftValue = leftData[i]?.[1]?.toString().trim() || "";
  const rightLabel = rightData[i]?.[0] || "";
  const rightValue = rightData[i]?.[1]?.toString().trim() || "";

  // skip completely empty rows
  if (!leftLabel && !leftValue && !rightLabel && !rightValue) continue;

  const textY = y + rowHeight / 2 + 2.5;

  // === print text ===
  if (leftLabel || leftValue) {
    pdf.text(leftLabel, leftLabelX, textY);
    pdf.text(leftValue, labelEndX + 5, textY);
  }
  if (rightLabel || rightValue) {
    pdf.text(rightLabel, rightLabelX, textY);
    pdf.text(rightValue, rightLabelEnd + 5, textY);
  }

  // === draw line conditions ===
  if (leftLabel || leftValue) {
    // full-width line if left side has data
    pdf.line(leftX, y + rowHeight, pageRight, y + rowHeight);
  } else if (rightLabel || rightValue) {
    // only right side line if left side blank
    pdf.line(middleX, y + rowHeight, pageRight, y + rowHeight);
  }

  y += rowHeight;
}

// === vertical borders ===
pdf.setLineWidth(0.2);
pdf.line(leftX, startY, leftX, y);                 // left border
pdf.line(labelEndX, startY, labelEndX, y);         // left divider
pdf.line(middleX, startY, middleX, y);             // center divider
pdf.line(rightLabelEnd, startY, rightLabelEnd, y); // right divider
pdf.line(pageRight, startY, pageRight, y);         // right border

// === bottom border ===
pdf.line(leftX, y, pageRight, y);


// === Total Section ===
            const totalAmount = parseFloat(allData.Amount || 0);
            const totalAmountWords = ConvertNumberToWord(totalAmount);
            // yPos += 7;
            pdf.setFont("helvetica", "bold");
            // pdf.text(`Total: ${formatReadableAmount(allData.Amount)}`, 10, yPos);

            // yPos += 5;
            pdf.setFont("helvetica", "normal");
            //pdf.text(`Amount in Words: ${totalAmountWords}`, 10, yPos);

            // === Render Preview ===
            const pdfData = pdf.output("datauristring");
            setPdfPreview(pdfData);
        };
    };

    return (
        <div id="pdf-content">
            {pdfPreview && <PdfPreview pdfData={pdfPreview} apiData={invoiceData[0]} label={"ShetkariPurchase"} />}
            <PrintButton disabledFeild={disabledFeild} fetchData={fetchData} />
        </div>
    );
};

export default ShetkariPurchaseReport;