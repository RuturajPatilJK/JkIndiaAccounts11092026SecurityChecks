// import React, { useState } from "react";
// import logo from "../../../Assets/jklogo.png";
// import jsPDF from "jspdf";
// import "jspdf-autotable";
// import PdfPreview from '../../../Common/PDFPreview'
// import PrintButton from "../../../Common/Buttons/PrintPDF";
// import { ConvertNumberToWord } from "../../../Common/FormatFunctions/ConvertNumberToWord";
// import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";

// const API_URL = process.env.REACT_APP_API;

// const RecieptPaymentReport = ({ doc_no, Tran_Type, disabledFeild }) => {
//     const companyCode = sessionStorage.getItem("Company_Code");
//     const Year_Code = sessionStorage.getItem("Year_Code");
//     const [invoiceData, setInvoiceData] = useState([]);
//     const [pdfPreview, setPdfPreview] = useState(null);

//     const fetchData = async () => {
//         try {
//             const response = await fetch(
//                 `${API_URL}/generating_RecieptPaymrnt_report?Company_Code=${companyCode}&Year_Code=${Year_Code}&doc_no=${doc_no}&TranType=${Tran_Type}`
//             );
//             if (!response.ok) {
//                 throw new Error("Network response was not ok");
//             }
//             const data = await response.json();

//             setInvoiceData(data.all_data);
//             generatePdf(data.all_data);
//         } catch (error) {
//             console.error("Error fetching data:", error);
//         }
//     };

//     const generatePdf = async (data) => {
//         const pdf = new jsPDF({ orientation: "portrait" });
//         const allData = data?.[0] || {};
//         const logoImg = new Image();

//         logoImg.src = logo;
//         logoImg.onload = () => {
//             pdf.addImage(logoImg, "PNG", 5, 5, 30, 30);
//             pdf.setFontSize(14);
//             pdf.text(`${allData.Company_Name_E}`, 40, 10);
//             pdf.setFontSize(8);
//             pdf.setFont("helvetica", "bold");
//             pdf.text(`${allData.AL1}`, 40, 15);
//             pdf.text(`${allData.AL2}`, 40, 20);
//             pdf.text(`${allData.AL3}`, 40, 25);
//             pdf.text(`${allData.AL4}`, 40, 30);
//             pdf.text(`${allData.Other}`, 40, 35);

//             pdf.setFontSize(12);
//             pdf.setLineWidth(0.3);
//             pdf.line(10, 38, 200, 38);

//             pdf.setFontSize(10);
//             pdf.text("Receipt Payment", 90, 43);

//             pdf.setFontSize(12);
//             pdf.setLineWidth(0.3);
//             pdf.line(10, 45, 200, 45);

//             const totalAmount = parseFloat(allData.total);
//             const totalAmountWords = ConvertNumberToWord(totalAmount);

//             const tableData = [
//                 ["Bill No:", `${allData.doc_no}`],
//                 ["Reciept Date:", allData.doc_dateConverted],
//             ];

//             pdf.autoTable({
//                 startY: 45,
//                 margin: { right: pdf.internal.pageSize.width / 2 + 10 },
//                 body: tableData,
//                 theme: "plain",
//                 styles: {
//                     cellPadding: 1,
//                     fontSize: 8,
//                 },
//                 columnStyles: {
//                     0: { cellWidth: 'auto', fontStyle: 'normal', halign: 'left' },
//                     1: { cellWidth: 'auto', fontStyle: 'normal', halign: 'left' },
//                 },
//                 didDrawCell: function (data) {
//                     if (data.row.index === 3) {
//                         pdf.setLineWidth(0.3);
//                         pdf.setDrawColor(0);
//                         const startX = 10;
//                         const endX = pdf.internal.pageSize.width / 2;
//                         const y = data.cell.y + data.cell.height + 7.9;
//                         pdf.line(startX, y, endX, y);
//                     }
//                 }
//             });

