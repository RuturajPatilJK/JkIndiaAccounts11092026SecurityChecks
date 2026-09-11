import React, { useState } from "react";
// import logo from "../../../Assets/jklogo.png";
import Sign from "../../../Assets/OurDoSign.jpeg";
import jsPDF from "jspdf";
import "jspdf-autotable";
import PdfPreview from "../../../Common/PDFPreview";
import axios, { all } from "axios";
import { ConvertNumberToWord } from "../../../Common/FormatFunctions/ConvertNumberToWord";
import Swal from 'sweetalert2';
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import FooterJK from "../../../Assets/FooterJK.png";
import PrintReport from "../../../Common/Buttons/PrintReport"
import "../../../Common/Fonts/Signika-Bold-normal";
import "../../../Common/Fonts/Signika-Regular-normal";
import "../../../Common/Fonts/Signika-Medium-normal";

const API_URL = process.env.REACT_APP_API;

const PartyDOReport = ({ doc_no, disabledFeild }) => {
  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");
  const TCSApplicable = sessionStorage.getItem("TCSApplicable");
   const CompanyNameUpdatedDate = sessionStorage.getItem("CompanyNameUpdatedDate")
  const newCompanyName = sessionStorage.getItem("newCompanyName")

  const [invoiceData, setInvoiceData] = useState([]);
  const [isBillToShipToSame, setIsBillToShipToSame] = useState(true);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (loading) return;

    setLoading(true);
    setPdfPreview(null);
    const result = await Swal.fire({
      title: 'Are Bill To and Ship To the same?',
      text: 'Choose how you want to view the report',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
    });

    const userConfirmed = result.isConfirmed;
    setIsBillToShipToSame(userConfirmed);

    try {
      const response = await axios.get(
        `${API_URL}/generating_ourDO_report?Company_Code=${companyCode}&Year_Code=${Year_Code}&doc_no=${doc_no}`
      );
      const data = await response.data;
      setInvoiceData(data.all_data);

      if (!pdfPreview) {
        generatePdf(data.all_data, userConfirmed);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };



  const generatePdf = (data, isBillToShipToSame) => {
    setIsBillToShipToSame(false);
    const allData = data[0];

     let displayCompanyName = allData.Company_Name_E;
      
          if (allData.doc_date && CompanyNameUpdatedDate) {
            const [day, month, year] = allData.doc_date.split('/');
            const docDate = new Date(`${year}-${month}-${day}`);
            const cnameUpdatedDate = new Date(CompanyNameUpdatedDate);
      
            if (!isNaN(docDate) && !isNaN(cnameUpdatedDate)) {
              if (docDate < cnameUpdatedDate) {
                displayCompanyName = newCompanyName;
              }
            }
          }

    const pdf = new jsPDF({ orientation: "portrait" });


    pdf.setLineHeightFactor(1);

    const pageWidth = pdf.internal.pageSize.width;
    pdf.setFont("Signika-Bold");
    pdf.setFontSize(11);
    const bankNameWidth = pdf.getStringUnitWidth(`${allData.bankname}`) * pdf.internal.getFontSize() / pdf.internal.scaleFactor;
    pdf.text(`${allData.bankname}`, (pageWidth - bankNameWidth) / 2, 12);

    pdf.setFont("Signika-Medium");
    pdf.setFontSize(9);
    const bankAddressWidth = pdf.getStringUnitWidth(`${allData.bankaddress}`) * pdf.internal.getFontSize() / pdf.internal.scaleFactor;
    pdf.text(`${allData.bankaddress}`, (pageWidth - bankAddressWidth) / 2, 16);

    const cityStateText = `${allData.bankcityname}, ${allData.bankstate}`;
    const cityStateWidth = pdf.getStringUnitWidth(cityStateText) * pdf.internal.getFontSize() / pdf.internal.scaleFactor;
    pdf.text(cityStateText, (pageWidth - cityStateWidth) / 2, 20);


    const gstPanText = `GST: ${allData.bankgstno}   |   PAN: ${allData.bankpan}`;
    const gstPanWidth = pdf.getStringUnitWidth(gstPanText) * pdf.internal.getFontSize() / pdf.internal.scaleFactor;
    pdf.text(gstPanText, (pageWidth - gstPanWidth) / 2, 24);

    const doNumber = allData.doc_no;
    const date = allData.doc_date;

    pdf.setFontSize(12);
    pdf.setLineWidth(0.3);
    pdf.setFontSize(10);
    pdf.setDrawColor(100, 100, 100);
    pdf.line(10, 38, 200, 38);
    pdf.setFontSize(9);
    pdf.setTextColor(41, 122, 14);
    pdf.setFont("Signika-Bold");
    pdf.text("DELIVERY ORDER", 90, 42.5);
    pdf.line(10, 38, 200, 38);
    pdf.setLineWidth(0.3);
    pdf.line(10, 45, 200, 45);

    let y = 40;

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

        pdf.setFont(style.font || "Signika-Regular");

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
        ? `${allData.bankcityname} (${allData.bankstate} - ${allData.bankGSTStateCode})`
        : `${allData.shiptocityname} (${allData.shiptostatename} - ${allData.VoucherbyGstStateCode})`
      }`,
      `Reverse Charge: No`
    ];

    const addressStartY = y;
    const endYBill = addressBlock(
      12,
      addressStartY,
      "To, ",
      toManagingDirectorData,
      (index) =>
        index === 1
          ? { color: "green", font: "Signika-Medium" }
          : { color: "black", font: "Signika-Regular" }
    );

    const endYShip = addressBlock(110, addressStartY, "", transportDetail, (index) =>
      index === 0
        ? { color: "green", font: "Signika-Medium" }
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
    pdf.text("Quantity", 130, y + 7);
    pdf.text("Mill Rate", 157, y + 7);
    pdf.text("Value", 185, y + 7);

    y += 5;

    pdf.setLineWidth(0.3);
    pdf.setDrawColor(80, 80, 80);
    pdf.line(10, y + 5, 200, y + 5);

    pdf.setFont("Signika-Medium");
    pdf.setTextColor(0, 0, 0);

    const itemTitle = allData.itemname ?? "Sugar";
    pdf.text(itemTitle, 12, y + 9);

    pdf.setFont("Signika-Regular");
    pdf.text(String(allData.HSN ?? ""), 60, y + 9);
    pdf.text(String(allData.grade ?? ""), 83.50, y + 9);
    pdf.text(String(allData.season ?? ""), 110, y + 9);

    const value = parseFloat((allData.mill_rate || 0) * (allData.quantal || 0));
    const quantal = parseFloat(`${allData.quantal} ` || 0);

    const formattedQty = quantal.toLocaleString("en-IN", { minimumFractionDigits: 2 });
    const formattedRate = formatReadableAmount(allData.mill_rate || "");
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

    const summaryFields = [
      [`${allData.bags} Bags (${allData.packing} Kg)`, "", ""],
      [`Added GST (${gstPercent})`, formatReadableAmount(allData.excise_rate), formatReadableAmount((allData.quantal || 0) * (allData.excise_rate || 0))],
      [
        "Total Rate",
        total,
        formatReadableAmount((total || 0) * (allData.quantal || 0))
      ],

      ...(TCSApplicable === "N" && allData.PurchaseTDSRate > 0
        ? [[
          `TDS Rate (${allData.PurchaseTDSRate}%)`,
          "",
          formatReadableAmount(
            ((allData.mill_rate || 0) * (allData.quantal || 0) * (allData.PurchaseTDSRate || 0)) / 100
          ),
        ]]
        : TCSApplicable !== "N" && allData.TCS_Rate > 0
          ? [[
            `TCS Rate (${allData.TCS_Rate}%)`,
            "",
            formatReadableAmount(
              ((allData.amount || 0) * (allData.TCS_Rate || 0)) / 100
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

    const totalInWords = ConvertNumberToWord(parseFloat(allData.Mill_AmtWO_TCS));
    const totalInWordsLines = pdf.splitTextToSize(`Rs: ${totalInWords}.`, 125);

    pdf.setFont("Signika-Regular");
    pdf.setTextColor(0, 0, 0);

    let wrapY = y + 18;
    totalInWordsLines.forEach(line => {
      pdf.text(line, 12, wrapY);
      wrapY += 4;
    });

    const formattedTotal = Number(allData.Mill_AmtWO_TCS || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    pdf.setFont("Signika-Bold");
    pdf.setTextColor(41, 122, 14);
    pdf.text("Total Amount:", 150, y + 18);
    pdf.text(`₹ ${formattedTotal}`, amountX, y + 18, { align: "right" });

    const afterTotalBlockY = wrapY - 2;
    pdf.setLineWidth(0.3);
    pdf.setDrawColor(80, 80, 80);
    pdf.line(10, afterTotalBlockY, 200, afterTotalBlockY);

    const buyerLines = [
      allData.bankname ?? "",
      allData.bankaddress ?? "",
      `City: ${allData.bankcityname ?? ""} (${allData.bankstate ?? ""} - ${allData.bankGSTStateCode ?? ""})`,
      `GST: ${allData.bankgstno ?? ""}`,
      `PAN: ${allData.bankpan ?? ""}`,
      `FSSAI: ${allData.bankFSSAI ?? ""}`,
      `TAN: ${allData.banktinno ?? ""}`,
    ];

    // const shipToLines = [
    //   isBillToShipToSame ? allData.Company_Name_E : allData.shiptoname,
    //   isBillToShipToSame ? allData.Address_E : allData.shiptoaddress,
    //   `City: ${isBillToShipToSame
    //     ? `${allData.bankcityname} (${allData.bankstate} - ${allData.bankGSTStateCode})`
    //     : `${allData.shiptocityname} (${allData.shiptostatename} - ${allData.VoucherbyGstStateCode})`
    //   }`,
    //   `GST: ${isBillToShipToSame ? allData.bankgstno : allData.shiptogstno}`,
    //   `PAN: ${isBillToShipToSame ? allData.bankpan : allData.shiptopanno}`,
    //   `FSSAI: ${isBillToShipToSame ? allData.bankFSSAI : allData.shiptofssai}`,
    //   `TAN: ${isBillToShipToSame ? allData.banktinno : allData.shiptotan_no}`,
    // ];


    const shipToLines = [
  isBillToShipToSame ? allData.getpassname : allData.shiptoname,
  isBillToShipToSame ? allData.getpassaddress : allData.shiptoaddress,
  `City: ${isBillToShipToSame
    ? `${allData.getpasscityname} (${allData.getpassstatename} - ${allData.GetpassGstStateCode})`
    : `${allData.shiptocityname} (${allData.shiptostatename} - ${allData.VoucherbyGstStateCode})`
  }`,
  `GST: ${isBillToShipToSame ? allData.getpassgstno : allData.shiptogstno}`,
  `PAN: ${isBillToShipToSame ? allData.getpasspanno : allData.shiptopanno}`,
  `FSSAI: ${isBillToShipToSame ? allData.getpassfssai : allData.shiptofssai}`,
  `TAN: ${isBillToShipToSame ? (allData.getpasstan_no?.trim() || "") : allData.shiptotan_no}`,
];

    const addressStartYBuyerShipper = afterTotalBlockY - 3;

    const endYBillTo = addressBlock(12, addressStartYBuyerShipper, "Buyer (Bill to):", buyerLines, (index) =>
      index === 0
        ? { color: "green", font: "Signika-Medium" }
        : { color: "black", font: "Signika-Regular" })
    const endYShipTo = addressBlock(110, addressStartYBuyerShipper, "Consignee (Ship to):", shipToLines, (index) =>
      index === 0
        ? { color: "green", font: "Signika-Medium" }
        : { color: "black", font: "Signika-Regular" });

    pdf.setDrawColor(80, 80, 80);
    pdf.line(105, addressStartYBuyerShipper + 6, 105, Math.max(endYBillTo, endYShipTo) + 8);

    const afterAddressBlockY = Math.max(endYBillTo, endYShipTo) + 12;
    pdf.line(10, afterAddressBlockY, 200, afterAddressBlockY);
    const tenderYStart = afterAddressBlockY + 6;

    pdf.setFont("Signika-Bold");
    pdf.setTextColor(0, 0, 0);
    let tenderX = 12;
    let lineY = tenderYStart;

    pdf.text("Tender Details:", tenderX, lineY);
    lineY += 5;

    pdf.setFont("Signika-Regular");

    pdf.text(`Tender Date: ${allData.Tender_Date}`, tenderX, lineY);
    lineY += 5;

    pdf.text(`Tender Rate: ₹ ${allData.mill_rate} + ${allData.excise_rate} = ${formatReadableAmount(millRate || 0)}`, tenderX, lineY);
    lineY += 5;

    // pdf.text(`Purchase Rate: ₹ ${allData.PurchaseRate} + ${allData.excise_rate} = ${formatReadableAmount(TotalRate || 0)}`, tenderX, lineY);
    // lineY += 5;

    const tenderPurchaserText = `Tender Purchaser: ${allData.doname ?? ""}`;
    const wrappedPurchaser = pdf.splitTextToSize(tenderPurchaserText, 90);
    wrappedPurchaser.forEach(line => {
      pdf.text(line, tenderX, lineY);
      lineY += 4;
    });
    lineY += 1;

    pdf.text(`Sell Note No.: ${allData.Sell_Note_No}`, tenderX, lineY);
    lineY += 4;

    if (allData.utrnarration) {
      pdf.setFont("Signika-Bold");
      pdf.text("Remarks if any:", tenderX, lineY);
      lineY += 4;

      pdf.setFont("Signika-Regular");
      const wrappedRemarks = pdf.splitTextToSize(String(allData.utrnarration), 150);

      wrappedRemarks.forEach(line => {
        pdf.text(line, tenderX, lineY);
        lineY += 3;
      });
    }

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

    pdf.setDrawColor(80, 80, 80);
    pdf.line(10, Math.max(lineY, paymentY) + 3, 200, Math.max(lineY, paymentY) + 3);

    const baseY = Math.max(lineY, paymentY) + 5;

    pdf.setFont("Signika-Bold");
    pdf.setFontSize(6);
    pdf.setTextColor(0, 0, 0);
    pdf.text("Terms & Conditions:", 12, baseY + 4);

    pdf.setFont("Signika-Regular");
    const notes = [
      ". The miller must ensure all required documents (Invoice, E-Way Bill, Quality Certificate, etc.)",
      "   are accurately prepared and handed over to the transporter at the time of dispatch.",
      ". Only the purchased grade or quality of sugar must be delivered. Quality and quality variation",
      "   will be miller's responsibility at the end destination.",
      ". Sugar should be packed properly in standard quality bags (as per FSSAI norms) with accurate weight",
      "   markings. Any shortage in quantity or damage during loading will be the responsibility of the miller.",
      ". The sugar must be loaded and dispatched in the designated truck(s) or rake(s) on the same day as ",
      "   scheduled. Any delay leading to detention or halting charges of the truck/rake will be the responsibility of the miller.",
      `. Any dispute will be resolved mutually. Unresolved matters shall be subject to ${allData.City_E} jurisdiction only.`,
    ];

    let termsY = baseY + 8;
    notes.forEach((note, i) => {
      pdf.text(note, 12, termsY + i * 3);
    });

    // === Right: Signature and Company ===
    const signY = baseY + 5;
    pdf.setFont("Signika-Medium");
    pdf.setFontSize(9);
    pdf.setTextColor(41, 122, 14);
    const forText = `For. ${String(allData.bankname ?? "")}`;
    const textWidth = pdf.getTextWidth(forText);
    const rightMargin = 197;
    const forTextX = rightMargin - textWidth;

    pdf.text(forText, forTextX, signY);

    const signImg = new Image();
    const footerImg = new Image();
    signImg.src = Sign;
    footerImg.src = FooterJK;

    const signWidth = 60;
    const signHeight = signWidth / 5;

    pdf.addImage(signImg, "PNG", 138, signY + 5, signWidth, signHeight);
    pdf.setTextColor(41, 122, 14);
    pdf.text("Authorised Signatory", 168, signY + 27);

    pdf.setFont("Signika-Medium");
    pdf.setFontSize(7);
    pdf.setTextColor(0, 0, 0);
    pdf.text("Powered by: Sugarian.app", 12, signY + 50)

    const pdfBlob = pdf.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
  setPdfPreview({
           url: pdfUrl,
           data: {
             ...allData,
             CompanyName: displayCompanyName || "", // used for {CompanyName}
             mill_name: allData.millname || "",
             mill_address: allData.milladress || "",
             salerate: formatReadableAmount(Number(allData.mill_rate) + Number(allData.excise_rate) || 0),
             salebillname: displayCompanyName || "", // same as CompanyName or billtoname
             ShipTo: isBillToShipToSame ? displayCompanyName : allData.shiptoname || ""
           }
         });
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
        Party DO
      </PrintReport>
    </div>
  );
};

export default PartyDOReport;