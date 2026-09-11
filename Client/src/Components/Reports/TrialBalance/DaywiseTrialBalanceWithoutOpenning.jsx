import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import '../../Reports/Ledger/GledgerReport.css';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import PdfPreview from "../../../Common/PDFPreview";
import { RingLoader } from 'react-spinners';
import { Typography } from '@mui/material';
import { formatReadableAmount } from "../../../Common/FormatFunctions/FormatAmount";

const DaywiseTrialBalanceWithoutOpenningBalance = () => {
  const companyCode = sessionStorage.getItem("Company_Code");
  const Year_Code = sessionStorage.getItem("Year_Code");
  const Company_Name = sessionStorage.getItem("Company_Name");

  const API_URL = process.env.REACT_APP_API;
  const [ledgerData, setLedgerData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pdfPreview, setPdfPreview] = useState([]);

  const location = useLocation();
  const { acCode } = location.state || {};
  const searchParams = new URLSearchParams(location.search);
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGLedgerReport = async () => {
      
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${API_URL}/DaywiseTrialBalanceWithoutOpenning-Report`, {
          params: {
            from_date: fromDate,
            to_date: toDate,
            Company_Code: companyCode,
            Year_Code: Year_Code,
          },
        });

        const rawData = response.data || [];
        const filteredData = rawData.filter(item => {
          const debit = parseFloat(item.debit || 0);
          const credit = parseFloat(item.credit || 0);
          return debit + credit !== 0;
        });

        setLedgerData(filteredData);
      } catch (err) {
        setError("Error fetching report data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGLedgerReport();
  }, [acCode, fromDate, toDate]);

  const handlePrint = () => {
    const printContent = document.getElementById('reportTable').outerHTML;
    const win = window.open('', '', 'height=700,width=900');
    win.document.write('<html><head><title>Print Report</title></head><body>');
    win.document.write(printContent);
    win.document.write('</body></html>');
    win.document.close();
    win.print();
  };

  const handleExportToExcel = () => {
    const wsData = [["ACcode", "Ac Name", "Opening", "Credit", "Debit", "Diff"]];

    ledgerData.forEach(item => {
      const opening = parseFloat(item.opening || 0);
      const credit = parseFloat(item.credit || 0);
      const debit = parseFloat(item.debit || 0);
      const diff = opening - credit + debit;

      wsData.push([
        item.AC_CODE,
        item.Ac_Name_E,
        opening,
        credit,
        debit,
        diff
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "DaywiseTrialBalanceWithoutOpenning");
    XLSX.writeFile(wb, `DaywiseTrialBalanceWithoutOpenning${fromDate}.xlsx`);
  };

  const handleBack = () => {
    navigate('/trial-balance');
  };

  const generatePdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const textWidth = doc.getTextWidth(Company_Name);
    const xPosition = (pageWidth - textWidth) / 2;
    doc.text(Company_Name, xPosition, 10);
    doc.autoTable({ html: '#reportTable', styles: { halign: "right" } });
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    setPdfPreview(url);
  };

  return (
    <div className="ledger-report-container">
      <div className="col-auto">
        <button className="btn btn-secondary me-2" onClick={handlePrint}>Print Report</button>
        <button className="btn btn-success" onClick={handleExportToExcel}>Export to Excel</button>
        <button className="btn btn-secondary" onClick={generatePdf}>PDF</button>
        <button className="btn btn-warning ms-2" onClick={handleBack}>Back</button>
      </div>

      <Typography variant="h6" style={{ textAlign: 'center', fontSize: "24px", fontWeight: "bold", marginTop: "10px" }}>
        {Company_Name}
      </Typography>

      <div>
        <p><strong>Day Wise Trial Balance Without Openning: From Date: {fromDate || "N/A"}</strong></p>
      </div>

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
          <RingLoader />
        </div>
      )}

      {error && <p className="error-message">{error}</p>}

      {ledgerData.length > 0 && (
        <>
         <div style={{ maxHeight: "800px", overflowY: "auto" }}>
          <table id="reportTable" style={{ marginBottom: "60px", width: "100%" }}>
            <thead style={{ position: "sticky", top: 0, backgroundColor: "#fff", zIndex: 1,whiteSpace:"nowrap"}}>
              <tr>
                <th style={{ padding: "8px" }}>A/C Code</th>
                <th style={{ padding: "8px" }}>A/Closing Name</th>
                {/* <th style={{ padding: "8px", textAlign: "right" }}>Opening</th> */}
                <th style={{ padding: "8px", textAlign: "right" }}>Credit</th>
                <th style={{ padding: "8px", textAlign: "right" }}>Debit</th>
                <th style={{ padding: "8px", textAlign: "right" }}>Difference</th>
              </tr>
            </thead>
            <tbody>
              {ledgerData.map((item, index) => {
                const opening = parseFloat(item.opening || 0);
                const credit = parseFloat(item.credit || 0);
                const debit = parseFloat(item.debit || 0);
                const diff = opening - credit + debit;

                return (
                  <tr key={index}>
                    <td style={{ padding: "8px" }}>{item.AC_CODE}</td>
                    <td style={{ padding: "8px" }}>{item.Ac_Name_E}</td>
                    {/* <td style={{ padding: "8px", textAlign: "right" }}>{formatReadableAmount(opening)}</td> */}
                    <td style={{ padding: "8px", textAlign: "right" }}>{formatReadableAmount(credit)}</td>
                    <td style={{ padding: "8px", textAlign: "right" }}>{formatReadableAmount(debit)}</td>
                    <td style={{ padding: "8px", textAlign: "right" }}>{formatReadableAmount(diff)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>

          <div className="centered-container">
            {pdfPreview && pdfPreview.length > 0 && (
              <PdfPreview pdfData={pdfPreview} apiData={ledgerData} label={"DaywiseTrialBalanceWithoutOpenning"} />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DaywiseTrialBalanceWithoutOpenningBalance;
