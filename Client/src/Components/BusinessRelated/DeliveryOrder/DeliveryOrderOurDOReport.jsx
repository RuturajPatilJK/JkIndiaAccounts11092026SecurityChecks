import React, { useState } from "react";
import logo from "../../../Assets/jklogo.png";
import logo1 from "../../../Assets/jk.png"
import Sign from "../../../Assets/DirectorSign.png";
import Sign1 from "../../../Assets/DirectorSign1.png";
import jsPDF from "jspdf";
import "jspdf-autotable";
import PdfPreview from "../../../Common/PDFPreview";
import axios from "axios";
import { ConvertNumberToWord } from "../../../Common/FormatFunctions/ConvertNumberToWord";
import Swal from 'sweetalert2';
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import FooterJK from "../../../Assets/FooterJK.png";
import FooterJK1 from "../../../Assets/FooterJK1.png";
import HeaderJK from "../../../Assets/HeaderJK.png";
import PrintReport from "../../../Common/Buttons/PrintReport";
import "../../../Common/Fonts/Signika-Bold-normal";
import "../../../Common/Fonts/Signika-Regular-normal";
import "../../../Common/Fonts/Signika-Medium-normal";

const API_URL = process.env.REACT_APP_API;

const DeliveryOrderOurDoReport = ({ doc_no, disabledFeild }) => {
  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");
  const TCSApplicable = sessionStorage.getItem("TCSApplicable");
  const CompanyNameUpdatedDate = sessionStorage.getItem("CompanyNameUpdatedDate")
  const newCompanyName = sessionStorage.getItem("newCompanyName")
  const oldFormerlyName = sessionStorage.getItem("oldFormerlyName")

  const [invoiceData, setInvoiceData] = useState([]);
  const [isBillToShipToSame, setIsBillToShipToSame] = useState(true);
  const [pdfPreview, setPdfPreview] = useState(null);

  const [loading, setLoading] = useState(false);
  // cancel token: only the latest generation is allowed to call setPdfPreview / setLoading
  const genCounterRef = React.useRef(0);

  const fetchData = async () => {
    if (loading) return;

    setLoading(true);
    setPdfPreview(null);

    try {
      // Step 1: check for multiple DOs with same truck/date/rate/mill (SB_No=0)
      let multiDocs = [];
      try {
        const checkResp = await axios.get(
          `${API_URL}/check-multiple-do?Company_Code=${companyCode}&Year_Code=${Year_Code}&doc_no=${doc_no}`
        );
        multiDocs = checkResp.data.docs || [];
      } catch (_) {
        multiDocs = [];
      }

      const hasMultiple = multiDocs.length > 1;

      // Step 2: Show Swal — add "Multiple DO" deny button only when count > 1
      const swalConfig = {
        title: 'Are Bill To and Ship To the same?',
        text: hasMultiple
          ? `${multiDocs.length} DOs found with same truck / date / rate. Select print type.`
          : 'Choose how you want to view the report',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
        ...(hasMultiple && {
          showDenyButton: true,
          denyButtonText: 'Multiple DO',
          denyButtonColor: '#6c757d',
        }),
      };

      const result = await Swal.fire(swalConfig);

      const isMultipleDO = result.isDenied;           // "Multiple DO" button
      const userConfirmed = isMultipleDO || result.isConfirmed; // both treat Bill==Ship

      setIsBillToShipToSame(userConfirmed);

      // Step 3: Fetch DO report data (always based on the clicked doc_no)
      const response = await axios.get(
        `${API_URL}/generating_ourDO_report?Company_Code=${companyCode}&Year_Code=${Year_Code}&doc_no=${doc_no}`
      );
      const data = response.data;
      setInvoiceData(data.all_data);

      // always generate — stale-closure guard removed; setLoading(false) lives inside generatePdf
      generatePdf(data.all_data, userConfirmed, isMultipleDO ? multiDocs : null);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false); // release on error path only
    }
  };

  const generatePdf = (data, isBillToShipToSame, multipleDOs = null) => {
    setIsBillToShipToSame(false);

    const allData = data[0];

    // if (allData.doc_date && CompanyNameUpdatedDate) {
    //   const [day, month, year] = allData.doc_date.split('/');
    //   const docDate = new Date(`${year}-${month}-${day}`);
    //   const cnameUpdatedDate = new Date(CompanyNameUpdatedDate);

    //   const logoToUse = docDate < cnameUpdatedDate ? logo : logo1;
    //     const SignToUse = docDate < cnameUpdatedDate ? Sign1 : Sign;
    //     const foormerlyName = docDate < cnameUpdatedDate ? oldFormerlyName : allData.AL1


    //   if (!isNaN(docDate) && !isNaN(cnameUpdatedDate)) {
    //     displayCompanyName =
    //       docDate < cnameUpdatedDate
    //         ? newCompanyName 
    //         : allData.Company_Name_E;
    //   }
    // }


    let displayCompanyName = allData.Company_Name_E;
    let formerlyKnownAs = allData.AL1;
    let logoToUse = logo1;
    let SignToUse = Sign;
 let shouldUseImage = 'N'
    if (allData.doc_date && CompanyNameUpdatedDate) {
      const [day, month, year] = allData.doc_date.split('/');
      const docDate = new Date(`${year}-${month}-${day}`);
      const cnameUpdatedDate = new Date(CompanyNameUpdatedDate);
      

      if (!isNaN(docDate) && !isNaN(cnameUpdatedDate)) {
        if (docDate < cnameUpdatedDate) {
          displayCompanyName = newCompanyName;
          formerlyKnownAs = oldFormerlyName;
          logoToUse = logo;
          SignToUse = Sign1;
           shouldUseImage =
  docDate >= cnameUpdatedDate
        }
      }
    }



    const pdf = new jsPDF({ orientation: "portrait" });

    // stamp a generation ID so stale image-onload callbacks from old clicks are ignored
    const thisGen = ++genCounterRef.current;

    const logoImg = new Image();
    const headerImg = new Image();
    const footerImg1 = new Image();
    // set onload BEFORE src so cached images don't fire before the handler is registered
    headerImg.src = HeaderJK;
    footerImg1.src = FooterJK1;
    logoImg.onload = () => {
      // if a newer generation has started, discard this stale callback
      if (genCounterRef.current !== thisGen) return;
     
       if (shouldUseImage) {
    // Use header image across top (new template)
    pdf.addImage(headerImg, "PNG", 0, 6, 180, 34); // full width
  } else{
      pdf.addImage(logoImg, "PNG", 10, 9, 30, 30);

      pdf.setLineHeightFactor(1);

      pdf.setFont("Signika-Bold");
      pdf.setFontSize(14);
      pdf.text(displayCompanyName, 45, 14);
      pdf.setFont("Signika-Regular");
      pdf.setFontSize(9);
    pdf.setFont("Signika-Regular"); 
      pdf.setFontSize(9);
      pdf.text(`${formerlyKnownAs}`, 45, 18);
      pdf.text(`${allData.AL2}`, 45, 22);
      pdf.text(`${allData.AL3}`, 45, 26);
      pdf.text(`${allData.AL4}`, 45, 30);
      pdf.text(`${allData.Other}`, 45, 34);
      pdf.text(`${allData.BillFooter}`,45,38)
}

      // For Multiple DO: show all doc_nos and total quantal
      const doNumber = multipleDOs
        ? multipleDOs.map(d => d.doc_no).join(', ')
        : allData.doc_no;
      const date = allData.doc_date;

      pdf.setFontSize(12);
      pdf.setLineWidth(0.3);
      pdf.setFontSize(10);
      pdf.setDrawColor(100, 100, 100);
      pdf.line(10, 44, 200, 44);
      
      pdf.setTextColor(41, 122, 14);
      pdf.setFont("Signika-Bold");
      pdf.text("DELIVERY ORDER", 90, 49);
      pdf.line(10, 52, 200, 52);
      pdf.setLineWidth(0.3);
      let y = 40

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


      const toManagingDirectorData = [
        `The Managing Director,`,
        allData.millname,
        allData.milladress,
        `City: ${allData.millcityname} (${allData.millStateName} - ${allData.MillGSTStateCode})`
      ];
      if (allData.millDisplayEmail) {
        toManagingDirectorData.push(`Email: ${allData.millDisplayEmail}`);
      }

      const transportDetail = [
        `Do No: ${doNumber}  Date: ${date}`,
        `Lorry No: ${allData.truck_no}`,
        `Transport Mode: Road`,
        `From: ${allData.millcityname} (${allData.millStateName} - ${allData.MillGSTStateCode})`,
        `Place Of Supply: ${isBillToShipToSame
          ? `${allData.getpasscityname} (${allData.getpassstatename} - ${allData.GetpassGstStateCode})`
          : `${allData.shiptocityname} (${allData.shiptostatename} - ${allData.VoucherbyGstStateCode})`
        }`,
        `Reverse Charge: No`
      ];

      const addressStartY = y+7;
      // setTextColor(0, 0, 0)
      const endYBill = addressBlock(
        12,
        addressStartY,
        "To, ",
        toManagingDirectorData,
        (index) =>
          index === 1
            ? { color: "green", font: "Signika-Bold" }
            : { color: "black", font: "Signika-Regular" }
      );

      const endYShip = addressBlock(110, addressStartY, "", transportDetail, (index) =>
        index === 0 || index === 1
          ? { color: "green", font: "Signika-Bold" }
          : { color: "black", font: "Signika-Regular" });
      pdf.setDrawColor(80, 80, 80);
      pdf.line(105, addressStartY + 8, 105, Math.max(endYBill, endYShip) + 10);
      pdf.setDrawColor(80, 80, 80);
      pdf.line(
        10,
        Math.max(endYBill, endYShip) + 13,
        200,
        Math.max(endYBill, endYShip) + 13
      );
      y = Math.max(endYBill, endYShip) + 11;


      pdf.setFont("Signika-Medium");
      pdf.setTextColor(41, 122, 14);
      pdf.text("Particulars", 12, y + 7);
      pdf.text("HSN", 60, y + 7);
      pdf.text("Grade", 83, y + 7);
      pdf.text("Season", 110, y + 7);
      pdf.text("Quintal", 130, y + 7);
      pdf.text("Mill Rate", 157, y + 7);
      pdf.text("Value", 185, y + 7);

      y += 5;

      pdf.setLineWidth(0.3);
      pdf.setDrawColor(80, 80, 80);
      pdf.line(10, y + 5, 200, y + 5);

      // Draw item data row
      pdf.setFont("Signika-Medium");
      pdf.setTextColor(0, 0, 0);

      const itemTitle = allData.itemname ?? "Sugar";
      pdf.text(itemTitle, 12, y + 9);

      pdf.setFont("Signika-Regular");
      pdf.text(String(allData.HSN ?? ""), 60, y + 9);
      pdf.text(String(allData.grade ?? ""), 83, y + 9);
      pdf.text(String(allData.season ?? ""), 110, y + 9);

      // Calculations — for Multiple DO, sum quantals across all matching DOs
      const quantal = multipleDOs
        ? multipleDOs.reduce((sum, d) => sum + (d.quantal || 0), 0)
        : parseFloat(allData.quantal || 0);
      const value = parseFloat((allData.mill_rate || 0) * quantal);


      const formattedQty = quantal.toLocaleString("en-IN", { minimumFractionDigits: 2 });
      const formattedRate = formatReadableAmount(allData.mill_rate || 0.0);
      const formattedValue = value.toLocaleString("en-IN", { minimumFractionDigits: 2 });



      const amountX = 197; // Final right edge for amounts
      const rateX = 170;   // Slightly to the left for rate column
      const labelX = 130;  // Label starting position

      pdf.text(`${formattedQty} Qntl`, 130, y + 9);
      pdf.text(formattedRate, rateX, y + 9, { align: "right" });  // Mill Rate
      pdf.text(formattedValue, amountX, y + 9, { align: "right" }); // Value

      let millRate = Number(allData.mill_rate) + Number(allData.excise_rate);

      let TotalRate = Number(allData.PurchaseRate) + Number(allData.excise_rate);

      const gstPercent = allData.GST_Name?.match(/\d+%/)?.[0] || "";

      const mill = parseFloat(allData.mill_rate) || 0;
      const excise = parseFloat(allData.excise_rate) || 0;

      const total = mill + excise;

      // For Multiple DO: recalculate bags from total quantal
      const effectiveBags = multipleDOs
        ? Math.round(quantal * 100 / (allData.packing || 50))
        : allData.bags;

      const summaryFields = [
        [`${effectiveBags} Bags (${allData.packing} Kg)`, "", ""],
        [`Added GST (${gstPercent})`, formatReadableAmount(allData.excise_rate), formatReadableAmount(quantal * (allData.excise_rate || 0))],
        [
          "Total Rate",
          total,
          formatReadableAmount((total || 0) * quantal)
        ],

        ...(TCSApplicable === "N" && allData.PurchaseTDSRate > 0
          ? [[
            `TDS Rate (${allData.PurchaseTDSRate}%)`,
            "",
            formatReadableAmount(
              ((allData.mill_rate || 0) * quantal * (allData.PurchaseTDSRate || 0)) / 100
            ),
          ]]
          : TCSApplicable !== "N" && allData.TCS_Rate > 0
            ? [[
              `TCS Rate (${allData.TCS_Rate}%)`,
              "",
              formatReadableAmount(
                ((allData.mill_rate || 0) * quantal * (allData.TCS_Rate || 0)) / 100
              ),
            ]]
            : []
        ),
      ]


      pdf.setFont("Signika-Regular");



      summaryFields.forEach(([label, rate, amount], index) => {
        const isTotalRate = label === "Total Rate";

        pdf.setFont(isTotalRate ? "Signika-Medium" : "Signika-Regular");
        pdf.setTextColor(0, 0, 0);

        pdf.text(label, labelX, y + 15);

        if (rate !== null && rate !== undefined && rate !== "") {
          pdf.text(formatReadableAmount(rate), rateX, y + 15, { align: "right" });
        }

        pdf.text(amount ?? "0.00", amountX, y + 15, { align: "right" });

        y += 5;
      });


      pdf.setLineWidth(0.3);
      pdf.setDrawColor(80, 80, 80);
      pdf.line(10, y + 13, 200, y + 13);

      // For Multiple DO: total = mill_rate * total quantal (same rate for all)
      const effectiveTotalAmt = multipleDOs
        ? parseFloat(allData.mill_rate || 0) * quantal
        : parseFloat(allData.Mill_AmtWO_TCS);
      const totalInWords = ConvertNumberToWord(effectiveTotalAmt);
      const totalInWordsLines = pdf.splitTextToSize(`Rs: ${totalInWords}.`, 125);

      pdf.setFont("Signika-Regular");
      pdf.setTextColor(0, 0, 0);

      let wrapY = y + 18;
      totalInWordsLines.forEach(line => {
        pdf.text(line, 12, wrapY);
        wrapY += 4;
      });

      const formattedTotal = effectiveTotalAmt.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      pdf.setFont("Signika-Bold");
      pdf.setTextColor(41, 122, 14);
      pdf.text("Total Amount:", 150, y + 18);
      pdf.text(`₹ ${formattedTotal}`, amountX, y + 18, { align: "right" });

      // === 4. Draw bottom line after full wrapped block ===
      //Helper – returns true only if value is non‑empty after trimming
      const hasValue = (v) => v !== undefined && v !== null && String(v).trim() !== "";
      const afterTotalBlockY = wrapY - 2;
      pdf.setLineWidth(0.3);
      pdf.setDrawColor(80, 80, 80);
      pdf.line(10, afterTotalBlockY, 200, afterTotalBlockY);
      const buyerLines = [
        displayCompanyName,
        allData.getpassaddress ?? "",
        `City: ${allData.getpasscityname ?? ""} (${allData.getpassstatename ?? ""} - ${allData.GetpassGstStateCode ?? ""})`,
        `GST: ${allData.getpassgstno ?? ""}`,
        `PAN: ${allData.getpasspanno ?? ""}`,
        // `FSSAI: ${allData.getpassfssai ?? ""}`,
        // `TAN: ${allData.getpasstan_no ?? ""}`,
      ];
      // Conditionally add FSSAI
      const buyerFssaiRaw = allData.getpassfssai;
      if (hasValue(buyerFssaiRaw)) {
        buyerLines.push(`FSSAI: ${buyerFssaiRaw.trim()}`);
      }

      // Conditionally add TAN
      const buyerTanRaw = allData.getpasstan_no;
      if (hasValue(buyerTanRaw)) {
        buyerLines.push(`TAN: ${buyerTanRaw.trim()}`);
      }

      const shipToLines = [
        isBillToShipToSame ? displayCompanyName : allData.shiptoname,
        isBillToShipToSame ? allData.getpassaddress : allData.shiptoaddress,
        `City: ${isBillToShipToSame
          ? `${allData.getpasscityname} (${allData.getpassstatename} - ${allData.GetpassGstStateCode})`
          : `${allData.shiptocityname} (${allData.shiptostatename} - ${allData.VoucherbyGstStateCode})`
        }`,
        `GST: ${isBillToShipToSame ? allData.getpassgstno : allData.shiptogstno}`,
        `PAN: ${isBillToShipToSame ? allData.getpasspanno : allData.shiptopanno}`,
        // `FSSAI: ${isBillToShipToSame ? allData.getpassfssai : allData.shiptofssai}`,
        // `TAN: ${isBillToShipToSame ? allData.getpasstan_no : allData.shiptotan_no}`,
      ];

      const shipToTanRaw = isBillToShipToSame ? allData.getpasstan_no : allData.shiptotan_no;
      if (hasValue(shipToTanRaw)) {
        shipToLines.push(`TAN: ${shipToTanRaw.trim()}`);
      }

      const shipToFssaiRaw = isBillToShipToSame ? allData.getpassfssai : allData.shiptofssai;
      if (hasValue(shipToFssaiRaw)) {
        shipToLines.push(`FSSAI: ${shipToFssaiRaw.trim()}`);
      }


      const addressStartYBuyerShipper = afterTotalBlockY - 3;

      const endYBillTo = addressBlock(12, addressStartYBuyerShipper, "Buyer (Bill to):", buyerLines, (index) =>
        index === 0
          ? { color: "green", font: "Signika-Bold" }
          : { color: "black", font: "Signika-Regular" })
      const endYShipTo = addressBlock(110, addressStartYBuyerShipper, "Consignee (Ship to):", shipToLines, (index) =>
        index === 0
          ? { color: "green", font: "Signika-Bold" }
          : { color: "black", font: "Signika-Regular" });

      // Vertical divider
      pdf.setDrawColor(80, 80, 80);
      pdf.line(105, addressStartYBuyerShipper + 6, 105, Math.max(endYBillTo, endYShipTo) + 8);

      // Bottom line under both blocks
      const afterAddressBlockY = Math.max(endYBillTo, endYShipTo) + 12;
      pdf.line(10, afterAddressBlockY, 200, afterAddressBlockY);
      const tenderYStart = afterAddressBlockY + 6;

      // === Left side (Tender Info) ===
      pdf.setFont("Signika-Bold");
      pdf.setTextColor(0, 0, 0);
      let tenderX = 12;
      let lineY = tenderYStart;

      pdf.text("Tender Details:", tenderX, lineY);
      lineY += 5;

      pdf.setFont("Signika-Regular");

      // Tender Date
      pdf.text(`Tender Date: ${allData.Tender_Date}`, tenderX, lineY);
      lineY += 5;

      // Tender Rate (Mill Rate)
      let mill_Rate = Number(allData.mill_rate) + Number(allData.excise_rate);
      pdf.text(`Tender Rate: ₹ ${allData.mill_rate} + ${allData.excise_rate} = ${formatReadableAmount(mill_Rate || 0)}`, tenderX, lineY);
      lineY += 5;

      // Tender Purchaser (wrapped)
      const tenderPurchaserText = `Tender Purchaser: ${allData.doname ?? ""}`;
      const wrappedPurchaser = pdf.splitTextToSize(tenderPurchaserText, 90);
      wrappedPurchaser.forEach(line => {
        pdf.text(line, tenderX, lineY);
        lineY += 4;
      });
      lineY += 1;

      // Sell Note No.
      pdf.text(`Sell Note No.: ${allData.Sell_Note_No}`, tenderX, lineY);
      lineY += 4;

      // Remarks (only if any exist and not duplicated)
      const remarksSet = new Set();

      if (allData.utrnarration?.toString().trim()) {
        remarksSet.add(allData.utrnarration.trim());
      }
      if (allData.narration1?.toString().trim()) {
        remarksSet.add(allData.narration1.trim());
      }
      if (allData.narration2?.toString().trim()) {
        remarksSet.add(allData.narration2.trim());
      }

      const uniqueRemarks = [...remarksSet];

      if (uniqueRemarks.length > 0) {
        pdf.setFont("Signika-Bold");
        pdf.text("Remarks if any:", tenderX, lineY);
        lineY += 4;

        pdf.setFont("Signika-Regular");
        uniqueRemarks.forEach((textBlock) => {
          const wrapped = pdf.splitTextToSize(String(textBlock), 150);
          wrapped.forEach((line) => {
            pdf.text(line, tenderX, lineY);
            lineY += 3;
          });
        });
      }


      // === Right side (Payment Info) ===
      let paymentX = 110;
      let paymentY = tenderYStart;

      pdf.setFont("Signika-Bold");
      pdf.setTextColor(0, 0, 0);
      pdf.text("Payment Details:", paymentX, paymentY);

      pdf.setFont("Signika-Regular");
      paymentY += 5;
      pdf.text(`Amount: ₹ ${formatReadableAmount(allData.UTRAmount)}`, paymentX, paymentY);

      if (allData.UTRDate) {
        pdf.text(`Date: ${allData.UTRDate}`, 178, paymentY, { align: "right" });
      }

      paymentY += 5;
      pdf.text(`UTR Narration: ${allData.Narration}`, paymentX, paymentY);

      // === Dynamic Rectangle: responsive height ===
      pdf.setDrawColor(80, 80, 80);
      pdf.line(10, Math.max(lineY, paymentY) + 3, 200, Math.max(lineY, paymentY) + 3);

      const baseY = Math.max(lineY, paymentY) + 5;

      // === Left: Terms & Conditions ===
      pdf.setFont("Signika-Bold");
      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Terms & Conditions:", 12, baseY + 4);

      pdf.setFont("Signika-Regular");
      pdf.setFontSize(8.5);
      const notes = [
        "-The miller must ensure all required documents (Invoice, E-Way Bill, Quality Certificate, etc.)",
        "are accurately prepared and handed over to the transporter at the time of dispatch.",
        "-Only the purchased grade or quality of sugar must be delivered. Quality and quality variation",
        "will be miller’s responsibility at the end destination.",
        "-Sugar should be packed properly in standard quality bags (as per FSSAI norms) with accurate weight",
        "markings. Any shortage in quantity or damage during loading will be the responsibility of the miller.",
        "-The sugar must be loaded and dispatched in the designated truck(s) or rake(s) on the same day as ",
        "scheduled. Any delay leading to detention or halting charges of the truck/rake will be the responsibility",
        "of the miller.",
        `-Any dispute will be resolved mutually. Unresolved matters shall be subject to ${allData.City_E} jurisdiction only.`,
      ];

      let termsY = baseY + 8;
      notes.forEach((note, i) => {
        pdf.text(note, 12, termsY + i * 3);

        // notes.forEach((line, idx) => {
        //   pdf.text(line, 12, baseY + 3 + (idx + 1) * 3);
      });


      // === Right: Signature and Company ===
      const signY = baseY + 5;
      pdf.setFont("Signika-Bold");
      pdf.setFontSize(9);
      const forText = `For. ${displayCompanyName}`;
      const textWidth = pdf.getTextWidth(forText);
      const rightMargin = 197;
      const forTextX = rightMargin - textWidth;

      pdf.text(forText, forTextX, signY);

      const signImg = new Image();
      const footerImg = new Image();
      signImg.src = SignToUse;
      footerImg.src = FooterJK;

      const imgGap = 3;
      const imgY = signY + imgGap;

      const signWidth = 240;
      const signHeight = signWidth / 5;

      // Signature Image
      pdf.addImage(signImg, "PNG", 158, imgY, signWidth, signHeight);

      pdf.text("Authorised Signatory", 168, signY + 20);

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
      setPdfPreview({
        url: pdfUrl,
        data: {
          ...allData,
          CompanyName: displayCompanyName || "",
          mill_name: allData.millname || "",
          mill_address: allData.milladress || "",
          salerate: formatReadableAmount(Number(allData.mill_rate) + Number(allData.excise_rate) || 0),
          salebillname: displayCompanyName || "",
          ShipTo: isBillToShipToSame ? displayCompanyName : allData.shiptoname || ""
        }
      });
      setLoading(false); // release loading only after PDF is fully ready
    };
    // set src AFTER onload is registered (prevents cached-image onload race)
    logoImg.src = logoToUse;
  };

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
label = "delivery_orders_jk"
  }