//             const particulars = [
//                 ["Party Name", "Amount", "Cheque No. / Remark", "Bank Name"],
//                 ...data.map(item => [
//                     item.creditname || "",
//                     formatReadableAmount(item.amount) || "",
//                     item.narration || "",
//                     item.Ac_Name_E || ""
//                 ])
//             ];

//             pdf.autoTable({
//                 startY: pdf.lastAutoTable.finalY + 10,
//                 head: [particulars[0]],
//                 body: particulars.slice(1),
//                 styles: {
//                     cellPadding: 0.5,
//                     fontSize: 8,
//                     valign: 'middle',
//                     halign: 'left',
//                     lineColor: 200
//                 },
//                 columnStyles: {
//                     1: {
//                         cellWidth: 'wrap',
//                         overflow: 'linebreak',
//                     }
//                 },
//                 didParseCell: function (data) {
//                     if (data.section === 'body' && data.column.index === 1) {
//                         data.cell.styles.fontStyle = 'bold';
//                     }
//                 },
//                 tableWidth: '100%',
//             });

//             const lineY = pdf.lastAutoTable.finalY + 5;

//             pdf.setFontSize(8);
//             pdf.setFont("helvetica", "bold");

//             pdf.text(`Total: ${formatReadableAmount(allData.total)}`, 35, lineY);

//             const afterTotalY = lineY + 5;

//             pdf.setLineWidth(0.5);
//             pdf.line(10, afterTotalY, 200, afterTotalY);

//             const afterTableY = afterTotalY + 5;

//             pdf.setFontSize(8);
//             pdf.text(`Amount In Words: ${totalAmountWords}`, 10, afterTableY);

//             const afterAmountTextY = afterTableY + 5;
//             pdf.line(10, afterAmountTextY, 200, afterAmountTextY);

//             const pdfData = pdf.output("datauristring");
//             setPdfPreview(pdfData);
//         };
//     };

//     return (
//         <div id="pdf-content">
//             {pdfPreview && <PdfPreview pdfData={pdfPreview} apiData={invoiceData[0]} label={"RecieptPayment"} />}
//             <PrintButton disabledFeild={disabledFeild} fetchData={fetchData} />
//         </div>
//     );
// };

// export default RecieptPaymentReport;













// import React, { useState } from "react";
// import logo from "../../../Assets/HeaderJK.png";
// import HeaderJK from "../../../Assets/HeaderJK.png";
// import FooterJK from "../../../Assets/FooterJK.png";
// import jsPDF from "jspdf";
// import "jspdf-autotable";
// import PdfPreview from "../../../Common/PDFPreview";
// import PrintButton from "../../../Common/Buttons/PrintPDF";
// import { ConvertNumberToWord } from "../../../Common/FormatFunctions/ConvertNumberToWord";
// import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
// import "../../../Common/Fonts/Signika-Bold-normal";
// import "../../../Common/Fonts/Signika-Regular-normal";
// import "../../../Common/Fonts/Signika-Medium-normal";

// const API_URL = process.env.REACT_APP_API;

// const RecieptPaymentReport = ({ doc_no, Tran_Type, disabledFeild }) => {
//   const companyCode = sessionStorage.getItem("Company_Code");
//   const Year_Code = sessionStorage.getItem("Year_Code");
//   const [invoiceData, setInvoiceData] = useState([]);
//   const [pdfPreview, setPdfPreview] = useState(null);

//   const fetchData = async () => {
//     try {
//       const response = await fetch(
//         `${API_URL}/generating_RecieptPaymrnt_report?Company_Code=${companyCode}&Year_Code=${Year_Code}&doc_no=${doc_no}&TranType=${Tran_Type}`,
//       );
//       if (!response.ok) throw new Error("Network response was not ok");
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

//     const tranTypeTitleMap = {
//       BP: "BANK PAYMENT",
//       BR: "BANK RECEIPT",
//       CP: "CASH PAYMENT",
//       CR: "CASH RECEIPT",
//       JV: "JOURNAL VOUCHER",
//     };

//     const dynamicTitle = tranTypeTitleMap[allData.tran_type] || "RECEIPT PAYMENT";

