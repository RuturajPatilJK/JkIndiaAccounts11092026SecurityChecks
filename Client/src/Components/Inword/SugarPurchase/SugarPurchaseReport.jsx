import React, { useEffect, useState } from "react";
import PdfPreview from "./../../../Common/PDFPreview";
import { ConvertNumberToWord } from "../../../Common/FormatFunctions/ConvertNumberToWord";
import logo from "../../../Assets/jklogo.png";
import logo1 from "../../../Assets/jk.png"
import Sign from "../../../Assets/DirectorSign.png";
import Sign1 from "../../../Assets/DirectorSign1.png";
import jsPDF from "jspdf";
import "jspdf-autotable";
import QRCode from "qrcode";
import PrintButton from "../../../Common/Buttons/PrintPDF";
import HeaderJK from "../../../Assets/HeaderJK.png";
import FooterJK from "../../../Assets/FooterJK.png";
import FooterJK1 from "../../../Assets/FooterJK1.png";
import "../../../Common/Fonts/Signika-Bold-normal";
import "../../../Common/Fonts/Signika-Regular-normal";
import "../../../Common/Fonts/Signika-Medium-normal";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";

const API_URL = process.env.REACT_APP_API;

const SugarPurchaseReport = ({ doc_no, Company_Code, Year_Code, disabledFeild }) => {
    const [invoiceData, setInvoiceData] = useState([]);
    const [pdfPreview, setPdfPreview] = useState(null);
    const TCSApplicable = sessionStorage.getItem("TCSApplicable");
    const CompanyNameUpdatedDate = sessionStorage.getItem("CompanyNameUpdatedDate")
    const newCompanyName = sessionStorage.getItem("newCompanyName")
    const oldFormerlyName = sessionStorage.getItem("oldFormerlyName")


    // Fetch data from API
    const fetchData = async () => {
  try {
    setInvoiceData([]);    
    setPdfPreview(null);   
    const response = await fetch(
      `${API_URL}/generating_purchaseReport_report?Company_Code=${Company_Code}&doc_no=${doc_no}&Year_Code=${Year_Code}`
    );
    const data = await response.json();
    setInvoiceData(data.all_data || []);
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
        GSTN of Supplier : ${allData.GST || ""}
        GSTIN of Buyer : ${allData.suppliergstno || ""}
        Document No. : ${allData.doc_no || ""}
        Document Type : Tax Invoice
        Date : ${allData.doc_dateConverted || ""}
        HSN : ${allData.HSN || ""}
        EwayBill No: : ${allData.EWay_Bill_No || ""}
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
            pdf.text("PURCHASE BILL", 95, 49);
            pdf.setLineWidth(0.3);
            pdf.setDrawColor(80, 80, 80);
            pdf.line(10, 52, 200, 52);
            pdf.setTextColor(0, 0, 0);

            let y = 45;
            pdf.setFontSize(9);

            const fieldPairs = [
                [
                    `Invoice No. :  PS${allData.year}-${allData.doc_no}`,
                    `Invoice Date : ${allData.doc_dateConverted}`,
                    "Our GST No.",
                    allData.GST,
                ],
                [
                    `DO No. : ${allData.PURCNO}`,
                    "",
                    "Transport Mode",
                    "Road",
                ],
                [
                    `E-Way Bill No.: ${allData.EWay_Bill_No}`,
                    "",
                    `Date of Supply: ${allData.doc_dateConverted}`,
                ],
                [
                    `EwayBill ValidDate: ${allData.mill_inv_dateConverted}`,
                    "",
                    "Place Of Supply",
                    `${allData.partyCity} (${allData.State_E} - ${allData.supplierstatecode})`,
                   
                ],
                [
                    `Bill No: ${allData.Bill_No}`,
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

            const billToLines = [
            
                    allData.suppliername,
                `${allData.supplieraddress}, ${allData.supplierStateName} ${allData.SupplierPinCode}`,
                `City: ${
                     `${allData.partyCity} (${allData.supplierStateName} - ${allData.supplierstatecode})`
                }`,
                `GST: ${
                 allData.suppliergstno
                }`,

                `PAN: ${
                    allData.supplierpan
                }`,

               allData.supllierfssaino ?`FSSAI: ${allData.supllierfssaino}` : null,
                allData.Tan_no ? `TAN: ${allData.Tan_no}` : null,
            ].filter(Boolean);

            const shipToLines = [
                "",
                "",
               "",
               "",
                "",
               "",
               "",
                "",
            ].filter(Boolean); // removes null/undefined/empty


            pdf.setLineWidth(0.3);
            pdf.setDrawColor(80, 80, 80);
            pdf.line(10, y + 18, 200, y + 18);

            const addressStartY = y + 17;
            // setTextColor(0, 0, 0)
            const endYBill = addressBlock(12, addressStartY, "Supplier (Bill to):", billToLines);
            const endYShip = addressBlock(110, addressStartY, "", shipToLines);
            pdf.setDrawColor(80, 80, 80);
            //pdf.line(105, addressStartY + 6, 105, Math.max(endYBill, endYShip) + 7);
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
            // const value = parseFloat(allData.TaxableAmount || 0);
            const saleRate = allData.rate;
            const value = Math.round(saleRate * allData.Quantal);
            const rate = parseFloat(allData.Quantal)
                ? (value / parseFloat(allData.Quantal)).toFixed(2)
                : 0;
            

            const formattedQty = Number(allData.Quantal || 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
            });
            const formattedRate = Number(saleRate).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
            });
            const formattedValue = Number(value).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
            });
            const amountX = 199;
            const rateX = 172;
            const labelX = 140;

            pdf.text(`${formattedQty} Qntl`, labelX, y + 9);
            pdf.text(formattedRate, rateX, y + 9, { align: "right" });
            pdf.text(formattedValue, amountX, y + 9, { align: "right" });

            y += 8;
            pdf.setFont("Signika-Regular");

            const wrappedMillName = pdf.splitTextToSize(String(allData.millshortname ?? "-"), 90);
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

                ["Taxable Amount", "", allData.Bill_Amount],
                ...taxRows,
                ["Other Expense", "", allData.OTHER_AMT],
                ["Purchase Rate", "", allData.rate],

                ...(TCSApplicable === 'N'
                    ? [
                        ["TDS", allData.TDS_Rate,allData.TDS_Amt]
                    ]
                    : [
                        ["TCS:", allData.TCS_Rate, allData.TCS_Amt],
                        ["TCS Net Payable:", "",allData.TCS_Net_Payable]
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

export default SugarPurchaseReport;
// import React, { useEffect, useState } from "react";
// import logo from "../../../Assets/jklogo.png";
// import Sign from "../../../Assets/jksign.png";
// import jsPDF from "jspdf";
// import "jspdf-autotable";
// import PdfPreview from "./../../../Common/PDFPreview";
// import QRCode from "qrcode";
// import { ConvertNumberToWord } from "../../../Common/FormatFunctions/ConvertNumberToWord";
// import PrintButton from "../../../Common/Buttons/PrintPDF"
// import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";

// const API_URL = process.env.REACT_APP_API;

// const SugarPurchaseReport = ({ doc_no, Company_Code, Year_Code, disabledFeild }) => {
//     const [invoiceData, setInvoiceData] = useState([]);
//     const [pdfPreview, setPdfPreview] = useState(null);
//     const TCSApplicable = sessionStorage.getItem("TCSApplicable");


//     // Fetch data from API
//     const fetchData = async () => {
//         try {
//             const response = await fetch(
//                 `${API_URL}/generating_purchaseReport_report?Company_Code=${Company_Code}&doc_no=${doc_no}&Year_Code=${Year_Code}`
//             );
//             if (!response.ok) {
//                 throw new Error("Network response was not ok");
//             }
//             const data = await response.json();
//             setInvoiceData(data.all_data);
//         } catch (error) {
//             console.error("Error fetching data:", error);
//         }
//     };

//     useEffect(() => {
//         if (invoiceData.length > 0) {
//             generatePdf(invoiceData);
//         }
//     }, [invoiceData]);

//     const generatePdf = async (data) => {
//         const pdf = new jsPDF({ orientation: "portrait" });
//         const allData = data?.[0] || {};
//         const logoImg = new Image();

//         let qrCodeData = "";
//         qrCodeData = ` GSTN of Supplier: ${allData.GST || ""}\n
//         GSTIN of Supplier: ${allData.suppliergstno || ""}\n
//         Document No: ${allData.doc_no || ""}\n
//         Document Type: Tax Invoice\n
//         Date Of Creation Of Invoice: ${allData.doc_dateConverted || ""}\n
//         HSN Code: ${allData.HSN || ""}\n
//         EwayBill No: ${allData.EWay_Bill_No || ""}`

//         const qrCodeDataUrl = await QRCode.toDataURL(qrCodeData.trim(), {
//             width: 300,
//             height: 300,
//         });

//         pdf.addImage(qrCodeDataUrl, "PNG", 170, 0, 30, 30);
//         logoImg.src = logo;
//         logoImg.onload = () => {
//             pdf.addImage(logoImg, "PNG", 5, 5, 30, 30);
//             pdf.setFontSize(14);
//             pdf.text(`${allData.Company_Name_E}`, 40, 10);

//             pdf.setFontSize(8);
//             pdf.text(`${allData.AL1}`, 40, 15);
//             pdf.text(`${allData.AL2}`, 40, 20);
//             pdf.text(`${allData.AL3}`, 40, 25);
//             pdf.text(`${allData.AL4}`, 40, 30);
//             pdf.text(`${allData.Other}`, 40, 35);

//             pdf.setFontSize(12);
//             pdf.setLineWidth(0.3);
//             pdf.line(10, 38, 200, 38);

//             pdf.setFontSize(12);
//             pdf.text("PURCHASE BILL", 90, 43);

//             pdf.setFontSize(12);
//             pdf.setLineWidth(0.3);
//             pdf.line(10, 45, 200, 45);

//             const totalAmount = parseFloat(allData.TCS_Net_Payable);
//             const totalAmountWords = ConvertNumberToWord(totalAmount);

//             const tableData = [
//                 ["Reverse Charge:", "No"],
//                 ["Invoice No:", `PS${allData.year}-${allData.doc_no}`],
//                 ["Invoice Date:", allData.doc_dateConverted],
//                 ["DO No:", allData.PURCNO],
//                 ["State:", allData.State_E],
//                 ["State Code:", allData.GSTStateCode],
//                 ["Supplier:"],
//                 [allData.suppliername],
//                 [`${allData.supplieraddress}`],
//                 ["City:", allData.partyCity],
//                 ["Gst No:", allData.suppliergstno],
//                 ["State Code:", allData.supplierstatecode, "PAN No:", allData.supplierpan],
//                 ["FSSAI No:", allData.supllierfssaino],
//                 ["TAN No:", allData.suppliertinno],
//             ];

//             const buyerData = [
//                 ["Our GST No:", allData.GST],
//                 ["Transport Mode:", "Road"],
//                 ["Date Of Supply:", allData.doc_dateConverted],
//                 ["Place Of Supply:", allData.partyCity, allData.billtogststatecode],
//                 ["State:", allData.supplierstatecode],
//             ];

//             if (tableData && tableData.length > 0) {
//                 pdf.autoTable({
//                     startY: 45,
//                     margin: {
//                         left: 10,
//                         right: pdf.internal.pageSize.width / 2 + 10
//                     },
//                     body: tableData,
//                     theme: "plain",
//                     styles: {
//                         cellPadding: 0.5,
//                         fontSize: 8,
//                         overflow: "linebreak"
//                     },
//                     columnStyles: {
//                         1: { fontStyle: "bold", cellWidth: -250 },
//                     },
//                     didDrawCell: function (data) {
//                         if (data.row.index === 3) {
//                             pdf.setLineWidth(0.3);
//                             pdf.setDrawColor(0);
//                             const startX = 10;
//                             const endX = pdf.internal.pageSize.width / 2;
//                             const y = data.cell.y + data.cell.height + 7.9;
//                             pdf.line(startX, y, endX, y);
//                         }
//                     },
//                 });
//             }

//             pdf.setLineWidth(0.3);
//             pdf.line(pdf.internal.pageSize.width / 2, 45, pdf.internal.pageSize.width / 2, 70);

//             if (buyerData && buyerData.length > 0) {
//                 pdf.autoTable({
//                     startY: 48,
//                     margin: {
//                         left: pdf.internal.pageSize.width / 2 + 10,
//                         right: 10
//                     },
//                     body: buyerData,
//                     theme: "plain",
//                     styles: {
//                         cellPadding: 0.6,
//                         fontSize: 8,
//                         overflow: "linebreak"
//                     },
//                     columnStyles: {
//                         1: { fontStyle: "bold" },
//                     },
//                     didDrawCell: function (data) {
//                         if (data.row.index === 3) {
//                             pdf.setLineWidth(0.3);
//                             pdf.setDrawColor(0);
//                             const startX = pdf.internal.pageSize.width / 2;
//                             const endX = pdf.internal.pageSize.width - 10;
//                             const y = data.cell.y + data.cell.height + 4;
//                             pdf.line(startX, y, endX, y);
//                         }
//                     },
//                 });
//             }

//             pdf.setFontSize(8);
//             pdf.setLineWidth(0.3);
//             pdf.line(10, 110, 200, 110);

//             pdf.text(`Mill Name : ${allData.millshortname}`, 10, 115);
//             pdf.text(`Lorry No : ${allData.LORRYNO}`, 130, 115);

//             pdf.line(10, 118, 200, 118);

//             pdf.setFont("helvetica", "normal");
//             pdf.setFontSize(8);

//             const saleRate = allData.rate;
//             const value = Math.round(saleRate * allData.Quantal);
//             const particulars = [
//                 [
//                     "Particulars",
//                     "Brand Name",
//                     "HSN/ACS",
//                     "Quintal",
//                     "Packing (kg)",
//                     "Bags",
//                     "Rate",
//                     "Value"
//                 ],
//                 [
//                     allData.itemname,
//                     allData.Brand_Name,
//                     allData.HSN,
//                     allData.Quantal,
//                     allData.packing,
//                     allData.bags,
//                     formatReadableAmount(saleRate) || 0,
//                     formatReadableAmount(value)
//                 ],
//             ];

//             pdf.autoTable({
//                 startY: pdf.lastAutoTable.finalY + 50,
//                 head: [particulars[0]],
//                 body: particulars.slice(1),
//                 styles: {
//                     cellPadding: 1,
//                     fontSize: 8,
//                     valign: "middle",
//                     halign: "right",

//                 },
//                 headStyles: {
//                     fillColor: false,
//                     textColor: 'black',
//                     halign: "center",
//                 },
//                 bodyStyles: {
//                     halign: "right",
//                 },
//                 tableWidth: "auto",
//                 pageBreak: "auto",
//                 didDrawCell: function (data) {
//                     pdf.setLineDash([2, 2]);
//                     pdf.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height);
//                     pdf.setLineDash([]);
//                 }
//             });

//             const eInvoiceData = [
//                 ["Sale Rate:", formatReadableAmount(allData.rate)],
//                 ["Grade:", allData.grade],
//                 ["Eway Bill No:", allData.EWay_Bill_No],
//                 ["EwayBill ValidDate:", allData.mill_inv_dateConverted],
//             ];

//             pdf.autoTable({
//                 startY: pdf.lastAutoTable.finalY + 6,
//                 margin: { left: 10, right: pdf.internal.pageSize.width / 2 },
//                 body: eInvoiceData,
//                 theme: "plain",
//                 styles: {
//                     cellPadding: 0.5,
//                     fontSize: 8,
//                     halign: "left",
//                     valign: "middle",
//                     overflow: "linebreak"
//                 },
//                 columnStyles: {
//                     0: { cellWidth: "auto" },
//                     1: { fontStyle: "bold" },
//                 },
//                 pageBreak: "auto"
//             });

//             pdf.setLineWidth(0.3);

//             const summaryData = [
//                 ["Freight:", allData.LESS_FRT_RATE, allData.freight],
//                 ["Sub Total:", "", formatReadableAmount(allData.subTotal)],
//                 ["Taxable Amount:", "", formatReadableAmount(allData.Bill_Amount)],
//                 ["CGST:", allData.CGSTRate, formatReadableAmount(allData.CGSTAmount)],
//                 ["SGST:", allData.SGSTRate, formatReadableAmount(allData.SGSTAmount)],
//                 ["IGST:", allData.IGSTRate, formatReadableAmount(allData.IGSTAmount)],
//                 ["Other Expense:", "", formatReadableAmount(allData.OTHER_AMT)],
//                 ["Total Amount:", "", formatReadableAmount(allData.TCS_Net_Payable)],
//                ...(TCSApplicable === 'N'
//                 ? [
//                     ["TDS:", allData.TDS_Rate, formatReadableAmount(allData.TDS_Amt)]
//                     ]
//                 : [
//                     ["TCS:", allData.TCS_Rate, formatReadableAmount(allData.TCS_Amt)],
//                     ["TCS Net Payable:", "", formatReadableAmount(allData.TCS_Net_Payable)]
//                     ]),
//             ];

//             pdf.autoTable({
//                 startY: 135,
//                 margin: { left: pdf.internal.pageSize.width / 1.85 },
//                 body: summaryData,
//                 theme: "plain",
//                 styles: {
//                     cellPadding: 1,
//                     fontSize: 8,
//                     halign: "left",
//                     valign: "middle",
//                     overflow: "linebreak"
//                 },
//                 columnStyles: {
//                     2: { halign: "right", fontStyle: "bold" },
//                 },
//                 pageBreak: "auto"
//             });

//             pdf.setFontSize(8);
//             const lineY = pdf.lastAutoTable.finalY + 10;
//             pdf.line(10, lineY - 4, 200, lineY - 4);

//             pdf.setFontSize(7);
//             pdf.setFont("helvetica", "bold");
//             pdf.text(`Bank Details:${allData.bankdetail}`, 10, lineY - 1);

//             pdf.setLineWidth(0.3);
//             pdf.line(10, lineY + 3, 200, lineY + 3);

//             pdf.setFontSize(8);
//             pdf.setFont("helvetica", "bold");
//             pdf.text(`Amount In Words : ${totalAmountWords}.`, 10, lineY + 7);

//             pdf.line(10, lineY + 9, 200, lineY + 9);

//             pdf.setFontSize(8);
//             pdf.text(`Our Tan No: ${allData.TIN}`, 10, pdf.lastAutoTable.finalY + 24);
//             pdf.text(`FSSAI No: ${allData.FSSAI_No}`, 60, pdf.lastAutoTable.finalY + 24);
//             pdf.text(`PAN No:  ${allData.Pan_No}`, 110, pdf.lastAutoTable.finalY + 24);

//             // Signature
//             const signImg = new Image();
//             signImg.src = Sign;
//             signImg.onload = () => {
//                 pdf.setFontSize(8);
//                 pdf.setTextColor(255, 0, 0);
//                 pdf.text("Note:", 6, pdf.lastAutoTable.finalY + 28);
//                 pdf.setTextColor(0, 0, 0);

//                 pdf.text(
//                     "- After Dispatch of the goods we are not responsible for non delivery or any kind of damage.",
//                     6,
//                     pdf.lastAutoTable.finalY + 32
//                 );
//                 pdf.text(
//                     "- Certified that the particulars given above are true and correct.",
//                     6,
//                     pdf.lastAutoTable.finalY + 36
//                 );
//                 pdf.text(
//                     "- Please credit the amount in our account and send the amount by RTGS immediately.",
//                     6,
//                     pdf.lastAutoTable.finalY + 40
//                 );
//                 pdf.text(
//                     "- If the amount is not sent before the due date payment Interest 24% will be charged.",
//                     6,
//                     pdf.lastAutoTable.finalY + 44
//                 );
//                 pdf.text(
//                     "- I/We hereby certify that food/foods mentioned in this invoice is/are warranted to be of ",
//                     6,
//                     pdf.lastAutoTable.finalY + 48
//                 );
//                 pdf.text(
//                     "- the nature and quality which it/these purports/purported to be",
//                     6,
//                     pdf.lastAutoTable.finalY + 52
//                 );

//                 pdf.addImage(signImg, "PNG", 160, pdf.lastAutoTable.finalY + 25, 30, 20);

//                 pdf.text(
//                     `For, ${allData.Company_Name_E}`,
//                     145,
//                     pdf.lastAutoTable.finalY + 50
//                 );
//                 pdf.text("Authorised Signatory", 160, pdf.lastAutoTable.finalY + 55);

//                 const pdfBlob = pdf.output("blob");
//                 const pdfUrl = URL.createObjectURL(pdfBlob);
//                 setPdfPreview(pdfUrl);
//             };
//         };
//     };

//     return (
//         <div id="pdf-content">
//             {pdfPreview && (
//                 <PdfPreview
//                     pdfData={pdfPreview}
//                     apiData={invoiceData[0]}
//                     label={"PurchaseBill"}
//                 />
//             )}
//             <PrintButton disabledFeild={disabledFeild} fetchData={fetchData} />
//         </div>
//     );
// };

// export default SugarPurchaseReport;