import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import '../GledgerReport.css';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import PdfPreview from "../../../../Common/PDFPreview";
import { Typography } from '@mui/material';
import { ScaleLoader } from 'react-spinners';
import { formatDate } from '../../../../Common/FormatFunctions/FormatDate';
import { formatReadableAmount } from "../../../../Common/FormatFunctions/FormatAmount";
import "../../../../Common/Fonts/Signika-Bold-normal";
import "../../../../Common/Fonts/Signika-Regular-normal";
import "../../../../Common/Fonts/Signika-Medium-normal";
import logo from "../../../../Assets/jklogo.png";
import FooterJK from "../../../../Assets/FooterJK.png";
import HeaderJK from "../../../../Assets/HeaderJK.png";
import FooterJK1 from "../../../../Assets/FooterJK1.png";

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const allMonthsBetween = (from, to) => {
  const result = [];
  const start = new Date(from); start.setDate(1);
  const end   = new Date(to);   end.setDate(1);
  const cur   = new Date(start);
  while (cur <= end) {
    result.push({ yr: cur.getFullYear(), mo: cur.getMonth() + 1 });
    cur.setMonth(cur.getMonth() + 1);
  }
  return result;
};

const LedgerMonthWiseReport = () => {
  const companyCode            = sessionStorage.getItem("Company_Code");
  const Company_Name           = sessionStorage.getItem("Company_Name");
  const CompanyNameUpdatedDate = sessionStorage.getItem("CompanyNameUpdatedDate");
  const newCompanyName         = sessionStorage.getItem("newCompanyName");
  const oldFormerlyName        = sessionStorage.getItem("oldFormerlyName");

  const [rows, setRows]             = useState([]);
  const [openingBal, setOpeningBal] = useState(0);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [pdfPreview, setPdfPreview] = useState(null);
  const [pdfApiData, setPdfApiData] = useState({});

  const location     = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const acCode   = searchParams.get('acCode');
  const acName   = searchParams.get('acName');
  const fromDate = searchParams.get('fromDate');
  const toDate   = searchParams.get('toDate');

  const docDate   = new Date(toDate);
  const cnameDate = new Date(CompanyNameUpdatedDate);
  const displayCompanyName = docDate < cnameDate ? newCompanyName : Company_Name;

  useEffect(() => {
    if (!acCode || !fromDate || !toDate) return;
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${process.env.REACT_APP_API}/ledger-monthwise`, {
          params: { Company_Code: companyCode, Ac_code: acCode, from_date: fromDate, to_date: toDate },
        });

        const { opening_balance, months } = res.data;
        const opBal = opening_balance || 0;
        setOpeningBal(opBal);

        const dataByKey = {};
        (months || []).forEach(m => { dataByKey[`${m.yr}-${m.mo}`] = m; });

        const allMonths = allMonthsBetween(fromDate, toDate);
        let running = opBal;

        const built = allMonths.map(({ yr, mo }) => {
          const m = dataByKey[`${yr}-${mo}`];
          const debit  = m ? (m.total_debit  || 0) : null;
          const credit = m ? (m.total_credit || 0) : null;
          if (m) running += (m.total_debit || 0) - (m.total_credit || 0);
          return {
            month_label: `${MONTH_NAMES[mo]} ${yr}`,
            debit,
            credit,
            balance: running,
            hasData: !!m,
          };
        });

        setRows(built);
      } catch (e) {
        console.error(e);
        setError("Failed to fetch report data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [acCode, fromDate, toDate, companyCode]);

  const periodDebit  = rows.reduce((s, r) => s + (r.debit  || 0), 0);
  const periodCredit = rows.reduce((s, r) => s + (r.credit || 0), 0);
  const opDebit      = openingBal > 0 ? openingBal : 0;
  const opCredit     = openingBal < 0 ? Math.abs(openingBal) : 0;
  const totalDebit   = opDebit  + periodDebit;
  const totalCredit  = opCredit + periodCredit;
  const closingBal   = totalDebit - totalCredit;

  const summaryCards = [
    { label: "Opening",       value: `₹${formatReadableAmount(Math.abs(openingBal))}`, sub: openingBal >= 0 ? "Dr" : "Cr", color: "#185FA5", bg: "#E6F1FB", border: "#378ADD" },
    { label: "Total Debit",   value: `₹${formatReadableAmount(totalDebit.toFixed(2))}`,  sub: "Dr", color: "#A32D2D", bg: "#FCEBEB", border: "#E24B4A" },
    { label: "Total Credit",  value: `₹${formatReadableAmount(totalCredit.toFixed(2))}`, sub: "Cr", color: "#3B6D11", bg: "#EAF3DE", border: "#639922" },
    { label: "Closing",       value: `₹${formatReadableAmount(Math.abs(closingBal).toFixed(2))}`, sub: closingBal >= 0 ? "Dr" : "Cr", color: "#533AB7", bg: "#EEEDFE", border: "#7F77DD" },
  ];

  // ── PDF ──────────────────────────────────────────────────────────────────────
  const buildPdfDoc = async () => {
    const doc        = new jsPDF('portrait');
    const pageWidth  = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let currentY     = 9;

    const shouldUseImage = docDate >= cnameDate;

    // Fetch account address (same as original ledger)
    let headerData = {};
    try {
      const addrRes = await axios.get(`${process.env.REACT_APP_API}/accountmaster-address`, {
        params: { ac_code: acCode, Company_Code: companyCode }
      });
      headerData = addrRes.data?.[0] || {};
    } catch (e) { /* ignore – still render without address */ }

    const formerlyName = fromDate < CompanyNameUpdatedDate ? oldFormerlyName : (headerData.AL1 || "");

    const logoImg    = new Image(); logoImg.src    = logo;
    const headerImg  = new Image(); headerImg.src  = HeaderJK;
    const footerImg1 = new Image(); footerImg1.src = FooterJK1;

    // Draw header (identical to original GledgerReport)
    await new Promise(resolve => {
      logoImg.onload = () => {
        if (shouldUseImage) {
          doc.addImage(headerImg, "PNG", 0, 6, 180, 34);
        } else {
          doc.addImage(logoImg, "PNG", 10, currentY, 30, 30);
          doc.setFont("Signika-Bold"); doc.setFontSize(14);
          doc.text(displayCompanyName || "", 45, currentY + 5);
          doc.setFont("Signika-Regular"); doc.setFontSize(9);
          doc.text(formerlyName,            45, currentY + 9);
          doc.text(headerData.AL2 || "",    45, currentY + 13);
          doc.text(headerData.AL3 || "",    45, currentY + 17);
          doc.text(headerData.AL4 || "",    45, currentY + 21);
          doc.text(headerData.Other || "",  45, currentY + 25);
          if (headerData.BillFooter) doc.text(headerData.BillFooter, 45, currentY + 29);
        }
        resolve();
      };
      logoImg.onerror = resolve;
    });

    // Title section — identical line/text/line pattern as original
    doc.setDrawColor(80, 80, 80);
    doc.line(10, 44, 200, 44);
    currentY = 44;

    doc.setFont("Signika-Bold"); doc.setFontSize(10);
    doc.setTextColor(0, 128, 0);
    doc.text("MONTH WISE LEDGER REPORT", pageWidth / 2, 49, { align: "center" });
    doc.setTextColor(0, 0, 0);
    doc.line(10, 52, 200, 52);
    currentY = 54;

    // Left: account address block
    let leftY = currentY;
    doc.setFont("Signika-Regular"); doc.setFontSize(8);
    doc.text("To,", 12, leftY + 5);
    doc.setFont("Signika-Bold"); doc.setTextColor(0, 128, 0);
    doc.text(`${headerData.Ac_Name_E || acName} (${acCode})`, 12, leftY + 10);
    doc.setFont("Signika-Regular"); doc.setTextColor(0, 0, 0);
    const addressLines = doc.splitTextToSize(headerData.Address_E || "", 100);
    addressLines.forEach((line, i) => doc.text(line, 12, leftY + 15 + i * 5));
    let nextY = leftY + 15 + addressLines.length * 5;
    if (headerData.cityname) {
      doc.text(`City: ${headerData.cityname} (${headerData.State_Name || ""} - ${headerData.GSTStateCode || ""})`, 12, nextY);
      nextY += 5;
    }
    if (headerData.Gst_No) { doc.text(`GST: ${headerData.Gst_No}`, 12, nextY); nextY += 5; }
    if (headerData.Email)   { doc.text(`Email: ${headerData.Email}`, 12, nextY); }

    // Right: summary box (identical layout as original)
    const summaryX = 135; let rightY = currentY;
    doc.setFont("Signika-Regular"); doc.setFontSize(8);
    doc.text(`Ledger from ${formatDate(fromDate)} to ${formatDate(toDate)}`, summaryX, rightY + 5); rightY += 5;
    doc.setFont("Signika-Bold");   doc.text("SUMMARY", summaryX, rightY + 5); rightY += 5;
    doc.setFont("Signika-Regular");
    doc.text("Opening Balance", summaryX, rightY + 5);
    doc.text(`${formatReadableAmount(Math.abs(openingBal))} ${openingBal >= 0 ? "Dr." : "Cr."}`, summaryX + 60, rightY + 5, { align: "right" }); rightY += 5;
    doc.text("Credited Amount", summaryX, rightY + 5);
    doc.text(`${formatReadableAmount(periodCredit.toFixed(2))} Cr.`, summaryX + 60, rightY + 5, { align: "right" }); rightY += 5;
    doc.text("Debited Amount", summaryX, rightY + 5);
    doc.text(`${formatReadableAmount(periodDebit.toFixed(2))} Dr.`, summaryX + 60, rightY + 5, { align: "right" }); rightY += 5;
    doc.text("Closing Balance", summaryX, rightY + 5);
    doc.line(summaryX, rightY + 2, 195, rightY + 2);
    doc.setFont("Signika-Bold");
    doc.text(`${formatReadableAmount(Math.abs(closingBal).toFixed(2))} ${closingBal >= 0 ? "Dr." : "Cr."}`, summaryX + 60, rightY + 5, { align: "right" });
    doc.line(summaryX, rightY + 7, 195, rightY + 7);
    currentY = Math.max(leftY + 40, rightY + 10);

    // Table header
    const drawTableHeader = () => {
      doc.setFont("Signika-Bold"); doc.setFontSize(9);
      doc.line(10, currentY - 4, 200, currentY - 4);
      doc.text("Month",   12,  currentY);
      doc.text("Debit",   120, currentY, { align: "right" });
      doc.text("Credit",  155, currentY, { align: "right" });
      doc.text("Balance", 185, currentY, { align: "right" });
      doc.text("Dr/Cr",   188, currentY);
      doc.line(10, currentY + 2, 200, currentY + 2);
      currentY += 6;
    };

    const drawFooter = (pageNum, totalPages) => {
      const fImgY = pageHeight - 40 - 12;
      if (pageNum === totalPages || totalPages === 1) {
        if (shouldUseImage) {
          doc.addImage(FooterJK,   "PNG", 0, fImgY, 260, 40);
        } else {
          doc.addImage(footerImg1, "PNG", 0, fImgY, 210, 40);
        }
      }
      doc.setFont("Signika-Regular"); doc.setFontSize(8);
      doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: "center" });
    };

    doc.setFont("Signika-Regular");
    drawTableHeader();
    const usableH = pageHeight - 50;

    // Opening balance row
    doc.setFont("Signika-Regular"); doc.setFontSize(9);
    doc.text("Opening Balance", 12, currentY);
    doc.text(formatReadableAmount(Math.abs(openingBal).toFixed(2)), 120, currentY, { align: "right" });
    doc.text(openingBal >= 0 ? "Dr" : "Cr", 188, currentY);
    currentY += 5;

    // Monthly rows
    rows.forEach(r => {
      if (currentY + 6 > usableH) { doc.addPage(); currentY = 14; drawTableHeader(); }
      doc.setFont("Signika-Regular"); doc.setFontSize(9);
      doc.text(r.month_label, 12, currentY);
      if (r.debit  != null) doc.text(formatReadableAmount(r.debit.toFixed(2)),  120, currentY, { align: "right" });
      else doc.text("—", 120, currentY, { align: "right" });
      if (r.credit != null) doc.text(formatReadableAmount(r.credit.toFixed(2)), 155, currentY, { align: "right" });
      else doc.text("—", 155, currentY, { align: "right" });
      doc.text(formatReadableAmount(Math.abs(r.balance).toFixed(2)), 185, currentY, { align: "right" });
      doc.text(r.balance >= 0 ? "Dr" : "Cr", 188, currentY);
      currentY += 5;
    });

    // Totals row
    if (currentY + 8 > usableH) { doc.addPage(); currentY = 14; drawTableHeader(); }
    doc.setFont("Signika-Bold"); doc.setFontSize(9);
    doc.line(10, currentY - 1, 200, currentY - 1);
    doc.text("Total", 12, currentY + 3);
    doc.text(formatReadableAmount(totalDebit.toFixed(2)),           120, currentY + 3, { align: "right" });
    doc.text(formatReadableAmount(totalCredit.toFixed(2)),          155, currentY + 3, { align: "right" });
    doc.text(formatReadableAmount(Math.abs(closingBal).toFixed(2)), 185, currentY + 3, { align: "right" });
    doc.text(closingBal >= 0 ? "Dr" : "Cr", 188, currentY + 3);
    doc.line(10, currentY + 5, 200, currentY + 5);
    doc.setFont("Signika-Regular");
    doc.text("***END OF REPORT***", pageWidth / 2, currentY + 10, { align: "center" });

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) { doc.setPage(i); drawFooter(i, totalPages); }

    setPdfApiData({
      acCode, acname: acName,
      fromDate: formatDate(fromDate), toDate: formatDate(toDate),
      Balance: `₹ ${formatReadableAmount(Math.abs(closingBal).toFixed(2))} ${closingBal >= 0 ? "Dr." : "Cr."}`,
      Company_Name_E: displayCompanyName,
    });

    return doc;
  };

  const handlePrint = async () => {
    const doc = await buildPdfDoc();
    doc.autoPrint();
    window.open(doc.output("bloburl"), "_blank");
  };

  const generatePdf = async () => {
    const doc = await buildPdfDoc();
    setPdfPreview(URL.createObjectURL(doc.output("blob")));
  };

  const handleExportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const headers = [
      [displayCompanyName || ""],
      [`Month Wise Ledger: (${acCode}) ${acName}`],
      [`From: ${formatDate(fromDate)}   To: ${formatDate(toDate)}`],
      [],
      ["Month", "Debit", "Credit", "Balance", "Dr/Cr"],
    ];
    const dataRows = [
      ["Opening Balance",
        openingBal > 0 ? parseFloat(openingBal.toFixed(2)) : "",
        openingBal < 0 ? parseFloat(Math.abs(openingBal).toFixed(2)) : "",
        parseFloat(Math.abs(openingBal).toFixed(2)),
        openingBal >= 0 ? "Dr" : "Cr"],
      ...rows.map(r => [
        r.month_label,
        r.debit  != null ? parseFloat(r.debit.toFixed(2))  : "—",
        r.credit != null ? parseFloat(r.credit.toFixed(2)) : "—",
        parseFloat(Math.abs(r.balance).toFixed(2)),
        r.balance >= 0 ? "Dr" : "Cr",
      ]),
      ["Grand Total",
        parseFloat(totalDebit.toFixed(2)),
        parseFloat(totalCredit.toFixed(2)),
        parseFloat(Math.abs(closingBal).toFixed(2)),
        closingBal >= 0 ? "Dr" : "Cr"],
    ];
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...dataRows]);
    ws["!cols"] = [{ wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 6 }];
    XLSX.utils.book_append_sheet(wb, ws, "Month Wise Ledger");
    XLSX.writeFile(wb, `MonthWiseLedger_${acCode}.xlsx`);
  };

  return (
    <div className="ledger-report-container">

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button className="btn btn-secondary" onClick={handlePrint}>Print Report</button>
        <button className="btn btn-success"   onClick={handleExportToExcel}>Export to Excel</button>
        <button className="btn btn-secondary" onClick={generatePdf}>PDF Preview</button>
        {pdfPreview && (
          <PdfPreview pdfData={pdfPreview} apiData={pdfApiData} label={"monthwise_ledger"} />
        )}
      </div>

      {/* Company heading */}
      <Typography variant="h6" style={{ textAlign: "center", fontSize: 22, fontWeight: 600, marginTop: 10 }}>
        {displayCompanyName}
      </Typography>
      <p style={{ marginTop: 4, marginBottom: 12 }}>
        <strong>
          ({acCode}) {acName}{" "}
          From: {fromDate ? formatDate(fromDate) : "N/A"}{" "}
          To: {toDate ? formatDate(toDate) : "N/A"}
        </strong>
      </p>

      {/* Summary cards */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {summaryCards.map(c => (
          <div key={c.label} style={{
            background: c.bg, borderRadius: 8, padding: "7px 14px",
            minWidth: 130, borderLeft: `3px solid ${c.border}`,
          }}>
            <div style={{ fontSize: 11, color: c.color, fontWeight: 600, marginBottom: 2 }}>{c.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: c.color }}>
              {c.value} <span style={{ fontSize: 11, fontWeight: 500 }}>{c.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Loading / Error */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 120 }}>
          <ScaleLoader color="#1005ad" height={35} width={4} radius={2} margin={2} />
        </div>
      )}
      {error && <p className="error-message">{error}</p>}

      {/* Table */}
      {!loading && !error && rows.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table id="reportTable" style={{ marginBottom: 60, width: "100%" }}>
            <thead style={{ position: "sticky", top: 0, backgroundColor: "#fff", zIndex: 1, whiteSpace: "nowrap" }}>
              <tr>
                <th>#</th>
                <th>Month</th>
                <th style={{ textAlign: "right" }}>Debit</th>
                <th style={{ textAlign: "right" }}>Credit</th>
                <th style={{ textAlign: "right" }}>Balance</th>
                <th>Dr/Cr</th>
              </tr>
            </thead>
            <tbody>
              {/* Opening balance row */}
              <tr style={{ backgroundColor: "#f0f8ff" }}>
                <td style={{ color: "#999", fontSize: 11, textAlign: "center" }}>—</td>
                <td><strong>Opening Balance</strong></td>
                <td style={{ textAlign: "right" }}>
                  {openingBal > 0 ? formatReadableAmount(openingBal.toFixed(2)) : <span style={{ color: "#bbb" }}>—</span>}
                </td>
                <td style={{ textAlign: "right" }}>
                  {openingBal < 0 ? formatReadableAmount(Math.abs(openingBal).toFixed(2)) : <span style={{ color: "#bbb" }}>—</span>}
                </td>
                <td style={{ textAlign: "right" }}>
                  <strong>{formatReadableAmount(Math.abs(openingBal).toFixed(2))}</strong>
                </td>
                <td>{openingBal >= 0 ? "Dr" : "Cr"}</td>
              </tr>

              {rows.map((r, i) => (
                <tr key={i}>
                  <td style={{ color: "#999", fontSize: 11, textAlign: "center" }}>{i + 1}</td>
                  <td>{r.month_label}</td>
                  <td style={{ textAlign: "right" }}>
                    {r.debit  != null ? formatReadableAmount(parseFloat(r.debit).toFixed(2))  : <span style={{ color: "#bbb" }}>—</span>}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {r.credit != null ? formatReadableAmount(parseFloat(r.credit).toFixed(2)) : <span style={{ color: "#bbb" }}>—</span>}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {formatReadableAmount(Math.abs(r.balance).toFixed(2))}
                  </td>
                  <td>{r.balance >= 0 ? "Dr" : "Cr"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: "yellow" }}>
                <td colSpan={2} style={{ textAlign: "right" }}><strong>Grand Total</strong></td>
                <td style={{ textAlign: "right" }}><strong>{formatReadableAmount(totalDebit.toFixed(2))}</strong></td>
                <td style={{ textAlign: "right" }}><strong>{formatReadableAmount(totalCredit.toFixed(2))}</strong></td>
                <td style={{ textAlign: "right" }}><strong>{formatReadableAmount(Math.abs(closingBal).toFixed(2))}</strong></td>
                <td><strong>{closingBal >= 0 ? "Dr" : "Cr"}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <p className="no-data-message">No records found for the selected period.</p>
      )}
    </div>
  );
};

export default LedgerMonthWiseReport;