else
{
  label = "delivery_orders_jk"
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

      <PrintReport onClick={fetchData} disabled={disabledFeild}>
        Our DO
      </PrintReport>
    </div>
  );
};

export default DeliveryOrderOurDoReport;



// import React, { useState } from "react";
// import logo from "../../../Assets/jklogo.png";
// import logo1 from "../../../Assets/jk.png"
// import Sign from "../../../Assets/DirectorSign.png";
// import Sign1 from "../../../Assets/DirectorSign1.png";
// import jsPDF from "jspdf";
// import "jspdf-autotable";
// import PdfPreview from "../../../Common/PDFPreview";
// import axios from "axios";
// import { ConvertNumberToWord } from "../../../Common/FormatFunctions/ConvertNumberToWord";
// import Swal from 'sweetalert2';
// import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
// import FooterJK from "../../../Assets/FooterJK.png";
// import PrintReport from "../../../Common/Buttons/PrintReport"
// import "../../../Common/Fonts/Signika-Bold-normal";
// import "../../../Common/Fonts/Signika-Regular-normal";
// import "../../../Common/Fonts/Signika-Medium-normal";

// const API_URL = process.env.REACT_APP_API;

// const DeliveryOrderOurDoReport = ({ doc_no, disabledFeild }) => {
//   const companyCode = sessionStorage.getItem("Company_Code");
//   const Year_Code = sessionStorage.getItem("Year_Code");
//   const TCSApplicable = sessionStorage.getItem("TCSApplicable");
//   const CompanyNameUpdatedDate = sessionStorage.getItem("CompanyNameUpdatedDate")
//   const newCompanyName = sessionStorage.getItem("newCompanyName")
//   const oldFormerlyName = sessionStorage.getItem("oldFormerlyName")

