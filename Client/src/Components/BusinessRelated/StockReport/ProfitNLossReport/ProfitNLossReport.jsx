// Final refactored ProfitNLossReport matching DispatchMillWise UI & PDF/Excel layout
import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { useLocation } from "react-router-dom";
import { Typography, Box, Button } from "@mui/material";
import { FormaDateBalanceSheet } from "../../../../Common/FormatFunctions/FormatDate";
import { formatReadableAmount } from "../../../../Common/FormatFunctions/FormatAmount";
import PdfPreview from "../../../../Common/PDFPreview";
import PrintButton from "../../../../Common/Buttons/PrintPDF";

const API_URL = process.env.REACT_APP_API;

const ProfitNLossReport = () => {
  const Company_Name = sessionStorage.getItem("Company_Name");
  const Company_GSTNO = sessionStorage.getItem("Company_GSTNO");
  const [groupedData, setGroupedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [grandTotalProfit, setGrandTotalProfit] = useState(0);
  const [grandTotalQntl, setGrandTotalQntl] = useState(0);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');
  const millCode = searchParams.get('millCode');
  const lotNo = searchParams.get('lotNo');

  useEffect(() => {
    if (millCode && fromDate && toDate) {
      fetchData();
    }
  }, [millCode, lotNo, fromDate, toDate]);


  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/profit-loss-report`, {
        params: {
          Mill_Code: millCode,
          Lot_No: lotNo,
          Start_Date: fromDate,
          End_Date: toDate
        }
      });
      const grouped = {};
      let gTotal = 0;
      let gQntl = 0;
      res.data.forEach((entry) => {
        const tender = entry.Tender_No;
        if (!grouped[tender]) {
          grouped[tender] = {
            tender,
            tenderDetails: entry,
            entries: [],
            totalAmount: 0,
            totalQntl: 0,
            totalRate: 0
          };
        }
        grouped[tender].entries.push(entry);
        grouped[tender].totalAmount += parseFloat(entry.profit || 0);
        grouped[tender].totalQntl += parseFloat(entry.doquantal || 0);
        grouped[tender].totalRate += parseFloat(entry.TaxableAmount || 0);
        gTotal += parseFloat(entry.profit || 0);
        gQntl += parseFloat(entry.doquantal || 0);
      });
      setGroupedData(Object.values(grouped));
      setGrandTotalProfit(gTotal);
      setGrandTotalQntl(gQntl);
    } catch {
      alert("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const generatePdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(12);
    doc.text(Company_Name, pageWidth / 2, 10, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Tender Profit Loss from ${FormaDateBalanceSheet(fromDate)} To ${FormaDateBalanceSheet(toDate)}`, pageWidth / 2, 16, { align: "center" });

    groupedData.forEach((group) => {
      doc.autoTable({
        head: [["Tender No", "Date", "Mill", "Qntl", "Mill Rate", "Grade", "Mill Name", "Amount"]],
        body: [[
          group.tender,
          group.tenderDetails.Tender_Date,
          group.tenderDetails.Mill_Code,
          formatReadableAmount(group.tenderDetails.Quantal),
          formatReadableAmount(group.tenderDetails.Mill_Rate),
          group.tenderDetails.Grade,
          group.tenderDetails.MillNameshort,
          formatReadableAmount(group.totalAmount.toFixed(2))
        ]],
        columnStyles: { 6: { halign: 'left' }, 7: { halign: 'right' } },
        styles: { fontSize: 9 },
        headStyles: { halign: "center", fillColor: [220, 220, 220] },
        startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : 22
      });

      const detailRows = group.entries.map(e => [
        e.doc_no,
        e.doc_date,
        e.billtoname,
        formatReadableAmount(e.doquantal),
        formatReadableAmount(e.TaxableAmount / e.NETQNTL || 0),
        formatReadableAmount(e.profit)
      ]);

      detailRows.push(["", "", "Total", formatReadableAmount(group.totalQntl), formatReadableAmount(group.totalRate / group.totalQntl || 0), formatReadableAmount(group.totalAmount)]);

      doc.autoTable({
        head: [["Doc No", "Date", "Party", "Qntl", "Rate", "Amount"]],
        body: detailRows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [245, 245, 245] },
        startY: doc.lastAutoTable.finalY + 2
      });
    });

    doc.autoTable({
      body: [["Grand Total", "", "", formatReadableAmount(grandTotalQntl), "", formatReadableAmount(grandTotalProfit.toFixed(2))]],
      styles: { fontSize: 10, fontStyle: "bold" },
      margin: { top: 10 },
      startY: doc.lastAutoTable.finalY + 10
    });

    const blob = doc.output("blob");
    setPdfPreview(URL.createObjectURL(blob));
  };

  const exportToExcel = () => {
    const wsData = [];
    wsData.push([Company_Name]);
    wsData.push([
      `Tender Profit Loss from ${FormaDateBalanceSheet(fromDate)} To ${FormaDateBalanceSheet(toDate)}`
    ]);
    wsData.push([]);

    groupedData.forEach((group) => {
      wsData.push(["Tender No", "Date", "Mill", "Qntl", "Mill Rate", "Grade", "Mill Name", "Amount"]);
      wsData.push([
        group.tender,
        group.tenderDetails.Tender_Date,
        group.tenderDetails.Mill_Code,
        Number(group.tenderDetails.Quantal),
        Number(group.tenderDetails.Mill_Rate),
        group.tenderDetails.Grade,
        group.tenderDetails.MillNameshort,
        Number(group.totalAmount.toFixed(2))
      ]);

      wsData.push(["Doc No", "Date", "Party", "Qntl", "Rate", "Amount"]);
      group.entries.forEach(e => {
        const rate = e.NETQNTL ? Number((e.TaxableAmount / e.NETQNTL).toFixed(2)) : 0;
        const profit = Number((e.profit || 0));
        wsData.push([
          e.doc_no,
          e.doc_date,
          e.billtoname,
          Number(e.doquantal),
          rate,
          profit
        ]);
      });

      const avgRate = group.totalQntl ? Number((group.totalRate / group.totalQntl).toFixed(2)) : 0;
      wsData.push(["", "", "Total", Number(group.totalQntl.toFixed(2)), avgRate, Number(group.totalAmount.toFixed(2))]);
      wsData.push([]);
    });

    const grandTotalRow = ["", "", "Grand Total", Number(grandTotalQntl.toFixed(2)), "", Number(grandTotalProfit.toFixed(2))];
    wsData.push(grandTotalRow);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "ProfitLoss");

    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      ['D', 'E', 'F', 'H'].forEach(col => {
        const cellRef = col + (R + 1);
        const cell = ws[cellRef];
        if (cell && typeof cell.v === 'number') {
          cell.t = 'n';
          cell.z = '0.00';
          cell.s = {
            alignment: { horizontal: "right" }
          };
        }
      });
    }

    XLSX.writeFile(wb, "ProfitLossReport.xlsx", { cellStyles: true });
  };

  const handlePrint = () => {
    const printArea = document.getElementById("reportTable").outerHTML;
    const win = window.open('', '', 'height=700,width=900');
    win.document.write(`
      <html><head><title>Print</title><style>table thead tr {position: sticky; top: 0; background: #eaeaea; z-index: 10;}</style></head><body>
      <h2 style="text-align:center;">${Company_Name}</h2>
      <h4 style="text-align:center;">Tender Profit Loss from ${FormaDateBalanceSheet(fromDate)} to ${FormaDateBalanceSheet(toDate)}</h4>
      ${printArea}
      </body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <Box p={2}>
      <Typography align="center" fontWeight={600} variant="h6">Tenderwise Profit & Loss Report</Typography>
      <Typography align="center" variant="body2">{FormaDateBalanceSheet(fromDate)} to {FormaDateBalanceSheet(toDate)}</Typography>

      <Box display="flex" justifyContent="end" gap={1} my={2}>
        <PrintButton fetchData={handlePrint} />
        <Button variant="contained" color="success" onClick={exportToExcel}>Export to Excel</Button>
        <Button variant="contained" onClick={generatePdf}>Generate PDF</Button>
      </Box>

      <Box id="reportTable" sx={{ maxHeight: '600px', overflow: 'auto' }}>
        {groupedData.map((group, idx) => (
          <Box key={idx} mb={2}>
            <table className="table table-striped table-bordered" style={{ width: '100%', fontSize: '12px', tableLayout: 'fixed' }}>
              <thead className="table-light">
                <tr style={{ background: '#eaeaea', fontWeight: 'bold' }}>
                  <th>Tender No</th><th>Date</th><th>Mill</th><th>Qntl</th><th>Mill Rate</th><th>Grade</th><th>Mill Name</th><th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{group.tender}</td>
                  <td>{group.tenderDetails.Tender_Date}</td>
                  <td>{group.tenderDetails.Mill_Code}</td>
                  <td>{formatReadableAmount(group.tenderDetails.Quantal)}</td>
                  <td>{formatReadableAmount(group.tenderDetails.Mill_Rate)}</td>
                  <td>{group.tenderDetails.Grade}</td>
                  <td style={{ textAlign: 'left' }}>{group.tenderDetails.MillNameshort}</td>
                  <td style={{ textAlign: 'right' }}>{formatReadableAmount(group.totalAmount.toFixed(2))}</td>
                </tr>
              </tbody>
            </table>

            <table className="table table-striped" style={{ width: '100%', fontSize: '12px' }}>
              <thead>
                <tr>
                  <th style={{ position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 10 }}>Doc No</th>
                  <th style={{ position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 10 }}>Date</th>
                  <th style={{ position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 10 }}>Party</th>
                  <th style={{ position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 10 }}>Qntl</th>
                  <th style={{ position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 10 }}>Rate</th>
                  <th style={{ position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 10, textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>

              <tbody>
                {group.entries.map((e, i) => (
                  <tr key={i}>
                    <td>{e.doc_no}</td>
                    <td>{e.doc_date}</td>
                    <td style={{ textAlign: 'left' }}>{e.billtoname}</td>
                    <td>{formatReadableAmount(e.doquantal)}</td>
                    <td>{formatReadableAmount(e.TaxableAmount / e.NETQNTL || 0)}</td>
                    <td style={{ textAlign: 'right' }}>{formatReadableAmount(e.profit)}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold' }}>
                  <td></td><td></td><td>Total</td>
                  <td>{formatReadableAmount(group.totalQntl)}</td>
                  <td>{formatReadableAmount(group.totalRate / group.totalQntl || 0)}</td>
                  <td style={{ textAlign: 'right' }}>{formatReadableAmount(group.totalAmount)}</td>
                </tr>
              </tbody>
            </table>
          </Box>
        ))}

        <Typography align="right" fontWeight={700} mt={2}>Grand Total Qntl: {formatReadableAmount(grandTotalQntl)} | Profit: {formatReadableAmount(grandTotalProfit.toFixed(2))}</Typography>
      </Box>

      {pdfPreview && <PdfPreview pdfData={pdfPreview} apiData={groupedData} label={"TenderWiseProfitNLoss"} />}
    </Box>
  );
};

export default ProfitNLossReport;
