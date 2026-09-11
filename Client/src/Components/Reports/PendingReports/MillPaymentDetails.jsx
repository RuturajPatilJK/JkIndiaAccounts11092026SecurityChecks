// src/Components/Reports/PendingReports/MillPaymentDetailCR.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import {
  Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from "@mui/material";
import { RingLoader } from "react-spinners";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";
import { FormaDateBalanceSheet } from "../../../Common/FormatFunctions/FormatDate";
import PdfPreview from "../../../Common/PDFPreview";

const apikey = process.env.REACT_APP_API;

const MillPaymentDetailCR = () => {
  const location = useLocation();
  const qs = new URLSearchParams(location.search);
  const fromDate = qs.get("fromDate");
  const toDate   = qs.get("toDate");
  const acCode   = qs.get("acCode") || "0";

  const Company_Code  = sessionStorage.getItem("Company_Code");
  const Company_Name  = sessionStorage.getItem("Company_Name") || "";
  const Company_GSTNO = sessionStorage.getItem("Company_GSTNO") || "";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(null);

  // helpers
  const N = (v) => Number(v ?? 0);
  const pick = (o, names, d = null) => { for (const k of names) if (o?.[k] !== undefined && o?.[k] !== null) return o[k]; return d; };
  const fmtDate = (s) => {
    if (!s) return "";
    if (typeof s === "string" && s.includes("/")) return s;
    const d = new Date(s);
    return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
  };

  // Crystal formulas in JS
  const calcMillAmount = (r) => r.millamount != null
    ? N(r.millamount)
    : N(r.Quantal) * (N(r.Party_Bill_Rate) + N(r.Excise_Rate) + N(r.TCS_Amt) - N(r.TDS_Amt));
  const inclGstRate = (millamount, qty) => (qty ? millamount / qty : 0);
  const frmMillAmt  = (r, rate) => N(r.PartyDispQty) * rate;
  const adjLine     = (r) => N(r.Adjusted_Amt) + N(r.adj_amt);
  const paidLine    = (r) => N(pick(r, ["detailamount", "partypayment", "paidamount"]));

  // fetch
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${apikey}/millpaymentdetail`, {
          params: { Company_Code, Ac_Code: acCode, from_date: fromDate, to_date: toDate },
        });
        setRows(res.data || []);
      } catch (e) {
        console.error("millpaymentdetail", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [Company_Code, acCode, fromDate, toDate]);

  // Group: Payment_To -> Tender_No
  const grouped = useMemo(() => {
    const out = {};
    (rows || []).forEach((r) => {
      const paymentTo = String(pick(r, ["Payment_To"], "0"));
      const partyName = `${r.paymenttoname} (Mill Name: ${r.millshortname})`;
      const tenderNo  = String(pick(r, ["Tender_No", "tenderid"], "NA"));

      out[paymentTo] ??= { partyName, tenders: {}, partyAdjTotal: 0 };
      const party = out[paymentTo];

      party.tenders[tenderNo] ??= {
        rows: [],
        tenderDate: r.Tender_Date,
        qty: N(r.Quantal),
        millRate: N(r.Party_Bill_Rate),
        millAmount: 0,
        inclRate: 0,
        frmMillAmt: 0,
        sumAdj: 0,
        sumPaidLines: 0,
        balance: 0,
        millName: r.millname || r.millshortname || ""
      };
      const t = party.tenders[tenderNo];
      t.rows.push(r);

      // compute/accumulate
      const mm = calcMillAmount(r);
      t.millAmount = mm;                        // (same per tender)
      t.inclRate   = inclGstRate(mm, t.qty);
      t.frmMillAmt = frmMillAmt(r, t.inclRate);

      const a = adjLine(r);                     // @adj
      t.sumAdj += a;                            // Σ @adj BY Tender_No
      party.partyAdjTotal += a;                 // Σ @adj BY Payment_To
      t.sumPaidLines += paidLine(r);            // Σ detailamount BY Tender_No
    });

    // finalize balances
    Object.values(out).forEach((party) => {
      Object.values(party.tenders).forEach((t) => {
        const paidAmt = t.sumAdj + t.sumPaidLines;     // Crystal paidamt
        t.balance = t.millAmount - paidAmt - t.frmMillAmt;
      });
    });
    return out;
  }, [rows]);

  // ===== Actions =====
  const handleExportToExcel = () => {
    const out = [];
    Object.values(grouped).forEach((party) => {
      Object.entries(party.tenders).forEach(([tn, t]) => {
        // Tender summary row
        out.push({
          "Tender No": tn,
          "Tender Date": fmtDate(t.tenderDate),
          "Qty": t.qty,
          "Mill Rate": t.millRate,
          "INCLGSTMR": t.inclRate,
          "Mill Amount": t.millAmount,
          "Mill Name": t.millName
        });
        // Detail rows
        t.rows.forEach((r) => {
          out.push({
            "Tender No": "",
            "Tender Date": "",
            "Qty": "",
            "Mill Rate": "",
            "INCLGSTMR": "",
            "Mill Amount": "",
            "Entry No": pick(r, ["Voucher_No","Entry_No"]) || "",
            "Narration": pick(r, ["narration_header"]) || "",
            "UTRDoc No": pick(r, ["utrdoc_no"]) || "",
            "UTR No": pick(r, ["utr_no"]) || "",
            "UTR Date": fmtDate(pick(r, ["UtrDateConverted","utrdoc_date"])),
            "Lifting Date": fmtDate(pick(r, ["Lifting_DateConverted","Lifting_Date"])),
            "Paid Amount": paidLine(r),
            "Adj": adjLine(r),
            "Balance": ""
          });
        });
        // Tender footer row
        out.push({
          "Tender No": tn,
          "Paid Amount": t.sumAdj + t.sumPaidLines,
          "Adj": "",
          "Balance": t.balance
        });
      });
      // Party footer
      out.push({ "Direct Paid by Party (Σ Adj)": party.partyAdjTotal });
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(out);
    XLSX.utils.book_append_sheet(wb, ws, "MillPaymentDetail");
    XLSX.writeFile(wb, "MillPaymentDetail.xlsx");
  };

  const handlePrint = () => {
    const win = window.open("", "", "height=900,width=1300");
    const tr = (cells, head=false) => {
      return `<tr>${cells.map((c, i) => {
        const right  = [2,3,4,5,12,14].includes(i);
        const center = [0,1,6,8,9,10,11,13].includes(i);
        const align = right ? "right" : center ? "center" : "left";
        const style = head
          ? `background:#b4b4b4;font-weight:bold;text-align:${align};padding:4px;border:1px solid #ccc;`
          : `text-align:${align};padding:4px;border:1px solid #ccc;`;
        return `<td style="${style}">${c ?? ""}</td>`;
      }).join("")}</tr>`;
    };

    let html = `
    <html><head><title>UTR Mill Payment Detail</title>
    <style>
      body{font-family:Arial;font-size:12px;color:#000;}
      h2,h4{text-align:center;margin:4px 0;}
      table{width:100%;border-collapse:collapse;margin-top:8px;}
      th,td{border:1px solid #ccc;padding:4px;font-size:11px;}
      .grp{background:#e0f0ff;font-weight:bold;color:blue;}
      .muted{color:#555;font-style:italic;}
      .bold{font-weight:bold;}
      .red{color:#c00;}
    </style></head><body>
    <h2>${Company_Name}</h2>
    <h4>GSTN: ${Company_GSTNO}</h4>
    <h4>UTR Mill Payment Detail — ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}</h4>
    `;

    Object.values(grouped).forEach((party) => {
      html += `<table><tbody>
        <tr><td class="grp" colspan="15">${party.partyName}</td></tr>
        ${tr(["Tender No","Tender Date","Qty","Mill Rate","INCLGSTMR","Mill Amount","Entry No","Narration","UTRDoc No","UTR No","UTR Date","Lifting Date","Paid Amount","Adj","Balance"], true)}
      `;

      Object.entries(party.tenders).forEach(([tn, t]) => {
        // tender summary like Crystal group header
        html += tr([
          tn, fmtDate(t.tenderDate), formatReadableAmount(t.qty),
          formatReadableAmount(t.millRate), formatReadableAmount(t.inclRate),
          formatReadableAmount(t.millAmount),
          { }.toString(),  // Entry No (blank at summary)
          `<span class="muted">${t.millName || ""}</span>`, "", "", "", "", "", "", ""
        ]);

        // detail lines
        t.rows.forEach((r) => {
          html += tr([
            "", "", "", "", "", "",
            pick(r, ["Voucher_No","Entry_No"]) || "",
            pick(r, ["narration_header"]) || "",
            pick(r, ["utrdoc_no"]) || "",
            pick(r, ["utr_no"]) || "",
            fmtDate(pick(r, ["UtrDateConverted","utrdoc_date"])),
            fmtDate(pick(r, ["Lifting_DateConverted","Lifting_Date"])),
            formatReadableAmount(paidLine(r)),
            formatReadableAmount(adjLine(r)),
            "" // balance only at footer
          ]);
        });

        // tender footer
        html += tr([
          tn,"","","","","","","","","","",
          "<span class='bold'>Σ Paid</span>",
          `<span class='bold'>${formatReadableAmount(t.sumAdj + t.sumPaidLines)}</span>`,
          "",
          `<span class='red bold'>${formatReadableAmount(t.balance)}</span>`
        ]);
      });

      // party footer (Direct Paid by Party = Σ Adj for the party)
      html += tr(["","","","","","","","","","","","<span class='bold'>Direct Paid by Party</span>",
        `<span class='bold'>${formatReadableAmount(party.partyAdjTotal)}</span>`,"",""]);

      html += `</tbody></table><div style="height:10px"></div>`;
    });

    html += `</body></html>`;
    win.document.write(html);
    win.document.close();
    win.print();
  };

  const handlePdfPreview = () => {
    const doc = new jsPDF("l");
    const pageWidth = doc.internal.pageSize.width;
    let y = 10;

    doc.setFontSize(10);
    doc.text(Company_Name, pageWidth/2, y, { align: "center" }); y += 5;
    doc.setFontSize(8);
    doc.text(`GSTN: ${Company_GSTNO}`, pageWidth/2, y, { align: "center" }); y += 4;
    doc.text(`UTR Mill Payment Detail — ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}`, pageWidth/2, y, { align: "center" }); y += 4;

    const head = [[
      "Tender No","Tender Date","Qty","Mill Rate","INCLGSTMR","Mill Amount",
      "Entry No","Narration","UTRDoc No","UTR No","UTR Date","Lifting Date",
      "Paid Amount","Adj","Balance"
    ]];
    const body = [];

    Object.values(grouped).forEach((party) => {
      body.push([{ content: party.partyName, colSpan: 15, styles: { halign: "center", fontStyle: "bold", fillColor: [224,240,255] } }]);

      Object.entries(party.tenders).forEach(([tn, t]) => {
        // tender summary
        body.push([
          tn, fmtDate(t.tenderDate), formatReadableAmount(t.qty),
          formatReadableAmount(t.millRate), formatReadableAmount(t.inclRate),
          formatReadableAmount(t.millAmount),
          "", `Mill: ${t.millName || ""}`, "", "", "", "", "", "", ""
        ]);

        // details
        t.rows.forEach((r) => {
          body.push([
            "", "", "", "", "", "",
            pick(r, ["Voucher_No","Entry_No"]) || "",
            pick(r, ["narration_header"]) || "",
            pick(r, ["utrdoc_no"]) || "",
            pick(r, ["utr_no"]) || "",
            fmtDate(pick(r, ["UtrDateConverted","utrdoc_date"])),
            fmtDate(pick(r, ["Lifting_DateConverted","Lifting_Date"])),
            formatReadableAmount(paidLine(r)),
            formatReadableAmount(adjLine(r)),
            "" // balance at footer
          ]);
        });

        // tender footer
        body.push([
          { content: tn, styles: { halign: "center", fontStyle: "bold" }}, "", "", "", "", "",
          { content: "", colSpan: 6 },
          { content: formatReadableAmount(t.sumAdj + t.sumPaidLines), styles: { halign: "right", fontStyle: "bold" }},
          { content: "", styles: { halign: "right" }},
          { content: formatReadableAmount(t.balance), styles: { halign: "right", fontStyle: "bold", textColor: [200,0,0] }},
        ]);
      });

      // party footer
      body.push([{ content: `Direct Paid by Party: ${formatReadableAmount(party.partyAdjTotal)}`, colSpan: 15, styles: { halign: "right", fontStyle: "bold" } }]);
    });

    doc.autoTable({
      head,
      body,
      startY: y + 2,
      styles: { fontSize: 6, cellPadding: 0.6, lineWidth: 0.1 },
      headStyles: { fillColor: [180,180,180], textColor: [0,0,0], fontStyle: "bold" },
      columnStyles: {
        0:{halign:"center"},1:{halign:"center"},
        2:{halign:"right"},3:{halign:"right"},4:{halign:"right"},5:{halign:"right"},
        6:{halign:"center"},7:{halign:"left"},8:{halign:"center"},9:{halign:"center"},
        10:{halign:"center"},11:{halign:"center"},12:{halign:"right"},13:{halign:"right"},14:{halign:"right"}
      }
    });

    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    setPdfPreview(url);
  };

  return (
    <div style={{ marginTop: "-80px" }}>
      <Typography variant="h6" sx={{ textAlign: "center", fontSize: 24, fontWeight: "bold" }}>{Company_Name}</Typography>
      <Typography variant="h6" sx={{ textAlign: "center", fontSize: 16, textDecoration: "underline", fontWeight: 550 }}>GSTN : {Company_GSTNO}</Typography>
      <Typography variant="h6" sx={{ textAlign: "center", fontSize: 20, fontWeight: "bold" }}>UTR Mill Payment Detail</Typography>
      <Typography variant="h6" sx={{ textAlign: "center", fontSize: 16 }}>
        {FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}
      </Typography>

      <div className="mb-3">
        <button className="btn btn-secondary me-2" onClick={handlePrint}>Print</button>
        <button className="btn btn-success me-2" onClick={handleExportToExcel}>Export to Excel</button>
        {pdfPreview && <PdfPreview pdfData={pdfPreview} apiData={rows?.[0]} label="MillPaymentDetail" />}
        <button className="btn btn-success" onClick={handlePdfPreview}>PDF Preview</button>
      </div>

      <TableContainer component={Paper} sx={{ maxHeight: "80vh", overflow: "auto", mt: 1 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {[
                "Tender No","Tender Date","Qty","Mill Rate","INCLGSTMR","Mill Amount",
                "Entry No","Narration","UTRDoc No","UTR No","UTR Date","Lifting Date","Paid Amount","Adj","Balance"
              ].map((h, i) => (
                <TableCell
                  key={h}
                  sx={{
                    backgroundColor:"#f5f5f5", position:"sticky", top:0, fontWeight:"bold",
                    textAlign:[0,1,6,8,9,10,11,13].includes(i) ? "center"
                             : ([2,3,4,5,12,14].includes(i) ? "right" : "left"),
                    whiteSpace:"nowrap"
                  }}
                >
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {Object.entries(grouped).map(([paymentTo, party]) => (
              <React.Fragment key={paymentTo}>
                {/* Group Header: Party */}
                <TableRow>
                  <TableCell colSpan={15} sx={{ backgroundColor:"#e0f0ff", fontWeight:"bold", color:"blue" }}>
                    {party.partyName}
                  </TableCell>
                </TableRow>

                {Object.entries(party.tenders).map(([tn, t]) => (
                  <React.Fragment key={tn}>
                    {/* Tender summary (like Crystal group header for Tender) */}
                    <TableRow>
                      <TableCell align="center">{tn}</TableCell>
                      <TableCell align="center">{fmtDate(t.tenderDate)}</TableCell>
                      <TableCell align="right">{formatReadableAmount(t.qty)}</TableCell>
                      <TableCell align="right">{formatReadableAmount(t.millRate)}</TableCell>
                      <TableCell align="right">{formatReadableAmount(t.inclRate)}</TableCell>
                      <TableCell align="right">{formatReadableAmount(t.millAmount)}</TableCell>
                      <TableCell />
                      <TableCell colSpan={8} sx={{ color:"#555", fontStyle:"italic" }}>
                        {t.millName ? `Mill: ${t.millName}` : ""}
                      </TableCell>
                    </TableRow>

                    {/* UTR/payment detail rows */}
                    {t.rows.map((r, idx) => (
                      <TableRow key={idx}>
                        <TableCell colSpan={6} />
                        <TableCell align="center">{pick(r, ["Voucher_No","Entry_No"]) || ""}</TableCell>
                        <TableCell>{pick(r, ["narration_header"]) || ""}</TableCell>
                        <TableCell align="center">{pick(r, ["utrdoc_no"]) || ""}</TableCell>
                        <TableCell align="center">{pick(r, ["utr_no"]) || ""}</TableCell>
                        <TableCell align="center">{fmtDate(pick(r, ["UtrDateConverted","utrdoc_date"]))}</TableCell>
                        <TableCell align="center">{fmtDate(pick(r, ["Lifting_DateConverted","Lifting_Date"]))}</TableCell>
                        <TableCell align="right">{formatReadableAmount(paidLine(r))}</TableCell>
                        <TableCell align="right">{formatReadableAmount(adjLine(r))}</TableCell>
                        <TableCell /> {/* balance at footer */}
                      </TableRow>
                    ))}

                    {/* Tender footer (Σ Paid and Balance) */}
                    <TableRow>
                      <TableCell align="center">{tn}</TableCell>
                      <TableCell colSpan={10} />
                      <TableCell align="center" sx={{ fontWeight:"bold" }}>Σ Paid</TableCell>
                      <TableCell align="right" sx={{ fontWeight:"bold" }}>
                        {formatReadableAmount(t.sumAdj + t.sumPaidLines)}
                      </TableCell>
                      <TableCell />
                      <TableCell align="right" sx={{ fontWeight:"bold", color:"red" }}>
                        {formatReadableAmount(t.balance)}
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}

                {/* Party footer */}
                <TableRow>
                  <TableCell colSpan={12}></TableCell>
                  <TableCell align="center" sx={{ fontWeight:"bold" }}>Direct Paid by Party</TableCell>
                  <TableCell align="right" sx={{ fontWeight:"bold" }}>{formatReadableAmount(party.partyAdjTotal)}</TableCell>
                  <TableCell />
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {loading && (
        <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:9999 }}>
          <RingLoader size={80} />
        </div>
      )}

      {pdfPreview && <PdfPreview pdfData={pdfPreview} apiData={rows?.[0]} label="MillPaymentDetail" />}
    </div>
  );
};

export default MillPaymentDetailCR;