//   const [invoiceData, setInvoiceData] = useState([]);
//   const [isBillToShipToSame, setIsBillToShipToSame] = useState(true);
//   const [pdfPreview, setPdfPreview] = useState(null);

//   const [loading, setLoading] = useState(false);

//   const fetchData = async () => {
//     if (loading) return;

//     setLoading(true);
//     setPdfPreview(null);
//     const result = await Swal.fire({
//       title: 'Are Bill To and Ship To the same?',
//       text: 'Choose how you want to view the report',
//       icon: 'question',
//       showCancelButton: true,
//       confirmButtonText: 'Yes',
//       cancelButtonText: 'No',
//     });

//     const userConfirmed = result.isConfirmed;
//     setIsBillToShipToSame(userConfirmed);

//     try {
//       const response = await axios.get(
//         `${API_URL}/generating_ourDO_report?Company_Code=${companyCode}&Year_Code=${Year_Code}&doc_no=${doc_no}`
//       );
//       const data = await response.data;
//       setInvoiceData(data.all_data);

//       if (!pdfPreview) {
//         generatePdf(data.all_data, userConfirmed);
//       }
//     } catch (error) {
//       console.error("Error fetching data:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const generatePdf = (data, isBillToShipToSame) => {
//     setIsBillToShipToSame(false);

