import React, { useState } from "react";
import logo from "../../../Assets/jklogo.png";
import logo1 from "../../../Assets/jk.png"
import Sign from "../../../Assets/DirectorSign.png";
import Sign1 from "../../../Assets/DirectorSign1.png";
import HeaderJK from "../../../Assets/HeaderJK.png";
import FooterJK from "../../../Assets/FooterJK.png";
import FooterJK1 from "../../../Assets/FooterJK1.png";
import jsPDF from "jspdf";
import "jspdf-autotable";
import PdfPreview from "../../../Common/PDFPreview";
import { formatDate } from "../../../Common/FormatFunctions/FormatDate";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import PrintButton from "../../../Common/Buttons/PrintPDF";

const UTRReport = ({ doc_no, disabledFeild }) => {
  const API_URL = process.env.REACT_APP_API;
  const apikey = process.env.REACT_APP_API_URL;
  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");
  const CompanyNameUpdatedDate = sessionStorage.getItem("CompanyNameUpdatedDate")
  const newCompanyName = sessionStorage.getItem("newCompanyName")
  const oldFormerlyName = sessionStorage.getItem("oldFormerlyName")

  const [pdfBlob, setPdfBlob] = useState(null);
  const [apiData, setAPIData] = useState([]);
  const [isBillToShipToSame, setIsBillToShipToSame] = useState(true);

  const fetchData = async () => {
    try {
      const response = await fetch(
        `${API_URL}/getUTRReport?Company_Code=${companyCode}&Year_Code=${Year_Code}&doc_no=${doc_no}`
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

  const generatePdf = (data) => {
    const allData = data[0];

     const docDate = new Date(allData.doc_date);
        const cnameUpdatedDate = new Date(CompanyNameUpdatedDate);
    
        const displayCompanyName =
          docDate < cnameUpdatedDate
            ? newCompanyName 
            : allData.Company_Name_E;
    
    
        const logoToUse = docDate < cnameUpdatedDate ? logo : logo1;
        const SignToUse = docDate < cnameUpdatedDate ? Sign1 : Sign;
        const foormerlyName = docDate < cnameUpdatedDate ? oldFormerlyName : allData.AL1

    const pdf = new jsPDF({ orientation: "portrait" });

    const totalAmount = formatReadableAmount(allData.amount);

    const logoImg = new Image();
    logoImg.src = logo;
    const headerImg = new Image();
    const footerImg1 = new Image();
     headerImg.src = HeaderJK;
        footerImg1.src = FooterJK1
    logoImg.onload = () => {
      const shouldUseImage =
  docDate >= cnameUpdatedDate

  console.log(shouldUseImage, docDate, cnameUpdatedDate)
  if (shouldUseImage) {
    // Use header image across top (new template)
    pdf.addImage(headerImg, "PNG", 0, 6, 180, 34); // full width
  } else {
      pdf.addImage(logoImg, "PNG", 10, 9, 30, 30);

      pdf.setLineHeightFactor(1);

      pdf.setFont("Signika-Bold");
      pdf.setFontSize(14);
      pdf.text(`${displayCompanyName}`, 45, 14);
      pdf.setFont("Signika-Regular");
      pdf.setFontSize(9);
      pdf.text(`${foormerlyName}`, 45, 18);
      pdf.text(`${allData.AL2}`, 45, 22);
      pdf.text(`${allData.AL3}`, 45, 26);
      pdf.text(`${allData.AL4}`, 45, 30);
      pdf.text(`${allData.Other}`, 45, 34);
      pdf.text(`${allData.BillFooter}`, 45, 38);
  }

      const doNumber = allData.doc_no;
      const date = allData.convertedDate;

      pdf.setFontSize(12);
      pdf.setLineWidth(0.3);
      pdf.setFontSize(10);
      pdf.setDrawColor(100, 100, 100);
      pdf.line(10, 44, 200, 44);
      pdf.setTextColor(41, 122, 14);
      pdf.setFont("Signika-Bold");
      pdf.text("PAYMENT ADVICE", 90, 49);
      pdf.line(10, 52, 200, 52);
      pdf.setLineWidth(0.3);
      let y = 40;

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

      let y1 = 50;

      const toManagingDirectorData = [
        `The Managing Director,`,
        allData.Ac_Name_E,
        allData.Address_E,
        `City: ${allData.city_name_e} (${allData.state || "Maharashtra"} - ${
          allData.GSTStateCode
        })`,
      ];
      if (allData.millemailid) {
        toManagingDirectorData.push(`Email: ${allData.millemailid}`);
      }

      const transportDetail = [`Date: ${date}`, ``, `Reciept No: ${doNumber}`];

      const addressStartY = y1;
      // setTextColor(0, 0, 0)
      const endYBill = addressBlock(
        22,
        y1,
        "To, ",
        toManagingDirectorData,
        (index) =>
          index === 1
            ? { color: "green", font: "Signika-Bold" }
            : { color: "black", font: "Signika-Regular" }
      );

      const rightXPosition = 165;

      const endYShip = addressBlock(
        rightXPosition,
        y1,
        "",
        transportDetail,
        (index) =>
          index === 1
            ? { color: "black", font: "Signika-Bold" }
            : { color: "black", font: "Signika-Regular" }
      );

      // Y position after Managing Director block and transport detail
      const afterAddressY = Math.max(endYBill, endYShip) + 10;

      // pdf.line(105, addressStartY + 8, 105, Math.max(endYBill, endYShip) + 10);
      pdf.setDrawColor(80, 80, 80);
      // pdf.line(
      //   10,
      //   Math.max(endYBill, endYShip) + 13,
      //   200,
      //   Math.max(endYBill, endYShip) + 13
      // );
      // y = Math.max(endYBill, endYShip) + 11;

      // const depositText = [
      //   `Dear Sir,`,
      //   `We have made Payment of Rs: ${totalAmount} to Your Account via RTGS wide Utr No.: ${allData.utr_no}`,
      //   `You are kindly requested to evedit the same amount to our account and acknowledge.`,
      //   `Please send Payment reciept along with ledger to us on logistics@ebuysugar.com`,
      // ];
      // const maxWidth = 180;
      // const textWidth = pdf.getTextWidth(depositText);

      // if (textWidth <= maxWidth) {
      //   pdf.setFont("Signika-Regular");
      //   pdf.text(depositText, 10, 100);
      // } else {

      const subjectText1 =
        "Subject: Confirmation of Payment Made to Your Account";
      pdf.setFont("Signika-Bold");
      const subjectY = afterAddressY + 5;
      pdf.text(subjectText1, 22, subjectY);

      // let yPos = subjectY + 9;

      const firstPart = `Dear Sir,`;
      const secondPartStart = `We wish to inform you that a payment of `;
      const secondPartBold = `₹ ${totalAmount}`; // Amount in bold
      const secondPartEnd = ` has been made to your account via RTGS, bearing UTR No.: `;
      const thirdPartBold = `${allData.utr_no}.`; // UTR No. in bold
      const forthPart = `You are kindly requested to credit the same amount to our account and confirm receipt at the earliest.`;
      const fifthPart = `We also request you to share the payment receipt along with the updated ledger at `;
      const sixthPart = `logistics@ebuysugar.com`;
      const seventhPart = `Thank you for your continued cooperation.`;

      // Set margins
      const leftMargin = 22;
      const rightMargin = 35;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const usableWidth = pageWidth - leftMargin - rightMargin;
      let yP = subjectY + 9;

      // Line 1: Greeting
      pdf.setFont("Signika-Regular");
      pdf.text(firstPart, leftMargin, yP);
      yP += 10;

      // Line 2: Start + Amount (bold) + End + UTR (bold)
      const line2Segments = [
        { text: secondPartStart, font: "Signika-Regular" },
        { text: secondPartBold, font: "Signika-Bold" },
        { text: secondPartEnd, font: "Signika-Regular" },
        { text: thirdPartBold, font: "Signika-Bold" },
      ];

      let currentX = leftMargin;
      let currentY = yP;
      const spaceWidth = pdf.getTextWidth(" ");

      // Loop over each segment (handles font + wrapping)
      for (let segment of line2Segments) {
        const words = segment.text.split(" ");
        let line = "";

        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          const testLine = line ? `${line} ${word}` : word;
          const testLineWidth = pdf.getTextWidth(testLine);

          if (currentX + testLineWidth > pageWidth - rightMargin) {
            // Print current line and move to next
            pdf.setFont(segment.font);
            pdf.text(line, currentX, currentY);
            currentY += 5;
            line = word;
            currentX = leftMargin;
          } else {
            line = testLine;
          }

          // Last word in this segment
          if (i === words.length - 1 && line) {
            pdf.setFont(segment.font);
            pdf.text(line, currentX, currentY);
            currentX += pdf.getTextWidth(line + " ");
          }
        }
      }
      yP = currentY + 10;

      // Line 3: Follow-up request
      pdf.setFont("Signika-Regular");
      let wrappedForth = pdf.splitTextToSize(forthPart, usableWidth);
      pdf.text(wrappedForth, leftMargin, yP);
      yP += wrappedForth.length * 5 + 5;

      // Line 4: Ledger request + email (split and wrap if needed)
      const preBoldWidth = pdf.getTextWidth(fifthPart);
      const boldWidth = pdf.getTextWidth(sixthPart);

      if (preBoldWidth + boldWidth > usableWidth) {
        pdf.setFont("Signika-Regular");
        let wrappedNormal = pdf.splitTextToSize(fifthPart, usableWidth);
        pdf.text(wrappedNormal, leftMargin, yP);
        yP += wrappedNormal.length * 5;

        pdf.setFont("Signika-Bold");
        let wrappedBold = pdf.splitTextToSize(sixthPart, usableWidth);
        pdf.text(wrappedBold, leftMargin, yP);
        yP += wrappedBold.length * 5;
      } else {
        pdf.setFont("Signika-Regular");
        pdf.text(fifthPart, leftMargin, yP);
        pdf.setFont("Signika-Bold");
        pdf.text(sixthPart, leftMargin + preBoldWidth, yP);
        yP += 10;
      }

      // Line 5: Final thanks
      pdf.setFont("Signika-Regular");
      let wrappedSeventh = pdf.splitTextToSize(seventhPart, usableWidth);
      pdf.text(wrappedSeventh, leftMargin, yP);

      // pdf.setFont("helvetica", "normal");
      // pdf.text("Please credit the same.", 10, 110);

      const footerImg = new Image();
      const signImg = new Image();
       const signImg1 = new Image();
      signImg.src = Sign;
      signImg1.src = Sign1
    headerImg.src = HeaderJK;
        footerImg.src = FooterJK;
        footerImg1.src = FooterJK1

      // signImg.onload = () => {
      //   pdf.text("Yours faithfully,", 140,170);
      //   pdf.setTextColor(41, 122, 14);
      //   pdf.text(`For, ${allData.Company_Name_E}`, 140, 175);
      //   pdf.addImage(signImg, "PNG", 160, 175, 30, 20);
      //   pdf.setTextColor(41, 122, 14);
      //   pdf.text("Authorised Signatory", 167, 200);

      // Aligning text to the left at X = 10 (you can adjust this value
      pdf.text("Yours faithfully,", 22, yP + 10); // Text placed on the left

      pdf.setFont("Signika-Bold");
      pdf.text(`For. ${allData.Company_Name_E}`, 22, yP + 15); // Company name at the left

      // pdf.addImage(image, format, x, y, width, height);
      // pdf.addImage(signImg, "PNG", 22, yP + 17, 300, 40); // Image placed at the left side
      // pdf.addImage(signImg, "PNG", 11, yP+17, 300, 40);
if(docDate < cnameUpdatedDate)
   {
        pdf.addImage(signImg1, "PNG", 22, yP + 17, 300, 40);
   }
   else{
pdf.addImage(signImg, "PNG", 11, yP + 17, 300, 40);
   }

      pdf.setFont("Signika-Bold");
      pdf.text("Authorised Signatory", 22, yP + 34);

      const footerY = 250; // Y-position where footer starts
      const footerHeight = 37; // Height of the footer image
      const poweredByY = footerY + footerHeight + 4; // Add a small gap after footer

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
      setPdfBlob(pdfUrl);
    };
  };

  return (
    <div id="pdf-content">
      {pdfBlob && (
        <PdfPreview pdfData={pdfBlob} apiData={apiData[0]} label={"utr_template"} />
      )}
      {/* <button onClick={fetchData} className="print-button" disabled={disabledFeild}>Print</button> */}
      <PrintButton disabledFeild={disabledFeild} fetchData={fetchData} />
    </div>
  );
};

export default UTRReport;