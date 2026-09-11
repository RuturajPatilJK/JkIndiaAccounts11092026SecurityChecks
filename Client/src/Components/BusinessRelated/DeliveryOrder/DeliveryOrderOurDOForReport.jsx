import React, { useState } from "react";
import logo from "../../../Assets/jklogo.png";
import Sign from "../../../Assets/jksign.png";
import jsPDF from "jspdf";
import "jspdf-autotable";
import PdfPreview from "../../../Common/PDFPreview";
import axios from "axios";
import { ConvertNumberToWord } from "../../../Common/FormatFunctions/ConvertNumberToWord";
import Swal from 'sweetalert2';
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import PrintReport from "../../../Common/Buttons/PrintReport"

const API_URL = process.env.REACT_APP_API;

const DeliveryOrderOurDOForReport = ({ doc_no, disabledFeild }) => {
  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");
   const TCSApplicable = sessionStorage.getItem("TCSApplicable");

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

      generatePdf(data.all_data, userConfirmed);
    } catch (error) {
      console.error("Error fetching data:", error);
    }finally{
      setLoading(false)
    }
  };

  const generatePdf = (data, isBillToShipToSame) => {
    setIsBillToShipToSame(false);

    const allData = data[0];

    const pdf = new jsPDF({ orientation: "portrait" });

    const logoImg = new Image();
    logoImg.src = logo;
    logoImg.onload = () => {
      pdf.addImage(logoImg, "PNG", 5, 5, 30, 30);

      pdf.setLineHeightFactor(1);

      pdf.setFontSize(14);
      pdf.text(`${allData.Company_Name_E}`, 40, 10);
      pdf.setFontSize(8);
      pdf.text(`${allData.AL1}`, 40, 15);
      pdf.text(`${allData.AL2}`, 40, 20);
      pdf.text(`${allData.AL3}`, 40, 25);
      pdf.text(`${allData.AL4}`, 40, 30);
      pdf.text(`${allData.Other}`, 40, 35);

      const totalAmountWords = ConvertNumberToWord(allData.Mill_AmtWO_TCS);

      const doNumber = allData.doc_no;
      const date = allData.doc_date;

      pdf.setFontSize(12);
      pdf.setLineWidth(0.3);
      pdf.setFontSize(10);
      pdf.text(`DO NO : ${doNumber}`, 10, 43);
      pdf.line(10, 38, 200, 38);
      pdf.setFontSize(10);
      pdf.text("Delivery Order", 90, 43);
      pdf.setFontSize(10);
      pdf.text(`Date : ${date}`, 160, 43);
      pdf.line(10, 38, 200, 38);
      pdf.setFontSize(6);
      pdf.setLineWidth(0.3);
      pdf.line(10, 45, 200, 45);

      const millTenderData = [
        [
          "Mill Name :",
          allData.millname,
          "Tender Date :",
          allData.Tender_Date || "",
        ],
        [
          "Mill Address :",
          allData.milladress,
          "Truck No :",
          allData.truck_no || "",
        ],
      ];

      pdf.autoTable({
        startY: 45,
        margin: { left: 10, right: 10 },
        body: millTenderData.map((row) => [
          {
            content: String(row[0]).trim(),
            styles: {
              fontSize: 7,
              fontStyle: "bold",
              halign: "left",
              cellPadding: 1,
            },
          },
          {
            content: String(row[1]).trim(),
            styles: {
              fontSize: 7,
              halign: "left",
              fontStyle: "normal",
              cellPadding: 1,
            },
          },
          {
            content: String(row[2]).trim(),
            styles: {
              fontSize: 7,
              fontStyle: "bold",
              halign: "left",
              cellPadding: 1,
            },
          },
          {
            content: String(row[3]).trim(),
            styles: {
              fontSize: 7,
              halign: "left",
              fontStyle: "normal",
              cellPadding: 1,
            },
          },
        ]),
        theme: "plain",
        styles: { fontSize: 7, overflow: "linebreak" },
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 72 },
          2: { cellWidth: 28 },
          3: { cellWidth: 72 },
        },
      });

      const afterMillY = pdf.lastAutoTable.finalY;

      pdf.line(10, afterMillY + 3, 200, afterMillY + 3);

      const billToData = [
        ["Buyer,"],
        [""],
        [allData.getpassname],
        [allData.getpassaddress],
      ];

      if (billToData && billToData.length > 0) {
        const wrapWidth = pdf.internal.pageSize.width / 2 - 20;

        pdf.autoTable({
          startY: afterMillY + 5,
          margin: { left: 10, right: pdf.internal.pageSize.width / 2 + 5 },
          body: billToData.map((row, index) =>
            row.length === 2
              ? [
                  {
                    content: pdf.splitTextToSize(
                      String(row[0]).trim(),
                      wrapWidth
                    ),
                    styles: {
                      fontSize: 7,
                      halign: "left",
                      cellPadding: { top: 1, bottom: 2, left: 1, right: 2 },
                    },
                  },
                  {
                    content: pdf.splitTextToSize(
                      String(row[1]).trim(),
                      wrapWidth
                    ),
                    styles: {
                      fontSize: 7,
                      halign: "left",
                      cellPadding: { top: 1, bottom: 2, left: 1, right: 1 },
                    },
                  },
                ]
              : [
                  {
                    content: pdf.splitTextToSize(
                      String(row[0]).trim(),
                      wrapWidth
                    ),
                    colSpan: 2,
                    styles: {
                      fontSize: 7,
                      fontStyle: index === 2 ? "bold" : "normal",
                      halign: "left",
                      cellPadding: {
                        left: 1,
                        right: 1,
                        bottom: index === 2 ? 3 : 1,
                      },
                    },
                  },
                ]
          ),
          theme: "plain",
          styles: { overflow: "linebreak", fontSize: 7 },
          columnStyles: { 0: { cellWidth: "auto" }, 1: { cellWidth: "auto" } },
        });
      }

      const tableData = [
        ["City :", allData.getpasscityname],
        ["Pin Code:", allData.getpasspin],
        ["State :", allData.getpassstatename],
        ["State Code :", allData.GetpassGstStateCode],
        ["GST NO. :", allData.getpassgstno],
        ["PAN NO. :", allData.getpasspanno],
        ["FSSAI No. :", allData.getpassfssai],
        ["TAN No. :", allData.getpasstan_no],
      ];

      const afterBillToY = pdf.lastAutoTable.finalY;
      const midX = pdf.internal.pageSize.width / 2;

      const shipToData = [
        ["Shipped To,"],
        [""],
        [isBillToShipToSame ? allData.getpassname : allData.shiptoname],
        [isBillToShipToSame ? allData.getpassaddress : allData.shiptoaddress],
      ];

      if (shipToData && shipToData.length > 0) {
        const wrapWidth = pdf.internal.pageSize.width / 2 - 20;

        pdf.autoTable({
          startY: afterMillY + 5,
          margin: { left: midX + 3, right: 10 },
          body: shipToData.map((row, index) =>
            row.length === 2
              ? [
                  {
                    content: pdf.splitTextToSize(
                      String(row[0]).trim(),
                      wrapWidth
                    ),
                    styles: {
                      fontSize: 7,
                      halign: "left",
                      cellPadding: { top: 1, bottom: 1, left: 1, right: 2 },
                    },
                  },
                  {
                    content: pdf.splitTextToSize(
                      String(row[1]).trim(),
                      wrapWidth
                    ),
                    styles: {
                      fontSize: 7,
                      halign: "left",
                      cellPadding: { top: 1, bottom: 1, left: 1, right: 1 },
                    },
                  },
                ]
              : [
                  {
                    content: pdf.splitTextToSize(
                      String(row[0]).trim(),
                      wrapWidth
                    ),
                    colSpan: 2,
                    styles: {
                      fontSize: 7,
                      fontStyle: index === 2 ? "bold" : "normal",
                      halign: "left",
                      cellPadding: {
                        left: 1,
                        right: 1,
                        bottom: index === 2 ? 3 : 1,
                      },
                    },
                  },
                ]
          ),
          theme: "plain",
          styles: { overflow: "linebreak", fontSize: 7 },
          columnStyles: { 0: { cellWidth: "auto" }, 1: { cellWidth: "auto" } },
        });
      }
      const buyerData = [
        [
          "City :",
          isBillToShipToSame ? allData.getpasscityname : allData.shiptocityname,
        ],
        [
          "Pin Code:",
          isBillToShipToSame ? allData.getpasspin : allData.Pincode,
        ],
        [
          "State :",
          isBillToShipToSame
            ? allData.getpassstatename
            : allData.shiptostatename,
        ],
        [
          "State Code :",
          isBillToShipToSame
            ? allData.GetpassGstStateCode
            : allData.VoucherbyGstStateCode,
        ],
        [
          "GST NO. :",
          isBillToShipToSame ? allData.getpassgstno : allData.shiptogstno,
        ],
        [
          "PAN NO. :",
          isBillToShipToSame ? allData.getpasspanno : allData.shiptopanno,
        ],
        [
          "FSSAI No. :",
          isBillToShipToSame ? allData.getpassfssai : allData.shiptofssai,
        ],
        [
          "TAN No. :",
          isBillToShipToSame ? allData.getpasstan_no : allData.shiptotan_no,
        ],
      ];

      if (tableData && tableData.length > 0) {
        const wrapWidth = pdf.internal.pageSize.width / 2 - 20; // safe wrapping width for left column

        pdf.autoTable({
          startY: afterBillToY + 3,
          margin: { left: 10, right: pdf.internal.pageSize.width / 2 + 5 },
          body: tableData.map((row) =>
            row.length === 2
              ? [
                  {
                    content: pdf.splitTextToSize(
                      String(row[0]).trim(),
                      wrapWidth
                    ),
                    styles: {
                      fontSize: 7,
                      halign: "left",
                      cellPadding: { top: 1, bottom: 1, left: 1, right: 2 },
                    },
                  },
                  {
                    content: pdf.splitTextToSize(
                      String(row[1]).trim(),
                      wrapWidth
                    ),
                    styles: {
                      fontSize: 7,
                      fontStyle: "bold",
                      halign: "left",
                      cellPadding: { top: 1, bottom: 1, left: 1, right: 1 },
                    },
                  },
                ]
              : [
                  {
                    content: pdf.splitTextToSize(
                      String(row[0]).trim(),
                      wrapWidth
                    ),
                    colSpan: 2,
                    styles: {
                      fontSize: 7,
                      fontStyle: "bold",
                      halign: "left",
                      cellPadding: { left: 1, right: 1 },
                    },
                  },
                ]
          ),
          theme: "plain",
          styles: { overflow: "linebreak", fontSize: 7 },
          columnStyles: { 0: { cellWidth: "auto" }, 1: { cellWidth: "auto" } },
        });
      }
      if (buyerData && buyerData.length > 0) {
        const wrapWidth = pdf.internal.pageSize.width / 2 - 20; // Approx width for safe wrapping on the right column

        pdf.autoTable({
          startY: afterBillToY + 3,
          margin: { left: midX + 3, right: 8 },
          body: buyerData.map((row) =>
            row.length === 2
              ? [
                  {
                    content: pdf.splitTextToSize(
                      String(row[0]).trim(),
                      wrapWidth
                    ),
                    styles: {
                      fontSize: 7,
                      halign: "left",
                      cellPadding: { top: 1, bottom: 1, left: 1, right: 2 },
                    },
                  },
                  {
                    content: pdf.splitTextToSize(
                      String(row[1]).trim(),
                      wrapWidth
                    ),
                    styles: {
                      fontSize: 7,
                      fontStyle: "bold",
                      halign: "left",
                      cellPadding: { top: 1, bottom: 1, left: 1, right: 1 },
                    },
                  },
                ]
              : [
                  {
                    content: pdf.splitTextToSize(
                      String(row[0]).trim(),
                      wrapWidth
                    ),
                    colSpan: 2,
                    styles: {
                      fontSize: 7,
                      fontStyle: "bold",
                      halign: "left",
                      cellPadding: { left: 1, right: 1 },
                    },
                  },
                ]
          ),
          theme: "plain",
          styles: { overflow: "linebreak", fontSize: 7 },
          columnStyles: { 0: { cellWidth: "auto" }, 1: { cellWidth: "auto" } },
        });
      }

      pdf.setFontSize(10);
      pdf.setLineWidth(0.3);

      let millRate = Number(allData.mill_rate) + Number(allData.excise_rate);

      const pageWidth = pdf.internal.pageSize.width;
      const usableWidth = pageWidth - 20;
      const halfWidth = usableWidth / 2;

      const leftColumnStyles = {
        0: { cellWidth: 23 },
        1: { cellWidth: 32 },
        2: { cellWidth: 23 },
        3: { cellWidth: 32 },
      };

      const eInvoiceData = [
        ["Grade :", allData.grade, "Season :", allData.season],
        [
          "Purchase Rate :",
          formatReadableAmount(allData.mill_rate),
          "Add GST :",
          allData.excise_rate,
        ],
        [
          "Mill Rate :",
          formatReadableAmount(millRate),
          "QUINTAL :",
          allData.quantal,
        ],
        ["Bags :", allData.bags, "HSN :", allData.HSN],
      ];

      let afterEInvoiceY = 0;

      pdf.autoTable({
        startY: 119,
        margin: { left: 10, right: halfWidth + 10 },
        body: eInvoiceData.map((row) => [
          {
            content: row[0],
            styles: { fontSize: 8, halign: "left" },
          },
          {
            content: row[1],
            styles: { fontSize: 8, halign: "left", fontStyle: "bold" },
          },
          {
            content: row[2],
            styles: { fontSize: 8, halign: "left" },
          },
          {
            content: row[3],
            styles: { fontSize: 8, halign: "left", fontStyle: "bold" },
          },
        ]),
        columnStyles: leftColumnStyles,
        theme: "plain",
        styles: { overflow: "linebreak", fontSize: 8 },
        didDrawPage: (data) => {
          afterEInvoiceY = data.cursor.y;
        },
      });

      const summaryDataPairs = [
        [
          "Basic Amount :",
          formatReadableAmount(allData.mill_rate * allData.quantal),
          "Total Amount :",
          formatReadableAmount(allData.amount),
        ],
        [
          "Less Amount :",
          "",
          "Final Amount :",
          formatReadableAmount(allData.amount),
        ],
       ...(TCSApplicable !== 'N'
    ? [[
        "TCS Rate :",
        allData.TCS_Rate,
        "TCS Amount :",
        formatReadableAmount((allData.amount * allData.TCS_Rate) / 100),
      ]]
    : []),
        [
          "TDS Rate :",
          allData.PurchaseTDSRate,
          "TDS Amount :",
          formatReadableAmount(
            (allData.mill_rate * allData.quantal * allData.PurchaseTDSRate) /
              100
          ),
        ],
        ["", "", "Net Amount :", formatReadableAmount(allData.Mill_AmtWO_TCS)],
      ];

      let afterSummaryY = 0;

      pdf.autoTable({
        startY: 119,
        margin: { left: halfWidth + 12, right: 8 },
        body: summaryDataPairs.map((row) => [
          {
            content: String(row[0]),
            styles: { fontSize: 8, halign: "left" },
          },
          {
            content: String(row[1]),
            styles: { fontSize: 8, halign: "right", fontStyle: "bold" },
          },
          {
            content: String(row[2]),
            styles: { fontSize: 8, halign: "left" },
          },
          {
            content: String(row[3]),
            styles: { fontSize: 8, halign: "right", fontStyle: "bold" },
          },
        ]),
        columnStyles: {
          0: { cellWidth: 23 },
          1: { cellWidth: 24 },
          2: { cellWidth: 23 },
          3: { cellWidth: 25 },
        },
        theme: "plain",
        styles: { fontSize: 8, overflow: "linebreak" },
        didDrawPage: (data) => {
          afterSummaryY = data.cursor.y;
        },
      });

      const verticalLineStartY = afterMillY + 3;

      const verticalLineEndY = Math.max(afterEInvoiceY, afterSummaryY) - 1;

      pdf.setDrawColor(0);
      pdf.setLineWidth(0.3);
      pdf.line(midX, verticalLineStartY, midX, verticalLineEndY);

      const nextStartY = Math.max(afterEInvoiceY, afterSummaryY) + 5;

      pdf.setFontSize(10);
      pdf.setLineWidth(0.3);
      pdf.line(10, nextStartY - 6, 200, nextStartY - 6);

      pdf.setFont("Helvetica", "normal");
      pdf.text("Amount In Words :", 10, nextStartY);

      pdf.setFont("Helvetica", "bold");
      pdf.text(`${totalAmountWords}`, 40, nextStartY);

      pdf.setFont("Helvetica", "normal");
      pdf.line(10, nextStartY + 4, 200, nextStartY + 4);

      pdf.setFontSize(8);
      pdf.setFont("Helvetica", "bold");
      pdf.text(`${allData.millname}`, 10, pdf.lastAutoTable.finalY + 15);

      pdf.setLineWidth(0.3);
      pdf.line(10, nextStartY + 13, 200, nextStartY + 13);
      pdf.text(`${allData.Narration}`, 10, pdf.lastAutoTable.finalY + 28);
      pdf.text(
        `Sell Note No : ${allData.Sell_Note_No}`,
        120,
        pdf.lastAutoTable.finalY + 28
      );
      pdf.text(
        `Tender Name : ${allData.doname}`,
        10,
        pdf.lastAutoTable.finalY + 33
      );
      pdf.setFontSize(12);
      pdf.setLineWidth(0.3);
      pdf.line(10, 118, 200, 118);
      pdf.setFontSize(14);
      const particulars = [
        ["UTR Narration", "Date", "UTR Amount"],
        [allData.Narration, allData.UTRDate, allData.UTRAmount],
      ];

      pdf.autoTable({
        startY: pdf.lastAutoTable.finalY + 40,
        head: [particulars[0]],
        body: particulars.slice(1),
        margin: { left: 30, right: 30 },
        styles: {
          cellPadding: 1,
          fontSize: 8,
          valign: "middle",
        },
        headStyles: {
          fillColor: false,
          textColor: "black",
          halign: "center",
        },
        columnStyles: {
          0: { halign: "center" },
          1: { halign: "center" },
          2: { halign: "center" },
        },
        tableWidth: "auto",
        pageBreak: "auto",
        didDrawCell: function (data) {
          pdf.setLineDash([2, 2]);
          pdf.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height);
          pdf.setLineDash([]);
        },
      });

      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);
      pdf.text(
        "Note :Please send hard copies of the original for buyer Invoice to the address of our.",
        10,
        pdf.lastAutoTable.finalY + 10
      );

      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      const signImg = new Image();
      signImg.src = Sign;

      signImg.onload = () => {
        let yPosition = pdf.lastAutoTable.finalY + 25;
        const pageHeight = pdf.internal.pageSize.height;

        if (yPosition + 35 > pageHeight) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.addImage(signImg, "PNG", 160, yPosition, 30, 20);
        pdf.setFontSize(10);
        pdf.text(`For, ${allData.Company_Name_E}`, 138, yPosition + 22);

        const pdfBlob = pdf.output("blob");
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPdfPreview(pdfUrl);
      };
    };
  };


  return (
    <div id="pdf-content">
      {pdfPreview && (
        <PdfPreview
          pdfData={pdfPreview}
          apiData={invoiceData[0]}
          label={"delivery_orders_jk"}
        />
      )}
        <PrintReport onClick={fetchData} disabled={disabledFeild}>
        Our DO For
      </PrintReport>
    </div>
  );
};

export default DeliveryOrderOurDOForReport;