//     const allData = data[0];
//     let displayCompanyName = allData.Company_Name_E;
//     let formerlyKnownAs = allData.AL1;
//     let logoToUse = logo1;
//     let SignToUse = Sign;

//     if (allData.doc_date && CompanyNameUpdatedDate) {
//       const [day, month, year] = allData.doc_date.split('/');
//       const docDate = new Date(`${year}-${month}-${day}`);
//       const cnameUpdatedDate = new Date(CompanyNameUpdatedDate);

//       if (!isNaN(docDate) && !isNaN(cnameUpdatedDate)) {
//         if (docDate < cnameUpdatedDate) {
//           displayCompanyName = newCompanyName;
//           formerlyKnownAs = oldFormerlyName;
//           logoToUse = logo;
//           SignToUse = Sign1;
//         }
//       }
//     }

//     const pdf = new jsPDF({ orientation: "portrait" });

//     const logoImg = new Image();
//     logoImg.src = logoToUse;
//     logoImg.onload = () => {
//       pdf.addImage(logoImg, "PNG", 10, 9, 30, 30);

//       pdf.setLineHeightFactor(1);

//       pdf.setFont("Signika-Bold");
//       pdf.setFontSize(14);
//       pdf.text(displayCompanyName, 45, 14);
//       pdf.setFont("Signika-Regular");
//       pdf.setFontSize(9);
//     pdf.setFont("Signika-Regular"); 
//       pdf.setFontSize(9);
//       pdf.text(`${formerlyKnownAs}`, 45, 18);
//       pdf.text(`${allData.AL2}`, 45, 22);
//       pdf.text(`${allData.AL3}`, 45, 26);
//       pdf.text(`${allData.AL4}`, 45, 30);
//       pdf.text(`${allData.Other}`, 45, 34);
//       pdf.text(`${allData.BillFooter}`,45,38)

