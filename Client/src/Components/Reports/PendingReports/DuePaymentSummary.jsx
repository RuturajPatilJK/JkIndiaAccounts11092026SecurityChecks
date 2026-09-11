import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { useNavigate, useLocation } from "react-router-dom";
import { RingLoader } from "react-spinners";
import PdfPreview from "../../../Common/PDFPreview";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate"
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';

const apikey = process.env.REACT_APP_API;

const DuePaymentSummary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const Company_Name = sessionStorage.getItem("Company_Name");
  const Company_GSTNO = sessionStorage.getItem('Company_GSTNO')
  const searchParams = new URLSearchParams(location.search);
  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDate");

  const [reportData, setReportData] = useState([]);
  const [formattedGroupData, setFormattedGroupData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailId, setEmailId] = useState("");

  const [pdfPreview, setPdfPreview] = useState(null);

  const API_URL = `${apikey}/pendingreport-MillPayment-Summary`;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());
    return `${day}/${month}/${year}`;
  };

  const incgst = (millamount, Quantal) => {
    const incgstamt = parseFloat(millamount / Quantal);
    return incgstamt;
  };

  const adjamt = (adjustedamt, millamount, Quantal, PartyDispQty) => {
    const incamt = incgst(millamount, Quantal);
    const frmgstamt = parseFloat(PartyDispQty * incamt);

    const adjugstamt = parseFloat(adjustedamt + frmgstamt);
    return adjugstamt;
  };

  const pqty = (adjustedamt, millamount, Quantal, PartyDispQty, paidamount) => {
    ;
    const incamt = parseFloat(millamount / Quantal) || 0;
    const frmgstamt = parseFloat(PartyDispQty * incamt) || 0;

    const adjugstamt = parseFloat(adjustedamt + frmgstamt) || 0;

    const paid = parseFloat(paidamount) || 0;
    const paidamt = parseFloat(paid + adjugstamt) || 0;
    const pqtyamt = parseFloat(paidamt / incamt) || 0;

    return pqtyamt.toFixed(2);
  };
  const amt = (adjustedamt, millamount, Quantal, PartyDispQty, paidamount) => {
    ;
    const incamt = parseFloat(millamount / Quantal || 0).toFixed(2);
    const frmgstamt = parseFloat(PartyDispQty * incamt || 0).toFixed(2);

    const adjugstamt = parseFloat(adjustedamt + frmgstamt || 0).toFixed(2);
    const millamt = parseFloat(millamount - paidamount || 0).toFixed(2);
    const amtreturn = parseFloat(millamt - adjugstamt || 0).toFixed(2);

    return amtreturn;
  };

  const bqty = (adjustedamt, millamount, Quantal, PartyDispQty, paidamount) => {
    ;
    const incamt = parseFloat(millamount / Quantal) || 0;
    const frmgstamt = parseFloat(PartyDispQty * incamt) || 0;

    const adjugstamt = parseFloat(adjustedamt + frmgstamt) || 0;
    const paid = parseFloat(paidamount) || 0;
    const paidamt = parseFloat(millamount - paid) || 0;
    const millpaid = parseFloat(paidamt - adjugstamt) || 0;
    const bqty = parseFloat(millpaid / incamt) || 0;
    return bqty.toFixed(2);
  };

  const calculateGroupTotal = (items) =>
    items.reduce((sum, item) => sum + parseFloat(item.millamount || 0), 0);

  const groupDataWithSubgroup = (
    data,
    primaryKeySelector,
    secondaryKeySelector
  ) => {
    const groupedData = {};

    data.forEach((item) => {
      const primaryKey = primaryKeySelector(item);
      const secondaryKey = secondaryKeySelector(item);

      if (!groupedData[primaryKey]) {
        groupedData[primaryKey] = {
          subGroups: {},
          Grandtotal: 0,
        };
      }

      if (!groupedData[primaryKey].subGroups[secondaryKey]) {
        groupedData[primaryKey].subGroups[secondaryKey] = {
          items: [],
          totalQty: 0,
          millamount: 0,
          paidamount: 0,
          PartyDispatchQty: 0,
          frmmilladjamt: 0,
          dispatched: 0,
          DO: 0,
          paidqty: 0,
        };
      }

      groupedData[primaryKey].subGroups[secondaryKey].items.push(item);

      const subGroup = groupedData[primaryKey].subGroups[secondaryKey];
      subGroup.totalQty += parseFloat(item.Quantal || 0);
      subGroup.millamount += parseFloat(item.millamount || 0);
      subGroup.paidamount += parseFloat(item.paidamount || 0);
      subGroup.PartyDispatchQty += parseFloat(item.PartyDispQty || 0);
      subGroup.frmmilladjamt += parseFloat(
        item.PartyDispQty * (item.millamount / item.Quantal) || 0
      );
      subGroup.dispatched += parseFloat(item.despatched || 0);
      subGroup.DO += parseFloat(item.DO || 0);
      const pqtyamt = pqty(
        item.adjusted,
        item.millamount,
        item.Quantal,
        item.PartyDispQty,
        item.paidamount
      );
      subGroup.paidqty += parseFloat(
        pqtyamt - item.despatched + item.PartyDispQty || 0
      );
      groupedData[primaryKey].Grandtotal += parseFloat(
        amt(
          item.adjusted,
          item.millamount,
          item.Quantal,
          item.PartyDispQty,
          item.paidamount
        )
      );
    });

    return groupedData;
  };

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(API_URL, {
          params: {
            from_date: fromDate,
            to_date: toDate,
          },
        });
        setReportData(response.data);
      } catch (error) {
        console.error("Error fetching report:", error);
        setError("Error fetching report");
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [API_URL]);

  const prepareDataForExcel = (groupedData) => {
    const excelData = [];

    Object.entries(groupedData).forEach(([parentKey, parentGroup]) => {
      Object.entries(parentGroup.subGroups).forEach(
        ([subGroupKey, subGroupData]) => {
          // Sub-group header (optional)
          excelData.push({ Group: parentKey, "Sub Group": subGroupKey });

          subGroupData.items.forEach((item) => {
            excelData.push({
              "Tender No": item.Tender_No || "",
              Date: formatDate(item.Tender_Date),
              Qty: formatReadableAmount(item.Quantal),
              "Mill Rate": formatReadableAmount(item.Party_Bill_Rate),
              "Inc Mill GST Rate": formatReadableAmount(
                incgst(item.millamount, item.Quantal)
              ),
              "Mill Amount": formatReadableAmount(subGroupData.millamount),
              Paid: formatReadableAmount(subGroupData.paidamount),
              "Adj Amt": formatReadableAmount(
                adjamt(
                  item.adjusted,
                  item.millamount,
                  item.Quantal,
                  item.PartyDispQty
                )
              ),
              "P Qty": formatReadableAmount(
                pqty(
                  item.adjusted,
                  item.millamount,
                  item.Quantal,
                  item.PartyDispQty,
                  item.paidamount
                )
              ),
              Balance: formatReadableAmount(
                amt(
                  item.adjusted,
                  item.millamount,
                  item.Quantal,
                  item.PartyDispQty,
                  item.paidamount
                )
              ),
              "B Qty": formatReadableAmount(
                bqty(
                  item.adjusted,
                  item.millamount,
                  item.Quantal,
                  item.PartyDispQty,
                  item.paidamount
                )
              ),
              "Payment Date": item.Lifting_DateConverted || "",
            });
          });

          // Sub-group totals row (optional summary)
          excelData.push({
            "Tender No": "Sub Totals",
            Qty: formatReadableAmount(subGroupData.totalQty),
            "Mill Rate": "",
            "Inc Mill GST Rate": formatReadableAmount(
              subGroupData.frmmilladjamt
            ),
            "Mill Amount": formatReadableAmount(subGroupData.millamount),
            Paid: formatReadableAmount(subGroupData.paidamount),
            "P Qty": formatReadableAmount(subGroupData.paidqty),
            Balance: formatReadableAmount(subGroupData.dispatched),
            "B Qty": formatReadableAmount(subGroupData.DO),
          });
        }
      );

      // Parent group grand total
      excelData.push({
        "Tender No": "Grand Total",
        "Mill Amount": formatReadableAmount(parentGroup.Grandtotal),
      });
    });

    return excelData;
  };

  const handleExportToExcel = () => {
    const dataForExcel = prepareDataForExcel(groupedReportDataWithSubgroup);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataForExcel);
    XLSX.utils.book_append_sheet(wb, ws, "Pending Reports");
    XLSX.writeFile(wb, "MillpaymentSummary.xlsx");
  };

  const handlePrint = () => {
    const groupedData = groupedReportDataWithSubgroup;
    const win = window.open("", "", "height=900,width=1200");

    const formatRow = (cells, isHeader = false) => {
      return `<tr>
                ${cells
          .map((cell, index) => {
            let align = "left";
            if ([1].includes(index)) align = "center";
            else if ([2, 4, 5, 6, 7, 8, 9, 10].includes(index))
              align = "right";

            const style = isHeader
              ? `background-color:#b4b4b4;font-weight:bold;text-align:${align};padding:4px;border:1px solid #ccc;`
              : `text-align:${align};padding:4px;border:1px solid #ccc;`;

            return `<td style="${style}">${cell ?? ""}</td>`;
          })
          .join("")}
            </tr>`;
    };

    let content = `
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; font-size: 12px; color: #000; }
                    h2, h4 { text-align: center; margin: 4px 0; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { border: 1px solid #ccc; padding: 4px; font-size: 11px; }
                    .group-header { background-color: #dce6f1; font-weight: bold; color: #000; text-align: center; padding: 6px; }
                    .total-row td { font-weight: bold; background-color: #eaeaea; }
                </style>
            </head>
            <body>
                <h2>${Company_Name}</h2>
                <h4>Due Payment Summary - From ${formatDate(
      fromDate
    )} To ${formatDate(toDate)}</h4>
        `;

    Object.entries(groupedData).forEach(([parentKey, parentGroup]) => {
      content += `<div class="group-header">${parentKey}</div>`;

      Object.entries(parentGroup.subGroups).forEach(([subKey, subGroup]) => {
        content += `<table>
                    <thead>
                        ${formatRow(
          [
            "Tender No",
            "Date",
            "Qty",
            "Mill Rate",
            "Inc Mill GST Rate",
            "Mill Amount",
            "Paid",
            "Adj Amt",
            "P Qty",
            "Balance",
            "B Qty",
            "Payment Date",
          ],
          true
        )}
                    </thead>
                    <tbody>`;

        subGroup.items.forEach((item) => {
          content += formatRow([
            item.Tender_No,
            formatDate(item.Tender_Date),
            formatReadableAmount(item.Quantal),
            formatReadableAmount(item.Party_Bill_Rate),
            formatReadableAmount(incgst(item.millamount, item.Quantal)),
            formatReadableAmount(subGroup.millamount),
            formatReadableAmount(subGroup.paidamount),
            formatReadableAmount(
              adjamt(
                item.adjusted,
                item.millamount,
                item.Quantal,
                item.PartyDispQty
              )
            ),
            formatReadableAmount(
              pqty(
                item.adjusted,
                item.millamount,
                item.Quantal,
                item.PartyDispQty,
                item.paidamount
              )
            ),
            formatReadableAmount(
              amt(
                item.adjusted,
                item.millamount,
                item.Quantal,
                item.PartyDispQty,
                item.paidamount
              )
            ),
            formatReadableAmount(
              bqty(
                item.adjusted,
                item.millamount,
                item.Quantal,
                item.PartyDispQty,
                item.paidamount
              )
            ),
            item.Lifting_DateConverted,
          ]);
        });

        content += `
                    <tr class="total-row">
                        <td colspan="2">Sub Total</td>
                        <td>${formatReadableAmount(subGroup.totalQty)}</td>
                        <td></td>
                        <td>${formatReadableAmount(subGroup.frmmilladjamt)}</td>
                        <td>${formatReadableAmount(subGroup.millamount)}</td>
                        <td>${formatReadableAmount(subGroup.paidamount)}</td>
                        <td colspan="2">${formatReadableAmount(
          subGroup.paidqty
        )}</td>
                        <td>${formatReadableAmount(subGroup.dispatched)}</td>
                        <td>${formatReadableAmount(subGroup.DO)}</td>
                        <td></td>
                    </tr>
                </tbody></table>`;
      });

      content += `
                <div class="group-header" style="color: red;">Grand Total: ${formatReadableAmount(
        parentGroup.Grandtotal
      )}</div>
            `;
    });

    content += `</body></html>`;
    win.document.write(content);
    win.document.close();
    win.print();
  };

  const generatePDF = async () => {
    const doc = new jsPDF("l");
    const topMargin = 10;
    let currentY = topMargin;

    const pageWidth = doc.internal.pageSize.width;
    const companyX = pageWidth / 2;

    doc.setFontSize(10);
    doc.text(`${Company_Name}`, companyX, currentY, null, null, "center");
    currentY += 5;

    doc.setFontSize(8);
    const reportTitle = `Due Payment Summary - From Date: ${formatDate(
      fromDate
    )} To Date: ${formatDate(toDate)}`;
    const titleWidth =
      (doc.getStringUnitWidth(reportTitle) * doc.internal.getFontSize()) /
      doc.internal.scaleFactor;
    doc.text(reportTitle, (pageWidth - titleWidth) / 2, currentY);
    currentY += 4;

    const groupedData = groupedReportDataWithSubgroup;
    const tableBody = [];

    Object.entries(groupedData).forEach(([parentKey, parentGroup]) => {
      tableBody.push([
        {
          content: parentKey,
          colSpan: 12,
          styles: {
            halign: "center",
            fontStyle: "bold",
            textColor: [0, 0, 0],
            fillColor: [220, 230, 241],
            fontSize: 7,
          },
        },
      ]);

      Object.entries(parentGroup.subGroups).forEach(
        ([subGroupKey, subGroupData]) => {
          tableBody.push([
            {
              content: `${subGroupKey}`,
              colSpan: 12,
              styles: {
                halign: "center",
                fontStyle: "bold",
                textColor: [0, 0, 128],
                fillColor: [245, 245, 245],
                fontSize: 6,
              },
            },
          ]);

          subGroupData.items.forEach((item) => {
            tableBody.push([
              item.Tender_No,
              formatDate(item.Tender_Date),
              formatReadableAmount(item.Quantal),
              formatReadableAmount(item.Party_Bill_Rate),
              formatReadableAmount(incgst(item.millamount, item.Quantal)),
              formatReadableAmount(subGroupData.millamount),
              formatReadableAmount(subGroupData.paidamount),
              formatReadableAmount(
                adjamt(
                  item.adjusted,
                  item.millamount,
                  item.Quantal,
                  item.PartyDispQty
                )
              ),
              formatReadableAmount(
                pqty(
                  item.adjusted,
                  item.millamount,
                  item.Quantal,
                  item.PartyDispQty,
                  item.paidamount
                )
              ),
              formatReadableAmount(
                amt(
                  item.adjusted,
                  item.millamount,
                  item.Quantal,
                  item.PartyDispQty,
                  item.paidamount
                )
              ),
              formatReadableAmount(
                bqty(
                  item.adjusted,
                  item.millamount,
                  item.Quantal,
                  item.PartyDispQty,
                  item.paidamount
                )
              ),
              item.Lifting_DateConverted,
            ]);
          });

          tableBody.push([
            {
              content: "Sub Totals",
              colSpan: 2,
              styles: { fontStyle: "bold", halign: "right" },
            },
            formatReadableAmount(subGroupData.totalQty),
            "",
            formatReadableAmount(subGroupData.frmmilladjamt),
            formatReadableAmount(subGroupData.millamount),
            formatReadableAmount(subGroupData.paidamount),
            "",
            formatReadableAmount(subGroupData.paidqty),
            formatReadableAmount(subGroupData.dispatched),
            formatReadableAmount(subGroupData.DO),
            "",
          ]);
        }
      );

      tableBody.push([
        {
          content: `Grand Total: ${formatReadableAmount(
            parentGroup.Grandtotal
          )}`,
          colSpan: 12,
          styles: {
            halign: "center",
            fontStyle: "bold",
            textColor: [255, 0, 0],
            fillColor: [250, 250, 250],
          },
        },
      ]);
    });

    doc.autoTable({
      head: [
        [
          "Tender No",
          "Date",
          "Qty",
          "Mill Rate",
          "Inc Mill GST Rate",
          "Mill Amount",
          "Paid",
          "Adj Amt",
          "P Qty",
          "Balance",
          "B Qty",
          "Payment Date",
        ],
      ],
      body: tableBody,
      startY: currentY + 2,
      styles: {
        fontSize: 6,
        cellPadding: 0.6,
        overflow: "visible",
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { halign: "center" },
        1: { halign: "center" },
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "right" },
        6: { halign: "right" },
        7: { halign: "right" },
        8: { halign: "right" },
        9: { halign: "right" },
        10: { halign: "right" },
        11: { halign: "center" },
      },
      headStyles: {
        fillColor: [180, 180, 180],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        lineWidth: 0.1,
      },
      bodyStyles: {
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
      },
      footStyles: {
        fillColor: [200, 200, 200],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: 6,
      },
    });

    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    setPdfPreview(pdfUrl);
  };

  const groupedReportDataWithSubgroup = useMemo(() => {
    return groupDataWithSubgroup(
      reportData,
      (item) => `${item.paymenttoname}`,
      (item) => item.tenderid
    );
  }, [reportData]);

  return (
    <div style={{marginTop:"-80px"}}>
      <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold" }}>{Company_Name}</Typography>
      <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px", textDecoration: 'underline', fontWeight: "550" }}>GSTN : {Company_GSTNO}</Typography>
      <Typography variant="h6" style={{ textAlign: 'center', fontSize: "20px", fontWeight: "bold" }}>Due Payment Summary</Typography>
      <Typography variant="h6" style={{ textAlign: 'center', fontSize: "16px" }}>{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>

      <div className="mb-3 row align-items-center">
        <div className="col-auto">
          <button className="btn btn-secondary me-2" onClick={handlePrint}>Print</button>
          <button className="btn btn-success me-2" onClick={handleExportToExcel}>Export to Excel</button>
          {pdfPreview && <PdfPreview pdfData={pdfPreview} apiData={reportData[0]} label={"DuePaymentSummary"} />}
          <button className="btn btn-success" onClick={generatePDF}>PDF Preview</button>
        </div>
      </div>

      <TableContainer component={Paper} sx={{ maxHeight: '80vh', overflow: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {[
                "Tender No", "Date", "Quantity", "Mill Rate", "Inc Mill GST Rate",
                "Mill Amount", "Paid", "Adj Amount", "Purchase Quantity", "Balance",
                "Balance Quantity", "Payment Date"
              ].map((header, index) => (
                <TableCell
                  key={index}
                  sx={{
                    backgroundColor: "#f0f0f0",
                    fontWeight: "bold",
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                    whiteSpace: "nowrap",
                    textAlign: index >= 2 ? 'right' : 'left'
                  }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {Object.entries(groupedReportDataWithSubgroup).map(([parentKey, parentData]) => (
              <React.Fragment key={parentKey}>
                <TableRow>
                  <TableCell colSpan={12} sx={{ backgroundColor: '#e6f0ff', fontWeight: 'bold', color: 'blue' }}>
                    {parentKey}
                  </TableCell>
                </TableRow>

                {Object.entries(parentData.subGroups || {}).map(([subGroupKey, subGroupData]) => (
                  <React.Fragment key={subGroupKey}>
                    {subGroupData.items?.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.Tender_No}</TableCell>
                        <TableCell>{formatDate(item.Tender_Date)}</TableCell>
                        <TableCell align="right">{formatReadableAmount(item.Quantal)}</TableCell>
                        <TableCell align="right">{formatReadableAmount(item.Party_Bill_Rate)}</TableCell>
                        <TableCell align="right">{formatReadableAmount(incgst(item.millamount, item.Quantal))}</TableCell>
                        <TableCell align="right">{formatReadableAmount(subGroupData.millamount)}</TableCell>
                        <TableCell align="right">{formatReadableAmount(subGroupData.paidamount)}</TableCell>
                        <TableCell align="right">
                          {formatReadableAmount(adjamt(item.adjusted, item.millamount, item.Quantal, item.PartyDispQty))}
                        </TableCell>
                        <TableCell align="right">
                          {formatReadableAmount(pqty(item.adjusted, item.millamount, item.Quantal, item.PartyDispQty, item.paidamount))}
                        </TableCell>
                        <TableCell align="right">
                          {formatReadableAmount(amt(item.adjusted, item.millamount, item.Quantal, item.PartyDispQty, item.paidamount))}
                        </TableCell>
                        <TableCell align="right">
                          {formatReadableAmount(bqty(item.adjusted, item.millamount, item.Quantal, item.PartyDispQty, item.paidamount))}
                        </TableCell>
                        <TableCell>{item.Lifting_DateConverted}</TableCell>
                      </TableRow>
                    ))}

                    <TableRow>
                      <TableCell colSpan={3} align="right" sx={{ fontWeight: "bold" }}>
                        {formatReadableAmount(subGroupData.totalQty)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        {formatReadableAmount(subGroupData.PartyDispatchQty)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold" }}>
                        {formatReadableAmount(subGroupData.frmmilladjamt)}
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }} align="right">Dispatched</TableCell>
                      <TableCell>{subGroupData.dispatched}</TableCell>
                      <TableCell>DO</TableCell>
                      <TableCell align="right">{subGroupData.DO}</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Paid Quantity</TableCell>
                      <TableCell align="right">{formatReadableAmount(subGroupData.paidqty)}</TableCell>
                      <TableCell />
                    </TableRow>
                  </React.Fragment>
                ))}

                <TableRow>
                  <TableCell colSpan={12} align="right" sx={{ fontWeight: "bold", backgroundColor: "#ffefef", color: "red" }}>
                    Grand Total : {formatReadableAmount(parentData.Grandtotal)}
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {loading && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 9999,
          }}
        >
          <RingLoader size={80} />
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}
    </div>
  );

};

export default DuePaymentSummary;
