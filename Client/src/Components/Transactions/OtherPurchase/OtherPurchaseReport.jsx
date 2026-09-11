import React, { useState } from "react";
import logo from "../../../Assets/jklogo.png";
import logo1 from "../../../Assets/jk.png";
import Sign from "../../../Assets/DirectorSign.png";
import Sign1 from "../../../Assets/DirectorSign1.png";
import HeaderJK from "../../../Assets/HeaderJK.png";
import FooterJK from "../../../Assets/FooterJK.png";
import FooterJK1 from "../../../Assets/FooterJK1.png";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { ConvertNumberToWord } from "../../../Common/FormatFunctions/ConvertNumberToWord";
import PdfPreview from "../../../Common/PDFPreview";
import { formatDate } from "../../../Common/FormatFunctions/FormatDate";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import PrintButton from "../../../Common/Buttons/PrintPDF";

const OtherReport = ({ Doc_No, disabledFeild }) => {
  const API_URL = process.env.REACT_APP_API;
  const apikey = process.env.REACT_APP_API_URL;
  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");
  const CompanyNameUpdatedDate = sessionStorage.getItem("CompanyNameUpdatedDate")
  const newCompanyName = sessionStorage.getItem("newCompanyName")
  const oldFormerlyName = sessionStorage.getItem("oldFormerlyName")


  const [pdfBlob, setPdfBlob] = useState(null);
  const [ApiData, setAPIData] = useState([]);
  const [isBillToShipToSame, setIsBillToShipToSame] = useState(true);
  const [pdfPreview, setPdfPreview] = useState(null);

  const fetchData = async () => {
    try {
      const response = await fetch(
        `${API_URL}/getOtherReport?Company_Code=${companyCode}&Year_Code=${Year_Code}&Doc_No=${Doc_No}`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setAPIData(data.all_data);
      generatePdf(data.all_data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const generatePdf = async (data) => {
    const pdf = new jsPDF({ orientation: "portrait" });
    const allData = data?.[0] || {};

    const docDate = new Date(allData.Doc_Date);
    const cnameUpdatedDate = new Date(CompanyNameUpdatedDate);

    const displayCompanyName =
      docDate < cnameUpdatedDate ? newCompanyName : allData.Company_Name_E;

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
    logoImg.src = logoToUse;
    signImg.src = SignToUse;
    headerImg.src = HeaderJK;
    footerImg.src = FooterJK;
    footerImg1.src = FooterJK1;

    logoImg.onload = () => {
      const shouldUseImage = docDate >= cnameUpdatedDate;
      const pageWidth = pdf.internal.pageSize.getWidth(); // usually 210
      const margin = 10;

      if (shouldUseImage) {
        pdf.addImage(headerImg, "PNG", 0, 6, pageWidth, 34);
      } else {
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

      pdf.setFontSize(10);
      pdf.setFont("Signika-Bold");
      pdf.setDrawColor(80, 80, 80);
      pdf.line(margin, 44, pageWidth - margin, 44);
      pdf.setTextColor(41, 122, 14);
      pdf.text("OTHER PURCHASE", pageWidth / 2, 49, { align: "center" });
      pdf.line(margin, 52, pageWidth - margin, 52);
      pdf.setTextColor(0, 0, 0);

      let y = 45;
      pdf.setFontSize(9);

      const leftFields = [
        ["Tran Type", allData.tran_type],
        ["Supplier", allData.SupplierName],
        ["Expense", allData.ExpenseName],
        ["Provision", allData.ProvisionName],
        ["Group Code", allData.System_Name_E],
        ["GST Code", allData.GST_Name],
        ["TDS Cut Ac", allData.TDSCutAcName],
        ["TDS Ac", allData.TDSAcName],
        ["Section", allData.Nature_of_Payment],
      ];

      const rightFields = [
        ["Date", allData.docDateCoverted],
        ["Receipt No", allData.Doc_No],
      ];

      const leftX = 12;
      const rightX = 120;
      const lineHeight = 6;
      let lineY = y + 11;

      pdf.setFont("Signika-Medium");
      pdf.setFontSize(9);

    
      const labelWidths = leftFields.map(([label]) => pdf.getTextWidth(`${label}:`));
      const maxLabelWidth = Math.max(...labelWidths);

   
      const valueStartX = leftX + maxLabelWidth + 2;

    
      leftFields.forEach(([label, value]) => {
        const labelText = `${label}:`;
        const valueText = value ? value.toString() : "";

        const labelY = lineY;


        const availableWidth = rightX - valueStartX - 15;

       
        pdf.setFont("Signika-Bold");
        const wrappedLines = pdf.splitTextToSize(valueText, availableWidth);

      
        pdf.setFont("Signika-Medium");
        pdf.text(labelText, leftX, labelY);

       
        pdf.setFont("Signika-Bold");
        wrappedLines.forEach((line, index) => {
          pdf.text(line, valueStartX, labelY + index * lineHeight);
        });

        
        lineY += wrappedLines.length * lineHeight;
      });

      let rightLineY = y + 11;

      rightFields.forEach(([label, value]) => {
        const labelText = `${label}:`;
        const valueText = value ? value.toString() : "";

        pdf.setFont("Signika-Medium");
        pdf.text(labelText, rightX, rightLineY);
        pdf.setFont("Signika-Bold");
        pdf.text(valueText, rightX + pdf.getTextWidth(labelText) + 1, rightLineY);

        rightLineY += lineHeight;
      });

      
      // const lineAfterFieldsY = rightLineY + 4;
      // pdf.setDrawColor(80, 80, 80);
      // pdf.setLineWidth(0.3);
      // pdf.line(margin, lineAfterFieldsY, pageWidth - margin, lineAfterFieldsY);

      const horizontalLineStartX = rightX - 8;
      const horizontalLineEndX = pageWidth - margin;
      const horizontalLineY = rightLineY - 1;
      pdf.line(horizontalLineStartX, horizontalLineY, horizontalLineEndX, horizontalLineY);

      
      let summaryY = horizontalLineY + 6;

      // Summary Fields
      const igstRate = parseFloat(allData.IGST_Rate) || 0;
      const igstAmt = parseFloat(allData.IGST_Amount) || 0;
      const cgstRate = parseFloat(allData.CGST_Rate) || 0;
      const cgstAmt = parseFloat(allData.CGST_Amount) || 0;
      const sgstRate = parseFloat(allData.SGST_Rate) || 0;
      const sgstAmt = parseFloat(allData.SGST_Amount) || 0;

      const taxRows = [];
      if (igstRate > 0) {
        taxRows.push(["IGST", igstRate, igstAmt]);
      } else {
        taxRows.push(["CGST", cgstRate, cgstAmt], ["SGST", sgstRate, sgstAmt]);
      }

      const summaryFields = [
        ["Taxable Amount", "", allData.Taxable_Amount],
        ...taxRows,
        ["Provision Amount", "", allData.ProvisionAmt],
        ["Expenses Amount", "", allData.ExpensisAmt],
        ["Other Expense", "", allData.Other_Amount],
        ["Bill Amount", "", allData.Bill_Amount],
        ["TDS Amount", "", allData.TDS_Amt],
        ["TDS Rate", "", allData.TDS_Per],
        ["TDS", "", allData.TDS],
      ];

     
      summaryFields.forEach(([label, rate, amount]) => {
        pdf.setFont("Signika-Regular");
        pdf.text(`${label}:`, rightX, summaryY);

        pdf.setFont("Signika-Bold");
        if (rate !== null && rate !== undefined && rate !== "") {
          pdf.text(`${formatReadableAmount(rate)}%`, rightX + 40, summaryY, { align: "center" });
        }

        const formattedAmount = formatReadableAmount(amount);
        pdf.text(formattedAmount, pageWidth - margin, summaryY, { align: "right" });

        summaryY += 5;
      });

    
      lineY = Math.max(lineY, summaryY);
      rightLineY = Math.max(rightLineY, summaryY);


      const verticalLineX = rightX - 10;
      const topY = y + 10;
      const bottomY = Math.max(lineY, rightLineY) + 10;

      pdf.setDrawColor(80, 80, 80);
      pdf.setLineWidth(0.3);
      pdf.line(verticalLineX, topY, verticalLineX, bottomY);

      // const horizontalLineStartX = rightX - 8;
      // const horizontalLineEndX = pageWidth - margin;
      // const horizontalLineY = rightLineY - 1;
      // pdf.line(horizontalLineStartX, horizontalLineY, horizontalLineEndX, horizontalLineY);

      const lineAfterFieldsY = rightLineY + 32;
      pdf.setDrawColor(80, 80, 80);
      pdf.setLineWidth(0.3);
      pdf.line(margin, lineAfterFieldsY, pageWidth - margin, lineAfterFieldsY);

      y = Math.max(lineAfterFieldsY, rightLineY) - 20;

      if (allData.Narration?.trim()) {
        pdf.line(margin, y, pageWidth - margin, y);
        y += 7;

        const narrationLabel = "Narration:";
        const narrationText = allData.Narration.trim();

        pdf.setFont("Signika-Medium");
        pdf.setFontSize(9);
        pdf.text(narrationLabel, leftX, y);

        const labelWidth = pdf.getTextWidth(narrationLabel) + 2;
        const maxWidth = pageWidth - margin * 2 - labelWidth;

        const wrappedLines = pdf.splitTextToSize(narrationText, maxWidth);

        pdf.setFont("Signika-Bold");
        wrappedLines.forEach((line, i) => {
          pdf.text(line, leftX + labelWidth, y + i * lineHeight);
        });

        y += wrappedLines.length * lineHeight;
      }

      y += 10;

     
      const footerY = 252;
      const footerHeight = 37;
      const poweredByY = footerY + footerHeight + 3;

      if (shouldUseImage) {
        pdf.addImage(footerImg, "PNG", 0, footerY, pageWidth, footerHeight);
      } else {
        pdf.addImage(footerImg1, "PNG", 0, footerY, pageWidth, footerHeight);
      }

      pdf.setFont("Signika-Medium");
      pdf.setFontSize(7);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Powered by: Sugarian.app", margin, poweredByY);

      const pdfBlob = pdf.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setPdfPreview(pdfUrl);
    };
  };


  return (
    <div id="pdf-content">
      {pdfPreview && (
        <PdfPreview
          pdfData={pdfPreview}
          apiData={ApiData[0]}
          label={"OtherPurchase"}
        />
      )}
      <PrintButton disabledFeild={disabledFeild} fetchData={fetchData} label={"Other Purchase Print"} />
    </div>
  );
};

export default OtherReport;