//       const doNumber = allData.doc_no;
//       const date = allData.doc_date;

//       pdf.setFontSize(12);
//       pdf.setLineWidth(0.3);
//       pdf.setFontSize(10);
//       pdf.setDrawColor(100, 100, 100);
//       pdf.line(10, 44, 200, 44);
      
//       pdf.setTextColor(41, 122, 14);
//       pdf.setFont("Signika-Bold");
//       pdf.text("DELIVERY ORDER", 90, 49);
//       pdf.line(10, 52, 200, 52);
//       pdf.setLineWidth(0.3);
//       let y = 40

//       pdf.setFontSize(9);

//       const addressBlock = (
//         x,
//         yStart,
//         title,
//         lines,
//         styleCondition = () => ({ color: "black", font: "Signika-Regular" })
//       ) => {
//         let y = yStart;
//         const lineHeight = 4;

//         if (title) {
//           pdf.setFont("Signika-Medium");
//           pdf.setTextColor(0, 0, 0);
//           pdf.text(title, x, y + 10);
//           y += lineHeight;
//         }

//         lines.forEach((line, index) => {
//           const wrapped = pdf.splitTextToSize(String(line ?? ""), 85);
//           const style = styleCondition(index, line);

//           pdf.setFont(style.font || "Signika-Regular");