//     const headerImg = new Image();
//     const footerImg = new Image();
//     headerImg.src = HeaderJK;
//     footerImg.src = FooterJK;

//     headerImg.onload = () => {
//       footerImg.onload = () => {
//         const pageWidth = pdf.internal.pageSize.getWidth();
//         const pageHeight = pdf.internal.pageSize.getHeight();
//         const headerHeight = 40;
//         const footerHeight = 37;
//         const footerWidth = 250;
//         const footerY = pageHeight - footerHeight - 10;

//         // ── HEADER ──────────────────────────────────────────────────────────
//         const drawHeader = () => {
//           pdf.addImage(headerImg, "PNG", 0, 0, pageWidth, headerHeight);
//         };

//         // ── FOOTER ──────────────────────────────────────────────────────────
//         const drawFooter = () => {
//           pdf.addImage(footerImg, "PNG", 0, footerY, footerWidth, footerHeight);
//           pdf.setFont("Signika-Regular");          // ✅ Signika font
//           pdf.setFontSize(7);
//           pdf.setTextColor(0, 0, 0);
//           pdf.text("Powered by: Sugarian.app", 12, footerY + footerHeight + 4);
//         };

//         drawHeader();

//         let startY = headerHeight + 10;

//         // ── TITLE ────────────────────────────────────────────────────────────
//         pdf.setLineWidth(0.3);
//         pdf.line(10, startY - 5, pageWidth - 10, startY - 5);

//         pdf.setFont("Signika-Bold");            // ✅ Signika Bold for title
//         pdf.setFontSize(11);
//         pdf.setTextColor(0, 0, 0);
//         pdf.text(dynamicTitle, pageWidth / 2, startY, { align: "center" });

//         pdf.line(10, startY + 3, pageWidth - 10, startY + 3);
//         startY += 10;

//         // ── BILL NO & DATE ───────────────────────────────────────────────────
//         pdf.setFont("Signika-Bold");            // ✅ Signika Bold for bill info
//         pdf.setFontSize(9);
//         pdf.setTextColor(0, 0, 0);
//         pdf.text(`Bill No: ${allData.doc_no}`, 10, startY);
//         pdf.text(`Date: ${allData.doc_dateConverted || ""}`, pageWidth - 10, startY, { align: "right" });

//         startY += 4;

//         const totalAmount = parseFloat(allData.total);
//         const totalAmountWords = ConvertNumberToWord(totalAmount);

//         const tableWidth = pageWidth - 20;
//         const colWidth = tableWidth / 4;

//         // ── TABLE ────────────────────────────────────────────────────────────
//         pdf.autoTable({
//           startY: startY,
//           head: [["Party Name", "Cheque No. / Remark", "Bank Name", "Amount"]],
//           body: data.map((item) => [
//             item.creditname || "",
//             item.narration || "",
//             item.Ac_Name_E || "",
//             formatReadableAmount(item.amount) || "",
//           ]),
//           margin: { left: 10, right: 10, bottom: footerHeight + 15 },
//           tableWidth: tableWidth,

//           styles: {
//             font: "Signika-Regular",            // ✅ Signika Regular for body
//             fontStyle: "normal",
//             fontSize: 8,
//             cellPadding: 2,
//             overflow: "linebreak",
//             valign: "middle",
//             textColor: [0, 0, 0],
//           },

//           headStyles: {
//             font: "Signika-Bold",              // ✅ Signika Bold for header row
//             fontStyle: "normal",
//             fillColor: [255, 255, 255],
//             textColor: [0, 0, 0],
//             fontSize: 8,
//           },

//           bodyStyles: {
//             font: "Signika-Regular",           // ✅ Signika Regular for body rows
//             fontStyle: "normal",
//             minCellHeight: 8,
//           },

//           columnStyles: {
//             0: { cellWidth: colWidth },
//             1: { cellWidth: colWidth },
//             2: { cellWidth: colWidth },
//             3: { cellWidth: colWidth, halign: "right" },
//           },