//           if (style.color === "green") {
//             pdf.setTextColor(41, 122, 14);
//           } else {
//             pdf.setTextColor(0, 0, 0);
//           }

//           wrapped.forEach((wLine) => {
//             pdf.text(wLine, x, y + 10);
//             y += lineHeight;
//           });
//         });

//         return y;
//       };


//       const toManagingDirectorData = [
//         `The Managing Director,`,
//         allData.millname,
//         allData.milladress,
//         `City: ${allData.millcityname} (${allData.millStateName} - ${allData.MillGSTStateCode})`
//       ];
//       if (allData.millemailid) {
//         toManagingDirectorData.push(`Email: ${allData.millemailid}`);
//       }

//       const transportDetail = [
//         `Do No: ${doNumber}  Date: ${date}`,
//         `Lorry No: ${allData.truck_no}`,
//         `Transport Mode: Road`,
//         `From: ${allData.millcityname} (${allData.millStateName} - ${allData.MillGSTStateCode})`,
//         `Place Of Supply: ${isBillToShipToSame
//           ? `${allData.getpasscityname} (${allData.getpassstatename} - ${allData.GetpassGstStateCode})`
//           : `${allData.shiptocityname} (${allData.shiptostatename} - ${allData.VoucherbyGstStateCode})`
//         }`,
//         `Reverse Charge: No`
//       ];

//       const addressStartY = y+7;
//       // setTextColor(0, 0, 0)
//       const endYBill = addressBlock(
//         12,
//         addressStartY,
//         "To, ",
//         toManagingDirectorData,
//         (index) =>
//           index === 1
//             ? { color: "green", font: "Signika-Bold" }
//             : { color: "black", font: "Signika-Regular" }
//       );

//       const endYShip = addressBlock(110, addressStartY, "", transportDetail, (index) =>
//         index === 0 || index === 1
//           ? { color: "green", font: "Signika-Bold" }
//           : { color: "black", font: "Signika-Regular" });
//       pdf.setDrawColor(80, 80, 80);
//       pdf.line(105, addressStartY + 8, 105, Math.max(endYBill, endYShip) + 10);
//       pdf.setDrawColor(80, 80, 80);
//       pdf.line(
//         10,
//         Math.max(endYBill, endYShip) + 13,
//         200,
//         Math.max(endYBill, endYShip) + 13
//       );
//       y = Math.max(endYBill, endYShip) + 11;


//       pdf.setFont("Signika-Medium");
//       pdf.setTextColor(41, 122, 14);
//       pdf.text("Particulars", 12, y + 7);
//       pdf.text("HSN", 60, y + 7);
//       pdf.text("Grade", 83, y + 7);
//       pdf.text("Season", 110, y + 7);
//       pdf.text("Quintal", 130, y + 7);
//       pdf.text("Mill Rate", 157, y + 7);
//       pdf.text("Value", 185, y + 7);

//       y += 5;

//       pdf.setLineWidth(0.3);
//       pdf.setDrawColor(80, 80, 80);
//       pdf.line(10, y + 5, 200, y + 5);

//       // Draw item data row
//       pdf.setFont("Signika-Medium");
//       pdf.setTextColor(0, 0, 0);

//       // Combine millshortname and itemname safely
//       const itemTitle = `${allData.millshortname ?? ""}, ${allData.itemname ?? "Sugar"}`;
//       pdf.text(itemTitle.trim(), 12, y + 9);

//       pdf.setFont("Signika-Regular");
//       pdf.text(String(allData.HSN ?? ""), 60, y + 9);
//       pdf.text(String(allData.grade ?? ""), 83, y + 9);
//       pdf.text(String(allData.season ?? ""), 110, y + 9);

//       // Calculations
//       const value = parseFloat((allData.mill_rate || 0) * (allData.quantal || 0));
//       const quantal = parseFloat(allData.quantal || 0);


//       const formattedQty = quantal.toLocaleString("en-IN", { minimumFractionDigits: 2 });
//       const formattedRate = formatReadableAmount(allData.mill_rate || 0.0);
//       const formattedValue = value.toLocaleString("en-IN", { minimumFractionDigits: 2 });



//       const amountX = 197; // Final right edge for amounts
//       const rateX = 170;   // Slightly to the left for rate column
//       const labelX = 130;  // Label starting position

//       pdf.text(`${formattedQty} Qntl`, 130, y + 9);
//       pdf.text(formattedRate, rateX, y + 9, { align: "right" });  // Mill Rate
//       pdf.text(formattedValue, amountX, y + 9, { align: "right" }); // Value

//       let millRate = Number(allData.mill_rate) + Number(allData.excise_rate);

//       let TotalRate = Number(allData.PurchaseRate) + Number(allData.excise_rate);

//       const gstPercent = allData.GST_Name?.match(/\d+%/)?.[0] || "";

//       const mill = parseFloat(allData.mill_rate) || 0;
//       const excise = parseFloat(allData.excise_rate) || 0;

//       const total = mill + excise;

//       const summaryFields = [
//         [`${allData.bags} Bags (${allData.packing} Kg)`, "", ""],
//         [`Added GST (${gstPercent})`, formatReadableAmount(allData.excise_rate), formatReadableAmount((allData.quantal || 0) * (allData.excise_rate || 0))],
//         [
//           "Total Rate",
//           total,
//           formatReadableAmount((total || 0) * (allData.quantal || 0))
//         ],

//         ...(TCSApplicable === "N" && allData.PurchaseTDSRate > 0
//           ? [[
//             `TDS Rate (${allData.PurchaseTDSRate}%)`,
//             "",
//             formatReadableAmount(
//               ((allData.mill_rate || 0) * (allData.quantal || 0) * (allData.PurchaseTDSRate || 0)) / 100
//             ),
//           ]]
//           : TCSApplicable !== "N" && allData.TCS_Rate > 0
//             ? [[
//               `TCS Rate (${allData.TCS_Rate}%)`,
//               "",
//               formatReadableAmount(
//                 ((allData.amount || 0) * (allData.TCS_Rate || 0)) / 100
//               ),
//             ]]
//             : []
//         ),
//       ]


//       pdf.setFont("Signika-Regular");



//       summaryFields.forEach(([label, rate, amount], index) => {
//         const isTotalRate = label === "Total Rate";

//         pdf.setFont(isTotalRate ? "Signika-Medium" : "Signika-Regular");
//         pdf.setTextColor(0, 0, 0);

//         pdf.text(label, labelX, y + 15);

//         if (rate !== null && rate !== undefined && rate !== "") {
//           pdf.text(formatReadableAmount(rate), rateX, y + 15, { align: "right" });
//         }

//         pdf.text(amount ?? "0.00", amountX, y + 15, { align: "right" });

//         y += 5;
//       });


//       pdf.setLineWidth(0.3);
//       pdf.setDrawColor(80, 80, 80);
//       pdf.line(10, y + 13, 200, y + 13);

//       const totalInWords = ConvertNumberToWord(parseFloat(allData.Mill_AmtWO_TCS));
//       const totalInWordsLines = pdf.splitTextToSize(`Rs: ${totalInWords}.`, 125);

//       pdf.setFont("Signika-Regular");
//       pdf.setTextColor(0, 0, 0);

//       let wrapY = y + 18;
//       totalInWordsLines.forEach(line => {
//         pdf.text(line, 12, wrapY);
//         wrapY += 4;
//       });

//       const formattedTotal = Number(allData.Mill_AmtWO_TCS || 0).toLocaleString("en-IN", {
//         minimumFractionDigits: 2,
//         maximumFractionDigits: 2,
//       });

//       pdf.setFont("Signika-Bold");
//       pdf.setTextColor(41, 122, 14);
//       pdf.text("Total Amount:", 150, y + 18);
//       pdf.text(`₹ ${formattedTotal}`, amountX, y + 18, { align: "right" });

//       // === 4. Draw bottom line after full wrapped block ===
//       //Helper – returns true only if value is non‑empty after trimming
//       const hasValue = (v) => v !== undefined && v !== null && String(v).trim() !== "";
//       const afterTotalBlockY = wrapY - 2;
//       pdf.setLineWidth(0.3);
//       pdf.setDrawColor(80, 80, 80);
//       pdf.line(10, afterTotalBlockY, 200, afterTotalBlockY);
//       const buyerLines = [
//         displayCompanyName,
//         allData.getpassaddress ?? "",
//         `City: ${allData.getpasscityname ?? ""} (${allData.getpassstatename ?? ""} - ${allData.GetpassGstStateCode ?? ""})`,
//         `GST: ${allData.getpassgstno ?? ""}`,
//         `PAN: ${allData.getpasspanno ?? ""}`,
//         // `FSSAI: ${allData.getpassfssai ?? ""}`,
//         // `TAN: ${allData.getpasstan_no ?? ""}`,
//       ];
//       // Conditionally add FSSAI
//       const buyerFssaiRaw = allData.getpassfssai;
//       if (hasValue(buyerFssaiRaw)) {
//         buyerLines.push(`FSSAI: ${buyerFssaiRaw.trim()}`);
//       }

//       // Conditionally add TAN
//       const buyerTanRaw = allData.getpasstan_no;
//       if (hasValue(buyerTanRaw)) {
//         buyerLines.push(`TAN: ${buyerTanRaw.trim()}`);
//       }

//       const shipToLines = [
//         isBillToShipToSame ? displayCompanyName : allData.shiptoname,
//         isBillToShipToSame ? allData.getpassaddress : allData.shiptoaddress,
//         `City: ${isBillToShipToSame
//           ? `${allData.getpasscityname} (${allData.getpassstatename} - ${allData.GetpassGstStateCode})`
//           : `${allData.shiptocityname} (${allData.shiptostatename} - ${allData.VoucherbyGstStateCode})`
//         }`,
//         `GST: ${isBillToShipToSame ? allData.getpassgstno : allData.shiptogstno}`,
//         `PAN: ${isBillToShipToSame ? allData.getpasspanno : allData.shiptopanno}`,
//         // `FSSAI: ${isBillToShipToSame ? allData.getpassfssai : allData.shiptofssai}`,
//         // `TAN: ${isBillToShipToSame ? allData.getpasstan_no : allData.shiptotan_no}`,
//       ];

//       const shipToTanRaw = isBillToShipToSame ? allData.getpasstan_no : allData.shiptotan_no;
//       if (hasValue(shipToTanRaw)) {
//         shipToLines.push(`TAN: ${shipToTanRaw.trim()}`);
//       }

//       const shipToFssaiRaw = isBillToShipToSame ? allData.getpassfssai : allData.shiptofssai;
//       if (hasValue(shipToFssaiRaw)) {
//         shipToLines.push(`FSSAI: ${shipToFssaiRaw.trim()}`);
//       }


//       const addressStartYBuyerShipper = afterTotalBlockY - 3;

//       const endYBillTo = addressBlock(12, addressStartYBuyerShipper, "Buyer (Bill to):", buyerLines, (index) =>
//         index === 0
//           ? { color: "green", font: "Signika-Bold" }
//           : { color: "black", font: "Signika-Regular" })
//       const endYShipTo = addressBlock(110, addressStartYBuyerShipper, "Consignee (Ship to):", shipToLines, (index) =>
//         index === 0
//           ? { color: "green", font: "Signika-Bold" }
//           : { color: "black", font: "Signika-Regular" });

//       // Vertical divider
//       pdf.setDrawColor(80, 80, 80);
//       pdf.line(105, addressStartYBuyerShipper + 6, 105, Math.max(endYBillTo, endYShipTo) + 8);

//       // Bottom line under both blocks
//       const afterAddressBlockY = Math.max(endYBillTo, endYShipTo) + 12;
//       pdf.line(10, afterAddressBlockY, 200, afterAddressBlockY);
//       const tenderYStart = afterAddressBlockY + 6;

//       // === Left side (Tender Info) ===
//       pdf.setFont("Signika-Bold");
//       pdf.setTextColor(0, 0, 0);
//       let tenderX = 12;
//       let lineY = tenderYStart;

//       pdf.text("Tender Details:", tenderX, lineY);
//       lineY += 5;

//       pdf.setFont("Signika-Regular");

//       // Tender Date
//       pdf.text(`Tender Date: ${allData.Tender_Date}`, tenderX, lineY);
//       lineY += 5;