//           rowPageBreak: "avoid",
//           pageBreak: "auto",

//           didParseCell: function (hookData) {
//             // ✅ Enforce Signika fonts per section via hook (most reliable method)
//             if (hookData.section === "head") {
//               hookData.cell.styles.font = "Signika-Bold";
//               hookData.cell.styles.fontStyle = "normal";
//               if (hookData.column.index === 3) {
//                 hookData.cell.styles.halign = "right";
//               }
//             }
//             if (hookData.section === "body") {
//               hookData.cell.styles.font = "Signika-Regular";
//               hookData.cell.styles.fontStyle = "normal";
//               if (hookData.column.index === 3) {
//                 hookData.cell.styles.halign = "right";
//               }
//             }
//           },

//           didDrawPage: function (hookData) {
//             drawHeader();
//             drawFooter();
//             hookData.settings.margin.top = headerHeight + 10;
//           },
//         });

//         // ── TOTAL ────────────────────────────────────────────────────────────
//         const lineY = pdf.lastAutoTable.finalY + 5;

//         pdf.setFont("Signika-Bold");            // ✅ Signika Bold for total
//         pdf.setFontSize(9);
//         pdf.setTextColor(0, 0, 0);
//         pdf.text(`Total: ${formatReadableAmount(allData.total)}`, pageWidth - 10, lineY, { align: "right" });
//         pdf.line(10, lineY + 3, pageWidth - 10, lineY + 3);

//         // ── AMOUNT IN WORDS ──────────────────────────────────────────────────
//         const afterY = lineY + 10;

//         pdf.setFont("Signika-Regular");         // ✅ Signika Regular for words line
//         pdf.setFontSize(8);
//         pdf.setTextColor(0, 0, 0);
//         pdf.setFont("Signika-Bold");            // ✅ Signika Bold for the amount word value
//         pdf.text(`Amount In Words: ${totalAmountWords}`, pageWidth - 10, afterY, { align: "right" });

//         pdf.line(10, afterY + 3, pageWidth - 10, afterY + 3);

//         drawFooter();

//         const pdfData = pdf.output("datauristring");
//         setPdfPreview(pdfData);
//       };
//     };
//   };

//   return (
//     <div id="pdf-content">
//       {pdfPreview && (
//         <PdfPreview
//           pdfData={pdfPreview}
//           apiData={invoiceData[0]}
//           label={"RecieptPayment"}
//         />
//       )}
//       <PrintButton disabledFeild={disabledFeild} fetchData={fetchData} />
//     </div>
//   );
// };

// export default RecieptPaymentReport;






















import React, { useState } from "react";
import HeaderJK from "../../../Assets/HeaderJK.png";
import FooterJK from "../../../Assets/FooterJK.png";
import jsPDF from "jspdf";
import "jspdf-autotable";
import PdfPreview from "../../../Common/PDFPreview";
import PrintButton from "../../../Common/Buttons/PrintPDF";
import { ConvertNumberToWord } from "../../../Common/FormatFunctions/ConvertNumberToWord";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import "../../../Common/Fonts/Signika-Bold-normal";
import "../../../Common/Fonts/Signika-Regular-normal";
import "../../../Common/Fonts/Signika-Medium-normal";

const API_URL = process.env.REACT_APP_API;