//       // Tender Rate (Mill Rate)
//       let mill_Rate = Number(allData.mill_rate) + Number(allData.excise_rate);
//       pdf.text(`Tender Rate: ₹ ${allData.mill_rate} + ${allData.excise_rate} = ${formatReadableAmount(mill_Rate || 0)}`, tenderX, lineY);
//       lineY += 5;

//       // Tender Purchaser (wrapped)
//       const tenderPurchaserText = `Tender Purchaser: ${allData.doname ?? ""}`;
//       const wrappedPurchaser = pdf.splitTextToSize(tenderPurchaserText, 90);
//       wrappedPurchaser.forEach(line => {
//         pdf.text(line, tenderX, lineY);
//         lineY += 4;
//       });
//       lineY += 1;

//       // Sell Note No.
//       pdf.text(`Sell Note No.: ${allData.Sell_Note_No}`, tenderX, lineY);
//       lineY += 4;

//       // Remarks (only if any exist and not duplicated)
//       const remarksSet = new Set();

//       if (allData.utrnarration?.toString().trim()) {
//         remarksSet.add(allData.utrnarration.trim());
//       }
//       if (allData.narration1?.toString().trim()) {
//         remarksSet.add(allData.narration1.trim());
//       }
//       if (allData.narration2?.toString().trim()) {
//         remarksSet.add(allData.narration2.trim());
//       }

//       const uniqueRemarks = [...remarksSet];

//       if (uniqueRemarks.length > 0) {
//         pdf.setFont("Signika-Bold");
//         pdf.text("Remarks if any:", tenderX, lineY);
//         lineY += 4;

//         pdf.setFont("Signika-Regular");
//         uniqueRemarks.forEach((textBlock) => {
//           const wrapped = pdf.splitTextToSize(String(textBlock), 150);
//           wrapped.forEach((line) => {
//             pdf.text(line, tenderX, lineY);
//             lineY += 3;
//           });
//         });
//       }


//       // === Right side (Payment Info) ===
//       let paymentX = 110;
//       let paymentY = tenderYStart;

//       pdf.setFont("Signika-Bold");
//       pdf.setTextColor(0, 0, 0);
//       pdf.text("Payment Details:", paymentX, paymentY);

//       pdf.setFont("Signika-Regular");
//       paymentY += 5;
//       pdf.text(`Amount: ₹ ${formatReadableAmount(allData.UTRAmount)}`, paymentX, paymentY);

//       if (allData.UTRDate) {
//         pdf.text(`Date: ${allData.UTRDate}`, 178, paymentY, { align: "right" });
//       }

//       paymentY += 5;
//       pdf.text(`UTR Narration: ${allData.Narration}`, paymentX, paymentY);

//       // === Dynamic Rectangle: responsive height ===
//       pdf.setDrawColor(80, 80, 80);
//       pdf.line(10, Math.max(lineY, paymentY) + 3, 200, Math.max(lineY, paymentY) + 3);

//       const baseY = Math.max(lineY, paymentY) + 5;

//       // === Left: Terms & Conditions ===
//       pdf.setFont("Signika-Bold");
//       pdf.setFontSize(8);
//       pdf.setTextColor(0, 0, 0);
//       pdf.text("Terms & Conditions:", 12, baseY + 4);

//       pdf.setFont("Signika-Regular");
//       pdf.setFontSize(8.5);
//       const notes = [
//         "-The miller must ensure all required documents (Invoice, E-Way Bill, Quality Certificate, etc.)",
//         "are accurately prepared and handed over to the transporter at the time of dispatch.",
//         "-Only the purchased grade or quality of sugar must be delivered. Quality and quality variation",
//         "will be miller’s responsibility at the end destination.",
//         "-Sugar should be packed properly in standard quality bags (as per FSSAI norms) with accurate weight",
//         "markings. Any shortage in quantity or damage during loading will be the responsibility of the miller.",
//         "-The sugar must be loaded and dispatched in the designated truck(s) or rake(s) on the same day as ",
//         "scheduled. Any delay leading to detention or halting charges of the truck/rake will be the responsibility",
//         "of the miller.",
//         "-Any dispute will be resolved mutually. Unresolved matters shall be subject to Kolhapur jurisdiction only.",
//       ];

//       let termsY = baseY + 8;
//       notes.forEach((note, i) => {
//         pdf.text(note, 12, termsY + i * 3);

//         // notes.forEach((line, idx) => {
//         //   pdf.text(line, 12, baseY + 3 + (idx + 1) * 3);
//       });


//       // === Right: Signature and Company ===
//       const signY = baseY + 5;
//       pdf.setFont("Signika-Bold");
//       pdf.setFontSize(9);
//       const forText = `For. ${displayCompanyName}`;
//       const textWidth = pdf.getTextWidth(forText);
//       const rightMargin = 197;
//       const forTextX = rightMargin - textWidth;

//       pdf.text(forText, forTextX, signY);

//       const signImg = new Image();
//       const footerImg = new Image();
//       signImg.src = SignToUse;
//       footerImg.src = FooterJK;

//       const imgGap = 3;
//       const imgY = signY + imgGap;

//       const signWidth = 240;
//       const signHeight = signWidth / 5;

//       // Signature Image
//       pdf.addImage(signImg, "PNG", 158, imgY, signWidth, signHeight);

//       pdf.text("Authorised Signatory", 168, signY + 20);

//       const footerY = 250; 
//       const footerHeight = 37; 
//       const poweredByY = footerY + footerHeight + 4; 

//       pdf.addImage(footerImg, "PNG", 0, footerY, 210, footerHeight);

//       pdf.setFont("Signika-Medium");
//       pdf.setFontSize(7);
//       pdf.setTextColor(0, 0, 0);
//       pdf.text("Powered by: Sugarian.app", 12, poweredByY);

//       const pdfBlob = pdf.output("blob");
//       const pdfUrl = URL.createObjectURL(pdfBlob);
//       setPdfPreview(pdfUrl);
//     };
//   };


//   return (
//     <div id="pdf-content">
//       {pdfPreview && (
//         <PdfPreview
//           pdfData={pdfPreview}
//           apiData={invoiceData[0]}
//           label={"OurDO"}
//         />
//       )}

//       <PrintReport onClick={fetchData} disabled={disabledFeild}>
//         Our DO
//       </PrintReport>
//     </div>
//   );
// };

// export default DeliveryOrderOurDoReport;