const RecieptPaymentReport = ({ doc_no, Tran_Type, disabledFeild }) => {
  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");
  const [invoiceData, setInvoiceData] = useState([]);
  const [pdfPreview, setPdfPreview] = useState(null);

  const fetchData = async () => {
    try {
      const response = await fetch(
        `${API_URL}/generating_RecieptPaymrnt_report?Company_Code=${companyCode}&Year_Code=${Year_Code}&doc_no=${doc_no}&TranType=${Tran_Type}`
      );
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      setInvoiceData(data.all_data);
      generatePdf(data.all_data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const generatePdf = (data) => {
    const pdf = new jsPDF({ orientation: "portrait" });
    const allData = data[0] || {};

    const tranTypeTitleMap = {
      BP: "BANK PAYMENT",
      BR: "BANK RECEIPT",
      CP: "CASH PAYMENT",
      CR: "CASH RECEIPT",
      JV: "JOURNAL VOUCHER",
    };

    const dynamicTitle = tranTypeTitleMap[allData.tran_type] || "RECEIPT PAYMENT";

    const headerImg = new Image();
    const footerImg = new Image();
    headerImg.src = HeaderJK;
    footerImg.src = FooterJK;

    headerImg.onload = () => {
      footerImg.onload = () => {
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const headerHeight = 40;
        const footerHeight = 37;
        const footerWidth = 250;
        const footerY = pageHeight - footerHeight - 10;

        const drawHeader = () => {
          pdf.addImage(headerImg, "PNG", 0, 0, pageWidth, headerHeight);
        };

        const drawFooter = () => {
          pdf.addImage(footerImg, "PNG", 0, footerY, footerWidth, footerHeight);
          pdf.setFont("Signika-Bold");
          pdf.setFontSize(7);
          pdf.setTextColor(0, 0, 0);
        };

        const drawPageTopContent = () => {
          let y = 10;

          pdf.setLineWidth(0.3);
          pdf.line(10, y, pageWidth - 10, y);
          y += 8;

          pdf.setFont("Signika-Bold");
          pdf.setFontSize(11);
          pdf.setTextColor(0, 128, 0);
          pdf.text(dynamicTitle, pageWidth / 2, y, { align: "center" });

          pdf.setTextColor(0, 0, 0);
          pdf.line(10, y + 3, pageWidth - 10, y + 3);
          y += 10;

          pdf.setFont("Signika-Bold");
          pdf.setFontSize(9);
          pdf.setTextColor(0, 0, 0);
          pdf.text(`Bill No: ${allData.doc_no}`, 12, y);
          pdf.text(`Date: ${allData.doc_dateConverted || ""}`, pageWidth - 10, y, { align: "right" });

          y += 6;
          pdf.setLineWidth(0.3);
          pdf.line(10, y, pageWidth - 10, y);
        };

        // ── DRAW FIRST PAGE ───────────────────────────────────────────────
        drawHeader();

        let startY = headerHeight + 10;

        pdf.setLineWidth(0.3);
        pdf.line(10, startY - 5, pageWidth - 10, startY - 5);

        pdf.setFont("Signika-Bold");
        pdf.setFontSize(11);
        pdf.setTextColor(0, 128, 0);
        pdf.text(dynamicTitle, pageWidth / 2, startY, { align: "center" });

        pdf.setTextColor(0, 0, 0);
        pdf.line(10, startY + 3, pageWidth - 10, startY + 3);
        startY += 10;

        pdf.setFont("Signika-Bold");
        pdf.setFontSize(9);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Bill No: ${allData.doc_no}`, 12, startY);
        pdf.text(`Date: ${allData.doc_dateConverted || ""}`, pageWidth - 10, startY, { align: "right" });

        startY += 6;
        pdf.setLineWidth(0.3);
        startY += 4;

        const totalAmount = parseFloat(allData.total);
        const totalAmountWords = ConvertNumberToWord(totalAmount);
        const tableWidth = pageWidth - 20;
        const colWidth = tableWidth / 4;

        // ── TABLE ─────────────────────────────────────────────────────────
        pdf.autoTable({
          startY: startY,
          head: [["Party Name", "Cheque No. / Remark", "Bank Name", "Amount"]],
          body: data.map((item) => [
            item.creditname || "",
            item.narration || "",
            item.Ac_Name_E || "",
            formatReadableAmount(item.amount) || "",
          ]),
          
          margin: { left: 10, right: 10, top: 10, bottom: 20 }, 
          tableWidth: tableWidth,

          styles: {
            font: "Signika-Regular",
            fontStyle: "normal",
            fontSize: 8,
            overflow: "linebreak",
            valign: "top",
            textColor: [0, 0, 0],
            lineWidth: 0,

          },

          headStyles: {
            font: "Signika-Bold",
            fontStyle: "normal",
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            valign: "top",
            fontSize: 8,
            lineWidth: { bottom: 0.5 },
            lineColor: [0, 0, 0],
          },

      bodyStyles: {
          font: "Signika-Regular",
          fontStyle: "normal",
          valign: "top",                                              // ✅ make sure this is here
          cellPadding: { top: 0.3, right: 2, bottom: 0.3, left: 2 },    // ✅ top: 0 removes all vertical gap
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
           minCellHeight: 0,  
        },

          alternateRowStyles: {
            fillColor: [255, 255, 255],
          },

          columnStyles: {
            0: { cellWidth: colWidth },
            1: { cellWidth: colWidth },
            2: { cellWidth: colWidth },
            3: { cellWidth: colWidth, halign: "right" },
          },

          rowPageBreak: "auto",
          pageBreak: "auto",

          didParseCell: function (hookData) {
            if (hookData.section === "head") {
              hookData.cell.styles.font = "Signika-Bold";
              hookData.cell.styles.fontStyle = "normal";
              hookData.cell.styles.valign = "top"; 
              if (hookData.column.index === 3) {
                hookData.cell.styles.halign = "right";
              }
            }
            if (hookData.section === "body") {
              hookData.cell.styles.font = "Signika-Regular";
              hookData.cell.styles.fontStyle = "normal";
              if (hookData.column.index === 3) {
                hookData.cell.styles.halign = "right";
              }
            }
          },

          didDrawPage: function (hookData) {
            if (hookData.pageNumber === 1) {
              drawHeader();
            } 
          },
          didDrawCell: function (hookData) {
          if (
            hookData.section === "head" &&
            hookData.row.index === 0 &&
            hookData.column.index === 0
          ) {
            const doc = hookData.doc;
            const pageWidth = doc.internal.pageSize.getWidth();

            const y = hookData.cell.y + hookData.cell.height;

            // 🔥 SAME STYLE as your manual line
            doc.setLineWidth(0.3);
            doc.line(10, y + 2, pageWidth - 10, y + 2);
          }
        },
      

        });
        
        const lineY = pdf.lastAutoTable.finalY + 5;

        pdf.setFont("Signika-Bold");
        pdf.setFontSize(8);

        // Keep line in black
        pdf.setTextColor(0, 0, 0);
        pdf.line(10, lineY - 2, pageWidth - 10, lineY - 2);

        const maxWidth = pageWidth - 60;
        const amountWords = pdf.splitTextToSize(
          `Amount In Words: ${totalAmountWords}`,
          maxWidth
        );

        // Amount in words (black)
      pdf.setTextColor(0, 128, 0);
        pdf.text(amountWords, 10, lineY + 5, { align: "left" });

        // Total in green
        pdf.setTextColor(0, 128, 0); // green color
        pdf.text(
          `Total: ${formatReadableAmount(allData.total)}`,
          pageWidth - 10,
          lineY + 5,
          { align: "right" }
        );

        // Reset to black (important for future content)
        pdf.setTextColor(0, 0, 0);

        const wrappedHeight = amountWords.length * 5;
        pdf.line(
          10,
          lineY + 5 + wrappedHeight,
          pageWidth - 10,
          lineY + 5 + wrappedHeight
        );

        drawFooter();


        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.setFont("Signika-Regular");
          pdf.setFontSize(8);
          pdf.setTextColor(0, 0, 0);
          pdf.text(
            `Page ${i} of ${totalPages}`,
            pageWidth / 2,
            pageHeight - 5,
            { align: "center" }
          );
        }

        const pdfData = pdf.output("datauristring");
        setPdfPreview(pdfData);
      };
    };
  };

  return (
    <div id="pdf-content">
      {pdfPreview && (
        <PdfPreview
          pdfData={pdfPreview}
          apiData={invoiceData[0]}
          label={"RecieptPayment"}
        />
      )}
      <PrintButton disabledFeild={disabledFeild} fetchData={fetchData} />
    </div>
  );
};

export default RecieptPaymentReport;